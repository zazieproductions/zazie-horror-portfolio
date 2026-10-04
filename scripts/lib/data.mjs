/**
 * Loads the compiled data modules (`build/data/index.js`, written by
 * `scripts/tsc.mjs`) and exposes the small helpers every generator needs.
 *
 * There is exactly one source of truth for content and for URLs: `src/data`.
 * If the compiled output is missing the error tells you the command to run
 * rather than importing something half-built.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const COMPILED = path.join(ROOT, 'build', 'data', 'index.js');

if (!fs.existsSync(COMPILED)) {
  console.error(
    'build/data/index.js is missing — run `node scripts/tsc.mjs` first ' +
      '(or simply `npm run build`).'
  );
  process.exit(1);
}

const data = await import(pathToFileURL(COMPILED).href);

export const {
  SITE,
  MOODS,
  counts,
  cues,
  cueRoutes,
  hubs,
  hubRoutes,
  itemRoutes,
  productionRoutes,
  productions,
  releaseRoutes,
  releases,
  absolute,
  url,
  isoDuration,
  humanDuration,
  clockDuration,
  slugify,
  collectProblems,
  assertDataIntegrity,
  allRoutes,
} = data;

/** Read a file relative to the repository root. */
export function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

/** Write a file relative to the repository root, creating directories. */
export function write(rel, contents) {
  const abs = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, contents, 'utf8');
  return contents.length;
}

export function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

/** The served stylesheet/script hashes the document chrome already uses. */
export function assetNames() {
  const files = fs.readdirSync(ROOT);
  const pick = (prefix, ext) =>
    files
      .filter((f) => new RegExp(`^${prefix}-[0-9a-f]{8}\\.${ext}$`).test(f))
      .sort();
  const css = pick('legal', 'css');
  const js = pick('legal', 'js');
  if (css.length !== 1 || js.length !== 1) {
    console.error(
      `expected exactly one legal-<hash>.css and one legal-<hash>.js at the root, ` +
        `found ${css.length} css and ${js.length} js — run: ./legal-src/build.sh`
    );
    process.exit(1);
  }
  return { css: '/' + css[0], js: '/' + js[0] };
}

/** Run one of the repository's own build scripts (bash + python3). */
export function runGenerator(script, args = []) {
  const res = spawnSync('bash', [script, ...args], { cwd: ROOT, stdio: 'inherit' });
  if (res.status !== 0) {
    console.error(`build: ${script} failed`);
    process.exit(res.status ?? 1);
  }
}

/** Run one of the repository's own Node tools. */
export function runNode(script) {
  const res = spawnSync(process.execPath, [script], { cwd: ROOT, stdio: 'inherit' });
  if (res.status !== 0) {
    console.error(`build: ${script} failed`);
    process.exit(res.status ?? 1);
  }
}

/** Modification time in ms, or 0 when the path does not exist. */
export function mtime(rel) {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.statSync(abs).mtimeMs : 0;
}
