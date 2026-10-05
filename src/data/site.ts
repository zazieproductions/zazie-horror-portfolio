/**
 * src/data/site.ts
 * ----------------------------------------------------------------------------
 * One place for the origin, the identity strings, the URL builders and the
 * escaping rules. Nothing in this repository may write a absolute
 * horror.zazieproductions.com URL by hand: route segments come from slug fields
 * and this module turns them into URLs, so a moved route moves everywhere at
 * once (or fails the build).
 */

export const SITE_HOST = 'horror.zazieproductions.com';
export const SITE_ORIGIN = `https://${SITE_HOST}`;

export const SITE_NAME = 'Zazie Productions';
export const AUTHOR_NAME = 'Zazie Kanwar-Torge';
export const STUDIO_NAME = 'Zazie Productions LLC';

/** The entity @ids every item page references instead of re-declaring. */
export const PERSON_ID = `${SITE_ORIGIN}/#person`;
export const ORG_ID = `${SITE_ORIGIN}/#org`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

/** Anchor id fragments used on every generated page, kept together. */
export function anchorId(path: string, anchor: string): string {
  return `${SITE_ORIGIN}${path}#${anchor}`;
}

/**
 * Absolute URL for a route path or asset path.
 * `/` stays `https://host/`; every other path keeps the exact form it is served
 * at (no trailing slash, no `.html`).
 */
export function url(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (path === '' || path === '/') return `${SITE_ORIGIN}/`;
  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

/** `Work` / `Showreel` / `Catalogue` labels for the third breadcrumb step. */
export function hubLabel(hubPath: string): string {
  switch (hubPath) {
    case '/work':
      return 'Selected productions';
    case '/reel':
      return 'Showreel';
    case '/store':
      return 'Catalogue';
    default:
      return hubPath.replace(/^\//, '');
  }
}

/** Path form of `title` for slugs that are not fixed in the data. */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/** ISO-8601 duration for a JSON-LD payload (`PT1M12S`). */
export function isoDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const parts = [hours ? `${hours}H` : '', minutes ? `${minutes}M` : '', seconds || (!hours && !minutes) ? `${seconds}S` : ''];
  return `PT${parts.join('')}`;
}

/** Minutes-and-seconds display form, `1m 12s`. */
export function displayDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escape for an XML text node or attribute. */
export function escapeXml(value: string): string {
  return escapeHtml(value).replace(/'/g, '&apos;');
}

/** Render a `<script type="application/ld+json">` block. */
export function jsonLdScript(payload: unknown): string {
  const body = JSON.stringify(payload, null, 2);
  return `<script type="application/ld+json">\n${body}\n</script>`;
}

/** Collapse whitespace so a description is one clean line in the head. */
export function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** The site-wide robots directive every indexable route ships. */
export const INDEXABLE_ROBOTS =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

/** Trim a description to a length a SERP will actually render. */
export function clamp(value: string, max: number): string {
  const clean = oneLine(value);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : cut.length).replace(/[.,;:]$/, '')}…`;
}
