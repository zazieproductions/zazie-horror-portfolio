#!/usr/bin/env node
/**
 * Keep the copy of src/film/player.js that index.html inlines (between the
 * `zp-film:start` and `zp-film:end` markers of the early player script) equal
 * to the source file. The item pages bundle the same source through Vite, so
 * every surface that plays a self hosted sample runs identical code.
 *
 *   node tools/sync-film-player.mjs          rewrite index.html from the source
 *   node tools/sync-film-player.mjs --check  exit 1 if the two copies differ
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'index.html');
const sourcePath = path.join(root, 'src', 'film', 'player.js');
const START = /\/\* zp-film:start[^*]*(?:\*(?!\/)[^*]*)*\*\/\n/;
const END = '\n/* zp-film:end */';

export function splitInline(html) {
  const startMatch = START.exec(html);
  if (!startMatch) throw new Error('index.html: zp-film:start marker not found');
  const bodyStart = startMatch.index + startMatch[0].length;
  const endIndex = html.indexOf(END, bodyStart);
  if (endIndex < 0) throw new Error('index.html: zp-film:end marker not found');
  return { before: html.slice(0, bodyStart), inline: html.slice(bodyStart, endIndex), after: html.slice(endIndex) };
}

export function inlinedPlayer(html = fs.readFileSync(htmlPath, 'utf8')) {
  return splitInline(html).inline;
}

export function playerSource() {
  return fs.readFileSync(sourcePath, 'utf8').replace(/\n+$/, '');
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const check = process.argv.includes('--check');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const { before, inline, after } = splitInline(html);
  const source = playerSource();
  if (inline === source) {
    console.log('sync-film-player: index.html already carries the current src/film/player.js');
  } else if (check) {
    console.error('sync-film-player: index.html inline player differs from src/film/player.js (run `node tools/sync-film-player.mjs`)');
    process.exit(1);
  } else {
    fs.writeFileSync(htmlPath, before + source + after, 'utf8');
    console.log('sync-film-player: index.html updated from src/film/player.js');
  }
}
