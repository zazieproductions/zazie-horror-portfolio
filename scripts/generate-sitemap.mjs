#!/usr/bin/env node
/** Generate the XML sitemap and robots.txt directly from typed route data. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { hubs } from '../build/data/hubs.js';
import { allRoutes, items, productionBySlug, releaseBySlug, validateRoutes } from '../build/data/routes.js';
import { productions } from '../build/data/productions.js';
import { cues } from '../build/data/cues.js';
import { releases } from '../build/data/releases.js';
import { robotsTxt } from '../build/data/robots.js';
import { SITE_HOST, SITE_ORIGIN, escapeXml, url } from '../build/data/site.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const fail = (message) => problems.push(message);
const realDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

/* -------------------------------------------------------------- route audit */
for (const issue of validateRoutes()) fail(`${issue.where}: ${issue.message}`);

const seen = new Map();
for (const route of allRoutes) {
  const label = `route ${route.path}`;
  if (seen.has(route.path)) fail(`${label}: duplicate URL (also provided by ${seen.get(route.path)})`);
  else seen.set(route.path, label);

  if (!route.path.startsWith('/')) fail(`${label}: route must begin with /`);
  if (route.path !== '/' && route.path.endsWith('/')) fail(`${label}: trailing slash`);
  if (/[?#]/.test(route.path)) fail(`${label}: query or fragment is not a clean route`);
  if (route.path.includes('//') || !/^\/[a-z0-9/-]*$/i.test(route.path)) fail(`${label}: malformed route path`);
  if (!route.title?.trim()) fail(`${label}: missing title`);
  if (!route.description?.trim()) fail(`${label}: missing description`);
  if (!realDate(route.lastmod)) fail(`${label}: lastmod ${JSON.stringify(route.lastmod)} is not a real YYYY-MM-DD date`);
  else if (new Date(`${route.lastmod}T00:00:00Z`).getTime() > Date.now() + 86400000) {
    fail(`${label}: lastmod ${route.lastmod} is in the future`);
  }

  const absolute = url(route.path);
  try {
    const parsed = new URL(absolute);
    if (parsed.protocol !== 'https:' || parsed.host !== SITE_HOST) fail(`${label}: ${absolute} is not on https://${SITE_HOST}`);
    if (parsed.search || parsed.hash) fail(`${label}: ${absolute} includes a query or fragment`);
    if (route.path !== '/' && parsed.pathname.endsWith('/')) fail(`${label}: absolute URL has a trailing slash`);
    if (absolute.length > 2048) fail(`${label}: URL is longer than 2048 characters`);
  } catch {
    fail(`${label}: ${absolute} is not an absolute URL`);
  }
}

if (hubs.length !== 19) fail(`expected the 19 original hub routes, received ${hubs.length}`);
if (productions.length !== 9 || cues.length !== 32 || releases.length !== 24) {
  fail(`expected 9 productions, 32 cues and 24 catalogue items; received ${productions.length}, ${cues.length}, ${releases.length}`);
}

/* -------------------------------------------------------------- image audit */
function imageUrl(value, where) {
  let parsed;
  try {
    parsed = new URL(value.startsWith('/') ? `${SITE_ORIGIN}${value}` : value);
  } catch {
    fail(`${where}: invalid image URL ${JSON.stringify(value)}`);
    return null;
  }
  if (parsed.protocol !== 'https:') {
    fail(`${where}: image ${value} must use https`);
    return null;
  }
  if (parsed.host === SITE_HOST) {
    const file = path.resolve(root, `.${decodeURIComponent(parsed.pathname)}`);
    if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      fail(`${where}: missing local image ${parsed.pathname}`);
      return null;
    }
  }
  return parsed.href;
}

for (const hub of hubs) {
  for (const image of hub.images) imageUrl(image.loc, `hub ${hub.path} image`);
  for (const video of hub.videos) imageUrl(video.thumbnailLoc, `hub ${hub.path} video thumbnail`);
}

/* ------------------------------------------------------------ XML assembly */
const lines = [];
const add = (...values) => lines.push(...values);

function imageBlock(image, caption, title) {
  add(
    '    <image:image>',
    `      <image:loc>${escapeXml(image)}</image:loc>`,
    `      <image:caption>${escapeXml(caption)}</image:caption>`,
    `      <image:title>${escapeXml(title)}</image:title>`,
    '    </image:image>',
  );
}

function videoBlock(video) {
  add(
    '    <video:video>',
    `      <video:thumbnail_loc>${escapeXml(video.thumbnailLoc)}</video:thumbnail_loc>`,
    `      <video:title>${escapeXml(video.title)}</video:title>`,
    `      <video:description>${escapeXml(video.description)}</video:description>`,
    `      <video:player_loc>${escapeXml(video.playerLoc)}</video:player_loc>`,
  );
  if (video.duration) {
    const seconds = Number(video.duration);
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 86400) fail(`video ${video.title}: invalid duration ${video.duration}`);
    else add(`      <video:duration>${seconds}</video:duration>`);
  }
  if (video.publicationDate) {
    if (!realDate(video.publicationDate)) fail(`video ${video.title}: invalid publication date ${video.publicationDate}`);
    else add(`      <video:publication_date>${escapeXml(video.publicationDate)}</video:publication_date>`);
  }
  if (video.familyFriendly) add(`      <video:family_friendly>${escapeXml(video.familyFriendly)}</video:family_friendly>`);
  for (const tag of video.tags ?? []) add(`      <video:tag>${escapeXml(tag)}</video:tag>`);
  add('    </video:video>');
}

