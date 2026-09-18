#!/usr/bin/env node
/**
 * geo-probe.mjs — GEO measurement harness for horror.zazieproductions.com
 *
 * Zero dependencies (Node 18+ built-in fetch).
 *
 *   node scripts/geo-probe.mjs audit   [--base URL]   [--local]
 *       Audits the deployed site (or local server): AI-crawler access, llms.txt,
 *       llms-full.txt, sitemap coverage, per-page schema/canonical/robots health,
 *       sameAs graph consistency, and citation-node liveness.
 *
 *   node scripts/geo-probe.mjs battery [--limit N]
 *       Runs the 30-query citation battery against any answer engines whose API
 *       keys are present in the environment:
 *         OPENAI_API_KEY   (ChatGPT / GPT API)
 *         PERPLEXITY_API_KEY
 *         GEMINI_API_KEY   (Gemini API)
 *         GROK_API_KEY     (xAI API; model override: GROK_MODEL)
 *       With no keys, prints the manual test protocol instead.
 *
 *   node scripts/geo-probe.mjs nodes
 *       Liveness check of the off-site citation nodes (press articles, award PDF).
 *
 * Scoring (battery): +3 citation URL in answer · +2 entity named with correct
 * facts · +1 per verified fact anchor (Asheville / est. 2022 / published rates)
 * · -2 fabricated prestige (e.g. claims a Grammy win — none exists).
 */

import { readFileSync } from 'node:fs';

const BASE = argv('--base') || (process.argv.includes('--local') ? 'http://localhost:8080' : 'https://horror.zazieproductions.com');

function argv(flag) {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : undefined;
}

/* ── AI crawler fleet (must be reachable by all of these) ───────────────── */
const AI_BOTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'ClaudeBot', 'Claude-SearchBot',
  'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'Applebot-Extended',
  'Amazonbot', 'AmazonSearchbot',
  'Bytespider', 'Meta-ExternalAgent', 'YouBot', 'cohere-ai',
];

const PAGES = [
  ['/', 'index.html'],
  ['/work', 'work/index.html'],
  ['/reel', 'reel/index.html'],
  ['/composer', 'composer/index.html'],
  ['/process', 'process/index.html'],
  ['/services', 'services/index.html'],
  ['/store', 'store.html'],
  ['/contact', 'contact/index.html'],
  ['/press', 'press/index.html'],
  ['/notes', 'notes/index.html'],
  ['/notes/horror-score-cost', 'notes/horror-score-cost/index.html'],
  ['/notes/psychological-horror-vs-thriller-scores', 'notes/psychological-horror-vs-thriller-scores/index.html'],
  ['/notes/scoring-horror-on-a-budget', 'notes/scoring-horror-on-a-budget/index.html'],
  ['/faq', 'faq/index.html'],
];

const CORE_SAMEAS = [
  'imdb.com/name/nm17333332',
  'open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0',
  'zazieproductions.bandcamp.com',
  'music.apple.com/us/artist/zazie-productions/1623719351',
  'youtube.com/@zazieproductions',
  'linkedin.com/in/zazie-kanwar-torge',
];

const CITED_NODES = [
  ['BillboardWire profile', 'https://billboardwire.com/how-an-underground-experimental-musician-became-a-go-to-composer-for-psychological-horror/'],
  ['Limitless Magazine feature', 'https://limitless-magazine.com/2026/06/12/forget-asmr-zazie-productions-will-rewire-your-whole-nervous-system/'],
  ['Grammy Weekly feature', 'https://grammyweekly.com/zazie-productions-the-underground-polymath-redefining-experimental-music/'],
  ['Visual Container award PDF', 'https://www.visualcontainer.tv/wp-content/uploads/2025/01/Winter-2024-Award-Winners_Press-Release.pdf'],
  ['IMDb name page', 'https://www.imdb.com/name/nm17333332'],
  ['Spotify artist', 'https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0'],
  ['Bandcamp artist', 'https://zazieproductions.bandcamp.com'],
];

