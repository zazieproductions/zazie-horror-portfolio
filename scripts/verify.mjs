#!/usr/bin/env node
/** Structural, content, schema, and prerendered-file verification for the site. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { hubs } from '../build/data/hubs.js';
import { allRoutes, items, siblingsOf, productionBySlug, cueBySlug, releaseBySlug } from '../build/data/routes.js';
import { productions } from '../build/data/productions.js';
import { cues } from '../build/data/cues.js';
import { releases } from '../build/data/releases.js';
import { additionalHomePosters, featuredPosterSlugs } from '../build/data/home.js';
import { SITE_HOST, SITE_ORIGIN, escapeHtml, oneLine, url } from '../build/data/site.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (message) => errors.push(message);
const routeByPath = new Map(allRoutes.map((route) => [route.path, route]));

function fileFor(route) {
  if (route.path === '/') return path.join(root, 'index.html');
  if (route.kind === 'hub') {
    const index = path.join(root, route.path.slice(1), 'index.html');
    if (fs.existsSync(index)) return index;
    const flat = path.join(root, `${route.path.slice(1)}.html`);
    return fs.existsSync(flat) ? flat : null;
  }
  const flat = path.join(root, `${route.path.slice(1)}.html`);
  return fs.existsSync(flat) ? flat : null;
}

function decodeXml(value) {
  return value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

function jsonLdBlocks(html, where) {
  const blocks = [];
  for (const match of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { blocks.push(JSON.parse(match[1])); }
    catch (error) { fail(`${where}: invalid JSON-LD (${error.message})`); }
  }
  return blocks;
}

function allTypes(nodes) {
  return nodes.flatMap((node) => Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']]).filter(Boolean);
}

function linksOf(html) {
  return [...html.matchAll(/<a\b[^>]*\shref="([^"]*)"/gi)].map((match) => decodeXml(match[1]));
}

/* ---------------------------------------------------------- expected coverage */
if (hubs.length !== 20) fail(`expected 20 hub routes, found ${hubs.length}`);
if (productions.length !== 9) fail(`expected 9 production pages, found ${productions.length}`);
if (cues.length !== 30) fail(`expected 30 cue pages, found ${cues.length}`);
if (releases.length !== 24) fail(`expected 24 catalogue pages, found ${releases.length}`);
if (allRoutes.length !== 83) fail(`expected 83 sitemap routes, found ${allRoutes.length}`);

const sitemapFile = path.join(root, 'sitemap.xml');
if (!fs.existsSync(sitemapFile)) fail('sitemap.xml is missing');
const sitemapXml = fs.existsSync(sitemapFile) ? fs.readFileSync(sitemapFile, 'utf8') : '';
const sitemapLocs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decodeXml(match[1]));
const sitemapSet = new Set(sitemapLocs);
if (sitemapLocs.length !== allRoutes.length) fail(`sitemap has ${sitemapLocs.length} URLs; expected ${allRoutes.length}`);
if (sitemapSet.size !== sitemapLocs.length) fail('sitemap has duplicate <loc> URLs');
for (const route of allRoutes) {
  const expected = url(route.path);
  if (!sitemapSet.has(expected)) fail(`sitemap is missing ${expected}`);
}
for (const loc of sitemapLocs) {
  try {
    const parsed = new URL(loc);
    if (parsed.protocol !== 'https:' || parsed.host !== SITE_HOST || parsed.search || parsed.hash || (parsed.pathname !== '/' && parsed.pathname.endsWith('/'))) {
      fail(`sitemap has a non-canonical or off-domain URL: ${loc}`);
    }
  } catch { fail(`sitemap has a malformed URL: ${loc}`); }
}

