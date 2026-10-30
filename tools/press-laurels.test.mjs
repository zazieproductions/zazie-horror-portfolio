#!/usr/bin/env node
/** Regression checks for the homepage festival recognition. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { homeBundlePath, homepageReleaseProblems } from './homepage-release.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const html = read('index.html');

const bundleName = /import\("(\/index-[0-9a-f]{8}\.js)"\)/.exec(html)?.[1]?.replace(/^\//, '');
assert.ok(bundleName, 'index.html imports its content-hashed React bundle');
const bundle = read(bundleName);

/** The hero-opening laurel band in the prerendered document. */
const bandMatch = /<!--ZP-HERO-LAURELS-->([\s\S]*?)<!--ZP-HERO-LAURELS-END-->/.exec(html);
const band = bandMatch?.[1] ?? '';

/** The full press kit section. */
const pressSection = /<section id="press"[\s\S]*?<\/section>/.exec(html)?.[0] ?? '';

const MARKS = [
  'Golden Bloody Globes',
  'Re:Fract Festival',
  'PVTV Fringe Flicks',
  'Pebbles Underground',
];

test('the laurel band follows the hero headline', () => {
  assert.ok(band.length > 0, 'hero carries a ZP-HERO-LAURELS band');
  assert.equal((html.match(/<!--ZP-HERO-LAURELS-->/g) ?? []).length, 1, 'the band renders exactly once');
  assert.equal((html.match(/<!--ZP-HERO-LAURELS-END-->/g) ?? []).length, 1, 'the band markers are balanced');

  const heroAt = html.indexOf('<section id="top"');
  const bandAt = html.indexOf('<!--ZP-HERO-LAURELS-->');
  const eyebrowAt = html.indexOf('<p class="mb-4 text-[10px] uppercase tracking-[0.38em] text-mist');
  const h1At = html.indexOf('<h1 class="font-display text-[2.35rem]');
  assert.ok(heroAt > 0 && bandAt > heroAt, 'the band sits inside #top');
  assert.ok(eyebrowAt < bandAt, 'the band follows the hero eyebrow line');
  assert.ok(h1At < bandAt, 'the band follows the hero <h1> headline');
  assert.ok(html.indexOf('<section id="press"') > bandAt, 'the full press kit still sits below the hero');
});

test('the band ships identically from the React bundle', () => {
  assert.ok(bundle.includes('zp-hero-laurels'), 'bundle renders the hero laurel band');
  // The pristine markup is spliced into the bundle as a JSON string; the
  // font-quote escaping in the SVG text nodes differs once inlined, so compare
  // the structural beats rather than raw bytes.
  for (const mark of [...MARKS, 'class=\\"zp-hero-laurels\\"', 'aria-label=\\"Festival recognition\\"']) {
    assert.ok(bundle.includes(mark), `bundle carries "${mark}"`);
  }
  assert.equal((bundle.match(/zp-hero-laurels/g) ?? []).length, (band.match(/zp-hero-laurels/g) ?? []).length,
    'the bundle repeats the band markup exactly once, like the prerender');
});

test('each mark is named without a redundant press-kit link', () => {
  assert.match(band, /<div class="zp-hero-laurels" role="list" aria-label="Festival recognition">/);
  const marks = band.match(/<span role="listitem"[^>]*>/g) ?? [];
  assert.equal(marks.length, 4);
  for (const mark of MARKS) assert.ok(marks.some((item) => item.includes(`aria-label="${mark}`)));
  assert.doesNotMatch(band, /href="#press"/);
  assert.match(band, /images\/laurels\/golden-bloody-globes\.webp/);
  assert.equal((band.match(/zp-pk-laurel-svg/g) ?? []).length, 3);
});