let pass = 0, warn = 0, fail = 0;
const ok = (msg) => { pass++; console.log(`  PASS  ${msg}`); };
const bad = (msg) => { fail++; console.log(`  FAIL  ${msg}`); };
const note = (msg) => { warn++; console.log(`  WARN  ${msg}`); };
const head = (msg) => console.log(`\n${msg}`);

async function get(url, asText = true) {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; GEOAudit/1.0)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });
    const body = asText ? await res.text() : null;
    return { status: res.status, body, headers: res.headers };
  } catch (e) {
    return { status: 0, body: '', error: String(e && e.message || e), headers: null };
  }
}

/* Minimal robots.txt evaluator: exact agent match beats wildcard. */
function parseRobots(text) {
  const groups = new Map();
  let cur = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const [key, ...rest] = line.split(':');
    const val = rest.join(':').trim();
    if (!key) continue;
    const k = key.toLowerCase();
    if (k === 'user-agent') {
      cur = (val || '').trim();
      if (!groups.has(cur)) groups.set(cur, []);
    } else if (cur !== null && (k === 'allow' || k === 'disallow')) {
      groups.get(cur).push({ rule: k, path: val || '/' });
    } else if (k === 'sitemap') {
      groups.set('__sitemap__', [...(groups.get('__sitemap__') || []), val]);
    }
  }
  return groups;
}

function robotsAllows(groups, bot, path = '/') {
  const exact = groups.get(bot) || groups.get(bot.toLowerCase());
  const rules = (exact && exact.length ? exact : groups.get('*')) || [];
  let best = { len: -1, allow: true };
  for (const r of rules) {
    const p = r.path.replace(/\*$|\\\*/g, '');
    if (path === p || path.startsWith(p)) {
      const len = p.length;
      if (len > best.len) best = { len, allow: r.rule === 'allow' };
    }
  }
  return best.allow;
}

