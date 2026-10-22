/** Automated subset of WCAG 2.2 AA; not a conformance certification.
 * Start npm run serve, then npm run test:a11y.
 * Install Chromium first: npx playwright install --with-deps chromium
 * A11Y_BASE_URL and CHROMIUM_EXECUTABLE_PATH may override the local defaults.
 * Pass route paths to check a custom selection.
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const routes = process.argv.slice(2);
if (!routes.length) routes.push('/', '/contact', '/store', '/reel', '/work',
  '/services', '/hire-a-composer', '/faq', '/accessibility', '/work/expire',
  '/reel/hidden-intentions-serene-purgatory', '/privacy');
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
let failures = 0;
try {
  for (const width of [1280, 375]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    for (const route of routes) {
      const response = await page.goto(new URL(route, process.env.A11Y_BASE_URL || 'http://127.0.0.1:8080').href);
      if (!response.ok()) throw new Error(`${route}: HTTP ${response.status()}`);
      // Let the homepage React island replace its static snapshot before scanning.
      await page.waitForTimeout(1000);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      failures += results.violations.length;
      console.log(`${width}px ${route}: ${results.violations.length} violations`);
      for (const violation of results.violations) {
        console.error(violation.id, violation.nodes.map(node => ({ target: node.target, reason: node.failureSummary })));
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}
process.exitCode = failures ? 1 : 0;
