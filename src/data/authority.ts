/**
 * Authority vocabulary for the site's JSON-LD knowledge graph.
 *
 * Every `genre` and `knowsAbout` value the archive publishes is anchored to a
 * canonical external identifier instead of floating text, so search engines and
 * answer engines can resolve the composer against the same entities the film
 * industry already uses:
 *
 *   @id      https://www.wikidata.org/entity/Q…   the canonical concept URI
 *   sameAs   the English Wikipedia article, plus an IMDb genre/keyword deep
 *            link wherever IMDb's own controlled vocabulary covers the term
 *
 * Why Wikidata owns `@id`: it is the shared identifier Google's Knowledge Graph,
 * IMDb-adjacent datasets, and academic film catalogues reconcile against. The
 * Wikipedia article is the readable statement of the same concept, and an IMDb
 * search deep link is the working-industry surface (directors and music
 * supervisors browse genres and keywords there, not taxonomy URIs).
 *
 * Verification: every QID below was read from the Wikipedia `pageprops`
 * API (article -> wikibase_item) and its English label re-read from the
 * Wikidata `wbgetentities` API on 2026-10-25. IMDb links use only genre slugs
 * and keyword slugs that IMDb's own search index returned for that term; terms
 * IMDb does not index (e.g. "art horror", "body horror" as a keyword) get no
 * IMDb link rather than an invented one.
 *
 * This is a vocabulary, not a usage report: a concept may sit here before a page
 * publishes it. What must never happen is the reverse - a page publishing a term
 * this file cannot resolve.
 *
 * Adding a concept: add the entry here, add the label(s) that should resolve to
 * it in LABEL_CONCEPTS, then run `node tools/authority.mjs --sync` to rewrite
 * the published pages and `node tools/authority.mjs --check` to prove the site
 * is clean. `npm run build` runs the check and fails on any unmapped label.
 *
 * Two families live here: the craft/genre vocabulary (CONCEPTS) and the topical
 * reference topics (REFERENCE_TOPICS) that are published after it with an
 * explicit not-an-affiliation disclaimer.
 *
 * The full record, including the A24/NEON positioning rationale and the
 * trade-offs, is AUTHORITY-GRAPH.md.
 */

import type { Json } from './types.js';

export const WIKIDATA_ENTITY = 'https://www.wikidata.org/entity/';
export const WIKIPEDIA_ARTICLE = 'https://en.wikipedia.org/wiki/';

/** IMDb's advanced-title-search genre filter (a real IMDb controlled vocabulary). */
const imdbGenre = (genre: string): string =>
  `https://www.imdb.com/search/title/?genres=${genre}&explore=genres`;

/**
 * IMDb's keyword index. Keywords, not genres, are where IMDb files the
 * subgenres that its 27-item genre list cannot express - folk horror,
 * psychological horror, supernatural horror, experimental film.
 */
const imdbKeyword = (keyword: string): string =>
  `https://www.imdb.com/search/title/?keywords=${keyword}&explore=keywords`;

export interface AuthorityConcept {
  /** Human label published in JSON-LD `name`. */
  readonly name: string;
  /** Wikidata item id, without the entity prefix. */
  readonly wikidata: string;
  /** English Wikipedia article slug (post-redirect canonical title). */
  readonly wikipedia: string;
  /** IMDb genre or keyword deep link, only where IMDb indexes the term. */
  readonly imdb?: string;
  /** Further authoritative statements of the same concept. */
  readonly seeAlso?: readonly string[];
}

