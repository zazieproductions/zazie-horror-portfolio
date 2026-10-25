#!/usr/bin/env node
/**
 * GEO (Generative Engine Optimization) regression tests across all routes,
 * structured data graphs, AI crawler directives, and machine-readable indexes.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { hubs } from '../build/data/hubs.js';
import { allRoutes } from '../build/data/routes.js';
import { MINIMUM_FEE, PACKAGES, priceLabel } from '../build/data/pricing.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fileForRoute(routePath) {
  if (routePath === '/') return path.join(ROOT, 'index.html');
  const dirIndex = path.join(ROOT, routePath.slice(1), 'index.html');
  if (fs.existsSync(dirIndex)) return dirIndex;
  return path.join(ROOT, `${routePath.slice(1)}.html`);
}

function parseJsonLd(html, label) {
  const nodes = [];
  for (const m of html.matchAll(/<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    assert.doesNotMatch(m[1], /<!--v:|<!--\/v:|\{\{zp:/, `${label}: JSON-LD must not contain raw pricing comment markers`);
    const parsed = JSON.parse(m[1]);
    if (Array.isArray(parsed)) nodes.push(...parsed);
    else if (Array.isArray(parsed['@graph'])) nodes.push(...parsed['@graph']);
    else nodes.push(parsed);
  }
  return nodes;
}

test('every indexable route places <h1> inside <main> and separates numeral spans cleanly', () => {
  assert.ok(allRoutes.length >= 83, `expected at least 83 indexable routes, found ${allRoutes.length}`);
  for (const route of allRoutes) {
    const html = fs.readFileSync(fileForRoute(route.path), 'utf8');
    const mainMatch = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html);
    assert.ok(mainMatch, `${route.path}: has a <main> landmark`);
    assert.match(mainMatch[1], /<h1\b[^>]*>[\s\S]*?<\/h1>/i, `${route.path}: <h1> is inside <main>`);
    assert.doesNotMatch(html, /<span class="no">[^<]+<\/span>\S/, `${route.path}: no concatenated <span class="no"> heading token`);
    assert.doesNotMatch(html, /<span class="idx">[^<]+<\/span>\S/, `${route.path}: no concatenated <span class="idx"> index token`);
    assert.doesNotMatch(html, /<span class="qno">[^<]+<\/span><span class="qtext">/, `${route.path}: no concatenated <span class="qno"> FAQ token`);
    assert.doesNotMatch(html, /1575933731/, `${route.path}: zero dead 1575933731 Apple Music links`);
  }
});

test('/hire-a-composer commercial pillar has exact head intent, comparison matrix, Service + Offer + FAQPage schema', () => {
  const html = fs.readFileSync(path.join(ROOT, 'hire-a-composer/index.html'), 'utf8');
  assert.match(html, /<title>Hire a Horror Composer — Original Film, TV &amp; Game Scores \| Zazie Productions<\/title>/);
  const main = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1] ?? '';
  assert.match(main, /<h1>Hire a <em>Horror Composer<\/em> for Film, TV, and Games<\/h1>/);
  assert.match(main, /Zazie Kanwar-Torge/);
  assert.match(main, /Zazie Productions LLC/);
  assert.match(main, /Comparing Horror Music Options by Subgenre, Workflow &amp; Budget/);
  assert.match(main, new RegExp(priceLabel(PACKAGES[0]).replace('$', '\\$')));

  const nodes = parseJsonLd(html, '/hire-a-composer');
  const types = new Set(nodes.flatMap((n) => (Array.isArray(n['@type']) ? n['@type'] : [n['@type']])));
  for (const expected of ['WebPage', 'BreadcrumbList', 'Service', 'Offer', 'Organization', 'Person', 'FAQPage']) {
    assert.ok(types.has(expected), `/hire-a-composer missing ${expected} JSON-LD`);
  }
  const faq = nodes.find((n) => n['@type'] === 'FAQPage');
  assert.ok(faq.mainEntity.length >= 8, 'at least 8 structured buyer Q&As on /hire-a-composer');
});

test('/how-to-hire-a-horror-composer guide answers fan-out queries with Article + FAQPage schema', () => {
  assert.ok(hubs.some((h) => h.path === '/how-to-hire-a-horror-composer'), 'registered in src/data/hubs.ts');
  const html = fs.readFileSync(path.join(ROOT, 'how-to-hire-a-horror-composer/index.html'), 'utf8');
  const twin = fs.readFileSync(path.join(ROOT, 'how-to-hire-a-horror-composer.html'), 'utf8');
  assert.equal(html, twin, 'root twin matches directory index byte for byte');
  const main = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1] ?? '';
  assert.match(main, /who is the best horror composer to hire/i);
  assert.match(main, /How much does a horror composer cost\?/);

  const nodes = parseJsonLd(html, '/how-to-hire-a-horror-composer');
  const types = new Set(nodes.flatMap((n) => (Array.isArray(n['@type']) ? n['@type'] : [n['@type']])));
  for (const expected of ['WebPage', 'Article', 'BreadcrumbList', 'Organization', 'Person', 'FAQPage']) {
    assert.ok(types.has(expected), `/how-to-hire-a-horror-composer missing ${expected} JSON-LD`);
  }
});

test('homepage links directly to /hire-a-composer and /how-to-hire-a-horror-composer in both SSR HTML and client bundle', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(html, /<title>Horror Composer for Hire — Film, TV &amp; Game Scores<\/title>/);
  const title = /<title>([^<]*)<\/title>/.exec(html)[1].replace(/&amp;/g, '&');
  assert.ok(title.length >= 30 && title.length <= 60, `homepage title is ${title.length} characters; keep it between 30 and 60`);
  assert.match(html, new RegExp(`from \\$${MINIMUM_FEE} USD`));
  assert.match(html, /href="\/hire-a-composer"/);
  assert.match(html, /href="\/how-to-hire-a-horror-composer"/);

  const bundleName = fs.readdirSync(ROOT).find((f) => /^index-[0-9a-f]{8}\.js$/.test(f));
  assert.ok(bundleName, 'patched homepage bundle exists');
  const bundle = fs.readFileSync(path.join(ROOT, bundleName), 'utf8');
  assert.match(bundle, /\/hire-a-composer/);
  assert.match(bundle, /\/how-to-hire-a-horror-composer/);
});

test('robots.txt welcomes AI search crawlers and llms.txt + llms-full.txt stay synced with pricing.ts', () => {
  const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
  for (const bot of [
    'Googlebot',
    'Google-Extended',
    'OAI-SearchBot',
    'GPTBot',
    'ChatGPT-User',
    'PerplexityBot',
    'ClaudeBot',
    'Applebot-Extended',
    'Bingbot',
  ]) {
    assert.match(robots, new RegExp(`User-agent:\\s*${bot}`), `robots.txt explicitly declares ${bot}`);
  }
  assert.match(robots, /Sitemap: https:\/\/horror\.zazieproductions\.com\/sitemap\.xml/);

  for (const file of ['llms.txt', 'llms-full.txt']) {
    const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.match(content, /Zazie Kanwar-Torge/);
    assert.match(content, /https:\/\/horror\.zazieproductions\.com\/hire-a-composer/);
    assert.match(content, /https:\/\/horror\.zazieproductions\.com\/how-to-hire-a-horror-composer/);
    assert.match(content, new RegExp(`\\$${MINIMUM_FEE}`));
    assert.doesNotMatch(content, /\bundefined\b|\bNaN\b|\bnull\b/);
  }
});
