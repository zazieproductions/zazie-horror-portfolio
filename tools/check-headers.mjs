#!/usr/bin/env node
/**
 * tools/check-headers.mjs
 * ----------------------------------------------------------------------------
 * Validates `_headers` -- the file Cloudflare Pages uses to set response
 * headers at the edge -- against the policy in tools/headers.mjs and against
 * the tree it is meant to describe.
 *
 * WHY THIS EXISTS
 *
 * Cloudflare Pages does not let the most specific rule win. Every rule whose
 * pattern matches contributes its headers, and a header set twice is JOINED
 * WITH A COMMA. The site shipped a `/*` rule with
 *
 *     Cache-Control: public, max-age=0, must-revalidate
 *
 * and a `/fonts/*` rule with `max-age=31536000, immutable`. The edge answered
 *
 *     public, max-age=0, must-revalidate, public, max-age=31536000, immutable
 *
 * and RFC 9111 reads the first max-age, so every font, image and content-hashed
 * CSS/JS file was revalidated on every request. Nothing errored; the cache did
 * nothing. This checker simulates the join, so that cannot ship again.
 *
 * WHAT IT CHECKS
 *
 *   1. syntax and platform limits: parses, <= 100 rules, <= 2000 chars/line
 *   2. the `/*` block carries the full security policy (HSTS, CSP with
 *      frame-ancestors, X-Frame-Options: SAMEORIGIN, nosniff, referrer,
 *      permissions, no unsafe-eval, no object-src, base-uri, form-action) and
 *      allows exactly the one third party the privacy notice discloses
 *      (Cloudflare's edge-injected Web Analytics beacon: see
 *      ANALYTICS_ORIGINS in tools/headers.mjs) and no other remote
 *      script-src / connect-src origin
 *   3. only `/*` sets Cache-Control as a default, and every override detaches
 *      first -- otherwise the values join and the longer lifetime is ignored
 *   4. every sitemap route resolves to HTML that revalidates, and to an
 *      indexable X-Robots-Tag
 *   5. /404.html is no-store, /sw.js is never cached, documentation files are
 *      short-lived, fonts/hashed bundles are immutable, media is long-lived
 *   6. the served result has exactly one max-age per path (no joined values)
 *
 *   node tools/check-headers.mjs
 *   node tools/check-headers.mjs --verbose
 *
 * Exit 1 on any violation. No dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SECURITY_HEADERS,
  ANALYTICS_ORIGINS,
  HTML_CACHE,
  IMMUTABLE_CACHE,
  MEDIA_CACHE,
  DOC_CACHE,
  cacheControlFor,
  effectiveHeaders,
  parseHeadersFile,
} from './headers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');
const problems = [];
const notes = [];
const fail = (message) => problems.push(message);

/**
 * `_headers` may live in a deploy output directory rather than the root; this
 * repo keeps it at the root and scripts/build-deploy-dir.mjs copies it.
 */
const headersPath = path.join(root, '_headers');
if (!fs.existsSync(headersPath)) {
  console.error('check-headers: no _headers file at the repository root');
  process.exit(2);
}
const source = fs.readFileSync(headersPath, 'utf8');
const rules = parseHeadersFile(source);

/* ------------------------------------------------------------ 1. structure */

if (!rules.length) fail('_headers contains no rules');

const MAX_RULES = 100;
const MAX_LINE = 2000;
if (rules.length > MAX_RULES) fail(`_headers has ${rules.length} rules; Cloudflare Pages allows ${MAX_RULES}`);

source.split(/\r?\n/).forEach((line, index) => {
  if (line.length > MAX_LINE) fail(`_headers line ${index + 1} is ${line.length} characters; the limit is ${MAX_LINE}`);
});

for (const rule of rules) {
  if (!rule.pattern.startsWith('/')) fail(`rule pattern is not a path: ${rule.pattern}`);
  if (!rule.set.length && !rule.detach.length) fail(`${rule.pattern}: rule sets no headers`);
}

const seen = new Set();
for (const rule of rules) {
  if (seen.has(rule.pattern)) fail(`duplicate rule for ${rule.pattern}`);
  seen.add(rule.pattern);
}

/* -------------------------------------------------- 2. security policy block */

const get = (pathname, name) => effectiveHeaders(rules, pathname).get(name);

for (const [name, expected] of Object.entries(SECURITY_HEADERS)) {
  const actual = get('/', name.toLowerCase());
  if (actual === undefined) {
    fail(`/* does not set ${name}`);
    continue;
  }
  const normalize = (value) => value.replace(/\s+/g, ' ').trim();
  if (normalize(actual) !== normalize(expected)) {
    fail(`/* ${name} does not match tools/headers.mjs\n      _headers: ${actual}\n      expected: ${expected}`);
  }
}

