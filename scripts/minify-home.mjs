#!/usr/bin/env node
/**
 * Minify the homepage's inline boot/player CSS and JavaScript, then keep the
 * extracted cinema rules byte-identical in the external stylesheet. The
 * latter is important because the prerendered page and the React render both
 * need the same player treatment before and after the app mounts.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexFile = path.join(root, 'index.html');
const htmlBefore = fs.readFileSync(indexFile, 'utf8');

async function minifyCss(source) {
  const result = await transform(source, {
    loader: 'css',
    minify: true,
    legalComments: 'none',
  });
  return result.code.trim();
}

async function minifyJs(source, module) {
  const options = {
    loader: 'js',
    target: 'es2020',
    minify: false,
    minifySyntax: true,
    minifyWhitespace: true,
    // Preserve names in inline blocks so a minified output is stable when the
    // committed generated HTML is used as the next build's input.
    minifyIdentifiers: false,
    legalComments: 'none',
  };
  // Do not force an IIFE format for classic inline code: the boot block is
  // already self-invoking, and wrapping it again would make repeated builds
  // grow by one function wrapper each time. Modules retain ESM semantics.
  if (module) options.format = 'esm';
  const result = await transform(source, options);
  return result.code.trim();
}

/* The homepage's cinema block is deliberately shared with index-*.css. */
const cinemaMarker = '/* Cinema players stay upright';
let cinemaBlock;

let html = htmlBefore;

/* RegExp.replace is synchronous, so process the style/script blocks below with
   indexed matches instead of trying to await from a replacement callback. */
const styleMatches = [...html.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi)];
for (let i = styleMatches.length - 1; i >= 0; i -= 1) {
  const match = styleMatches[i];
  const body = match[2];
  if (!body.trim()) continue;
  let minified;
  const markerAt = body.indexOf(cinemaMarker);
  if (markerAt >= 0) {
    const commentEnd = body.indexOf('*/', markerAt);
    if (commentEnd < 0) throw new Error('homepage cinema style comment is not closed');
    const prefix = await minifyCss(body.slice(0, markerAt));
    const comment = body.slice(markerAt, commentEnd + 2).trim();
    const rules = await minifyCss(body.slice(commentEnd + 2));
    cinemaBlock = `${comment}${rules ? `\n${rules}` : ''}`;
    minified = `${prefix}${prefix && cinemaBlock ? '\n' : ''}${cinemaBlock}`;
  } else {
    minified = await minifyCss(body);
  }
  const start = match.index + match[0].indexOf('>') + 1;
  const end = match.index + match[0].lastIndexOf('</style>');
  html = html.slice(0, start) + minified + html.slice(end);
}

const scriptMatches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
for (let i = scriptMatches.length - 1; i >= 0; i -= 1) {
  const match = scriptMatches[i];
  const attributes = match[1];
  const body = match[2];
  if (!body.trim() || /application\/ld\+json/i.test(attributes)) continue;
  const isModule = /\btype\s*=\s*["']module["']/i.test(attributes);
  const minified = await minifyJs(body, isModule);
  const start = match.index + match[0].indexOf('>') + 1;
  const end = match.index + match[0].lastIndexOf('</script>');
  html = html.slice(0, start) + minified + html.slice(end);
}

if (!cinemaBlock) throw new Error('homepage cinema style block was not found');

/* The external CSS is generated output, not a source module. Minify its
   prefix and append the exact same player block used by the inline style so
   the film-player regression test can compare the two render paths. */
const currentCss = fs.readdirSync(root).find((file) => /^index-[a-f0-9]{8}\.css$/.test(file));
if (!currentCss) throw new Error('homepage stylesheet is missing');
const cssBefore = fs.readFileSync(path.join(root, currentCss), 'utf8');
const cssMarkerAt = cssBefore.indexOf(cinemaMarker);
if (cssMarkerAt < 0) throw new Error(`${currentCss} is missing the cinema player block`);
const cssPrefix = await minifyCss(cssBefore.slice(0, cssMarkerAt));
// The cinema block is the final block in the current homepage stylesheet.
const cssAfter = '';
const cssMinified = `${cssPrefix}${cssPrefix ? '\n' : ''}${cinemaBlock}${cssAfter ? `\n${cssAfter}` : ''}\n`;
const cssHash = crypto.createHash('sha256').update(cssMinified).digest('hex').slice(0, 8);
const nextCss = `index-${cssHash}.css`;
fs.writeFileSync(path.join(root, nextCss), cssMinified, 'utf8');
for (const file of fs.readdirSync(root)) {
  if (/^index-[a-f0-9]{8}\.css$/.test(file) && file !== nextCss) fs.rmSync(path.join(root, file));
}

html = html.replace(/index-[a-f0-9]{8}\.css/g, nextCss);

/* Generate the small deferred-content controller from its readable source. */
const deferSource = fs.readFileSync(path.join(root, 'home-src', 'defer.js'), 'utf8');
const defer = await minifyJs(deferSource, false);
fs.writeFileSync(path.join(root, 'home-defer.js'), `${defer}\n`, 'utf8');

const swFile = path.join(root, 'sw.js');
if (fs.existsSync(swFile)) {
  let sw = fs.readFileSync(swFile, 'utf8');
  sw = sw.replace(/index-[a-f0-9]{8}\.css/g, nextCss);
  sw = sw.replace(/const CACHE_NAME = 'zazie-v(\d+)'/, (_match, version) => {
    const nextVersion = Math.max(Number(version), 35);
    return `const CACHE_NAME = 'zazie-v${nextVersion}'`;
  });
  fs.writeFileSync(swFile, sw, 'utf8');
}

fs.writeFileSync(indexFile, html, 'utf8');
console.log(`minify-home: inline CSS/JS minified; homepage stylesheet is ${nextCss}`);
console.log(`minify-home: wrote home-defer.js (${Buffer.byteLength(defer)} bytes)`);
console.log(`minify-home: homepage HTML ${Buffer.byteLength(htmlBefore)} -> ${Buffer.byteLength(html)} bytes`);
