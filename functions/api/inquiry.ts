/**
 * functions/api/inquiry.ts
 * ----------------------------------------------------------------------------
 * Cloudflare Pages Function for POST /api/inquiry — the same-origin capture
 * for the scoring inquiry form.
 *
 * WHY THIS EXISTS
 *
 * Until 2026-11-14 the form built a `mailto:` handoff in the visitor's own mail
 * client and the site stored nothing. That is fine on a desktop with a mail
 * client configured and useless on most phones: the visitor presses submit,
 * nothing opens, and the inquiry is lost with no trace on either side. The
 * owner chose same-origin capture: the form posts here, the row lands in the
 * site's own D1 database, and the visitor sees a confirmation. The `mailto:`
 * handoff stays as the fallback when this endpoint cannot be reached
 * (src/inquiry/main.ts).
 *
 * Staying on this origin is deliberate. No third-party form service, no
 * tracker, no cookie: the CSP needs no new origin (connect-src 'self' and
 * form-action 'self' already cover it), and /privacy says plainly that an
 * inquiry is now transmitted and stored so it can be answered.
 *
 * RULES THAT MATTER HERE
 *
 *   - Server-side validation is the only validation that counts. The browser's
 *     checks in src/inquiry/main.ts are a courtesy to the visitor.
 *   - The option lists and the minute/cue ceilings are imported from
 *     src/data/commission.ts, so the form and this endpoint cannot drift.
 *   - A submitted email address is never echoed back, in an error message or
 *     anywhere else: a bad address is a field name, not a value.
 *   - The body is capped, unexpected fields are rejected, and a filled
 *     honeypot field ("website") returns success without writing anything, so
 *     a bot learns nothing about whether it was caught.
 *   - No PII is logged. A failed insert logs the error only.
 *
 * The D1 binding is `DB` (see wrangler.toml); the table is created by
 * migrations/0001_inquiries.sql.
 */

import {
  BUDGET_RANGES,
  COMPLEXITY_OPTIONS,
  FORMATS,
  LICENCE_OPTIONS,
  MAX_CUES,
  MAX_MINUTES_INPUT,
} from '../../src/data/commission';

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

/** An inquiry as it is stored. Every field except name and email is optional. */
interface Inquiry {
  name: string;
  email: string;
  project: string;
  budget: string;
  tone: string;
  format: string;
  minutes: string;
  cues: string;
  deadline: string;
  complexity: string;
  licence: string;
  link: string;
  notes: string;
}

type FieldErrors = Partial<Record<keyof Inquiry | 'website', string>>;

/* ------------------------------------------------------------------ limits */

/** 32 KB is far more than any honest inquiry; the largest field caps at 5000. */
const MAX_BODY_BYTES = 32 * 1024;

const MAX = {
  name: 200,
  email: 254,
  project: 200,
  budget: 60,
  tone: 2000,
  format: 60,
  minutes: 120,
  cues: 120,
  deadline: 120,
  complexity: 60,
  licence: 60,
  link: 500,
  notes: 5000,
} as const;

/** The exact field set the form may send. Anything else is rejected. */
const FIELDS = Object.keys(MAX) as (keyof typeof MAX)[];

/** The honeypot: a real visitor never sees it, so a filled one is a bot. */
const HONEYPOT = 'website';

/** Same pattern as src/inquiry/main.ts — deliberately loose. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const COMPLEXITY_IDS: readonly string[] = COMPLEXITY_OPTIONS.map((option) => option.id);
const LICENCE_IDS: readonly string[] = LICENCE_OPTIONS.map((option) => option.id);

/* -------------------------------------------------------------- responses */

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
} as const;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/* ------------------------------------------------------------- validation */

