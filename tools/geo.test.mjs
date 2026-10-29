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
import { BUDGET_RANGES } from '../build/data/commission.js';

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
    assert.doesNotMatch(m[1], /<!--v:|<!--\/v:|\{\{zp:/, `${label}: JSON-LD must not contain raw commissioning comment markers`);
    const parsed = JSON.parse(m[1]);
    if (Array.isArray(parsed)) nodes.push(...parsed);
    else if (Array.isArray(parsed['@graph'])) nodes.push(...parsed['@graph']);
    else nodes.push(parsed);
  }
  return nodes;
}

test('every indexable route places <h1> inside <main> and separates numeral spans cleanly', () => {
  // 81 = 18 hubs + 9 productions + 30 cues + 24 catalogue items; /composer
  // was retired (2026-10-29) and 301s to /#about, so it is no longer a route.
  assert.ok(allRoutes.length >= 81, `expected at least 81 indexable routes, found ${allRoutes.length}`);
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
  assert.match(html, /<title>Hire an Experimental Psychological Horror Composer \| Zazie Productions<\/title>/);
  const main = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1] ?? '';
  assert.match(main, /<h1>Hire an <em>Experimental Psychological Horror Composer<\/em> for Independent &amp; Arthouse Film<\/h1>/);
  assert.match(main, /Zazie Kanwar-Torge/);
  assert.match(main, /Zazie Productions LLC/);
  assert.match(main, /Comparing Horror Music Options by Subgenre, Workflow &amp; Budget/);
  assert.match(main, /quoted per project/i);
  assert.doesNotMatch(main, /From \$\d|starting fee/i);

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
  assert.match(html, /<title>Experimental Psychological Horror Composer \| Arthouse Film<\/title>/);
  const title = /<title>([^<]*)<\/title>/.exec(html)[1].replace(/&amp;/g, '&');
  assert.ok(title.length >= 30 && title.length <= 60, `homepage title is ${title.length} characters; keep it between 30 and 60`);
  assert.match(html, /quoted per project/);
  assert.match(html, /href="\/hire-a-composer"/);
  assert.match(html, /href="\/how-to-hire-a-horror-composer"/);

  const bundleName = fs.readdirSync(ROOT).find((f) => /^index-[0-9a-f]{8}\.js$/.test(f));
  assert.ok(bundleName, 'patched homepage bundle exists');
  const bundle = fs.readFileSync(path.join(ROOT, bundleName), 'utf8');
  assert.match(bundle, /\/hire-a-composer/);
  assert.match(bundle, /\/how-to-hire-a-horror-composer/);
});

test('robots.txt welcomes AI search crawlers and llms.txt + llms-full.txt stay synced with commission.ts', () => {
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
    assert.match(content, /Experimental Art House/i);
    assert.match(content, /experimental psychological horror film composer for independent and arthouse cinema/i);
    assert.match(content, /https:\/\/horror\.zazieproductions\.com\/hire-a-composer/);
    assert.match(content, /https:\/\/horror\.zazieproductions\.com\/how-to-hire-a-horror-composer/);
    assert.match(content, /quoted per project/i);
    assert.ok(content.includes(BUDGET_RANGES[3]), `${file}: carries the client-stated inquiry budget ranges`);
    assert.doesNotMatch(content, /\$650|\$1,500|starting fees|indicative minimum/i);
    assert.doesNotMatch(content, /\bundefined\b|\bNaN\b|\bnull\b/);
  }
});

test('navigation headers stay visually concise while non-visible attributes and head metadata carry specialist signals', () => {
  const specialistTerms = ['Body Horror', 'Folk Horror', 'Experimental Art House'];

  // Homepage visible nav labels stay clean & minimal; non-visible title= attributes + meta carry specialist terms
  const homeHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const homeHead = /<head>([\s\S]*?)<\/head>/i.exec(homeHtml)?.[1] ?? '';
  const navHtml = /<nav aria-label="Primary navigation"[\s\S]*?<\/nav>/.exec(homeHtml)?.[0] ?? '';
  const visibleLabels = [...navHtml.matchAll(/>([^<]+)<\/a>/g)].map((m) => m[1].trim());
  assert.deepEqual(visibleLabels, ['Reel', 'Work', 'Services', 'Store', 'Scoring inquiry']);
  for (const term of specialistTerms) {
    assert.match(navHtml, new RegExp(term, 'i'), `homepage nav non-visible title attributes include "${term}"`);
    assert.match(homeHead, new RegExp(term, 'i'), `homepage <head> metadata includes "${term}"`);
  }

  const bundleName = fs.readdirSync(ROOT).find((f) => /^index-[0-9a-f]{8}\.js$/.test(f));
  const bundle = fs.readFileSync(path.join(ROOT, bundleName), 'utf8');
  assert.match(bundle, /label:"Reel",title:"Body horror, folk horror, and psychological horror composer showreel"/);
  assert.match(bundle, /label:"Work",title:"Experimental art house, psychological, folk, and body horror film scores"/);

  // Every non-home route keeps concise visible masthead labels while carrying specialist signals in non-visible title=/head/schema
  for (const route of allRoutes) {
    if (route.path === '/') continue;
    const html = fs.readFileSync(fileForRoute(route.path), 'utf8');
    const tabsHtml = /<nav class="tabs"[\s\S]*?<\/nav>/.exec(html)?.[0] ?? '';
    const tabLabels = [...tabsHtml.matchAll(/>([^<]+)<\/a>/g)].map((m) => m[1].trim());
    assert.deepEqual(tabLabels, ['Reel', 'Work', 'Composer', 'Services', 'Store'], `${route.path}: concise visible masthead labels`);
    for (const term of specialistTerms) {
      assert.match(tabsHtml, new RegExp(term, 'i'), `${route.path}: non-visible masthead title attributes include "${term}"`);
    }
  }
});