test('the band is in normal flow, not floated over the hero', () => {
  const pressStyle = /<style id="zp-press-style">([\s\S]*?)<\/style>/.exec(html)?.[1] ?? '';
  assert.ok(pressStyle.includes('#top .zp-hero-laurels'), 'the band styles ship inline with the press kit');

  const bandRules = pressStyle.match(/#top \.zp-hero-laurels\{[^}]*\}/g) ?? [];
  assert.ok(bandRules.length > 0, 'the band has base rules');
  for (const rule of bandRules) {
    assert.ok(!/position:\s*absolute/.test(rule), 'the band must stay in flow');
    assert.ok(!/overflow-x/.test(rule), 'all four marks must be visible without a horizontal scroller');
  }
  // The magic hero offsets that existed only to clear the floating band are
  // gone, so the hero is back to its own rhythm.
  assert.ok(!pressStyle.includes('#top>div.relative.z-10{padding-top:280px}'), 'no reserved hero padding for the band');
  assert.ok(!pressStyle.includes('#top .zp-hero-art{top:270px}'), 'the hero portrait is no longer pushed down for the band');
});

test('all four marks are visible on phones and 4-up from tablet', () => {
  const pressStyle = /<style id="zp-press-style">([\s\S]*?)<\/style>/.exec(html)?.[1] ?? '';
  const scoped = pressStyle.slice(pressStyle.indexOf('#top .zp-hero-laurels'));
  assert.match(scoped, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/, 'phones show 2x2');
  const tablet = /@media\(min-width:768px\)\{([\s\S]*?)\n\}/.exec(scoped)?.[1] ?? '';
  assert.match(tablet, /#top \.zp-hero-laurels\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/, 'tablet and up show 4-up');
  assert.match(scoped, /min-height:44px/, 'each mark keeps a 44px touch target');
  assert.match(scoped, /@media\(prefers-reduced-motion:reduce\)/, 'the hover treatment respects reduced motion');
});

test('the emblem loads eagerly at low priority, everything else stays lazy', () => {
  const emblem = /<img\b[^>]*golden-bloody-globes\.webp[^>]*>/.exec(band)?.[0] ?? '';
  assert.ok(emblem.length > 0, 'the bitmap laurel is in the band');
  assert.ok(!/\bloading="lazy"/.test(emblem), 'the above-fold emblem is not deferred');
  assert.match(emblem, /fetchpriority="low"/, 'the emblem yields bandwidth to the hero imagery');
  assert.match(emblem, /width="480"/, 'the emblem declares its intrinsic width (no layout shift)');
  assert.match(emblem, /height="280"/, 'the emblem declares its intrinsic height (no layout shift)');
  assert.match(emblem, /alt=""/, 'the emblem is decorative: the link carries the accessible name');

  for (const tag of html.match(/<img\b[^>]*>/g) ?? []) {
    if (tag.includes('/images/atmosphere-bg.jpg') || tag.includes('golden-bloody-globes.webp')) continue;
    assert.match(tag, /\bloading="lazy"/, `below-fold image stays lazy: ${tag.slice(0, 80)}`);
  }
});

test('the press kit does not repeat the laurels', () => {
  assert.ok(pressSection.length > 0);
  assert.doesNotMatch(pressSection, /zp-pk-laurels-grid|zp-pk-laurel-card/);
  for (const mark of MARKS) assert.ok(!pressSection.includes(mark));
});

test('the live-release checker accepts the complete static and React laurel band', () => {
  assert.equal(homeBundlePath(html), `/${bundleName}`);
  assert.deepEqual(homepageReleaseProblems(html, bundle), []);
});

test('the live-release checker rejects a missing laurel or a stale React bundle', () => {
  const missingMark = html.replace('aria-label="Pebbles Underground', 'aria-label="Missing festival');
  assert.ok(homepageReleaseProblems(missingMark, bundle).some((problem) => problem.includes('Pebbles Underground')));
  assert.ok(homepageReleaseProblems(html, '/* old bundle */').some((problem) => problem.includes('React bundle')));
});

test('the live-release checker rejects laurels moved above the hero headline', () => {
  const misplaced = html.replace(bandMatch[0], '').replace('<h1 class="font-display text-[2.35rem]', `${bandMatch[0]}<h1 class="font-display text-[2.35rem]`);
  assert.ok(homepageReleaseProblems(misplaced, bundle).some((problem) => problem.includes('follow the hero headline')));
});
