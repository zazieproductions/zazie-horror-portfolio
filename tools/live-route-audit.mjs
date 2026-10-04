#!/usr/bin/env node
/**
 * live-route-audit.mjs
 * -----------------------------------------------------------------------------
 * Runs the ITEM-URLS.md §9 route table against a real host, not a local mirror.
 *
 * WHY THIS EXISTS
 *
 * Every status in §9.1 came out of `node server.mjs` -- a faithful mirror of
 * how Cloudflare Pages answers this tree, but still a mirror. The host was
 * unreachable from the sandbox that produced it (the sandbox egress is
 * allow-listed: github.com and registry.npmjs.org answer, everything else --
 * including this host -- dies at the socket), so the local run was the only
 * evidence available. This tool is the other half: it asks the real origin the
 * same questions and prints the same table, so the two can be compared.
 *
 *   node tools/live-route-audit.mjs                        # the live host
 *   node tools/live-route-audit.mjs https://<hash>.pages.dev
 *   node tools/live-route-audit.mjs https://host --markdown # table for §9.1
 *
 * WHAT IT CHECKS
 *
 *   1. every <loc> in sitemap.xml          -> 200, no redirect hop, and the
 *                                             in-page canonical equals the URL
 *                                             the sitemap advertised
 *   2. the ".html" form of each URL        -> 308 to the canonical
 *   3. the trailing-slash form of each URL -> 308 to the canonical, or 200 for
 *                                             the 19 hub routes that Pages
 *                                             serves from <route>/index.html
 *   4. unknown paths                       -> 404
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
      if (type.includes('html') && res.status === 200) {
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

async function run() {
  const started = Date.now();
  const line = (s = '') => process.stdout.write(`${s}\n`);

  if (!markdown) {
    line(`live-route-audit: ${BASE}`);
    line(`sitemap.xml: ${SITEMAP_URLS.length} URLs ` +
      Object.entries(tally(SITEMAP_PATHS)).map(([k, v]) => `${k} ${v}`).join(' / '));
    line('');
  }

  /* ---- 1. every sitemap URL -------------------------------------------- */
  const canonical = await mapLimit(SITEMAP_PATHS, (p) => probe(p));
  const canonFail = canonical.filter((r) => {
    if (r.status !== 200) return true;
    if (r.canonical && r.canonical !== canonicalPath(r.url)) return true;
    if (!r.title) return true;
    if (r.noindex) return true;
    return false;
  });

  /* ---- 2 + 3. the alias forms ------------------------------------------ */
  const aliasJobs = [];
  for (const p of SITEMAP_PATHS) {
    if (p === '/') continue;
    aliasJobs.push({ path: `${p}.html`, expect: 308, to: p, kind: '.html' });
    aliasJobs.push({ path: `${p}/`, expect: hasDirectoryIndex(p) ? 200 : 308, to: p, kind: 'trailing slash' });
  }
  const alias = await mapLimit(aliasJobs, (j) => probe(j.path).then((r) => ({ ...r, ...j })));
  const aliasFail = alias.filter((r) => {
    if (r.status !== r.expect) return true;
    if (r.expect === 308 && r.location !== r.to) return true;
    if (r.expect === 200 && r.canonical && r.canonical !== r.to) return true;
    return false;
  });

  /* ---- 4. unknown paths ------------------------------------------------- */
  const unknownPaths = ['/work/does-not-exist', '/reel/does-not-exist', '/store/does-not-exist', '/nope'];
  const unknown = await mapLimit(unknownPaths, (p) => probe(p));
  const unknownFail = unknown.filter((r) => r.status !== 404);

  /* ---- §9.1 route table ------------------------------------------------- */
  const tablePaths = [
    '/', '/work', '/work/', '/work/expire', '/work/expire.html', '/work/expire/',
    '/work/the-dark-awaits', '/reel', '/reel/needle-in-the-nerve', '/reel/rlyehs-xenolith',
    '/store', '/store/anesthesia-for-the-signal-age', '/store/f998pro-live-sound-card',
    '/sitemap', '/sitemap.xml', '/robots.txt',
    ...unknownPaths,
  ];
  const table = await mapLimit(tablePaths, (p) => probe(p));

  const byPath = new Map();
  for (const r of [...canonical, ...alias, ...unknown, ...table]) byPath.set(r.url, r);
  const expectOf = (p) => {
    if (unknownPaths.includes(p)) return 404;
    if (SITEMAP_PATHS.includes(targetOf(p))) {
      if (p.endsWith('.html')) return 308;
      if (p.endsWith('/') && p !== '/') return hasDirectoryIndex(canonicalPath(p)) ? 200 : 308;
      return 200;
    }
    if (['/sitemap.xml', '/robots.txt'].includes(p)) return 200;
    return 200; // /work/ etc: 200 either from the root twin or the directory index
  };

  const row = (r) => {
    const want = expectOf(r.url);
    const ok = r.status === want && (want !== 308 || r.location === targetOf(r.url));
    return {
      request: r.url,
      status: r.status || 'ERR',
      location: r.location || '-',
      want,
      ok,
      note: r.error ? ` (${r.error})` : '',
    };
  };

  const rows = table.map(row);
  const failures = [...canonFail, ...aliasFail, ...unknownFail];

  /* ---- output ----------------------------------------------------------- */
  if (markdown) {
    line('| request | status | Location |');
    line('|---|---|---|');
    for (const r of rows) {
      line(`| \`${r.request}\` | ${r.ok ? r.status : `**${r.status}** (expected ${r.want})`}${r.note} | ${r.location ? `\`${r.location}\`` : '-'} |`);
    }
    line('');
    line('```');
    line(`checked ${SITEMAP_URLS.length} sitemap URLs against ${BASE}; failing: ${canonFail.length}`);
    line(`checked ${alias.length} alias forms (.html / trailing slash); failing: ${aliasFail.length}`);
    line(`checked ${unknown.length} unknown paths; failing: ${unknownFail.length}`);
    line('```');
    if (failures.length) {
      line('');
      line(`**${failures.length} failing request(s):**`);
      // Group them: when the 65 item URLs are all missing, a flat list buries
      // the hub rows that say something real. Non-item paths sort first.
      const groups = [
        ['canonical URL (expected 200)', canonFail],
        ['.html alias (expected 308 to canonical)', aliasFail.filter((f) => f.kind === '.html')],
        ['trailing-slash alias (expected 308, or 200 for a hub directory index)', aliasFail.filter((f) => f.kind !== '.html')],
        ['unknown path (expected 404)', unknownFail],
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

  line('### route table');
  line('');
  line('  status  location              request');
  for (const r of rows) {
    line(`  ${String(r.status).padEnd(7)} ${String(r.location).padEnd(21)} ${r.request}${r.ok ? '' : `   <-- expected ${r.want}`}${r.note}`);
  }
  line('');
  line(`### every sitemap URL (${SITEMAP_URLS.length})`);
  line(`  expected 200, no redirect hop, in-page canonical == <loc>, <title> present, not noindex`);
  line(`  200: ${canonical.filter((r) => r.status === 200).length}   other: ${canonical.filter((r) => r.status !== 200).length}   failing: ${canonFail.length}`);
  line('');
  line(`### alias forms (${alias.length})`);
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
    for (const f of failures.slice(0, 40)) {
      line(`  ${String(f.status || 'ERR').padEnd(7)} ${f.url}${f.location ? ` -> ${f.location}` : ''}${f.error ? ` (${f.error})` : ''}`);
    }
    if (failures.length > 40) line(`  ... ${failures.length - 40} more`);
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
