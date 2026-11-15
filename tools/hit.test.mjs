#!/usr/bin/env node
/**
 * Regression checks for the same-origin page-view counter:
 * functions/api/hit.ts and hit.js.
 *
 * The Function is TypeScript that the site build does not compile (tsc covers
 * src/ only), so it is transpiled here with the esbuild devDependency and
 * imported as a data: URL. That keeps the test on the real source rather than a
 * copy of it.
 *
 * The promises being kept, in the order /privacy makes them:
 *
 *   - POST only; anything else is 405.
 *   - Exactly two fields, `path` and `referrer`; anything else is rejected.
 *   - The stored row is a path, a referrer host and a timestamp, and nothing
 *     else: no IP address, no user agent, no country, no identifier.
 *   - A referring page's full address can never be stored — only its host.
 *   - No D1 binding, or an insert that throws, still answers 204: a counter
 *     that fails is not the visitor's problem.
 *   - The beacon does not run when Do Not Track or Global Privacy Control is set.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { transform } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');

const SOURCE = read('functions/api/hit.ts');
const { code } = await transform(SOURCE, { loader: 'ts', format: 'esm', target: 'es2022' });
const { onRequest } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

const URL_BASE = 'https://horror.zazieproductions.com/api/hit';

/** A D1 stand-in that records what the endpoint asked it to write. */
function fakeDb({ throws = false } = {}) {
  const rows = [];
  return {
    rows,
    prepare(query) {
      return {
        bind(...values) {
          return {
            async run() {
              if (throws) throw new Error('D1_ERROR: no such table: hits');
              rows.push({ query, values });
              return { success: true };
            },
          };
        },
      };
    },
  };
}

function send(method, body, env = {}) {
  const init = { method, headers: { 'content-type': 'application/json' } };
  if (body !== undefined) init.body = typeof body === 'string' ? body : JSON.stringify(body);
  return onRequest({ request: new Request(URL_BASE, init), env });
}

test('only POST is accepted', async () => {
  for (const method of ['GET', 'PUT', 'DELETE', 'HEAD']) {
    const res = await send(method);
    assert.equal(res.status, 405, `${method} is refused`);
  }
  const res = await send('GET');
  assert.equal(res.headers.get('allow'), 'POST');
});

test('a page view is written as a path, a referrer host and a time — nothing else', async () => {
  const db = fakeDb();
  const res = await send('POST', { path: '/reel/salt-wife', referrer: 'letterboxd.com' }, { DB: db });
  assert.equal(res.status, 204);
  assert.equal(db.rows.length, 1);
  assert.match(db.rows[0].query, /INSERT INTO hits \(path, referrer_host\)/);
  assert.deepEqual(db.rows[0].values, ['/reel/salt-wife', 'letterboxd.com'], 'two bound values, no third');
});

test('the endpoint never reads an address, a user agent or a country', () => {
  assert.doesNotMatch(SOURCE, /cf-connecting-ip|request\.cf/i, 'no address or country is read');
  assert.doesNotMatch(SOURCE, /headers\.get\(['"](?!content-length)/, 'the only header read is content-length');
  assert.doesNotMatch(SOURCE, /set-cookie/i);
});

test('unknown fields, a bad path and a full referring URL are all rejected', async () => {
  const db = fakeDb();

  const extra = await send('POST', { path: '/', referrer: '', email: 'someone@example.com' }, { DB: db });
  assert.equal(extra.status, 400, 'a field the beacon does not send is refused');

  const badPath = await send('POST', { path: 'reel' }, { DB: db });
  assert.equal(badPath.status, 400, 'a path has to start at the root');

  const fullReferrer = await send('POST', { path: '/', referrer: 'letterboxd.com/film/salt-wife' }, { DB: db });
  assert.equal(fullReferrer.status, 400, 'only a bare host is accepted, never the page address');

  const notJson = await send('POST', 'path=/', { DB: db });
  assert.equal(notJson.status, 400);

  assert.equal(db.rows.length, 0, 'nothing was written by any refused request');
});

test('a direct visit stores an empty referrer host', async () => {
  const db = fakeDb();
  const res = await send('POST', { path: '/privacy', referrer: '' }, { DB: db });
  assert.equal(res.status, 204);
  assert.deepEqual(db.rows[0].values, ['/privacy', '']);
});

test('without the D1 binding the endpoint is a silent no-op', async () => {
  const res = await send('POST', { path: '/', referrer: '' }, {});
  assert.equal(res.status, 204, 'no database, no error for the visitor');
});

test('an insert that fails is swallowed, not surfaced', async () => {
  const db = fakeDb({ throws: true });
  const original = console.error;
  const logged = [];
  console.error = (...args) => logged.push(args.join(' '));
  try {
    const res = await send('POST', { path: '/work', referrer: '' }, { DB: db });
    assert.equal(res.status, 204);
  } finally {
    console.error = original;
  }
  assert.ok(logged.some((line) => line.includes('[hit] insert failed')), 'the failure is logged server-side');
});

test('the beacon sends nothing when Do Not Track or Global Privacy Control is set', () => {
  const beacon = read('hit.js');
  assert.match(beacon, /doNotTrack/, 'reads Do Not Track');
  assert.match(beacon, /globalPrivacyControl/, 'reads Global Privacy Control');
  assert.match(beacon, /\/api\/hit/, 'posts to the same-origin endpoint');
  assert.doesNotMatch(beacon, /document\.cookie|localStorage|sessionStorage/, 'stores nothing on the device');
});

test('/privacy states what the counter records', () => {
  const privacy = read('legal-src/pages/privacy.html');
  assert.match(privacy, /Page-view count/);
  assert.match(privacy, /No IP address is recorded/);
  assert.match(privacy, /no cookie is set and no identifier is created/i);
  assert.match(privacy, /Do Not Track or Global Privacy Control, it does not run/);
});
