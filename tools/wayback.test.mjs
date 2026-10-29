import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { coreUrls, customUrls, resolveUrls, sitemapUrls } from './wayback-urls.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const workflow = fs.readFileSync(path.join(ROOT, '.github/workflows/wayback.yml'), 'utf8');

test('sitemapUrls reads only page <loc> entries, never image locations', () => {
  const urls = sitemapUrls(sitemap);
  assert.equal(urls.length, 73);
  assert.equal(new Set(urls).size, urls.length, 'URLs are de-duplicated');
  assert.ok(urls.every((u) => u.startsWith('https://horror.zazieproductions.com')));
  assert.ok(urls.every((u) => !/\.(jpe?g|png|avif|webp|gif|svg)$/i.test(u)), 'no media URLs');
});

test('core scope is the homepage plus the single-segment indexable hubs', () => {
  const core = coreUrls(sitemapUrls(sitemap));
  assert.equal(core.length, 11);
  assert.equal(core[0], 'https://horror.zazieproductions.com/');
  for (const hub of ['/work', '/reel', '/store', '/hire-a-composer', '/game-scoring']) {
    assert.ok(core.includes(`https://horror.zazieproductions.com${hub}`), `core includes ${hub}`);
  }
  for (const support of ['/faq', '/legal', '/privacy', '/process', '/terms']) {
    assert.ok(!core.some((u) => u.endsWith(support)), `${support} is public but noindex`);
  }
  assert.ok(!core.some((u) => u.includes('/work/expire')), 'item pages are not in core');
  assert.ok(!core.some((u) => u.includes('/reel/ominous-drone')), 'cue pages are not in core');
});

test('all scope returns every sitemap URL; unknown scopes fail', () => {
  assert.equal(resolveUrls({ xml: sitemap, scope: 'all' }).length, 73);
  assert.equal(resolveUrls({ xml: sitemap }).length, 11, 'core is the default scope');
  assert.throws(() => resolveUrls({ xml: sitemap, scope: 'everything' }), /unknown scope/);
});

test('custom scope normalises paths and rejects off-host URLs', () => {
  assert.deepEqual(
    customUrls(['/reel', 'faq', 'https://horror.zazieproductions.com/reel']),
    ['https://horror.zazieproductions.com/reel', 'https://horror.zazieproductions.com/faq'],
  );
  assert.deepEqual(customUrls(['/reel, /faq']), [
    'https://horror.zazieproductions.com/reel',
    'https://horror.zazieproductions.com/faq',
  ]);
  assert.throws(() => customUrls(['https://example.com/reel']), /only horror\.zazieproductions\.com/);
  assert.throws(() => customUrls([]), /needs at least one/);
});

test('CLI prints one URL per line for the workflow to consume', () => {
  const run = (args, env = {}) =>
    execFileSync(process.execPath, ['tools/wayback-urls.mjs', ...args], {
      cwd: ROOT,
      encoding: 'utf8',
      env: { ...process.env, ...env },
    }).trim().split('\n');
  assert.equal(run([]).length, 11);
  assert.equal(run(['--scope', 'all']).length, 73);
  assert.deepEqual(run(['--scope=custom', '/legal']), ['https://horror.zazieproductions.com/legal']);
  assert.deepEqual(
    run(['--scope', 'custom'], { WAYBACK_CUSTOM_URLS: '/reel, /faq' }),
    ['https://horror.zazieproductions.com/reel', 'https://horror.zazieproductions.com/faq'],
  );
});

test('workflow archives with the pinned Marketplace action after deploy', () => {
  assert.match(workflow, /uses: JamieMagee\/wayback@v2\.2\.0/, 'Wayback Machine action, pinned');
  assert.match(workflow, /workflows: \["Deploy to Cloudflare Pages"\]/, 'runs after a deploy');
  assert.match(workflow, /github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(workflow, /cron: '17 6 \* \* 1'/, 'weekly full-site capture');
  assert.match(workflow, /saveErrors: false/, 'never archives a 404/5xx response as a page');
  assert.match(workflow, /saveOutlinks: false/, 'external embeds/listings are not crawled');
  assert.match(workflow, /node tools\/wayback-urls\.mjs/, 'URLs come from sitemap.xml, not a hand list');
  assert.match(workflow, /permissions:\n  contents: read/, 'least-privilege token');
});
