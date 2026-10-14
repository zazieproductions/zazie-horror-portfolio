#!/usr/bin/env node
/**
 * scripts/sync-pricing.mjs
 * ----------------------------------------------------------------------------
 * Writes the published prices into the static HTML from src/data/pricing.ts.
 *
 *   {{zp:scene.label}}          a raw token. The first run wraps its value as
 *                               <!--v:scene.label-->$200–$350<!--/v:scene.label-->
 *                               so later runs can refresh it in place.
 *   <!--zp:packages-->…<!--/zp:packages-->
 *                               marker blocks; the content between the markers
 *                               is replaced with generated markup
 *
 * Block names: packages, inclusions, estimator, inquiry, notice, factors,
 *               licences, offers.
 *
 * The script edits committed HTML in place, so every page carries the same
 * figures as the estimator. It fails on an unknown token or an unclosed
 * marker, so a typo cannot ship a stale or missing price.
 *
 *   node scripts/sync-pricing.mjs           write changes
 *   node scripts/sync-pricing.mjs --check   exit 1 if any page is out of date
 *
 * Requires `tsc` to have emitted build/ first (the npm build script does this).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');

const markup = await import('../build/lib/pricing-markup.js');
const { expandTokens, packagesHtml, inclusionsHtml, estimatorHtml, inquiryFormHtml, noticeHtml, offersGraph, tokenValue, factorsHtml, licencesHtml, SITE_ORIGIN } = markup;
const { ORG_ID } = await import('../build/data/site.js');

const SERVICE_ID = `${SITE_ORIGIN}/services#service`;
const PROVIDER_ID = ORG_ID;

/** Generated markup for each marker block. */
const BLOCKS = {
  packages: () => packagesHtml(),
  inclusions: () => inclusionsHtml(),
  estimator: () => estimatorHtml(),
  inquiry: () => inquiryFormHtml(),
  notice: () => noticeHtml(),
  factors: () => factorsHtml(),
  licences: () => licencesHtml(),
  offers: () => `<script type="application/ld+json">${JSON.stringify(offersGraph(SERVICE_ID, PROVIDER_ID))}</script>`,
};

// legal-src/ keeps its raw {{zp:…}} tokens: build.sh copies those sources into
// the served pages, and this script fills the copies. Filling the sources too
// would freeze the prices into them.
const SKIP_DIRS = new Set(['node_modules', 'build', '.git', 'dist', 'out', 'coverage', '.cache', 'legal-src']);
const errors = [];

/** Every committed HTML file, including legal-src sources. */
function htmlFiles(dir = root, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) htmlFiles(path.join(dir, entry.name), found);
    } else if (entry.name.endsWith('.html')) {
      found.push(path.join(dir, entry.name));
    }
  }
  return found;
}

function lineOf(source, index) {
  return source.slice(0, index).split('\n').length;
}

function syncBlocks(source, where) {
  const openers = [...source.matchAll(/<!--zp:([a-z-]+)-->/g)];
  const closers = [...source.matchAll(/<!--\/zp:([a-z-]+)-->/g)];
  for (const m of openers) {
    if (!BLOCKS[m[1]]) errors.push(`${where}:${lineOf(source, m.index)} unknown pricing block "${m[1]}"`);
  }
  for (const m of closers) {
    if (!BLOCKS[m[1]]) errors.push(`${where}:${lineOf(source, m.index)} unknown closing pricing block "${m[1]}"`);
  }
  const pattern = /<!--zp:([a-z-]+)-->[\s\S]*?<!--\/zp:\1-->/g;
  const paired = new Set();
  const out = source.replace(pattern, (_match, name) => {
    paired.add(name);
    return `<!--zp:${name}-->${BLOCKS[name]()}<!--/zp:${name}-->`;
  });
  for (const m of openers) {
    if (!paired.has(m[1]) && BLOCKS[m[1]]) {
      errors.push(`${where}:${lineOf(source, m.index)} <!--zp:${m[1]}--> has no closing <!--/zp:${m[1]}-->`);
    }
  }
  return out;
}

function syncFile(file) {
  const where = path.relative(root, file);
  const source = fs.readFileSync(file, 'utf8');
  if (!source.includes('{{zp:') && !source.includes('<!--zp:') && !source.includes('<!--v:')) return null;

  for (const m of source.matchAll(/\{\{zp:([^}]*)\}\}/g)) {
    if (!/^[a-z0-9.\-]+$/.test(m[1]) || tokenValue(m[1]) === null) {
      errors.push(`${where}:${lineOf(source, m.index)} unknown pricing token {{zp:${m[1]}}}`);
    }
  }
  for (const m of source.matchAll(/<!--v:([^ ]*?)-->/g)) {
    if (tokenValue(m[1]) === null) errors.push(`${where}:${lineOf(source, m.index)} unknown pricing value <!--v:${m[1]}-->`);
  }

  let text = syncBlocks(source, where);
  // Refresh wrapped values, then wrap any raw token that has not been wrapped yet.
  text = text.replace(/<!--v:([a-z0-9.\-]+)-->[\s\S]*?<!--\/v:\1-->/g, (_m, key) => `<!--v:${key}-->${tokenValue(key) ?? ''}<!--/v:${key}-->`);
  text = text.replace(/\{\{zp:([a-z0-9.\-]+)\}\}/g, (_m, key) => `<!--v:${key}-->${tokenValue(key) ?? ''}<!--/v:${key}-->`);
  return { file, where, before: source, after: text };
}

const changed = [];
let scanned = 0;
for (const file of htmlFiles()) {
  const result = syncFile(file);
  if (!result) continue;
  scanned += 1;
  if (result.before !== result.after) changed.push(result);
}

if (errors.length) {
  console.error('sync-pricing: refusing to continue.');
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

if (check) {
  if (changed.length) {
    console.error('sync-pricing --check: these pages are out of date with src/data/pricing.ts:');
    for (const c of changed) console.error(`  ${c.where}`);
    console.error('Run: node scripts/sync-pricing.mjs');
    process.exit(1);
  }
  console.log(`sync-pricing --check: PASS (${scanned} pricing pages in step with pricing.ts)`);
  process.exit(0);
}

for (const c of changed) fs.writeFileSync(c.file, c.after, 'utf8');
console.log(`sync-pricing: ${scanned} pricing pages scanned, ${changed.length} updated`);
for (const c of changed) console.log(`  wrote ${c.where}`);