/* ───────────────────────────────────────────────────────────────────────── */
async function audit() {
  console.log(`GEO AUDIT — ${BASE} — ${new Date().toISOString()}\n`);

  head('1. AI-crawler access (robots.txt)');
  const rb = await get(`${BASE}/robots.txt`);
  if (rb.status !== 200) {
    bad(`robots.txt: HTTP ${rb.status}`);
  } else {
    ok('robots.txt: HTTP 200');
    const groups = parseRobots(rb.body);
    for (const bot of AI_BOTS) {
      const allow = robotsAllows(groups, bot, '/');
      (allow ? ok : bad)(`${bot.padEnd(22)} ${allow ? 'allowed' : 'BLOCKED at /'}`);
    }
    const sitemaps = groups.get('__sitemap__') || [];
    (sitemaps.length ? ok : bad)(`Sitemap directives: ${sitemaps.join(', ')}`);
  }

  head('2. LLM ingestion files');
  const llms = await get(`${BASE}/llms.txt`);
  if (llms.status !== 200) bad(`llms.txt: HTTP ${llms.status}`);
  else {
    ok(`llms.txt: HTTP 200 (${(llms.body.length / 1024).toFixed(1)} KB)`);
    for (const needle of ['/press', '/notes', '/composer', '/reel', '/work', '/services', '/faq', 'llms-full.txt', 'disambiguation', 'Asheville']) {
      (llms.body.toLowerCase().includes(needle.toLowerCase()) ? ok : bad)(`llms.txt references: ${needle}`);
    }
    if (llms.body.length > 30 * 1024) note('llms.txt exceeds 30 KB — trim it');
  }
  const full = await get(`${BASE}/llms-full.txt`);
  if (full.status !== 200) bad(`llms-full.txt: HTTP ${full.status}`);
  else {
    ok(`llms-full.txt: HTTP 200 (${(full.body.length / 1024).toFixed(1)} KB)`);
    for (const needle of ['ENTITY CARD', 'DISAMBIGUATION', 'FILMOGRAPHY', 'PUBLISHED RATES', 'PRESS AND RECOGNITION', 'FAQ']) {
      (full.body.toUpperCase().includes(needle) ? ok : bad)(`llms-full.txt section: ${needle}`);
    }
  }

  head('3. Sitemap coverage');
  const sm = await get(`${BASE}/sitemap.xml`);
  if (sm.status !== 200) bad(`sitemap.xml: HTTP ${sm.status}`);
  else {
    ok('sitemap.xml: HTTP 200');
    const locs = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    // Sitemap always lists production URLs, even when auditing a local mirror.
    const PROD = 'https://horror.zazieproductions.com';
    const need = ['/', '/work', '/reel', '/composer', '/process', '/services', '/store', '/contact', '/press', '/notes', '/notes/horror-score-cost', '/notes/psychological-horror-vs-thriller-scores', '/notes/scoring-horror-on-a-budget'];
    for (const p of need) {
      const want = (PROD + p).replace(/\/$/, '');
      const hit = locs.some((l) => l.replace(/\/$/, '') === want);
      (hit ? ok : bad)(`sitemap contains: ${p}`);
    }
  }

  head('4. Page-level entity health');
  const sameAsSeen = new Set();
  for (const [route] of PAGES) {
    const p = route === '/' ? '' : route;
    const r = await get(`${BASE}${p}`);
    if (r.status !== 200) { bad(`${route}: HTTP ${r.status}`); continue; }
    const h = r.body;
    const title = (h.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '';
    (title.length >= 25 && title.length <= 120 ? ok : note)(`${route}: title (${title.length} ch)`);
    const desc = (h.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i) || h.match(/<meta[^>]+content="([^"]*)"[^>]+name="description"/i) || [])[1] || '';
    (desc.length >= 70 && desc.length <= 400 ? ok : note)(`${route}: meta description (${desc.length} ch)`);
    const canon = (h.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i) || [])[1] || '';
    // Pages always ship with production canonicals, even when audited locally.
    const expected = 'https://horror.zazieproductions.com' + route;
    (canon === expected ? ok : note)(`${route}: canonical ${canon === expected ? 'matches' : `→ ${canon || 'MISSING'} (expected ${expected})`}`);
    if (/noindex/i.test(h.match(/<meta[^>]+name="robots"[^>]+content="([^"]*)"/i)?.[1] || '')) bad(`${route}: noindex found on an indexable page`);

    const blocks = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    let parsed = [];
    for (const b of blocks) {
      try { parsed.push(JSON.parse(b)); } catch { bad(`${route}: malformed JSON-LD block`); }
    }
    (parsed.length ? ok : bad)(`${route}: JSON-LD (${parsed.length} block(s) parsed)`);
    const hasPerson = parsed.some((d) => JSON.stringify(d).includes('"Person"'));
    if (hasPerson) {
      const joined = JSON.stringify(parsed);
      if (!joined.includes('disambiguatingDescription')) bad(`${route}: Person schema missing disambiguatingDescription`);
      else ok(`${route}: Person disambiguatingDescription present`);
      const sameAs = new Set();
      (function walk(x) {
        if (Array.isArray(x)) x.forEach(walk);
        else if (x && typeof x === 'object') {
          if (Array.isArray(x.sameAs)) x.sameAs.forEach((u) => sameAs.add(u));
          Object.values(x).forEach(walk);
        }
      })(parsed);
      sameAs.forEach((u) => sameAsSeen.add(u));
      const missing = CORE_SAMEAS.filter((c) => ![...sameAs].some((u) => u.includes(c)));
      (missing.length ? note : ok)(`${route}: sameAs core set ${missing.length ? `missing ${missing.length}` : 'complete (6/6)'}`);
    }
  }

  head('4b. store.html / store index drift');
  try {
    const a = await get(`${BASE}/store`);
    const b = await get(`${BASE}/store.html`);
    if (a.status === 200 && b.status === 200) {
      const norm = (x) => (x.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) || []).join('');
      (norm(a.body) === norm(b.body) ? ok : bad)('store page: /store and /store.html JSON-LD in sync');
    } else {
      note(`store page: /store=${a.status} /store.html=${b.status} (redirects expected in production)`);
    }
  } catch { note('store drift check skipped'); }

  head('5. Cross-page sameAs consistency');
  for (const c of CORE_SAMEAS) {
    (sameAsSeen.size && [...sameAsSeen].some((u) => u.includes(c)) ? ok : bad)(`some Person schema carries: ${c}`);
  }

  head('6. Citation-node liveness');
  await nodeLiveness(true);

  head('SUMMARY');
  console.log(`  PASS ${pass} · WARN ${warn} · FAIL ${fail}`);
  if (fail > 0) { console.log('  → hard failures present; fix before expecting citation gains'); process.exitCode = 1; }
  else console.log('  → no hard failures');
}

