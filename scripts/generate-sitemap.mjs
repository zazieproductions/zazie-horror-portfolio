#!/usr/bin/env node
/**
 * generate-sitemap.mjs — Step 3 of the item-URL build.
 *
 * Reads `src/data` (via the compiled `build/data` output) and emits:
 *
 *     public/sitemap.xml   staging copy
 *     public/robots.txt    staging copy
 *     sitemap.xml          what the host actually serves
 *     robots.txt           what the host actually serves
 *
 * WHY TWO LOCATIONS. In a Vite project `public/` is copied verbatim into the
 * build output and the host publishes that directory. This repository has no
 * build output directory: the repository root *is* the publish directory that
 * Cloudflare Pages serves (that is why `store/index.html`, `legal/` and the
 * old `sitemap.xml` are committed). So the generator writes the staging copy
 * the task asks for and publishes identical bytes into the served tree in the
 * same run. There is only ever one string; the two files cannot disagree.
 *
 * What it refuses to do (the build fails, loudly):
 *
 *   - duplicate URLs, anywhere
 *   - any URL that is not https, not on horror.zazieproductions.com, or that
 *     carries a trailing slash, a fragment or a query string
 *   - any route whose title or meta description is missing
 *   - any hub entry that drops or renames one of the 19 legacy URLs, or that
 *     loses an image/video extension (checked against `tools/sitemap-baseline.xml`)
 *
 * `priority` and `changefreq` are carried through for the 19 legacy entries
 * because that is what the 2026 sitemap published. Google ignores both; they
 * are not a ranking tool and nothing here depends on them. Item entries carry
 * `<lastmod>` from the data and no priority at all.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT,
  SITE,
  absolute,
  assertDataIntegrity,
  collectProblems,
  counts,
  cueRoutes,
  hubs,
  itemRoutes,
  productionRoutes,
  releaseRoutes,
  write,
} from './lib/data.mjs';

/* ------------------------------------------------------------- validation */

assertDataIntegrity();
const problems = collectProblems();
if (problems.length) {
  console.error(`sitemap: ${problems.length} data problem(s)`);
  for (const p of problems) console.error(`  x  [${p.code}] ${p.detail}`);
  process.exit(1);
}

const urls = [
  ...hubs.map((h) => absolute(h.path)),
  ...itemRoutes.map((r) => absolute(r.path)),
];

const seen = new Map();
for (const loc of urls) {
  if (!loc.startsWith('https://')) {
    console.error(`sitemap: "${loc}" is not https`);
    process.exit(1);
  }
  const parsed = new URL(loc);
  if (parsed.host !== SITE.host) {
    console.error(`sitemap: "${loc}" is off-domain (expected ${SITE.host})`);
    process.exit(1);
  }
  if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
    console.error(`sitemap: "${loc}" has a trailing slash`);
    process.exit(1);
  }
  if (parsed.search || parsed.hash) {
    console.error(`sitemap: "${loc}" carries a query string or fragment`);
    process.exit(1);
  }
  if (seen.has(loc)) {
    console.error(`sitemap: duplicate URL ${loc}`);
    process.exit(1);
  }
  seen.set(loc, true);
}
for (const entry of [...hubs, ...itemRoutes]) {
  if (!entry.title || !entry.description) {
    console.error(`sitemap: ${entry.path} has no title or description`);
    process.exit(1);
  }
}
if (urls.length < 80) {
  console.error(`sitemap: only ${urls.length} URLs — expected 19 hubs + 65 item entries`);
  process.exit(1);
}

/* ------------------------------------------------------------------ output */

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const indent = (xml, pad) =>
  xml
    .split('\n')
    .map((line) => pad + line)
    .join('\n');

