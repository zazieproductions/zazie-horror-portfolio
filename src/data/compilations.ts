/**
 * Bandcamp compilation and release players shown on the homepage.
 *
 * Same set and order as the Bandcamp embeds on the ReelCrafter reel
 * (https://play.reelcrafter.com/xUXGBP_5Sui1_2ve23fyLg). Album and track ids
 * come from each Bandcamp embed; durations are as Bandcamp displays them.
 * `/reel#compilations` carries the same nine players as hand-written markup
 * (reel/index.html), so a change here needs the same change there.
 */

export interface CompilationItem {
  kind: 'Compilation' | 'Own release';
  /** Album or release title as Bandcamp shows it. */
  album: string;
  /** Bandcamp artwork id (10 digits); the cover is f4.bcbits.com/img/a<artId>_16.jpg. */
  artId: string;
  /** Title of the track the player opens on. */
  title: string;
  /** Genre-descriptive alt text for cover artwork. */
  alt: string;
  /** Canonical genre labels for deep-linked MusicRecording schema. */
  genres: string[];
  duration: string;
  note: string;
  /** Bandcamp album id; omitted for a single-track release. */
  albumId?: string;
  trackId: string;
  trackUrl?: string;
  albumUrl?: string;
}

export const compilations: CompilationItem[] = [
  {
    kind: 'Compilation', album: 'The Undead', artId: '0832652916', title: 'Zombies Were People Too', duration: '1:21',
    alt: 'Zombies Were People Too (The Undead): Body horror score cue by Zazie Kanwar-Torge featuring prepared strings, dissonant brass swells, and decaying tape textures.',
    genres: ['Body Horror', 'Dark Ambient'],
    note: 'Track 7 of The Undead, a Sounds for the Soul compilation released April 27, 2025.',
    albumId: '3159294905', trackId: '2534272714',
    trackUrl: 'https://soundsforthesoul.bandcamp.com/track/zazie-productions-zombies-were-people-too',
    albumUrl: 'https://soundsforthesoul.bandcamp.com/album/the-undead',
  },
  {
    kind: 'Compilation', album: 'Vampires', artId: '2491679187', title: 'Vlad The Impaler', duration: '1:18',
    alt: 'Vlad The Impaler (Vampires): Gothic folk horror score cue by Zazie Kanwar-Torge featuring sul ponticello strings, bowed metal harmonics, and ritual percussion.',
    genres: ['Folk Horror', 'Supernatural Thriller'],
    note: 'Track 13 of Vampires, a Sounds for the Soul compilation released October 26, 2025.',
    albumId: '1877841215', trackId: '1525832343',
    trackUrl: 'https://soundsforthesoul.bandcamp.com/track/zazie-productions-vlad-the-impaler',
    albumUrl: 'https://soundsforthesoul.bandcamp.com/album/vampires',
  },
  {
    kind: 'Compilation', album: 'Beyond The Body', artId: '2636155217', title: 'Vox Hemorrhagia', duration: '4:54',
    alt: 'Vox Hemorrhagia (Beyond The Body): Transgressive body horror composition by Zazie Kanwar-Torge featuring processed vocal extremities, granular synthesis, and sub-bass distortion.',
    genres: ['Body Horror', 'Experimental'],
    note: 'Track 10 of the 16-track compilation Beyond The Body.',
    albumId: '2579089660', trackId: '2574804859',
    albumUrl: 'https://witch-house.bandcamp.com/album/beyond-the-body',
  },
  {
    kind: 'Compilation', album: 'Experiments on the Witch House [IND255GVA]', artId: '3448102388', title: 'The H\u00f8use F\u03a9rg\u00f8t Its Name / Hex Ritual', duration: '2:42',
    alt: 'The Høuse FΩrgøt Its Name / Hex Ritual: Occult folk horror score cue by Zazie Kanwar-Torge featuring ritualistic synth drones, bowed metal, and spectral decay.',
    genres: ['Folk Horror', 'Experimental'],
    note: 'Track 13 of Experiments on the Witch House, a 28-track Inner Demons Records compilation released October 31, 2025.',
    albumId: '3733971626', trackId: '3317107995',
    trackUrl: 'https://innerdemonsrecords.bandcamp.com/track/the-h-use-f-rg-t-its-name-hex-ritual',
    albumUrl: 'https://innerdemonsrecords.bandcamp.com/album/experiments-on-the-witch-house-ind255gva',
  },
  {
    kind: 'Compilation', album: 'Esoterrexus - A Slithering Black Compilation', artId: '3176296099', title: 'R\u2019lyeh\u2019s Xenolith', duration: '6:33',
    alt: 'R’lyeh’s Xenolith (Esoterrexus): Cosmic ambient horror score by Zazie Kanwar-Torge featuring cavernous sub-bass drones, performed waterphone, and electroacoustic resonance.',
    genres: ['Cosmic Horror', 'Dark Ambient'],
    note: 'Track 14 of 20 on Esoterrexus, a Slithering Black Records compilation. The same piece is a cue on the showreel.',
    albumId: '2690874869', trackId: '2488880378',
    albumUrl: 'https://slitheringblackrecords.bandcamp.com/album/esoterrexus-a-slithering-black-compilation',
  },
  {
    kind: 'Compilation', album: 'Summoning 2', artId: '2475836978', title: 'The Spirit\u2019s Bone Colored Air', duration: '1:22',
    alt: 'The Spirit’s Bone Colored Air (Summoning 2): Supernatural body horror score cue by Zazie Kanwar-Torge featuring breath-driven granular synthesis, bowed metal, and hollow acoustic pressure.',
    genres: ['Body Horror', 'Supernatural Thriller'],
    note: 'Track 19 of the 45-track compilation Summoning 2.',
    albumId: '1119137698', trackId: '2745548289',
    albumUrl: 'https://dittanyofcrete.bandcamp.com/album/summoning-2',
  },
  {
    kind: 'Own release', album: 'Opaline Lament (Life From The Beyond)', artId: '4110701137', title: 'Opaline Lament (Life From The Beyond)', duration: '2:24',
    alt: 'Opaline Lament (Life From The Beyond): Experimental art house chamber-horror score by Zazie Kanwar-Torge featuring mournful solo strings, glass harmonics, and spectral orchestration.',
    genres: ['Experimental Art House', 'Chamber music', 'Psychological Horror'],
    note: 'A string-driven single between chamber music and spectral cinema, released by Zazie Productions on Bandcamp. A same-titled cue is on the showreel.',
    trackId: '3208522807',
    trackUrl: 'https://zazieproductions.bandcamp.com/track/opaline-lament-life-from-the-beyond-2',
  },
  {
    kind: 'Own release', album: 'Constrained Capacity', artId: '0935502895', title: 'Soundscape of 0/11/2022 (Bonus Track)', duration: '1:55',
    alt: 'Soundscape of 0/11/2022 (Constrained Capacity): Industrial psychological horror soundscape by Zazie Kanwar-Torge featuring musique concrète field recordings, bowed metal, and modular noise.',
    genres: ['Psychological Horror', 'Dark Ambient', 'Industrial'],
    note: 'The bonus track closing Constrained Capacity, a ten-track Zazie Productions album on Bandcamp.',
    albumId: '832840755', trackId: '1951782118',
    albumUrl: 'https://zazieproductions.bandcamp.com/album/constrained-capacity',
  },
  {
    kind: 'Compilation', album: 'TWO YEARS', artId: '0490310199', title: 'Checksum Failed Successfully', duration: '1:11',
    alt: 'Checksum Failed Successfully (TWO YEARS): Experimental techno-thriller score cue by Zazie Kanwar-Torge featuring acousmatic impulse percussion and fractured digital synthesis.',
    genres: ['Experimental', 'IDM', 'Acousmatic'],
    note: 'Track 97 of the Various compilation TWO YEARS, a sequence of short pieces of about two minutes each.',
    albumId: '1603093440', trackId: '3325320170',
    albumUrl: 'https://loudsilencedigital.bandcamp.com/album/two-years',
  },
];
