#!/usr/bin/env node
/**
 * live-route-audit.mjs
 * -----------------------------------------------------------------------------
 * Runs the route audit against a real host, not a local mirror.
 *
 * The sandbox cannot reach the production domain (egress is allow-listed), so
 * `server.mjs` supplies the local HTTP check while this tool is intended for a
 * runner or machine that can reach the selected host. A local audit is not
 * represented as a live production status table.
 *
 *   node tools/live-route-audit.mjs                        # the live host
 *   node tools/live-route-audit.mjs https://<hash>.pages.dev
 *   node tools/live-route-audit.mjs https://host --markdown # table output
 *
 * WHAT IT CHECKS
 *
 *   1. every <loc> in sitemap.xml          -> 200, no redirect hop, and the
 *                                             in-page canonical equals the URL
 *                                             the sitemap advertised
 *   2. the ".html" form of each URL        -> 308 to the canonical (or an
 *                                             explicit legacy 301 in _redirects)
 *   3. trailing-slash form of each URL      -> 200 for the original directory
 *                                             hubs, 404 for flat item routes
 *                                             (there is no item slash twin)
 *   4. unknown paths and slash twins        -> HTML 404 with noindex
 *
 * Run it from anywhere with internet access. From the build sandbox it dies on
 * the first fetch, by design -- see .github/workflows/live-route-audit.yml for
 * the dispatch that runs it on a runner that can reach the host.
 *
 * No dependencies; Node 18+ (global fetch). Exit 0 = every expectation held.
 * -----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITEMAP = path.join(ROOT, 'sitemap.xml');
const DEFAULT_BASE = 'https://horror.zazieproductions.com';
const UA = 'zazie-live-route-audit/1.0 (+https://github.com/zazieproductions/zazie-horror-portfolio)';
const CONCURRENCY = 8;
const TIMEOUT_MS = 25_000;

/* ------------------------------------------------------------------- args */

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const positional = argv.filter((a) => !a.startsWith('--'));
const markdown = flags.has('--markdown');
const BASE = (positional.filter(Boolean)[0] || DEFAULT_BASE).replace(/\/+$/, '');

/* --------------------------------------------------------------- sitemap */

/** Page <loc>s only: <image:loc>/<video:loc> live inside the same <url> block. */
function sitemapUrls() {
  if (!fs.existsSync(SITEMAP)) {
    console.error(`live-route-audit: no sitemap.xml at ${SITEMAP}`);
    process.exit(2);
  }
  const xml = fs.readFileSync(SITEMAP, 'utf8');
  const blocks = xml.match(/<url\b[\s\S]*?<\/url>/g) || [];
  const urls = blocks
    .map((b) => (/<loc>\s*([^<\s]+)\s*<\/loc>/.exec(b) || [])[1])
    .filter(Boolean)
    .map((u) => u.replace(/&amp;/g, '&'));
  if (!urls.length) {
    console.error('live-route-audit: sitemap.xml contains no page <loc>');
    process.exit(2);
  }
  return urls;
}

const SITEMAP_URLS = sitemapUrls();
const SITEMAP_PATHS = SITEMAP_URLS.map((u) => new URL(u).pathname.replace(/\/+$/, '') || '/');

const bucket = (p) => {
  if (p === '/') return 'home';
  if (/^\/work\/.+/.test(p)) return 'work item';
  if (/^\/reel\/.+/.test(p)) return 'reel item';
  if (/^\/store\/.+/.test(p)) return 'store item';
  return 'hub';
};
const tally = (paths) => paths.reduce((acc, p) => ({ ...acc, [bucket(p)]: (acc[bucket(p)] || 0) + 1 }), {});

/* ---------------------------------------------------------------- fetching */

