#!/usr/bin/env node
/**
 * patch-homepage-entity.mjs
 * -----------------------------------------------------------------------------
 * Binds the homepage's JSON-LD to the same property registry the rest of the
 * ecosystem is generated from (tools/ecosystem-properties.json).
 *
 * The homepage is prerendered React: the visible DOM inside #root is torn down
 * and rebuilt by the bundle, so the structured data in <head> is the part that
 * survives untouched for every crawler, rendered or not. This script keeps that
 * head graph in sync with the registry instead of letting it drift.
 *
 *   node tools/patch-homepage-entity.mjs
 *
 * Idempotent: keyed on sentinel values, safe to re-run.
 * -----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://horror.zazieproductions.com';
const HOME = path.join(ROOT, 'index.html');

const REG = JSON.parse(fs.readFileSync(path.join(__dirname, 'ecosystem-properties.json'), 'utf8'));
const ALL = REG.groups.flatMap((g) => g.items);

const SAME_AS_PERSON = [
  SITE + '/',
  'https://www.imdb.com/name/nm17333332',
  'https://pro.imdb.com/name/nm17333332/',
  'https://www.themoviedb.org/person/5112050',
  'https://credits.muso.ai/profile/4010f3b7-9a87-4961-8dfd-917de0ba787e',
  'https://www.stage32.com/profile/1164424/about',
  'https://filmfreeway.com/ZazieProductions',
  'https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0',
  'https://music.apple.com/us/artist/zazie-productions/1623719351',
  'https://www.deezer.com/us/artist/170543657',
  'https://zazieproductions.bandcamp.com',
  'https://youtube.com/@zazieproductions',
  'https://www.discogs.com/artist/11354435',
  'https://musicbrainz.org/artist/b610b4cb-87da-44d7-a262-2bd65fb8098c',
  'https://pro.soundclick.com/ZazieProductions',
  'https://zazieproductions.itch.io/',
  'https://zazieproductions.gumroad.com/',
  'https://www.ebay.com/usr/zazie_productions',
  'https://linktr.ee/zazieproductions',
  'https://www.instagram.com/zazieproductionsofficial/',
  'https://www.linkedin.com/in/zazie-kanwar-torge-3b8a98373/',
  'https://github.com/zazieproductions',
  'https://substack.com/@zazieproductions',
  'https://groover.co/en/influencer/profile/0.zazie-productions/',
  'https://hackaday.io/ZazieProductions',
  'https://www.castingcall.club/zazieproductions',
  SITE + '/composer',
  SITE + '/work',
  SITE + '/reel',
  SITE + '/discography',
  SITE + '/press',
  SITE + '/elsewhere',
];

const SAME_AS_ORG = SAME_AS_PERSON.filter(
  (u) => !/imdb\.com\/name|linkedin\.com|stage32\.com|muso\.ai/.test(u)
);

const ALBUMS = REG.releases.map((r) => ({
  '@type': 'MusicAlbum',
  name: r.title,
  url: r.url,
  datePublished: r.year,
  byArtist: { '@id': SITE + '/#label' },
  sameAs: [
    'https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0',
    'https://music.apple.com/us/artist/zazie-productions/1623719351',
    'https://www.deezer.com/us/artist/170543657',
    'https://zazieproductions.bandcamp.com/music',
  ],
}));

let src = fs.readFileSync(HOME, 'utf8');
const original = src;

/* ------------------------------------------------------- 1. Person sameAs */

const PERSON_SAMEAS_RE = /("@type": "Person",\s*\n\s*"@id": "https:\/\/horror\.zazieproductions\.com\/#person",\s*\n(?:.*?\n)*?)(\s*"sameAs": \[[^\]]*?\])/;
if (src.includes('"https://pro.imdb.com/name/nm17333332/"')) {
  console.log('  -- Person sameAs: already expanded');
} else {
  const m = PERSON_SAMEAS_RE.exec(src);
  if (!m) {
    console.error('  !! Person sameAs block not matched');
    process.exitCode = 1;
  } else {
    src = src.replace(
      m[0],
      m[1] + '    "sameAs": [\n' + SAME_AS_PERSON.map((u) => `      "${u}"`).join(',\n') + '\n    ]'
    );
    console.log(`  ++ Person sameAs -> ${SAME_AS_PERSON.length} values`);
  }
}

/* ------------------------------------------- 2. Person name disambiguation */

if (src.includes('"Zazie Kanwar- Torge"')) {
  console.log('  -- Person alternateName: already disambiguated');
} else {
  src = src.replace(
    '"alternateName": ["Zazie Productions", "ZKT Productions"]',
    '"alternateName": ["Zazie Productions", "ZKT Productions", "Zazie Kanwar- Torge", "Zazie Diya Kanwar-Torge"]'
  );
  console.log('  ++ Person alternateName -> 4 spelling variants');
}

/* ------------------------------------------------- 3. Organization sameAs */