const CONCEPT_DEFS = {
  /* ------------------------------------------------- horror subgenres */
  horrorFilm: {
    name: 'Horror Film',
    wikidata: 'Q200092',
    wikipedia: 'Horror_film',
    imdb: imdbGenre('horror'),
  },
  horrorFiction: {
    name: 'Horror Fiction',
    wikidata: 'Q16575965',
    wikipedia: 'Horror_fiction',
  },
  psychologicalHorror: {
    name: 'Psychological Horror',
    wikidata: 'Q604725',
    wikipedia: 'Psychological_horror',
    imdb: imdbKeyword('psychological-horror'),
  },
  folkHorror: {
    name: 'Folk Horror',
    wikidata: 'Q118141790',
    wikipedia: 'Folk_horror',
    imdb: imdbKeyword('folk-horror'),
  },
  bodyHorror: {
    name: 'Body Horror',
    wikidata: 'Q3641550',
    wikipedia: 'Body_horror',
  },
  lovecraftianHorror: {
    name: 'Cosmic Horror',
    wikidata: 'Q2448865',
    wikipedia: 'Lovecraftian_horror',
    seeAlso: [`${WIKIPEDIA_ARTICLE}Cosmicism`],
  },
  artHorror: {
    name: 'Art Horror',
    wikidata: 'Q97191621',
    wikipedia: 'Art_horror',
  },
  supernaturalHorrorFilm: {
    name: 'Supernatural Horror',
    wikidata: 'Q43911809',
    wikipedia: 'Supernatural_horror_film',
    imdb: imdbKeyword('supernatural-horror'),
  },
  supernaturalFiction: {
    name: 'Supernatural Fiction',
    wikidata: 'Q7644030',
    wikipedia: 'Supernatural_fiction',
  },
  psychologicalThriller: {
    name: 'Psychological Thriller',
    wikidata: 'Q590103',
    wikipedia: 'Psychological_thriller',
  },
  thrillerFilm: {
    name: 'Thriller Film',
    wikidata: 'Q2484376',
    wikipedia: 'Thriller_film',
    imdb: imdbGenre('thriller'),
  },

  /* ---------------------------------------------------- screen genres */
  mysteryFiction: {
    name: 'Mystery Fiction',
    wikidata: 'Q6585139',
    wikipedia: 'Mystery_fiction',
    imdb: imdbGenre('mystery'),
  },
  crimeFilm: {
    name: 'Crime Film',
    wikidata: 'Q959790',
    wikipedia: 'Crime_film',
    imdb: imdbGenre('crime'),
  },
  dramaFilm: {
    name: 'Drama Film',
    wikidata: 'Q130232',
    wikipedia: 'Drama_(film_and_television)',
    imdb: imdbGenre('drama'),
  },
  scienceFictionFilm: {
    name: 'Science Fiction Film',
    wikidata: 'Q471839',
    wikipedia: 'Science_fiction_film',
    imdb: imdbGenre('sci-fi'),
  },
  shortFilm: {
    name: 'Short Film',
    wikidata: 'Q24862',
    wikipedia: 'Short_film',
    imdb: imdbGenre('short'),
  },
  realityTelevision: {
    name: 'Reality Television',
    wikidata: 'Q182415',
    wikipedia: 'Reality_television',
    imdb: imdbGenre('reality-tv'),
  },
  paranormalFiction: {
    name: 'Paranormal Fiction',
    wikidata: 'Q7135551',
    wikipedia: 'Paranormal_fiction',
  },
  independentFilm: {
    name: 'Independent Film',
    wikidata: 'Q459290',
    wikipedia: 'Independent_film',
  },

  /* ------------------------------------------- experimental art house */
  artFilm: {
    name: 'Art Film',
    wikidata: 'Q1135802',
    wikipedia: 'Art_film',
  },
  experimentalFilm: {
    name: 'Experimental Film',
    wikidata: 'Q790192',
    wikipedia: 'Experimental_film',
    imdb: imdbKeyword('experimental-film'),
  },
  slowCinema: {
    name: 'Slow Cinema',
    wikidata: 'Q7542092',
    wikipedia: 'Slow_cinema',
  },
  surrealistCinema: {
    name: 'Surrealist Cinema',
    wikidata: 'Q1190502',
    wikipedia: 'Surrealist_cinema',
  },
  foundFootage: {
    name: 'Found Footage Film',
    wikidata: 'Q3272147',
    wikipedia: 'Found_footage_film',
  },

  /* --------------------------------------------------------- music */
  experimentalMusic: {
    name: 'Experimental Music',
    wikidata: 'Q1640319',
    wikipedia: 'Experimental_music',
  },
  musiqueConcrete: {
    name: 'Musique Concrète',
    wikidata: 'Q823560',
    wikipedia: 'Musique_concrète',
  },
  electroacousticMusic: {
    name: 'Electroacoustic Music',
    wikidata: 'Q1326777',
    wikipedia: 'Electroacoustic_music',
  },
  acousmaticMusic: {
    name: 'Acousmatic Music',
    wikidata: 'Q423918',
    wikipedia: 'Acousmatic_music',
  },
  darkAmbient: {
    name: 'Dark Ambient',
    wikidata: 'Q756956',
    wikipedia: 'Dark_ambient',
  },
  ambientMusic: {
    name: 'Ambient Music',
    wikidata: 'Q193207',
    wikipedia: 'Ambient_music',
  },
  droneMusic: {
    name: 'Drone Music',
    wikidata: 'Q650316',
    wikipedia: 'Drone_music',
  },
  electronicMusic: {
    name: 'Electronic Music',
    wikidata: 'Q9778',
    wikipedia: 'Electronic_music',
  },
  industrialMusic: {
    name: 'Industrial Music',
    wikidata: 'Q487965',
    wikipedia: 'Industrial_music',
  },
  intelligentDanceMusic: {
    name: 'Intelligent Dance Music',
    wikidata: 'Q660984',
    wikipedia: 'Intelligent_dance_music',
  },
  avantGardeMusic: {
    name: 'Avant-Garde Music',
    wikidata: 'Q2332751',
    wikipedia: 'Avant-garde_music',
  },
  outsiderMusic: {
    name: 'Outsider Music',
    wikidata: 'Q2416307',
    wikipedia: 'Outsider_music',
  },
  chamberMusic: {
    name: 'Chamber Music',
    wikidata: 'Q189201',
    wikipedia: 'Chamber_music',
  },
  folkMusic: {
    name: 'Folk Music',
    wikidata: 'Q43343',
    wikipedia: 'Folk_music',
  },
  noiseMusic: {
    name: 'Noise Music',
    wikidata: 'Q726239',
    wikipedia: 'Noise_music',
  },
  freeImprovisation: {
    name: 'Free Improvisation',
    wikidata: 'Q592060',
    wikipedia: 'Free_improvisation',
  },
  soundArt: {
    name: 'Sound Art',
    wikidata: 'Q1744327',
    wikipedia: 'Sound_art',
  },
  fieldRecording: {
    name: 'Field Recording',
    wikidata: 'Q360982',
    wikipedia: 'Field_recording',
  },
  cosmicism: {
    name: 'Cosmicism',
    wikidata: 'Q1159897',
    wikipedia: 'Cosmicism',
  },

  /* --------------------------------------- scoring craft and technology */
  filmScore: {
    name: 'Film Score',
    wikidata: 'Q492264',
    wikipedia: 'Film_score',
  },
  orchestration: {
    name: 'Orchestration',
    wikidata: 'Q3367000',
    wikipedia: 'Orchestration',
  },
  soundDesign: {
    name: 'Sound Design',
    wikidata: 'Q1937950',
    wikipedia: 'Sound_design',
  },
  soundEffect: {
    name: 'Sound Effect',
    wikidata: 'Q768807',
    wikipedia: 'Sound_effect',
  },
  foley: {
    name: 'Foley',
    wikidata: 'Q762316',
    wikipedia: 'Foley_(sound_design)',
  },
  surroundSound: {
    name: 'Surround Sound',
    wikidata: 'Q569874',
    wikipedia: 'Surround_sound',
  },
  leitmotif: {
    name: 'Leitmotif',
    wikidata: 'Q221117',
    wikipedia: 'Leitmotif',
  },
  videoGameMusic: {
    name: 'Video Game Music',
    wikidata: 'Q1062702',
    wikipedia: 'Video_game_music',
  },
  adaptiveMusic: {
    name: 'Adaptive Music',
    wikidata: 'Q5318994',
    wikipedia: 'Adaptive_music',
  },

  /* ------------------------------- instruments and extended technique */
  waterphone: {
    name: 'Waterphone',
    wikidata: 'Q1471374',
    wikipedia: 'Waterphone',
  },
  preparedPiano: {
    name: 'Prepared Piano',
    wikidata: 'Q754186',
    wikipedia: 'Prepared_piano',
  },
  modularSynthesizer: {
    name: 'Modular Synthesizer',
    wikidata: 'Q391640',
    wikipedia: 'Modular_synthesizer',
  },
  extendedTechnique: {
    name: 'Extended Technique',
    wikidata: 'Q946962',
    wikipedia: 'Extended_technique',
  },
} as const satisfies Record<string, AuthorityConcept>;

