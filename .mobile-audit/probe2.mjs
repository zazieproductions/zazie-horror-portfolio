import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://127.0.0.1:8080';
const targets = (process.env.TARGETS || '/hire-a-composer').split(',');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
const report = {};
for (const t of targets) {
  const page = await ctx.newPage();
  const reqs = [];
  page.on('request', (r) => reqs.push(r.url()));
  await page.goto(BASE + t, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  report[t] = await page.evaluate(() => {
    const media = [];
    for (const el of document.querySelectorAll('img, iframe, object, embed, picture source')) {
      const r = el.getBoundingClientRect();
      media.push({ tag: el.tagName, src: (el.getAttribute('src') || el.getAttribute('srcset') || '').slice(0, 120), w: Math.round(r.width), h: Math.round(r.height), cls: (el.className || '').toString().slice(0, 50) });
    }
    const wide = [...document.querySelectorAll('body *')]
      .filter((el) => { const r = el.getBoundingClientRect(); return r.width > innerWidth + 2 && r.height > 10; })
      .slice(0, 10)
      .map((el) => `${el.tagName.toLowerCase()}.${(el.className||'').toString().split(' ').slice(0,3).join('.')} w=${Math.round(el.getBoundingClientRect().width)}`);
    return { media, wide };
  });
  report[t].externalRequests = [...new Set(reqs.filter((u) => !u.startsWith(BASE) && !u.startsWith('data:')))].slice(0, 20);
  await page.close();
}
await browser.close();
fs.mkdirSync('.mobile-audit/out3', { recursive: true });
fs.writeFileSync(path.join('.mobile-audit/out3', 'media.json'), JSON.stringify(report, null, 1));
console.log('media probe done');
