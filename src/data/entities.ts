/** Verified site-level identity nodes shared by the homepage and item pages. */

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

/** Topical references only, never identity aliases or production credits. */
export const HORROR_REFERENCE_TOPICS = [
  {
    "@type": "Thing",
    "name": "A24 film aesthetic",
    "description": "A reference topic in prestige horror scoring; not an affiliation or production credit.",
    "url": "https://en.wikipedia.org/wiki/A24"
  },
  {
    "@type": "Thing",
    "name": "Mica Levi scoring techniques",
    "description": "A reference topic in experimental film scoring; not a collaboration or credit.",
    "url": "https://en.wikipedia.org/wiki/Mica_Levi"
  },
  {
    "@type": "Thing",
    "name": "Folk Horror tropes",
    "description": "Genre conventions used as reference topics for horror scoring.",
    "url": "https://en.wikipedia.org/wiki/Folk_horror"
  }
] as const;

export const person = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': PERSON_ID,
  name: AUTHOR_NAME,
  alternateName: SITE_NAME,
  description:
    'IMDb-credited horror film composer, experimental producer, sound designer, and multi-instrumentalist based in Asheville, North Carolina. Founder of Zazie Productions LLC, composing custom psychological, folk, body, supernatural, and experimental scores for film, television, and games worldwide.',
  url: `${SITE_ORIGIN}/composer`,
  image: `${SITE_ORIGIN}/images/headshot.jpg`,
  jobTitle: [
    'Horror Film Composer',
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
  knowsAbout: [
    ...HORROR_REFERENCE_TOPICS,
    'Psychological horror film scoring',
    'Folk horror original music',
    'Body horror sound worlds',
    'Experimental cinema composition',
    'Adaptive horror video game music',
    'Electroacoustic and musique concrète scoring',
    'Waterphone and bowed metal instrumentation',
    'Hybrid orchestral synthesis',
    'Multichannel spatial audio composition',
  ],
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
    'Independent horror scoring and cinematic sound-design studio led by composer Zazie Kanwar-Torge, writing original scores to picture for independent feature films, short films, series, and horror video games.',
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
  name: `${SITE_NAME} — Horror Film, TV & Game Composer Zazie Kanwar-Torge`,
  alternateName: SITE_NAME,
  url: `${SITE_ORIGIN}/`,
  publisher: { '@id': ORG_ID },
  author: { '@id': PERSON_ID },
  inLanguage: 'en',
} as const;
