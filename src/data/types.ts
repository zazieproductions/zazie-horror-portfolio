/** Shared, typed content shapes for the horror portfolio's static page build. */

/** A JSON-compatible value suitable for a JSON-LD script. */
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/* -------------------------------------------------------------------- hubs */

export interface HubImage {
  /** Absolute URL; local images are checked against the repository. */
  loc: string;
  caption: string;
  title: string;
}

export interface HubVideo {
  thumbnailLoc: string;
  title: string;
  description: string;
  playerLoc: string;
  duration?: string;
  publicationDate?: string;
  familyFriendly?: 'yes' | 'no';
  tags?: string[];
}

export interface Hub {
  path: string;
  name: string;
  title: string;
  description: string;
  lastmod: string;
  images: HubImage[];
  videos: HubVideo[];
}

/* ------------------------------------------------------------------- items */

export type LinkKind = 'imdb' | 'youtube' | 'drive' | 'bandcamp' | 'itch' | 'gumroad' | 'ebay' | 'press' | 'internal';

export interface ItemLink {
  label: string;
  href: string;
  kind: LinkKind;
  external: boolean;
}

export interface Image {
  /** Root-absolute local path or a complete HTTPS image URL. */
  src: string;
  alt: string;
  width: number;
  height: number;
  avif?: string;
  srcset?: string;
}

export interface Credit {
  role: string;
  name: string;
}

export interface VideoSample {
  kind: 'youtube' | 'drive';
  embedUrl: string;
  title: string;
  description: string;
  thumbnail: Image;
  durationSeconds?: number;
  publicationDate?: string;
  watchUrl?: string;
  creator?: { name: string; type: 'Person' | 'Organization' };
}

export type ProductionSchemaType = 'Movie' | 'TVSeries' | 'CreativeWork';

export interface Production {
  slug: string;
  title: string;
  headline: string;
  summary: string;
  workType: string;
  schemaType: ProductionSchemaType;
  genres: string[];
  status?: string;
  releaseYear?: number;
  releaseDate?: string;
  expectedReleaseDate?: string;
  runtime?: string;
  runtimeSeconds?: number;
  credits: Credit[];
  logline: string;
  paragraphs: string[];
  poster: Image;
  sample?: VideoSample;
  links: ItemLink[];
  /** Independent showreel cues offered as adjacent listening, never as placements. */
  relatedCueSlugs: string[];
  updatedAt: string;
}

export interface Cue {
  /** Position in the existing showreel and matching /audio/track-NN.mp3 file. */
  track: number;
  slug: string;
  title: string;
  headline: string;
  category: string;
  duration: string;
  durationSeconds: number;
  /** The published first-party description from /reel. */
  description: string;
  /** Unique editorial context about the cue; no inferred BPM, gear, or placement. */
  paragraphs: string[];
  audioPath: string;
  /** Only explicit same-title release matches from a verified catalogue listing. */
  releaseSlugs: string[];
  updatedAt: string;
}

export type Collection = 'records' | 'sfx' | 'plugins' | 'motion' | 'scores' | 'tools' | 'gear';
export type StoreSchemaType = 'MusicAlbum' | 'Product';
export type StorePlatform = 'Bandcamp' | 'itch.io' | 'Gumroad' | 'eBay';

export interface Fact {
  label: string;
  value: string;
}

export interface Release {
  slug: string;
  title: string;
  headline: string;
  collection: Collection;
  section: string;
  kicker: string;
  platform: StorePlatform;
  listingUrl?: string;
  sellerName?: string;
  creatorName?: string;
  schemaType: StoreSchemaType;
  summary: string;
  paragraphs: string[];
  image?: Image;
  facts: Fact[];
  releaseDate?: string;
  durationSeconds?: number;
  trackCount?: number;
  genre?: string[];
  relatedCueSlugs: string[];
  /** Explains why an external listing is deliberately not linked, if applicable. */
  linkNote?: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ routes */

export type ItemKind = 'production' | 'cue' | 'release';

export interface ItemRoute {
  kind: ItemKind;
  path: string;
  hub: string;
  slug: string;
  title: string;
  description: string;
  lastmod: string;
  image?: string;
}

export interface Route {
  path: string;
  kind: 'home' | 'hub' | ItemKind;
  title: string;
  description: string;
  lastmod: string;
}