const csp = get('/', 'content-security-policy') || '';
const cspDirectives = new Map(
  csp.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const [directive, ...rest] = part.split(/\s+/);
    return [directive.toLowerCase(), rest.join(' ')];
  }),
);

const requiredDirectives = ['default-src', 'script-src', 'style-src', 'img-src', 'media-src', 'font-src', 'frame-src', 'connect-src', 'object-src', 'base-uri', 'form-action', 'frame-ancestors'];
for (const directive of requiredDirectives) {
  if (!cspDirectives.has(directive)) fail(`Content-Security-Policy is missing ${directive}`);
}
if (cspDirectives.get('default-src') !== "'self'") fail("Content-Security-Policy default-src must be 'self'");
if (cspDirectives.get('object-src') !== "'none'") fail("Content-Security-Policy object-src must be 'none'");
if (cspDirectives.get('base-uri') !== "'self'") fail("Content-Security-Policy base-uri must be 'self'");
if (cspDirectives.get('frame-ancestors') !== "'self'") fail("Content-Security-Policy frame-ancestors must be 'self' (clickjacking)");
if (!/mailto:/.test(cspDirectives.get('form-action') || '')) fail('Content-Security-Policy form-action must allow mailto: for the contact form');
if (!cspDirectives.has('upgrade-insecure-requests')) fail('Content-Security-Policy should upgrade-insecure-requests');
if (/'unsafe-eval'/.test(csp)) fail("Content-Security-Policy must not allow 'unsafe-eval'");
if (/default-src [^;]*\*/.test(csp)) fail('Content-Security-Policy default-src must not contain a wildcard');

const cspFrames = cspDirectives.get('frame-src') || '';
for (const origin of ['https://www.youtube.com', 'https://www.youtube-nocookie.com', 'https://bandcamp.com']) {
  if (!cspFrames.includes(origin)) fail(`Content-Security-Policy frame-src must allow ${origin} for embedded players`);
}

/**
 * The Cloudflare Web Analytics beacon is injected at the edge (nothing in this
 * repo asks for the tag). Since 26 October 2026 it is allowed on purpose and
 * disclosed in /privacy, so both of its origins must be present in exactly the
 * directives ANALYTICS_ORIGINS names - dropping one brings back the console
 * CSP error (script) or silently dead reporting (connect). No other remote
 * script-src / connect-src origin may appear: the beacon is the site's only
 * third-party script and its only remote connection.
 */
for (const { origin, directive } of ANALYTICS_ORIGINS) {
  const sources = (cspDirectives.get(directive) || '').split(/\s+/).filter(Boolean);
  if (!sources.includes(origin)) {
    fail(
      `Content-Security-Policy ${directive} must allow ${origin} for the Cloudflare Web Analytics ` +
        `beacon disclosed in /privacy; without it the beacon is blocked (or cannot report) and the ` +
        `console CSP error returns. See ANALYTICS_ORIGINS in tools/headers.mjs.`,
    );
  }
}
for (const directive of ['script-src', 'connect-src']) {
  const allowed = new Set(
    ANALYTICS_ORIGINS.filter((entry) => entry.directive === directive).map((entry) => entry.origin),
  );
  for (const source of (cspDirectives.get(directive) || '').split(/\s+/).filter(Boolean)) {
    if (!source.startsWith('http://') && !source.startsWith('https://')) continue;
    if (!allowed.has(source)) {
      fail(
        `Content-Security-Policy ${directive} allows unexpected remote origin ${source}; the only ` +
          `remote origin allowed here is the Cloudflare Web Analytics beacon (ANALYTICS_ORIGINS in ` +
          `tools/headers.mjs), and /privacy must disclose any addition before it ships.`,
      );
    }
  }
}

/* --------------------------------------------------- 3. no comma-joined cache */

if (rules[0]?.pattern !== '/*') notes.push(`the first rule is ${rules[0]?.pattern}, not /*`);

for (const rule of rules) {
  const setsCache = rule.set.some((header) => header.name === 'cache-control');
  if (!setsCache || rule.pattern === '/*') continue;
  if (!rule.detach.includes('cache-control')) {
    fail(`${rule.pattern} sets Cache-Control without "! Cache-Control" first: the value from /* will be joined with it, and the first max-age wins`);
  }
}

/* ------------------------------------------- 4/5. the paths that actually matter */