const ORG_RE = /("@type": "Organization",\s*\n\s*"@id": "https:\/\/horror\.zazieproductions\.com\/#org",\s*\n(?:.*?\n)*?)(\s*"sameAs": \[[^\]]*?\])/;
const orgBlock = ORG_RE.exec(src);
if (orgBlock && orgBlock[2].includes('deezer.com')) {
  console.log('  -- Organization sameAs: already expanded');
} else if (!orgBlock) {
  console.error('  !! Organization sameAs block not matched');
  process.exitCode = 1;
} else {
  src = src.replace(
    orgBlock[0],
    orgBlock[1] + '    "sameAs": [\n' + SAME_AS_ORG.map((u) => `      "${u}"`).join(',\n') + '\n    ]'
  );
  console.log(`  ++ Organization sameAs -> ${SAME_AS_ORG.length} values`);
}

/* ---------------------------------------------------------- 4. Breadcrumbs */

if (src.includes('"position": 11, "name": "The Archive Elsewhere')) {
  console.log('  -- BreadcrumbList: already extended');
} else {
  const extra = [
    { position: 9, name: 'Records: 18 Releases', item: `${SITE}/discography` },
    { position: 10, name: 'Press, Awards and Citations', item: `${SITE}/press` },
    { position: 11, name: 'The Archive Elsewhere: Every Property', item: `${SITE}/elsewhere` },
  ]
    .map((e) => `    {"@type": "ListItem", "position": ${e.position}, "name": "${e.name}", "item": "${e.item}"}`)
    .join(',\n');
  src = src.replace(
    '{"@type": "ListItem", "position": 8, "name": "Hire Horror Composer", "item": "https://horror.zazieproductions.com/contact"}\n  ]',
    '{"@type": "ListItem", "position": 8, "name": "Hire Horror Composer", "item": "https://horror.zazieproductions.com/contact"},\n' +
      extra +
      '\n  ]'
  );
  console.log('  ++ BreadcrumbList -> 11 items');
}

/* -------------------------------- 5. MusicGroup node + album list in @graph */

if (src.includes('"@id": "https://horror.zazieproductions.com/#label"')) {
  console.log('  -- MusicGroup node: already present');
} else {
  const musicGroup = {
    '@type': 'MusicGroup',
    '@id': SITE + '/#label',
    name: 'Zazie Productions',
    alternateName: ['Zazie Productions LLC', 'Zazie Kanwar-Torge'],
    url: SITE + '/discography',
    description:
      'The record label and release alias of psychological horror composer Zazie Kanwar-Torge. Eighteen releases from 2019 to 2026: musique concrete, dark ambient, harsh noise wall, body horror and experimental composition.',
    genre: [
      'Psychological Horror',
      'Dark Ambient',
      'Musique Concrete',
      'Harsh Noise Wall',
      'Experimental',
      'Body Horror',
    ],
    foundingDate: '2019',
    founder: { '@id': SITE + '/#person' },
    sameAs: SAME_AS_PERSON.filter((u) => !u.startsWith(SITE + '/composer') && !u.includes('imdb.com/name')),
    album: ALBUMS,
  };
  const anchor = '    {\n      "@type": "Organization",\n      "@id": "https://horror.zazieproductions.com/#org",\n      "aggregateRating"';
  if (!src.includes(anchor)) {
    console.error('  !! @graph Organization anchor not found');
    process.exitCode = 1;
  } else {
    const node = JSON.stringify(musicGroup, null, 6)
      .split('\n')
      .map((l, i) => (i === 0 ? l : '      ' + l))
      .join('\n');
    src = src.replace(anchor, node + ',\n' + anchor);
    console.log(`  ++ MusicGroup #label with ${ALBUMS.length} MusicAlbum children`);
  }
}

/* ------------------------------- 6. CreativeWork -> IMDb title sameAs links */

const TITLE_SAMEAS = {
  EXPIRE: 'https://www.imdb.com/title/tt19369318/',
  'MIKE HAS A VISITOR': 'https://www.imdb.com/title/tt36954700/',
  CHOLERIC: 'https://www.imdb.com/title/tt38637541/',
  'Phantom Requiem': 'https://www.themoviedb.org/movie/1328893',
};
let linked = 0;
for (const [title, url] of Object.entries(TITLE_SAMEAS)) {
  // Literal and single-shot. Every CreativeWork entry in the WebPage @graph
  // reads `"name": "<title>", "genre": [...]` on one line, so anchoring on the
  // genre key means the trailing comma can never be swallowed.
  const needle = `"name": "${title}", "genre":`;
  if (src.includes(`"sameAs": "${url}"`)) {
    continue;
  }
  if (!src.includes(needle)) {
    console.error(`  !! CreativeWork anchor missed: ${needle}`);
    process.exitCode = 1;
    continue;
  }
  src = src.replace(needle, `"name": "${title}", "sameAs": "${url}", "genre":`);
  linked += 1;
}
console.log(`  ++ CreativeWork sameAs -> ${linked} title links`);

/* --------------------------------------------------------------- 7. commit */

if (src !== original) {
  fs.writeFileSync(HOME, src, 'utf8');
  console.log(`\nwrote index.html (${Buffer.byteLength(src)} bytes)`);
} else {
  console.log('\nindex.html unchanged');
}

/* Validate every JSON-LD block still parses. */
const blocks = [...src.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
let bad = 0;
for (const [i, b] of blocks.entries()) {
  try {
    JSON.parse(b[1]);
  } catch (e) {
    bad += 1;
    console.error(`  !! JSON-LD block ${i} is invalid: ${e.message}`);
    process.exitCode = 1;
  }
}
console.log(`JSON-LD: ${blocks.length} blocks, ${bad} invalid.`);
