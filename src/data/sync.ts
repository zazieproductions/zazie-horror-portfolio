/**
 * src/data/sync.ts
 * ----------------------------------------------------------------------------
 * Sync-ready metadata for the 32 showreel cues: the information a music
 * supervisor, trailer editor or clearance coordinator asks for before they can
 * pitch a track.
 *
 * Three rules govern this file, because a wrong identifier is worse than a
 * missing one:
 *
 *   1. An ISRC appears here only where the cue has a verified same-title,
 *      same-runtime entry in the studio's own discography database
 *      (Deezer-verified, compiled 9 August 2026). Nothing is inferred from a
 *      similar title and nothing is fabricated. Fourteen of the 32 cues are
 *      showreel-only material with no distributed release, so they carry no
 *      code and say so.
 *   2. Tempo and key are not published for these recordings, so they are not
 *      asserted. An unmeasured 120 BPM is a defect disguised as metadata.
 *   3. Descriptive tags and instrumentation are lifted from the cue's own
 *      first-party description on /reel. No tag, instrument or placement is
 *      invented for a supervisor's benefit.
 */

import type { Cue } from './types.js';

export interface SyncIsrc {
  /** 12-character ISRC exactly as it appears in the discography database. */
  code: string;
  /** The distributed release the code is assigned to. */
  releaseTitle: string;
  releaseSlug: string;
  releaseDate: string;
  /** Position of the recording on that release. */
  trackNumber: number;
}

export interface SyncDescriptor {
  /** Mood and usage terms taken from the published cue description. */
  tags: string[];
  /** Instruments the published description actually names. */
  instrumentation: string[];
}

export interface SyncSheet {
  isrc?: SyncIsrc;
  tags: string[];
  instrumentation: string[];
}

/** Paths and addresses the sync block links to. Single source, no literals. */
export const SYNC_LICENSING_PATH = '/licensing';
export const SYNC_CONTACT_PATH = '/contact';
export const SYNC_EMAIL = 'zaziediya@gmail.com';

/** Where a cited ISRC comes from, stated so a supervisor can check it. */
export const ISRC_SOURCE = 'the studio discography database (Deezer-verified, compiled 9 August 2026)';

/**
 * Verified ISRCs. A cue is listed only when its title and runtime both match the
 * release entry, which they do for these three recordings.
 */
export const SYNC_ISRC_BY_SLUG: Record<string, SyncIsrc> = {
  'needle-in-the-nerve': {
    code: 'QZZ7T2639040',
    releaseTitle: 'Anesthesia for the Signal Age',
    releaseSlug: 'anesthesia-for-the-signal-age',
    releaseDate: '2026-05-07',
    trackNumber: 9,
  },
  'quarter-eater-poltergeist': {
    code: 'QZZ7T2639041',
    releaseTitle: 'Anesthesia for the Signal Age',
    releaseSlug: 'anesthesia-for-the-signal-age',
    releaseDate: '2026-05-07',
    trackNumber: 10,
  },
  'opaline-lament-life-from-the-beyond': {
    code: 'QT6G22561538',
    releaseTitle: 'Opaline Lament (Life From The Beyond)',
    releaseSlug: 'opaline-lament-life-from-the-beyond',
    releaseDate: '2025-12-19',
    trackNumber: 1,
  },
};

