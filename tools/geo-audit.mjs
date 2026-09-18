#!/usr/bin/env node
/**
 * GEO audit: static checks on the built site for retrieval-engine readiness.
 *
 *   node tools/geo-audit.mjs            summary
 *   node tools/geo-audit.mjs --verbose  every check
 *   node tools/geo-audit.mjs --json     machine-readable result
 *
 * This is the on-site half of the measurement. It cannot tell you whether an
 * engine cites the site (that is geo/measurements.jsonl and geo-battery.mjs);
 * it tells you whether the site is *citable* — crawlable by the answer-engine
 * user agents, machine-readable, attributed, dated, and reachable from every
 * page. Exit code is 1 if any check fails, so it can gate a deploy.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = 'https://horror.zazieproductions.com';
const verbose = process.argv.includes('--verbose');
const asJson = process.argv.includes('--json');

const results = [];
const add = (level, area, msg, detail) => results.push({ level, area, msg, detail });
const pass = (a, m, d) => add('pass', a, m, d);
const warn = (a, m, d) => add('warn', a, m, d);
const fail = (a, m, d) => add('fail', a, m, d);
const read = (p) => (fs.existsSync(path.join(ROOT, p)) ? fs.readFileSync(path.join(ROOT, p), 'utf8') : null);

/* ---------------------------------------------------------------- crawl access */
const robots = read('robots.txt');
if (!robots) {
  fail('access', 'robots.txt missing');
} else {
  const AI_AGENTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Google-Extended',
    'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'Applebot-Extended', 'CCBot', 'Amazonbot',
    'Meta-ExternalAgent', 'DuckAssistBot', 'MistralAI-User'];
  const missing = AI_AGENTS.filter((a) => !new RegExp(`user-agent:\\s*${a}`, 'i').test(robots));
  if (missing.length) warn('access', `robots.txt has no explicit policy for ${missing.length} AI agents`, missing.join(', '));
  else pass('access', `robots.txt names all ${AI_AGENTS.length} tracked AI user agents`);

  if (/sitemap:\s*https?:\/\//i.test(robots)) pass('access', 'robots.txt advertises the sitemap');
  else fail('access', 'robots.txt has no Sitemap: line');

  // A blanket block aimed at everyone is the one thing that kills retrieval.
  const starBlock = /user-agent:\s*\*[\s\S]*?(?=\n\s*user-agent:|\Z)/i.exec(robots);
  if (starBlock && /^\s*disallow:\s*\/\s*$/im.test(starBlock[0])) fail('access', 'robots.txt blocks all crawlers');
  else pass('access', 'no blanket Disallow: / for all agents');
}

const llms = read('llms.txt');
if (!llms) warn('access', 'llms.txt not published');
else {
  const need = ['## Canonical entity record', '## Reference documents', '## Identifiers'];
  const absent = need.filter((s) => !llms.includes(s));
  if (absent.length) warn('access', 'llms.txt is missing recommended sections', absent.join(', '));
  else pass('access', `llms.txt published (${llms.length} bytes) with entity, reference and identifier sections`);

  const linked = (llms.match(/https:\/\/horror\.zazieproductions\.com/g) || []).length;
  if (linked < 8) warn('access', `llms.txt links only ${linked} on-site URLs`);
  else pass('access', `llms.txt links ${linked} on-site URLs`);
}

/* ------------------------------------------------------------ entity record */
const factsRaw = read('facts.json');
if (!factsRaw) fail('entity', 'facts.json not published');
else {
  let facts = null;
  try { facts = JSON.parse(factsRaw); } catch (e) { fail('entity', 'facts.json is not valid JSON', e.message); }
  if (facts) {
    const same = (facts.sameAs || []).length;
    if (same < 8) warn('entity', `facts.json lists only ${same} sameAs profiles`);
    else pass('entity', `facts.json lists ${same} sameAs profiles`);

    for (const [key, label] of [['award', 'awards'], ['memberOf', 'professional affiliations'], ['subjectOf', 'third-party publications']]) {
      if (!facts[key] || !facts[key].length) warn('entity', `facts.json has no ${label}`);
      else pass('entity', `facts.json carries ${facts[key].length} ${label}`);
    }
    if (facts.founder && (facts.founder.knowsAbout || []).length >= 10) {
      pass('entity', `founder knowsAbout has ${facts.founder.knowsAbout.length} topics`);
    } else warn('entity', 'founder knowsAbout is thin');
  }
}

/* --------------------------------------------------------------- sitemap set */
const sitemap = read('sitemap.xml');
if (!sitemap) fail('index', 'sitemap.xml missing');
const locs = sitemap ? [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]) : [];

const REFERENCE_PAGES = ['/dread', '/glossary', '/lineage', '/sound-design', '/press', '/facts'];
const forRefs = REFERENCE_PAGES.filter((p) => !locs.some((l) => l === SITE + p));
if (forRefs.length) fail('index', `reference pages not in the sitemap: ${forRefs.join(', ')}`);
else pass('index', `all ${REFERENCE_PAGES.length} reference pages are in the sitemap (${locs.length} URLs total)`);

