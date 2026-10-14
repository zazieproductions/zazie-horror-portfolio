#!/usr/bin/env node
/**
 * scripts/build-estimator.mjs
 * ----------------------------------------------------------------------------
 * Bundles the scope estimator and inquiry form (src/estimator/main.ts) and its
 * stylesheet (src/estimator/estimator.css) into content-hashed root assets:
 *
 *   estimator-<hash8>.js    IIFE, minified, loaded with `defer`
 *   estimator-<hash8>.css   minified
 *
 * Like store-src/build.sh and legal-src/build.sh, the hash is taken from the
 * content, so the immutable cache headers in _headers stay honest. The script
 * then points every committed page and sw.js PRECACHE_ASSETS at the new names,
 * and removes superseded copies.
 *
 *   node scripts/build-estimator.mjs
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, transform } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', 'build', '.git', 'dist', 'out', 'coverage', '.cache']);
const hash8 = (text) => crypto.createHash('sha256').update(text).digest('hex').slice(0, 8);
const REF = /\/estimator-[0-9a-f]{8}\.(js|css)\b/g;

const jsResult = await build({
  entryPoints: [path.join(root, 'src/estimator/main.ts')],
  bundle: true,
  format: 'iife',
  target: ['es2019'],
  minify: true,
  legalComments: 'none',
  write: false,
  logLevel: 'silent',
});
const js = jsResult.outputFiles[0].text;

const cssSource = fs.readFileSync(path.join(root, 'src/estimator/estimator.css'), 'utf8');
const css = (await transform(cssSource, { loader: 'css', minify: true, legalComments: 'none' })).code;

const jsName = `estimator-${hash8(js)}.js`;
const cssName = `estimator-${hash8(css)}.css`;

for (const entry of fs.readdirSync(root)) {
  if (/^estimator-[0-9a-f]{8}\.(js|css)$/.test(entry) && entry !== jsName && entry !== cssName) {
    fs.rmSync(path.join(root, entry));
  }
}
fs.writeFileSync(path.join(root, jsName), js, 'utf8');
fs.writeFileSync(path.join(root, cssName), css, 'utf8');

/** Point every committed page and the service worker at the current hashes. */
function* textFiles(dir = root) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* textFiles(full);
    } else if (entry.name.endsWith('.html') || entry.name === 'sw.js') {
      yield full;
    }
  }
}

const updated = [];
for (const file of textFiles()) {
  const source = fs.readFileSync(file, 'utf8');
  if (!/\/estimator-[0-9a-f]{8}\.(js|css)\b/.test(source)) continue;
  const next = source.replace(REF, (_m, ext) => `/${ext === 'js' ? jsName : cssName}`);
  if (next !== source) {
    fs.writeFileSync(file, next, 'utf8');
    updated.push(path.relative(root, file));
  }
}

// Any page that carries pricing markers or the estimator's data attributes
// gets the stylesheet and script, with the current hashed names.
for (const file of textFiles()) {
  if (!file.endsWith('.html')) continue;
  const source = fs.readFileSync(file, 'utf8');
  if (!/<!--zp:|\{\{zp:|data-zp-/.test(source)) continue;
  let next = source;
  if (!/\/estimator-[0-9a-f]{8}\.css/.test(next)) {
    next = next.replace('</head>', () => `<link href="/${cssName}" rel="stylesheet"/>\n</head>`);
  }
  if (!/\/estimator-[0-9a-f]{8}\.js/.test(next)) {
    next = next.replace('</body>', () => `<script src="/${jsName}" defer></script>\n</body>`);
  }
  if (next !== source) {
    fs.writeFileSync(file, next, 'utf8');
    if (!updated.includes(path.relative(root, file))) updated.push(path.relative(root, file));
  }
}

console.log(`build-estimator: wrote ${jsName} (${js.length} bytes), ${cssName} (${css.length} bytes)`);
if (updated.length) console.log(`build-estimator: updated references in ${updated.join(', ')}`);
