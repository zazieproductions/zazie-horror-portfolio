/**
 * Derived routes, referential integrity and the invariants the SEO rules rest on.
 *
 * Everything the generators need is produced here from the three item arrays
 * and the hub route table. Nothing downstream is allowed to invent a URL: the
 * route paths below are the only source of item URLs in the build, and
 * `assertDataIntegrity()` makes the build fail loudly if the data ever breaks
 * one of the rules (bad slug, duplicate slug, duplicate URL, dangling
 * reference, missing title or description, non-https external link).
 */

import { productions } from './productions.js';
import { cues } from './cues.js';
import { releases } from './releases.js';
import { hubRoutes } from './routes.js';
import { SLUG_RE, SITE, slugify, MOODS } from './site.js';
import type { Cue, ItemBase, Production, Release, RouteSection } from './types.js';

export { productions, cues, releases, hubRoutes };
export * from './site.js';
export type { Cue, ItemBase, Production, Release, RouteSection };

export interface ItemRoute {
  /** Absolute path with no trailing slash, e.g. /work/expire. */
  path: string;
  section: RouteSection;
  slug: string;
  /** <title> for the page. */
  title: string;
  /** <meta name="description"> for the page, and the sitemap's own summary. */
  description: string;
  lastmod: string;
  item: Production | Cue | Release;
}

/* ------------------------------------------------------------------ sections */

/** Every production entry route: /work/<slug>. */
export const productionRoutes: ItemRoute[] = productions.map((p) => ({
  path: `/work/${p.slug}`,
  section: 'work' as const,
  slug: p.slug,
  title: `${p.title} (${p.yearLabel}) — ${p.genres.join(' & ')} Score | Zazie Productions`,
  description: p.metaDescription,
  lastmod: p.updatedAt,
  item: p,
}));

/**
 * The cue <title> reads "<mood> Horror Cue", but four moods already end in
 * "Horror" (Body Horror, Ambient Horror, Cosmic Horror). Repeat the word once.
 */
function cueTitleSuffix(mood: string): string {
  return /horror$/i.test(mood.trim()) ? mood.trim() : `${mood} Horror`;
}

/** Every cue entry route: /reel/<slug>. */
export const cueRoutes: ItemRoute[] = cues.map((c) => ({
  path: `/reel/${c.slug}`,
  section: 'reel' as const,
  slug: c.slug,
  title: `${c.title} — ${cueTitleSuffix(c.mood)} Cue | Zazie Productions`,
  description: c.metaDescription,
  lastmod: c.updatedAt,
  item: c,
}));

/** Every catalogue entry route: /store/<slug>. */
export const releaseRoutes: ItemRoute[] = releases.map((r) => ({
  path: `/store/${r.slug}`,
  section: 'store' as const,
  slug: r.slug,
  title: `${r.title} — ${r.platform} | Zazie Productions Catalogue`,
  description: r.metaDescription,
  lastmod: r.updatedAt,
  item: r,
}));

export const itemRoutes: ItemRoute[] = [
  ...productionRoutes,
  ...cueRoutes,
  ...releaseRoutes,
];

/** The hub routes as the generators use them ('' path becomes '/'). */
export interface HubRouteEntry {
  path: string;
  title: string;
  description: string;
  lastmod: string;
  changefreq: string;
  priority: string;
  images: Array<{ loc: string; caption?: string; title?: string }>;
  videos: Array<Array<[string, string]>>;
}

export const hubs: HubRouteEntry[] = hubRoutes.map((r) => ({
  ...r,
  path: r.path === '' ? '/' : r.path,
}));

/* --------------------------------------------------------------- validation */

export interface Problem {
  code: string;
  detail: string;
}

function checkBase(
  problems: Problem[],
  where: string,
  item: ItemBase,
  section: RouteSection
): void {
  if (!SLUG_RE.test(item.slug)) {
    problems.push({ code: 'bad-slug', detail: `${where}: "${item.slug}" is not a lowercase hyphenated slug` });
  }
  if (item.slug !== slugify(item.title ?? '') && item.slug !== slugify(item.slug)) {
    // The cue/store slugs are authored to match their titles; the cue route
    // generator re-derives from the title, so a mismatch would silently move a
    // URL. Fail instead.
    const derived = slugify(item.title ?? '');
    if (derived && derived !== item.slug) {
      problems.push({
        code: 'slug-title-mismatch',
        detail: `${where}: slug "${item.slug}" does not match its title "${item.title}" (derives "${derived}")`,
      });
    }
  }
  if (!item.title || item.title.trim().length < 2) {
    problems.push({ code: 'missing-title', detail: `${where}: no title` });
  }
  if (!item.metaDescription || item.metaDescription.trim().length < 60) {
    problems.push({
      code: 'missing-description',
      detail: `${where}: meta description missing or shorter than 60 characters`,
    });
  }
  if (item.metaDescription && item.metaDescription.length > 300) {
    problems.push({
      code: 'long-description',
      detail: `${where}: meta description is ${item.metaDescription.length} characters (keep under 300)`,
    });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.updatedAt)) {
    problems.push({ code: 'bad-date', detail: `${where}: updatedAt "${item.updatedAt}" is not YYYY-MM-DD` });
  }
  for (const link of (item as Production | Release).links ?? []) {
    if (!link.href.startsWith('https://')) {
      problems.push({ code: 'non-https-link', detail: `${where}: link "${link.href}" is not https` });
    }
  }
}