function urlEntry(route, { images = [], videos = [] } = {}) {
  add('  <url>', `    <loc>${escapeXml(url(route.path))}</loc>`, `    <lastmod>${escapeXml(route.lastmod)}</lastmod>`);
  for (const image of images) imageBlock(image.loc, image.caption, image.title);
  for (const video of videos) videoBlock(video);
  add('  </url>', '');
}

const hubByPath = new Map(hubs.map((hub) => [hub.path, hub]));
const hubRoutes = allRoutes.filter((route) => route.kind === 'home' || route.kind === 'hub');
const itemRoutes = {
  production: items.filter((item) => item.kind === 'production'),
  cue: items.filter((item) => item.kind === 'cue'),
  release: items.filter((item) => item.kind === 'release'),
};

add(
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<!--',
  `  Generated ${SITE_ORIGIN}/sitemap.xml from src/data/{hubs,productions,cues,releases,routes}.ts.`,
  '  Do not edit by hand. Each URL is a canonical, extensionless route.',
  `  Route count: ${allRoutes.length} (${hubs.length} original hubs + ${productions.length} productions + ${cues.length} cues + ${releases.length} catalogue items).`,
  '  Sitemap priority and changefreq are intentionally omitted.',
  '-->',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
  '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">',
  '',
);

for (const route of hubRoutes) {
  const hub = hubByPath.get(route.path);
  const images = (hub?.images ?? []).map((image) => ({
    loc: imageUrl(image.loc, `hub ${route.path} image`) ?? image.loc,
    caption: image.caption,
    title: image.title,
  }));
  const videos = (hub?.videos ?? []).map((video) => ({
    ...video,
    thumbnailLoc: imageUrl(video.thumbnailLoc, `hub ${route.path} video thumbnail`) ?? video.thumbnailLoc,
  }));
  urlEntry(route, { images, videos });
}

for (const item of itemRoutes.production) {
  const production = productionBySlug.get(item.slug);
  const poster = imageUrl(production.poster.src, `production ${item.slug} poster`);
  const images = poster ? [{ loc: poster, caption: production.poster.alt, title: production.title }] : [];
  const videos = [];
  // Self hosted samples (kind 'self') are portfolio-only and never listed.
  if (production.sample && production.sample.kind !== 'self' && /youtube(-nocookie)?\.com\/embed\//.test(production.sample.embedUrl)) {
    const thumbnail = imageUrl(production.sample.thumbnail.src, `production ${item.slug} video thumbnail`);
    if (thumbnail) {
      videos.push({
        thumbnailLoc: thumbnail,
        title: production.sample.title,
        description: production.sample.description,
        playerLoc: production.sample.embedUrl,
        duration: production.sample.durationSeconds ? String(production.sample.durationSeconds) : undefined,
        publicationDate: production.sample.publicationDate,
      });
    }
  }
  urlEntry(item, { images, videos });
}

for (const item of itemRoutes.cue) urlEntry(item);

for (const item of itemRoutes.release) {
  const release = releaseBySlug.get(item.slug);
  const cover = release.image ? imageUrl(release.image.src, `catalogue item ${item.slug} artwork`) : null;
  const images = cover && release.image
    ? [{ loc: cover, caption: release.image.alt, title: release.title }]
    : [];
  urlEntry(item, { images });
}

add('</urlset>', '');
const sitemapXml = lines.join('\n');

/* ------------------------------------------------------------ robots audit */
if (!new RegExp(`^Sitemap:\\s*${SITE_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/sitemap\\.xml\\s*$`, 'm').test(robotsTxt)) {
  fail(`robots.txt must advertise ${SITE_ORIGIN}/sitemap.xml`);
}
const disallowRules = [];
let inWildcardGroup = false;
for (const line of robotsTxt.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (/^User-agent:/i.test(trimmed)) {
    inWildcardGroup = trimmed.slice(trimmed.indexOf(':') + 1).trim() === '*';
  } else if (inWildcardGroup) {
    const match = /^Disallow:\s*(.+)$/i.exec(trimmed);
    if (match) disallowRules.push(match[1].trim());
  }
}
for (const route of allRoutes) {
  for (const rule of disallowRules) {
    const pattern = rule.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    if (new RegExp(`^${pattern}`).test(route.path)) fail(`robots.txt Disallow: ${rule} blocks ${route.path}`);
  }
}
// Self hosted film samples live under /media for the portfolio only; the
// sitemap must never advertise that tree (no <loc>, image or video URL).
if (!disallowRules.some((rule) => rule === '/media/' || rule === '/media')) {
  fail('robots.txt must keep crawlers out of the self hosted media tree (Disallow: /media/)');
}
if (/<[^>]*>[^<]*\/media\//.test(sitemapXml)) {
  fail('sitemap.xml must not reference /media/ (self hosted samples are not published)');
}

/* ------------------------------------------------------------------- write */
if (problems.length) {
  console.error(`generate-sitemap: ${problems.length} problem(s); no files written`);
  for (const problem of [...new Set(problems)]) console.error(`  - ${problem}`);
  process.exit(1);
}

fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemapXml, 'utf8');
fs.writeFileSync(path.join(root, 'robots.txt'), robotsTxt, 'utf8');
const locCount = (sitemapXml.match(/<loc>/g) ?? []).length;
const imageCount = (sitemapXml.match(/<image:image>/g) ?? []).length;
const videoCount = (sitemapXml.match(/<video:video>/g) ?? []).length;
console.log(`generate-sitemap: ${locCount} URLs (${hubs.length} hubs, ${productions.length} productions, ${cues.length} cues, ${releases.length} catalogue items)`);
console.log(`  ${imageCount} verified artwork entries, ${videoCount} video entries; robots.txt leaves every sitemap URL crawlable`);
console.log(`  every URL is unique, HTTPS, on ${SITE_HOST}, extensionless, and free of query strings or fragments`);
