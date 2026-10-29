#!/usr/bin/env node
/**
 * Regression checks for the laurel-led opening on the homepage.
 *
 * The four festival laurels from the press kit are repeated as a compact band
 * above the hero headline so recognition is the first thing a visitor reads,
 * while the full Electronic Press Kit (#press) stays below with the same
 * artwork, captions and links.
 *
 * What this pins down:
 *   1. The band really is above the hero headline (eyebrow + <h1>) in the
 *      prerendered document, and it ships in the React bundle too, so the
 *      hydrated render cannot reorder or drop it.
 *   2. The band is in normal flow. The old implementation floated it with
 *      `position:absolute` plus a reserved 280px of hero padding, which could
 *      be clipped by the hero's `overflow-hidden` and hid three of four marks
 *      behind a horizontal scroller on phones.
 *   3. All four marks are visible without scrolling: 2x2 on phones, 4-up from
 *      768px.
 *   4. The emblem image is above the fold (eager, fetchpriority="low", with
 *      intrinsic dimensions so it cannot cause layout shift) while every other
 *      homepage image stays lazily loaded.
 *   5. Every mark links to #press, and #press still carries the full laurel
 *      grid with captions, so the opening band is a shortcut into the dossier
 *      rather than a replacement for it.
 *
 * Run: node --test tools/press-laurels.test.mjs
 */
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

test('the laurel band is the opening of the hero, above the headline', () => {
  assert.ok(band.length > 0, 'hero carries a ZP-HERO-LAURELS band');
  assert.equal((html.match(/<!--ZP-HERO-LAURELS-->/g) ?? []).length, 1, 'the band renders exactly once');
  assert.equal((html.match(/<!--ZP-HERO-LAURELS-END-->/g) ?? []).length, 1, 'the band markers are balanced');

  const heroAt = html.indexOf('<section id="top"');
  const bandAt = html.indexOf('<!--ZP-HERO-LAURELS-->');
  const eyebrowAt = html.indexOf('<p class="mb-4 text-[10px] uppercase tracking-[0.38em] text-mist');
  const h1At = html.indexOf('<h1 class="font-display text-[2.35rem]');
  assert.ok(heroAt > 0 && bandAt > heroAt, 'the band sits inside #top');
  assert.ok(eyebrowAt > bandAt, 'the band precedes the hero eyebrow line');
  assert.ok(h1At > bandAt, 'the band precedes the hero <h1> headline');
  assert.ok(html.indexOf('<section id="press"') > bandAt, 'the full press kit still sits below the hero');
});

test('the band ships identically from the React bundle', () => {
  assert.ok(bundle.includes('zp-hero-laurels'), 'bundle renders the hero laurel band');
  // The pristine markup is spliced into the bundle as a JSON string; the
  // font-quote escaping in the SVG text nodes differs once inlined, so compare
  // the structural beats rather than raw bytes.
  for (const mark of [...MARKS, 'class=\\"zp-hero-laurels\\"', 'aria-label=\\"Festival recognition\\"', 'href=\\"#press\\"']) {
    assert.ok(bundle.includes(mark), `bundle carries "${mark}"`);
  }
  assert.equal((bundle.match(/zp-hero-laurels/g) ?? []).length, (band.match(/zp-hero-laurels/g) ?? []).length,
    'the bundle repeats the band markup exactly once, like the prerender');
});

test('every mark links into the press kit and says what it is', () => {
  assert.match(band, /<div class="zp-hero-laurels" role="list" aria-label="Festival recognition">/,
    'the band is a labelled list, so assistive tech announces it as festival recognition');
  const links = band.match(/<a\b[^>]*>/g) ?? [];
  assert.equal(links.length, 4, 'four laurel links in the opening band');
  assert.equal((band.match(/role="listitem"/g) ?? []).length, 4, 'each mark is a list item');
  for (const link of links) {
    assert.match(link, /href="#press"/, 'each mark deep-links to the press kit');
    assert.match(link, /aria-label="[^"]+\. View press kit"/, 'each mark names itself and its destination');
    assert.match(link, /title="[^"]+"/, 'each mark has a hover title');
  }
  for (const mark of MARKS) {
    assert.ok(band.includes(`title="${mark}`) || band.includes(mark), `${mark} appears in the band`);
  }
  // The artwork is shared with the press kit, so it cannot drift.
  assert.match(band, /images\/laurels\/golden-bloody-globes\.webp/);
  assert.equal((band.match(/zp-pk-laurel-svg/g) ?? []).length, 3, 'the three drawn laurels are inlined as SVG');
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

test('the press kit below keeps the full laurel dossier', () => {
  assert.ok(pressSection.length > 0, '#press section exists');
  assert.match(pressSection, /class="zp-pk-laurels-grid"/, 'the full laurel grid is kept');
  assert.equal((pressSection.match(/class="zp-pk-laurel-card/g) ?? []).length, 4, 'all four laurel cards stay');
  for (const caption of ['Golden Bloody Globes', 'Re:Fract Festival (2025)', 'PVTV Fringe Flicks', 'Pebbles Underground']) {
    assert.ok(pressSection.includes(caption), `#press keeps the ${caption} caption`);
    assert.ok(bundle.includes(caption), `the bundle keeps the ${caption} caption`);
  }
  for (const award of ['Festival Award Honoree', 'Special Jury Mention', 'Festival Winner', 'Jury Special Mention']) {
    assert.ok(pressSection.includes(award), `#press keeps the "${award}" award line`);
  }
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

test('the live-release checker rejects laurels moved below the hero headline', () => {
  const misplaced = html.replace(bandMatch[0], '').replace('</h1>', `</h1>${bandMatch[0]}`);
  assert.ok(homepageReleaseProblems(misplaced, bundle).some((problem) => problem.includes('precede the hero headline')));
});
