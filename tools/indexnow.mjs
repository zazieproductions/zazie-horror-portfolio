#!/usr/bin/env node
/**
 * indexnow.mjs
 * -----------------------------------------------------------------------------
 * Tells IndexNow search engines that pages on horror.zazieproductions.com were
 * added or changed, so they recrawl now instead of on their next scheduled
 * visit. One submission to api.indexnow.org is shared with every participating
 * engine (Bing, Yandex, Seznam, Naver, Yep and others).
 *
 * Google does not use IndexNow. For Google: submit sitemap.xml in Search
 * Console, and use URL Inspection -> Request indexing for pages that matter.
 *
 * Run it AFTER the deploy is live. The engines fetch the key file from the
 * site itself to confirm the submission comes from whoever controls the site,
 * so a key file that is not deployed yet fails with 403.
 *
 *   node tools/indexnow.mjs                  # every <loc> in sitemap.xml
 *   node tools/indexnow.mjs /reel /faq       # only these paths
 *   node tools/indexnow.mjs --dry-run        # show the request, send nothing
 *
 * Submit pages when they change, not on a timer: engines throttle hosts that
 * resubmit unchanged URLs (HTTP 429).
 *
 * The key is the <32 hex>.txt file in the site root. It is public by design;
 * it only proves that the submitter can write files to this host. To rotate
 * it, delete that file, add a new one whose content equals its file name, and
 * deploy.
 *
 * No dependencies; Node 18+ (global fetch).
 * -----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'horror.zazieproductions.com';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const paths = args.filter((a) => !a.startsWith('--'));

const fail = (msg) => { console.error(`\nindexnow: ${msg}\n`); process.exit(1); };

// Key: exactly one <key>.txt in the root whose content is its own name.
const keys = fs.readdirSync(ROOT)
  .filter((f) => /^[a-f0-9]{32}\.txt$/.test(f))
  .filter((f) => fs.readFileSync(path.join(ROOT, f), 'utf8').trim() === f.slice(0, -4));
if (keys.length !== 1) fail(`expected exactly one IndexNow key file (<32 hex>.txt containing its own name) in the site root, found ${keys.length}`);
const key = keys[0].slice(0, -4);
const keyLocation = `https://${HOST}/${key}.txt`;

// URLs: the given paths, or every <loc> in sitemap.xml.
let urlList;
if (paths.length) {
  urlList = paths.map((p) => new URL(p, `https://${HOST}`).href);
} else {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  urlList = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
    .map((m) => m[1].replace(/&amp;/g, '&'))
    .filter((u) => new URL(u).host === HOST && !/\.(jpe?g|png|avif|webp|gif|svg)$/i.test(new URL(u).pathname));
  urlList = [...new Set(urlList)];
}
const offHost = urlList.filter((u) => new URL(u).host !== HOST);
if (offHost.length) fail(`only ${HOST} URLs can be submitted with this key: ${offHost.join(', ')}`);
if (!urlList.length) fail('nothing to submit');
if (urlList.length > 10000) fail(`IndexNow accepts at most 10,000 URLs per request (got ${urlList.length})`);

const body = { host: HOST, key, keyLocation, urlList };

if (dryRun) {
  console.log(`\nPOST ${ENDPOINT}\n${JSON.stringify(body, null, 2)}\n\n(dry run: nothing sent)\n`);
  process.exit(0);
}

// Pre-flight: the key file must already be live, or every engine answers 403.
try {
  const res = await fetch(keyLocation, { redirect: 'manual' });
  const text = res.ok ? (await res.text()).trim() : '';
  if (!res.ok || text !== key) {
    fail(`${keyLocation} answered HTTP ${res.status}${res.ok ? ' with a different key' : ''}. Deploy the key file first, then run this again.`);
  }
} catch (e) {
  fail(`could not fetch ${keyLocation} (${e.message}). Deploy first, and run this from a machine with internet access.`);
}

const MEANING = {
  200: 'OK - URLs received',
  202: 'Accepted - URLs received, key validation pending',
  400: 'Bad request - invalid format',
  403: 'Forbidden - key not valid (key file missing, or it does not contain the key)',
  422: 'Unprocessable - a URL does not belong to the host, or the key does not match the protocol schema',
  429: 'Too many requests - resubmitting too often; wait before trying again',
};

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});
console.log(`\nindexnow: submitted ${urlList.length} URL(s) for ${HOST}`);
console.log(`indexnow: HTTP ${res.status} ${MEANING[res.status] || res.statusText}\n`);
process.exit(res.status === 200 || res.status === 202 ? 0 : 1);
