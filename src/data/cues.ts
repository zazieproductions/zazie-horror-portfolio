/**
 * The 32 showreel cues.
 *
 * Single source of truth for /reel and for every /reel/<slug> entry: position,
 * title, mood cluster, exact duration in seconds, the served MP3, the reel's
 * one-sentence description and the entry copy all live here. The cue route
 * slugs are derived from the titles by `slugify()` in `src/data/index.ts`, so a
 * retitled cue moves its URL on the next build rather than leaving a stale one.
 *
 * Durations are the master values already published in the reel's AudioObject
 * markup; nothing here is rounded for display — the pages format them.
 */

import type { Cue } from './types.js';

/** The line used for cues that are not tied to a documented production. */
const REEL_CUE =
  'Standalone showreel cue, written to picture for horror commissions — not tied to a single production.';

export const cues: Cue[] = [
  {
    slug: 'needle-in-the-nerve',
    position: 1,
    title: 'Needle in The Nerve',
    mood: 'Psychological Orchestral',
    seconds: 72.363,
    src: '/audio/track-00.mp3',
    summary: 'Opening cue of the reel: dissociative tension, bowed metal and sub-audible pressure.',
    metaDescription:
      'Needle in The Nerve — a psychological horror cue by Zazie Kanwar-Torge: bowed metal harmonics, slow-burn dissociative dread and sub-audible pressure. Listen to the MP3.',
    description:
      'Psychological horror cue: dissociative tension built for slow-burn dread, bowed metal harmonics, and sub-audible pressure.',
    detail:
      'The reel opens here because the cue states the studio\'s whole method in a minute: a small interval repeated until it stops sounding like an interval, pressure added underneath, and no resolution offered. The bowed metal sits slightly sharp of the strings, so the pitch centre is never quite agreed on.',
    usage:
      'Best under a scene that is already uneasy — a corridor, a conversation going wrong, a decision being delayed — where the picture needs weight rather than an event.',
    instrumentation: ['Bowed metal', 'Struck strings', 'Sub-bass pressure layer', 'Room tone'],
    feel: 'Slow, submerged, 60 BPM pulse implied rather than played',
    writtenFor: 'Written for the record Anesthesia for the Signal Age, and the reel\'s opening statement.',
    relatedReleases: ['anesthesia-for-the-signal-age'],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'dissociative-amnesia',
    position: 2,
    title: 'Dissociative Amnesia',
    mood: 'Stinger',
    seconds: 35.666,
    src: '/audio/track-01.mp3',
    summary: 'Sharp stinger for jump-scares, cut-points and tension release.',
    metaDescription:
      'Dissociative Amnesia — a horror stinger by Zazie Kanwar-Torge: acoustic violence, rapid sub decay and a sharp cut-point hit for jump-scares and tension release. Hear the MP3.',
    description:
      'Sharp stinger cue for jump-scare and tension-release moments: acoustic violence and rapid sub decay.',
    detail:
      'A single gesture with a hard front edge: the attack is acoustic and the tail is almost absent, which is what makes it read as an edit rather than a musical event. The decay is deliberately shortened so the cut, not the music, decides where the moment ends.',
    usage:
      'Drop it on a cut, a reveal or the frame before a scream. It is built to survive being clipped to half a second.',
    instrumentation: ['Prepared strings', 'Impact body', 'Sub decay', 'Transient noise'],
    feel: 'Instant attack, no tail — 35 seconds gives you two usable hits with room to breathe',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'brutalist-tension-stinger',
    position: 3,
    title: 'Brutalist Tension Stinger',
    mood: 'Stinger',
    seconds: 30.037,
    src: '/audio/track-02.mp3',
    summary: 'Kinetic percussive stinger for chases and confrontation beats.',
    metaDescription:
      'Brutalist Tension Stinger — kinetic percussive horror stinger by Zazie Kanwar-Torge: raw distortion, hard impacts and forward drive for chase and confrontation cuts.',
    description:
      'Brutalist horror stinger for thriller and horror chase sequences: kinetic percussive impact and raw distortion.',
    detail:
      'Where the other stingers are impacts, this one is movement. Concrete-weight percussion plays a short cell that repeats with slight displacement, and the distortion is left unpolished on purpose — the cue should sound like a building being hit rather than a drum kit being recorded.',
    usage:
      'Cut it into a pursuit, a struggle or any sequence where the sound needs to commit to physical force.',
    instrumentation: ['Metal percussion', 'Distorted low brass', 'Concrete impacts', 'Tape saturation'],
    feel: 'Forward-leaning, clipped, around 128 BPM',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'scraping-psychophonic-bed',
    position: 4,
    title: 'Scraping Psychophonic Bed',
    mood: 'Dark Ambient',
    seconds: 91.541,
    src: '/audio/track-03.mp3',
    summary: 'A 90-second dark ambient bed of scraping textures in frozen space.',
    metaDescription:
      'Scraping Psychophonic Bed — dark ambient horror bed by Zazie Kanwar-Torge: scraping psychophonic textures, frozen acoustic space and supernatural dread. Stream the MP3.',
    description:
      'Dark ambient bed for psychological horror and supernatural dread: scraping psychophonic textures and frozen acoustic space.',
    detail:
      'A bed rather than a cue: it has no events, only weather. Scrapes recorded from metal, glass and dry wood are stretched into a continuous surface, and the reverb is set to a space much larger than any room in the film so the material reads as exterior.',
    usage:
      'Use it under dialogue, under an empty house, or as the floor beneath another cue — it is mixed with headroom above it.',
    instrumentation: ['Scraped metal and glass', 'Stretched field recordings', 'Large frozen reverb', 'Low drone'],
    feel: 'Static, glacial, no pulse',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'hidden-intentions-serene-purgatory',
    position: 5,
    title: 'Hidden Intentions / Serene Purgatory',
    mood: 'Dark Ambient',
    seconds: 62.433,
    src: '/audio/track-04.mp3',
    summary: 'A serene surface with a dark undercurrent — two states in one cue.',
    metaDescription:
      'Hidden Intentions / Serene Purgatory — a dark ambient horror cue by Zazie Kanwar-Torge: deceptive stillness over psychological unease. Two states, one continuous bed.',
    description:
      'Dark ambient cue, serene surface concealing dark undercurrents: deceptive stillness and psychological unease.',
    detail:
      'The cue is built as two layers that disagree. The upper layer is almost pretty — a soft, consonant pad with slow movement — while the lower layer sits a minor second away and barely changes at all. Nothing dramatic happens; the discomfort is the interval.',
    usage:
      'Ideal for a calm scene that the audience should not trust: a dinner, a hospital visit, a reconciliation.',
    instrumentation: ['Consonant pad', 'Detuned lower layer', 'Soft pulse', 'Close room tone'],
    feel: 'Serene and static, with a slow harmonic drift underneath',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'variations-on-a-vanishing-body',
    position: 6,
    title: 'Variations on a Vanishing Body',
    mood: 'Psychological Orchestral',
    seconds: 166.564,
    src: '/audio/track-05.mp3',
    summary: 'Body horror as theme and variations: string mutations over two and three-quarter minutes.',
    metaDescription:
      'Variations on a Vanishing Body — a body horror composition by Zazie Kanwar-Torge: visceral string mutations, microtonal tension and organic texture across 2m 46s.',
    description:
      'Body horror composition: visceral, textural, unsettling string mutations and organic microtonal tension.',
    detail:
      'The longest piece on the reel after the ambient works, and the most structural: a short theme is put through six mutations, each one pulling the ensemble further from equal temperament. By the end the theme is still recognisable but the tuning has gone, which is the argument of the piece.',
    usage:
      'Written for transformation sequences — anything where a body is being described as material rather than as a person.',
    instrumentation: ['String ensemble', 'Microtonal tuning', 'Body percussion', 'Close-miked breath'],
    feel: 'Slow, ceremonial, accelerating by density rather than tempo',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'the-silence-began-crawling',
    position: 7,
    title: 'The Silence Began Crawling',
    mood: 'Psychological Orchestral',
    seconds: 44.003,
    src: '/audio/track-06.mp3',
    summary: '44 seconds of creeping dissonance rising to a withheld release.',
    metaDescription:
      'The Silence Began Crawling — psychological horror cue by Zazie Kanwar-Torge: slow-building dissonance and rising acoustic pressure for atmospheric dread sequences.',
    description:
      'Psychological horror cue for atmospheric dread sequences: slow-building, creeping dissonance and rising acoustic pressure.',
    detail:
      'Everything in the cue moves in one direction: the strings creep upward by semitone, the dynamics rise by a single step, and the release never arrives. It ends where a stinger would begin, which makes it useful immediately before one.',
    usage: 'Play it as a lead-in, then cut to silence or to a hit. It is designed to be interrupted.',
    instrumentation: ['String clusters', 'Bowed cymbal', 'Rising noise floor', 'Sub swell'],
    feel: 'Crawling, unresolved, tension without detonation',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'timeless-retro-splurge',
    position: 8,
    title: 'Timeless Retro Splurge',
    mood: 'Thriller',
    seconds: 136.145,
    src: '/audio/track-07.mp3',
    summary: 'Analogue synth dread with tape decay and a 1980s horror palette.',
    metaDescription:
      'Timeless Retro Splurge — retro horror synth cue by Zazie Kanwar-Torge: analogue synth dread, tape decay and 1980s thriller aesthetics across 2m 16s.',
    description:
      'Thriller cue with analog synth dread, tape decay, and haunting 80s retro horror aesthetics.',
    detail:
      'A deliberate trip through the eighties horror score: sequential analogue bass, glassy pads and a lead that behaves like it is being remembered rather than played. Everything is printed through tape and then re-pitched down slightly, which is where the haze comes from.',
    usage:
      'For neon horror, night drives, montages and any sequence that wants period dread instead of orchestral weight.',
    instrumentation: ['Analogue polysynth', 'Sequential bass', 'Tape delay and saturation', 'Gated reverb drums'],
    feel: 'Mid-tempo, hypnotic, 116 BPM',
    writtenFor: 'Written for the album Interference Archive 01010101; the reel keeps its synth-led register.',
    relatedReleases: ['interference-archive-01010101'],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'quarter-eater-poltergeist',
    position: 9,
    title: 'Quarter-Eater Poltergeist',
    mood: 'Cosmic Horror',
    seconds: 56,
    src: '/audio/track-08.mp3',
    summary: 'Electroacoustic anomalies and arcade-haunted poltergeist energy.',
    metaDescription:
      'Quarter-Eater Poltergeist — cosmic horror cue by Zazie Kanwar-Torge: otherworldly electroacoustic anomalies and poltergeist energy across 56 seconds.',
    description:
      'Cosmic horror cue: otherworldly, disorienting electroacoustic anomalies and poltergeist energy.',
    detail:
      'The cue takes a mundane source — an arcade cabinet, its relays and its coin mechanism — and treats it as an instrument that has stopped obeying its own rules. Tones arrive from the wrong side of the stereo field, which is the disorientation the title promises.',
    usage:
      'For possessed objects, haunted machines and any scene where something ordinary has become wrong.',
    instrumentation: ['Arcade cabinet samples', 'Electroacoustic processing', 'Misfiled stereo imaging', 'Sub thumps'],
    feel: 'Jittery, playful and unpleasant at once',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'dark-thriller-cinematic-cue',
    position: 10,
    title: 'Dark Thriller Cinematic Cue',
    mood: 'Thriller',
    seconds: 65.109,
    src: '/audio/track-09.mp3',
    summary: 'A trailer-shaped thriller cue: pursuit, stakes and revelation.',
    metaDescription:
      'Dark Thriller Cinematic Cue — trailer-shaped thriller score by Zazie Kanwar-Torge: pursuit, high stakes and narrative revelation shaped for picture. Listen in full.',
    description:
      'Dark cinematic thriller cue: tension, pursuit, and high-stakes narrative revelation shaped for picture.',
    detail:
      'Written in three clear sections that map onto how a scene escalates: a pulse for the approach, a chordal widening for the stakes, and a high sustained line for the moment the audience understands something the character does not.',
    usage:
      'Useful for trailers, recaps and cold opens — anywhere the music has to do narrative work quickly.',
    instrumentation: ['String ostinato', 'Hybrid brass', 'Percussion hits', 'High sustained strings'],
    feel: 'Driving, cinematic, 100 BPM',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'opaline-lament-life-from-the-beyond',
    position: 11,
    title: 'Opaline Lament (Life From The Beyond)',
    mood: 'Psychological Orchestral',
    seconds: 144.279,
    src: '/audio/track-10.mp3',
    summary: 'Chamber strings and ghostly grief — the reel\'s most melodic cue.',
    metaDescription:
      'Opaline Lament (Life From The Beyond) — chamber horror strings by Zazie Kanwar-Torge: somber beauty, ghostly grief and a melody that sits between chamber music and film score.',
    description:
      'Psychological horror meditation between chamber music and spectral cinema: haunting strings, somber beauty, and ghostly grief.',
    detail:
      'The most exposed writing on the reel: a single melodic line carried by close-miked strings, harmonised in fifths and then left alone. It is the cue that most clearly shows the chamber side of the studio, and it was released as a single in its own right.',
    usage:
      'For grief, for a funeral that is not quite a funeral, and for endings that need to be sad rather than frightening.',
    instrumentation: ['Close-miked string quartet', 'Harmonium', 'Glass harmonics', 'Soft room'],
    feel: 'Slow lament, 2m 24s, melodic rather than textural',
    writtenFor: 'Released as the single Opaline Lament (Life From The Beyond) — the catalogue entry is at /store/opaline-lament-life-from-the-beyond.',
    relatedReleases: ['opaline-lament-life-from-the-beyond'],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'ominous-drone',
    position: 12,
    title: 'Ominous Drone',
    mood: 'Dark Ambient',
    seconds: 117.419,
    src: '/audio/track-11.mp3',
    summary: 'Continuous sub-harmonic rumination for sensory deprivation and dread.',
    metaDescription:
      'Ominous Drone — dark ambient horror drone by Zazie Kanwar-Torge: continuous sub-harmonic rumination for sensory deprivation, isolation and supernatural dread.',
    description:
      'Dark ambient drone for sensory deprivation and psychological horror: continuous sub-harmonic rumination.',
    detail:
      'One sustained event, two minutes long, built from stacked sub-harmonics that beat slowly against each other. The interest is entirely in the beating — the listener hears movement in something that never actually changes.',
    usage:
      'The reliable bed for isolation, basement and confinement scenes; also useful under a longer cue as a floor.',
    instrumentation: ['Sub-harmonic stack', 'Bowed piano strings', 'Slow beating intervals', 'Air noise'],
    feel: 'Immovable, hypnotic, no pulse',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'the-fatal-overdose',
    position: 13,
    title: 'The Fatal Overdose',
    mood: 'Body Horror',
    seconds: 42.325,
    src: '/audio/track-12.mp3',
    summary: 'Medical dread and collapse in 42 seconds — a fading heartbeat.',
    metaDescription:
      'The Fatal Overdose — body horror cue by Zazie Kanwar-Torge: medical dread, fading heartbeats and sonic collapse for mortality, hospitals and tragedy.',
    description:
      'Body horror cue for medical dread and tragic mortality: fading heartbeats and sonic collapse.',
    detail:
      'The cue is a slow deceleration: a heartbeat that begins regular, loses its interval and finally drops below the audible floor while the harmony flattens out above it. Nothing is added after the first ten seconds — everything is subtraction.',
    usage:
      'For overdose, surgery and death scenes, and for any moment where a body fails and the room has to notice.',
    instrumentation: ['Processed heartbeat', 'Surgical room tone', 'Flattening harmony', 'Sub drop'],
    feel: 'Decelerating, clinical, claustrophobic',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'bone-colored-air',
    position: 14,
    title: 'Bone-Colored Air',
    mood: 'Body Horror',
    seconds: 82,
    src: '/audio/track-13.mp3',
    summary: 'Dry acoustic rattle in a barren, bone-coloured atmosphere.',
    metaDescription:
      'Bone-Colored Air — body horror cue by Zazie Kanwar-Torge: dry acoustic rattle, barren texture and desolate atmosphere across 1m 22s. Stream the original cue.',
    description:
      'Body horror cue: bone-colored atmosphere, dry acoustic rattle, and barren textural desolation.',
    detail:
      'Everything here is dry: no reverb tail, no softness, no warmth. Rattles and clicks from bone, shell and dry wood form the rhythm section, while a single sustained upper tone keeps the ear oriented in an otherwise featureless space.',
    usage:
      'For aftermath scenes, deserts and interiors where something has been taken apart and left in the room.',
    instrumentation: ['Bone and shell rattles', 'Dry wood clicks', 'Sustained upper tone', 'No reverb'],
    feel: 'Arid, unhurried, bony',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'obsidian-hall',
    position: 15,
    title: 'Obsidian Hall',
    mood: 'Cosmic Horror',
    seconds: 108.421,
    src: '/audio/track-14.mp3',
    summary: 'Hybrid orchestration and dread architecture for gothic halls.',
    metaDescription:
      'Obsidian Hall — cosmic horror cue by Zazie Kanwar-Torge: hybrid orchestration and dread architecture for gothic halls, ritual spaces and supernatural suspense.',
    description:
      'Cosmic horror cue: hybrid orchestration and dread architecture for gothic halls and supernatural spaces.',
    detail:
      'A large-space cue. Low strings establish a slow repeated figure while brass and synth stack above it in a chord that keeps gaining voices; the effect is a hall that gets taller as the cue proceeds.',
    usage:
      'For ritual spaces, cathedrals, abandoned institutions and any reveal of architecture that is too big for the characters in it.',
    instrumentation: ['Low string ostinato', 'Hybrid brass stack', 'Analogue drone', 'Long hall reverb'],
    feel: 'Monumental, slow, 58 BPM',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'rlyehs-xenolith',
    position: 16,
    title: "R'lyeh's Xenolith",
    mood: 'Ambient Horror',
    seconds: 392.777,
    src: '/audio/track-15.mp3',
    summary: 'Six and a half minutes of abyssal, non-Euclidean Lovecraftian dread.',
    metaDescription:
      "R'lyeh's Xenolith — ambient horror by Zazie Kanwar-Torge: six and a half minutes of Lovecraftian dread, abyssal depths and non-Euclidean soundscapes. Stream it.",
    description:
      'Ambient horror composition: vast, unknowable Lovecraftian dread, abyssal depths, and non-Euclidean soundscapes.',
    detail:
      'The reel\'s long-form centre: six and a half minutes that move through four depths without ever restating material, built from slowed water recordings, infrasonic tones and a choir sampled at a quarter speed. It is the closest the studio comes to pure world-building.',
    usage:
      'For cosmic horror, ocean and void sequences, and for anything long enough to let the audience lose their footing in the middle.',
    instrumentation: ['Slowed hydrophone recordings', 'Infrasonic tones', 'Quarter-speed choir', 'Deep plate reverb'],
    feel: 'Abyssal, vast, no tempo at all',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'deep-dystopian-synth-cue',
    position: 17,
    title: 'Deep Dystopian Synth Cue',
    mood: 'Thriller',
    seconds: 71.773,
    src: '/audio/track-16.mp3',
    summary: 'Cold analogue walls for dark sci-fi and post-apocalyptic dread.',
    metaDescription:
      'Deep Dystopian Synth Cue — dark sci-fi thriller cue by Zazie Kanwar-Torge: cold analogue walls of sound, techno dread and post-apocalyptic alienation.',
    description:
      'Thriller synth cue for dark sci-fi, techno dread, and post-apocalyptic alienation: cold analog walls of sound.',
    detail:
      'Pitched exactly at the meeting point between techno and score: a hard, repetitive low figure with no melodic release and one filter sweep that takes ninety per cent of the cue to open. It is industrial music used as architecture.',
    usage:
      'For dystopias, laboratories, servers and any sequence that needs to feel administrated rather than haunted.',
    instrumentation: ['Monosynth sequence', 'Cold pad wall', 'Metal percussion', 'Filter automation'],
    feel: 'Cold, mechanical, 132 BPM',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'panic-threshold',
    position: 18,
    title: 'Panic Threshold',
    mood: 'Thriller',
    seconds: 52.219,
    src: '/audio/track-17.mp3',
    summary: 'Escalating dread paced like hyperventilation.',
    metaDescription:
      'Panic Threshold — thriller horror cue by Zazie Kanwar-Torge: escalating dread, hyperventilation pacing and claustrophobic pressure for panic sequences.',
    description:
      'Thriller cue at the panic threshold: escalating dread, hyperventilation pacing, and claustrophobic pressure.',
    detail:
      'The tempo of the cue is the tempo of a panic attack: short breaths that get closer together, with the harmony refusing to widen. Around the halfway point the breathing texture takes over from the strings entirely.',
    usage: 'For panic attacks, tunnels, locked rooms and any scene shot too close to a face.',
    instrumentation: ['Breath samples', 'Short string stabs', 'Close sub pulse', 'Rising noise'],
    feel: 'Tight, breathless, accelerating',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'waterphone-shower-scene',
    position: 19,
    title: 'Waterphone Shower Scene',
    mood: 'Stinger',
    seconds: 79.882,
    src: '/audio/track-18.mp3',
    summary: 'Waterphone friction and classic psychoacoustic shock for a shower scene.',
    metaDescription:
      'Waterphone Shower Scene — horror stinger by Zazie Kanwar-Torge: waterphone friction, bowed metal screech and classic psychoacoustic shock. Listen to the cue.',
    description:
      'Horror stinger cue: shower scene dread, waterphone friction, and classic psychoacoustic shock.',
    detail:
      'A homage that stays honest: the waterphone is played rather than sampled, its bow friction recorded close, and the strings answer it with a rising glissando that every horror audience already knows. The cue knows the reference and uses it instead of hiding it.',
    usage:
      'For reveal-shock moments, bathroom scenes and any cut that wants the oldest trick in the genre to land again.',
    instrumentation: ['Waterphone (bowed)', 'String glissando', 'Water impacts', 'Tiled room reverb'],
    feel: 'Sharp, iconic, one long swoop with a hard stop',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'the-room-forgets-you',
    position: 20,
    title: 'The Room Forgets You',
    mood: 'Psychological Orchestral',
    seconds: 136.202,
    src: '/audio/track-19.mp3',
    summary: 'Detuned strings for domestic disorientation and vanishing presence.',
    metaDescription:
      'The Room Forgets You — psychological horror cue by Zazie Kanwar-Torge: detuned strings, domestic disorientation and vanishing presence across 2m 16s.',
    description:
      'Psychological horror cue: dissociative and uncanny, detuned strings evoking domestic disorientation and vanishing presence.',
    detail:
      'Written for the horror of an ordinary room: the ensemble is recorded at a domestic distance, and the detuning is small enough to feel like a mistake rather than an effect. The theme repeats four times, each time with one fewer voice.',
    usage:
      'For empty bedrooms, returning-home scenes and any moment where a person recognises a place they no longer belong in.',
    instrumentation: ['Detuned string ensemble', 'Prepared piano', 'Close domestic reverb', 'Soft sub pulse'],
    feel: 'Slow, uncanny, four repetitions and one fewer player each time',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'dark-ambient-soundscape-no-1',
    position: 21,
    title: 'Dark Ambient Soundscape No. 1',
    mood: 'Dark Ambient',
    seconds: 104.072,
    src: '/audio/track-20.mp3',
    summary: 'Brooding nocturnal presence — the first of the two soundscape beds.',
    metaDescription:
      'Dark Ambient Soundscape No. 1 — atmospheric horror bed by Zazie Kanwar-Torge: brooding nocturnal presence for supernatural horror and slow dread. Stream it.',
    description:
      'Dark ambient soundscape for supernatural horror and atmospheric dread: brooding nocturnal presence.',
    detail:
      'A night exterior in audio form: distant wind, a slow harmonic pad and a low presence that never resolves into a note. It holds its state for a minute and three quarters without any event, which is exactly what a bed should do.',
    usage: 'For establishing shots, night exteriors and long scenes that need atmosphere instead of score.',
    instrumentation: ['Wind recordings', 'Slow harmonic pad', 'Unresolved low presence', 'Distant metal'],
    feel: 'Nocturnal, brooding, eventless by design',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'subdued-drone-sensory-deprivation',
    position: 22,
    title: 'Subdued Drone / Sensory Deprivation',
    mood: 'Dark Ambient',
    seconds: 63.312,
    src: '/audio/track-21.mp3',
    summary: 'A subdued, claustrophobic drone for isolation and chamber dread.',
    metaDescription:
      'Subdued Drone / Sensory Deprivation — dark ambient cue by Zazie Kanwar-Torge: claustrophobic isolation, deep chamber tone and sensory deprivation dread.',
    description:
      'Dark ambient drone for sensory deprivation: subdued, claustrophobic, deep acoustic isolation and chamber tone.',
    detail:
      'The opposite of the big-space beds: this one is recorded as if the listener is inside a small treated room, with almost no decay. The lack of reverb is the tension — there is nowhere for the sound to go.',
    usage: 'For tanks, cells, cells-within-cells and any scene where the walls are the antagonist.',
    instrumentation: ['Close drone', 'Treated-room tone', 'Minimal reverb', 'Low sine layer'],
    feel: 'Claustrophobic, deadened, static',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'dark-ambient-soundscape-no-2',
    position: 23,
    title: 'Dark Ambient Soundscape No. 2',
    mood: 'Dark Ambient',
    seconds: 58.07,
    src: '/audio/track-22.mp3',
    summary: 'The second soundscape bed: haunting atmosphere for psychological suspense.',
    metaDescription:
      'Dark Ambient Soundscape No. 2 — atmospheric horror bed by Zazie Kanwar-Torge: haunting texture for psychological suspense and supernatural haunting scenes.',
    description:
      'Dark ambient soundscape No. 2: atmospheric horror bed for psychological suspense and supernatural haunting.',
    detail:
      'Shorter and more active than its companion: a slow tremolo figure appears partway through and then withdraws, which gives the bed a memory of movement without turning it into a cue. Mixed to sit under dialogue.',
    usage: 'For haunting sequences, séance scenes and interiors that have an occupant nobody can see.',
    instrumentation: ['Tremolo string texture', 'Air noise', 'Low pad', 'Soft metal resonance'],
    feel: 'Haunting, quiet, one slow gesture then stillness',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'screams-of-the-damned',
    position: 24,
    title: 'Screams of The Damned',
    mood: 'Body Horror',
    seconds: 200.072,
    src: '/audio/track-23.mp3',
    summary: 'Creature vocal design and guttural processing over three and a half minutes.',
    metaDescription:
      'Screams of The Damned — body horror cue by Zazie Kanwar-Torge: creature vocal design, organic guttural processing and damned vocalisations across 3m 20s.',
    description:
      'Body horror cue: creature vocal design, organic guttural processing, and damned vocalizations.',
    detail:
      'A vocal-led piece where every sound originates from a human throat and none of it ends up sounding human. The processing chain runs from throat singing through granular re-pitching to a bank of organic resonators, and the piece builds a choir out of it.',
    usage:
      'For creature reveals, possession, mass suffering and any scene that needs a crowd of voices that are not people.',
    instrumentation: ['Throat singing', 'Granular vocal processing', 'Organic resonators', 'Sub choir'],
    feel: 'Dense, choral, overwhelming by three minutes',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'narrow-pulse',
    position: 25,
    title: 'Narrow Pulse',
    mood: 'Thriller',
    seconds: 34.133,
    src: '/audio/track-24.mp3',
    summary: 'Heartbeat dread in 34 seconds: narrow sub-bass pulse, suspense pacing.',
    metaDescription:
      'Narrow Pulse — thriller horror cue by Zazie Kanwar-Torge: heartbeat dread, narrow sub-bass pulse and suspense pacing in a taut 34 seconds.',
    description: 'Thriller cue: heartbeat dread, narrow sub-bass pulse, and suspense pacing.',
    detail:
      'Built from a single narrow sub pulse and almost nothing else. The pulse is deliberately too slow to be a heartbeat and too regular to be relaxed, so the listener supplies the anxiety.',
    usage: 'For stalking sequences, corridors and any shot where someone is being followed but not caught.',
    instrumentation: ['Narrow sub pulse', 'Ticking upper layer', 'Noise floor', 'Single string note'],
    feel: 'Sparse, patient, 34 seconds',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'dissonant-decay-soundscape-sampler',
    position: 26,
    title: 'Dissonant Decay : Soundscape Sampler',
    mood: 'Dark Ambient',
    seconds: 60.465,
    src: '/audio/track-25.mp3',
    summary: 'A one-minute sampler of dissonant decay and extended technique.',
    metaDescription:
      'Dissonant Decay : Soundscape Sampler — dark ambient cue by Zazie Kanwar-Torge: modular textures, extended playing techniques and decaying dissonance.',
    description:
      'Dark ambient soundscape sampler: dissonant decay, modular synth textures, and extended playing techniques.',
    detail:
      'A sampler in the literal sense: one minute of the studio\'s textural vocabulary, sequenced so each element is heard once and then decays out of the mix. Useful as a palette reference for directors deciding which register a scene should sit in.',
    usage: 'For abstract sequences, title cards, dream material and texture-led montage.',
    instrumentation: ['Modular synth', 'Extended string techniques', 'Decaying resonances', 'Field texture'],
    feel: 'Fragmented, textural, one minute',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'time-shifting-into-daylight',
    position: 27,
    title: 'Time Shifting Into Daylight',
    mood: 'Psychological Orchestral',
    seconds: 304.646,
    src: '/audio/track-26.mp3',
    summary: 'Five minutes of time distortion and uncanny daylight disorientation.',
    metaDescription:
      'Time Shifting Into Daylight — psychological horror cue by Zazie Kanwar-Torge: time distortion, waking nightmares and uncanny daylight disorientation, 5m 4s.',
    description:
      'Psychological horror cue: time distortion, waking nightmares, and uncanny daylight disorientation.',
    detail:
      'The horror of a bright room. The cue runs five minutes with a tempo that gradually stretches — the same figure played slower each time — until morning daylight has become the most frightening thing in the film. Written for long takes and slow burns.',
    usage: 'For waking nightmares, day-for-night reversals and scenes that should be safe but are not.',
    instrumentation: ['Stretching string figure', 'Treated piano', 'Bright harmonic overtones', 'Slow sub drift'],
    feel: 'Slowly decelerating, uncanny, five minutes',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'stinger-cello-cue',
    position: 28,
    title: 'Stinger Cello Cue',
    mood: 'Stinger',
    seconds: 32.694,
    src: '/audio/track-27.mp3',
    summary: 'Sharp bowed dread: col legno attack and cello screech for jump-scares.',
    metaDescription:
      'Stinger Cello Cue — horror stinger by Zazie Kanwar-Torge: sharp bowed dread, aggressive col legno attack and cello screech for jump-scare cut-points.',
    description:
      'Horror stinger cue for cello: sharp bowed dread, aggressive col legno, and screeching attack for jump-scare moments.',
    detail:
      'One instrument, one gesture: a col legno strike that turns into an over-pressured screech as the player refuses to release the string. Recorded close enough that the wood of the bow is audible.',
    usage: 'For cut-points, reveals and the final frame before a title. Drops straight in at any level.',
    instrumentation: ['Solo cello, col legno and over-pressure', 'Close mic', 'Sub support', 'Room slap'],
    feel: 'Violent, brief, single attack',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'smell-of-bleach',
    position: 29,
    title: 'Smell of Bleach',
    mood: 'Body Horror',
    seconds: 126,
    src: '/audio/track-28.mp3',
    summary: 'Sterile hospital dread: chemical coldness and antiseptic atmosphere.',
    metaDescription:
      'Smell of Bleach — body horror cue by Zazie Kanwar-Torge: sterile hospital dread, chemical coldness and antiseptic atmosphere across 2m 6s.',
    description: 'Body horror cue: sterile hospital dread, chemical coldness, and antiseptic atmosphere.',
    detail:
      'Clinical rather than gory. The cue is built from cleaned surfaces — tiled reverb, wiped glass, the hum of equipment — with one harmonic element that is just too pure to be pleasant. The horror is hygiene.',
    usage: 'For hospitals, mortuaries, laboratories and the silence after something has been tidied away.',
    instrumentation: ['Tiled room reverb', 'Equipment hum', 'Wiped glass textures', 'Pure-tone harmony'],
    feel: 'Cold, clean, procedural',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'fractured-requiem',
    position: 30,
    title: 'Fractured Requiem',
    mood: 'Psychological Orchestral',
    seconds: 173.136,
    src: '/audio/track-29.mp3',
    summary: 'Liturgical dread, splintered ceremony and a funeral mass for the unburied.',
    metaDescription:
      'Fractured Requiem — psychological horror cue by Zazie Kanwar-Torge: fractured liturgical dread, splintered ceremony and a funeral mass for the unburied, 2m 53s.',
    description:
      'Psychological horror cue: fractured liturgical dread, splintered ceremony, and a funeral mass for the unburied.',
    detail:
      'A requiem with its sections out of order: the introit arrives after the dies irae, the voices enter without a text, and the cadence is always interrupted by a semitone. It is the studio\'s orchestral writing at its most ceremonial.',
    usage: 'For funerals, processions, cult gatherings and any ritual that should not be happening.',
    instrumentation: ['Low voices', 'Bowed strings', 'Organ pedal', 'Stone-room reverb'],
    feel: 'Ceremonial, fractured, slow throughout',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'the-beautiful-wrongness',
    position: 31,
    title: 'The Beautiful Wrongness',
    mood: 'Psychological Orchestral',
    seconds: 65.411,
    src: '/audio/track-30.mp3',
    summary: 'A theme that never resolves: bowed strings and glass harmonics.',
    metaDescription:
      'The Beautiful Wrongness — psychological orchestral cue by Zazie Kanwar-Torge: a theme that never quite resolves, bowed strings and glass harmonics circling something wrong.',
    description:
      'Psychological orchestral cue: a theme that never quite resolves, bowed strings and glass harmonics circling something beautiful and wrong.',
    detail:
      'Consonance held one note too long. The theme is attractive on first hearing and increasingly uncomfortable on the third repetition, because the harmony keeps arriving somewhere adjacent to where the ear expects. It is the studio\'s thesis in a single cue.',
    usage: 'For seduction, possession-by-invitation and any beauty the film does not want the audience to trust.',
    instrumentation: ['Bowed strings', 'Glass harmonics', 'Detuned piano', 'Soft choir'],
    feel: 'Luminous and unresolved, 65 seconds',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
  {
    slug: 'earthpulse-protocol',
    position: 32,
    title: 'Earthpulse Protocol',
    mood: 'Thriller',
    seconds: 71.445,
    src: '/audio/track-31.mp3',
    summary: 'Low earth-pulse sequencing that keeps transmitting after the picture cuts.',
    metaDescription:
      'Earthpulse Protocol — thriller synth cue by Zazie Kanwar-Torge: low earth-pulse sequencing, cold analogue walls and a signal that outlasts the picture.',
    description:
      'Thriller synth cue: low earth-pulse sequencing, cold analog walls, and a signal that keeps transmitting after the picture cuts.',
    detail:
      'The reel closes on a transmission: a low pulse at roughly the rate of a resting human, wrapped in cold analogue walls, with a tremolo that behaves like a failing carrier wave. It is written to end a sequence rather than resolve it.',
    usage: 'For bunkers, signals, end cards and any ending that leaves the story broadcasting.',
    instrumentation: ['Earth-pulse sequence', 'Analogue pad wall', 'Carrier tremolo', 'Sub hum'],
    feel: 'Cold, hypnotic, 58 BPM pulse, unresolved',
    writtenFor: REEL_CUE,
    relatedReleases: [],
    updatedAt: '2026-10-04',
  },
];
