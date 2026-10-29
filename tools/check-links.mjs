#!/usr/bin/env node
/**
 * tools/check-links.mjs
 * ----------------------------------------------------------------------------
 * Internal link integrity for the whole published tree.
 *
 * The site is a static export served by Cloudflare Pages. A link is *broken*
 * when the host would answer it with 404 -- so this checker resolves targets
 * exactly the way the host does (see server.mjs and _redirects):
 *
 *   /work            → work.html (root twin) or work/index.html     [200]
 *   /work/           → work/index.html                              [200]
 *   /work/expire     → /work#expire                                 [301 archive redirect]
 *   /foo.html        → 301 to /foo when /foo resolves               [200 + hop]
 *   /images/x.jpg    → exact file                                   [200]
 *
 * It also checks same-page and cross-page `#fragment` links: a fragment has to
 * match an `id=` (or `name=`) that exists on the destination page, otherwise
 * the browser lands at the top of the page and the anchor is dead weight.
 *
 * Usage:
 *   node tools/check-links.mjs            # audit, exit 1 on broken links
 *   node tools/check-links.mjs --verbose  # list every hop/redirect target
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');
const SKIP_DIRS = new Set([
  'node_modules', 'build', 'dist', '.git', '.wrangler', '.audit', 'public',
  // Build sources: these templates ship to the site as generated pages, they
  // are not published themselves, so __CSS__ placeholders are not live links.
  'legal-src', 'store-src', 'home-src', 'src', 'scripts', 'tools',
]);

/* ------------------------------------------------------------------ helpers */

const decode = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:38|x26);/g, '&')
    .replace(/&#39;|&apos;/g, "'");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const isFile = (rel) => {
  try {
    return fs.statSync(path.join(root, rel)).isFile();
  } catch {
    return false;
  }
};

/** _redirects: exact source → destination, 301/308 only (rewrites pass through). */
const redirects = new Map();
for (const raw of fs.readFileSync(path.join(root, '_redirects'), 'utf8').split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const [from, to, status] = line.split(/\s+/);
  if (!from || !to || /[*:(]/.test(from)) continue;
  if (!['301', '302', '308', '307'].includes(status)) continue;
  redirects.set(from, to);
}

/** The file the host serves for this path, mirroring server.mjs resolve(). */
function resolveFile(urlPath) {
  const rel = urlPath.replace(/^\/+/, '');
  if (urlPath === '/' || rel === '') return isFile('index.html') ? 'index.html' : null;
  if (isFile(rel)) return rel;
  if (isFile(`${rel}.html`)) return `${rel}.html`;
  if (isFile(path.posix.join(rel, 'index.html'))) return path.posix.join(rel, 'index.html');
  return null;
}

/** Resolve one site-relative path, following at most a few alias redirects. */
function resolvePath(urlPath, seen = 0) {
  if (redirects.has(urlPath)) {
    if (seen > 3) return { file: null, via: null };
    const next = redirects.get(urlPath);
    let nextPath = next;
    try { nextPath = new URL(next, 'https://horror.zazieproductions.com').pathname; }
    catch { /* leave malformed redirect target for the resolver to reject */ }
    const resolved = resolvePath(nextPath, seen + 1);
    return { file: resolved.file, via: next, redirected: true };
  }
  return { file: resolveFile(urlPath), via: null, redirected: false };
}

const idCache = new Map();
function idsOf(rel) {
  if (idCache.has(rel)) return idCache.get(rel);
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  const ids = new Set();
  for (const match of html.matchAll(/\s(?:id|name)="([^"]+)"/g)) ids.add(decode(match[1]));
  idCache.set(rel, ids);
  return ids;
}

const ATTR = /<a\b[^>]*?\shref="([^"]*)"[^>]*>|<(?:img|source|video|audio|track|iframe|link|script)\b[^>]*?\s(?:src|href)="([^"]*)"|<(?:img|source)\b[^>]*?\ssrcset="([^"]*)"/gi;

/** Every URL candidate in a srcset: "url 640w, url2 1200w". */
function srcsetUrls(value) {
  return value
    .split(',')
    .map((candidate) => candidate.trim().split(/\s+/)[0])
    .filter(Boolean);
}

