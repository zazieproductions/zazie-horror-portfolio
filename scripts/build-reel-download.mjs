#!/usr/bin/env node
/** Bundle the on-demand ZIP downloader and update the hand-written reel hub. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const licence = fs.readFileSync(path.join(root, 'node_modules/fflate/LICENSE'), 'utf8').trim();
const result = await build({
  entryPoints: [path.join(root, 'src/reel-download/main.js')],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: ['es2020'],
  minify: true,
  write: false,
  legalComments: 'inline',
  banner: { js: `/*! fflate - ${licence}\n*/` },
});

const content = result.outputFiles[0].contents;
const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 8);
const name = `reel-download-${hash}.js`;
for (const file of fs.readdirSync(root)) {
  if (/^reel-download-[0-9a-f]{8}\.js$/.test(file) && file !== name) {
    fs.rmSync(path.join(root, file));
  }
}
fs.writeFileSync(path.join(root, name), content);

const hub = path.join(root, 'reel/index.html');
const html = fs.readFileSync(hub, 'utf8');
const pattern = /\/reel-download-[0-9a-f]{8}\.js/g;
if ((html.match(pattern) || []).length !== 1) {
  throw new Error('reel/index.html must reference exactly one reel-download bundle');
}
fs.writeFileSync(hub, html.replace(pattern, `/${name}`));
console.log(`reel download: wrote ${name} (${content.length} bytes)`);
