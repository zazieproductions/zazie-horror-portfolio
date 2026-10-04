/**
 * The nine selected productions.
 *
 * Single source of truth for /work and for every /work/<slug> entry. The hub
 * page, the item pages, their JSON-LD and their sitemap entries are all
 * generated from this array — edit here, run `npm run build`, and the routes,
 * the hub links, the schema and the sitemap move together.
 *
 * Production facts (year or format, director, company, genre, poster, IMDb /
 * YouTube / Drive identifier) are the ones already published across the site;
 * the entry copy is written for this route shape and deliberately does not
 * repeat the hub page's card sentences.
 */

import type { Production } from './types.js';

export const productions: Production[] = [
  {
    slug: 'expire',
    director: 'Muhammad Abed Baryal',
    sameAs: ['https://www.imdb.com/title/tt19369318/'],
    title: 'EXPIRE',
    yearLabel: '2025',
    format: 'Short',
    genres: ['Psychological Horror', 'Body Horror'],
    role: 'Sound design · original score',
    tagline: 'A Muhammad Abed Baryal film',
    collaborators: ['Muhammad Abed Baryal — director'],
    summary:
      'Psychological body horror short: modular tension cues, visceral textures and a dread bed written to picture.',
    metaDescription:
      'EXPIRE (2025), a Muhammad Abed Baryal horror short: sound design and an original body horror score by Zazie Kanwar-Torge — modular tension cues, dread beds, IMDb credit.',
    paragraphs: [
      'EXPIRE is a 2025 psychological body horror short directed by Muhammad Abed Baryal, scored and sound-designed by Zazie Kanwar-Torge. The brief sat where the two jobs overlap: the film does not separate its score from its sound, so the piece had to be built as one body of material — pressure, breath, failing machinery and pitched tone treated as a single palette.',
      'The score works in short modular cells rather than long themes. Cells repeat, degrade and re-enter at altered pitch, so the score sounds like the same signal being damaged rather than a new cue starting. Dread is carried by sub-bass movement under the picture, with the top end left almost empty until the release.',
      'Body horror textures were performed and recorded rather than sampled: bowed metal, close-miked fabric and bone-dry impacts, then pitched down until the source is no longer identifiable. Nothing in the score is library music; every element was written or performed for this cut.',
    ],
    scoreNotes:
      'Modular tension cells, bowed metal and close-miked foley, sub-bass dread beds, pitch-degraded performance material. Score and sound design delivered as one mixed stem set.',
    poster: {
      src: '/images/posters/expire-red-check-640.jpg',
      avif: '/images/posters/expire-red-check-640.avif',
      large: '/images/posters/expire-red-check-1200.jpg',
      alt: 'EXPIRE (2025) theatrical poster - psychological horror short scored by Zazie Kanwar-Torge',
      width: 640,
      height: 1138,
    },
    links: [
      { label: 'EXPIRE on IMDb', href: 'https://www.imdb.com/title/tt19369318/', kind: 'profile' },
    ],
    relatedCues: [
      'the-fatal-overdose',
      'bone-colored-air',
      'screams-of-the-damned',
      'needle-in-the-nerve',
      'waterphone-shower-scene',
    ],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'unseen',
    director: 'Steve Merlo',
    title: 'UNSEEN',
    yearLabel: 'Feature',
    format: 'Feature',
    genres: ['Psychological Horror', 'Thriller'],
    role: 'Original score',
    tagline: "Steve Merlo's unseen killer",
    collaborators: ['Steve Merlo — director'],
    summary:
      'Feature psychological thriller score: an unseen antagonist carried by architecture, not stingers.',
    metaDescription:
      'UNSEEN, a Steve Merlo feature psychological thriller: original score by horror composer Zazie Kanwar-Torge — tension architecture, recurring themes and a killer kept off screen.',
    paragraphs: [
      'UNSEEN is a feature-length psychological thriller from director Steve Merlo, scored end to end by Zazie Kanwar-Torge. The antagonist is never fully shown, which put the whole weight of presence on the score: something has to be in the room before the audience can name it.',
      'The score is built on a small set of recurring themes that are re-harmonised rather than replaced. As the film escalates, the same melodic material is squeezed into narrower intervals and slower harmonic motion, so the picture tightens without the music ever announcing a new idea.',
      'Long features need room to breathe, so the design alternates between heavily scored passages and near-silence with a single sustained element. That contrast is the tension architecture: the film is loudest where the music lets go.',
    ],
    scoreNotes:
      'Full feature score: recurring thematic material, hybrid orchestral and synth texture, sustained tension beds, deliberate unscored space. Written to picture across the theatrical cut.',
    poster: {
      src: '/images/posters/unseen-640.jpg',
      avif: '/images/posters/unseen-640.avif',
      large: '/images/posters/unseen-1200.jpg',
      alt: 'UNSEEN feature film poster - psychological thriller score by Zazie Kanwar-Torge',
      width: 640,
      height: 942,
    },
    links: [
      {
        label: 'Zazie Kanwar-Torge on IMDb',
        href: 'https://www.imdb.com/name/nm17333332',
        kind: 'profile',
      },
    ],
    relatedCues: [
      'needle-in-the-nerve',
      'the-silence-began-crawling',
      'panic-threshold',
      'the-room-forgets-you',
      'narrow-pulse',
    ],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'peregrinus',
    title: 'PEREGRINUS',
    yearLabel: 'Series',
    format: 'Series',
    genres: ['Folk Horror', 'Supernatural'],
    role: 'Original score',
    tagline: 'A pilgrimage of foreign forces',
    collaborators: ['Series production — folk horror'],
    summary:
      'Folk horror series score: ritual motifs, drone chant and supernatural tension built for episodic form.',
    metaDescription:
      'PEREGRINUS, a folk horror series: original score by Zazie Kanwar-Torge — ritual motifs, drone and chant textures, supernatural tension written for episodic television.',
    paragraphs: [
      'PEREGRINUS is a folk horror series scored by Zazie Kanwar-Torge around a single idea: a pilgrimage that brings foreign forces into a place that already has its own music. The score treats the landscape as an instrument and the arrivals as an intrusion into it.',
      'Ritual material is built from repeated, almost liturgical figures — a rising third, a bell struck at an irregular interval, voices used as texture rather than text. Those figures recur across episodes at different weights, which gives the series a musical memory the audience can feel before they can hum it.',
      'Episodic scoring needs a theme per thread and a language that holds them together. The series palette is deliberately narrow: drone, chant, hand percussion, bowed strings and one degraded tape layer that returns whenever the story looks backwards.',
    ],
    scoreNotes:
      'Series score with recurring ritual motifs, drone and chant textures, hand percussion, bowed strings and a degraded tape layer. Written to picture per episode with a shared thematic language.',
    poster: {
      src: '/images/posters/peregrinus-640.jpg',
      avif: '/images/posters/peregrinus-640.avif',
      large: '/images/posters/peregrinus-1200.jpg',
      alt: 'PEREGRINUS series poster - folk horror and supernatural thriller score by Zazie Kanwar-Torge',
      width: 640,
      height: 863,
    },
    links: [
      {
        label: 'Zazie Kanwar-Torge on IMDb',
        href: 'https://www.imdb.com/name/nm17333332',
        kind: 'profile',
      },
    ],
    relatedCues: [
      'ominous-drone',
      'obsidian-hall',
      'fractured-requiem',
      'rlyehs-xenolith',
      'the-silence-began-crawling',
    ],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'phantom-requiem',
    company: 'Zazie Productions',
    sameAs: ['https://www.youtube.com/watch?v=UX2kv3G89Jw'],
    title: 'Phantom Requiem',
    yearLabel: 'Short',
    format: 'Short',
    genres: ['Gothic Horror'],
    role: 'Original score',
    tagline: 'A film by Zazie Productions',
    collaborators: ['Zazie Productions — production and score'],
    summary:
      'Gothic horror short with a chamber score: bowed strings, spectral harmony and a requiem that never settles.',
    metaDescription:
      'Phantom Requiem, a gothic horror short by Zazie Productions: chamber horror score by Zazie Kanwar-Torge — bowed strings, spectral harmony, watch the film sample.',
    paragraphs: [
      'Phantom Requiem is a gothic horror short made by Zazie Productions, with score and sound by Zazie Kanwar-Torge. It is a chamber piece in both senses: the picture stays close to a handful of rooms, and the music stays close to a handful of players.',
      'The score sets a requiem that never resolves. A plainchant-shaped line is passed between bowed strings, glass and voice, always arriving at the cadence late or a semitone off, so the music feels like it is remembering a funeral rather than performing one.',
      'Because the film is short, the score works as one continuous movement with internal divisions rather than separate cues. The sample below is the film itself, and it is the clearest demonstration of the studio\'s gothic register.',
    ],
    scoreNotes:
      'Chamber score for bowed strings, glass, prepared piano and voice; continuous single-movement structure with unmet cadences. Mixed alongside the film\'s sound design.',
    poster: {
      src: '/images/posters/phantom-requiem-640.jpg',
      avif: '/images/posters/phantom-requiem-640.avif',
      large: '/images/posters/phantom-requiem-1200.jpg',
      alt: 'Phantom Requiem short film poster - gothic horror score by Zazie Kanwar-Torge',
      width: 640,
      height: 853,
    },
    sample: {
      provider: 'youtube',
      id: 'UX2kv3G89Jw',
      title: 'Phantom Requiem — gothic horror short, original score',
      description:
        'The complete gothic horror short with its original chamber score by Zazie Kanwar-Torge: bowed strings, spectral harmony and a requiem that never resolves.',
    },
    links: [
      {
        label: 'Watch Phantom Requiem',
        href: 'https://www.youtube.com/watch?v=UX2kv3G89Jw',
        kind: 'watch',
      },
    ],
    relatedCues: [
      'opaline-lament-life-from-the-beyond',
      'fractured-requiem',
      'ominous-drone',
      'the-beautiful-wrongness',
    ],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'eclipsed',
    director: 'William Viera',
    company: 'VIERA Productions',
    title: 'ECLIPSED',
    yearLabel: 'Feature',
    format: 'Feature',
    genres: ['Psychological Horror', 'Dark Sci-Fi'],
    role: 'Original score',
    tagline: 'To erase him, she had to become him.',
    collaborators: ['William Viera — director', 'VIERA Productions'],
    summary:
      'Psychological horror feature: a hybrid orchestral score for identity loss, doubling and dark sci-fi dread.',
    metaDescription:
      'ECLIPSED, a William Viera psychological horror feature for VIERA Productions: original score by Zazie Kanwar-Torge — hybrid orchestral motifs, identity and dark sci-fi dread.',
    paragraphs: [
      'ECLIPSED is a feature psychological horror film directed by William Viera for VIERA Productions, scored by Zazie Kanwar-Torge. Its premise — to erase him, she had to become him — gave the score a single structural problem: how to sound like two people sharing one musical body.',
      'The solution is a doubled theme. Two versions of the same line, one orchestral and one synthesised, run a fraction apart in time and drift together as the film proceeds, until the listener can no longer tell which is leading. Harmony narrows as the identities merge.',
      'Dark sci-fi material — low analogue sequencing, treated piano, cold reverberant space — sits under the psychological writing rather than beside it, so the genre shift reads as the same score seen from a different angle.',
    ],
    scoreNotes:
      'Hybrid orchestral feature score: doubled thematic material, treated piano, analogue sequencing, widening reverb spaces. Scored to picture across the feature with stems delivered for the mix.',
    poster: {
      src: '/images/posters/eclipsed-640.jpg',
      avif: '/images/posters/eclipsed-640.avif',
      large: '/images/posters/eclipsed-1200.jpg',
      alt: 'ECLIPSED feature poster - psychological horror and dark sci-fi score by Zazie Kanwar-Torge',
      width: 640,
      height: 840,
    },
    still: {
      src: '/images/eclipsed-cover-1280.jpg',
      alt: 'ECLIPSED cover frame - psychological horror feature scored by Zazie Kanwar-Torge',
      width: 1280,
      height: 720,
    },
    sample: {
      provider: 'drive',
      id: '1zKtAavEx-Yjd2To_troEYlxTTt62Y2OU',
      title: 'ECLIPSED — feature score sample',
      description:
        'A sample of the ECLIPSED feature score by Zazie Kanwar-Torge: doubled thematic material, treated piano and analogue sequencing for a film about identity loss.',
    },
    links: [
      {
        label: 'Zazie Kanwar-Torge on IMDb',
        href: 'https://www.imdb.com/name/nm17333332',
        kind: 'profile',
      },
    ],
    relatedCues: [
      'opaline-lament-life-from-the-beyond',
      'deep-dystopian-synth-cue',
      'obsidian-hall',
      'dark-thriller-cinematic-cue',
      'time-shifting-into-daylight',
    ],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'the-haunted',
    director: 'Mike Fox',
    company: 'Crystal Fox Films',
    sameAs: ['https://www.youtube.com/watch?v=Ty8tPp59mDc'],
    title: 'THE HAUNTED',
    yearLabel: 'Feature',
    format: 'Feature',
    genres: ['Supernatural Horror'],
    role: 'Original score',
    tagline: 'Perception is reality.',
    collaborators: ['Mike Fox — director', 'Crystal Fox Films'],
    summary:
      'Supernatural horror feature and teaser: haunted-house dread, sub-bass weight and atmospheric beds.',
    metaDescription:
      'THE HAUNTED, a Mike Fox supernatural horror film for Crystal Fox Films: original score by Zazie Kanwar-Torge — haunted house dread, sub-bass weight, watch the teaser.',
    paragraphs: [
      'THE HAUNTED is a supernatural horror feature from director Mike Fox and Crystal Fox Films, with an original score by Zazie Kanwar-Torge. Its line — perception is reality — hands the score its job: the haunting has to be audible before it is visible.',
      'The writing leans on sub-bass weight and room tone rather than conventional scares. Dread accumulates through layers that arrive below the threshold of attention and leave a residue, so the same house sounds different on each return without the music ever restating a theme.',
      'The teaser sample below contains the score in its most compressed form: one rising bed, one struck-metal event and a sub figure that stays in the room after the picture has gone.',
    ],
    scoreNotes:
      'Feature score for supernatural horror: sub-bass dread beds, room-tone layering, struck-metal events, sparse harmonic material. Teaser mixed from the feature palette.',
    poster: {
      src: '/images/posters/the-haunted-640.jpg',
      avif: '/images/posters/the-haunted-640.avif',
      large: '/images/posters/the-haunted-1200.jpg',
      alt: 'THE HAUNTED teaser poster - supernatural horror score by Zazie Kanwar-Torge',
      width: 640,
      height: 948,
    },
    sample: {
      provider: 'youtube',
      id: 'Ty8tPp59mDc',
      title: 'THE HAUNTED — supernatural horror teaser with original score',
      description:
        'The THE HAUNTED teaser with its original score by Zazie Kanwar-Torge: sub-bass dread beds, room-tone layering and struck-metal events for a haunted house feature.',
    },
    links: [
      {
        label: 'Watch THE HAUNTED teaser',
        href: 'https://www.youtube.com/watch?v=Ty8tPp59mDc',
        kind: 'watch',
      },
    ],
    relatedCues: [
      'dark-ambient-soundscape-no-1',
      'ominous-drone',
      'subdued-drone-sensory-deprivation',
      'the-room-forgets-you',
      'dark-ambient-soundscape-no-2',
    ],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'choleric',
    director: 'Sebastian Fabres',
    company: 'Haunted Dreams Pictures',
    sameAs: ['https://www.imdb.com/title/tt38637541/'],
    title: 'CHOLERIC',
    yearLabel: 'Short',
    format: 'Short',
    genres: ['Body Horror', 'Psychological Horror'],
    role: 'Original score',
    tagline: 'her sins brought me home.',
    collaborators: [
      'Sebastian Fabres — director',
      'Haunted Dreams Pictures',
      'NYFA',
    ],
    summary:
      'Psychological body horror short: visceral string writing, chemical dread and a score that turns inward.',
    metaDescription:
      'CHOLERIC, a Sebastian Fabres body horror short for Haunted Dreams Pictures and NYFA: original score by Zazie Kanwar-Torge — visceral strings, chemical dread, IMDb credit.',
    paragraphs: [
      'CHOLERIC is a short psychological body horror film directed by Sebastian Fabres for Haunted Dreams Pictures and NYFA, scored by Zazie Kanwar-Torge. The film\'s line — her sins brought me home — points the score inward, at what the body keeps.',
      'The writing is almost entirely string-led, played at the edge of the instrument: col legno, over-pressure and detuned unisons that make the ensemble sound like it is failing from the inside. Percussion is present but treated as the body: pulse, breathing, wet impact.',
      'Because the horror is domestic rather than cosmic, the score stays small and close, with very little reverberant space. The unease comes from intimacy at the wrong temperature.',
    ],
    scoreNotes:
      'Short-form body horror score: over-pressured and prepared strings, detuned unisons, pulse and breath percussion, minimal reverb. Delivered beside the film\'s sound design.',
    poster: {
      src: '/images/posters/choleric-640.jpg',
      avif: '/images/posters/choleric-640.avif',
      large: '/images/posters/choleric-1200.jpg',
      alt: 'CHOLERIC short film poster - psychological body horror score by Zazie Kanwar-Torge',
      width: 640,
      height: 961,
    },
    links: [
      { label: 'CHOLERIC on IMDb', href: 'https://www.imdb.com/title/tt38637541/', kind: 'profile' },
    ],
    relatedCues: [
      'screams-of-the-damned',
      'smell-of-bleach',
      'variations-on-a-vanishing-body',
      'bone-colored-air',
      'stinger-cello-cue',
    ],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'mike-has-a-visitor',
    director: 'Marco Saikaley',
    sameAs: ['https://www.imdb.com/title/tt36954700/', 'https://www.youtube.com/watch?v=HaVJP08j77U'],
    title: 'MIKE HAS A VISITOR',
    yearLabel: 'Short',
    format: 'Short',
    genres: ['Sleep Paralysis Horror', 'Psychological Horror'],
    role: 'Original score',
    tagline: 'A sleep paralysis horror short',
    collaborators: ['Marco Saikaley — director'],
    summary:
      'Sleep paralysis horror short: dissociative tension, frozen-state drones and a score that cannot move.',
    metaDescription:
      'MIKE HAS A VISITOR, a Marco Saikaley sleep paralysis horror short: original score by Zazie Kanwar-Torge — dissociative tension, frozen drones, watch the film sample.',
    paragraphs: [
      'MIKE HAS A VISITOR is a sleep paralysis horror short directed by Marco Saikaley, scored by Zazie Kanwar-Torge. Sleep paralysis is a horror of being conscious and unable to move, and the score takes that literally: it holds a single state for longer than is comfortable.',
      'The central device is a drone that never resolves its suspension, with rhythmic material that starts and stops as if the listener\'s own attention is failing. Where the film escalates, the score adds pressure rather than motion — the same chord with more weight behind it.',
      'The register is dissociative rather than violent, which is why the writing stays close to the studio\'s psychological palette: detuned strings, breathing textures and sub-audible movement under a floor of near-silence.',
    ],
    scoreNotes:
      'Short horror score: suspended drones, detuned string clusters, breath and body textures, escalating pressure without rhythmic motion. Scored and mixed to picture.',
    poster: {
      src: '/images/posters/mike-has-a-visitor-640.jpg',
      avif: '/images/posters/mike-has-a-visitor-640.avif',
      large: '/images/posters/mike-has-a-visitor-1200.jpg',
      alt: 'MIKE HAS A VISITOR short film poster - sleep paralysis horror score by Zazie Kanwar-Torge',
      width: 640,
      height: 838,
    },
    sample: {
      provider: 'youtube',
      id: 'HaVJP08j77U',
      title: 'MIKE HAS A VISITOR — sleep paralysis horror short with original score',
      description:
        'The MIKE HAS A VISITOR short with its original score by Zazie Kanwar-Torge: suspended drones, detuned strings and pressure without motion for a sleep paralysis story.',
    },
    links: [
      { label: 'MIKE HAS A VISITOR on IMDb', href: 'https://www.imdb.com/title/tt36954700/', kind: 'profile' },
      {
        label: 'Watch the film sample',
        href: 'https://www.youtube.com/watch?v=HaVJP08j77U',
        kind: 'watch',
      },
    ],
    relatedCues: [
      'dissociative-amnesia',
      'needle-in-the-nerve',
      'dark-ambient-soundscape-no-2',
      'panic-threshold',
      'narrow-pulse',
    ],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'the-dark-awaits',
    director: 'Matthew Kondracki',
    title: 'THE DARK AWAITS',
    yearLabel: 'Feature',
    format: 'Feature',
    genres: ['Supernatural Horror'],
    role: 'Original score',
    tagline: 'A Matthew Kondracki film',
    collaborators: ['Matthew Kondracki — director'],
    summary:
      'Supernatural horror feature: cosmic isolation, escalating dread and a score built from absence.',
    metaDescription:
      'THE DARK AWAITS, a Matthew Kondracki supernatural horror feature: original score by Zazie Kanwar-Torge — cosmic isolation, escalating dread, atmospheric cinematic writing.',
    paragraphs: [
      'THE DARK AWAITS is a supernatural horror feature from director Matthew Kondracki, scored by Zazie Kanwar-Torge. The film works in isolation — people, distance, darkness — so the score treats absence as its principal material.',
      'Large parts of the film are carried by a single sustained element that shifts register as the story closes in. When the orchestral writing arrives, it arrives as a widening rather than an event: more players, more air, the same harmonic centre.',
      'The result is a score that escalates by accumulation. Nothing in it is designed to startle; everything in it is designed to keep the listener aware of how much space is unlit.',
    ],
    scoreNotes:
      'Feature score for supernatural horror: sustained textural beds, hybrid orchestral widening, cosmic isolation and escalating atmospheric dread. Scored to picture across the feature.',
    poster: {
      src: '/images/posters/the-dark-awaits-640.jpg',
      avif: '/images/posters/the-dark-awaits-640.avif',
      large: '/images/posters/the-dark-awaits-1200.jpg',
      alt: 'THE DARK AWAITS film poster - supernatural horror score by Zazie Kanwar-Torge',
      width: 640,
      height: 954,
    },
    links: [
      {
        label: 'Zazie Kanwar-Torge on IMDb',
        href: 'https://www.imdb.com/name/nm17333332',
        kind: 'profile',
      },
    ],
    relatedCues: [
      'rlyehs-xenolith',
      'obsidian-hall',
      'time-shifting-into-daylight',
      'ominous-drone',
      'the-beautiful-wrongness',
    ],
    updatedAt: '2026-10-04',
  },
];
