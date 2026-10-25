/** Homepage fragments generated from the same content modules as item pages. */

import { additionalHomePosters, featuredCueSlugs, featuredPosterSlugs } from '../data/home.js';
import { compilations } from '../data/compilations.js';
import { cues } from '../data/cues.js';
import { person, organization, website } from '../data/entities.js';
import { hubs } from '../data/hubs.js';
import { productions } from '../data/productions.js';
import {
  INDEXABLE_ROBOTS,
  ORG_ID,
  PERSON_ID,
  SITE_ORIGIN,
  WEBSITE_ID,
  escapeHtml,
  isoDuration,
  oneLine,
  url,
} from '../data/site.js';
import type { Cue, Json, Production } from '../data/types.js';
import { OG_TYPES, ogImageFor, seoBlock } from './head.js';
import type { PageHead } from './head.js';

const homeRoute = hubs.find((hub) => hub.path === '/');
if (!homeRoute) throw new Error('src/data/hubs.ts has no home route');

const productionBySlug = new Map(productions.map((production) => [production.slug, production]));
const productionPosters: Production[] = featuredPosterSlugs.map((slug) => {
  const production = productionBySlug.get(slug);
  if (!production) throw new Error(`src/data/home.ts references unknown production "${slug}"`);
  return production;
});

const cueBySlug = new Map(cues.map((cue) => [cue.slug, cue]));
const featuredCues: Cue[] = featuredCueSlugs.map((slug) => {
  const cue = cueBySlug.get(slug);
  if (!cue) throw new Error(`src/data/home.ts references unknown cue "${slug}"`);
  return cue;
});

/**
 * Homepage MusicComposition graph. The showreel section lists the full 30-cue
 * archive; this ItemList republishes the curated cues as schema.org music
 * works so rich results can attach durations, genres and playable MP3s to the
 * homepage itself. Each node reuses the exact @id of the /reel/<slug> page's
 * composition and audio nodes, so the graphs merge instead of duplicating the
 * work. Nothing here is invented: titles, genres, durations and audio paths
 * come from cues.ts, the same module that renders the item pages.
 */
function featuredCueCatalog(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_ORIGIN}/#cue-catalog`,
    name: 'Featured psychological horror cues — Zazie Productions showreel',
    description:
      'Curated original horror compositions for film, TV and games by composer Zazie Kanwar-Torge: psychological orchestral cues, body-horror textures, stingers and dark ambient drones.',
    url: `${SITE_ORIGIN}/#showreel`,
    mainEntityOfPage: { '@id': `${SITE_ORIGIN}/#webpage` },
    numberOfItems: featuredCues.length,
    itemListElement: featuredCues.map((cue, index) => {
      const cuePath = `/reel/${cue.slug}`;
      const compositionId = `${url(cuePath)}#composition`;
      const audioId = `${url(cuePath)}#audio`;
      const description = oneLine(cue.description);
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@context': 'https://schema.org',
          '@type': 'MusicComposition',
          '@id': compositionId,
          url: url(cuePath),
          name: cue.title,
          description,
          genre: cue.category,
          composer: { '@id': PERSON_ID },
          creator: { '@id': PERSON_ID },
          duration: isoDuration(cue.durationSeconds),
          isPartOf: { '@id': WEBSITE_ID },
          mainEntityOfPage: { '@id': `${url(cuePath)}#webpage` },
          dateModified: cue.updatedAt,
          audio: {
            '@id': audioId,
            '@type': 'AudioObject',
            name: cue.title,
            description,
            contentUrl: url(cue.audioPath),
            encodingFormat: 'audio/mpeg',
            duration: isoDuration(cue.durationSeconds),
            genre: cue.category,
            creator: { '@id': PERSON_ID },
            isPartOf: { '@id': WEBSITE_ID },
            mainEntityOfPage: { '@id': `${url(cuePath)}#webpage` },
          },
        },
      };
    }),
  };
}
const homePosters = [...productionPosters, ...additionalHomePosters];
const posterSlugs = homePosters.map((poster) => poster.slug);
if (new Set(posterSlugs).size !== posterSlugs.length) {
  throw new Error('src/data/home.ts has a duplicate poster-wall slug');
}

function posterMetaLine(homePoster: (typeof homePosters)[number]): string {
  if ('credits' in homePoster) {
    const zazieRole = homePoster.credits.find((credit) => /zazie/i.test(credit.name))?.role;
    const parts = [homePoster.workType];
    if (homePoster.releaseYear) parts.push(String(homePoster.releaseYear));
    if (zazieRole) parts.push(zazieRole);
    return parts.join(' · ');
  }
  return `${homePoster.workType} · ${homePoster.roleLabel}`;
}

export const homePosterClientData = homePosters.map((homePoster) => ({
  slug: homePoster.slug,
  title: homePoster.title,
  alt: homePoster.poster.alt,
  meta: posterMetaLine(homePoster),
  summary: homePoster.summary,
}));

