/**
 * TEMPORARY mobile audit harness (deleted before merge).
 * Captures per-section screenshots + layout metrics at phone widths.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://127.0.0.1:8080';
const OUT = path.resolve('.mobile-audit/out');
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
  ['notfound', '/404.html'],
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
    if (vpName === '360' && !['home', 'store', 'work'].includes(name)) continue;
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
    await page.waitForTimeout(1800);
    // Scroll through the page so lazy images decode and React effects settle.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.9;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 300));
    });

    const info = await page.evaluate(() => {
      const doc = document.documentElement;
      const describe = (el) => {
        const cls = (el.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 5).join('.');
        return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''}`;
      };
      const overflowing = [...document.querySelectorAll('body *')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed';
        })
        .slice(0, 15)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return `${describe(el)} [x=${Math.round(r.left)} w=${Math.round(r.width)}]`;
        });
      const tinyText = [...document.querySelectorAll('main p, main span, main a, main li, footer a, footer p')]
        .filter((el) => {
          const cs = getComputedStyle(el);
          return parseFloat(cs.fontSize) < 12 && el.textContent.trim().length > 0 && cs.visibility !== 'hidden';
        }).length;
      const smallTargets = [...document.querySelectorAll('a, button, summary, input, select')]
        .filter((el) => {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.height < 44 || r.width < 44);
        })
        .slice(0, 25)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return `${describe(el)} ${Math.round(r.width)}x${Math.round(r.height)} "${el.textContent.trim().slice(0, 24)}"`;
        });
      const sections = [...document.querySelectorAll('main > section, main > div > section, section')]
        .filter((s) => s.getBoundingClientRect().height > 40)
        .map((s) => ({ id: s.id || describe(s).slice(0, 40), h: Math.round(s.getBoundingClientRect().height) }));
      const links = document.querySelectorAll('a').length;
      const footer = document.querySelector('footer');
      return {
        scrollW: doc.scrollWidth,
        clientW: doc.clientWidth,
        scrollH: doc.scrollHeight,
        viewportH: window.innerHeight,
        sections,
        overflowing,
        tinyText,
        smallTargets,
        links,
        footerH: footer ? Math.round(footer.getBoundingClientRect().height) : 0,
        h1: (document.querySelector('h1') || {}).textContent || '',
      };
    });

    metrics[`${name}-${vpName}`] = { ...info, errors };

    // Element screenshots: each visible section on the page, capped.
    const handles = await page.$$('main > section, main > article, main > div > section, body > section, main > div');
    const seen = new Set();
    let index = 0;
    const shots = [];
    for (const handle of handles) {
      if (index >= 14) break;
      const box = await handle.boundingBox();
      if (!box || box.height < 80 || box.width < 100) continue;
      const key = `${Math.round(box.y)}-${Math.round(box.height)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const file = `${name}-${vpName}-block${String(index).padStart(2, '0')}.png`;
      const clipH = Math.min(box.height, 4000);
      await page.screenshot({
        path: path.join(OUT, file),
        clip: { x: 0, y: Math.max(0, box.y), width: viewport.width, height: clipH },
        captureBeyondViewport: true,
      }).catch(async () => {
        await handle.screenshot({ path: path.join(OUT, file) }).catch(() => {});
      });
      shots.push({ file, y: Math.round(box.y), h: Math.round(box.height) });
      index += 1;
    }
    metrics[`${name}-${vpName}`].shots = shots;
    await page.close();
  }
  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'metrics.json'), JSON.stringify(metrics, null, 2));
console.log('captured', Object.keys(metrics).length, 'page/viewport pairs');