async function probe(urlPath) {
  const url = BASE + urlPath;
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: 'manual',
        headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,*/*' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const location = res.headers.get('location') || '';
      const type = res.headers.get('content-type') || '';
      const out = { url: urlPath, status: res.status, location: relative(location), type };
      if (type.toLowerCase().includes('html')) {
        const body = await res.text();
        out.canonical = relative((/<link\b[^>]*\brel=["']canonical["'][^>]*>/i.exec(body) || [])[0]
          ? (/\bhref=["']([^"']+)["']/i.exec(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i.exec(body)[0]) || [])[1] || ''
          : '');
        out.title = (/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(body) || [])[1]?.trim() || '';
        out.noindex = /<meta\b[^>]*\bname=["']robots["'][^>]*\bnoindex/i.test(body)
          || (res.headers.get('x-robots-tag') || '').toLowerCase().includes('noindex');
      }
      return out;
    } catch (err) {
      lastErr = err;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 750 * (attempt + 1)));
    }
  }
  return { url: urlPath, status: 0, location: '', error: lastErr?.message || String(lastErr) };
}

/** Show the hostless form so the table reads the way the docs do. */
function relative(loc) {
  if (!loc) return '';
  try {
    const u = new URL(loc, BASE);
    return u.pathname + u.search;
  } catch {
    return loc;
  }
}

async function mapLimit(items, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx], idx);
      }
    }),
  );
  return out;
}

/* ------------------------------------------------------------- expectations */

/** A hub route is one Pages can answer from a directory index (<route>/index.html). */
const hasDirectoryIndex = (p) => p !== '/' && fs.existsSync(path.join(ROOT, p, 'index.html'));

const canonicalPath = (p) => p.replace(/\/+$/, '') || '/';

/** The canonical an alias form is supposed to point at: strip ".html" and any trailing slash. */
const targetOf = (p) => canonicalPath(p.endsWith('.html') ? p.slice(0, -'.html'.length) : p);

/**
 * Explicit `_redirects` rules win over the host's own conventions: eight legacy
 * `.html` forms carry a hand-written 301 there, so they answer 301 where every
 * other `.html` form is 308'd by Pages itself. Only exact paths are honoured --
 * splats and placeholders are left to the host.
 */
function redirectRules() {
  const file = path.join(ROOT, '_redirects');
  if (!fs.existsSync(file)) return new Map();
  const rules = new Map();
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const [from, to, status] = line.split(/\s+/);
    if (!from || !to || /[*:(]/.test(from)) continue;
    rules.set(from, { to, status: Number(status) || 301 });
  }
  return rules;
}

const RULES = redirectRules();


/* Paths that are not in the sitemap and never should be: these must 404. */
const unknownPaths = [
  '/work/does-not-exist',
  '/work/does-not-exist/',
  '/reel/does-not-exist',
  '/store/does-not-exist',
  '/store/motion-sensor-skull-heads', // main's alternate slug is not a second item URL
  '/store/motion-sensor-skull-heads.html',
  '/work/does-not-exist.html',
  '/nope',
];