/** Description-grounded descriptors, one entry per showreel cue. */
export const SYNC_DESCRIPTOR_BY_SLUG: Record<string, SyncDescriptor> = {
  'needle-in-the-nerve': {
    tags: ['dissociative tension', 'slow-burn dread', 'sub-audible pressure'],
    instrumentation: ['bowed metal'],
  },
  'dissociative-amnesia': {
    tags: ['jump scare', 'tension release', 'sharp stinger', 'rapid decay'],
    instrumentation: [],
  },
  'brutalist-tension-stinger': {
    tags: ['chase sequence', 'kinetic impact', 'raw distortion', 'brutalist'],
    instrumentation: ['percussion'],
  },
  'scraping-psychophonic-bed': {
    tags: ['dark ambient bed', 'supernatural dread', 'frozen space'],
    instrumentation: [],
  },
  'hidden-intentions-serene-purgatory': {
    tags: ['deceptive stillness', 'serene surface', 'psychological unease'],
    instrumentation: [],
  },
  'variations-on-a-vanishing-body': {
    tags: ['body horror', 'visceral texture', 'microtonal tension'],
    instrumentation: ['strings'],
  },
  'the-silence-began-crawling': {
    tags: ['atmospheric dread', 'slow build', 'creeping dissonance'],
    instrumentation: [],
  },
  'timeless-retro-splurge': {
    tags: ['analog synth', 'tape decay', '1980s retro horror', 'thriller'],
    instrumentation: ['analog synth'],
  },
  'quarter-eater-poltergeist': {
    tags: ['cosmic horror', 'otherworldly', 'disorientation', 'poltergeist energy'],
    instrumentation: [],
  },
  'dark-thriller-cinematic-cue': {
    tags: ['pursuit', 'narrative revelation', 'cinematic tension'],
    instrumentation: [],
  },
  'opaline-lament-life-from-the-beyond': {
    tags: ['chamber music', 'spectral cinema', 'ghostly grief', 'somber beauty'],
    instrumentation: ['strings'],
  },
  'ominous-drone': {
    tags: ['sensory deprivation', 'continuous drone', 'sub-harmonic'],
    instrumentation: [],
  },
  'the-fatal-overdose': {
    tags: ['medical dread', 'fading heartbeats', 'sonic collapse', 'mortality'],
    instrumentation: [],
  },
  'bone-colored-air': {
    tags: ['dry acoustic rattle', 'barren texture', 'desolation'],
    instrumentation: [],
  },
  'obsidian-hall': {
    tags: ['gothic halls', 'dread architecture', 'supernatural space'],
    instrumentation: ['hybrid orchestration'],
  },
  'rlyehs-xenolith': {
    tags: ['Lovecraftian dread', 'abyssal', 'non-Euclidean', 'vast'],
    instrumentation: [],
  },
  'deep-dystopian-synth-cue': {
    tags: ['dark sci-fi', 'techno dread', 'post-apocalyptic', 'cold analog walls'],
    instrumentation: ['analog synth'],
  },
  'panic-threshold': {
    tags: ['escalating dread', 'hyperventilation pacing', 'claustrophobia'],
    instrumentation: [],
  },
  'waterphone-shower-scene': {
    tags: ['shower scene', 'psychoacoustic shock', 'friction'],
    instrumentation: ['waterphone'],
  },
  'the-room-forgets-you': {
    tags: ['dissociative', 'uncanny', 'domestic disorientation', 'vanishing presence'],
    instrumentation: ['detuned strings'],
  },
  'dark-ambient-soundscape-no-1': {
    tags: ['supernatural horror', 'brooding', 'nocturnal presence'],
    instrumentation: [],
  },
  'subdued-drone-sensory-deprivation': {
    tags: ['claustrophobic', 'acoustic isolation', 'chamber tone', 'subdued drone'],
    instrumentation: [],
  },
  'dark-ambient-soundscape-no-2': {
    tags: ['atmospheric horror bed', 'psychological suspense', 'haunting'],
    instrumentation: [],
  },
  'screams-of-the-damned': {
    tags: ['creature vocal design', 'guttural processing', 'body horror'],
    instrumentation: ['creature vocals'],
  },
  'narrow-pulse': {
    tags: ['heartbeat dread', 'sub-bass pulse', 'suspense pacing'],
    instrumentation: ['sub-bass'],
  },
  'dissonant-decay-soundscape-sampler': {
    tags: ['dissonant decay', 'extended playing techniques', 'soundscape'],
    instrumentation: ['modular synth'],
  },
  'time-shifting-into-daylight': {
    tags: ['time distortion', 'waking nightmare', 'uncanny daylight'],
    instrumentation: [],
  },
  'stinger-cello-cue': {
    tags: ['jump scare', 'bowed dread', 'screeching attack'],
    instrumentation: ['cello', 'col legno'],
  },
  'smell-of-bleach': {
    tags: ['hospital dread', 'chemical coldness', 'antiseptic atmosphere'],
    instrumentation: [],
  },
  'fractured-requiem': {
    tags: ['liturgical dread', 'splintered ceremony', 'funeral mass'],
    instrumentation: [],
  },
  'the-beautiful-wrongness': {
    tags: ['unresolved theme', 'uneasy beauty', 'glass harmonics'],
    instrumentation: ['bowed strings', 'glass harmonics'],
  },
  'earthpulse-protocol': {
    tags: ['low pulse sequencing', 'cold analog walls', 'thriller synth'],
    instrumentation: ['analog synth'],
  },
};

/** Resolve the sync sheet for one cue. Unknown slugs yield an empty descriptor. */
export function syncSheet(cue: Cue): SyncSheet {
  const descriptor = SYNC_DESCRIPTOR_BY_SLUG[cue.slug] ?? { tags: [], instrumentation: [] };
  return {
    isrc: SYNC_ISRC_BY_SLUG[cue.slug],
    tags: descriptor.tags,
    instrumentation: descriptor.instrumentation,
  };
}
