#!/usr/bin/env node
/**
 * check-seo.mjs — regression gate for the search-integrity rules this
 * property is now held to. Run after any change to a page, the sitemap,
 * or the structured data.
 *
 *   node tools/check-seo.mjs
 *
 * Exits 0 when clean, 1 on any ERROR. WARNs do not fail the run but are
 * printed, because they are judgement calls rather than defects.
 *
 * Every rule here exists because it was actually broken once. The comment
 * above each rule names the failure.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://horror.zazieproductions.com';

const errors = [];
const warns = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warns.push(`${f}: ${m}`);

/** Pages that must be indexable and are held to on-page standards. */
const INDEXABLE = [
  '/', '/work', '/reel', '/composer', '/process', '/services', '/contact',
  '/store', '/faq', '/legal', '/terms', '/privacy', '/licensing', '/purchases', '/accessibility',
];

const fileFor = (route) =>
  path.join(ROOT, route === '/' ? 'index.html' : path.join(route.replace(/^\//, ''), 'index.html'));

const htmlPages = [];
for (const r of INDEXABLE) if (fs.existsSync(fileFor(r))) htmlPages.push([r, fileFor(r)]);
// Filmography records
const workDir = path.join(ROOT, 'work');
for (const d of fs.readdirSync(workDir)) {
  const p = path.join(workDir, d, 'index.html');
  if (fs.existsSync(p)) htmlPages.push([`/work/${d}`, p]);
}
htmlPages.push(['/404', path.join(ROOT, '404.html')]);

const strip = (h) =>
  h.replace(/<script[\s\S]*?<\/script>/gi, '')
   .replace(/<style[\s\S]*?<\/style>/gi, '')
   .replace(/<!--[\s\S]*?-->/g, '');
const text = (h) => strip(h).replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ');
const attr = (h, name) => {
  const m = h.match(new RegExp(`<${name}[^>]*content="([^"]*)"`, 'i')) ||
            h.match(new RegExp(`content="([^"]*)"[^>]*name="${name}"`, 'i')) ||
            h.match(new RegExp(`<meta[^>]*name="${name}"[^>]*content="([^"]*)"`, 'i'));
  return m ? m[1] : null;
};
const canonical = (h) => (h.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i) || [])[1];

/* ------------------------------------------------------------------ *
 * 1. On-page basics
 * ------------------------------------------------------------------ */
for (const [route, file] of htmlPages) {
  const rel = path.relative(ROOT, file);
  const h = fs.readFileSync(file, 'utf8');
  const is404 = route === '/404';

  const title = (h.match(/<title>(.*?)<\/title>/is) || [])[1];
  if (!title) err(rel, 'missing <title>');
  else {
    if (title.length > 65) err(rel, `title is ${title.length} chars (>65): Google truncates it`);
    if (title.length < 15) warn(rel, `title is only ${title.length} chars`);
  }

  const desc = attr(h, 'description');
  if (!desc) err(rel, 'missing meta description');
  else if (desc.length > 160) err(rel, `meta description is ${desc.length} chars (>160)`);
  else if (desc.length < 50) warn(rel, `meta description is only ${desc.length} chars`);

  const h1 = h.match(/<h1[\s>]/g) || [];
  if (h1.length !== 1) err(rel, `has ${h1.length} <h1> elements (expected exactly 1)`);

  const can = canonical(h);
  if (!can) err(rel, 'missing rel=canonical');
  else if (!is404 && can !== `${SITE}${route === '/' ? '/' : route}`) {
    err(rel, `canonical ${can} does not equal ${SITE}${route}`);
  }

  const robots = attr(h, 'robots') || '';
  if (is404 && !/noindex/.test(robots)) err(rel, '404 page is not noindex');
  if (!is404 && /noindex/.test(robots)) err(rel, 'indexable page is marked noindex');
}

/* ------------------------------------------------------------------ *
 * 2. Review integrity.
 *    AggregateRating/Review markup for one's own business is a
 *    self-serving review under Google's spam policy. A 5.0 aggregate was
 *    published here from four reviews authored by anonymous role labels.
 * ------------------------------------------------------------------ */
for (const [, file] of htmlPages) {
  const rel = path.relative(ROOT, file);
  const h = fs.readFileSync(file, 'utf8');
  if (/"@type":\s*"AggregateRating"/.test(h)) err(rel, 'AggregateRating present (self-serving review risk)');
  if (/"@type":\s*"Review"/.test(h)) err(rel, 'Review markup present (self-serving review risk)');
  if (/\bVerified production collaborators\b/i.test(text(h))) err(rel, 'claims "Verified" collaborators');
  if (/5\.0 collaborator rating/i.test(text(h))) err(rel, 'still advertises a 5.0 collaborator rating');
}

/* ------------------------------------------------------------------ *
 * 3. Entity hygiene.
 *    sameAs is for the same entity on OTHER sites. Self-references and
 *    a company name as a person's alias both muddy entity resolution.
 * ------------------------------------------------------------------ */
for (const [, file] of htmlPages) {
  const rel = path.relative(ROOT, file);
  const h = fs.readFileSync(file, 'utf8');
  for (const block of h.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g) || []) {
    const raw = block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
    let data;
    try { data = JSON.parse(raw); }
    catch (e) { err(rel, `JSON-LD does not parse: ${e.message}`); continue; }
    for (const node of data['@graph'] || [data]) {
      const same = [].concat(node.sameAs || []);
      for (const u of same) {
        if (u.startsWith(SITE)) err(rel, `sameAs points at own domain: ${u}`);
        if (u.startsWith('http://')) err(rel, `sameAs uses http:// ${u}`);
      }
      if (node['@type'] === 'Person' && [].concat(node.alternateName || []).some((n) => /Productions LLC|^ZKT/.test(n))) {
        err(rel, `Person.alternateName conflates the company: ${node.alternateName}`);
      }
      // A work credited as sound design must not claim a composed score.
      if (node['@type'] === 'MusicComposition' && /sound design/i.test(node.description || '') && !/score/i.test(node.name || '')) {
        warn(rel, `MusicComposition describes sound design: ${node.name}`);
      }
      // uploadDate is required for video rich results; never guess it.
      if (node['@type'] === 'VideoObject' && !node.uploadDate) {
        err(rel, `VideoObject missing required uploadDate: ${node.name}`);
      }
      if (node['@type'] === 'VideoObject' && /^https?:\/\/(www\.)?youtube\.com\/watch/.test(node.contentUrl || '')) {
        err(rel, `VideoObject.contentUrl points at an HTML watch page: ${node.name}`);
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * 4. Implementation jargon must not leak into visible copy.
 *    "end crawl" and "crawl policy" are legitimate film/legal terms and
 *    are deliberately not matched here.
 * ------------------------------------------------------------------ */
const JARGON = [
  /\brich results?\b/i, /AudioObject/, /VideoObject/, /contentUrl/, /entity reinforcement/i,
  /internal link graph/i, /hub and spoke/i, /\bmoney page\b/i, /\bsilos?\b/i, /sameAs/,
  /entity authority/i, /concentrate authority/i, /topical authority/i, /JSON-LD/, /structured data/i,
];
for (const [, file] of htmlPages) {
  const rel = path.relative(ROOT, file);
  const t = text(fs.readFileSync(file, 'utf8'));
  for (const re of JARGON) if (re.test(t)) err(rel, `visible copy contains jargon: ${re}`);
}

/* ------------------------------------------------------------------ *
 * 5. Every internal link must resolve to a file that ships.
 * ------------------------------------------------------------------ */
const seen = new Set();
for (const [, file] of htmlPages) {
  const rel = path.relative(ROOT, file);
  const h = fs.readFileSync(file, 'utf8');
  for (const m of h.matchAll(/href="([^"#][^"]*)"/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(href)) continue;
    const clean = href.split('#')[0].split('?')[0];
    if (!clean) continue;
    const key = `${rel}|${clean}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const target = path.join(ROOT, clean);
    const ok =
      fs.existsSync(target) && !fs.statSync(target).isDirectory()
      ? true
      : fs.existsSync(path.join(target, 'index.html'))
      ? true
      : fs.existsSync(`${target}.html`);
    if (!ok) err(rel, `internal link does not resolve: ${clean}`);
  }
}

/* ------------------------------------------------------------------ *
 * 6. Sitemap / robots agreement.
 * ------------------------------------------------------------------ */
const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (new Set(locs).size !== locs.length) err('sitemap.xml', 'duplicate <loc> entries');
for (const loc of locs) {
  if (!loc.startsWith(`${SITE}/`) && loc !== `${SITE}/`) err('sitemap.xml', `off-site or non-https loc: ${loc}`);
  const route = loc.replace(SITE, '') || '/';
  const f = fileFor(route);
  if (!fs.existsSync(f)) err('sitemap.xml', `submitted URL has no file: ${route}`);
  else {
    const c = canonical(fs.readFileSync(f, 'utf8'));
    if (c !== loc) err('sitemap.xml', `${route}: canonical ${c} != submitted ${loc}`);
  }
}
const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) err('robots.txt', 'does not advertise the sitemap');
if (/^Host:\s*https?:/m.test(robots)) err('robots.txt', 'Host: must be a bare hostname, no scheme');

/* ------------------------------------------------------------------ */
console.log(`\ncheck-seo: ${htmlPages.length} pages, ${locs.length} sitemap URLs, ${seen.size} internal links\n`);
for (const w of warns) console.log(`  WARN  ${w}`);
for (const e of errors) console.log(`  FAIL  ${e}`);
if (errors.length) {
  console.log(`\n  ${errors.length} error(s), ${warns.length} warning(s).`);
  process.exit(1);
}
console.log(`  PASS - no SEO integrity defects. ${warns.length} warning(s).`);