async function run() {
  const started = Date.now();
  const line = (s = '') => process.stdout.write(`${s}\n`);

  /* ------------------------------------------------------ expectations */

  /** What this request should answer, honouring _redirects over host convention. */
  const expectedFor = (p) => {
    const rule = RULES.get(p);
    if (rule) return { status: rule.status, to: rule.to };
    if (unknownPaths.includes(p) || unknownPaths.includes(targetOf(p))) return { status: 404, to: null };
    if (SITEMAP_PATHS.includes(targetOf(p))) {
      if (p.endsWith('.html')) return { status: 308, to: targetOf(p) };
      if (p.endsWith('/') && p !== '/') {
        // Original hubs still have directory indexes; a flat item has no
        // <slug>/index.html twin and must remain a real noindex 404.
        return hasDirectoryIndex(targetOf(p)) ? { status: 200, to: null } : { status: 404, to: null };
      }
      return { status: 200, to: null };
    }
    return { status: 200, to: null }; // /work and friends, /sitemap.xml, /robots.txt
  };

  /** Does a probe match its expectation? */
  const rowOk = (r) => {
    const want = expectedFor(r.url);
    if (r.status !== want.status) return false;
    if (want.to && r.location !== want.to) return false;
    if (want.status === 200 && SITEMAP_PATHS.includes(targetOf(r.url))) {
      if (!r.type?.toLowerCase().includes('html')) return false;
      if (r.canonical !== targetOf(r.url)) return false;
    }
    if (want.status === 404 && (!r.type?.toLowerCase().includes('html') || !r.noindex)) return false;
    return true;
  };

  const row = (r) => {
    const want = expectedFor(r.url);
    return {
      request: r.url,
      status: r.status || 'ERR',
      location: r.location || '-',
      want: want.status,
      ok: rowOk(r),
      note: r.error ? ` (${r.error})` : want.status === 404 && !r.noindex ? ' (missing noindex)' : '',
    };
  };

  /* ------------------------------------------------------------- probes */

  /* 1. every <loc> in sitemap.xml */
  const canonical = await mapLimit(SITEMAP_PATHS, (p) => probe(p));
  const canonFail = canonical.filter((r) => !rowOk(r) || !r.title || r.noindex);

  /* 2 + 3. the alias forms of every URL */
  const aliasJobs = [];
  for (const p of SITEMAP_PATHS) {
    if (p === '/') continue;
    aliasJobs.push({ path: `${p}.html`, kind: '.html' });
    aliasJobs.push({ path: `${p}/`, kind: 'trailing slash' });
  }
  const alias = await mapLimit(aliasJobs, (j) => probe(j.path).then((r) => ({ ...r, ...j })));
  const aliasFail = alias.filter((r) => !rowOk(r));

  /* 4. unknown paths */
  const unknown = await mapLimit(unknownPaths, (p) => probe(p));
  const unknownFail = unknown.filter((r) => !rowOk(r) || !r.noindex);

  /* the §9.1 route table */
  const tablePaths = [
    '/', '/work', '/work/', '/work/expire', '/work/expire.html', '/work/expire/',
    '/work/the-dark-awaits', '/reel', '/reel/needle-in-the-nerve', '/reel/rlyehs-xenolith',
    '/store', '/store/anesthesia-for-the-signal-age', '/store/f998pro-live-sound-card',
    '/sitemap', '/sitemap.xml', '/robots.txt',
    ...unknownPaths,
  ];
  const rows = (await mapLimit(tablePaths, (p) => probe(p))).map(row);
  const failures = [...canonFail, ...aliasFail, ...unknownFail];

  /* ------------------------------------------------------------- output */

  if (markdown) {
    line(`# Live route audit — ${BASE}`);
    line('');
    line(`Checked ${SITEMAP_URLS.length} sitemap URLs, ${alias.length} alias forms, and ${unknown.length} unknown paths.`);
    line('');
    line('## Sitemap URLs');
    line('');
    line('| URL path | HTTP | Canonical | Result |');
    line('|---|---:|---|---|');
    for (const r of canonical) {
      const ok = rowOk(r) && Boolean(r.title) && !r.noindex;
      const status = ok ? String(r.status) : `**${r.status || 'ERR'}**`;
      const canon = r.canonical ? `\`${r.canonical}\`` : '-';
      line(`| \`${r.url}\` | ${status} | ${canon} | ${ok ? 'PASS' : 'FAIL'} |`);
    }
    line('');
    line('## Representative route and error cases');
    line('');
    line('| Request | HTTP | Location | Result |');
    line('|---|---:|---|---|');
    for (const r of rows) {
      const status = r.ok ? String(r.status) : `**${r.status || 'ERR'}** (expected ${r.want})`;
      line(`| \`${r.request}\` | ${status} | ${r.location !== '-' ? `\`${r.location}\`` : '-'} | ${r.ok ? 'PASS' : 'FAIL'}${r.note} |`);
    }
    line('');
    line('```');
    line(`sitemap URLs: ${canonical.filter((r) => rowOk(r) && r.title && !r.noindex).length}/${SITEMAP_URLS.length} passed; failing: ${canonFail.length}`);
    line(`alias forms: ${alias.length} checked (.html / trailing slash); failing: ${aliasFail.length}`);
    line(`unknown paths: ${unknown.length} checked (404 + noindex); failing: ${unknownFail.length}`);
    line('```');
    if (failures.length) {
      line('');
      line(`**${failures.length} failing request(s):**`);
      // Group them: when the 65 item URLs are all missing, a flat list buries
      // the hub rows that say something real. Non-item paths sort first.
      const groups = [
        ['canonical URL (expected 200)', canonFail],
        ['.html alias (expected 308 to the canonical, or the 301 _redirects wrote)', aliasFail.filter((f) => f.kind === '.html')],
        ['trailing-slash alias (expected 200 for a hub directory index, 404 for an item)', aliasFail.filter((f) => f.kind !== '.html')],
        ['unknown path (expected 404 with noindex)', unknownFail],
      ];
      const rank = (f) => (/^\/(work|reel|store)\/.+/.test(f.url) ? 1 : 0);
      for (const [label, list] of groups) {
        if (!list.length) continue;
        line('');
        line(`${label} — ${list.length} failing`);
        line('');
        line('```');
        for (const f of [...list].sort((a, b) => rank(a) - rank(b) || a.url.localeCompare(b.url)).slice(0, 12)) {
          line(`${String(f.status || 'ERR').padEnd(4)} ${f.url}${f.location ? ` -> ${f.location}` : ''}${f.error ? ` (${f.error})` : ''}`);
        }
        if (list.length > 12) line(`... and ${list.length - 12} more`);
        line('```');
      }
    }
    process.exit(failures.length ? 1 : 0);
  }

  line(`live-route-audit: ${BASE}`);
  line(`sitemap.xml: ${SITEMAP_URLS.length} URLs ` +
    Object.entries(tally(SITEMAP_PATHS)).map(([k, v]) => `${k} ${v}`).join(' / '));
  line('');
  line('### route table');
  line('');
  line('  status  location              request');
  for (const r of rows) {
    line(`  ${String(r.status).padEnd(7)} ${String(r.location).padEnd(21)} ${r.request}${r.ok ? '' : `   <-- expected ${r.want}`}${r.note}`);
  }
  line('');
  line(`### every sitemap URL (${SITEMAP_URLS.length})`);
  line('  expected 200, no redirect hop, in-page canonical == <loc>, <title> present, not noindex');
  line(`  200: ${canonical.filter((r) => r.status === 200).length}   other: ${canonical.filter((r) => r.status !== 200).length}   failing: ${canonFail.length}`);
  line('');
  line(`### alias forms (${alias.length})`);
  line('  .html: 308 (or the explicit legacy 301); hub slash form: 200; item slash twin: 404 with noindex');
  const shapes = alias.reduce((acc, r) => {
    const key = `${r.kind} -> ${r.status}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  for (const [k, v] of Object.entries(shapes).sort()) line(`  ${k}: ${v}`);
  line(`  failing: ${aliasFail.length}`);
  line('');
  line('### unknown paths');
  for (const r of unknown) line(`  ${String(r.status || 'ERR').padEnd(7)} ${r.url}`);
  line('');
  if (failures.length) {
    line(`### FAIL — ${failures.length} request(s) did not answer as expected`);
    const rank = (f) => (/^\/(work|reel|store)\/.+/.test(f.url) ? 1 : 0);
    for (const f of [...failures].sort((a, b) => rank(a) - rank(b) || a.url.localeCompare(b.url)).slice(0, 25)) {
      line(`  ${String(f.status || 'ERR').padEnd(7)} ${f.url}${f.location ? ` -> ${f.location}` : ''}${f.error ? ` (${f.error})` : ''}`);
    }
    if (failures.length > 25) line(`  ... and ${failures.length - 25} more`);
  } else {
    line(`### PASS — ${SITEMAP_URLS.length} sitemap URLs, ${alias.length} alias forms, ${unknown.length} unknown paths, all as expected`);
  }
  line('');
  line(`(${((Date.now() - started) / 1000).toFixed(1)}s, ${BASE})`);
  process.exit(failures.length ? 1 : 0);
}

run().catch((err) => {
  console.error(`\nlive-route-audit: ${err.message}\n`);
  if (/fetch failed|getaddrinfo|ENOTFOUND|UND_ERR/i.test(err.message)) {
    console.error('The host did not answer at all. If this is the build sandbox, that is expected:');
    console.error('egress is allow-listed and this host is not on it. Run it from a machine with');
    console.error('internet access, or dispatch .github/workflows/live-route-audit.yml.\n');
  }
  process.exit(2);
});