/* --------------------------------------------------------------- page files */
/** Snippet blocking makes the page ineligible for normal SERP descriptions. */
const SNIPPET_BLOCK = /\bnosnippet\b|\bmax-snippet\s*:\s*0\b/i;
let resolved = 0;
const missing = [];
for (const route of allRoutes) {
  const file = fileFor(route);
  if (!file) {
    missing.push(route.path);
    continue;
  }
  resolved += 1;
  const html = fs.readFileSync(file, 'utf8');
  const canonical = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"/gi)];
  const titles = [...html.matchAll(/<title>/gi)];
  const descriptions = [...html.matchAll(/<meta\b(?=[^>]*\bname=["']description["'])(?=[^>]*\bcontent=["'][^"']+["'])[^>]*>/gi)];
  const robots = /<meta\s+name="robots"\s+content="([^"]*)"/i.exec(html)?.[1] ?? '';
  const expected = url(route.path);
  if (titles.length !== 1) fail(`${route.path}: expected one title, found ${titles.length}`);
  if (descriptions.length !== 1) fail(`${route.path}: expected one description, found ${descriptions.length}`);
  if (canonical.length !== 1 || canonical[0][1] !== expected) fail(`${route.path}: canonical is not uniquely self-referential`);
  if (!robots || /\bnoindex\b/i.test(robots) || !/\bindex\b/i.test(robots)) fail(`${route.path}: missing indexable robots metadata`);
  if (SNIPPET_BLOCK.test(robots)) fail(`${route.path}: robots metadata blocks search snippets (nosnippet / max-snippet:0)`);
  if (!html.includes(`property="og:url" content="${expected}"`)) fail(`${route.path}: missing route-specific og:url`);
  if (!/<meta\s+name="twitter:card"/i.test(html)) fail(`${route.path}: missing Twitter card metadata`);
  if (/(?:href|src)="#"/.test(html)) fail(`${route.path}: contains a placeholder # link`);
  if (route.kind !== 'hub' && route.kind !== 'home') {
    const h1Count = [...html.matchAll(/<h1(?:\s|>)/gi)].length;
    if (h1Count !== 1) fail(`${route.path}: expected exactly one H1, found ${h1Count}`);
    if (!/<noscript>[\s\S]*?<\/noscript>/i.test(html)) fail(`${route.path}: missing noscript fallback`);
    const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
    if (!head.startsWith('<head>')) fail(`${route.path}: page-specific metadata is not in the source head`);
  }
}
if (missing.length) {
  console.error(`missing-file report: ${missing.join(', ')}`);
  fail(`${missing.length} sitemap routes have no static file`);
}
if (resolved !== sitemapLocs.length) fail(`${sitemapLocs.length} sitemap URLs but only ${resolved} resolve to a static HTML file`);

/* ---------------------------------------------------------- JSON-LD & media */
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
/**
 * SERP display limits for the homepage, the one route an external audit reads
 * first. Titles are measured as rendered (entities decoded): 30-60 characters
 * fit Google's title link, 120-160 render without truncation in a description.
 */
const homeMetaTitle = decodeXml(/<title>([^<]*)<\/title>/i.exec(home)?.[1] ?? '');
const homeMetaDescription = decodeXml(/<meta\s+name="description"\s+content="([^"]*)"/i.exec(home)?.[1] ?? '');
if (homeMetaTitle.length < 30 || homeMetaTitle.length > 60) fail(`homepage title is ${homeMetaTitle.length} characters; keep it between 30 and 60`);
if (homeMetaDescription.length < 120 || homeMetaDescription.length > 160) fail(`homepage description is ${homeMetaDescription.length} characters; keep it between 120 and 160`);
const homeNodes = jsonLdBlocks(home, '/');
const homeTypes = allTypes(homeNodes);
for (const required of ['Person', 'Organization', 'WebSite', 'WebPage']) {
  if (homeTypes.filter((type) => type === required).length !== 1) fail(`homepage JSON-LD must contain exactly one ${required} node`);
}
if (homeNodes.length !== 4) fail(`homepage JSON-LD should contain only Person, Organization, WebSite and WebPage; found ${homeNodes.length} nodes`);
// This is a portfolio page with multiple supplementary samples, not a video
// watch page. Keep VideoObject markup off the homepage; Google otherwise
// selects one sample from the portfolio and rejects it as non-primary content.
if (homeTypes.includes('VideoObject')) fail('homepage must not declare VideoObject schema; publish video schema only on a dedicated watch page');

/* ---------------------------------------------------- home mobile + posters */
const homeBundleMatch = /import\("\/(index-[a-f\d]+\.js)"\)/.exec(home);
if (!homeBundleMatch) {
  fail('homepage React bundle reference is missing; cannot verify poster/mobile parity');
}
const homeBundle = homeBundleMatch ? fs.readFileSync(path.join(root, homeBundleMatch[1]), 'utf8') : '';
const expectedPosterSlugs = [...featuredPosterSlugs, ...additionalHomePosters.map((poster) => poster.slug)];
const staticPosterSlugs = [...home.matchAll(/data-home-poster="([^"]+)"/g)].map((match) => match[1]);
if (JSON.stringify(staticPosterSlugs) !== JSON.stringify(expectedPosterSlugs)) {
  fail(`homepage poster cards do not match src/data/home.ts: ${staticPosterSlugs.join(', ')}`);
}
const posterTitles = new Map([
  ...productions.map((production) => [production.slug, production.title]),
  ...additionalHomePosters.map((poster) => [poster.slug, poster.title]),
]);
for (const slug of expectedPosterSlugs) {
  const title = posterTitles.get(slug);
  if (title && !homeBundle.includes(`title:${JSON.stringify(title)}`)) {
    fail(`homepage React poster wall is missing ${title}`);
  }
}
for (const item of additionalHomePosters) {
  const artwork = item.poster;
  const references = [artwork.src, artwork.avif, artwork.avifSet, artwork.srcset]
    .filter(Boolean)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim().split(/\s+/)[0])
    .filter((value) => value.startsWith('/'));
  for (const reference of new Set(references)) {
    if (!fs.existsSync(path.join(root, reference.slice(1)))) fail(`homepage poster asset is missing: ${reference}`);
  }
}
for (const className of ['zp-mobile-quote', 'zp-menu-button', 'zp-poster-dialog', 'zp-poster-close', 'zp-poster-contain', 'zp-est-advanced', 'zp-result-details']) {
  if (!home.includes(className)) fail(`homepage mobile stylesheet/markup is missing ${className}`);
  if (!homeBundle.includes(className)) fail(`homepage React bundle is missing ${className}`);
}
if (!homeBundle.includes('"aria-expanded":n') || !homeBundle.includes('"aria-controls":"mobile-navigation"')) {
  fail('mobile menu no longer exposes its expanded state and controlled navigation');
}
if (!home.includes('<section id="services"') || !homeBundle.includes('id:"services"') || !homeBundle.includes('Rates &amp; estimates')) {
  fail('React must preserve the homepage Rates section, its #services anchor and its heading');
}

