/**
 * tools/headers.test.mjs
 * ----------------------------------------------------------------------------
 * Unit tests for the response-header policy: the join semantics that broke
 * caching, and the cache lifetimes the site depends on.
 *
 *   node --test tools/headers.test.mjs
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  HTML_CACHE,
  IMMUTABLE_CACHE,
  MEDIA_CACHE,
  ANALYTICS_ORIGINS,
  cacheControlFor,
  effectiveHeaders,
  headersFor,
  matches,
  parseHeadersFile,
} from './headers.mjs';

test('parseHeadersFile keeps rules in file order and records detaches', () => {
  const rules = parseHeadersFile(`
/*
  X-Frame-Options: SAMEORIGIN
  Cache-Control: public, max-age=0, must-revalidate

/fonts/*
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable
`);
  assert.equal(rules.length, 2);
  assert.equal(rules[0].pattern, '/*');
  assert.deepEqual(rules[1].detach, ['cache-control']);
  assert.deepEqual(rules[1].set, [{ name: 'cache-control', value: 'public, max-age=31536000, immutable' }]);
});

test('a header set by two rules is joined, as Cloudflare Pages does', () => {
  const rules = parseHeadersFile(`
/*
  Cache-Control: public, max-age=0, must-revalidate

/fonts/*
  Cache-Control: public, max-age=31536000, immutable
`);
  const served = effectiveHeaders(rules, '/fonts/inter-latin-wght-normal.woff2').get('cache-control');
  assert.equal(served, 'public, max-age=0, must-revalidate, public, max-age=31536000, immutable');
  // RFC 9111 reads the first max-age, which is why this shape is a bug.
  assert.equal(/max-age=(\d+)/.exec(served)[1], '0');
});

test('a detach removes the earlier value, and order matters', () => {
  const correct = parseHeadersFile(`
/*
  Cache-Control: public, max-age=0, must-revalidate

/fonts/*
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable
`);
  assert.equal(
    effectiveHeaders(correct, '/fonts/inter-latin-wght-normal.woff2').get('cache-control'),
    'public, max-age=31536000, immutable',
  );

  const reversed = parseHeadersFile(`
/fonts/*
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable

/*
  Cache-Control: public, max-age=0, must-revalidate
`);
  assert.equal(
    effectiveHeaders(reversed, '/fonts/inter-latin-wght-normal.woff2').get('cache-control'),
    'public, max-age=31536000, immutable, public, max-age=0, must-revalidate',
    'a detach above the rule it targets is a no-op',
  );
});

test('matches handles exact paths, splats and placeholders', () => {
  assert.ok(matches('/*', '/anything/at/all'));
  assert.ok(matches('/fonts/*', '/fonts/inter-latin-wght-normal.woff2'));
  assert.ok(matches('/index-*.js', '/index-f509fde0.js'));
  assert.ok(matches('/movies/:title', '/movies/expire'));
  assert.ok(!matches('/fonts/*', '/images/hero-portrait.jpg'));
  assert.ok(!matches('/work', '/work/expire'));
});

test('cache lifetimes: HTML revalidates, hashed assets are immutable, media is long-lived', () => {
  assert.equal(cacheControlFor('/'), HTML_CACHE);
  assert.equal(cacheControlFor('/', { html: true }), HTML_CACHE);
  assert.equal(cacheControlFor('/work', { html: true }), HTML_CACHE);
  assert.equal(cacheControlFor('/work/expire.html'), HTML_CACHE);
  assert.equal(cacheControlFor('/index-f509fde0.css'), IMMUTABLE_CACHE);
  assert.equal(cacheControlFor('/store-3fc01be0.js'), IMMUTABLE_CACHE);
  assert.equal(cacheControlFor('/fonts/inter-latin-wght-normal.woff2'), IMMUTABLE_CACHE);
  assert.equal(cacheControlFor('/images/hero-portrait.jpg'), MEDIA_CACHE);
  assert.equal(cacheControlFor('/audio/track-00.mp3'), MEDIA_CACHE);
  assert.equal(cacheControlFor('/sw.js'), 'no-cache, no-store, must-revalidate');
  assert.equal(cacheControlFor('/404.html'), 'no-store');
  assert.equal(cacheControlFor('/sitemap.xml'), cacheControlFor('/robots.txt'));
});

test('an unknown path never gets an immutable lifetime', () => {
  for (const pathname of ['/nope', '/work/does-not-exist', '/reel/unknown']) {
    assert.ok(!/immutable/.test(cacheControlFor(pathname)), `${pathname} must not be immutable`);
  }
});

test('headersFor drops HSTS on plain HTTP so localhost keeps working', () => {
  const https = headersFor('/', { https: true, html: true });
  const http = headersFor('/', { https: false, html: true });
  assert.ok(https['Strict-Transport-Security']);
  assert.equal(http['Strict-Transport-Security'], undefined);
  assert.equal(http['Content-Security-Policy'], https['Content-Security-Policy']);
  assert.equal(http['Cache-Control'], HTML_CACHE);
});

test('the CSP allows exactly Cloudflare Web Analytics, as /privacy discloses', () => {
  const csp = headersFor('/', { https: true, html: true })['Content-Security-Policy'];
  const directives = new Map(
    csp
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, ...values] = part.split(/\s+/);
        return [name, values.join(' ')];
      }),
  );

  // The beacon is injected at the edge, so the policy is the only thing that
  // can let it run. Both origins - the script and the reporting endpoint -
  // are allowlisted, each in the directive ANALYTICS_ORIGINS names.
  for (const { origin, directive } of ANALYTICS_ORIGINS) {
    assert.ok(
      (directives.get(directive) || '').split(/\s+/).includes(origin),
      `${origin} must be allowlisted in ${directive}`,
    );
  }

  // Exactly one remote script (the beacon, by host: its injected URL carries
  // a version path) and exactly one remote connection (its reporting
  // endpoint; the same-origin /cdn-cgi/rum form is covered by 'self').
  assert.equal(directives.get('script-src'), "'self' 'unsafe-inline' https://static.cloudflareinsights.com");
  assert.equal(directives.get('connect-src'), "'self' https://cloudflareinsights.com");
  assert.ok(!csp.includes('*'), 'the CSP must not contain a wildcard');
});
