import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://127.0.0.1:8080';
const OUT = path.resolve('.mobile-audit/out3');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const report = {};

async function run(name, blockBundle) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  if (blockBundle) await page.route('**/index-*.js', (r) => r.abort());
  await page.goto(BASE + '/?noboot=1', { waitUntil: 'load', timeout: 60000 });

  const button = page.locator('.zp-menu-button');
  const before = await page.evaluate(() => ({
    expanded: document.querySelector('.zp-menu-button')?.getAttribute('aria-expanded'),
    panel: !!document.getElementById('mobile-navigation'),
  }));
  await page.screenshot({ path: path.join(OUT, `menu-${name}-closed.jpg`), type: 'jpeg', quality: 70 });
  await button.click();
  await page.waitForTimeout(450);
  const opened = await page.evaluate(() => {
    const panel = document.getElementById('mobile-navigation');
    const btn = document.querySelector('.zp-menu-button');
    const r = panel ? panel.getBoundingClientRect() : null;
    return {
      expanded: btn?.getAttribute('aria-expanded'),
      label: btn?.getAttribute('aria-label'),
      panelVisible: !!panel && !panel.hidden && r.height > 0,
      panelHeight: r ? Math.round(r.height) : 0,
      items: panel ? [...panel.querySelectorAll('a')].map((a) => a.textContent.trim()) : [],
      firstLink: panel ? panel.querySelector('a')?.getAttribute('href') : null,
    };
  });
  await page.screenshot({ path: path.join(OUT, `menu-${name}-open.jpg`), type: 'jpeg', quality: 70 });

  // Tapping a link closes the panel; tapping outside closes it too.
  let closedByLink = null;
  if (opened.items.length) {
    await button.click();
    await page.waitForTimeout(200);
    await button.click();
    await page.waitForTimeout(200);
    await page.evaluate(() => { document.querySelector('#mobile-navigation a')?.click(); });
    await page.waitForTimeout(200);
    closedByLink = await page.evaluate(() => document.getElementById('mobile-navigation')?.hidden);
  }
  report[name] = { blockBundle, before, opened, closedByLink, errors };
  await ctx.close();
}

await run('prerendered-no-bundle', true);
await run('after-bundle', false);
await browser.close();
fs.writeFileSync(path.join(OUT, 'menu.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 1).slice(0, 2200));
