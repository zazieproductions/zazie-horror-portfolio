#!/usr/bin/env node
/**
 * robots-txt regression tests.
 *
 * robots.txt is the one file where a typo removes the site from a search index
 * with no error anywhere: a misspelled `Disalow:` reads as "allow everything",
 * and a `Disallow:` under an untouched `User-agent: *` is overridden the moment
 * a `User-agent: Googlebot` group appears (Google ignores the wildcard group
 * entirely once a specific one matches -- it does not merge them).
 *
 * These tests read src/data/robots.ts, the single source the generator writes
 * robots.txt from, and assert:
 *
 *   1. the committed robots.txt is byte-identical to the source of truth;
 *   2. the file itself is well formed (no BOM, LF endings, RFC 9309 fields
 *      only, a trailing newline, under the 500 KiB crawl limit);
 *   3. every user-agent group is Allow-only, and `*` exists, so no crawler --
 *      named, unnamed, or matched by prefix -- can be locked out by accident;
 *   4. the crawler tokens this site means to welcome are still named, including
 *      DuckDuckBot, the DuckDuckGo search crawler the previous file omitted
 *      while naming DuckAssistBot;
 *   5. the Sitemap record is absolute, on the production host, and advertised
 *      exactly once;
 *   6. with Google-faithful group precedence, all 80 sitemap URLs are allowed
 *      for Googlebot, Bingbot, DuckDuckBot and `*`;
 *   7. the matcher itself implements that precedence (guarding the guard).
 *
 * No build step required: it parses the TypeScript constant directly so it
 * cannot pass against a stale build/data/robots.js.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { auditRobots, isAllowed, parseRobots, selectGroup } from './robots-parse.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_HOST = 'horror.zazieproductions.com';

/** The canonical string, lifted out of the template literal in robots.ts. */
function sourceRobots() {
  const source = fs.readFileSync(path.join(ROOT, 'src/data/robots.ts'), 'utf8');
  const literals = [...source.matchAll(/export const ROBOTS_TXT = `([\s\S]*?)`;/g)];
  assert.equal(literals.length, 1, 'robots.ts must define exactly one ROBOTS_TXT template literal');
  const value = literals[0][1];
  assert.doesNotMatch(value, /\$\{/, 'ROBOTS_TXT must stay a plain string literal (no interpolation)');
  assert.doesNotMatch(value, /`/, 'ROBOTS_TXT must not contain a backtick');
  return value;
}

const committed = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
const canonical = sourceRobots();
const robots = parseRobots(canonical);

/** Sitemap URLs, so crawlability is asserted on the real URL set. */
function sitemapPaths() {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
    .map((m) => new URL(m[1].replace(/&amp;/g, '&')))
    .filter((u) => u.host === SITE_HOST)
    .map((u) => u.pathname + u.search);
}

test('committed robots.txt is byte-identical to src/data/robots.ts', () => {
  assert.equal(
    committed,
    canonical,
    'robots.txt drifted from ROBOTS_TXT; run `node scripts/generate-sitemap.mjs` and commit the result',
  );
});

test('robots.txt is well formed and uses only directives crawlers implement', () => {
  const audit = auditRobots(canonical);
  assert.deepEqual(audit.problems, [], `robots.txt problems: ${audit.problems.join('; ')}`);
  assert.deepEqual(audit.notes, [], `robots.txt notes: ${audit.notes.join('; ')}`);
  assert.equal(canonical.charCodeAt(0) === 0xfeff, false, 'no UTF-8 BOM');
  assert.doesNotMatch(canonical, /\r/, 'LF line endings only');
  assert.match(canonical, /\n$/, 'file ends with a newline');
  assert.ok(Buffer.byteLength(canonical, 'utf8') < 500 * 1024, 'under the 500 KiB crawl limit');
  assert.doesNotMatch(canonical, /^\s*(crawl-delay|host|noindex)\s*:/im, 'no fields Google ignores');
  assert.match(canonical, /^User-agent: \*\nAllow: \/$/m, 'wildcard group allows everything');
});

test('every user-agent group is Allow-only, so nothing is accidentally blocked', () => {
  assert.ok(robots.groups.has('*'), 'a "User-agent: *" group exists');
  for (const [token, group] of robots.groups) {
    assert.deepEqual(group.disallow, [], `group "${token}" must not Disallow anything`);
    assert.deepEqual(group.allow, ['/'], `group "${token}" must Allow: /`);
    assert.equal(group.crawlDelay, null, `group "${token}" must not set Crawl-delay`);
  }
});

test('the crawlers this site means to welcome are named explicitly', () => {
  for (const bot of [
    'Googlebot',
    'Googlebot-Image',
    'Google-Extended',
    'Bingbot',
    'DuckDuckBot',
    'DuckAssistBot',
    'Applebot',
    'Applebot-Extended',
    'OAI-SearchBot',
    'GPTBot',
    'ChatGPT-User',
    'PerplexityBot',
    'ClaudeBot',
    'Claude-SearchBot',
    'Amazonbot',
  ]) {
    assert.match(canonical, new RegExp(`^User-agent: ${bot}$`, 'm'), `robots.txt names ${bot}`);
  }
});

test('the Sitemap record is absolute, on the production host, and declared once', () => {
  assert.equal(robots.sitemaps.length, 1, 'exactly one Sitemap record');
  const sitemap = new URL(robots.sitemaps[0]);
  assert.equal(sitemap.protocol, 'https:');
  assert.equal(sitemap.host, SITE_HOST);
  assert.equal(sitemap.pathname, '/sitemap.xml');
  assert.match(canonical, /^Sitemap: https:\/\/horror\.zazieproductions\.com\/sitemap\.xml$/m);
});

test('every sitemap URL is crawlable by Googlebot, Bingbot, DuckDuckBot and the wildcard', () => {
  const paths = sitemapPaths();
  assert.ok(paths.length >= 80, `expected the full sitemap, found ${paths.length} URLs`);
  for (const target of paths) {
    for (const ua of ['Googlebot/2.1', 'Bingbot/2.0', 'DuckDuckBot/1.1', '*']) {
      assert.ok(isAllowed(robots, ua, target), `${target} must be allowed for ${ua}`);
    }
  }
});

test('Google group precedence is modelled correctly (the failure mode robots.txt hides)', () => {
  // A `Disallow:` under `*` stops applying to Googlebot the moment a
  // `User-agent: Googlebot` group exists. Merging the two groups -- the usual
  // approximation -- reports this file as blocked when Google crawls it fine,
  // and reports it as fine when Google is blocked by its own group.
  const explicit = parseRobots([
    'User-agent: *',
    'Disallow: /',
    '',
    'User-agent: Googlebot',
    'Allow: /',
    '',
  ].join('\n'));
  assert.equal(isAllowed(explicit, 'Googlebot/2.1', '/work'), true, 'Googlebot obeys its own Allow');
  assert.equal(isAllowed(explicit, 'Bingbot/2.0', '/work'), false, 'Bingbot has no group, so * applies');

  const inverse = parseRobots([
    'User-agent: *',
    'Allow: /',
    '',
    'User-agent: Googlebot',
    'Disallow: /reel',
    '',
  ].join('\n'));
  assert.equal(isAllowed(inverse, 'Googlebot/2.1', '/reel'), false, 'Googlebot is blocked by its own group');
  assert.equal(isAllowed(inverse, 'Bingbot/2.0', '/reel'), true, 'Bingbot still falls back to *');

  // Longest match wins, and Allow wins an equal-length tie.
  const tie = parseRobots(['User-agent: *', 'Disallow: /store', 'Allow: /store/public', ''].join('\n'));
  assert.equal(isAllowed(tie, 'Googlebot', '/store/public/x'), true, 'longer Allow wins');
  assert.equal(isAllowed(tie, 'Googlebot', '/store/x'), false, 'shorter Disallow still applies');

  // An unknown token falls back to `*` rather than being treated as blocked.
  assert.equal(selectGroup(robots, 'SomeFutureBot/0.9')?.token, '*');
  assert.equal(isAllowed(robots, 'SomeFutureBot/0.9', '/work/expire'), true);
});
