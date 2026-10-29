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
 *   4. The biography (#about) sits before the compilations section, straight
 *      after the showreel, in both the prerendered document and the React
 *      bundle's render order, and the numbered section kickers run in
 *      sequence (Biography is 03, not its shipped 05).
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

test('the biography sits before the compilations in the static page and the bundle render', () => {
  const jsFile = /import\("\/(index-[0-9a-f]{8}\.js)"\)/.exec(html)?.[1];
  assert.ok(jsFile, 'index.html imports a content-hashed home bundle');
  const bundle = read(jsFile);
  // Static first paint: showreel, then biography, then compilations, then press.
  const staticOrder = ['<section id="showreel"', '<section id="about"', '<section id="compilations"', '<section id="press"']
    .map((marker) => html.indexOf(marker));
  assert.ok(staticOrder.every((at) => at >= 0), 'all four sections exist in index.html');
  assert.deepEqual([...staticOrder].sort((a, b) => a - b), staticOrder, 'index.html orders #about before #compilations, after #showreel');
  // React render: About (rj) is invoked once, between the showreel (G5) and
  // the compilations component; the retired homepage Services component is gone.
  const renderOrder = [
    'u.jsx(G5,{"data-source-loc":"src/App.tsx:34:10"})',
    'u.jsx(rj,{"data-source-loc":"src/App.tsx:45:10"})',
    'u.jsx(zpCompilations,{})',
    'u.jsx(I5,',
  ].map((marker) => bundle.indexOf(marker));
  assert.ok(renderOrder.every((at) => at >= 0), 'bundle renders showreel, biography, compilations, press');
  assert.deepEqual([...renderOrder].sort((a, b) => a - b), renderOrder, 'bundle orders the biography before the compilations');
  assert.equal(bundle.match(/u\.jsx\(rj,/g)?.length, 1, 'the biography renders exactly once');
  // Video and music sections use simple, distinct headings; the remaining
  // numbered kickers stay contiguous after the samples kicker is removed.
  const kickers = ['01 · Biography', '02 · Approach', '03 · Contact']
    .map((marker) => html.indexOf(marker));
  assert.ok(kickers.every((at) => at >= 0), 'every remaining numbered kicker is present');
  assert.deepEqual([...kickers].sort((a, b) => a - b), kickers, 'remaining section numbers run 01-03 in page order');
  for (const marker of ['01 · Biography', '02 · Approach', '03 · Contact']) {
    assert.ok(bundle.includes(marker), `bundle contains ${marker}`);
  }
  for (const removed of ['Commissioning a score', '04 · Scoring services', 'READY WHEN YOU ARE', 'zp-close']) {
    assert.ok(!html.includes(removed) && !bundle.includes(removed), `retired homepage block stays absent: ${removed}`);
  }
  assert.ok(!html.includes('href="#services"') && !bundle.includes('href:"#services"'), 'removed #services anchor has no dangling links');
  assert.ok(html.includes('href="/services"') && bundle.includes('href:"/services"'), 'dedicated /services route remains available');
  assert.ok(html.includes('href="#contact" class="zp-mobile-quote">Get a quote</a>'), 'Get a quote scrolls to the homepage inquiry form');
  assert.ok(!html.includes('href="/contact"') && !bundle.includes('href:"/contact"'), 'homepage quote navigation no longer opens a separate contact page');
  assert.ok(html.includes('>Showreel</h2>'), 'film samples have the plain Showreel heading');
  assert.ok(bundle.includes('data-source-loc":"src/components/Projects.tsx:13:10",children:"Showreel"'), 'the React film-samples heading matches');
  assert.ok(html.includes('>Original cues</h2>'), 'the music section is titled Original cues');
  assert.ok(bundle.includes('data-source-loc":"src/components/Showreel.tsx:59:1",children:"Original cues"'), 'the React music heading matches');
  assert.ok(!html.includes('01 · On screen') && !bundle.includes('01 · On screen'), 'the old film-samples kicker is absent');
  assert.ok(!html.includes('Hear it under picture.') && !bundle.includes('Hear it under picture.'), 'the old film-samples headline is absent');
  assert.ok(!html.includes('Film samples with the score in place.') && !bundle.includes('Film samples with the score in place.'), 'the film-samples explanatory copy is absent');
  const workSection = html.slice(html.indexOf('<section id="work"'), html.indexOf('</section>', html.indexOf('<section id="work"')) + '</section>'.length);
  const musicSection = html.slice(html.indexOf('<section id="showreel"'), html.indexOf('</section>', html.indexOf('<section id="showreel"')) + '</section>'.length);
  assert.equal((workSection.match(/<article\b/g) || []).length, 8, 'all eight film samples remain');
  assert.ok(musicSection.includes('href="/reel#download"') && musicSection.includes('aria-label="Play"'), 'reel download and audio controls remain');
  assert.ok(html.includes('>Credits</h2>'), 'poster wall has the plain Credits heading');
  assert.ok(!html.includes('Proof of work') && !html.includes('Additional credits'), 'poster header lead is gone');
  assert.ok(html.includes('WE CORRUPT SILENCE <span class="mt-1 block bg-gradient-to-r from-blood via-ember to-blood bg-clip-text italic text-transparent">TO SERVE THE FRAME.</span>'), 'the new hero declaration is present');
  assert.ok(html.includes('Bespoke, avant-garde sonic identities for psychological horror, folk horror, <span class="text-mist">atmospheric dramas, and experimental art-house cinema.</span>'), 'the new hero service description is present');
  const removedHeroTagline = 'For filmmakers who refuse to let a safe, predictable Hollywood score apologize for their visual ambition.';
  assert.ok(!html.includes(removedHeroTagline) && !bundle.includes(removedHeroTagline), 'the Hollywood-score tagline is removed');
  assert.ok(bundle.includes('WE CORRUPT SILENCE ') && bundle.includes('TO SERVE THE FRAME.'), 'the React bundle carries the new hero declaration');
  assert.ok(bundle.includes('Bespoke, avant-garde sonic identities for psychological horror, folk horror,'), 'the React bundle carries the new hero support copy');
  assert.ok(html.includes('Compilation Features') && html.includes('>Selected Works</h2>'), 'the compilation section uses plain headings');
  assert.ok(bundle.includes('Compilation Features') && bundle.includes('Selected Works'), 'the React bundle uses the same compilation headings');
  for (const removed of ['Out in the world', 'Music that exists outside a hard drive.', 'Compilation tracks and two Bandcamp releases already in the world.', 'folder of unused cues']) {
    assert.ok(!html.includes(removed) && !bundle.includes(removed), `pretentious compilation copy stays absent: ${removed}`);
  }
  assert.ok(!html.includes('Horror scores that make them feel it') && !bundle.includes('Horror scores that make them feel it'), 'superseded hero headline is absent');
  assert.ok(!html.includes('Now booking a limited number of 2026 commissions') && !html.includes('Booking select projects'), 'booking badge is removed');
  assert.ok(!html.includes('IMDb credited · award-winning'), 'hero proof-strip copy is removed');
  assert.ok(!html.includes('class="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6"'), 'empty hero proof strip is removed');
  for (const removed of ['THE COST OF GETTING IT WRONG', 'Your film has one chance to be felt', '02 / THE GAP', '03 / THE WARNING']) {
    assert.ok(!html.includes(removed), `retired homepage copy stays absent: ${removed}`);
  }
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

test('the hero carries one quiet lineage line directly beneath the call to action', () => {
  const jsFile = /import\("(\/index-[0-9a-f]{8}\.js)"\)/.exec(html)?.[1];
  assert.ok(jsFile, 'index.html imports a content-hashed home bundle');
  const bundle = read(jsFile);

  // The strip is a single line of low-contrast marks: one label, three images.
  const strip = /<p class="zp-lineage">([\s\S]*?)<\/p>/.exec(html);
  assert.ok(strip, 'the prerendered hero has the lineage line');
  assert.equal(html.match(/<p class="zp-lineage">/g).length, 1, 'the lineage line is injected exactly once');
  assert.ok(strip[1].includes('>Lineage</span>'), 'the line is labelled');
  const marks = [...strip[1].matchAll(/<img class="zp-lineage-mark[^"]*" src="\/images\/lineage\/([^"]+)" alt="([^"]+)" width="(\d+)" height="(\d+)"/g)];
  assert.deepEqual(
    marks.map((m) => [m[1], m[2]]),
    [
      ['black-mountain-college.png', 'Black Mountain College'],
      ['ars-electronica.png', 'Ars Electronica'],
      ['dolby-atmos.png', 'Dolby Atmos'],
    ],
    'each mark is present, in order, with its institution as alt text',
  );
  for (const [, file, , width, height] of marks) {
    assert.ok(fs.existsSync(path.join(ROOT, 'images/lineage', file)), `ship ${file}`);
    // 2x rasters: attributes are the intrinsic size, CSS halves it.
    assert.ok(Number(width) > 0 && Number(height) > 0, `${file} declares width/height for CLS safety`);
  }

  // Placement: after the hero CTA row, before the showreel section, and outside
  // the CTA flex row (or the line would inherit sm:flex-row and stop being one line).
  const ctaRow = '<div class="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center">';
  const ctaAt = html.indexOf(ctaRow);
  const stripAt = html.indexOf('<p class="zp-lineage">');
  const reelAt = html.indexOf('<section id="showreel"');
  assert.ok(ctaAt > 0 && stripAt > ctaAt && stripAt < reelAt, 'the line sits under the CTA and above the fold content');

  // Both render paths ship it: the bundle mounts a static island, so a rebuild
  // cannot drop the strip when React replaces the prerendered DOM.
  assert.ok(bundle.includes('u.jsx(zpLineage,{})'), 'the React hero renders the same line');
  assert.equal(bundle.match(/u\.jsx\(zpLineage,\{\}\)/g).length, 1, 'the React line is rendered exactly once');
  for (const alt of ['Black Mountain College', 'Ars Electronica', 'Dolby Atmos']) {
    assert.ok(bundle.includes(alt), `the React island carries ${alt}`);
  }

  // Desaturated and quiet: grayscale marks at reduced opacity, no borders or
  // hover affordances, sized under the CTA.
  const style = /<style id="zp-lineage-style">([\s\S]*?)<\/style>/.exec(html)?.[1];
  assert.ok(style, 'the lineage styles ship inline');
  assert.match(style, /\.zp-lineage-mark\{[^}]*filter:grayscale\(1\)/, 'marks are monochrome');
  assert.match(style, /\.zp-lineage-mark\{[^}]*opacity:\.6/, 'marks are low-contrast');
  assert.doesNotMatch(style, /hover/, 'the line is not interactive');
  assert.match(style, /\.zp-lineage\{[^}]*flex-wrap:nowrap/, 'the line stays a single line');
});
