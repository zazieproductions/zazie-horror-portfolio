/**
 * tools/headers.mjs
 * ----------------------------------------------------------------------------
 * One source of truth for the HTTP response policy this site ships.
 *
 * Two things have to agree about headers:
 *
 *   _headers    what Cloudflare Pages applies at the edge (production)
 *   server.mjs  what the local mirror applies (dev + the local route audit)
 *
 * When they disagree, the site behaves one way locally and another way live,
 * and a header regression ships silently. So the security policy and the
 * cache policy live here, both consumers import them, and
 * tools/check-headers.mjs fails the build if `_headers` drifts from this file.
 *
 * No dependencies.
 */

/**
 * Security headers sent on every response. `_headers` must carry these exact
 * values in its `/*` block; server.mjs sends them from this object.
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  // Legacy clickjacking defence, still honoured by every current browser.
  // CSP `frame-ancestors` below is the modern control; both are sent.
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  // Two years, subdomains, preload-eligible. Only meaningful over HTTPS, which
  // is the only scheme Cloudflare Pages serves; the local mirror is HTTP, so it
  // does not send HSTS (a browser would then refuse plain-http localhost).
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    // The app is a prerendered React bundle plus small inline bootstraps and
    // JSON-LD blocks, so inline script is allowed; no eval. Exactly one remote
    // script is allowed: Cloudflare's Web Analytics beacon, allowlisted by
    // host (its injected URL carries a version path, /beacon.min.js/v..., so
    // a path-scoped source would not match it) - see ANALYTICS_ORIGINS below.
    "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "media-src 'self' https:",
    "font-src 'self'",
    'frame-src https://www.youtube.com https://www.youtube-nocookie.com https://drive.google.com https://docs.google.com https://bandcamp.com',
    // 'self' covers the auto-injected beacon's same-origin report to
    // /cdn-cgi/rum; cloudflareinsights.com covers the cross-origin form of
    // the same endpoint. Those are the only remote connections allowed.
    "connect-src 'self' https://cloudflareinsights.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' mailto:",
    // Legacy equivalent of X-Frame-Options: SAMEORIGIN, for browsers that
    // implement CSP but not the header.
    "frame-ancestors 'self'",
    'upgrade-insecure-requests',
  ].join('; '),
  'X-DNS-Prefetch-Control': 'on',
};

/**
 * The one third-party service this site allows on purpose, with the directive
 * that has to keep allowing each origin - and no other remote origin.
 *
 * Cloudflare injects its Web Analytics beacon (`static.cloudflareinsights.com/
 * beacon.min.js`) into the HTML it serves. The tag is not in this repository
 * and cannot be added or removed by a build step - the rewrite happens at the
 * edge, after the upload. Since 26 October 2026 the site lets it run instead
 * of refusing it: the beacon is cookieless, stores nothing in the browser and
 * does not fingerprint visitors (per Cloudflare's RUM beacon documentation);
 * it reports page-load timing and Core Web Vitals, same-origin to
 * /cdn-cgi/rum for proxied sites ('self' already covers that) or to
 * https://cloudflareinsights.com/cdn-cgi/rum in its cross-origin form.
 *
 * Allowing it was a copy change first: /privacy sections 1, 3, 4, 6, 8, 9 and
 * 13, the FAQ tracking answer and the privacy summaries on /legal and /sitemap
 * now disclose the beacon instead of claiming no analytics and no third-party
 * script. tools/check-headers.mjs fails the build if either origin below is
 * dropped (the console CSP error and the dead analytics return) or if any
 * other remote script-src / connect-src origin is added without this list
 * changing too. To stop collecting entirely, turn off Web Analytics in the
 * Cloudflare dashboard AND remove both origins here in the same change.
 */
export const ANALYTICS_ORIGINS = [
  { origin: 'https://static.cloudflareinsights.com', directive: 'script-src' },
  { origin: 'https://cloudflareinsights.com', directive: 'connect-src' },
];

/** Headers that are HTTPS-only and therefore not sent by the HTTP local mirror. */
export const HTTPS_ONLY = new Set(['Strict-Transport-Security']);

/** Immutable, content-hashed bundles emitted by the build (`name-<hash8>.css`). */
const HASHED_ASSET = /\/(?:index|store|legal|estimator|item|reel-download)-[0-9a-f]{8}\.(?:css|js)$/i;

