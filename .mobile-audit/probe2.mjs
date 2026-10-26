import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://127.0.0.1:8080';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
const page = await ctx.newPage();
await page.goto(BASE + '/hire-a-composer', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const info = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('img, iframe, svg image, object, embed')) {
    const r = el.getBoundingClientRect();
    out.push({ tag: el.tagName, src: (el.getAttribute('src') || '').slice(0, 150), w: Math.round(r.width), h: Math.round(r.height), parent: el.parentElement?.className?.toString().slice(0, 60) });
  }
  return { imgs: out, bodyChildren: [...document.body.children].map((c) => c.tagName + '.' + (c.className || '').toString().slice(0, 40)) };
});
console.log(JSON.stringify(info, null, 1).slice(0, 3000));
await browser.close();