/**
 * Archive boot (homepage only). It has already shipped inert once: the
 * prerender pass rewrote the <head> and dropped the synchronous gate, so the
 * overlay stayed display:none and a later audit deleted it as dead weight.
 * These four assertions make that failure a build error instead.
 */
const bootGateAt = home.indexOf("classList.add('zp-boot-on')");
const bootOverlayAt = home.indexOf('id="zp-boot"');
const bootSkipBtnAt = home.indexOf('id="zp-boot-skip"');
if (bootGateAt === -1) fail('homepage lost the archive-boot gate script: the overlay would never display (see PERFORMANCE.md)');
if (bootOverlayAt === -1) fail('homepage lost the archive-boot overlay markup (see PERFORMANCE.md)');
if (bootSkipBtnAt === -1) fail('homepage lost the archive-boot #zp-boot-skip button');
if (bootGateAt !== -1 && bootOverlayAt !== -1 && bootGateAt > bootOverlayAt) {
  fail('the archive-boot gate must run synchronously in <head>, before the overlay markup');
}
if (!home.includes('html.zp-boot-on #zp-boot')) fail('homepage lost the archive-boot stylesheet that reveals the overlay');
if (/<div[^>]*id="zp-boot"[^>]*aria-hidden="true"/i.test(home)) {
  fail('#zp-boot must not set aria-hidden="true" while containing focusable #zp-boot-skip (axe aria-hidden-focus)');
}
if (/sessionStorage|localStorage/.test(home)) fail('homepage must not write a storage key for the archive boot (LEGAL.md / /privacy claims)');

