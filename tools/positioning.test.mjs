/**
 * tools/positioning.test.mjs
 * ----------------------------------------------------------------------------
 * Guards the site's primary search identity (SEARCH-IDENTITY-2026.md):
 *
 *   Experimental psychological horror film composer for independent and
 *   arthouse cinema.
 *
 * The positioning is copy, not architecture, so nothing in the build would
 * otherwise notice it drifting. These assertions read the *served* files — the
 * same bytes a crawler or a director receives — not the source modules, so a
 * page that quietly reverts to the old "dark, atmospheric scores" framing, or a
 * hero that is patched in index.html but not in the React bundle, fails here.
 *
 * Run with `npm test` (after `npm run build`). Every assertion names the file it
 * is protecting so the failure says what to fix.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  COMPOSER_DESCRIPTION,
  FIT_STATEMENT,
  HOME_DESCRIPTION,
  IDENTITY_AUDIENCE,
  IDENTITY_CRAFT_CLOSE,
  IDENTITY_CRAFT_OPEN,
  IDENTITY_H1_ACCENT,
  IDENTITY_H1_PRIMARY,
  IDENTITY_ROLE_TITLE,
  IDENTITY_STATEMENT,
  NOT_FIT_STATEMENT,
} from '../build/data/positioning.js';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

/** Decode the five entities the build can emit into a title or description. */
function decode(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

const text = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

function titleOf(html) {
  return decode(/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '');
}

function descriptionOf(html) {
  return decode(/<meta\s+name="description"\s+content="([^"]*)"/i.exec(html)?.[1] ?? '');
}

function h1Of(html) {
  return text(/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] ?? '');
}

test('the identity is one sentence, and it says what it claims', () => {
  assert.equal(IDENTITY_STATEMENT, 'Experimental psychological horror film composer for independent and arthouse cinema.');
  assert.equal(IDENTITY_STATEMENT, `${IDENTITY_H1_PRIMARY} ${IDENTITY_H1_ACCENT}`);
  assert.equal(IDENTITY_ROLE_TITLE, 'Experimental Psychological Horror Film Composer');
  assert.equal(IDENTITY_AUDIENCE, 'independent and arthouse cinema');
});

test('the homepage title is the identity and fits the SERP', () => {
  const html = read('index.html');
  assert.equal(titleOf(html), IDENTITY_ROLE_TITLE, 'index.html <title> must be the identity, not a mood line');
  assert.ok(titleOf(html).length >= 30 && titleOf(html).length <= 60, `homepage title is ${titleOf(html).length} chars; verify.mjs holds 30-60`);
});

test('the homepage description leads with the identity, then the action', () => {
  const html = read('index.html');
  assert.equal(descriptionOf(html), HOME_DESCRIPTION);
  assert.ok(descriptionOf(html).startsWith(IDENTITY_STATEMENT), 'the identity sentence must be the first thing in the snippet');
  assert.ok(HOME_DESCRIPTION.length >= 120 && HOME_DESCRIPTION.length <= 160, `homepage description is ${HOME_DESCRIPTION.length} chars; verify.mjs holds 120-160`);
});

test('the homepage H1 is the positioning sentence, and the craft line sits under it', () => {
  const html = read('index.html');
  assert.equal(h1Of(html), IDENTITY_STATEMENT, 'index.html H1 must state the position');
  assert.ok(html.includes(IDENTITY_CRAFT_OPEN) && html.includes(IDENTITY_CRAFT_CLOSE), 'the hero craft line moved or lost a half');
});

test('the React bundle renders the same hero as the static snapshot', () => {
  const html = read('index.html');
  const bundleName = /"(\/index-[a-f0-9]{8}\.js)"/i.exec(html)?.[1]?.slice(1);
  assert.ok(bundleName, 'index.html must reference its content-hashed bundle');
  const bundle = read(bundleName);
  // The hero is patched into both render paths by home-src/build.mjs; a pair
  // that only lands in the static copy leaves the identity visible for as long
  // as it takes React to re-render #root.
  for (const fragment of [IDENTITY_H1_PRIMARY, IDENTITY_H1_ACCENT, IDENTITY_CRAFT_OPEN, IDENTITY_CRAFT_CLOSE]) {
    assert.ok(bundle.includes(fragment), `the shipped bundle (${bundleName}) does not render "${fragment}"`);
  }
});

test('the biography page states the identity in title, description and H1', () => {
  const html = read('composer.html');
  assert.equal(titleOf(html), 'Zazie Kanwar-Torge — Experimental Psychological Horror Composer');
  assert.equal(descriptionOf(html), COMPOSER_DESCRIPTION);
  assert.ok(h1Of(html).toLowerCase().includes(IDENTITY_H1_PRIMARY.toLowerCase()), 'composer.html H1 must carry the role');
  assert.ok(h1Of(html).includes(IDENTITY_AUDIENCE), 'composer.html H1 must name the audience');
});

test('the commission page leads with the identity, and qualifies who it is for', () => {
  const html = read('hire-a-composer.html');
  assert.equal(titleOf(html), 'Hire an Experimental Psychological Horror Film Composer');
  assert.ok(descriptionOf(html).startsWith(IDENTITY_STATEMENT), 'the commission page description must open with the identity before any price');
  assert.ok(h1Of(html).toLowerCase().includes('experimental psychological horror'), 'hire-a-composer.html H1 must carry the specialism');
  const bodyText = text(html);
  assert.ok(bodyText.includes(FIT_STATEMENT), 'the fit statement in src/data/positioning.ts is not on the commission page');
  assert.ok(bodyText.includes(NOT_FIT_STATEMENT), 'the not-a-fit statement in src/data/positioning.ts is not on the commission page');
});

test('the inquiry page is addressed to the same reader', () => {
  const html = read('contact.html');
  assert.match(titleOf(html), /Experimental Psychological Horror Film Composer/);
  assert.ok(descriptionOf(html).startsWith(IDENTITY_STATEMENT), 'contact.html description must open with the identity');
});

test('llms.txt opens with the identity', () => {
  const llms = read('llms.txt');
  assert.match(llms.split('\n')[0], /Experimental Psychological Horror Film Composer/);
  assert.ok(llms.includes(IDENTITY_STATEMENT), 'llms.txt must contain the exact positioning sentence');
  assert.ok(llms.includes(FIT_STATEMENT), 'llms.txt should carry the qualification, not only the claim');
});

test('no commercial surface name-drops a film the studio has no credit on', () => {
  // Aesthetic parallels are chosen by the reader, not asserted by the page. A
  // title list in a <title>, a description or an H1 reads as an affiliation
  // claim to a producer skimming results, and reads as one to a lawyer too.
  const banned = /\b(Hereditary|The Lighthouse|Saint Maud|Possessor|Midsommar|The Witch|Under the Skin)\b/i;
  const files = fs
    .readdirSync(new URL('..', import.meta.url))
    .filter((name) => name.endsWith('.html'));
  for (const file of files) {
    const html = read(file);
    const surfaces = [
      ['<title>', titleOf(html)],
      ['meta description', descriptionOf(html)],
      ['<h1>', h1Of(html)],
      ['og:title', decode(/<meta\s+property="og:title"\s+content="([^"]*)"/i.exec(html)?.[1] ?? '')],
      ['og:description', decode(/<meta\s+property="og:description"\s+content="([^"]*)"/i.exec(html)?.[1] ?? '')],
    ];
    for (const [label, value] of surfaces) {
      assert.doesNotMatch(value, banned, `${file} ${label} compares the studio to a film it has no credit on`);
    }
  }
});
