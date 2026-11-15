#!/usr/bin/env node
/**
 * scripts/build-hit-beacon.mjs
 * ----------------------------------------------------------------------------
 * Puts the page-view beacon on every served page.
 *
 * hit.js (repository root) is hand-maintained source, like documents.js and
 * selected-cues.js, and carries no content hash: it is a few hundred bytes and
 * `/*` in _headers already serves it with must-revalidate, so a hash would buy
 * nothing and cost a rewrite of every page on each edit.
 *
 * What this step does is the part that cannot be done once by hand: the pages
 * it has to appear on are generated (legal-src, home-src, the item and hub
 * renderers, prerender), so the tag is re-applied after they are written. It is
 * idempotent — a page that already loads /hit.js is left untouched, which is
 * what makes the two consecutive `npm run build` passes in CI produce an
 * identical tree.
 *
 *   node scripts/build-hit-beacon.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TAG = '<script src="/hit.js" defer></script>';

/** Directories that are not served pages: sources, tooling, build output. */
const SKIP_DIRS = new Set([
  '.git',
  '.github',
  'node_modules',
  'build',
  'dist',
  'out',
  'coverage',
  '.cache',
  'scripts',
  'src',
  'tools',
  'docs',
  'legal-src',
  'store-src',
  'home-src',
  'public',
]);

if (!fs.existsSync(path.join(root, 'hit.js'))) {
  console.error('build-hit-beacon: hit.js is missing from the repository root');
  process.exit(1);
}

/**
 * Every page the edge serves: root *.html, the hub and document directories
 * (<dir>/index.html) and the generated item pages beside them (<dir>/<slug>.html).
 * Two levels is the whole tree; anything deeper is not a served page.
 */
function servedPages() {
  const pages = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      for (const inner of fs.readdirSync(path.join(root, entry.name), { withFileTypes: true })) {
        if (inner.isFile() && inner.name.endsWith('.html')) {
          pages.push(path.join(root, entry.name, inner.name));
        }
      }
    } else if (entry.name.endsWith('.html')) {
      pages.push(path.join(root, entry.name));
    }
  }
  return pages;
}

const touched = [];
for (const file of servedPages()) {
  const source = fs.readFileSync(file, 'utf8');
  if (source.includes('/hit.js')) continue;
  if (!source.includes('</body>')) {
    console.error(`build-hit-beacon: ${path.relative(root, file)} has no </body> to attach the beacon to`);
    process.exit(1);
  }
  fs.writeFileSync(file, source.replace('</body>', () => `${TAG}\n</body>`), 'utf8');
  touched.push(path.relative(root, file));
}

console.log(`build-hit-beacon: ${touched.length === 0 ? 'every served page already loads /hit.js' : `added the beacon to ${touched.length} page(s)`}`);