const sitemapFile = path.join(root, 'sitemap.xml');
const sitemapPaths = fs.existsSync(sitemapFile)
  ? [...fs.readFileSync(sitemapFile, 'utf8').matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
      .map((match) => new URL(match[1].replace(/&amp;/g, '&')).pathname)
      .map((p) => p.replace(/\/+$/, '') || '/')
  : [];

if (!sitemapPaths.length) fail('sitemap.xml has no <loc> entries to check headers against');

const hashedAssets = fs
  .readdirSync(root)
  .filter((name) => /^(?:index|store|legal|estimator|item|reel-download)-[0-9a-f]{8}\.(?:css|js)$/.test(name))
  .map((name) => `/${name}`);
if (!hashedAssets.length) fail('no content-hashed CSS/JS bundles found at the repository root');

const fontFiles = fs.existsSync(path.join(root, 'fonts'))
  ? fs.readdirSync(path.join(root, 'fonts')).filter((f) => f.endsWith('.woff2')).map((f) => `/fonts/${f}`)
  : [];
const imageFiles = fs.existsSync(path.join(root, 'images'))
  ? fs.readdirSync(path.join(root, 'images')).filter((f) => /\.(?:avif|webp|jpe?g|png|svg)$/i.test(f)).map((f) => `/images/${f}`)
  : [];

/** Every assertion is `[pathname, expected Cache-Control, label]`. */
const expectations = [
  ['/', HTML_CACHE, 'home page'],
  ['/404.html', 'no-store', 'error page'],
  ['/sw.js', 'no-cache, no-store, must-revalidate', 'service worker'],
  ['/sitemap.xml', DOC_CACHE, 'sitemap'],
  ['/robots.txt', DOC_CACHE, 'robots'],
  ['/llms.txt', DOC_CACHE, 'llms.txt'],
  ['/llms-full.txt', DOC_CACHE, 'llms-full.txt'],
  ...sitemapPaths.map((p) => [p, HTML_CACHE, 'sitemap route']),
  ...sitemapPaths.filter((p) => p !== '/').map((p) => [`${p}.html`, HTML_CACHE, 'flat .html alias']),
  ...sitemapPaths.filter((p) => p !== '/' && fs.existsSync(path.join(root, p, 'index.html'))).map((p) => [`${p}/`, HTML_CACHE, 'directory route']),
  ...hashedAssets.map((p) => [p, IMMUTABLE_CACHE, 'content-hashed bundle']),
  ...fontFiles.map((p) => [p, IMMUTABLE_CACHE, 'font']),
  ...imageFiles.slice(0, 25).map((p) => [p, MEDIA_CACHE, 'image']),
];

let checked = 0;
for (const [pathname, expected, label] of expectations) {
  const actual = get(pathname, 'cache-control');
  if (actual === undefined) {
    fail(`${pathname} (${label}) has no Cache-Control at all`);
    continue;
  }
  const maxAges = actual.match(/max-age=\d+/g) || [];
  if (maxAges.length > 1) {
    fail(`${pathname} (${label}) would serve joined Cache-Control values: "${actual}" — add "! Cache-Control" to the narrower rule`);
    continue;
  }
  if (actual.trim() !== expected) {
    fail(`${pathname} (${label}) serves "${actual}", expected "${expected}"`);
    continue;
  }
  checked += 1;
  if (verbose) console.log(`  ok  ${pathname.padEnd(56)} ${actual}`);
}

/** Indexable routes must not arrive with a noindex header. */
for (const pathname of sitemapPaths) {
  const robots = get(pathname, 'x-robots-tag') || '';
  if (/\bnoindex\b/i.test(robots)) fail(`${pathname} is in the sitemap but its X-Robots-Tag forbids indexing: ${robots}`);
}

/* -------------------------------------------------------------- consistency */

/** The local mirror must agree with the edge for the same paths. */
for (const [pathname, expected, label] of expectations) {
  const local = cacheControlFor(pathname, { html: expected === HTML_CACHE && !pathname.endsWith('.xml') && !/\.(?:css|js|woff2|png|jpe?g|webp|avif|svg)$/i.test(pathname) });
  if (local !== expected) {
    fail(`tools/headers.mjs cacheControlFor("${pathname}") = "${local}" but _headers (${label}) says "${expected}"`);
  }
}

/* ------------------------------------------------------------------- report */

console.log(`check-headers: ${rules.length} rules, ${checked}/${expectations.length} path expectations matched`);
console.log(`  security policy: ${Object.keys(SECURITY_HEADERS).length} headers on /*, CSP with ${cspDirectives.size} directives`);
console.log(`  cache policy: HTML revalidates, ${hashedAssets.length} hashed bundles + ${fontFiles.length} fonts immutable, media 30 days`);

if (notes.length) {
  console.log('');
  for (const note of notes) console.log(`  note ${note}`);
}

if (problems.length) {
  console.error(`\ncheck-headers: ${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  ✗ ${problem}`);
  console.error('');
  process.exit(1);
}

console.log('check-headers: PASS — _headers matches the policy and serves one cache lifetime per path.');