/* ------------------------------------------------------------------ per page */
const pageCache = new Map();
const isFile = (rel) => {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) && fs.statSync(abs).isFile();
};
const loadPage = (url) => {
  const p = url.replace(SITE, '').replace(/^\//, '');
  const candidates = p === '' ? ['index.html'] : [p, `${p}/index.html`, `${p}.html`];
  const file = candidates.find(isFile);
  if (!file) return null;
  if (pageCache.has(file)) return pageCache.get(file);
  const html = read(file);
  pageCache.set(file, html);
  return html;
};

let schemaPages = 0, datedPages = 0, attributedPages = 0, answerFirstPages = 0, citePages = 0, faqPages = 0, termPages = 0, schemas = 0;

for (const loc of locs) {
  const html = loadPage(loc);
  const short = loc.replace(SITE, '') || '/';
  if (!html) { fail('page', `${short}: sitemap URL has no file on disk`); continue; }

  if (!new RegExp(`rel=["']canonical["'][^>]*href=["']${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(html)) {
    fail('page', `${short}: canonical does not match the submitted URL`);
  }

  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  schemas += blocks.length;
  let parsed = [];
  for (const b of blocks) { try { parsed.push(JSON.parse(b)); } catch { fail('schema', `${short}: invalid JSON-LD`); } }
  if (parsed.length) schemaPages++;

  const flat = JSON.stringify(parsed);
  if (parsed.some((d) => /"dateModified"/.test(JSON.stringify(d)))) datedPages++;
  if (parsed.some((d) => /"author"|"publisher"|"#person"|"#org"/.test(JSON.stringify(d)))) attributedPages++;
  if (flat.includes('FAQPage')) faqPages++;
  if (flat.includes('DefinedTermSet')) termPages++;

  if (/class="cite"/.test(html)) citePages++;
  if (!/href="\/dread"/.test(html)) warn('links', `${short}: does not link the Dread Grammar`);

  // Answer-first: the lead paragraph should state the answer, not the welcome.
  const lead = /<p class="doc-lead">([\s\S]*?)<\/p>/.exec(html);
  if (lead) {
    const text = lead[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length >= 120 && text.length <= 900) answerFirstPages++;
    else warn('content', `${short}: doc-lead is ${text.length} chars (target 120-900)`);
  }
}

pass('page', `checked ${locs.length} sitemap URLs: ${schemaPages} with JSON-LD, ${datedPages} with dateModified, ${attributedPages} with attribution`);

/* ---------------------------------------------------- reference-page signals */
for (const p of REFERENCE_PAGES) {
  const html = loadPage(SITE + p);
  if (!html) continue;
  const terms = (html.match(/<div class="term" id="/g) || []).length;
  const questions = (html.match(/<details class="faq-item"/g) || []).length;
  const quotes = (html.match(/class="cite"/g) || []).length;
  const bits = [`${terms} defined terms`, `${questions} FAQ entries`];
  if (quotes) bits.push('citation block');
  if (!questions) warn('content', `${p}: no FAQ markup, so no FAQPage for question-shaped queries`);
  if (terms < 5 && questions < 3) warn('content', `${p}: thin — ${bits.join(', ')}`);
  else pass('content', `${p}: ${bits.join(', ')}`);
}

/* ------------------------------------------------------------ internal links */
const linkers = [];
for (const loc of locs) {
  const html = loadPage(loc);
  // Either the doc footer class, or the homepage's Tailwind footer, counts:
  // what matters is that the page links the reference documents at all.
  if (html && /href="\/dread"/.test(html) && /href="\/glossary"/.test(html)) linkers.push(loc.replace(SITE, ''));
}
if (linkers.length === locs.length) pass('links', `all ${locs.length} pages link the craft library in the footer`);
else warn('links', `${linkers.length}/${locs.length} pages link the craft library in the footer`);

const home = read('index.html') || '';
if (/#person/.test(home) && /"knowsAbout"/.test(home) && /sameAs/.test(home)) {
  const same = (JSON.stringify([...home.matchAll(/"sameAs":\s*\[([^\]]*)\]/g)]).match(/https?:\/\//g) || []).length;
  pass('entity', `homepage carries the entity graph (${same} sameAs references inline)`);
} else warn('entity', 'homepage entity graph looks incomplete');

/* --------------------------------------------------------------------- score */
const counts = {
  pass: results.filter((r) => r.level === 'pass').length,
  warn: results.filter((r) => r.level === 'warn').length,
  fail: results.filter((r) => r.level === 'fail').length,
};
const scored = counts.pass + counts.warn + counts.fail;
const score = scored ? Math.round(((counts.pass + counts.warn * 0.5) / scored) * 100) : 0;

if (asJson) {
  console.log(JSON.stringify({ score, counts, schemas, pages: locs.length, results }, null, 2));
  process.exit(counts.fail ? 1 : 0);
}

if (verbose) {
  for (const r of results) {
    const tag = r.level === 'pass' ? '  ok  ' : r.level === 'warn' ? ' warn ' : ' FAIL ';
    console.log(`[${tag}] ${r.area.padEnd(8)} ${r.msg}`);
    if (r.detail) console.log(`         ${r.detail}`);
  }
  console.log('');
} else {
  for (const r of results.filter((r) => r.level !== 'pass')) {
    const tag = r.level === 'warn' ? ' warn ' : ' FAIL ';
    console.log(`[${tag}] ${r.area.padEnd(8)} ${r.msg}`);
    if (r.detail) console.log(`         ${r.detail}`);
  }
  console.log('');
}

console.log(`GEO audit: ${counts.pass} pass, ${counts.warn} warn, ${counts.fail} fail — readiness ${score}/100`);
console.log(`Pages ${locs.length} · JSON-LD blocks ${schemas} · FAQPage ${faqPages} · DefinedTermSet ${termPages} · citation blocks ${citePages}\n`);
process.exit(counts.fail ? 1 : 0);
