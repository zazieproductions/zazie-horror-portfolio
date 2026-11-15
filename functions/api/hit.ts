/**
 * functions/api/hit.ts
 * ----------------------------------------------------------------------------
 * Cloudflare Pages Function for POST /api/hit — the site's own page-view
 * counter, the thing that answers "which pages are looked at" without asking a
 * third party and without following anybody.
 *
 * WHAT IS STORED, AND WHAT IS NOT
 *
 * One row per page view, holding exactly three things:
 *
 *   path           the path of the page that was loaded ("/reel/salt-wife")
 *   referrer_host  the host of the page that linked to it ("letterboxd.com"),
 *                  or '' when the visitor arrived directly
 *   created_at     the time the row was written
 *
 * No IP address is read, stored or derived from. No cookie is set, no
 * identifier is minted, no user-agent or country is kept, and no attempt is
 * made to tell one visitor from another: these are counts per page, not
 * people. The client (hit.js) reduces the referring page to its host before
 * sending, so the full address of the page a visitor came from never leaves
 * their browser; this endpoint re-checks that and refuses anything else.
 *
 * The request body is JSON with exactly the fields `path` and `referrer`.
 * Anything else is rejected, so the endpoint cannot be used as an open write
 * target for whatever a caller feels like storing.
 *
 * RESPONSES
 *
 *   204  stored, or deliberately not stored (see below)
 *   400  body is not the shape above
 *   405  anything other than POST
 *   413  body over the cap
 *
 * A counter that fails is not worth a visitor's attention: when the D1 binding
 * `DB` is absent (the owner has not created the database yet, see
 * wrangler.toml) or an insert throws, this answers 204 and logs the error
 * server-side rather than surfacing a failure to the browser. The page-view
 * simply is not counted, and nothing about the visit is kept.
 *
 * The table is created by migrations/0002_hits.sql.
 */

/* ------------------------------------------------------------------- types */

/** The subset of the D1 API this endpoint uses. Kept local: the repository
 *  takes no runtime or type dependencies. */
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface Env {
  DB?: D1Database;
}

interface PagesContext {
  request: Request;
  env: Env;
}

/* ------------------------------------------------------------------ limits */

/** A page view is two short strings; 1 KB is generous, and a body larger than
 *  this is not a beacon. */
const MAX_BODY_BYTES = 1024;

const MAX_PATH = 512;
const MAX_HOST = 253; // the longest legal DNS name

/** The exact field set the beacon may send. Anything else is rejected. */
const FIELDS = ['path', 'referrer'] as const;

/** A bare host: letters, digits, dots and hyphens, with an optional port. */
const HOST_PATTERN = /^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?(?::\d{1,5})?$/;

/* -------------------------------------------------------------- responses */

/** 204 with nothing to cache: the beacon never reads the answer. */
function empty(status: number): Response {
  return new Response(null, { status, headers: { 'cache-control': 'no-store' } });
}

/* ------------------------------------------------------------- validation */

function readPath(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  // Query and fragment are not part of a page's identity here, and control
  // characters are not part of any path this site serves.
  const path = raw.split(/[?#]/, 1)[0].replace(/[\u0000-\u001F\u007F]/g, '');
  if (path === '' || path[0] !== '/' || path.length > MAX_PATH) return null;
  return path;
}

function readReferrer(raw: unknown): string | null {
  if (raw === undefined || raw === null || raw === '') return '';
  if (typeof raw !== 'string') return null;
  const host = raw.trim().toLowerCase();
  if (host.length > MAX_HOST) return null;
  if (!HOST_PATTERN.test(host)) return null;
  return host;
}

/* --------------------------------------------------------------- the route */

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(null, {
      status: 405,
      headers: { allow: 'POST', 'cache-control': 'no-store' },
    });
  }

  const declared = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return empty(413);
  }

  let raw: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return empty(413);
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return empty(400);
    }
    raw = parsed as Record<string, unknown>;
  } catch {
    return empty(400);
  }

  for (const key of Object.keys(raw)) {
    if (!(FIELDS as readonly string[]).includes(key)) {
      // A field the beacon does not send: refuse the payload rather than guess.
      return empty(400);
    }
  }

  const path = readPath(raw.path);
  const referrer = readReferrer(raw.referrer);
  if (path === null || referrer === null) {
    return empty(400);
  }

  if (!env.DB) {
    // No database bound yet: count nothing, say nothing. The visit is simply
    // not recorded, which is the same thing that happens to a visitor whose
    // browser blocks the request.
    return empty(204);
  }

  try {
    await env.DB.prepare('INSERT INTO hits (path, referrer_host) VALUES (?, ?)')
      .bind(path, referrer)
      .run();
  } catch (error) {
    // Nothing from the request is logged: there is nothing in it to log.
    console.error('[hit] insert failed:', error instanceof Error ? error.message : 'unknown error');
  }

  return empty(204);
}
