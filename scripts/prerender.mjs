#!/usr/bin/env node
/**
 * scripts/prerender.mjs
 * ----------------------------------------------------------------------------
 * Writes one flat HTML file per production, cue and store item:
 *
 *   work/<slug>.html     served by the host at /work/<slug>
 *   reel/<slug>.html     served by the host at /reel/<slug>
 *   store/<slug>.html    served by the host at /store/<slug>
 *
 * Flat files, not directories: the host answers the extensionless path from
 * `<route>.html` directly, so /work/expire is a 200 with no redirect hop and
 * there is no /work/expire/ twin for a crawler to find. The 19 routes that
 * already existed keep their existing shape (`<route>/index.html` plus the root
 * `<route>.html` twin) and are not touched by this script.
 *
 * The document is built by src/lib/page.ts (compiled to build/lib/page.js) from
 * src/data/*.ts, with the same masthead, footer and stylesheet the rest of the
 * archive uses. The <head> of every page is written here, in the first byte:
 * title, meta description, self-referential canonical, robots, Open Graph,
 * Twitter and the per-type JSON-LD. Nothing about a URL on this site is ever
 * injected by JavaScript.
 *
 * It then verifies itself:
 *
 *   * every route in src/data/routes.ts resolves to a file the host can serve
 *     at that exact path (hub routes -> <path>/index.html + root twin, item
 *     routes -> <hub>/<slug>.html);
 *   * every generated page carries exactly one title, canonical, robots meta,
 *     og/twitter set and JSON-LD block, and the canonical points at the page's
 *     own URL;
 *   * the page body really contains its H1, its intro paragraph and a
 *     <noscript> fallback, so nothing on the page depends on JavaScript.
 *
 * Usage:
 *   node scripts/prerender.mjs                 all item routes
 *   node scripts/prerender.mjs --only=expire   one item, for design review
 *   node scripts/prerender.mjs --only=/work/expire,/reel/needle-in-the-nerve
 */

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { hubs } from '../build/data/hubs.js';
import { allRoutes, items } from '../build/data/routes.js';
import * as site from '../build/data/site.js';
import { renderHomePosterCards, renderHomeSeo } from '../build/lib/home.js';
import { renderItemPage } from '../build/lib/page.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { url, SITE_HOST } = site;

/* -------------------------------------------------------- build environment */

function readChrome() {
  const mastheadFile = path.join(repoRoot, 'legal-src', 'partials', 'masthead.html');
  const footerFile = path.join(repoRoot, 'legal-src', 'partials', 'footer.html');
  for (const file of [mastheadFile, footerFile]) {
    if (!fs.existsSync(file)) {
      console.error(`prerender: ${path.relative(repoRoot, file)} is missing - the masthead and footer are shared with the hub pages, not copied.`);
      process.exit(1);
    }
  }

  const manifestFile = path.join(repoRoot, 'build', 'item-assets', 'item-manifest.json');
  if (!fs.existsSync(manifestFile)) {
    console.error('prerender: build/item-assets/item-manifest.json is missing - run `npx vite build` first (npm run build does it in order).');
    process.exit(1);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const entry = Object.values(manifest).find((record) => record.isEntry);
  const stylesheet = Object.values(manifest).find((record) => record.file?.endsWith('.css'));
  if (!entry?.file || !stylesheet?.file) {
    console.error('prerender: the item manifest has no entry script or stylesheet - rerun `npx vite build`.');
    process.exit(1);
  }
  for (const asset of [entry.file, stylesheet.file]) {
    if (!fs.existsSync(path.join(repoRoot, asset))) {
      console.error(`prerender: ${asset} is absent from the served root - Vite must export the item bundle assets before rendering pages.`);
      process.exit(1);
    }
  }

  // The documents stylesheet is content-hashed from its source, so the name is
  // derived rather than typed: same hash function as legal-src/build.sh.
  const legalCss = namedAsset('legal', 'legal.css', 'css');
  const legalJs = namedAsset('legal', 'legal.js', 'js');

  return {
    masthead: fs.readFileSync(mastheadFile, 'utf8'),
    footer: fs.readFileSync(footerFile, 'utf8'),
    legalCss,
    legalJs,
    itemCss: stylesheet.file,
    itemJs: entry.file,
  };
}

function namedAsset(prefix, source, extension) {
  // build.sh hashes "$(cat file)": the shell strips trailing newlines before
  // sha256sum sees the content, so the same strip has to happen here.
  const body = fs.readFileSync(path.join(repoRoot, 'legal-src', source), 'utf8').replace(/\n+$/, '');
  // Same 8-hex-character content hash legal-src/build.sh uses (sha256sum | cut -c1-8).
  const hash = createHash('sha256').update(body).digest('hex').slice(0, 8);
  const expected = `${prefix}-${hash}.${extension}`;
  if (!fs.existsSync(path.join(repoRoot, expected))) {
    const present = fs
      .readdirSync(repoRoot)
      .filter((name) => name.startsWith(`${prefix}-`) && name.endsWith(`.${extension}`));
    console.error(
      `prerender: expected ${expected} (sha256 of legal-src/${source}) but only found ${present.join(', ') || 'nothing'}.\n` +
        '           Run ./legal-src/build.sh - the pages must not point at a stale asset name.',
    );
    process.exit(1);
  }
  return expected;
}

/* ------------------------------------------------------------------ writing */

const SEO_START = '<!--SEO:START-->';
const SEO_END = '<!--SEO:END-->';
const HOME_POSTERS_START = '<!--HOME-POSTERS:START-->';
const HOME_POSTERS_END = '<!--HOME-POSTERS:END-->';

function replaceMarkedContents(html, startMarker, endMarker, replacement, label) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`index.html is missing a matching ${label} marker pair`);
  }
  const contentStart = start + startMarker.length;
  return html.slice(0, contentStart) + '\n' + replacement + '\n' + html.slice(end);
}

