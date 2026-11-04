import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { isAllowed, parseRobots } from './robots.mjs';

const url = (path) => new URL(path, 'https://horror.zazieproductions.com');

test('Googlebot uses its own group instead of wildcard rules', () => {
  const robots = parseRobots('User-agent: *\nAllow: /\nUser-agent: Googlebot\nDisallow: /\n');
  assert.equal(isAllowed(robots, '*', url('/')), true);
  assert.equal(isAllowed(robots, 'Googlebot', url('/')), false);
  assert.equal(isAllowed(parseRobots('User-agent: *\nDisallow: /'), 'Googlebot', url('/')), false);
});

test('groups, empty rules, path specificity and query matching', () => {
  const robots = parseRobots(`User-agent: Googlebot
User-agent: Bingbot
Disallow: /private
Allow: /private/public
Disallow: /search?*
Allow: /search?ok$
Disallow:
User-agent: Googlebot
Disallow: /other
`);
  for (const agent of ['Googlebot', 'Bingbot']) {
    assert.equal(isAllowed(robots, agent, url('/')), true);
    assert.equal(isAllowed(robots, agent, url('/private')), false);
    assert.equal(isAllowed(robots, agent, url('/private/public')), true);
    assert.equal(isAllowed(robots, agent, url('/search?bad')), false);
    assert.equal(isAllowed(robots, agent, url('/search?ok')), true);
  }
  assert.equal(isAllowed(robots, 'Googlebot', url('/other')), false);
  assert.equal(isAllowed(robots, 'Bingbot', url('/other')), true);
});

test('committed robots file allows Googlebot and advertises the canonical sitemap', () => {
  const robots = parseRobots(fs.readFileSync(new URL('../robots.txt', import.meta.url), 'utf8'));
  assert.ok(robots.sitemaps.includes('https://horror.zazieproductions.com/sitemap.xml'));
  for (const path of ['/', '/work', '/index.html', '/images/hero-portrait.jpg']) {
    assert.equal(isAllowed(robots, 'Googlebot', url(path)), true, path);
  }
});
