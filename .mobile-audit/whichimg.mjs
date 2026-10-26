import fs from 'node:fs';
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://127.0.0.1:8080';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto(BASE + '/hire-a-composer', { waitUntil: 'load' });
await page.waitForTimeout(1500);
const out = await page.evaluate(() => {
  // what is on screen at the position where the wide image appears?
  const el = document.elementFromPoint(195, 720);
  const figs = [...document.querySelectorAll('img')].map((i) => ({
    src: i.currentSrc || i.src, natural: [i.naturalWidth, i.naturalHeight],
    box: (({width, height}) => [Math.round(width), Math.round(height)])(i.getBoundingClientRect()),
    parentHTML: i.parentElement.outerHTML.slice(0, 300),
  }));
  return { at720: el ? el.tagName + '.' + (el.className||'').toString().slice(0,40) : null, figs };
});
fs.writeFileSync('.mobile-audit/out3/whichimg.json', JSON.stringify(out, null, 1));
console.log('ok');
await browser.close();