export type ConceptKey = keyof typeof CONCEPT_DEFS;

/**
 * Same registry, widened to the interface: literal keys survive, and optional
 * fields (`imdb`, `seeAlso`) are readable on every member.
 */
export const CONCEPTS: Record<ConceptKey, AuthorityConcept> = CONCEPT_DEFS;

/** Every host a published authority URL is allowed to live on. */
export const AUTHORITY_HOSTS = ['www.wikidata.org', 'en.wikipedia.org', 'www.imdb.com'] as const;

export function conceptUrl(key: ConceptKey): string {
  return `${WIKIDATA_ENTITY}${CONCEPTS[key].wikidata}`;
}

/**
 * The published shape of one linked term. `@id` is the Wikidata concept URI, so
 * the value stays machine-resolvable; `name` keeps the human label for
 * consumers that still treat `genre`/`knowsAbout` as text.
 */
export function conceptNode(key: ConceptKey): Json {
  const concept = CONCEPTS[key];
  const sameAs = [
    `${WIKIPEDIA_ARTICLE}${concept.wikipedia}`,
    ...(concept.imdb ? [concept.imdb] : []),
    ...(concept.seeAlso ?? []),
  ];
  return {
    '@type': 'DefinedTerm',
    '@id': conceptUrl(key),
    name: concept.name,
    sameAs,
  };
}