function renderUrl({ loc, lastmod, changefreq, priority, images = [], videos = [] }) {
  const lines = [`  <url>`, `    <loc>${esc(loc)}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${esc(lastmod)}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${esc(changefreq)}</changefreq>`);
  if (priority) lines.push(`    <priority>${esc(priority)}</priority>`);
  for (const image of images) {
    lines.push('    <image:image>');
    lines.push(indent(`<image:loc>${esc(image.loc)}</image:loc>`, '      '));
    if (image.caption) lines.push(indent(`<image:caption>${esc(image.caption)}</image:caption>`, '      '));
    if (image.title) lines.push(indent(`<image:title>${esc(image.title)}</image:title>`, '      '));
    lines.push('    </image:image>');
  }
  for (const video of videos) {
    lines.push('    <video:video>');
    for (const [tag, value] of video) {
      if (value === null || value === undefined || value === '') continue;
      lines.push(indent(`<video:${tag}>${esc(value)}</video:${tag}>`, '      '));
    }
    lines.push('    </video:video>');
  }
  lines.push('  </url>');
  return lines.join('\n');
}

/** Image extension for an item entry: only real, crawlable artwork. */
function itemImages(route) {
  if (route.section === 'work') {
    const production = route.item;
    const loc = production.poster.large ?? production.poster.src;
    const images = [
      {
        loc: absolute(loc),
        caption: production.poster.alt,
        title: `${production.title} (${production.yearLabel}) — ${production.genres.join(' · ')}`,
      },
    ];
    if (production.still) {
      images.push({
        loc: absolute(production.still.src),
        caption: production.still.alt,
        title: `${production.title} — film still`,
      });
    }
    return images;
  }
  if (route.section === 'store') {
    const item = route.item;
    return [{ loc: item.image.src, caption: item.image.alt, title: item.title }];
  }
  // Cues have no artwork of their own; the waveform card is decorative, and
  // image extensions here would be noise rather than a rich result.
  return [];
}

const hubXml = hubs
  .map((hub) =>
    renderUrl({
      loc: absolute(hub.path),
      lastmod: hub.lastmod,
      changefreq: hub.changefreq,
      priority: hub.priority,
      images: hub.images,
      videos: hub.videos,
    })
  )
  .join('\n');

const itemXml = itemRoutes
  .map((route) =>
    renderUrl({
      loc: absolute(route.path),
      lastmod: route.lastmod,
      images: itemImages(route),
    })
  )
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${hubXml}
${itemXml}
</urlset>
`;

/* --------------------------------------------------------- hub parity check */

const baselinePath = path.join(ROOT, 'tools', 'sitemap-baseline.xml');
if (fs.existsSync(baselinePath)) {
  const baseline = fs.readFileSync(baselinePath, 'utf8');
  const blocks = (xml) =>
    [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) => m[0]);
  const locOf = (block) => (/<loc>([^<]+)<\/loc>/.exec(block) ?? [, ''])[1];
  const imagesOf = (block) => [...block.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map((m) => m[1]);
  const videosOf = (block) => [...block.matchAll(/<video:title>([^<]*)<\/video:title>/g)].map((m) => m[1]);
  const before = blocks(baseline);
  const after = blocks(sitemap);
  for (const block of before) {
    const loc = locOf(block);
    const same = after.find((b) => locOf(b) === loc);
    if (!same) {
      console.error(`sitemap: the legacy URL ${loc} disappeared — the 19 existing URLs must not be renamed or dropped`);
      process.exit(1);
    }
    const missingImages = imagesOf(block).filter((i) => !imagesOf(same).includes(i));
    const missingVideos = videosOf(block).filter((v) => !videosOf(same).includes(v));
    if (missingImages.length || missingVideos.length) {
      console.error(
        `sitemap: ${loc} lost ${missingImages.length} image(s) and ${missingVideos.length} video(s) ` +
          `against tools/sitemap-baseline.xml`
      );
      process.exit(1);
    }
  }
  const order = [...baseline.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const newOrder = after.map(locOf);
  for (let i = 0; i < order.length; i++) {
    if (newOrder[i] !== order[i]) {
      console.error(`sitemap: legacy ordering changed at position ${i + 1} (${order[i]} → ${newOrder[i]})`);
      process.exit(1);
    }
  }
}

/* ---------------------------------------------------------------- robots.txt */

const robots = `# robots.txt: Zazie Productions Horror Composer Portfolio
# GENERATED by scripts/generate-sitemap.mjs from src/data — edit the template
# there, not this file; the build overwrites it.
#
# Mastermind internal ranking architecture - full crawl efficiency, no soft 404 traps
# Updated 2026-10-04 - 84 indexable URLs (19 hubs + 9 productions + 32 cues + 24 catalogue items),
# transactional and duplicate-view paths blocked, audio unblocked for AudioObject rich results.