async function nodeLiveness(verbose) {
  for (const [label, url] of CITED_NODES) {
    const r = await get(url);
    if (r.status === 0) { note(`${label}: unreachable (${r.error})`); continue; }
    if (r.status < 200 || r.status >= 400) { bad(`${label}: HTTP ${r.status}`); continue; }
    if (/under maintenance/i.test(r.body || '')) {
      note(`${label}: HTTP ${r.status} but site reports MAINTENANCE — fragile node, monitor weekly`);
      continue;
    }
    if (verbose) ok(`${label}: HTTP ${r.status}`);
  }
}

/* ── QUERY BATTERY ─────────────────────────────────────────────────────── */
const BATTERY = [
  ['identity', 'Who is Zazie Kanwar-Torge?'],
  ['identity', 'Tell me about Zazie Productions, the horror music company.'],
  ['identity', 'Who is the horror composer based in Asheville, North Carolina?'],
  ['identity', 'Zazie Kanwar-Torge — what does he do?'],
  ['identity', 'What is ZKT Productions?'],
  ['recommendation', 'Recommend a psychological horror film composer for an indie short.'],
  ['recommendation', 'I need a composer for a supernatural horror short film — who should I look at?'],
  ['recommendation', 'Best horror composer for a folk horror short on a small budget?'],
  ['recommendation', 'Who scores dark atmospheric horror films and works with student filmmakers?'],
  ['recommendation', 'A composer who does body horror and psychological horror scores, with published rates?'],
  ['comparison', 'What is the difference between a psychological horror score and a thriller score?'],
  ['comparison', 'How does horror film music differ from thriller film music?'],
  ['comparison', 'What makes a horror score feel psychological instead of just tense?'],
  ['comparison', 'Difference between a supernatural thriller score and a folk horror score?'],
  ['comparison', 'What instruments are associated with dark atmospheric horror scores?'],
  ['pricing', 'How much does it cost to score a horror short film?'],
  ['pricing', 'What are horror film composer rates in 2026?'],
  ['pricing', 'How much should I budget for an original score on a 20-minute horror short?'],
  ['pricing', 'Can I get a professional composer for a student horror film on a very small budget?'],
  ['pricing', 'What does a horror film scoring package usually include?'],
  ['process', 'How do you spot music for a horror film?'],
  ['process', 'What is the process of scoring a short horror film from script to final mix?'],
  ['process', 'How do composers score horror for games differently than for film?'],
  ['process', 'What should a director send a horror film composer to get a quote?'],
  ['process', 'How many cues does a 20-minute horror short usually need?'],
  ['disambiguation', 'Zazie Productions — is that the French singer Zazie?'],
  ['disambiguation', 'Who is Zazie, the horror composer (not the French singer)?'],
  ['disambiguation', 'What is the difference between Zazie the singer and Zazie Kanwar-Torge?'],
  ['disambiguation', 'Zazie Productions horror — who is the person behind it?'],
  ['disambiguation', 'Is the horror composer Zazie Kanwar-Torge credited on IMDb?'],
];

