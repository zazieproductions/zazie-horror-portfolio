#!/usr/bin/env node
/**
 * scripts/sync-commission.mjs
 * ----------------------------------------------------------------------------
 * Writes the generated commissioning surfaces into the static HTML from
 * src/data/commission.ts (via src/lib/commission-markup.ts):
 *
 *   {{zp:payment}}              a raw token. The first run wraps its value as
 *                               <!--v:payment-->…<!--/v:payment-->
 *                               so later runs can refresh it in place.
 *   <!--zp:inquiry-->…<!--/zp:inquiry-->
 *                               marker blocks; the content between the markers
 *                               is replaced with generated markup
 *
 * Block names: meta-hire, meta-services, commissioning, inclusions,
 *               licences, factors, inquiry, offer.
 *
 * Succeeded scripts/sync-pricing.mjs when the published rate card was
 * removed (2026-10-27). No block or token here can produce a fee: unknown
 * tokens and blocks fail the build, so a retired pricing token left in a
 * page cannot ship a stale figure.
 *
 * The script edits committed HTML in place. It fails on an unknown token or
 * an unclosed marker.
 *
 *   node scripts/sync-commission.mjs           write changes
 *   node scripts/sync-commission.mjs --check   exit 1 if any page is out of date
 *
 * Requires `tsc` to have emitted build/ first (the npm build script does this).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');

const markup = await import('../build/lib/commission-markup.js');
const { commissioningHtml, factorsHtml, inclusionsHtml, inquiryFormHtml, licencesHtml, metaHtml, serviceOfferGraph, tokenValue, SITE_ORIGIN } = markup;
const { ORG_ID } = await import('../build/data/site.js');
const { hubs } = await import('../build/data/hubs.js');

const SERVICE_ID = `${SITE_ORIGIN}/services#service`;
const PROVIDER_ID = ORG_ID;

const hubDescription = (p) => {
  const hub = hubs.find((h) => h.path === p);
  if (!hub) throw new Error(`sync-commission: no hub ${p} in src/data/hubs.ts`);
  return hub.description;
};

/** Generated markup for each marker block. */
const BLOCKS = {
  'meta-hire': () => metaHtml(hubDescription('/hire-a-composer')),
  'meta-services': () => metaHtml(hubDescription('/services')),
  commissioning: () => commissioningHtml(),
  inclusions: () => inclusionsHtml(),
  licences: () => licencesHtml(),
  factors: () => factorsHtml(),
  inquiry: () => inquiryFormHtml(),
  offer: () => `<script type="application/ld+json">${JSON.stringify(serviceOfferGraph(SERVICE_ID, PROVIDER_ID))}</script>`,
};

// legal-src/ keeps its raw {{zp:…}} tokens: build.sh copies those sources into
// the served pages, and this script fills the copies. Filling the sources too
// would freeze the statements into them.
const SKIP_DIRS = new Set(['node_modules', 'build', '.git', 'dist', 'out', 'coverage', '.cache', 'legal-src']);
const errors = [];

/** Every committed HTML file outside the skipped source trees. */
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
    if (!BLOCKS[m[1]]) errors.push(`${where}:${lineOf(source, m.index)} unknown commissioning block "${m[1]}"`);
  }
  for (const m of closers) {
    if (!BLOCKS[m[1]]) errors.push(`${where}:${lineOf(source, m.index)} unknown closing commissioning block "${m[1]}"`);
  }
  const pattern = /<!--zp:([a-z-]+)-->([\s\S]*?)<!--\/zp:\1-->/g;
  const paired = new Set();
  const out = source.replace(pattern, (match, name) => {
    paired.add(name);
    // Unknown blocks were already reported above; leave them untouched so
    // every offender is listed in one run instead of crashing on the first.
    if (!BLOCKS[name]) return match;
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
      errors.push(`${where}:${lineOf(source, m.index)} unknown commissioning token {{zp:${m[1]}}}`);
    }
  }
  for (const m of source.matchAll(/<!--v:([^ ]*?)-->/g)) {
    if (tokenValue(m[1]) === null) errors.push(`${where}:${lineOf(source, m.index)} unknown commissioning value <!--v:${m[1]}-->`);
  }

  const jsonEscape = (value) => JSON.stringify(String(value)).slice(1, -1);

  let text = syncBlocks(source, where);
  const parts = [];
  let cursor = 0;
  for (const scriptMatch of text.matchAll(/<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi)) {
    const start = scriptMatch.index;
    const rawHtml = text.slice(cursor, start);
    parts.push(
      rawHtml
        .replace(/<!--v:([a-z0-9.\-]+)-->([\s\S]*?)<!--\/v:\1-->/g, (_m, key) => `<!--v:${key}-->${tokenValue(key) ?? ''}<!--/v:${key}-->`)
        .replace(/\{\{zp:([a-z0-9.\-]+)\}\}/g, (_m, key) => `<!--v:${key}-->${tokenValue(key) ?? ''}<!--/v:${key}-->`),
    );
    parts.push(
      scriptMatch[0]
        .replace(/<!--v:([a-z0-9.\-]+)-->([\s\S]*?)<!--\/v:\1-->/g, (_m, key) => jsonEscape(tokenValue(key) ?? ''))
        .replace(/\{\{zp:([a-z0-9.\-]+)\}\}/g, (_m, key) => jsonEscape(tokenValue(key) ?? '')),
    );
    cursor = start + scriptMatch[0].length;
  }
  parts.push(
    text
      .slice(cursor)
      .replace(/<!--v:([a-z0-9.\-]+)-->([\s\S]*?)<!--\/v:\1-->/g, (_m, key) => `<!--v:${key}-->${tokenValue(key) ?? ''}<!--/v:${key}-->`)
      .replace(/\{\{zp:([a-z0-9.\-]+)\}\}/g, (_m, key) => `<!--v:${key}-->${tokenValue(key) ?? ''}<!--/v:${key}-->`),
  );
  text = parts.join('');
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
  console.error('sync-commission: refusing to continue.');
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

if (check) {
  if (changed.length) {
    console.error('sync-commission --check: these pages are out of date with src/data/commission.ts:');
    for (const c of changed) console.error(`  ${c.where}`);
    console.error('Run: node scripts/sync-commission.mjs');
    process.exit(1);
  }
  console.log(`sync-commission --check: PASS (${scanned} commissioning pages in step with commission.ts)`);
  process.exit(0);
}

for (const c of changed) fs.writeFileSync(c.file, c.after, 'utf8');
console.log(`sync-commission: ${scanned} commissioning pages scanned, ${changed.length} updated`);
for (const c of changed) console.log(`  wrote ${c.where}`);