test('all content images and social image cards carry genre-descriptive alt text with zero generic placeholders', () => {
  const genericAltRe = /Poster artwork for|Cover artwork for|Cover art for|Still from|thumbnail by|press photo\./i;
  for (const route of allRoutes) {
    const html = fs.readFileSync(fileForRoute(route.path), 'utf8');
    for (const imgMatch of html.matchAll(/<img\b[^>]*>/gi)) {
      const altMatch = /\balt="([^"]*)"/i.exec(imgMatch[0]);
      assert.ok(altMatch, `${route.path}: every <img> has an alt attribute`);
      if (altMatch[1] !== '') {
        assert.doesNotMatch(altMatch[1], genericAltRe, `${route.path}: non-generic genre-descriptive alt required (${altMatch[1]})`);
      }
    }
    for (const metaMatch of html.matchAll(/<meta\b[^>]*(?:og:image:alt|twitter:image:alt)[^>]*>/gi)) {
      const content = /\bcontent="([^"]*)"/i.exec(metaMatch[0])?.[1] ?? '';
      assert.ok(content.length > 20, `${route.path}: image:alt meta tag has descriptive text`);
      assert.doesNotMatch(content, genericAltRe, `${route.path}: image:alt meta tag avoids generic placeholder (${content})`);
    }
  }
  const workHtml = fs.readFileSync(path.join(ROOT, 'work/eclipsed.html'), 'utf8');
  assert.match(
    workHtml,
    /ECLIPSED: Surrealist body horror score by Zazie Kanwar-Torge featuring dissonant bowed metal and experimental synthesis\./,
  );
});

test('JSON-LD knowsAbout and genre fields across all routes deep-link to external Wikipedia and IMDb authority URIs', () => {
  const authorityUrlRe = /^https:\/\/(en\.wikipedia\.org\/wiki\/|www\.imdb\.com\/(interest|search\/title)\/)/;
  let totalKnowsAbout = 0;
  let totalGenres = 0;

  function verifyNode(node, label) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const child of node) verifyNode(child, label);
      return;
    }
    if ('knowsAbout' in node) {
      totalKnowsAbout += 1;
      assert.ok(Array.isArray(node.knowsAbout) && node.knowsAbout.length >= 6, `${label}: knowsAbout has Knowledge Graph entities`);
      for (const item of node.knowsAbout) {
        assert.equal(item['@type'], 'Thing', `${label}: knowsAbout item is a Schema.org Thing`);
        assert.match(item.url ?? '', authorityUrlRe, `${label}: knowsAbout item has canonical Wikipedia/IMDb url`);
        assert.ok(
          Array.isArray(item.sameAs) && item.sameAs.some((u) => authorityUrlRe.test(u)),
          `${label}: knowsAbout item carries external authority sameAs URI`,
        );
      }
    }
    if ('genre' in node) {
      totalGenres += 1;
      const arr = Array.isArray(node.genre) ? node.genre : [node.genre];
      assert.ok(
        arr.some((entry) => typeof entry === 'string' && authorityUrlRe.test(entry)),
        `${label}: genre field deep-links to external Wikipedia/IMDb authority URI`,
      );
    }
    for (const [k, v] of Object.entries(node)) {
      if (k !== 'knowsAbout' && k !== 'genre') verifyNode(v, label);
    }
  }

  for (const route of allRoutes) {
    const html = fs.readFileSync(fileForRoute(route.path), 'utf8');
    const nodes = parseJsonLd(html, route.path);
    verifyNode(nodes, route.path);
  }
  assert.ok(totalKnowsAbout >= 20, `audited ${totalKnowsAbout} knowsAbout graphs`);
  assert.ok(totalGenres >= 150, `audited ${totalGenres} deep-linked genre fields`);
});

test('horror reference topics link identity knowledge and biography mentions without affiliation claims', () => {
  const names = ['A24 film aesthetic', 'Mica Levi scoring techniques', 'Folk Horror tropes'];
  // /composer was retired (2026-10-29) and 301s to /#about: the biography is
  // section 01 on the homepage, whose Person graph carries these same
  // reference topics. There is no standalone composer*.html to audit.
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const nodes = parseJsonLd(html, 'index.html');
  const person = nodes.find(n => n['@type'] === 'Person' && n.knowsAbout);
  for (const name of names) {
    const topic = person.knowsAbout.find(t => t.name === name);
    assert.ok(topic, `index.html: knowsAbout ${name}`);
    assert.match(topic.url, /^https:\/\/en.wikipedia.org\/wiki\//);
    assert.ok(!person.sameAs.includes(topic.url), 'references must not become identity aliases');
  }
});
