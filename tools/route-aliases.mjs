#!/usr/bin/env node
/**
 * route-aliases.mjs
 * -----------------------------------------------------------------------------
 * Keep one root `<route>.html` twin for every directory route, byte for byte.
 *
 * WHY THIS EXISTS
 *
 * Every route on this site is a real static path: `<route>/index.html` renders
 * `/route/`, and Cloudflare Pages answers the slashless `/route` with its own
 * 308 to that trailing-slash form. Redirect rules that "normalised" the slash
 * the other way therefore pointed straight back into the 308 and looped
 * (/work -> 308 /work/ -> 301 /work -> ... ERR_TOO_MANY_REDIRECTS). See the
 * note at the foot of `_redirects`.
 *
 * The escape hatch is the one /store has always used: a root `<route>.html`
 * sitting next to `<route>/index.html`. Pages serves the file for the
 * slashless request, so the canonical URL that `sitemap.xml`, the page's
 * `<link rel="canonical">` and the `Link: rel="canonical"` header in `_headers`
 * all advertise resolves to a 200 with no redirect hop, while the
 * trailing-slash form keeps working from the directory index.
 *
 * The twins are generated, never hand-edited - editing one would let the
 * slashless canonical and the trailing-slash copy drift apart. Regenerate
 * after any change to a route page:
 *
 *   node tools/route-aliases.mjs            # write/refresh every twin
 *   node tools/route-aliases.mjs --check    # verify parity, write nothing
 *
 * `--check` is also run by tools/check-sitemap.mjs, so a drifted twin fails
 * the site's pre-flight validator rather than reaching production.
 *
 * Exit code 0 = twins match their routes. Exit code 1 = something drifted.
 * -----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* Directories that are assets or sources, never routes. */
const NOT_ROUTES = new Set([
  'images', 'fonts', 'audio', 'tools', 'legal-src', 'store-src', 'node_modules',
]);

/* ------------------------------------------------------------------ helpers */

const CANONICAL = /<link\b[^>]*\brel=["']canonical["'][^>]*>/i;
const HREF = /\bhref=["']([^"']+)["']/i;

function canonicalPathOf(markup) {
  const tag = CANONICAL.exec(markup);
  if (!tag) return null;
  const href = HREF.exec(tag[0]);
  if (!href) return null;
  try {
    return new URL(href[1]).pathname.replace(/\/+$/, '') || '/';
  } catch {
    return null;
  }
}

/**
 * Every directory route under `root`: a `<slug>/index.html` whose own canonical
 * link points at `/<slug>`. Returns entries sorted by slug.
 */
export function discoverRoutes(root = ROOT) {
  const routes = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    if (slug.startsWith('.') || slug.startsWith('_') || NOT_ROUTES.has(slug)) continue;

    const index = path.join(root, slug, 'index.html');
    if (!fs.existsSync(index)) continue;

    const markup = fs.readFileSync(index, 'utf8');
    const canonical = canonicalPathOf(markup);
    if (canonical !== `/${slug}`) {
      routes.push({ slug, index, twin: path.join(root, `${slug}.html`), canonical, mismatch: true });
      continue;
    }

    routes.push({ slug, index, twin: path.join(root, `${slug}.html`), canonical, mismatch: false });
  }
  return routes.sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * Compare each route page with its root twin.
 * Returns a list of problems: { slug, reason, detail }.
 */
export function checkAliases(root = ROOT) {
  const problems = [];
  for (const route of discoverRoutes(root)) {
    if (route.mismatch) {
      problems.push({
        slug: route.slug,
        reason: 'no-matching-canonical',
        detail: `${route.slug}/index.html declares canonical ${route.canonical || 'nothing'}`,
      });
      continue;
    }
    if (!fs.existsSync(route.twin)) {
      problems.push({
        slug: route.slug,
        reason: 'missing-twin',
        detail: `${route.slug}.html does not exist - run: node tools/route-aliases.mjs`,
      });
      continue;
    }
    const a = fs.readFileSync(route.index);
    const b = fs.readFileSync(route.twin);
    if (!a.equals(b)) {
      problems.push({
        slug: route.slug,
        reason: 'drifted-twin',
        detail: `${route.slug}.html differs from ${route.slug}/index.html - run: node tools/route-aliases.mjs`,
      });
    }
  }
  return problems;
}

/* ---------------------------------------------------------------------- CLI */

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const check = process.argv.includes('--check');
  const routes = discoverRoutes(ROOT).filter((r) => !r.mismatch);
  const problems = checkAliases(ROOT);

  if (check) {
    for (const p of problems) console.log(`  FAIL   ${p.slug.padEnd(14)} ${p.detail}`);
    console.log('');
    if (problems.length) {
      console.log(`route aliases: ${problems.length} problem(s) in ${routes.length} routes.`);
      process.exit(1);
    }
    console.log(`route aliases: ${routes.length} routes, every root twin matches its route page.`);
    process.exit(0);
  }

  let written = 0;
  for (const route of routes) {
    const markup = fs.readFileSync(route.index);
    const current = fs.existsSync(route.twin) ? fs.readFileSync(route.twin) : null;
    if (current && current.equals(markup)) continue;
    fs.writeFileSync(route.twin, markup);
    written++;
    console.log(`wrote ${route.slug}.html (${markup.length} bytes, twin of ${route.slug}/index.html)`);
  }

  const blocking = problems.filter((p) => p.reason === 'no-matching-canonical');
  for (const p of blocking) console.log(`  skipped ${p.slug}: ${p.detail}`);
  console.log(
    written
      ? `route aliases: ${written} twin(s) written, ${routes.length} routes total.`
      : `route aliases: ${routes.length} routes, all twins already current.`
  );
  process.exit(blocking.length ? 1 : 0);
}
