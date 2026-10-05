#!/usr/bin/env node
/**
 * build-deploy-dir.mjs
 * -----------------------------------------------------------------------------
 * Assemble the directory the deploy uploads, and refuse to build one that
 * could not work.
 *
 * WHY THIS EXISTS
 *
 * The served tree has always been the repository root -- "what is on main is
 * what the edge serves". That is true of the Pages git integration too, and it
 * publishes everything: tools/, scripts/, src/, store-src/, legal-src/, the
 * markdown docs, package.json, and the local dev server. /tools/indexnow.mjs
 * is on the public web today because of it.
 *
 * A direct upload gets to choose. This copies the root to a staging directory
 * minus the parts that are not the site, then checks the result against the
 * guarantees the deploy depends on.
 *
 *   node scripts/build-deploy-dir.mjs            # writes dist/
 *   node scripts/build-deploy-dir.mjs /tmp/site  # somewhere else
 *
 * WHAT IT REFUSES TO BUILD
 *
 *   - a tree missing any of index.html, 404.html, sw.js, sitemap.xml,
 *     robots.txt, or the IndexNow key file
 *   - a tree where any of the 84 sitemap URLs does not resolve to a file
 *   - a tree whose sw.js precaches a store-<hash>.css/js that is not there
 *     (the hash-drift warning store-src/build.sh only prints)
 *   - more than 20,000 files, or any single file over 25 MB -- Cloudflare's
 *     direct-upload limits
 *
 * No dependencies; Node 18+.
 * -----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'dist'));

/* Not the site: build inputs, tooling, sources, and local development files. */
const EXCLUDE_NAMES = new Set([
  '.git', '.github', '.gitignore', '.audit',
  'node_modules', 'build', 'dist',
  'scripts', 'src', 'tools', 'store-src', 'legal-src', 'public',
  'server.mjs',
]);
const EXCLUDE_EXT = new Set(['.md', '.json']);

const MAX_FILES = 20_000;      // Cloudflare Pages direct upload
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const problems = [];
const fail = (msg) => problems.push(msg);

/* ------------------------------------------------------------------- copy */

function copy(from, to, rel = '') {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (EXCLUDE_NAMES.has(entry.name)) continue;
    if (!entry.isDirectory() && EXCLUDE_EXT.has(path.extname(entry.name).toLowerCase())) continue;
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    const relPath = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      fs.mkdirSync(dst, { recursive: true });
      copy(src, dst, relPath);
    } else {
      fs.copyFileSync(src, dst);
      fs.chmodSync(dst, entry.isDirectory() ? 0o755 : 0o644);
    }
  }
}

if (OUT === ROOT) {
  console.error('build-deploy-dir: refusing to copy the repository onto itself');
  process.exit(2);
}
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
copy(ROOT, OUT);

/* ------------------------------------------------------------------ checks */

const files = [];
(function walk(dir, rel = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const relPath = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) walk(abs, relPath);
    else files.push({ relPath, size: fs.statSync(abs).size });
  }
})(OUT);

/* 1. the files a static deploy cannot work without */
for (const required of ['index.html', '404.html', 'sw.js', 'sitemap.xml', 'robots.txt']) {
  if (!files.some((f) => f.relPath === required)) fail(`missing ${required}`);
}
const keys = files.filter((f) => /^[a-f0-9]{32}\.txt$/.test(f.relPath));
if (keys.length !== 1) fail(`expected exactly one IndexNow key file (<32 hex>.txt) at the root, found ${keys.length}`);

/* 2. every sitemap URL resolves, the way the host will resolve it */
const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const urls = (xml.match(/<url\b[\s\S]*?<\/url>/g) || [])
  .map((b) => (/<loc>\s*([^<\s]+)\s*<\/loc>/.exec(b) || [])[1])
  .filter(Boolean)
  .map((u) => u.replace(/&amp;/g, '&'));
const has = new Set(files.map((f) => f.relPath));
const resolves = (p) => {
  const rel = p.replace(/^\/+/, '');
  if (p === '/') return has.has('index.html');
  return has.has(rel) || has.has(`${rel}.html`) || has.has(path.posix.join(rel, 'index.html'));
};
const missing = urls.map((u) => new URL(u).pathname).filter((p) => !resolves(p));
if (missing.length) fail(`${missing.length} sitemap URL(s) resolve to no file: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? ', …' : ''}`);

/* 3. sw.js must not precache a store asset this tree does not carry
      (store-src/build.sh only warns about this) */
const sw = fs.readFileSync(path.join(OUT, 'sw.js'), 'utf8');
for (const asset of [...sw.matchAll(/['"]\/((?:store|index|legal)-[0-9a-f]{8}\.(?:css|js))['"]/g)].map((m) => m[1])) {
  if (!has.has(asset)) fail(`sw.js precaches /${asset}, which is not in the deploy`);
}

/* 4. upload limits */
if (files.length > MAX_FILES) fail(`${files.length} files exceeds Cloudflare's ${MAX_FILES}-file upload limit`);
for (const f of files.filter((x) => x.size > MAX_FILE_BYTES)) {
  fail(`${f.relPath} is ${(f.size / 1024 / 1024).toFixed(1)} MB, over the 25 MB per-file limit`);
}

/* ------------------------------------------------------------------ report */

const bytes = files.reduce((n, f) => n + f.size, 0);
const routes = files.filter((f) => f.relPath.endsWith('.html')).length;
console.log(`build-deploy-dir: ${files.length} files, ${(bytes / 1024 / 1024).toFixed(1)} MB, ${routes} html -> ${OUT}`);
console.log(`  sitemap URLs resolving: ${urls.length - missing.length}/${urls.length}`);
const biggest = [...files].sort((a, b) => b.size - a.size).slice(0, 3);
console.log(`  largest: ${biggest.map((f) => `${(f.size / 1024 / 1024).toFixed(1)} MB ${f.relPath}`).join(', ')}`);

if (problems.length) {
  console.error(`\nbuild-deploy-dir: ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error('');
  process.exit(1);
}
console.log('build-deploy-dir: OK');
