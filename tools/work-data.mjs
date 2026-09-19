/**
 * work-data.mjs — single source of truth for the filmography graph.
 *
 * Every field here must be a fact that is already published on this site
 * (index.html, work/index.html, composer/index.html) or on the linked
 * third-party page (IMDb title, YouTube upload). Nothing is invented.
 *
 * RULE OF THE FILE: if a fact is not known, leave it `null` and the
 * generator omits it. An absent field is honest; a guessed field is not.
 * Fields that are still `null` and would improve the page are listed in
 * CREDIT_GAPS at the bottom — those are questions for the composer, not
 * for the build script.
 */

export const SITE = 'https://horror.zazieproductions.com';
export const PERSON_ID = `${SITE}/#person`;
export const ORG_ID = `${SITE}/#org`;
export const IMDB_NAME = 'https://www.imdb.com/name/nm17333332';

/**
 * Content last-modified date for the filmography pages.
 *
 * Deliberately a constant, NOT `new Date()`. A build-time date makes the
 * generator non-deterministic (the drift gate in build-work-pages.mjs
 * --check fires every day with no content change, which trains whoever
 * runs it to ignore it) and emits a dateModified that is demonstrably
 * fake — Google ignores those. Bump this when a work record actually
 * changes.
 */
export const LAST_MODIFIED = '2026-09-18';

/** External canonical profiles. sameAs must point OFF-SITE only. */
export const SAME_AS = [
  IMDB_NAME,
  'https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0',
  'https://zazieproductions.bandcamp.com',
  'https://music.apple.com/us/artist/zazie-productions/1623719351',
  'https://youtube.com/@zazieproductions',
  'https://www.linkedin.com/in/zazie-kanwar-torge-3b8a98373',
];

/**
 * Role vocabulary. Kept deliberately narrow and accurate: the site's own
 * production grid uses "Original Score" (7), "Sound Design" (1) and
 * "Cue / Chase Sequence" (1). We reuse exactly those, because inflating a
 * sound-design credit into a score credit is the fastest way to lose the
 * entity.
 */
export const ROLE = {
  SCORE: 'Original score',
  SERIES: 'Series score',
  SOUND_DESIGN: 'Sound design',
};

