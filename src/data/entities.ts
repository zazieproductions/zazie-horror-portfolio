/** Verified site-level identity nodes and Knowledge Graph authority mappings shared across the site. */

import { AUTHOR_NAME, ORG_ID, PERSON_ID, SITE_NAME, SITE_ORIGIN, WEBSITE_ID } from './site.js';

export const VERIFIED_SAME_AS = [
  'https://www.imdb.com/name/nm17333332/',
  'https://soundbetter.com/profiles/614805-zazie-productions',
  'https://filmfreeway.com/ZazieProductions',
  'https://www.stage32.com/profile/1164424/about',
  'https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0',
  'https://music.apple.com/us/artist/zazie-productions/1623719351',
  'https://zazieproductions.bandcamp.com/',
  'https://zazieproductions.itch.io/',
  'https://zazieproductions.gumroad.com/',
  'https://www.youtube.com/@zazieproductions',
  'https://www.linkedin.com/in/zazie-kanwar-torge-3b8a98373/',
  'https://credits.muso.ai/profile/4010f3b7-9a87-4961-8dfd-917de0ba787e',
] as const;

/**
 * External Knowledge Graph authority entities linking Zazie Kanwar-Torge's
 * core compositional specialties to canonical Wikipedia and IMDb genre/keyword nodes.
 */
export const KNOWS_ABOUT_ENTITIES = [
  {
    '@type': 'Thing',
    name: 'Experimental Art House Cinema Scoring',
    url: 'https://en.wikipedia.org/wiki/Art_film',
    sameAs: [
      'https://en.wikipedia.org/wiki/Experimental_film',
      'https://www.imdb.com/search/title/?genres=horror&keywords=art-house',
    ],
  },
  {
    '@type': 'Thing',
    name: 'Psychological Horror Film Scoring',
    url: 'https://en.wikipedia.org/wiki/Psychological_horror',
    sameAs: ['https://www.imdb.com/search/title/?genres=horror&keywords=psychological-horror'],
  },
  {
    '@type': 'Thing',
    name: 'Folk Horror Original Music',
    url: 'https://en.wikipedia.org/wiki/Folk_horror',
    sameAs: ['https://www.imdb.com/search/title/?genres=horror&keywords=folk-horror'],
  },
  {
    '@type': 'Thing',
    name: 'Body Horror Sound Worlds',
    url: 'https://en.wikipedia.org/wiki/Body_horror',
    sameAs: ['https://www.imdb.com/search/title/?genres=horror&keywords=body-horror'],
  },
  {
    '@type': 'Thing',
    name: 'Supernatural & Cosmic Horror Composition',
    url: 'https://en.wikipedia.org/wiki/Lovecraftian_horror',
    sameAs: [
      'https://en.wikipedia.org/wiki/Supernatural_horror_film',
      'https://www.imdb.com/search/title/?genres=horror,thriller',
    ],
  },
  {
    '@type': 'Thing',
    name: 'Electroacoustic & Musique Concrète Scoring',
    url: 'https://en.wikipedia.org/wiki/Musique_concr%C3%A8te',
    sameAs: ['https://en.wikipedia.org/wiki/Electroacoustic_music'],
  },
  {
    '@type': 'Thing',
    name: 'Waterphone & Bowed Metal Instrumentation',
    url: 'https://en.wikipedia.org/wiki/Waterphone',
    sameAs: ['https://en.wikipedia.org/wiki/Extended_technique'],
  },
  {
    '@type': 'Thing',
    name: 'Dark Ambient & Hybrid Orchestral Synthesis',
    url: 'https://en.wikipedia.org/wiki/Dark_ambient',
    sameAs: ['https://en.wikipedia.org/wiki/Film_score'],
  },
  {
    '@type': 'Thing',
    name: 'Adaptive Horror Video Game Music',
    url: 'https://en.wikipedia.org/wiki/Adaptive_music',
    sameAs: ['https://en.wikipedia.org/wiki/Video_game_music'],
  },
  {
    '@type': 'Thing',
    name: 'Multichannel Spatial Audio Composition',
    url: 'https://en.wikipedia.org/wiki/3D_audio_effect',
    sameAs: ['https://en.wikipedia.org/wiki/Sound_design'],
  },
] as const;

