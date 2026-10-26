import fs from 'node:fs';
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://127.0.0.1:8080';
const targets = (process.env.TARGETS || '/hire-a-composer,/work/mike-has-a-visitor,/store,/faq,/how-to-hire-a-horror-composer,/privacy,/licensing,/').split(',');
const results = {};
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
for (const t of targets) {
  const page = await ctx.newPage();
  await page.goto(BASE + t, { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});
  await page.waitForTimeout(1200);
  const res = await page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const out = [];
    const all = [...document.querySelectorAll('body *')];
    for (const el of all) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right <= W + 1) continue;
      // skip if any ancestor clips horizontally
      let p = el.parentElement, clipped = false;
      while (p && p !== document.body) {
        const cs = getComputedStyle(p);
        if (/(hidden|auto|scroll|clip)/.test(cs.overflowX)) { clipped = true; break; }
        p = p.parentElement;
      }
      if (clipped) continue;
      const cs = getComputedStyle(el);
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.getAttribute('class')||'').slice(0,90),
        id: el.id,
        right: Math.round(r.right), w: Math.round(r.width), left: Math.round(r.left),
        pos: cs.position, minW: cs.minWidth, ws: cs.whiteSpace,
        text: el.textContent.trim().slice(0,30),
      });
    }
    return { W, scrollW: document.documentElement.scrollWidth, out: out.slice(0, 14) };
  });
  results[t] = res;
  await page.close();
}
await browser.close();
fs.writeFileSync('.mobile-audit/probe.json', JSON.stringify(results, null, 2));
console.log(Object.keys(results).length, 'probed');
