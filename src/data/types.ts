/**
 * Shared shapes for the archive data modules.
 *
 * Everything the item routes need — slugs, titles, descriptions, metadata,
 * media, external links, dates — lives in `src/data/*.ts` and nowhere else.
 * The route URLs, the per-route <head>, the JSON-LD and the sitemap are all
 * derived from these objects by `scripts/*.mjs`, so a URL can never drift from
 * the content it points at.
 *
 * Type-only module: it emits no JavaScript.
 */

export type RouteSection = 'work' | 'reel' | 'store';

export interface ExternalLink {
  /** Text shown to the visitor. */
  label: string;
  /** Absolute URL. Never a site-relative path — internal links are generated. */
  href: string;
  /** Used to pick an icon/label grouping and to type the JSON-LD link. */
  kind: 'watch' | 'listen' | 'buy' | 'download' | 'profile' | 'platform';
}

export interface ImageAsset {
  /** Served path, site-relative (e.g. /images/posters/expire-red-check-640.jpg). */
  src: string;
  /** Optional AVIF sibling of the same rendering. */
  avif?: string;
  /** Larger rendering for the entry page hero. */
  large?: string;
  alt: string;
  width: number;
  height: number;
  /** True when the file is hot-linked from a marketplace rather than self-hosted. */
  external?: boolean;
}

/** Fields every indexable item shares. */
export interface ItemBase {
  /** Path segment. Lowercase ASCII, digits and hyphens only. */
  slug: string;
  title: string;
  /** One-line summary used for cards, meta descriptions and sibling links. */
  summary: string;
  /**
   * 120–165 character meta description for the item's own URL. Written by
   * hand, never truncated from another field.
   */
  metaDescription: string;
  /** ISO date (YYYY-MM-DD) this entry was last touched. Feeds sitemap lastmod. */
  updatedAt: string;
}

export interface Production extends ItemBase {
  /** Display year or format label exactly as the archive prints it. */
  yearLabel: string;
  format: 'Feature' | 'Short' | 'Series';
  genres: string[];
  /** What Zazie Productions did on the production. */
  role: string;
  tagline: string;
  /** Director / production company credits, as displayed on the entry. */
  collaborators: string[];
  /** Structured director credit, when the production publishes one. */
  director?: string;
  /** Structured production company, when the production publishes one. */
  company?: string;
  /** Canonical profile/watch pages for the production. */
  sameAs?: string[];
  /** Unique entry paragraphs — never reused from the hub page. */
  paragraphs: string[];
  /** How the score was built. */
  scoreNotes: string;
  poster: ImageAsset;
  /** 16:9 still used as the entry page hero when one exists. */
  still?: ImageAsset;
  sample?: {
    provider: 'youtube' | 'drive';
    id: string;
    title: string;
    description: string;
  };
  links: ExternalLink[];
  /** Cue slugs that belong to this production's world. */
  relatedCues: string[];
}

export interface Cue extends ItemBase {
  /** Position in the showreel, 1-based. */
  position: number;
  /** One of the consolidated mood clusters in `MOODS` (see site.ts). */
  mood: string;
  /** Exact duration in seconds, from the master. */
  seconds: number;
  /** Served MP3 path. */
  src: string;
  /** The reel's own one-sentence description of the cue. */
  description: string;
  /** Second, unique paragraph: what the cue is for and how it behaves. */
  detail: string;
  /** Where the cue earns its place in a cut. */
  usage: string;
  /** Instrumentation and sound sources. */
  instrumentation: string[];
  /** Tempo / feel, as prose. */
  feel: string;
  /** The release or production the cue was written for, where documented. */
  writtenFor: string;
  /** Related release slugs from the catalogue, where the cue appears on one. */
  relatedReleases: string[];
}

export interface Release extends ItemBase {
  /** Catalogue number as printed on /store. */
  number: number;
  /** Marketplace the item is sold or hosted through. */
  platform: 'Bandcamp' | 'itch.io' | 'Gumroad' | 'eBay';
  /** Card kicker, e.g. "Album · 10 tracks · 2026". */
  kicker: string;
  /** Item copy from the catalogue card — already unique per item. */
  copy: string;
  /** Second unique paragraph for the item's own page. */
  detail: string;
  /** Who the item is for. */
  audience: string;
  /** dt/dd pairs from the catalogue card. */
  specs: Array<{ label: string; value: string }>;
  price: string;
  priceNote: string;
  /** Machine-readable price for the Offer (USD, no symbol). "0.00" when free. */
  offerPrice: string;
  /** ISO publication date, where the catalogue card publishes one. */
  releaseDate?: string;
  /** schema.org availability override (rare stock states). */
  availability?: string;
  cta: string;
  image: ImageAsset;
  /** Marketplace cover URL is hot-linked, exactly as the catalogue does today. */
  preview?: {
    src: string;
    label: string;
  };
  links: ExternalLink[];
  /** Cue slugs this item contains or previews. */
  relatedCues: string[];
}

export interface HubRoute {
  /** Path without trailing slash, '' for the home page. */
  path: string;
  title: string;
  description: string;
  lastmod: string;
  changefreq: string;
  priority: string;
  images: Array<{
    loc: string;
    caption?: string;
    title?: string;
  }>;
  /** Ordered [tag, value] pairs, exactly as the sitemap video extension lists them. */
  videos: Array<Array<[string, string]>>;
}