/** url(...) references inside a stylesheet, minus data: payloads. */
function cssUrls(text) {
  return [...text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)]
    .map((match) => match[1].trim())
    .filter((value) => value && !/^(?:data:|https?:|#|%23)/i.test(value));
}

/* -------------------------------------------------------------------- audit */

const pages = walk(root);
const broken = [];
const anchors = [];
const noSlash = new Set();
let internal = 0;
let external = 0;
let checked = 0;

for (const abs of pages) {
  const rel = path.relative(root, abs).split(path.sep).join('/');
  const html = fs.readFileSync(abs, 'utf8');
  const pagePath = rel === 'index.html' ? '/' : `/${rel}`;

  const candidates = [];
  for (const match of html.matchAll(ATTR)) {
    if (match[3] !== undefined) {
      for (const url of srcsetUrls(decode(match[3]))) candidates.push(url);
      continue;
    }
    const rawHref = match[1] ?? match[2];
    if (rawHref === undefined) continue;
    candidates.push(decode(rawHref).trim());
  }

  for (const href of candidates) {
    if (!href || href.startsWith('{') || href.startsWith('$')) continue;
    if (/^(?:mailto:|tel:|sms:|javascript:|data:|blob:)/i.test(href)) continue;

    checked += 1;

    // A bare `#fragment` is a link inside the current document: check it here
    // rather than round-tripping through the page's own .html alias redirect.
    if (href.startsWith('#')) {
      internal += 1;
      const fragment = href.slice(1);
      if (fragment && fragment !== 'top' && !idsOf(rel).has(decodeURIComponent(fragment))) {
        anchors.push({ from: pagePath, href, why: `#${fragment} missing on this page` });
      }
      continue;
    }

    let url;
    try {
      url = new URL(href, `https://horror.zazieproductions.com${pagePath}`);
    } catch {
      broken.push({ from: pagePath, href, why: 'unparseable URL' });
      continue;
    }

    if (url.hostname !== 'horror.zazieproductions.com' && url.hostname !== 'www.horror.zazieproductions.com') {
      external += 1;
      continue;
    }

    internal += 1;
    let targetPath = url.pathname;
    try {
      targetPath = decodeURIComponent(targetPath);
    } catch {
      /* leave encoded */
    }

    // A .html alias only links correctly if the clean route exists behind it.
    const { file, redirected } = resolvePath(targetPath);
    if (!file) {
      broken.push({ from: pagePath, href, why: `no file for ${targetPath}` });
      continue;
    }
    if (redirected) {
      noSlash.add(`${pagePath} → ${href}`);
      if (verbose) console.log(`  hop  ${pagePath}: ${href} → ${redirects.get(targetPath)}`);
    }

    // Fragments must exist on the destination document.
    if (url.hash) {
      const fragment = decodeURIComponent(url.hash.slice(1));
      if (fragment && fragment !== 'top') {
        const ids = idsOf(file);
        if (!ids.has(fragment)) anchors.push({ from: pagePath, href, why: `#${fragment} missing on ${file}` });
      }
    }
  }
}

/* --------------------------------------- stylesheet asset references (fonts) */
const stylesheets = fs.readdirSync(root).filter((name) => name.endsWith('.css'));
for (const name of stylesheets) {
  const css = fs.readFileSync(path.join(root, name), 'utf8');
  for (const url of cssUrls(css)) {
    checked += 1;
    internal += 1;
    const target = url.startsWith('/') ? url : path.posix.join('/', url);
    if (!resolveFile(target)) broken.push({ from: `/${name}`, href: `url(${url})`, why: `no file for ${target}` });
  }
}

/* ------------------------------------------------------------------- report */

console.log(`Checked ${checked} links across ${pages.length} HTML files.`);
console.log(`  internal: ${internal}   external/ignored: ${external}`);
if (noSlash.size) console.log(`  ${noSlash.size} link(s) point at a .html alias and rely on a 301 hop`);
if (verbose) for (const row of noSlash) console.log(`  hop  ${row}`);

if (anchors.length) {
  console.log(`\n${anchors.length} anchor(s) point at a missing id:`);
  for (const row of anchors.slice(0, 40)) console.log(`  ✗ ${row.from}: ${row.href} — ${row.why}`);
}

if (broken.length) {
  console.log(`\n${broken.length} broken internal link(s):`);
  for (const row of broken.slice(0, 80)) console.log(`  ✗ ${row.from}: ${row.href} — ${row.why}`);
  if (broken.length > 80) console.log(`  … ${broken.length - 80} more`);
  process.exitCode = 1;
} else {
  console.log('\nPASS — every internal link and fragment resolves to a real file.');
}

if (anchors.length) process.exitCode = 1;
