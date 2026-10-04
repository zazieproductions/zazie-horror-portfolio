/**
 * Site-wide constants and the derivation rules every script shares.
 *
 * `EXPECTED_HOST` is the only place the production origin is written down. The
 * sitemap generator refuses to emit a URL on any other host, over any scheme
 * other than https, or with a trailing slash, a fragment or a query string.
 */

export const SITE = {
  /** Canonical origin, no trailing slash. */
  origin: 'https://horror.zazieproductions.com',
  host: 'horror.zazieproductions.com',
  name: 'Zazie Productions',
  /** The entity the home page declares as schema.org/Person #person. */
  person: 'Zazie Kanwar-Torge',
  personId: 'https://horror.zazieproductions.com/#person',
  orgId: 'https://horror.zazieproductions.com/#org',
  websiteId: 'https://horror.zazieproductions.com/#website',
  studio: 'Zazie Productions LLC',
  location: 'Asheville, NC',
  email: 'hello@zazieproductions.com',
} as const;

/** Absolute URL for a site-relative path (always slashless, always https). */
export function absolute(path: string): string {
  const clean = path === '/' ? '/' : '/' + path.replace(/^\/+/, '').replace(/\/+$/, '');
  return SITE.origin + clean;
}

/** The six consolidated showreel moods, in the order the reel shelves them. */
export const MOODS = [
  'Psychological Orchestral',
  'Stinger',
  'Thriller',
  'Dark Ambient',
  'Body Horror',
  'Ambient Horror',
  'Cosmic Horror',
] as const;

/**
 * Marketplace hosts the catalogue already links to. Used by the sitemap
 * validator to tell a documented outbound link from a mistake.
 */
export const KNOWN_EXTERNAL_HOSTS = [
  'imdb.com',
  'www.imdb.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'drive.google.com',
  'zazieproductions.bandcamp.com',
  'zazieproductions.itch.io',
  'zazieproductions.gumroad.com',
  'www.ebay.com',
  'open.spotify.com',
  'music.apple.com',
  'play.reelcrafter.com',
  'www.linkedin.com',
];

/** Slug rule: lowercase ASCII letters, digits and single hyphens. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Turn a display title into a stable slug. Digits and words only. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u2018\u2019\u02bc']/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .toLowerCase();
}

/** Seconds -> ISO 8601 duration (PT1M12S). */
export function isoDuration(seconds: number): string {
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  let out = 'PT';
  if (h) out += `${h}H`;
  if (m) out += `${m}M`;
  if (s || (!h && !m)) out += `${s}S`;
  return out;
}

/** Seconds -> "1m 12s" with no rounding surprises. */
export function humanDuration(seconds: number): string {
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (!m) return `${s}s`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

/** Seconds -> "1:12" (used in track lists). */
export function clockDuration(seconds: number): string {
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