export function conceptNodes(keys: readonly ConceptKey[]): Json[] {
  return [...new Set(keys)].map(conceptNode);
}

/** Concept id -> key, for validating published JSON-LD (tools/authority.mjs). */
export function conceptKeyForUrl(value: string): ConceptKey | undefined {
  const keys = Object.keys(CONCEPTS) as ConceptKey[];
  return keys.find((key) => conceptUrl(key) === value);
}

/** A URL may only appear as an authority link if this registry published it. */
export function isRegisteredAuthorityUrl(value: string): boolean {
  return AUTHORITY_URLS.includes(value);
}

/* ------------------------------------------------ topical reference topics */

/**
 * Reference topics are *topical*, never identity: things this archive studies
 * or points at, published so a reader can follow them, never as `sameAs` (an
 * alias) or `about`/`affiliation`. They are deliberately excluded from the
 * craft vocabulary above: "knows about the A24 film aesthetic" is a different
 * kind of claim from "knows about folk horror", and mixing the two makes the
 * entity harder to read, not easier.
 *
 * Every node keeps the disclaimer sentence that says exactly that, and both
 * `url` and `sameAs` point at the Wikipedia article while `@id` is the Wikidata
 * item - the same three-way anchoring as the genre vocabulary.
 */
export interface ReferenceTopic {
  /** Published label. */
  readonly name: string;
  /** Wikidata item id, without the entity prefix. */
  readonly wikidata: string;
  /** English Wikipedia article slug. */
  readonly wikipedia: string;
  /** The "not an affiliation / not a credit" sentence, published verbatim. */
  readonly disclaimer: string;
}

const REFERENCE_TOPIC_DEFS = {
  a24Aesthetic: {
    name: 'A24 film aesthetic',
    wikidata: 'Q16248298',
    wikipedia: 'A24',
    disclaimer: 'A reference topic in prestige horror scoring; not an affiliation or production credit.',
  },
  micaLeviTechnique: {
    name: 'Mica Levi scoring techniques',
    wikidata: 'Q926078',
    wikipedia: 'Mica_Levi',
    disclaimer: 'A reference topic in experimental film scoring; not a collaboration or credit.',
  },
  folkHorrorTropes: {
    name: 'Folk Horror tropes',
    wikidata: 'Q118141790',
    wikipedia: 'Folk_horror',
    disclaimer: 'Genre conventions used as reference topics for horror scoring.',
  },
} as const satisfies Record<string, ReferenceTopic>;

export type ReferenceTopicKey = keyof typeof REFERENCE_TOPIC_DEFS;

export const REFERENCE_TOPICS: Record<ReferenceTopicKey, ReferenceTopic> = REFERENCE_TOPIC_DEFS;

export const REFERENCE_TOPIC_KEYS = Object.keys(REFERENCE_TOPICS) as ReferenceTopicKey[];

export function referenceTopicNode(key: ReferenceTopicKey): Json {
  const topic = REFERENCE_TOPICS[key];
  const article = `${WIKIPEDIA_ARTICLE}${topic.wikipedia}`;
  return {
    '@type': 'DefinedTerm',
    '@id': `${WIKIDATA_ENTITY}${topic.wikidata}`,
    name: topic.name,
    description: topic.disclaimer,
    url: article,
    sameAs: [article],
  };
}