export const HTML_CACHE = 'public, max-age=0, must-revalidate';
export const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';
export const MEDIA_CACHE = 'public, max-age=2592000, stale-while-revalidate=86400';
export const DOC_CACHE = 'public, max-age=3600';

/**
 * The Cache-Control value for a request path, matching the rules in _headers.
 * Long-lived only for URLs whose contents can never change under that name.
 */
export function cacheControlFor(pathname, { html = false } = {}) {
  const p = pathname || '/';
  if (p === '/404.html') return 'no-store';
  // The root is a document by definition.
  if (p === '/') return HTML_CACHE;
  // Directory routes (/work, /work/) carry no extension but are still
  // documents: the resolved file decides, not the URL shape.
  if (html) return HTML_CACHE;
  if (p === '/sw.js') return 'no-cache, no-store, must-revalidate';
  if (/\.(?:html)$/i.test(p)) return HTML_CACHE;
  if (HASHED_ASSET.test(p)) return IMMUTABLE_CACHE;
  if (/^\/(?:fonts)\//.test(p)) return IMMUTABLE_CACHE;
  if (/^\/(?:images|audio)\//.test(p)) return MEDIA_CACHE;
  if (/^\/(?:sitemap\.xml|robots\.txt|llms\.txt|llms-full\.txt)$/.test(p)) return DOC_CACHE;
  if (/\/(?:sitemap\.xml|robots\.txt|llms\.txt|llms-full\.txt)$/.test(p)) return DOC_CACHE;
  return DOC_CACHE;
}

/** Everything a response carries, minus HSTS when the request is plain HTTP. */
export function headersFor(pathname, { https = true, html = false } = {}) {
  const headers = {};
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!https && HTTPS_ONLY.has(name)) continue;
    headers[name] = value;
  }
  headers['Cache-Control'] = cacheControlFor(pathname, { html });
  return headers;
}

/**
 * Parse a Cloudflare Pages `_headers` file into ordered rules.
 * Each rule is `{ pattern, set: [{ name, value }], detach: [name] }` in file
 * order, because the host applies every matching rule top to bottom and joins
 * repeated headers with a comma.
 */
export function parseHeadersFile(text) {
  const rules = [];
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    if (!/^\s/.test(raw) && !/^[A-Za-z0-9-]+:/.test(line) && !line.startsWith('!')) {
      current = { pattern: line, set: [], detach: [] };
      rules.push(current);
      continue;
    }
    if (!current) continue;
    const detach = /^!\s*([A-Za-z0-9-]+)$/.exec(line);
    if (detach) {
      current.detach.push(detach[1].toLowerCase());
      continue;
    }
    const match = /^([A-Za-z0-9-]+):\s*(.*)$/.exec(line);
    if (match) current.set.push({ name: match[1].toLowerCase(), value: match[2].trim() });
  }
  return rules;
}

/**
 * The headers a request for `pathname` would actually receive, reproducing
 * Cloudflare Pages' semantics: apply matching rules in file order, detach
 * removes what earlier rules added, and repeated values are comma-joined.
 * This is what catches "the specific rule looks right but the glob already set
 * the header" regressions.
 */
export function effectiveHeaders(rules, pathname) {
  const acc = new Map();
  for (const rule of rules) {
    if (!matches(rule.pattern, pathname)) continue;
    for (const name of rule.detach) acc.delete(name);
    for (const { name, value } of rule.set) {
      acc.set(name, acc.has(name) ? `${acc.get(name)}, ${value}` : value);
    }
  }
  return acc;
}

/** Effective Cache-Control for a path, as the host would serve it. */
export function declaredCacheFor(rules, pathname) {
  return effectiveHeaders(rules, pathname).get('cache-control') ?? null;
}

/** Effective value for one header name, as the host would serve it. */
export function declaredHeaderFor(rules, pathname, name) {
  return effectiveHeaders(rules, pathname).get(name.toLowerCase()) ?? null;
}

/** Cloudflare Pages path patterns: `*` wildcard and `:placeholder` splats. */
export function matches(pattern, pathname) {
  if (pattern === pathname) return true;
  if (!pattern.includes('*') && !pattern.includes(':')) return false;
  const source = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/:[A-Za-z0-9_]+/g, '.*')
    .replace(/\*/g, '.*');
  return new RegExp(`^${source}$`).test(pathname);
}