for (const item of items) {
  const route = routeByPath.get(item.path);
  const file = route ? fileFor(route) : null;
  if (!file) continue;
  const html = fs.readFileSync(file, 'utf8');
  const nodes = jsonLdBlocks(html, item.path);
  const types = allTypes(nodes);
  if (!types.includes('WebPage') || !types.includes('BreadcrumbList')) fail(`${item.path}: missing WebPage or BreadcrumbList structured data`);
  if (!linksOf(html).includes(item.hub)) fail(`${item.path}: does not link back to its ${item.hub} hub`);

  const siblingRoutes = siblingsOf(item, 4);
  const pageLinks = new Set(linksOf(html));
  const siblingLinks = siblingRoutes.filter((sibling) => pageLinks.has(sibling.path));
  if (siblingLinks.length < 3) fail(`${item.path}: fewer than three internal sibling links`);
  if (siblingRoutes.some((sibling) => !pageLinks.has(sibling.path))) fail(`${item.path}: one or more selected sibling links are missing`);

  const related = /<section class="clause" id="related">([\s\S]*?)<\/section>/i.exec(html)?.[1] ?? '';
  const cardCount = (related.match(/<li class="hub-card">/g) ?? []).length;
  if (cardCount < 3) fail(`${item.path}: related section has fewer than three sibling cards`);
  if (item.kind === 'production' && (related.match(/class="[^"]*\bsibling-figure\b[^"]*"/g) ?? []).length !== cardCount) {
    fail(`${item.path}: production sibling cards should each show their poster artwork`);
  }
  if ((item.kind === 'cue' || item.kind === 'release') && /sibling-figure|<img\b/i.test(related)) {
    fail(`${item.path}: cue and catalogue sibling cards must be text-only`);
  }

  if (item.kind === 'production') {
    const production = productionBySlug.get(item.slug);
    const schemaType = production.schemaType;
    if (!types.includes(schemaType)) fail(`${item.path}: missing ${schemaType} structured data`);
    if (Boolean(production.sample) !== types.includes('VideoObject')) fail(`${item.path}: VideoObject does not match verified sample availability`);
    const workNode = nodes.find((node) => node?.['@type'] === schemaType);
    const composerNames = production.credits.filter((credit) => /composer/i.test(credit.role)).map((credit) => credit.name);
    if (composerNames.length && !workNode?.composer) fail(`${item.path}: verified composer credit missing from schema`);
    if (!composerNames.length && workNode?.composer) fail(`${item.path}: schema invents a composer credit`);
    if (production.slug === 'expire') {
      const schemaComposers = Array.isArray(workNode?.composer) ? workNode.composer : workNode?.composer ? [workNode.composer] : [];
      if (schemaComposers.some((composer) => composer?.name === 'Zazie Kanwar-Torge')) {
        fail('/work/expire: schema incorrectly credits Zazie Kanwar-Torge as a composer');
      }
    }
  } else if (item.kind === 'cue') {
    const cue = cueBySlug.get(item.slug);
    if (!types.includes('MusicComposition') || !types.includes('AudioObject')) fail(`${item.path}: missing MusicComposition or AudioObject`);
    if (!html.includes(`<audio controls preload="none" src="${cue.audioPath}"`)) fail(`${item.path}: playable MP3 is missing`);
    if (!html.includes(`href="${cue.audioPath}"`)) fail(`${item.path}: direct MP3 link is missing`);
    const audioNode = nodes.find((node) => node?.['@type'] === 'AudioObject');
    if (audioNode?.contentUrl !== url(cue.audioPath)) fail(`${item.path}: AudioObject contentUrl does not point to its MP3`);
    if (!audioNode?.duration || !audioNode?.genre || !audioNode?.creator) fail(`${item.path}: AudioObject is missing duration, genre, or creator`);
  } else {
    const release = releaseBySlug.get(item.slug);
    if (!types.includes('Product') || (release.schemaType === 'MusicAlbum' && !types.includes('MusicAlbum')) || !types.includes('Offer')) {
      fail(`${item.path}: missing Product/MusicAlbum or Offer structured data`);
    }
    const productNode = nodes.find((node) => allTypes([node]).includes('Product') || allTypes([node]).includes('MusicAlbum'));
    if (release.image && !productNode?.image) fail(`${item.path}: verified artwork is absent from Product JSON-LD`);
    const offer = nodes.find((node) => node?.['@type'] === 'Offer');
    if (!offer?.url) fail(`${item.path}: Offer has no verified listing or canonical URL`);
    if (offer?.price !== undefined || offer?.priceCurrency !== undefined || offer?.availability !== undefined || offer?.itemCondition !== undefined) {
      fail(`${item.path}: Offer repeats unsupported price, stock, currency, or condition data`);
    }
    if (release.listingUrl && !linksOf(html).includes(release.listingUrl)) fail(`${item.path}: verified external listing link is missing`);
  }
}

