#!/usr/bin/env node
/**
 * index-coverage.mjs
 * -----------------------------------------------------------------------------
 * Route-discovery and content-distinctness audit for URLs submitted in the
 * XML sitemap. Public support pages marked noindex are intentionally excluded.
 *
 * The audit checks the parts the site controls: in-body contextual links,
 * resolvable files and duplicate copy. Public noindex documents are excluded
 * as sitemap targets but remain valid sources of contextual links. It does not
 * infer or promise indexing.
 *
 *   1. DISCOVERY  - is the URL linked from a page Google already crawls, in the
 *                   body content, with anchor text that describes it? A URL that
 *                   appears only in sitemap.xml and in sitewide footer chrome is
 *                   an orphan in everything but name: no context, no importance,
 *                   no reason to crawl it next.
 *   2. DISTINCTNESS - does the page have a clear purpose, or is its main copy a
 *                     near-duplicate of a sibling?
 *
 * This tool audits indexable sitemap URLs against the files the host serves.
 * It fails on missing files, missing contextual internal links and substantive
 * near-duplicates. Word count is reported for diagnosis only; it is not a
 * ranking target or a minimum-content requirement.
 *
 *   words     words of <main> text (scripts, styles, chrome removed; diagnostic only)
 *   in-body   distinct pages whose <main> links to this URL (footer/header
 *             links are excluded on purpose - they are on every page, so they
 *             carry almost no weight and tell Google nothing about the page)
 *   anchor    the longest anchor text used by an in-body source
 *   dupe      highest 6-word-shingle overlap with any other page
 *
 * Usage:
 *   node tools/index-coverage.mjs              report
 *   node tools/index-coverage.mjs --check      exit 1 on a regression
 *   node tools/index-coverage.mjs --json       machine-readable
 * -----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const check = argv.includes('--check');
const asJson = argv.includes('--json');

/* Duplicate threshold. The home page is excluded from the near-duplicate test as a comparison target:
 * it is the summary that the detail pages expand, and the generated rate card is
 * written into both by scripts/sync-pricing.mjs, so the overlap is by design and
 * is reported rather than failed. */
const MAX_DUPE = 0.34;

const SITE = 'https://horror.zazieproductions.com';

/* ------------------------------------------------------------------- routes */

const sitemapXml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
  m[1].replace(/&amp;/g, '&'),
);

function decode(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function pathOf(loc) {
  const p = new URL(loc).pathname;
  return p === '/' ? '/' : p.replace(/\/$/, '');
}

/** The file the host answers a slashless route from. */
function fileFor(routePath) {
  if (routePath === '/') return 'index.html';
  const dirIndex = path.join(root, routePath.slice(1), 'index.html');
  if (fs.existsSync(dirIndex) && routePath.split('/').length === 2) return path.join(routePath.slice(1), 'index.html');
  return `${routePath.slice(1)}.html`;
}

/* -------------------------------------------------------------------- pages */

const pages = new Map(); // routePath -> { html, text, links, words, shingles }

function mainOf(html) {
  const main = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html);
  if (main) return main[1];
  // Pages without <main> (the React home page): body minus chrome.
  return html.split(/<body\b[^>]*>/i).pop().split(/<footer\b/i)[0];
}

function normaliseWords(text) {
  return decode(text)
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .match(/[a-z0-9']+/g) ?? [];
}

function shingles(words, size = 6) {
  const set = new Set();
  for (let i = 0; i + size <= words.length; i += 1) set.add(words.slice(i, i + size).join(' '));
  return set;
}

for (const loc of urls) {
  const routePath = pathOf(loc);
  const rel = fileFor(routePath);
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    pages.set(routePath, { missing: rel });
    continue;
  }
  const html = fs.readFileSync(abs, 'utf8');
  const markup = mainOf(html);
  const withoutCode = markup.replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, ' ');
  const words = normaliseWords(withoutCode);

  const links = [];
  for (const match of withoutCode.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = /href\s*=\s*"([^"]*)"/i.exec(match[1])?.[1];
    if (!href) continue;
    const clean = decode(href.trim());
    if (!clean.startsWith('/') || clean.startsWith('//')) continue;
    const target = pathOf(new URL(clean, SITE).href);
    const text = decode(match[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    links.push({ target, text, hash: clean.includes('#') });
  }

  pages.set(routePath, {
    file: rel,
    words: words.length,
    text: words.join(' '),
    shingles: shingles(words),
    links,
  });
}