/** In registry order: the order they are published in `knowsAbout` and `mentions`. */
export function referenceTopicNodes(): Json[] {
  return REFERENCE_TOPIC_KEYS.map(referenceTopicNode);
}

/** Name -> key, for validating a published node against its registry entry. */
export function referenceTopicKeyForName(value: string): ReferenceTopicKey | undefined {
  return REFERENCE_TOPIC_KEYS.find((key) => REFERENCE_TOPICS[key].name === value);
}

/** Every URL this registry publishes: Wikidata ids, Wikipedia articles, IMDb links. */
export const AUTHORITY_URLS: readonly string[] = [
  ...(Object.keys(CONCEPTS) as ConceptKey[]).flatMap((key) => {
    const node = conceptNode(key) as { sameAs: string[] };
    return [conceptUrl(key), ...node.sameAs];
  }),
  ...REFERENCE_TOPIC_KEYS.flatMap((key) => {
    const node = referenceTopicNode(key) as { '@id': string; sameAs: string[] };
    return [node['@id'], ...node.sameAs];
  }),
];

const normalize = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Labels used by the content modules and the hand-authored hub pages, mapped to
 * the concepts they actually mean. A label with no entry is a build failure,
 * never an unlinked string: the whole point is that nothing ships as loose text.
 */
export const LABEL_CONCEPTS: Record<string, readonly ConceptKey[]> = {
  /* production genres (src/data/productions.ts) */
  horror: ['horrorFilm'],
  thriller: ['thrillerFilm'],
  'science fiction': ['scienceFictionFilm'],
  drama: ['dramaFilm'],
  crime: ['crimeFilm'],
  mystery: ['mysteryFiction'],
  'short film': ['shortFilm'],
  'experimental film': ['experimentalFilm'],
  'reality television': ['realityTelevision'],
  paranormal: ['paranormalFiction'],

  /* showreel cue categories (src/data/cues.ts) */
  'psychological orchestral': ['psychologicalHorror', 'filmScore'],
  'horror stinger': ['horrorFilm', 'filmScore'],
  'dark ambient': ['darkAmbient'],
  'ambient horror': ['darkAmbient', 'ambientMusic'],
  'cosmic horror': ['lovecraftianHorror'],
  'body horror': ['bodyHorror'],

  /* release genres (src/data/releases.ts) */
  experimental: ['experimentalMusic'],
  idm: ['intelligentDanceMusic'],
  acousmatic: ['acousmaticMusic'],
  'chamber music': ['chamberMusic'],
  'film score': ['filmScore'],
  'avant-garde': ['avantGardeMusic'],
  'outsider music': ['outsiderMusic'],
  industrial: ['industrialMusic'],
  electronic: ['electronicMusic'],
  'sound effects': ['soundEffect'],

  /* portfolio-level genre line (src/lib/home.ts) */
  'psychological horror': ['psychologicalHorror'],
  'folk horror': ['folkHorror'],
  'supernatural thriller': ['supernaturalHorrorFilm', 'psychologicalThriller'],

  /* composer knowsAbout phrases (src/data/entities.ts, composer.html) */
  'psychological horror film scoring': ['psychologicalHorror'],
  'psychological horror scoring': ['psychologicalHorror'],
  'folk horror original music': ['folkHorror', 'folkMusic'],
  'folk horror music': ['folkHorror', 'folkMusic'],
  'body horror sound worlds': ['bodyHorror'],
  'body horror soundtracks': ['bodyHorror'],
  'supernatural thriller scoring': ['supernaturalHorrorFilm'],
  'cosmic horror composition': ['lovecraftianHorror'],
  'dark ambient soundscapes': ['darkAmbient'],
  'dark atmospheric film scores': ['filmScore', 'darkAmbient'],
  'horror film composition': ['horrorFilm', 'filmScore'],
  'experimental cinema composition': ['experimentalFilm', 'experimentalMusic'],
  'art house and elevated horror scoring': ['artHorror', 'artFilm'],
  'acousmatic and musique concrète scoring': ['acousmaticMusic', 'musiqueConcrete'],
  'electroacoustic and musique concrète scoring': ['electroacousticMusic', 'musiqueConcrete'],
  'electroacoustic and acousmatic composition': ['electroacousticMusic', 'acousmaticMusic'],
  'improvised and free improvisation performance': ['freeImprovisation'],
  'adaptive horror video game music': ['adaptiveMusic', 'videoGameMusic'],
  'game audio composition': ['videoGameMusic'],
  'bespoke film scoring to picture': ['filmScore'],
  'film music spotting and cue sheets': ['filmScore'],
  'independent film scoring': ['independentFilm', 'filmScore'],
  'hybrid orchestral horror': ['filmScore', 'orchestration'],
  'hybrid orchestral synthesis': ['orchestration'],
  'dread sound design': ['soundDesign'],
  'waterphone horror': ['waterphone'],
  'waterphone and bowed metal instrumentation': ['waterphone', 'extendedTechnique'],
  'bowed metal textures': ['extendedTechnique'],
  'multichannel horror audio': ['surroundSound'],
  'multichannel spatial audio composition': ['surroundSound'],
  'modular synthesizer sound design': ['modularSynthesizer', 'soundDesign'],
  'modular synthesis and sound design': ['modularSynthesizer', 'soundDesign'],
  'field recording and musique concrète': ['fieldRecording', 'musiqueConcrete'],
  'prepared piano and struck strings': ['preparedPiano', 'extendedTechnique'],
  'leitmotif and thematic development': ['leitmotif'],
  'thriller chase music': ['thrillerFilm', 'filmScore'],

  /* hand-authored hubs (reel.html) */
  'psychological horror scoring for film': ['psychologicalHorror', 'filmScore'],
};

