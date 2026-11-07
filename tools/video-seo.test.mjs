/**
 * tools/video-seo.test.mjs
 * ----------------------------------------------------------------------------
 * End-to-end Google Video SEO specification tests (appearance/video,
 * appearance/structured-data/video, crawling-indexing/sitemaps/video-sitemaps,
 * crawling-indexing/robots-meta-tag, and SafeSearch ?safe=active eligibility).
 *
 *   node --test tools/video-seo.test.mjs
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { productions } from '../build/data/productions.js';
import { INDEXABLE_ROBOTS, SITE_HOST, SITE_ORIGIN, isoDuration, url } from '../build/data/site.js';
import { hasIndexableVideo } from '../build/lib/head.js';
import { effectiveHeaders, parseHeadersFile } from './headers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

function jsonLdNodes(html) {
  return [...html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((m) =>
    JSON.parse(m[1]),
  );
}

function metaContent(html, attr, key) {
  const re = new RegExp(`<meta\\b[^>]*\\b${attr}=["']${key}["'][^>]*\\bcontent=["']([^"']*)["'][^>]*>`, 'i');
  return re.exec(html)?.[1] ?? null;
}

test('INDEXABLE_ROBOTS, HTML meta robots, and _headers X-Robots-Tag grant max-video-preview:-1', () => {
  assert.match(INDEXABLE_ROBOTS, /\bmax-video-preview:-1\b/);
  assert.match(INDEXABLE_ROBOTS, /\bmax-image-preview:large\b/);

  const homeHtml = read('index.html');
  assert.equal(metaContent(homeHtml, 'name', 'robots'), INDEXABLE_ROBOTS);

  const workHubHtml = read('work/index.html');
  assert.equal(metaContent(workHubHtml, 'name', 'robots'), INDEXABLE_ROBOTS);

  const rules = parseHeadersFile(read('_headers'));
  for (const pathname of ['/', '/work', '/work/expire', '/work/phantom-requiem', '/work/the-haunted', '/work/mike-has-a-visitor']) {
    const xRobots = effectiveHeaders(rules, pathname).get('x-robots-tag') || '';
    assert.match(xRobots, /\bindex\b/, `${pathname} must remain indexable`);
    assert.match(xRobots, /\bmax-video-preview:-1\b/, `${pathname} X-Robots-Tag must permit full moving video previews`);
  }
});

test('robots.txt explicitly welcomes Googlebot, Googlebot-Video, and Googlebot-Image with no media blocks', () => {
  const robotsTxt = read('robots.txt');
  for (const agent of ['Googlebot', 'Googlebot-Image', 'Googlebot-Video']) {
    assert.match(robotsTxt, new RegExp(`User-agent:\\s*${agent}\\s+Allow:\\s*\\/`, 'm'), `${agent} must be explicitly allowed`);
  }
  assert.doesNotMatch(robotsTxt, /^Disallow:\s*\/images/m);
  assert.doesNotMatch(robotsTxt, /^Disallow:\s*\/work/m);
});

test('dedicated /work/<slug> watch pages place the video above the fold without lazy-loading the primary iframe', () => {
  const withSample = productions.filter((p) => Boolean(p.sample));
  assert.equal(withSample.length, 5);

  for (const prod of withSample) {
    const html = read(`work/${prod.slug}.html`);
    const sampleAt = html.indexOf('<section class="clause" id="sample">');
    const entryAt = html.indexOf('<section class="clause" id="entry">');
    const detailAt = html.indexOf('<section class="clause" id="detail">');

    assert.ok(sampleAt !== -1 && entryAt !== -1 && detailAt !== -1, `${prod.slug}: expected #sample, #entry, and #detail sections`);
    assert.ok(
      sampleAt < entryAt && entryAt < detailAt,
      `${prod.slug}: #sample (Project video) must appear as Section I before #entry and #detail so the video is above the fold`,
    );
    assert.match(html, /<section class="clause" id="sample">\s*<h2><span class="no">I<\/span> Project video<\/h2>/);

    const embedMatch = /<div class="entry-embed">\s*(<iframe\b[^>]*>)/i.exec(html);
    assert.ok(embedMatch, `${prod.slug}: missing .entry-embed iframe in initial HTML`);
    const iframeTag = embedMatch[1];
    assert.ok(iframeTag.includes(`src="${prod.sample.embedUrl}"`), `${prod.slug}: iframe src must match sample.embedUrl without click interaction`);
    assert.doesNotMatch(iframeTag, /\bloading=["']lazy["']/i, `${prod.slug}: primary watch-page iframe must not be deferred with loading="lazy"`);
    assert.match(iframeTag, /\bwidth="1280"\s+height="720"/, `${prod.slug}: iframe should declare prominent 16:9 dimensions (within 140-1080px width and >=140px height)`);
  }
});

test('VideoObject is emitted only when all required fields exist, with unique metadata and SafeSearch compatibility', () => {
  const indexable = productions.filter((p) => hasIndexableVideo(p));
  assert.deepEqual(
    indexable.map((p) => p.slug),
    ['expire', 'phantom-requiem', 'the-haunted', 'mike-has-a-visitor'],
  );

  const seenNames = new Set();
  const seenDescriptions = new Set();
  const seenThumbs = new Set();
  const seenEmbeds = new Set();

  for (const prod of productions) {
    const html = read(`work/${prod.slug}.html`);
    const nodes = jsonLdNodes(html);
    const videoNodes = nodes.filter((n) => n['@type'] === 'VideoObject');

    // Never emit adult SafeSearch suppression tags on general-audience horror portfolio pages
    assert.doesNotMatch(html, /<meta\b[^>]*\bname=["']rating["'][^>]*\bcontent=["'](?:adult|RTA-5042-1996-1400-1577-RTA)["']/i);

    if (!hasIndexableVideo(prod)) {
      assert.equal(videoNodes.length, 0, `${prod.slug}: must not emit invalid VideoObject when uploadDate is unverified`);
      assert.equal(metaContent(html, 'property', 'og:type'), 'website');
      assert.equal(metaContent(html, 'property', 'og:video'), null);
      continue;
    }

    assert.equal(videoNodes.length, 1, `${prod.slug}: expected exactly 1 VideoObject`);
    const vo = videoNodes[0];
    const sample = prod.sample;
    const expectedThumb = url(sample.thumbnail.src);

    // Required properties per https://developers.google.com/search/docs/appearance/structured-data/video
    assert.equal(vo.name, sample.title);
    assert.deepEqual(vo.thumbnailUrl, [expectedThumb]);
    assert.match(vo.uploadDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(vo.uploadDate, sample.publicationDate);

    // Recommended properties + SafeSearch (?safe=active) & paywall signals
    assert.equal(vo.description, sample.description);
    assert.equal(vo.embedUrl, sample.embedUrl);
    assert.equal(vo.duration, isoDuration(sample.durationSeconds));
    assert.equal(vo.isFamilyFriendly, true);
    assert.equal(vo.isAccessibleForFree, true);
    assert.equal(vo.inLanguage, 'en');
    assert.ok(vo.creator?.name && vo.creator?.url, `${prod.slug}: VideoObject.creator should include verified name and channel URL`);

    // Uniqueness across watch pages (Google Video SEO best practice: distinct title, description, thumbnail per video)
    assert.ok(!seenNames.has(vo.name), `duplicate VideoObject.name: ${vo.name}`);
    assert.ok(!seenDescriptions.has(vo.description), `duplicate VideoObject.description on ${prod.slug}`);
    assert.ok(!seenThumbs.has(expectedThumb), `duplicate VideoObject.thumbnailUrl: ${expectedThumb}`);
    assert.ok(!seenEmbeds.has(vo.embedUrl), `duplicate VideoObject.embedUrl: ${vo.embedUrl}`);
    seenNames.add(vo.name);
    seenDescriptions.add(vo.description);
    seenThumbs.add(expectedThumb);
    seenEmbeds.add(vo.embedUrl);

    // Cross-method parity across VideoObject, Open Graph Protocol (OGP), and Twitter cards
    assert.equal(metaContent(html, 'property', 'og:type'), 'video.other');
    assert.equal(metaContent(html, 'property', 'og:video'), sample.embedUrl);
    assert.equal(metaContent(html, 'property', 'og:video:secure_url'), sample.embedUrl);
    assert.equal(metaContent(html, 'property', 'og:video:type'), 'text/html');
    assert.equal(metaContent(html, 'property', 'og:video:image'), expectedThumb);
    assert.equal(metaContent(html, 'property', 'og:image'), expectedThumb);
    assert.equal(metaContent(html, 'name', 'twitter:image'), expectedThumb);
    assert.equal(metaContent(html, 'property', 'video:duration'), String(sample.durationSeconds));
    assert.equal(metaContent(html, 'property', 'video:release_date'), sample.publicationDate);
  }
});

test('sitemap.xml scopes <video:video> strictly to dedicated watch pages and matches VideoObject 1-to-1', () => {
  const xml = read('sitemap.xml');
  const urlBlocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  const videoUrlBlocks = urlBlocks.filter((block) => block.includes('<video:video>'));

  // Homepage is a multi-sample portfolio with click-to-load facades, not a watch page
  const homeBlock = urlBlocks.find((b) => b.includes(`<loc>${SITE_ORIGIN}/</loc>`));
  assert.ok(homeBlock, 'homepage <url> block must exist');
  assert.ok(!homeBlock.includes('<video:video>'), 'homepage must not carry <video:video> entries');

  assert.equal(videoUrlBlocks.length, 4, 'exactly 4 dedicated watch pages should carry <video:video> entries');

  for (const block of videoUrlBlocks) {
    const loc = /<loc>([^<]+)<\/loc>/.exec(block)?.[1];
    assert.ok(loc && loc.startsWith(`https://${SITE_HOST}/work/`));
    assert.equal((block.match(/<video:video>/g) || []).length, 1, `${loc}: at most 1 <video:video> per watch page`);

    const slug = loc.split('/').pop();
    const prod = productions.find((p) => p.slug === slug);
    assert.ok(prod && prod.sample, `${loc}: must map to a production with sample`);

    const thumbLoc = /<video:thumbnail_loc>([^<]+)<\/video:thumbnail_loc>/.exec(block)?.[1];
    const playerLoc = /<video:player_loc>([^<]+)<\/video:player_loc>/.exec(block)?.[1];
    const duration = Number(/<video:duration>([^<]+)<\/video:duration>/.exec(block)?.[1]);
    const pubDate = /<video:publication_date>([^<]+)<\/video:publication_date>/.exec(block)?.[1];
    const familyFriendly = /<video:family_friendly>([^<]+)<\/video:family_friendly>/.exec(block)?.[1];

    assert.equal(thumbLoc, url(prod.sample.thumbnail.src));
    assert.equal(playerLoc, prod.sample.embedUrl);
    assert.ok(Number.isInteger(duration) && duration >= 1 && duration <= 28800);
    assert.equal(duration, prod.sample.durationSeconds);
    assert.equal(pubDate, prod.sample.publicationDate);
    assert.equal(familyFriendly, 'yes');
  }
});
