/** Homepage fragments generated from the same content modules as item pages. */

import { additionalHomePosters, featuredPosterSlugs } from '../data/home.js';
import { compilations } from '../data/compilations.js';
import { cues } from '../data/cues.js';
import { PORTFOLIO_GENRES_DEEP_LINKED, deepLinkGenres, person, organization, website } from '../data/entities.js';
import { hubs } from '../data/hubs.js';
import { productions } from '../data/productions.js';
import { INDEXABLE_ROBOTS, ORG_ID, PERSON_ID, SITE_ORIGIN, WEBSITE_ID, escapeHtml, isoDuration, url } from '../data/site.js';
import type { Json, Production } from '../data/types.js';
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
 * Homepage schema includes the verified shared identities, the home WebPage,
 * the CreativeWork portfolio graph, and the MusicPlaylist showreel/compilations graph.
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
    name: 'Zazie Productions — Experimental Art House, Psychological, Folk & Body Horror Film Scores Portfolio',
    description:
      'Original psychological horror, folk horror, body horror, and experimental art house film scores, dark ambient compositions, and cinema sound design by Zazie Kanwar-Torge (Zazie Productions LLC).',
    url: `${SITE_ORIGIN}/#posters`,
    creator: { '@id': PERSON_ID },
    author: { '@id': PERSON_ID },
    publisher: { '@id': ORG_ID },
    inLanguage: 'en',
    genre: PORTFOLIO_GENRES_DEEP_LINKED,
    hasPart: productionPosters.map((prod) => ({
      '@type': 'CreativeWork',
      name: prod.title,
      description: prod.summary,
      genre: deepLinkGenres(prod.genres),
      url: url(`/work/${prod.slug}`),
      ...(prod.releaseYear ? { datePublished: String(prod.releaseYear) } : {}),
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    '@id': `${SITE_ORIGIN}/#playlist`,
    name: 'Zazie Kanwar-Torge — Experimental Art House, Psychological, Folk & Body Horror Showreel & Compilations',
    description:
      '30 original horror film score cues and 9 Bandcamp compilation and standalone releases by Zazie Kanwar-Torge.',
    url: `${SITE_ORIGIN}/#showreel`,
    creator: { '@id': PERSON_ID },
    author: { '@id': PERSON_ID },
    genre: PORTFOLIO_GENRES_DEEP_LINKED,
    numTracks: cues.length + compilations.length,
    track: [
      ...cues.map((cue, idx) => ({
        '@type': 'MusicRecording',
        position: idx + 1,
        name: cue.title,
        duration: isoDuration(cue.durationSeconds),
        genre: deepLinkGenres([cue.category]),
        url: url(`/reel/${cue.slug}`),
        byArtist: { '@id': PERSON_ID },
      })),
      ...compilations.map((item, idx) => ({
        '@type': 'MusicRecording',
        position: cues.length + idx + 1,
        name: item.title,
        ...(item.genres?.length ? { genre: deepLinkGenres(item.genres) } : {}),
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
];

const homeImage = {
  src: '/images/hero-portrait.jpg',
  alt: 'Zazie Productions: Experimental art house, psychological, folk, and body horror film scores by Zazie Kanwar-Torge featuring bowed metal and experimental synthesis.',
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