function clean(raw: unknown, max: number): string {
  if (typeof raw !== 'string') return '';
  // Control characters out; newlines stay legal (the notes field needs them).
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

/**
 * Scored minutes and cue counts arrive as free text from the homepage form
 * ("e.g. 3 scored minutes") and as a number from the structured form. A value
 * that is all digits must sit inside the published bounds; anything else is
 * kept as the visitor wrote it, length-capped, rather than rejected — the
 * ceiling is there to stop absurd input, not to argue with a visitor who typed
 * "about 12 minutes of score".
 */
function boundedCount(value: string, min: number, max: number, label: string): string | null {
  if (value === '') return '';
  if (/^\d+$/.test(value)) {
    const n = Number(value);
    if (n < min || n > max) return null;
    return String(n);
  }
  if (label === 'minutes' && value.length > MAX.minutes) return null;
  if (label === 'cues' && value.length > MAX.cues) return null;
  return value;
}

function oneOf(value: string, allowed: readonly string[]): boolean {
  return value === '' || allowed.includes(value);
}

function validate(raw: Record<string, unknown>): { ok: true; value: Inquiry } | { ok: false; fields: FieldErrors } {
  const fields: FieldErrors = {};

  for (const key of Object.keys(raw)) {
    if (key !== HONEYPOT && !(FIELDS as string[]).includes(key)) {
      // A field the form does not have: refuse the payload rather than guess.
      return { ok: false, fields: {} };
    }
  }

  const name = clean(raw.name, MAX.name);
  if (!name) fields.name = 'Please add your name.';

  const email = clean(raw.email, MAX.email).toLowerCase();
  if (!email) fields.email = 'Please add an email address so the studio can reply.';
  else if (email.length > MAX.email) fields.email = 'That email address is too long.';
  else if (!EMAIL_PATTERN.test(email)) fields.email = 'That does not look like an email address.';

  const project = clean(raw.project, MAX.project);
  const budget = clean(raw.budget, MAX.budget);
  if (!oneOf(budget, BUDGET_RANGES)) fields.budget = 'Please choose one of the listed budget ranges.';

  const tone = clean(raw.tone, MAX.tone);
  const format = clean(raw.format, MAX.format);
  if (!oneOf(format, FORMATS)) fields.format = 'Please choose one of the listed formats.';

  const minutes = boundedCount(clean(raw.minutes, MAX.minutes), 1, MAX_MINUTES_INPUT, 'minutes');
  if (minutes === null) fields.minutes = `Scored music is whole minutes from 1 to ${MAX_MINUTES_INPUT}, or blank.`;

  const cues = boundedCount(clean(raw.cues, MAX.cues), 0, MAX_CUES, 'cues');
  if (cues === null) fields.cues = `Cues are a whole number from 0 to ${MAX_CUES}, or blank.`;

  const deadline = clean(raw.deadline, MAX.deadline);

  const complexity = clean(raw.complexity, MAX.complexity);
  if (!oneOf(complexity, COMPLEXITY_IDS)) fields.complexity = 'Please choose one of the listed complexity options.';

  const licence = clean(raw.licence, MAX.licence);
  if (!oneOf(licence, LICENCE_IDS)) fields.licence = 'Please choose one of the listed licence options.';

  const link = clean(raw.link, MAX.link);
  if (link && !/^https?:\/\//i.test(link)) fields.link = 'Please send a full link, starting with http:// or https://.';

  const notes = clean(raw.notes, MAX.notes);

  if (Object.keys(fields).length > 0) return { ok: false, fields };

  return {
    ok: true,
    value: {
      name,
      email,
      project,
      budget,
      tone,
      format,
      minutes: minutes ?? '',
      cues: cues ?? '',
      deadline,
      complexity,
      licence,
      link,
      notes,
    },
  };
}

/* --------------------------------------------------------------- the route */

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return json(405, {
      ok: false,
      error: 'method_not_allowed',
      message: 'Send the inquiry form with POST.',
    });
  }

  const declared = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return json(413, { ok: false, error: 'too_large', message: 'That inquiry is too long to send.' });
  }

  let raw: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return json(413, { ok: false, error: 'too_large', message: 'That inquiry is too long to send.' });
    }
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return json(400, { ok: false, error: 'invalid_body', message: 'The form could not be read.' });
    }
    raw = parsed as Record<string, unknown>;
  } catch {
    return json(400, { ok: false, error: 'invalid_body', message: 'The form could not be read.' });
  }

  // A bot that fills the invisible field gets the same answer a visitor does,
  // and nothing is written.
  if (clean(raw[HONEYPOT], 200) !== '') {
    return json(201, { ok: true });
  }

  const result = validate(raw);
  if (!result.ok) {
    return json(400, {
      ok: false,
      error: 'validation_failed',
      message: 'Some details need a second look.',
      fields: result.fields,
    });
  }

  if (!env.DB) {
    // No binding: say so plainly rather than pretending to save. The form falls
    // back to the mailto handoff on this response.
    return json(503, { ok: false, error: 'unavailable', message: 'The inquiry could not be saved just now.' });
  }

  const value = result.value;
  const cf = (request as Request & { cf?: { country?: string } }).cf;
  const userAgent = clean(request.headers.get('user-agent') ?? '', 400);
  const country = clean(cf?.country ?? '', 8);

  try {
    await env.DB.prepare(
      `INSERT INTO inquiries
         (name, email, project, budget, tone, format, minutes, cues, deadline, complexity, licence, link, notes, user_agent, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        value.name,
        value.email,
        value.project,
        value.budget,
        value.tone,
        value.format,
        value.minutes,
        value.cues,
        value.deadline,
        value.complexity,
        value.licence,
        value.link,
        value.notes,
        userAgent,
        country,
      )
      .run();
  } catch (error) {
    // No submitted value is logged, and no email address is logged either.
    console.error('[inquiry] insert failed:', error instanceof Error ? error.message : 'unknown error');
    return json(500, { ok: false, error: 'insert_failed', message: 'The inquiry could not be saved just now.' });
  }

  return json(201, { ok: true });
}