const GENRE_AUTHORITY_MAP: Record<string, readonly string[]> = {
  'experimental art house': [
    'https://en.wikipedia.org/wiki/Art_film',
    'https://en.wikipedia.org/wiki/Experimental_film',
    'https://www.imdb.com/search/title/?genres=horror&keywords=art-house',
  ],
  'experimental film': [
    'https://en.wikipedia.org/wiki/Experimental_film',
    'https://en.wikipedia.org/wiki/Art_film',
    'https://www.imdb.com/search/title/?keywords=experimental-film',
  ],
  experimental: [
    'https://en.wikipedia.org/wiki/Experimental_music',
    'https://en.wikipedia.org/wiki/Art_film',
  ],
  'avant-garde': ['https://en.wikipedia.org/wiki/Avant-garde_music'],
  'outsider music': ['https://en.wikipedia.org/wiki/Outsider_music'],
  'psychological horror': [
    'https://en.wikipedia.org/wiki/Psychological_horror',
    'https://www.imdb.com/search/title/?genres=horror&keywords=psychological-horror',
  ],
  'psychological orchestral': [
    'https://en.wikipedia.org/wiki/Psychological_horror',
    'https://en.wikipedia.org/wiki/Film_score',
    'https://www.imdb.com/search/title/?genres=horror&keywords=psychological-horror',
  ],
  'folk horror': [
    'https://en.wikipedia.org/wiki/Folk_horror',
    'https://www.imdb.com/search/title/?genres=horror&keywords=folk-horror',
  ],
  'body horror': [
    'https://en.wikipedia.org/wiki/Body_horror',
    'https://www.imdb.com/search/title/?genres=horror&keywords=body-horror',
  ],
  'supernatural thriller': [
    'https://en.wikipedia.org/wiki/Supernatural_horror_film',
    'https://www.imdb.com/search/title/?genres=horror,thriller',
  ],
  paranormal: [
    'https://en.wikipedia.org/wiki/Supernatural_horror_film',
    'https://www.imdb.com/search/title/?genres=horror&keywords=paranormal',
  ],
  'cosmic horror': [
    'https://en.wikipedia.org/wiki/Lovecraftian_horror',
    'https://www.imdb.com/search/title/?genres=horror&keywords=lovecraftian',
  ],
  'ambient horror': [
    'https://en.wikipedia.org/wiki/Dark_ambient',
    'https://en.wikipedia.org/wiki/Horror_film',
  ],
  'dark ambient': ['https://en.wikipedia.org/wiki/Dark_ambient'],
  'horror stinger': [
    'https://en.wikipedia.org/wiki/Film_score',
    'https://en.wikipedia.org/wiki/Horror_film',
    'https://www.imdb.com/search/title/?genres=horror',
  ],
  horror: [
    'https://en.wikipedia.org/wiki/Horror_film',
    'https://www.imdb.com/search/title/?genres=horror',
  ],
  thriller: [
    'https://en.wikipedia.org/wiki/Thriller_film',
    'https://www.imdb.com/search/title/?genres=thriller',
  ],
  'science fiction': [
    'https://en.wikipedia.org/wiki/Science_fiction_film',
    'https://www.imdb.com/search/title/?genres=sci-fi',
  ],
  crime: ['https://www.imdb.com/search/title/?genres=crime'],
  drama: ['https://www.imdb.com/search/title/?genres=drama'],
  mystery: ['https://www.imdb.com/search/title/?genres=mystery'],
  'short film': [
    'https://en.wikipedia.org/wiki/Short_film',
    'https://www.imdb.com/search/title/?title_type=short',
  ],
  'reality television': ['https://en.wikipedia.org/wiki/Reality_television'],
  idm: ['https://en.wikipedia.org/wiki/Intelligent_dance_music'],
  electronic: ['https://en.wikipedia.org/wiki/Electronic_music'],
  acousmatic: ['https://en.wikipedia.org/wiki/Acousmatic_music'],
  industrial: ['https://en.wikipedia.org/wiki/Industrial_music'],
  'chamber music': ['https://en.wikipedia.org/wiki/Chamber_music'],
  'film score': ['https://en.wikipedia.org/wiki/Film_score'],
  'sound effects': [
    'https://en.wikipedia.org/wiki/Sound_effect',
    'https://en.wikipedia.org/wiki/Sound_design',
  ],
};

/**
 * Preserves human-readable genre labels and appends deduplicated external
 * authority URIs (Wikipedia + IMDb) conforming to Schema.org `genre` (Text | URL).
 */
export function deepLinkGenres(labels: readonly string[]): string[] {
  const result = new Set<string>();
  for (const label of labels) {
    result.add(label);
  }
  for (const label of labels) {
    const key = label.trim().toLowerCase();
    const links = GENRE_AUTHORITY_MAP[key];
    if (links) {
      for (const link of links) result.add(link);
    }
  }
  return [...result];
}

