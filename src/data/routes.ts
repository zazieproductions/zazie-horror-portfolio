/**
 * One route registry for sitemap generation, prerendering and validation.
 * Every item path is derived from its home collection and data-owned slug.
 */

import { hubs } from './hubs.js';
import { productions } from './productions.js';
import { cues } from './cues.js';
import { releases } from './releases.js';
import { oneLine, slugify } from './site.js';
import type { Cue, ItemKind, ItemRoute, Production, Release, Route } from './types.js';

/** Turn the small amount of allowed inline emphasis in summaries into plain text. */
export function stripMarkup(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const HUB_PATHS = {
  production: '/work',
  cue: '/reel',
  release: '/store',
} as const satisfies Record<ItemKind, string>;

export const hubPathByKind: Record<ItemKind, string> = HUB_PATHS;

export function productionPath(production: Production): string {
  return `${HUB_PATHS.production}/${production.slug}`;
}

export function cuePath(cue: Cue): string {
  return `${HUB_PATHS.cue}/${cue.slug}`;
}

export function releasePath(release: Release): string {
  return `${HUB_PATHS.release}/${release.slug}`;
}

function productionTitle(production: Production): string {
  return `${production.title} — ${production.workType} | Zazie Productions`;
}

function cueTitle(cue: Cue): string {
  return `${cue.title} — ${cue.category} cue (${cue.duration}) | Zazie Productions`;
}

function releaseTitle(release: Release): string {
  return `${release.title} — ${release.kicker} | Zazie Productions`;
}

function itemRoutes(): ItemRoute[] {
  const routes: ItemRoute[] = [];

  for (const production of productions) {
    routes.push({
      kind: 'production',
      path: productionPath(production),
      hub: HUB_PATHS.production,
      slug: production.slug,
      title: productionTitle(production),
      description: oneLine(production.summary),
      lastmod: production.updatedAt,
      image: production.poster.src,
    });
  }

  for (const cue of cues) {
    routes.push({
      kind: 'cue',
      path: cuePath(cue),
      hub: HUB_PATHS.cue,
      slug: cue.slug,
      title: cueTitle(cue),
      description: oneLine(`${cue.title}: ${cue.description} Full MP3, ${cue.duration}.`),
      lastmod: cue.updatedAt,
    });
  }

  for (const release of releases) {
    const route: ItemRoute = {
      kind: 'release',
      path: releasePath(release),
      hub: HUB_PATHS.release,
      slug: release.slug,
      title: releaseTitle(release),
      description: oneLine(stripMarkup(release.summary)),
      lastmod: release.updatedAt,
    };
    if (release.image) route.image = release.image.src;
    routes.push(route);
  }

  return routes;
}

export const items: ItemRoute[] = itemRoutes();

export const hubRoutes: Route[] = hubs.map((hub) => ({
  path: hub.path,
  kind: hub.path === '/' ? 'home' : 'hub',
  title: hub.title,
  description: hub.description,
  lastmod: hub.lastmod,
}));

/** Every original hub plus the data-generated item routes. */
export const allRoutes: Route[] = [
  ...hubRoutes,
  ...items.map((item) => ({
    path: item.path,
    kind: item.kind,
    title: item.title,
    description: item.description,
    lastmod: item.lastmod,
  })),
];

export const itemByPath = new Map(items.map((item) => [item.path, item]));
export const hubByPath = new Map(hubs.map((hub) => [hub.path, hub]));
export const productionBySlug = new Map(productions.map((production) => [production.slug, production]));
export const cueBySlug = new Map(cues.map((cue) => [cue.slug, cue]));
export const releaseBySlug = new Map(releases.map((release) => [release.slug, release]));

/** Items belonging to a given pre-existing hub, in data order. */
export function itemsOfHub(hubPath: string): ItemRoute[] {
  return items.filter((item) => item.hub === hubPath);
}

/**
 * Pick four connected sibling entries for the current item. Cards intentionally
 * do not appear on a hub or the homepage; they connect the individual archive
 * pages to one another without changing the existing navigation design.
 */
export function siblingsOf(item: ItemRoute, count = 4): ItemRoute[] {
  const pool = itemsOfHub(item.hub).filter((candidate) => candidate.path !== item.path);
  const score = (candidate: ItemRoute): number => {
    if (item.kind === 'production' && candidate.kind === 'production') {
      const genres = productionBySlug.get(item.slug)?.genres ?? [];
      const other = productionBySlug.get(candidate.slug)?.genres ?? [];
      return other.some((genre) => genres.includes(genre)) ? 1 : 0;
    }
    if (item.kind === 'cue' && candidate.kind === 'cue') {
      return cueBySlug.get(candidate.slug)?.category === cueBySlug.get(item.slug)?.category ? 1 : 0;
    }
    if (item.kind === 'release' && candidate.kind === 'release') {
      const release = releaseBySlug.get(item.slug);
      const other = releaseBySlug.get(candidate.slug);
      if (!release || !other) return 0;
      return release.collection === other.collection ? 2 : release.section === other.section ? 1 : 0;
    }
    return 0;
  };
  return pool
    .map((candidate, index) => ({ candidate, index, score: score(candidate) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, count)
    .map(({ candidate }) => candidate);
}

/* ---------------------------------------------------------------- validation */

export interface ValidationIssue {
  where: string;
  message: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function checkParagraphs(where: string, paragraphs: string[], issues: ValidationIssue[]): void {
  if (paragraphs.length < 2) {
    issues.push({ where, message: 'needs at least two substantive body paragraphs' });
  }
  paragraphs.forEach((paragraph, index) => {
    if (oneLine(paragraph).length < 100) {
      issues.push({ where, message: `body paragraph ${index + 1} is too short to provide useful context` });
    }
  });
  if (new Set(paragraphs.map(oneLine)).size !== paragraphs.length) {
    issues.push({ where, message: 'contains a duplicated body paragraph' });
  }
}

/**
 * Fail the build for a duplicate or malformed route, missing metadata,
 * unsubstantial/duplicated prose, a bad date, or an unresolved internal link.
 */
export function validateRoutes(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenPaths = new Map<string, string>();
  const seenSlugs = new Map<string, string>();
  const bodyOwners = new Map<string, string>();

  const addPath = (where: string, routePath: string, collectionKey?: string): void => {
    const previousPath = seenPaths.get(routePath);
    if (previousPath) issues.push({ where, message: `duplicate route ${routePath} (also used by ${previousPath})` });
    else seenPaths.set(routePath, where);

    if (collectionKey) {
      const previousSlug = seenSlugs.get(collectionKey);
      if (previousSlug) issues.push({ where, message: `duplicate slug ${collectionKey} (also used by ${previousSlug})` });
      else seenSlugs.set(collectionKey, where);
    }
  };

  const collectParagraphs = (where: string, paragraphs: string[]): void => {
    checkParagraphs(where, paragraphs, issues);
    for (const paragraph of paragraphs) {
      const normalized = oneLine(paragraph).toLowerCase();
      const owner = bodyOwners.get(normalized);
      if (owner) issues.push({ where, message: `duplicates a body paragraph from ${owner}` });
      else bodyOwners.set(normalized, where);
    }
  };

  for (const hub of hubs) {
    addPath(`hub ${hub.path}`, hub.path);
    if (!hub.title.trim() || !hub.description.trim()) {
      issues.push({ where: `hub ${hub.path}`, message: 'missing title or description' });
    }
    if (!isRealDate(hub.lastmod)) {
      issues.push({ where: `hub ${hub.path}`, message: `lastmod "${hub.lastmod}" is not a real YYYY-MM-DD date` });
    }
  }

  for (const production of productions) {
    const where = `production ${production.slug}`;
    addPath(where, productionPath(production), `production:${production.slug}`);
    if (production.slug !== slugify(production.title)) issues.push({ where, message: `slug must be ${slugify(production.title)}` });
    if (!production.summary.trim() || !production.logline.trim()) issues.push({ where, message: 'missing summary or logline' });
    if (!production.headline.trim()) issues.push({ where, message: 'missing page headline' });
    collectParagraphs(where, production.paragraphs);
    if (!isRealDate(production.updatedAt)) issues.push({ where, message: `updatedAt "${production.updatedAt}" is not a real date` });
    for (const cueSlug of production.relatedCueSlugs) {
      if (!cueBySlug.has(cueSlug)) issues.push({ where, message: `relatedCueSlugs references unknown cue ${cueSlug}` });
    }
    for (const link of production.links) {
      try {
        const parsed = new URL(link.href, 'https://horror.zazieproductions.com');
        if (!['https:', 'http:'].includes(parsed.protocol) || link.href === '#') {
          issues.push({ where, message: `invalid outbound link ${link.href}` });
        }
      } catch {
        issues.push({ where, message: `invalid outbound link ${link.href}` });
      }
    }
  }

  for (const cue of cues) {
    const where = `cue ${cue.slug}`;
    addPath(where, cuePath(cue), `cue:${cue.slug}`);
    if (cue.slug !== slugify(cue.title)) issues.push({ where, message: `slug must be ${slugify(cue.title)}` });
    if (!cue.headline.trim() || !cue.category.trim() || !cue.description.trim()) {
      issues.push({ where, message: 'missing headline, category, or first-party description' });
    }
    collectParagraphs(where, cue.paragraphs);
    if (!Number.isInteger(cue.track) || cue.track < 0 || cue.track > 99) issues.push({ where, message: `invalid showreel track number ${cue.track}` });
    if (!Number.isInteger(cue.durationSeconds) || cue.durationSeconds < 1) issues.push({ where, message: 'durationSeconds must be a positive whole number' });
    if (!/^\/audio\/track-\d{2}\.mp3$/.test(cue.audioPath)) issues.push({ where, message: `audioPath ${cue.audioPath} is not a numbered root MP3` });
    if (!isRealDate(cue.updatedAt)) issues.push({ where, message: `updatedAt "${cue.updatedAt}" is not a real date` });
    for (const releaseSlug of cue.releaseSlugs) {
      if (!releaseBySlug.has(releaseSlug)) issues.push({ where, message: `releaseSlugs references unknown release ${releaseSlug}` });
    }
  }

  for (const release of releases) {
    const where = `release ${release.slug}`;
    addPath(where, releasePath(release), `release:${release.slug}`);
    if (release.slug !== slugify(release.title)) issues.push({ where, message: `slug must be ${slugify(release.title)}` });
    if (!release.headline.trim() || !release.summary.trim() || !release.kicker.trim()) {
      issues.push({ where, message: 'missing headline, summary, or catalogue descriptor' });
    }
    collectParagraphs(where, release.paragraphs);
    if (!release.facts.length) issues.push({ where, message: 'needs at least one verified catalogue fact' });
    if (!isRealDate(release.updatedAt)) issues.push({ where, message: `updatedAt "${release.updatedAt}" is not a real date` });
    if (release.releaseDate && !isRealDate(release.releaseDate)) issues.push({ where, message: `releaseDate "${release.releaseDate}" is not a real date` });
    if (release.listingUrl) {
      try {
        if (new URL(release.listingUrl).protocol !== 'https:') issues.push({ where, message: 'listingUrl must use https' });
      } catch {
        issues.push({ where, message: `listingUrl "${release.listingUrl}" is not a valid URL` });
      }
    }
    for (const cueSlug of release.relatedCueSlugs) {
      if (!cueBySlug.has(cueSlug)) issues.push({ where, message: `relatedCueSlugs references unknown cue ${cueSlug}` });
    }
  }

  for (const item of items) {
    const where = `item ${item.path}`;
    if (!hubByPath.has(item.hub)) issues.push({ where, message: `unknown hub ${item.hub}` });
    if (!oneLine(item.title) || !oneLine(item.description)) issues.push({ where, message: 'missing title or description' });
    if (item.description.length < 80) issues.push({ where, message: 'SEO description is too short to identify the item usefully' });
  }

  for (const route of allRoutes) {
    const where = `route ${route.path}`;
    if (!route.path.startsWith('/')) issues.push({ where, message: 'route path must start with /' });
    if (route.path !== '/' && route.path.endsWith('/')) issues.push({ where, message: 'route path must not end with /' });
    if (/[?#]/.test(route.path)) issues.push({ where, message: 'route path must not include a query or fragment' });
    if (route.path.includes('//') || !/^\/[a-z0-9/-]*$/i.test(route.path)) issues.push({ where, message: 'route path contains invalid characters' });
    if (!isRealDate(route.lastmod)) issues.push({ where, message: `lastmod "${route.lastmod}" is not a real date` });
    if (!oneLine(route.title) || !oneLine(route.description)) issues.push({ where, message: 'title and description must be non-empty' });
  }

  return issues;
}
