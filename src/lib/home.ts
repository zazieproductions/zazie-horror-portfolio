/** Homepage fragments generated from the same content modules as item pages. */

import { featuredPosterSlugs } from '../data/home.js';
import { person, organization, website } from '../data/entities.js';
import { hubs } from '../data/hubs.js';
import { productions } from '../data/productions.js';
import { INDEXABLE_ROBOTS, ORG_ID, PERSON_ID, SITE_ORIGIN, WEBSITE_ID, escapeHtml, url } from '../data/site.js';
import type { Json, Production } from '../data/types.js';
import { OG_TYPES, ogImageFor, seoBlock } from './head.js';
import type { PageHead } from './head.js';

const homeRoute = hubs.find((hub) => hub.path === '/');
if (!homeRoute) throw new Error('src/data/hubs.ts has no home route');

const productionBySlug = new Map(productions.map((production) => [production.slug, production]));
const homePosters: Production[] = featuredPosterSlugs.map((slug) => {
  const production = productionBySlug.get(slug);
  if (!production) throw new Error(`src/data/home.ts references unknown production "${slug}"`);
  return production;
});
if (new Set(featuredPosterSlugs).size !== featuredPosterSlugs.length) {
  throw new Error('src/data/home.ts has a duplicate poster-wall slug');
}

/** Exact button markup used by the existing poster wall and lightbox. */
export function renderHomePosterCards(): string {
  return homePosters
    .map((production) => {
      const poster = production.poster;
      const source = poster.avif
        ? `<source srcset="${escapeHtml(poster.avif)} 640w" sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 46vw" type="image/avif">`
        : '';
      const srcset = poster.srcset
        ? ` srcset="${escapeHtml(poster.srcset)}" sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 46vw"`
        : '';
      return `<button type="button" class="group relative w-full overflow-hidden border border-ash bg-smoke text-left transition-all duration-500 hover:border-blood/60 hover:shadow-[0_12px_40px_rgba(80,0,0,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blood" aria-label="View ${escapeHtml(production.title)} poster" data-home-poster="${escapeHtml(production.slug)}">
<div class="relative aspect-[2/3] overflow-hidden bg-void">
<picture>
${source}
<img alt="" class="h-full w-full object-cover object-top opacity-95 transition-transform duration-700 ease-out group-hover:scale-105 group-hover:opacity-100" loading="lazy" decoding="async" src="${escapeHtml(poster.src)}" width="${poster.width}" height="${poster.height}"${srcset}>
</picture>
<div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-void via-void/5 to-transparent opacity-80"></div>
<div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"><div class="absolute inset-0 bg-blood/10 mix-blend-multiply"></div></div>
<div class="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-4 md:p-5">
<h3 class="font-display text-base leading-tight text-bone transition-colors group-hover:text-blood sm:text-xl md:text-2xl">${escapeHtml(production.title)}</h3>
</div>
</div>
</button>`;
    })
    .join('\n');
}

/**
 * Homepage schema stays deliberately small: the verified shared identities and
 * the current home WebPage only. No inherited reviews, awards, pricing, or FAQ
 * and video graphs from the historical markup are copied forward.
 */
export const homeJsonLd: Json[] = [
  person as unknown as Json,
  organization as unknown as Json,
  website as unknown as Json,
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE_ORIGIN}/#webpage`,
    url: url('/'),
    name: homeRoute.title,
    description: homeRoute.description,
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: { '@id': PERSON_ID },
    author: { '@id': PERSON_ID },
    publisher: { '@id': ORG_ID },
    inLanguage: 'en',
    dateModified: homeRoute.lastmod,
  },
];

const homeImage = {
  src: '/images/hero-portrait.jpg',
  alt: 'Portrait artwork for Zazie Productions',
  width: 896,
  height: 1152,
};

export const homePageHead: PageHead = {
  title: homeRoute.title,
  description: homeRoute.description,
  canonical: url('/'),
  robots: INDEXABLE_ROBOTS,
  ogType: OG_TYPES.website,
  image: ogImageFor(homeImage),
  jsonLd: homeJsonLd,
};

export function renderHomeSeo(): string {
  return seoBlock(homePageHead);
}