/** Exact semantic article + button markup used by the poster wall and lightbox. */
export function renderHomePosterCards(): string {
  return homePosters
    .map((homePoster) => {
      const poster = homePoster.poster;
      const avifSet = poster.avifSet ?? (poster.avif ? `${poster.avif} 640w` : '');
      const source = avifSet
        ? `<source srcset="${escapeHtml(avifSet)}" sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 46vw" type="image/avif">`
        : '';
      const srcset = poster.srcset
        ? ` srcset="${escapeHtml(poster.srcset)}" sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 46vw"`
        : '';
      const contain = 'fit' in homePoster && homePoster.fit === 'contain';
      const fitClass = contain ? 'zp-poster-contain' : 'object-cover object-top group-hover:scale-105';
      const slug = escapeHtml(homePoster.slug);
      return `<article id="poster-${slug}" class="zp-poster-card flex flex-col border border-ash bg-smoke transition-all duration-500 hover:border-blood/60 hover:shadow-[0_12px_40px_rgba(80,0,0,0.35)]">
<button type="button" class="group relative w-full overflow-hidden bg-smoke text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blood" aria-label="View ${escapeHtml(homePoster.title)} poster" data-home-poster="${slug}">
<div class="relative aspect-[2/3] overflow-hidden bg-void">
<picture>
${source}
<img alt="${escapeHtml(poster.alt)}" class="h-full w-full ${fitClass} opacity-95 transition-transform duration-700 ease-out group-hover:opacity-100" loading="lazy" decoding="async" src="${escapeHtml(poster.src)}" width="${poster.width}" height="${poster.height}"${srcset}>
</picture>
<div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-void via-void/5 to-transparent opacity-80"></div>
<div class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"><div class="absolute inset-0 bg-blood/10 mix-blend-multiply"></div></div>
<div class="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-4 md:p-5">
<h3 class="font-display text-base leading-tight text-bone transition-colors group-hover:text-blood sm:text-xl md:text-2xl">${escapeHtml(homePoster.title)}</h3>
</div>
</div>
</button>
</article>`;
    })
    .join('\n');
}

/**
 * Homepage schema: the verified shared identities and home WebPage, the
 * CreativeWork portfolio graph, the MusicPlaylist showreel/compilations
 * graph, and one curated ItemList of MusicComposition nodes (each with an
 * AudioObject) whose @ids merge with the /reel/<slug> item graphs. No
 * inherited reviews, awards, pricing, FAQ or video graphs from the
 * historical markup are copied forward.
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
    hasPart: [{ '@id': `${SITE_ORIGIN}/#creative-work` }, { '@id': `${SITE_ORIGIN}/#playlist` }],
    author: { '@id': PERSON_ID },
    publisher: { '@id': ORG_ID },
    inLanguage: 'en',
    dateModified: homeRoute.lastmod,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${SITE_ORIGIN}/#creative-work`,
    name: 'Zazie Productions — Selected Horror Film Scores & Sound Design Portfolio',
    description:
      'Original horror film scores, dark ambient compositions, and experimental cinema sound design by Zazie Kanwar-Torge (Zazie Productions LLC).',
    url: `${SITE_ORIGIN}/#posters`,
    creator: { '@id': PERSON_ID },
    author: { '@id': PERSON_ID },
    publisher: { '@id': ORG_ID },
    inLanguage: 'en',
    genre: ['Psychological Horror', 'Folk Horror', 'Body Horror', 'Supernatural Thriller', 'Dark Ambient'],
    hasPart: productionPosters.map((prod) => ({
      '@type': 'CreativeWork',
      name: prod.title,
      description: prod.summary,
      url: url(`/work/${prod.slug}`),
      ...(prod.releaseYear ? { datePublished: String(prod.releaseYear) } : {}),
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    '@id': `${SITE_ORIGIN}/#playlist`,
    name: 'Zazie Kanwar-Torge — Original Horror Score Showreel & Compilations',
    description:
      '30 original horror film score cues and 11 Bandcamp compilation and standalone releases by Zazie Kanwar-Torge.',
    url: `${SITE_ORIGIN}/#showreel`,
    creator: { '@id': PERSON_ID },
    author: { '@id': PERSON_ID },
    numTracks: cues.length + compilations.length,
    track: [
      ...cues.map((cue, idx) => ({
        '@type': 'MusicRecording',
        position: idx + 1,
        name: cue.title,
        duration: isoDuration(cue.durationSeconds),
        genre: cue.category,
        url: url(`/reel/${cue.slug}`),
        byArtist: { '@id': PERSON_ID },
      })),
      ...compilations.map((item, idx) => ({
        '@type': 'MusicRecording',
        position: cues.length + idx + 1,
        name: item.title,
        inAlbum: {
          '@type': 'MusicAlbum',
          name: item.album,
          ...(item.albumUrl ? { url: item.albumUrl } : {}),
        },
        ...(item.trackUrl ? { url: item.trackUrl } : item.albumUrl ? { url: item.albumUrl } : {}),
        byArtist: { '@id': PERSON_ID },
      })),
    ],
  },
  featuredCueCatalog(),
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
