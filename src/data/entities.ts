/** Verified site-level identity nodes shared by the homepage and item pages. */

import { AUTHOR_NAME, ORG_ID, PERSON_ID, SITE_NAME, SITE_ORIGIN, WEBSITE_ID } from './site.js';

export const person = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': PERSON_ID,
  name: AUTHOR_NAME,
  url: `${SITE_ORIGIN}/composer`,
  image: `${SITE_ORIGIN}/images/headshot.jpg`,
  jobTitle: ['Composer', 'Sound designer'],
  sameAs: [
    'https://www.imdb.com/name/nm17333332/',
    'https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0',
    'https://zazieproductions.bandcamp.com/',
    'https://www.youtube.com/@zazieproductions',
  ],
} as const;

export const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'Zazie Productions LLC',
  alternateName: SITE_NAME,
  url: SITE_ORIGIN,
  founder: { '@id': PERSON_ID },
  sameAs: [
    'https://zazieproductions.bandcamp.com/',
    'https://www.youtube.com/@zazieproductions',
  ],
} as const;

export const website = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: SITE_NAME,
  url: `${SITE_ORIGIN}/`,
  publisher: { '@id': ORG_ID },
  author: { '@id': PERSON_ID },
  inLanguage: 'en',
} as const;