// Public support pages marked noindex are not sitemap targets, but their
// in-body document index can still provide useful navigation to indexable
// pages (for example, /legal -> /accessibility). Read them as link sources only.
const excludedDirectories = new Set(['.git', '.arena', 'node_modules', 'build', 'dist', 'coverage', 'home-src', 'legal-src', 'store-src', 'src', 'tools', 'scripts']);
function publicHtmlFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) publicHtmlFiles(path.join(dir, entry.name), files);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

for (const abs of publicHtmlFiles(root)) {
  const html = fs.readFileSync(abs, 'utf8');
  const robots = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map((match) => match[0])
    .find((tag) => /\bname=["']robots["']/i.test(tag));
  const robotsContent = robots && /\bcontent=["']([^"']*)["']/i.exec(robots)?.[1];
  if (!robotsContent || !/\bnoindex\b/i.test(robotsContent)) continue;

  const canonicalTag = /<link\b[^>]*rel=["']canonical["'][^>]*>/i.exec(html)?.[0];
  const canonicalHref = canonicalTag && /\bhref=["']([^"']+)["']/i.exec(canonicalTag)?.[1];
  if (!canonicalHref) continue;
  const canonical = new URL(canonicalHref, SITE);
  if (canonical.origin !== SITE) continue;
  const routePath = pathOf(canonical.href);
  if (pages.has(routePath)) continue;

  const markup = mainOf(html);
  const withoutCode = markup.replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, ' ');
  const links = [];
  for (const match of withoutCode.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = /href\s*=\s*["']([^"']*)["']/i.exec(match[1])?.[1];
    if (!href) continue;
    const clean = decode(href.trim());
    if (!clean.startsWith('/') || clean.startsWith('//')) continue;
    const target = pathOf(new URL(clean, SITE).href);
    const text = decode(match[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    links.push({ target, text, hash: clean.includes('#') });
  }
  pages.set(routePath, {
    file: path.relative(root, abs),
    words: 0,
    text: '',
    shingles: new Set(),
    links,
    noindexSource: true,
  });
}

/* ---------------------------------------------------------------- link graph */

const inbound = new Map(); // target -> [{ from, anchor }]
for (const [from, page] of pages) {
  if (page.missing) continue;
  const seen = new Set();
  for (const link of page.links) {
    if (!pages.has(link.target)) continue; // off-sitemap / fragment only
    if (seen.has(link.target)) continue;
    seen.add(link.target);
    if (!inbound.has(link.target)) inbound.set(link.target, []);
    inbound.get(link.target).push({ from, anchor: link.text });
  }
}

/* ------------------------------------------------------------------- overlaps */

const rows = [];
for (const loc of urls) {
  const routePath = pathOf(loc);
  const page = pages.get(routePath);
  if (!page || page.missing) {
    rows.push({ path: routePath, loc, missing: page?.missing ?? 'unknown' });
    continue;
  }

  let dupe = 0;
  let dupeWith = '';
  let homeOverlap = 0;
  for (const [other, candidate] of pages) {
    if (other === routePath || candidate.missing || !candidate.shingles.size || !page.shingles.size) continue;
    let shared = 0;
    for (const shingle of page.shingles) if (candidate.shingles.has(shingle)) shared += 1;
    const ratio = shared / page.shingles.size;
    if (other === '/') {
      homeOverlap = ratio;
      continue;
    }
    if (ratio > dupe) {
      dupe = ratio;
      dupeWith = other;
    }
  }

  const sources = inbound.get(routePath) ?? [];
  const anchors = sources.map((s) => s.anchor).filter(Boolean).sort((a, b) => b.length - a.length);

  rows.push({
    path: routePath,
    loc,
    words: page.words,
    sources: sources.length,
    sourceList: sources.map((s) => s.from),
    anchor: anchors[0] ?? '',
    dupe,
    dupeWith,
    homeOverlap,
    kind: routePath === '/' ? 'home' : routePath.split('/').length === 2 ? 'hub-or-item' : 'item',
    isItem: routePath.split('/').length > 2,
    hub: routePath.split('/').length > 2 ? `/${routePath.split('/')[1]}` : null,
  });
}

/* ------------------------------------------------------------------- report */

const failures = [];
const warnings = [];

for (const row of rows) {
  if (row.missing) {
    failures.push(`${row.path}: sitemap URL has no file (${row.missing})`);
    continue;
  }
  if (row.sources === 0) failures.push(`${row.path}: no contextual in-body internal link - sitemap-only orphan`);
  if (row.dupe >= MAX_DUPE) {
    const message = `${row.path}: ${(row.dupe * 100).toFixed(0)}% near-duplicate of ${row.dupeWith}`;
    // The home page is the summary of every detail page on purpose, and item
    // pages share one catalogue template. Neither is a discovery fault, so both
    // are reported without failing the build.
    if (row.isItem || row.path === '/') warnings.push(message);
    else failures.push(message);
  }
  if (!row.isItem && row.homeOverlap >= 0.45 && row.path !== '/') {
    warnings.push(`${row.path}: ${(row.homeOverlap * 100).toFixed(0)}% of its text also appears on / (pricing blocks are generated into both; keep the surrounding prose unique)`);
  }
  if (row.isItem && row.hub && pages.has(row.hub)) {
    const hubLinks = (pages.get(row.hub).links ?? []).some((l) => l.target === row.path);
    if (!hubLinks) failures.push(`${row.path}: parent hub ${row.hub} does not link to this item page`);
  }
}

if (asJson) {
  console.log(JSON.stringify({ generated: new Date().toISOString(), rows, failures }, null, 2));
  process.exit(check && failures.length ? 1 : 0);
}

const pad = (value, width) => String(value).padEnd(width);
const hubs = rows.filter((r) => !r.isItem);
const items = rows.filter((r) => r.isItem);

console.log(`index coverage: ${rows.length} sitemap URLs (${hubs.length} hubs + ${items.length} item pages)\n`);
console.log(`${pad('route', 46)}${pad('words', 7)}${pad('in-body', 9)}dupe   strongest in-body anchor`);
console.log('-'.repeat(118));
for (const row of [...hubs, ...items]) {
  if (row.missing) {
    console.log(`${pad(row.path, 46)}MISSING ${row.missing}`);
    continue;
  }
  const flag = row.sources === 0 ? '!' : row.dupe >= MAX_DUPE ? '~' : ' ';
  console.log(
    `${flag}${pad(row.path, 45)}${pad(row.words, 7)}${pad(row.sources, 9)}${pad(
      `${(row.dupe * 100).toFixed(0)}%`,
      7,
    )}${row.anchor.slice(0, 46) || '(none - chrome links only)'}`,
  );
}

const orphans = rows.filter((r) => !r.missing && r.sources === 0);

console.log('');
console.log(`sitemap-only orphans : ${orphans.length}`);
console.log(`hub near-duplicates  : ${rows.filter((r) => !r.isItem && r.path !== '/' && !r.missing && r.dupe >= MAX_DUPE).length}`);
console.log(`template duplicates  : ${rows.filter((r) => r.isItem && !r.missing && r.dupe >= MAX_DUPE).length} (item pages share a template - reported, not failed)`);
if (warnings.length) {
  console.log('');
  for (const warning of warnings.slice(0, 6)) console.log(`  warn   ${warning}`);
  if (warnings.length > 6) console.log(`  warn   ... ${warnings.length - 6} more`);
}
console.log('');

if (failures.length) {
  console.log(`FAIL - ${failures.length} coverage problem(s):`);
  for (const failure of failures) console.log(`  error  ${failure}`);
  console.log(
    '\nReview route purpose, distinct copy and contextual linking. No word-count target is used by this audit.',
  );
} else {
  console.log('PASS - every submitted URL resolves, has a contextual internal link, and has a distinct purpose.');
}

process.exit(check && failures.length ? 1 : 0);