export const PORTFOLIO_GENRES_DEEP_LINKED = deepLinkGenres([
  'Experimental Art House',
  'Psychological Horror',
  'Folk Horror',
  'Body Horror',
  'Supernatural Thriller',
  'Dark Ambient',
]);

export const person = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': PERSON_ID,
  name: AUTHOR_NAME,
  alternateName: SITE_NAME,
  description:
    'IMDb-credited horror film composer, experimental producer, sound designer, and multi-instrumentalist based in Asheville, North Carolina. Founder of Zazie Productions LLC, composing bespoke psychological horror, folk horror, body horror, and experimental art house scores for independent film, television, and games worldwide.',
  url: `${SITE_ORIGIN}/composer`,
  image: `${SITE_ORIGIN}/images/headshot.jpg`,
  jobTitle: [
    'Experimental Art House & Psychological Horror Film Composer',
    'Folk Horror & Body Horror Composer',
    'Film, TV & Game Composer',
    'Experimental Sound Designer',
    'Multi-Instrumentalist',
  ],
  worksFor: { '@id': ORG_ID },
  homeLocation: {
    '@type': 'Place',
    name: 'Asheville, North Carolina, US',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Asheville',
      addressRegion: 'NC',
      addressCountry: 'US',
    },
  },
  knowsAbout: KNOWS_ABOUT_ENTITIES,
  subjectOf: [
    {
      '@type': 'Article',
      headline: 'How an Underground Experimental Musician Became a Go-To Composer for Psychological Horror',
      url: 'https://billboardwire.com/how-an-underground-experimental-musician-became-a-go-to-composer-for-psychological-horror/',
      publisher: { '@type': 'Organization', name: 'Billboard Wire' },
    },
    {
      '@type': 'Article',
      headline: 'Zazie Productions: The Underground Polymath Redefining Experimental Music',
      url: 'https://grammyweekly.com/zazie-productions-the-underground-polymath-redefining-experimental-music/',
      publisher: { '@type': 'Organization', name: 'Grammy Weekly' },
    },
    {
      '@type': 'Article',
      headline: 'Forget ASMR: Zazie Productions Will Rewire Your Whole Nervous System',
      url: 'https://limitless-magazine.com/2026/06/12/forget-asmr-zazie-productions-will-rewire-your-whole-nervous-system/',
      publisher: { '@type': 'Organization', name: 'Limitless Magazine' },
    },
    {
      '@type': 'WebPage',
      name: 'Broadcast: BMC Radio Artist Zazie Productions — Cheaper Impressions',
      url: 'https://www.blackmountaincollege.org/broadcast-bmc-radio-artist-zazie-productions/',
      publisher: { '@type': 'Organization', name: 'Black Mountain College Museum + Arts Center' },
    },
  ],
  sameAs: VERIFIED_SAME_AS,
} as const;

export const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'Zazie Productions LLC',
  legalName: 'Zazie Productions LLC',
  alternateName: SITE_NAME,
  description:
    'Boutique horror scoring and experimental sound-design atelier led by composer Zazie Kanwar-Torge, writing original psychological horror, folk horror, body horror, and experimental art house scores to picture for independent feature films, short films, series, and horror video games.',
  url: SITE_ORIGIN,
  logo: `${SITE_ORIGIN}/images/hero-portrait.jpg`,
  founder: { '@id': PERSON_ID },
  email: 'zaziediya@gmail.com',
  telephone: '+1-864-430-0606',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Asheville',
    addressRegion: 'NC',
    addressCountry: 'US',
  },
  areaServed: 'Worldwide',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Scoring Commissions & Quotes',
    email: 'zaziediya@gmail.com',
    telephone: '+1-864-430-0606',
    url: `${SITE_ORIGIN}/hire-a-composer`,
    availableLanguage: ['en'],
  },
  sameAs: [
    'https://www.imdb.com/name/nm17333332/',
    'https://soundbetter.com/profiles/614805-zazie-productions',
    'https://filmfreeway.com/ZazieProductions',
    'https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0',
    'https://music.apple.com/us/artist/zazie-productions/1623719351',
    'https://zazieproductions.bandcamp.com/',
    'https://zazieproductions.itch.io/',
    'https://zazieproductions.gumroad.com/',
    'https://www.youtube.com/@zazieproductions',
  ],
} as const;

export const website = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  name: `${SITE_NAME} — Experimental Art House & Psychological Horror Composer Zazie Kanwar-Torge`,
  alternateName: SITE_NAME,
  url: `${SITE_ORIGIN}/`,
  publisher: { '@id': ORG_ID },
  author: { '@id': PERSON_ID },
  inLanguage: 'en',
} as const;
