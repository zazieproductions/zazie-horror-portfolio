#!/usr/bin/env node
/**
 * Regression checks for the homepage render-path and legibility work:
 *
 *   1. The React bundle mount is gated for crawlers/automated clients, so the
 *      prerendered document is never torn down by createRoot().render() in
 *      front of an indexing agent, and no redundant asset chain is triggered.
 *   2. The service worker precache no longer bypasses the HTTP cache
 *      (cache:'reload' forced a second download of every precached asset;
 *      the merged implementation pins cache:'force-cache').
 *   3. The homepage stylesheet carries the AA link-contrast red (#e65650) and
 *      persistent paragraph-link underlines, while the designed type scale
 *      (the 8-12px uppercase labels and the mobile prose size) is left alone:
 *      the 2026-10-25 blanket 12px/16px floors are deliberately absent.
 *   4. The biography (#about), psychoacoustic story, and compilations sit
 *      together after the showreel in both the prerendered document and the
 *      React bundle's render order, and numbered kickers remain in sequence.
 *
 * Run: node --test tools/home-mount.test.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const html = read('index.html');
const sw = read('sw.js');

const mountStart = html.indexOf('// 4. React Bundle Mount');
const mountEnd = html.indexOf('</script>', mountStart);
assert.ok(mountStart > 0 && mountEnd > mountStart, 'React bundle mount section exists in index.html');
const mountSection = html.slice(mountStart, mountEnd);

test('the dynamic bundle import is still the single idle-scheduled React mount', () => {
  assert.match(mountSection, /import\("\/index-[0-9a-f]{8}\.js"\)/, 'mount imports the content-hashed home bundle');
  assert.match(mountSection, /requestIdleCallback|setTimeout/, 'mount stays scheduled off the critical path');
  // Exactly one dynamic import of the home bundle in the whole document.
  const imports = html.match(/import\("\/index-[0-9a-f]{8}\.js"\)/g) ?? [];
  assert.equal(imports.length, 1);
});

test('crawlers and automated clients skip the destructive React mount', () => {
  const gateMatch = /const ZP_RUNTIME_BOT\s*=\s*\/(.+?)\/i\.test\(navigator\.userAgent\)/.exec(mountSection);
  assert.ok(gateMatch, 'mount section declares the ZP_RUNTIME_BOT user-agent gate');
  const gate = new RegExp(gateMatch[1], 'i');
  for (const ua of [
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'Mozilla/5.0 (compatible; YandexBot/3.0)',
    'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (compatible; DuckDuckBot/1.1; +http://duckduckgo.com/duckduckbot.html)',
  ]) {
    assert.ok(gate.test(ua), `gate must classify ${ua.slice(0, 48)}… as an automated client`);
  }
  for (const ua of [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
  ]) {
    assert.equal(gate.test(ua), false, `gate must not classify a human visitor UA as a bot: ${ua.slice(0, 48)}`);
  }
  // The guard has to run before the import is scheduled inside boot().
  const guardAt = mountSection.indexOf('if (ZP_RUNTIME_BOT) return;');
  const importAt = mountSection.indexOf('import(');
  assert.ok(guardAt > 0 && guardAt < importAt, 'bot guard returns before the bundle import');
});

test('the service worker precache reuses the browser HTTP cache instead of re-downloading assets', () => {
  const installHandler = sw.slice(sw.indexOf("addEventListener('install'"), sw.indexOf("addEventListener('activate'"));
  // Scope to executable code: the changelog comments above the handler discuss
  // the old cache:'reload' mode on purpose.
  const codeOnly = installHandler.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert.doesNotMatch(codeOnly, /cache:\s*['"]reload['"]/, "precache code must not force cache:'reload' (duplicate first-visit downloads)");
  assert.match(codeOnly, /await fetch\(url,\s*\{\s*cache:\s*['"]force-cache['"]\s*\}\)/, 'precache pins force-cache so install never bypasses the HTTP cache');
  assert.match(sw, /CACHE_NAME\s*=\s*'zazie-v\d+'/, 'cache name stays versioned');
});

test('precached homepage stylesheet is the same hashed file the document links', () => {
  const cssName = /href="(index-[0-9a-f]{8}\.css)"/.exec(html)?.[1];
  assert.ok(cssName, 'index.html links a content-hashed stylesheet');
  assert.ok(fs.existsSync(path.join(ROOT, cssName)), `${cssName} exists in the served root`);
  assert.match(sw, new RegExp(`'/${cssName.replace(/\./g, '\\.')}'`), 'sw.js precaches the exact stylesheet the homepage loads');
  // No stale index stylesheet left behind after the content-hash rename.
  const sheets = fs.readdirSync(ROOT).filter((name) => /^index-[0-9a-f]{8}\.css$/.test(name));
  assert.deepEqual(sheets, [cssName]);
});

test('the biography, psychoacoustic story, and compilations stay in order in both render paths', () => {
  const jsFile = /import\("\/(index-[0-9a-f]{8}\.js)"\)/.exec(html)?.[1];
  assert.ok(jsFile, 'index.html imports a content-hashed home bundle');
  const bundle = read(jsFile);
  // Static first paint: showreel, biography, field notes, compilations, then press.
  const staticOrder = [
    '<section id="showreel"',
    '<section id="about"',
    '<section id="psychoacoustic-score"',
    '<section id="compilations"',
    '<section id="press"',
  ].map((marker) => html.indexOf(marker));
  assert.ok(staticOrder.every((at) => at >= 0), 'all five sections exist in index.html');
  assert.deepEqual([...staticOrder].sort((a, b) => a - b), staticOrder, 'index.html keeps the story between biography and compilations');
  // React render: About and its new story section follow the showreel (G5),
  // before compilations and the press kit, not after Services (lj).
  const renderOrder = [
    'u.jsx(G5,{"data-source-loc":"src/App.tsx:34:10"})',
    'u.jsx(rj,{"data-source-loc":"src/App.tsx:45:10"})',
    'u.jsx(zpPsychologicalScore,{})',
    'u.jsx(zpCompilations,{})',
    'u.jsx(I5,',
  ].map((marker) => bundle.indexOf(marker));
  assert.ok(renderOrder.every((at) => at >= 0), 'bundle renders showreel, biography, story, compilations, and press');
  assert.deepEqual([...renderOrder].sort((a, b) => a - b), renderOrder, 'bundle keeps the story between biography and compilations');
  assert.equal(bundle.match(/u\.jsx\(rj,/g)?.length, 1, 'the biography renders exactly once');
  assert.equal(bundle.match(/u\.jsx\(zpPsychologicalScore,/g)?.length, 1, 'the story section renders exactly once');
  // The numbered kickers follow the existing 01–06 sequence without gaps.
  const kickers = ['01 · On screen', '02 · Showreel', '03 · Biography', '04 · Approach', '05 · Scoring services', '06 · Contact']
    .map((marker) => html.indexOf(marker));
  assert.ok(kickers.every((at) => at >= 0), 'every numbered kicker is present');
  assert.deepEqual([...kickers].sort((a, b) => a - b), kickers, 'numbered sections remain in sequence');
});

test('the psychological-horror copy is vivid, conversion-focused, and avoids universal fear claims', () => {
  const jsFile = /import\("\/(index-[0-9a-f]{8}\.js)"\)/.exec(html)?.[1];
  assert.ok(jsFile, 'index.html imports a content-hashed home bundle');
  const bundle = read(jsFile);
  assert.match(html, /Why do certain frequencies make the body prepare to die\?/);
  assert.match(html, /Infrasound · below 20 Hz/);
  assert.match(html, /a minor second/);
  assert.match(html, /0\.8 seconds/);
  assert.match(html, /films &amp; game projects/);
  assert.match(html, /five years of focused acoustic research/);
  assert.match(html, /isn't a universal fear switch/);
  assert.match(html, /Talk through a scene/);
  assert.match(html, /Listen to the reel/);
  assert.match(html, /id="zp-psycho-style"[\s\S]*?prefers-reduced-motion:reduce/);
  assert.match(bundle, /Why do certain frequencies make the body prepare to die\?/);
  assert.match(bundle, /function zpPsychologicalScore\(\)/);
});

test('homepage CSS carries AA link red and persistent underlines without type floors', () => {
  const cssName = /href="(index-[0-9a-f]{8}\.css)"/.exec(html)[1];
  const css = read(cssName);
  // AA red (4.61-5.71:1 across the dark surfaces) replaces the 3.49:1 brand red for foreground text.
  assert.match(css, /\.text-blood,[\s\S]*?\{ color:#e65650; \}/, 'text-blood foregrounds use the AA red #e65650');
  assert.doesNotMatch(css, /#ff4d4d/, 'the superseded #ff4d4d experiment is not carried into the merged stylesheet');
  // Persistent underline for every link inside prose, so color is not the sole affordance.
  assert.match(css, /p a \{ text-decoration:underline;/, 'paragraph links carry a persistent underline');
  // The designed type scale is untouched: no global floor on the sub-12px
  // bracket utilities, no forced 16px mobile prose, no rewritten close label.
  assert.doesNotMatch(css, /\.text-\\\[11px\\\] \{ font-size:\.75rem; \}/, 'the blanket 12px microtype floor stays reverted');
  assert.doesNotMatch(css, /\.sm\\:text-\\\[11px\\\] \{ font-size:\.75rem; \}/, 'the responsive sm: floor stays reverted');
  assert.doesNotMatch(css, /font-size:1rem !important/, 'the forced 16px mobile prose rule stays reverted');
  assert.doesNotMatch(css, /body \.zp-player-close \{ font-size:12px; \}/, 'the cinema close label keeps its designed size');
  // The mirrored cinema-player block must remain the tail of the stylesheet.
  const marker = '/* Cinema players stay upright';
  assert.ok(css.indexOf(marker) > css.indexOf('#e65650'), 'accessibility rules stay before the byte-identical cinema-player marker');
});
