#!/usr/bin/env node
/**
 * measure-ecosystem.mjs
 * -----------------------------------------------------------------------------
 * Cross-property link-graph and entity-association meter.
 *
 * Reports, per page and site-wide:
 *   - outbound external links and distinct external hosts
 *   - Zazie-owned properties cited (registry URLs that appear at least once)
 *   - sameAs values in JSON-LD
 *   - internal hub links
 *
 * Pass --before to measure the committed HEAD state instead of the working
 * tree, so the same instrument produces both sides of the comparison.
 *
 *   node tools/measure-ecosystem.mjs
 *   node tools/measure-ecosystem.mjs --before
 * -----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BEFORE = process.argv.includes('--before');
const REG = JSON.parse(fs.readFileSync(path.join(__dirname, 'ecosystem-properties.json'), 'utf8'));
const PROPERTIES = new Set([
  ...REG.groups.flatMap((g) => g.items.map((i) => i.url.replace(/\/$/, ''))),
  ...REG.press.map((p) => p.url.replace(/\/$/, '')),
]);
const HUBS = [
  '/work', '/reel', '/composer', '/process', '/services', '/contact',
  '/store', '/elsewhere', '/press', '/discography',
];

const PAGES = [
  ['/', 'index.html'],
  ['/work', 'work/index.html'],
  ['/reel', 'reel/index.html'],
  ['/composer', 'composer/index.html'],
  ['/process', 'process/index.html'],
  ['/services', 'services/index.html'],
  ['/contact', 'contact/index.html'],
  ['/store', 'store/index.html'],
  ['/elsewhere', 'elsewhere/index.html'],
  ['/press', 'press/index.html'],
  ['/discography', 'discography/index.html'],
  ['/faq', 'faq/index.html'],
  ['/legal', 'legal/index.html'],
  ['/licensing', 'licensing/index.html'],
  ['/404', '404.html'],
];

function readFile(rel) {
  if (!BEFORE) return fs.readFileSync(path.join(ROOT, rel), 'utf8');
  try {
    return execFileSync('git', ['show', `HEAD:${rel}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null; // page did not exist at HEAD
  }
}

const rows = [];
const siteProps = new Set();
const siteHosts = new Set();
let siteExternal = 0;
let siteInternal = 0;
let siteSameAs = 0;

for (const [route, file] of PAGES) {
  const src = readFile(file);
  if (src === null) {
    rows.push({ route, ext: 0, hosts: 0, props: 0, internal: 0, sameAs: 0, note: 'did not exist' });
    continue;
  }
  const hrefs = [...src.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  const external = hrefs.filter((h) => /^https?:\/\//.test(h) && !h.includes('horror.zazieproductions.com') && !h.includes('w3.org'));
  const hosts = new Set(external.map((h) => { try { return new URL(h).host.replace(/^www\./, ''); } catch { return h; } }));
  const props = new Set(external.map((h) => h.replace(/\/$/, '')).filter((h) => PROPERTIES.has(h)));
  const internal = hrefs.filter((h) => h.startsWith('/') || h.startsWith('#'));
  const hubLinks = internal.filter((h) => HUBS.some((x) => h === x || h.startsWith(x + '/') || h.startsWith(x + '#')));

  let sameAs = 0;
  for (const m of src.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const o = JSON.parse(m[1]);
      const walk = (n) => {
        if (Array.isArray(n)) return n.forEach(walk);
        if (n && typeof n === 'object') {
          for (const [k, v] of Object.entries(n)) {
            if (k === 'sameAs') sameAs += Array.isArray(v) ? v.length : 1;
            else walk(v);
          }
        }
      };
      walk(o);
    } catch { /* ignore */ }
  }

  props.forEach((p) => siteProps.add(p));
  hosts.forEach((h) => siteHosts.add(h));
  siteExternal += external.length;
  siteInternal += hubLinks.length;
  siteSameAs += sameAs;
  rows.push({ route, ext: external.length, hosts: hosts.size, props: props.size, internal: hubLinks.length, sameAs });
}

const pad = (s, n) => String(s).padEnd(n);
const padl = (s, n) => String(s).padStart(n);
console.log(`\n${BEFORE ? 'BEFORE (committed HEAD)' : 'AFTER (working tree)'}`);
console.log('route'.padEnd(16) + padl('ext', 6) + padl('hosts', 7) + padl('props', 7) + padl('hub', 5) + padl('sameAs', 8));
console.log('-'.repeat(49));
for (const r of rows) {
  console.log(pad(r.route, 16) + padl(r.ext, 6) + padl(r.hosts, 7) + padl(r.props, 7) + padl(r.internal, 5) + padl(r.sameAs, 8) + (r.note ? `   (${r.note})` : ''));
}
console.log('-'.repeat(49));
console.log(pad('SITE', 16) + padl(siteExternal, 6) + padl(siteHosts.size, 7) + padl(siteProps.size, 7) + padl(siteInternal, 5) + padl(siteSameAs, 8));
console.log(`\nregistry properties cited at least once: ${siteProps.size} / ${PROPERTIES.size}`);
const missing = [...PROPERTIES].filter((p) => !siteProps.has(p));
if (missing.length) console.log(`not yet cited: ${missing.join(', ')}`);