/**
 * Concept names double as labels, so an authored entry can be written as
 * "Folk Horror" or "Art Horror" and still resolve to the same identifier.
 */
const CONCEPT_NAME_INDEX: Record<string, ConceptKey> = Object.fromEntries(
  (Object.keys(CONCEPTS) as ConceptKey[]).map((key) => [normalize(CONCEPTS[key].name), key]),
);

export function conceptsForLabel(label: string): readonly ConceptKey[] {
  const normalized = normalize(label);
  const mapped = LABEL_CONCEPTS[normalized];
  if (mapped) return mapped;
  const byName = CONCEPT_NAME_INDEX[normalized];
  if (byName) return [byName];
  throw new Error(
    `authority: no knowledge-graph mapping for "${label}". Add it to LABEL_CONCEPTS in src/data/authority.ts ` +
      '(Wikipedia article + Wikidata item + optional IMDb genre/keyword link).',
  );
}

/** `genre` values for one label or a list of labels, deduplicated and ordered. */
export function genreTerms(labels: string | readonly string[]): Json[] {
  const list = typeof labels === 'string' ? [labels] : labels;
  const keys: ConceptKey[] = [];
  for (const label of list) keys.push(...conceptsForLabel(label));
  return conceptNodes(keys);
}

/**
 * The composer's knowsAbout vocabulary. Ordered deliberately: prestige horror
 * subgenres first, then the experimental art-house lane, then scoring craft,
 * then instrumentation - the reading order a director or music supervisor
 * scanning the entity would follow.
 */
export const KNOWS_ABOUT: readonly ConceptKey[] = [
  'psychologicalHorror',
  'folkHorror',
  'bodyHorror',
  'lovecraftianHorror',
  'supernaturalHorrorFilm',
  'artHorror',
  'artFilm',
  'experimentalFilm',
  'slowCinema',
  'surrealistCinema',
  'foundFootage',
  'experimentalMusic',
  'musiqueConcrete',
  'electroacousticMusic',
  'acousmaticMusic',
  'darkAmbient',
  'filmScore',
  'orchestration',
  'soundDesign',
  'surroundSound',
  'waterphone',
  'preparedPiano',
  'modularSynthesizer',
  'videoGameMusic',
  'adaptiveMusic',
  'independentFilm',
  'folkMusic',
];

/** Fresh copies, so a caller can never mutate the shared graph. */
export function knowsAboutNodes(): Json[] {
  return conceptNodes(KNOWS_ABOUT);
}

/**
 * What a `Person` actually publishes: the craft vocabulary in canonical order,
 * then the topical reference topics (each carrying its own disclaimer). The
 * split is enforced by tools/authority.mjs, so no page can interleave them.
 */
export function publishedKnowsAbout(): Json[] {
  return [...knowsAboutNodes(), ...referenceTopicNodes()];
}
