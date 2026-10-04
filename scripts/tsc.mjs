#!/usr/bin/env node
/**
 * tsc.mjs — the first step of `npm run build`.
 *
 * Runs the real TypeScript compiler when it is installed (`npm install`, or a
 * CI checkout with node_modules). When it is not — this repository ships no
 * runtime dependencies and every other script is dependency-free — it compiles
 * `src/data/*.ts` with Node's own type-stripping API instead, so `npm run
 * build` works from a clean clone with nothing to install.
 *
 * Both paths produce the same thing: plain ESM in `build/data/`, which the
 * generators import. `src/data` is deliberately written in erasable syntax
 * only (`erasableSyntaxOnly` in tsconfig.json, `import type` everywhere), so
 * stripping types is a complete compile.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'build');

const tscBin = path.join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

if (fs.existsSync(tscBin)) {
  const res = spawnSync(process.execPath, [tscBin, '-p', 'tsconfig.json'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (res.status !== 0) process.exit(res.status ?? 1);
  const files = walk(path.join(OUT, 'data')).length;
  console.log(`tsc: typescript compiler, ${files} compiled module(s) in build/data`);
  process.exit(0);
}

/* ------------------------------------------------------------------ fallback */

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs));
    else out.push(abs);
  }
  return out;
}

if (typeof stripTypeScriptTypes !== 'function') {
  console.error(
    'tsc: neither node_modules/typescript nor Node\'s stripTypeScriptTypes is available.\n' +
      '     Install the compiler with `npm install` (Node 22.18 or newer).'
  );
  process.exit(1);
}

const sources = walk(SRC).filter((f) => f.endsWith('.ts'));
if (!sources.length) {
  console.error('tsc: no TypeScript sources found under src/');
  process.exit(1);
}

let written = 0;
for (const file of sources) {
  const rel = path.relative(SRC, file);
  const target = path.join(OUT, rel.replace(/\.ts$/, '.js'));
  const source = fs.readFileSync(file, 'utf8');
  let compiled;
  try {
    compiled = stripTypeScriptTypes(source, { mode: 'strip', sourceUrl: file });
  } catch (err) {
    console.error(`tsc: ${rel} does not survive type stripping — ${err.message}`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, compiled, 'utf8');
  written++;
}

console.log(
  `tsc: no local typescript — Node type stripping wrote ${written} module(s) to build/data ` +
    '(run `npm install` to type-check with the real compiler)'
);