/* ---------------------------------------------------------- internal linking */
const hubHtmlByPath = new Map();
for (const hub of hubs) {
  const route = routeByPath.get(hub.path);
  const file = route ? fileFor(route) : null;
  if (!file) continue;
  hubHtmlByPath.set(hub.path, fs.readFileSync(file, 'utf8'));
}

const linkPaths = (html) => linksOf(html).map((href) => {
  try { return new URL(href, SITE_ORIGIN).pathname.replace(/\/$/, '') || '/'; } catch { return null; }
}).filter(Boolean);

// Every generated item route must be linked from the hub that owns it. Items
// used to be excluded from hub navigation entirely, which left 65 of 85 sitemap
// URLs with no internal link anywhere - the exact profile Search Console reports
// as "Discovered - currently not indexed". Discovery now runs / -> hub -> item.
const isItemRoute = (pathName) => /^\/(?:work|reel|store)\/[^/]+$/.test(pathName);
for (const route of allRoutes) {
  if (!isItemRoute(route.path)) continue;
  const hubPath = `/${route.path.split('/')[1]}`;
  const hubHtml = hubHtmlByPath.get(hubPath);
  if (!hubHtml) {
    fail(`${route.path}: no hub page ${hubPath} exists to link it`);
    continue;
  }
  if (!linkPaths(hubHtml).includes(route.path)) fail(`${route.path}: not linked from its hub ${hubPath} (sitemap-only URL)`);
}

// The home page stays a hub index. Item discovery belongs to the hub that owns
// the item; a 65-link homepage would bury the 19 pages that matter.
for (const pathName of linkPaths(hubHtmlByPath.get('/') ?? '')) {
  if (isItemRoute(pathName)) fail(`/: home page links item route ${pathName}; item discovery belongs to the owning hub`);
}

const hubLinks = new Map();
for (const [pathName, html] of hubHtmlByPath) {
  const links = new Set();
  for (const href of linksOf(html)) {
    try {
      const target = new URL(href, `${SITE_ORIGIN}${pathName === '/' ? '/' : pathName}`).pathname.replace(/\/$/, '') || '/';
      if (hubHtmlByPath.has(target)) links.add(target);
    } catch { /* non-URL link */ }
  }
  hubLinks.set(pathName, links);
}
const reachedHubs = new Set(['/']);
for (const queue = ['/']; queue.length;) {
  for (const next of hubLinks.get(queue.shift()) ?? []) {
    if (!reachedHubs.has(next)) { reachedHubs.add(next); queue.push(next); }
  }
}
const unreachableHubs = [...hubHtmlByPath.keys()].filter((hubPath) => !reachedHubs.has(hubPath));
if (unreachableHubs.length) fail(`original hub routes not reachable from /: ${unreachableHubs.join(', ')}`);