export const WORKS = [
  {
    slug: 'expire',
    title: 'EXPIRE',
    year: 2025,
    format: 'Short film',
    role: ROLE.SOUND_DESIGN,
    director: 'Muhammad Abed Baryal',
    studio: null,
    genre: ['Psychological horror', 'Body horror'],
    tagline: null,
    poster: 'expire-red-check',
    posterRatio: [640, 1138],
    imdb: 'https://www.imdb.com/title/tt19369318/',
    video: null,
    summary:
      'A 2025 horror short directed by Muhammad Abed Baryal. Zazie Kanwar-Torge is credited as sound designer, building the film\u2019s body-horror textures and dread beds rather than a conventional underscore \u2014 the low end carries the picture where a melodic cue would explain too much.',
  },
  {
    slug: 'unseen',
    title: 'UNSEEN',
    year: null,
    format: 'Feature film',
    role: ROLE.SCORE,
    director: 'Steve Merlo',
    studio: null,
    genre: ['Psychological horror', 'Thriller'],
    tagline: null,
    poster: 'unseen',
    posterRatio: [640, 942],
    imdb: null,
    video: null,
    summary:
      'A feature psychological thriller directed by Steve Merlo, built around an unseen killer. The score supplies the architecture the camera withholds: sustained tension cues and a small set of recurring themes that let the threat stay off-frame without the audience losing the thread.',
  },
  {
    slug: 'peregrinus',
    title: 'PEREGRINUS',
    year: null,
    format: 'Series',
    role: ROLE.SERIES,
    director: null,
    studio: null,
    genre: ['Folk horror', 'Supernatural'],
    tagline: 'A pilgrimage of foreign forces.',
    poster: 'peregrinus',
    posterRatio: [640, 863],
    imdb: null,
    video: null,
    summary:
      'A folk-horror series \u2014 a pilgrimage of foreign forces. Series scoring rather than one-off cue writing: ritualistic motifs recur across episodes so the material can be recognised at length, carried on dark atmospheric colour instead of theme-and-variation.',
  },
  {
    slug: 'phantom-requiem',
    title: 'Phantom Requiem',
    year: null,
    format: 'Short film',
    role: ROLE.SCORE,
    director: null,
    studio: 'Zazie Productions',
    genre: ['Gothic horror', 'Psychological horror'],
    tagline: null,
    poster: 'phantom-requiem',
    posterRatio: [600, 800],
    imdb: null,
    video: { id: 'UX2kv3G89Jw', uploadDate: null, still: 'project-UX2kv3G89Jw.jpg' },
    summary:
      'A gothic horror short from Zazie Productions. The score leans on chamber strings and spectral resonance \u2014 a requiem logic, where the material is written to be heard as something already grieving rather than something about to scare you.',
  },
  {
    slug: 'eclipsed',
    title: 'ECLIPSED',
    year: null,
    format: 'Feature film',
    role: ROLE.SCORE,
    director: 'William Viera',
    studio: 'VIERA Productions',
    genre: ['Psychological horror', 'Dark science fiction'],
    tagline: 'To erase him, she had to become him.',
    poster: 'eclipsed',
    posterRatio: [640, 840],
    imdb: null,
    video: { drive: '1zKtAavEx-Yjd2To_troEY2OU', still: 'project-eclipsed-drive.jpg' },
    summary:
      'A psychological horror feature by William Viera (VIERA Productions): to erase him, she had to become him. Hybrid orchestration and tension cues sit under a dark science-fiction surface, so the dread reads as interior rather than as a monster in the room.',
  },
  {
    slug: 'the-haunted',
    title: 'THE HAUNTED',
    year: null,
    format: 'Teaser',
    role: ROLE.SCORE,
    director: 'Mike Fox',
    studio: 'Crystal Fox Films',
    genre: ['Supernatural horror', 'Haunted house'],
    tagline: 'Perception is reality.',
    poster: 'the-haunted',
    posterRatio: [640, 948],
    imdb: null,
    video: { id: 'Ty8tPp59mDc', uploadDate: '2024-11-20', still: 'project-Ty8tPp59mDc.jpg' },
    summary:
      'A supernatural horror teaser from Mike Fox at Crystal Fox Films \u2014 perception is reality. The score treats the haunting as a question of attention: atmospheric beds and haunted-house dread that never confirm the apparition for you.',
  },
  {
    slug: 'choleric',
    title: 'CHOLERIC',
    year: null,
    format: 'Short film',
    role: ROLE.SCORE,
    director: 'Sebastian Fabres',
    studio: 'Haunted Dreams Pictures / NYFA',
    genre: ['Psychological horror', 'Body horror'],
    tagline: 'Her sins brought me home.',
    poster: 'choleric',
    posterRatio: [640, 961],
    imdb: 'https://www.imdb.com/title/tt38637541/',
    video: null,
    summary:
      'A psychological body-horror short by Sebastian Fabres (Haunted Dreams Pictures, NYFA): her sins brought me home. The writing sits between body horror and psychological dread, so texture does the work that a jump would otherwise do.',
  },
  {
    slug: 'mike-has-a-visitor',
    title: 'MIKE HAS A VISITOR',
    year: null,
    format: 'Short film',
    role: ROLE.SCORE,
    director: 'Marco Saikaley',
    studio: null,
    genre: ['Sleep paralysis horror', 'Psychological horror'],
    tagline: null,
    poster: 'mike-has-a-visitor',
    posterRatio: [640, 838],
    imdb: 'https://www.imdb.com/title/tt36954700/',
    video: { id: 'HaVJP08j77U', uploadDate: '2025-01-15', still: 'project-HaVJP08j77U.jpg' },
    summary:
      'A sleep-paralysis horror short by Marco Saikaley. Scored for dissociative tension: the paralysis is the premise, so the music holds a body that cannot move \u2014 sustained, unhurried, and refusing the release a conventional scare cue would give it.',
  },
  {
    slug: 'the-dark-awaits',
    title: 'THE DARK AWAITS',
    year: null,
    format: 'Feature film',
    role: ROLE.SCORE,
    director: 'Matthew Kondracki',
    studio: null,
    genre: ['Supernatural horror', 'Psychological horror'],
    tagline: null,
    poster: 'the-dark-awaits',
    posterRatio: [640, 954],
    imdb: null,
    video: null,
    summary:
      'A supernatural horror feature by Matthew Kondracki. Original dark atmospheric score: psychological dread and supernatural suggestion held in the same register, so the audience cannot tell which of the two it is hearing.',
  },
];

/**
 * Scored works that have a public film sample but no published director,
 * year or credit on this site. They get NO filmography page: a page whose
 * only content is a video embed and a guessed credit is thinner than
 * nothing, and inventing a director is exactly the failure the brief
 * forbids. Hand these four to the composer for credit data.
 */
export const CREDIT_GAPS = [
  { title: 'AQUAPHOBIA', video: 'rvCGO0BJ_2E', uploadDate: '2024-09-10', still: 'project-rvCGO0BJ_2E.jpg', note: 'Short horror film score, folk and body horror' },
  { title: 'GOODBYE, BROTHER', video: 'ItrrcilS0ro', uploadDate: null, still: 'project-ItrrcilS0ro.jpg', note: 'Dramatic short, dark atmospheric colour' },
  { title: 'Home Intruder', video: 'riCvy2abhlc', uploadDate: null, still: 'project-riCvy2abhlc.jpg', note: 'Cue / chase sequence' },
  { title: 'Whispers In The Dark', video: '6qa3Uwj47fc', uploadDate: null, still: 'project-6qa3Uwj47fc.jpg', note: 'Original score' },
];

export const workUrl = (slug) => `${SITE}/work/${slug}`;
