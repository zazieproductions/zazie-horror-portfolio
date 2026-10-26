/**
 * TEMPORARY mobile audit harness (deleted before merge).
 * Captures viewport-sized scroll screenshots + layout metrics at phone widths.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://127.0.0.1:8080';
const OUT = path.resolve(process.env.OUT || '.mobile-audit/out3');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  ['home', '/?noboot=1'],
  ['work', '/work'],
  ['store', '/store'],
  ['hire', '/hire-a-composer'],
  ['faq', '/faq'],
  ['contact', '/contact'],
  ['reel', '/reel'],
  ['item', '/work/mike-has-a-visitor'],
];

const VIEWPORTS = [
  ['390', { width: 390, height: 844 }],
  ['360', { width: 360, height: 800 }],
];

const browser = await chromium.launch();
const metrics = {};

for (const [vpName, viewport] of VIEWPORTS) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  for (const [name, url] of PAGES) {
    if (vpName === '360' && !['home', 'store'].includes(name)) continue;
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const step = Math.round(viewport.height * 0.85);
    const shots = [];
    let i = 0;
    for (let y = 0; y < total && i < 26; y += step, i += 1) {
      await page.evaluate((sy) => window.scrollTo(0, sy), y);
      await page.waitForTimeout(750);
      const file = `${name}-${vpName}-${String(i).padStart(2, '0')}.jpg`;
      await page.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 68 });
      shots.push({ file, y });
    }

    const info = await page.evaluate(() => {
      window.scrollTo(0, 0);
      const doc = document.documentElement;
      const describe = (el) => {
        const cls = (el.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 4).join('.');
        return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''}`;
      };
      const overflowing = [...document.querySelectorAll('body *')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (cs.position === 'fixed' || cs.position === 'absolute') return false;
          return r.width > 0 && r.right > window.innerWidth + 2;
        })
        .slice(0, 12)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return `${describe(el)} [w=${Math.round(r.width)} right=${Math.round(r.right)}]`;
        });
      const smallTargets = [...document.querySelectorAll('a, button, summary, input, select')]
        .filter((el) => {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.height < 44 || r.width < 44);
        })
        .slice(0, 30)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return `${describe(el)} ${Math.round(r.width)}x${Math.round(r.height)} "${el.textContent.trim().slice(0, 22)}"`;
        });
      const tinyText = [...document.querySelectorAll('p, span, a, li, small, time, td, th')]
        .filter((el) => {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') return false;
          const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
          return own && parseFloat(cs.fontSize) < 12;
        })
        .slice(0, 20)
        .map((el) => `${describe(el)} ${getComputedStyle(el).fontSize} "${el.textContent.trim().slice(0, 20)}"`);
      const sections = [...document.querySelectorAll('main > section, section')]
        .filter((s) => s.getBoundingClientRect().height > 40)
        .map((s) => ({ id: s.id || '?', h: Math.round(s.getBoundingClientRect().height) }));
      return {
        scrollW: doc.scrollWidth,
        clientW: doc.clientWidth,
        scrollH: doc.scrollHeight,
        screenfuls: +(doc.scrollHeight / window.innerHeight).toFixed(1),
        sections,
        overflowing,
        tinyText,
        smallTargets,
        links: document.querySelectorAll('a').length,
        words: document.body.innerText.trim().split(/\s+/).length,
      };
    });

    metrics[`${name}-${vpName}`] = { ...info, errors, shots: shots.map((s) => s.file) };
    await page.close();
  }
  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'metrics.json'), JSON.stringify(metrics, null, 2));
console.log('captured', Object.keys(metrics).length, 'page/viewport pairs');