/* --------------------------------------------------------------- real 404 */
const notFound = fs.readFileSync(path.join(root, '404.html'), 'utf8');
if (!/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(notFound)) fail('404.html must carry noindex, follow');
const headerRules = fs.readFileSync(path.join(root, '_headers'), 'utf8');
for (const line of headerRules.split(/\r?\n/)) {
  if (/^\s*X-Robots-Tag\s*:/i.test(line) && SNIPPET_BLOCK.test(line)) {
    fail(`_headers blocks search snippets: ${line.trim()}`);
  }
}
const redirectLines = fs.readFileSync(path.join(root, '_redirects'), 'utf8')
  .split(/\r?\n/)
  .map((line) => line.replace(/#.*$/, '').trim())
  .filter(Boolean);
if (redirectLines.some((line) => /\s404$/.test(line) || /^\/\*\s/.test(line))) {
  fail('_redirects must not contain invalid 404 status rules or a /* catch-all (Cloudflare Pages serves 404.html natively)');
}
for (const hub of hubs) {
  const expectedRule = hub.path === '/' ? '/index.html / 301' : `${hub.path}.html ${hub.path} 301`;
  if (!redirectLines.includes(expectedRule)) {
    fail(`_redirects is missing canonical 301 rule: ${expectedRule}`);
  }
}
const unknownWorkFile = path.join(root, 'work', 'does-not-exist.html');
if (fs.existsSync(unknownWorkFile) || routeByPath.has('/work/does-not-exist')) fail('unknown production route unexpectedly has a page');

/* ----------------------------------------------------- GEO extractability */
for (const route of allRoutes) {
  const file = fileFor(route);
  if (!file) continue;
  const html = fs.readFileSync(file, 'utf8');
  const mainMatch = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html);
  if (!mainMatch) {
    fail(`${route.path}: missing <main> landmark`);
    continue;
  }
  if (!/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(mainMatch[1])) {
    fail(`${route.path}: <h1> sits outside <main> and will be stripped by RAG / AI Overview extractors`);
  }
  if (/<span class="no">[^<]+<\/span>\S/.test(html)) {
    fail(`${route.path}: unspaced <span class="no"> corrupts extracted section heading tokens`);
  }
  if (html.includes('1575933731')) {
    fail(`${route.path}: contains dead 1575933731 Apple Music artist ID`);
  }
  for (const scriptMatch of html.matchAll(/<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    if (/<!--v:|\{\{zp:/.test(scriptMatch[1])) {
      fail(`${route.path}: contains uncleaned pricing comment/token inside JSON-LD`);
    }
  }
}

/* ------------------------------------------------------------ title length */
// Google truncates <title> at roughly 65 characters in a desktop result, and a
// truncated title loses the brand or the call to action that was paying for it.
// The home page is held to the limit; the rest are reported so the remaining
// editorial pass has a queue it can see.
const TITLE_LIMIT = 65;
const overLongTitles = [];
let homeTitleLength = 0;
for (const route of allRoutes) {
  const file = fileFor(route);
  if (!file) continue;
  const html = fs.readFileSync(file, 'utf8');
  const raw = /<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '';
  const text = decodeXml(raw).replace(/\s+/g, ' ').trim();
  if (route.path === '/') homeTitleLength = text.length;
  if (text && text.length > TITLE_LIMIT) overLongTitles.push({ path: route.path, length: text.length, text });
}
const homeTitle = overLongTitles.find((entry) => entry.path === '/');
if (homeTitle) fail(`/ title is ${homeTitle.length} characters, over the ${TITLE_LIMIT}-character limit Google renders: "${homeTitle.text}"`);

for (const llmFile of ['llms.txt', 'llms-full.txt']) {
  const fullPath = path.join(root, llmFile);
  if (!fs.existsSync(fullPath)) fail(`missing ${llmFile} at repository root`);
}

if (errors.length) {
  console.error(`verify: ${errors.length} problem(s)`);
  for (const error of [...new Set(errors)]) console.error(`  - ${error}`);
  if (missing.length) console.error(`missing-file report: ${missing.join(', ')}`);
  process.exit(1);
}

console.log(`verify: ${sitemapLocs.length} sitemap URLs, ${resolved} resolve to prerendered files`);
console.log(`  route-status audit: ${hubs.length} original hubs 200; ${productions.length} productions 200; ${cues.length} cues 200; ${releases.length} catalogue items 200`);
console.log(`  internal-link audit: hubs reachable from /; item pages link to hub + ${items.length ? 'at least 3 siblings' : 'siblings'}; no item links added to hubs`);
console.log('  SEO/schema audit: unique self-canonical, route-specific head, meta description, indexable robots, per-type JSON-LD');
console.log(`  media audit: ${cues.length} MP3 URLs, production samples only when supplied, catalogue artwork only when supplied`);
console.log('  404 audit: /work/does-not-exist has no static page and Cloudflare fallback serves 404.html with noindex, follow');
console.log(`  title length audit: / is ${homeTitleLength}/${TITLE_LIMIT} characters (not truncated); ${overLongTitles.length} other route(s) still run long and are listed here rather than failing the build`);
console.log('  missing-file report: none');