/**
 * Replace the homepage's complete <head> element from the source template.
 * Keeping only non-SEO resources from the old head preserves the current boot
 * and player treatments; every title/description/canonical/robots/OG/Twitter
 * tag and every JSON-LD block is then rebuilt together from home data.
 */
function buildHomeDocument() {
  const indexFile = path.join(repoRoot, 'index.html');
  let html = fs.readFileSync(indexFile, 'utf8');
  const start = html.indexOf(SEO_START);
  const end = html.indexOf(SEO_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error('index.html must wrap its complete <head> with <!--SEO:START--> and <!--SEO:END-->');
  }

  const contentStart = start + SEO_START.length;
  const markedHead = html.slice(contentStart, end).trim();
  if (!/^<head\b/i.test(markedHead) || !/<\/head>\s*$/i.test(markedHead)) {
    throw new Error('index.html SEO markers must enclose one complete <head>...</head>');
  }

  let templateHead = markedHead;
  templateHead = templateHead.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '');
  templateHead = templateHead.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
  templateHead = templateHead.replace(/<meta\b[^>]*>/gi, (tag) => {
    const name = /\bname\s*=\s*(["'])(.*?)\1/i.exec(tag)?.[2]?.toLowerCase() ?? '';
    const property = /\bproperty\s*=\s*(["'])(.*?)\1/i.exec(tag)?.[2]?.toLowerCase() ?? '';
    if (name === 'description' || name === 'robots' || name === 'author' || name.startsWith('twitter:')) return '';
    if (property.startsWith('og:')) return '';
    return tag;
  });
  templateHead = templateHead.replace(/<link\b[^>]*>/gi, (tag) => /\brel\s*=\s*(["'])canonical\1/i.test(tag) ? '' : tag);
  templateHead = templateHead.replace(/<!--[\s\S]*?-->/g, (comment) =>
    /JSON-LD|STRUCTURED DATA/i.test(comment) ? '' : comment,
  );
  const close = templateHead.lastIndexOf('</head>');
  if (close === -1) throw new Error('index.html source head lost its </head> while rebuilding');
  const fullHead = `${templateHead.slice(0, close).trimEnd()}\n${renderHomeSeo()}\n</head>`;
  html = replaceMarkedContents(html, SEO_START, SEO_END, fullHead, 'SEO');
  html = replaceMarkedContents(html, HOME_POSTERS_START, HOME_POSTERS_END, renderHomePosterCards(), 'home-poster');
  fs.writeFileSync(indexFile, html, 'utf8');
  console.log('prerender: replaced the complete homepage <head> from src/lib/home.ts + home entities');
  console.log('prerender: rendered 9 curated poster-wall cards from src/data/home.ts + productions.ts');
}
const chrome = readChrome();
const only = process.argv
  .filter((argument) => argument.startsWith('--only='))
  .flatMap((argument) => argument.slice('--only='.length).split(','))
  .map((value) => value.trim())
  .filter(Boolean);

if (!only.length) buildHomeDocument();

const targets = only.length
  ? items.filter((item) => only.includes(item.path) || only.includes(item.slug))
  : items;

if (!targets.length) {
  console.error(`prerender: --only matched no item route (${only.join(', ')})`);
  process.exit(1);
}

const written = [];
for (const item of targets) {
  const page = renderItemPage(item, chrome);
  const file = path.join(repoRoot, `${item.path.slice(1)}.html`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, page.html, 'utf8');
  written.push({ item, file, page });
}

/* ------------------------------------------------------------- verification */

const problems = [];

/**
 * The file the host serves for a path. Hub routes are directories
 * (/work -> work/index.html); item routes are flat files
 * (/work/expire -> work/expire.html) and are never directories.
 */
const routeByPath = new Map(allRoutes.map((route) => [route.path, route]));
const routeList = allRoutes;
const sitemapFile = path.join(repoRoot, 'sitemap.xml');
const sitemapXml = fs.existsSync(sitemapFile) ? fs.readFileSync(sitemapFile, 'utf8') : '';
const sitemapLocs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replace(/&amp;/g, '&'));
const seenSitemapUrls = new Set();
for (const loc of sitemapLocs) {
  try {
    const parsed = new URL(loc);
    if (parsed.protocol !== 'https:' || parsed.host !== SITE_HOST) problems.push(`sitemap: off-domain or non-HTTPS URL ${loc}`);
    if (parsed.search || parsed.hash || (parsed.pathname !== '/' && parsed.pathname.endsWith('/'))) problems.push(`sitemap: non-canonical URL ${loc}`);
    if (seenSitemapUrls.has(loc)) problems.push(`sitemap: duplicate URL ${loc}`);
    seenSitemapUrls.add(loc);
    if (!routeByPath.has(parsed.pathname)) problems.push(`sitemap: ${parsed.pathname} has no data route`);
  } catch {
    problems.push(`sitemap: malformed URL ${loc}`);
  }
}
if (!sitemapLocs.length) problems.push('sitemap.xml is missing or has no <loc> entries');
const expectedSitemapUrls = new Set(routeList.map((route) => url(route.path)));
for (const expected of expectedSitemapUrls) if (!seenSitemapUrls.has(expected)) problems.push(`sitemap: missing expected route ${expected}`);
for (const actual of seenSitemapUrls) if (!expectedSitemapUrls.has(actual)) problems.push(`sitemap: unexpected route ${actual}`);

/** Resolve an existing hub document or a generated flat item file. */
function fileForRoute(route) {
  if (route.path === '/') return path.join(repoRoot, 'index.html');
  if (route.kind === 'hub') {
    const indexFile = path.join(repoRoot, route.path.slice(1), 'index.html');
    if (fs.existsSync(indexFile)) return indexFile;
    const flatHub = path.join(repoRoot, `${route.path.slice(1)}.html`);
    return fs.existsSync(flatHub) ? flatHub : null;
  }
  const flatFile = path.join(repoRoot, `${route.path.slice(1)}.html`);
  return fs.existsSync(flatFile) ? flatFile : null;
}

let resolved = 0;
const missingFiles = [];
const writtenPaths = new Set(written.map(({ item }) => item.path));
for (const loc of sitemapLocs) {
  let route;
  try { route = routeByPath.get(new URL(loc).pathname); } catch { continue; }
  if (!route) continue;
  const file = fileForRoute(route);
  if (!file) {
    if (only.length && route.kind !== 'home' && route.kind !== 'hub' && !writtenPaths.has(route.path)) continue;
    missingFiles.push(route.path);
    problems.push(`${route.path}: no prerendered file resolves this sitemap URL`);
    continue;
  }
  resolved += 1;
  const html = fs.readFileSync(file, 'utf8');
  const titleCount = [...html.matchAll(/<title>/gi)].length;
  const canonicalTags = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"/gi)];
  const descriptionTags = [...html.matchAll(/<meta\b(?=[^>]*\bname=["']description["'])(?=[^>]*\bcontent=["'][^"']+["'])[^>]*>/gi)];
  const robots = /<meta\s+name="robots"\s+content="([^"]*)"/i.exec(html)?.[1] ?? '';
  const expected = url(route.path);
  if (titleCount !== 1) problems.push(`${route.path}: expected one <title>, found ${titleCount}`);
  if (descriptionTags.length !== 1) problems.push(`${route.path}: expected one meta description, found ${descriptionTags.length}`);
  if (canonicalTags.length !== 1) problems.push(`${route.path}: expected one canonical, found ${canonicalTags.length}`);
  else if (canonicalTags[0][1] !== expected) problems.push(`${route.path}: canonical is ${canonicalTags[0][1]}, expected ${expected}`);
  if (!robots || /\bnoindex\b/i.test(robots) || !/\bindex\b/i.test(robots)) problems.push(`${route.path}: robots meta is missing or not indexable`);
  if (!html.includes(`content="${expected}"`)) problems.push(`${route.path}: canonical / OG URL is missing from source HTML`);
  if (!/<meta\s+name="twitter:card"/i.test(html)) problems.push(`${route.path}: twitter card is missing`);
  if (!/<script\s+type="application\/ld\+json"/i.test(html)) problems.push(`${route.path}: JSON-LD is missing`);
  if (/(?:href|src)="#"/.test(html)) problems.push(`${route.path}: contains a placeholder "#" link`);
}

for (const { item, file, page } of written) {
  const html = page.html;
  const relative = path.relative(repoRoot, file);
  const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
  if (!head.startsWith('<head>')) problems.push(`${relative}: metadata is not inside the source-rendered head`);
  if (!head.includes(`<title>${site.escapeHtml(site.oneLine(item.title))}</title>`)) problems.push(`${relative}: title does not match the route data`);
  if (!head.includes(`<link rel="canonical" href="${url(item.path)}"/>`)) problems.push(`${relative}: canonical is not self-referential`);
  if ((html.match(/<h1(?:\s|>)/gi) ?? []).length !== 1) problems.push(`${relative}: expected exactly one H1`);
  if (!html.includes('<noscript>')) problems.push(`${relative}: no <noscript> fallback`);
  const noscript = /<noscript>([\s\S]*?)<\/noscript>/i.exec(html)?.[1] ?? '';
  if (!noscript.includes(item.description)) problems.push(`${relative}: noscript description is missing`);
  if (/<h1\b/i.test(noscript)) problems.push(`${relative}: noscript block adds a second H1`);
  if (!/<\/html>\s*$/.test(html)) problems.push(`${relative}: document is not terminated`);
  if (/\/tmp\/|arena|e2b|localhost/i.test(html)) problems.push(`${relative}: contains a sandbox-only path`);
  if (/<div[^>]+id="zp-boot"/i.test(html)) problems.push(`${relative}: boot overlay must not cover item-page copy`);
}

if (missingFiles.length) console.error(`prerender missing-file report: ${missingFiles.join(', ')}`);
else console.log(`prerender missing-file report: none; ${resolved} sitemap URLs resolve to prerendered files`);

if (problems.length) {
  console.error(`prerender: ${problems.length} problem(s)\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

const counts = items.reduce((accumulator, item) => ({ ...accumulator, [item.kind]: (accumulator[item.kind] ?? 0) + 1 }), {});
console.log(
  `prerender: wrote ${written.length} item page(s) - ` +
    `${counts.production ?? 0} productions, ${counts.cue ?? 0} cues, ${counts.release ?? 0} store items`,
);
if (only.length) console.log(`  design-review run: only ${written.map(({ item }) => item.path).join(', ')} written`);
console.log(
  `${sitemapLocs.length} URLs, ${resolved} resolve to prerendered files ` +
    `(${hubs.length} hub routes incl. the home page, ${items.length} item routes)`,
);
console.log(
  `  every page: own <title>, meta description, self-referential canonical on ${SITE_HOST}, robots, OG + Twitter tags and JSON-LD in the first byte`,
);
for (const { item, file } of written) console.log(`  ${item.path}  ->  ${path.relative(repoRoot, file)}`);