/**
 * Full pass over the data. Returns every problem found; the build treats a
 * non-empty list as fatal.
 */
export function collectProblems(): Problem[] {
  const problems: Problem[] = [];

  const seenSlugs = new Map<string, string>();
  const seenPaths = new Map<string, string>();
  const cueSlugs = new Set(cues.map((c) => c.slug));
  const releaseSlugs = new Set(releases.map((r) => r.slug));

  for (const p of productions) checkBase(problems, `production ${p.slug}`, p, 'work');
  for (const c of cues) checkBase(problems, `cue ${c.slug}`, c, 'reel');
  for (const r of releases) checkBase(problems, `release ${r.slug}`, r, 'store');

  // The mood cluster is copy that appears in the <title> of every cue page, so
  // a typo there would ship as a typo in a published title.
  for (const c of cues) {
    if (!(MOODS as readonly string[]).includes(c.mood)) {
      problems.push({
        code: 'unknown-mood',
        detail: `cue ${c.slug}: mood "${c.mood}" is not one of ${MOODS.join(', ')}`,
      });
    }
  }

  for (const route of itemRoutes) {
    if (seenPaths.has(route.path)) {
      problems.push({
        code: 'duplicate-url',
        detail: `${route.path} is produced twice (${seenPaths.get(route.path)} and ${route.section})`,
      });
    } else {
      seenPaths.set(route.path, route.section);
    }
    if (route.path.endsWith('/')) {
      problems.push({ code: 'trailing-slash', detail: `${route.path} ends with a slash` });
    }
    if (route.path.includes('?') || route.path.includes('#')) {
      problems.push({ code: 'query-or-fragment', detail: `${route.path} is not a clean path segment URL` });
    }
    if (!route.title || !route.description) {
      problems.push({ code: 'missing-head', detail: `${route.path} has no title or description` });
    }
  }
  for (const route of hubs) {
    if (seenPaths.has(route.path)) {
      problems.push({ code: 'duplicate-url', detail: `${route.path} collides with an item route` });
    } else {
      seenPaths.set(route.path, 'hub');
    }
    if (!route.title || !route.description) {
      problems.push({ code: 'missing-head', detail: `hub ${route.path} has no title or description` });
    }
  }

  for (const p of productions) {
    for (const slug of p.relatedCues) {
      if (!cueSlugs.has(slug)) {
        problems.push({ code: 'dangling-cue', detail: `production ${p.slug} references unknown cue ${slug}` });
      }
    }
  }
  for (const c of cues) {
    for (const slug of c.relatedReleases) {
      if (!releaseSlugs.has(slug)) {
        problems.push({ code: 'dangling-release', detail: `cue ${c.slug} references unknown release ${slug}` });
      }
    }
  }
  for (const r of releases) {
    for (const slug of r.relatedCues) {
      if (!cueSlugs.has(slug)) {
        problems.push({ code: 'dangling-cue', detail: `release ${r.slug} references unknown cue ${slug}` });
      }
    }
  }

  // Slugs must be unique inside their section (the sub-arrays above guarantee
  // it), and sections must not collide on the same path shape.
  for (const [key, value] of [
    ['production', productions],
    ['cue', cues],
    ['release', releases],
  ] as const) {
    for (const item of value) {
      const seen = `${key}:${item.slug}`;
      if (seenSlugs.has(seen)) {
        problems.push({ code: 'duplicate-slug', detail: `${key} ${item.slug} appears twice` });
      }
      seenSlugs.set(seen, key);
    }
  }

  return problems;
}

/** Throw if the data breaks an invariant. Call this first in every generator. */
export function assertDataIntegrity(): void {
  const problems = collectProblems();
  if (problems.length) {
    console.error(`data: ${problems.length} problem(s) in src/data`);
    for (const p of problems) console.error(`  x  [${p.code}] ${p.detail}`);
    process.exit(1);
  }
}

/* ---------------------------------------------------------------- utilities */

/** Absolute URL for a route path. */
export function url(path: string): string {
  const clean = path === '/' ? '/' : '/' + path.replace(/^\/+/, '').replace(/\/+$/, '');
  return SITE.origin + clean;
}

export function itemByPath(path: string): ItemRoute | undefined {
  return itemRoutes.find((r) => r.path === path);
}

/** Every route in sitemap order: hubs first (as published), then items. */
export function allRoutes(): Array<{ path: string; title: string; description: string; lastmod: string; kind: 'hub' | 'item'; section?: RouteSection }> {
  return [
    ...hubs.map((h) => ({
      path: h.path,
      title: h.title,
      description: h.description,
      lastmod: h.lastmod,
      kind: 'hub' as const,
    })),
    ...itemRoutes.map((r) => ({
      path: r.path,
      title: r.title,
      description: r.description,
      lastmod: r.lastmod,
      kind: 'item' as const,
      section: r.section,
    })),
  ];
}

export const counts = {
  productions: productions.length,
  cues: cues.length,
  releases: releases.length,
  items: itemRoutes.length,
  hubs: hubs.length,
  urls: itemRoutes.length + hubs.length,
};