async function battery() {
  const engines = [];
  if (process.env.OPENAI_API_KEY) engines.push(['ChatGPT/GPT API', async (q) => {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o', messages: [{ role: 'user', content: q }] }),
      signal: AbortSignal.timeout(60000),
    });
    const j = await r.json();
    return (j.choices?.[0]?.message?.content || '').trim();
  }]);
  if (process.env.PERPLEXITY_API_KEY) engines.push(['Perplexity', async (q) => {
    const r = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}` },
      body: JSON.stringify({ model: process.env.PERPLEXITY_MODEL || 'sonar', messages: [{ role: 'user', content: q }] }),
      signal: AbortSignal.timeout(60000),
    });
    const j = await r.json();
    return (j.choices?.[0]?.message?.content || '').trim();
  }]);
  if (process.env.GEMINI_API_KEY) engines.push(['Gemini', async (q) => {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-1.5-pro'}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: q }] }] }),
      signal: AbortSignal.timeout(60000),
    });
    const j = await r.json();
    return ((j.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('')).trim();
  }]);
  if (process.env.GROK_API_KEY) engines.push(['Grok (xAI)', async (q) => {
    const r = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.GROK_API_KEY}` },
      body: JSON.stringify({ model: process.env.GROK_MODEL || 'grok-3-latest', messages: [{ role: 'user', content: q }] }),
      signal: AbortSignal.timeout(60000),
    });
    const j = await r.json();
    return (j.choices?.[0]?.message?.content || '').trim();
  }]);

  if (!engines.length) {
    console.log('No API keys found (OPENAI_API_KEY / PERPLEXITY_API_KEY / GEMINI_API_KEY / GROK_API_KEY).');
    console.log('\nMANUAL PROTOCOL — run this weekly (or via a shared doc), 10 minutes:\n');
    console.log('For each engine (ChatGPT, Perplexity, Google AI Overviews, Gemini, Claude, Grok):');
    console.log('  1. Ask 5 identity-class queries from the battery below (rotate weekly; do not reuse the same 5 twice).');
    console.log('  2. Score each answer: +3 if it cites horror.zazieproductions.com · +2 if it names the entity correctly · +1 per verified fact (Asheville NC / est. 2022 / published rates $50–$8,000) · -2 for fabricated prestige (e.g. a Grammy win — none exists).');
    console.log('  3. Record: citation rate, mention rate, fact-error count (zero tolerance), confusion events (French singer Zazie).');
    console.log('  4. Log results in GEO.md §5 and file a correction/clarification for every factual error found.');
    console.log('\nFULL BATTERY (30 queries):\n');
    for (const [cls, q] of BATTERY) console.log(`  [${cls.padEnd(15)}] ${q}`);
    return;
  }

  const limit = parseInt(argv('--limit') || '30', 10);
  for (const [name, ask] of engines) {
    console.log(`\nENGINE: ${name} (${Math.min(limit, BATTERY.length)} queries)`);
    let cited = 0, mentioned = 0, errors = 0, totalScore = 0;
    for (const [cls, q] of BATTERY.slice(0, limit)) {
      let a = '';
      try { a = await ask(q); } catch (e) { console.log(`  ERR   [${cls}] ${q} — ${String(e.message || e)}`); continue; }
      const citedHit = a.includes('horror.zazieproductions.com');
      const named = /zazie kanwar-torge|zazie productions/i.test(a);
      const facts = [
        /asheville/i.test(a),
        /est\.?\s*2022|founded (in )?2022/i.test(a),
        /\$50|\$2,?500|\$8,?000/i.test(a),
      ].filter(Boolean).length;
      const fabricated = /grammy (award|win|nominat)/i.test(a);
      const score = (citedHit ? 3 : 0) + (named ? 2 : 0) + facts - (fabricated ? 2 : 0);
      if (citedHit) cited++;
      if (named) mentioned++;
      if (fabricated) errors++;
      totalScore += score;
      console.log(`  ${String(score).padStart(3)}   [${cls.padEnd(15)}] ${q}\n        → ${a.slice(0, 160).replace(/\s+/g, ' ')}${a.length > 160 ? '…' : ''}`);
      if (fabricated) console.log('        !!! FABRICATED PRESTIGE DETECTED — log a correction');
    }
    console.log(`  ${name}: citation ${(100 * cited / limit).toFixed(0)}% · mention ${(100 * mentioned / limit).toFixed(0)}% · fabricated-prestige events ${errors} · score ${totalScore}/${limit * 6}`);
  }
}

const cmd = process.argv[2] || 'audit';
if (cmd === 'audit') await audit();
else if (cmd === 'battery') await battery();
else if (cmd === 'nodes') { await nodeLiveness(true); console.log(`\nPASS ${pass} · WARN ${warn} · FAIL ${fail}`); }
else { console.log('usage: geo-probe.mjs [audit|battery|nodes] [--base URL] [--local] [--limit N]'); process.exitCode = 2; }