User-agent: *
Allow: /

# Crawl budget weaponization: block infinite param spaces while allowing clean URLs.
# Scope: a crawler obeys only the most specific group that names it, so these
# lines bind unnamed crawlers only. Googlebot, Bingbot and the other named groups
# below skip them by design: for those engines, parameter URLs (?utm_, ?fbclid...)
# are consolidated by rel=canonical (in each page and in the Link header), and a
# canonical can only be read on a URL that is allowed to be crawled.
Disallow: /*?*boot=
Disallow: /*?*utm_
Disallow: /*?*fbclid=
Disallow: /*?*gclid=
Disallow: /*?*ref=

# Transactional paths: never indexable, never useful in a crawl. Nothing on the
# site is sold here - checkout lives on Bandcamp, itch.io, Gumroad and eBay - but
# a future cart must not be discoverable before it exists.
Disallow: /cart
Disallow: /cart/
Disallow: /checkout
Disallow: /checkout/
Disallow: /basket
Disallow: /basket/

# Duplicate query views of otherwise canonical pages (sorting, filtering,
# pagination, print views). The pages themselves stay crawlable at their own
# URLs; only the parameterised variants are dropped.
Disallow: /*?*sort=
Disallow: /*?*filter=
Disallow: /*?*view=
Disallow: /*?*page=
Disallow: /*?*print=
Disallow: /*?*replytocom=

# Preview/no-op states stay crawlable but noindex, so they are not blocked here
# (a Disallow would hide the noindex from the crawler that needs to read it).

# Allow all critical assets - images, audio, fonts, media for rich results
Allow: /audio/
Allow: /images/
Allow: /fonts/
Allow: /*.mp3$
Allow: /*.avif$
Allow: /*.jpg$
Allow: /*.svg$

# Sitemaps - primary and image/video extensions embedded in main sitemap
Sitemap: https://horror.zazieproductions.com/sitemap.xml

# Host directive for canonical domain consolidation (Yandex reads this; Google ignores
# unknown lines). The value must be a bare hostname with no scheme and no path.
Host: horror.zazieproductions.com

# Respectful crawl-delay for aggressive SEO crawlers (preserve budget for Googlebot)
User-agent: AhrefsBot
Crawl-delay: 2
Disallow:

User-agent: SemrushBot
Crawl-delay: 2
Disallow:

User-agent: DotBot
Crawl-delay: 5
Disallow:

User-agent: MJ12bot
Crawl-delay: 5
Disallow:

User-agent: Yandex
Crawl-delay: 3

User-agent: Baiduspider
Crawl-delay: 10

# AI Search & Answer Engine Crawlers - full access for answer citation & entity indexing
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Cohere-ai
Allow: /

# Googlebot - full access, no delay, maximum indexation
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Googlebot-Image
Allow: /

User-agent: Googlebot-Video
Allow: /

# Bingbot - full access
User-agent: Bingbot
Allow: /
`;

write('public/sitemap.xml', sitemap);
write('public/robots.txt', robots);
write('sitemap.xml', sitemap);
write('robots.txt', robots);

console.log(
  `generate-sitemap: ${hubs.length} hub URLs + ${itemRoutes.length} item URLs = ${urls.length} URLs ` +
    `(${productionRoutes.length} productions, ${cueRoutes.length} cues, ${releaseRoutes.length} catalogue items)`
);
console.log(`  wrote public/sitemap.xml + public/robots.txt (staging) and sitemap.xml + robots.txt (served)`);
console.log(`  lastmod values: ${counts.items + counts.hubs} entries, all real dates from src/data`);
