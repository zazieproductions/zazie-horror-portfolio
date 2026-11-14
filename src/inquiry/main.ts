/**
 * src/inquiry/main.ts
 * ----------------------------------------------------------------------------
 * Browser behaviour for the scoring inquiry form.
 *
 * CHANGED 2026-11-14: the form now posts to the site's own origin
 * (POST /api/inquiry, functions/api/inquiry.ts), which stores the inquiry in
 * D1 and answers with `{ ok: true }`. The visitor sees an in-page
 * confirmation instead of being handed to a mail client that most phones do
 * not have configured.
 *
 * What has NOT changed: the `mailto:` handoff. It is still the form's action
 * for a visitor without JavaScript, and it is still what runs when the
 * endpoint cannot be reached at all (network failure, 5xx, 503 because the
 * database binding is missing). An inquiry is never dropped on the floor with
 * a dead end; at worst the visitor gets the old behaviour back.
 *
 * The homepage contact form is rendered by the prebuilt React bundle, whose
 * source is not in this repository (see AGENTS.md). Its submit handler is
 * intercepted here, in the capture phase, so the same endpoint serves both
 * forms; the mapping from its field names to the inquiry's is HOMEPAGE_FIELDS.
 *
 * Design rules:
 *   - No storage, no cookies, no analytics. One same-origin request per
 *     submission, and nothing is kept in the browser.
 *   - The visitor states their own budget range and musical references; the
 *     script never suggests a figure back to them.
 *   - Event delegation on the document, so the form also works if it is
 *     ever rendered inside a late-loading island.
 *   - Without JavaScript, the form's mailto action and the direct email
 *     link on the page still stand.
 */

import { MAX_CUES, MAX_MINUTES_INPUT } from '../data/commission.js';
import { INQUIRY_EMAIL } from '../lib/commission-markup.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Same-origin. The CSP already allows this (connect-src 'self'). */
const INQUIRY_ENDPOINT = '/api/inquiry';

/** How long to wait before giving up and falling back to the mail handoff. */
const REQUEST_TIMEOUT_MS = 12_000;

/** The stored shape. Every field except name and email may be blank. */
interface InquiryPayload {
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

type SubmitOutcome =
  | { kind: 'saved' }
  | { kind: 'invalid'; message: string }
  | { kind: 'unreachable' };

function whole(raw: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return n >= min && n <= max ? n : null;
}

/* ----------------------------------------------------------- inquiry form */

function setField(form: HTMLFormElement, name: string, value: string): boolean {
  const field = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
  if (!field) return false;
  if (field instanceof HTMLSelectElement) {
    const option = Array.from(field.options).find((o) => o.value === value);
    if (!option) return false;
    field.value = value;
  } else {
    field.value = value;
  }
  return true;
}

/**
 * Fill the homepage inquiry from /?format=…&min=… style deep links, so a page
 * can hand over whatever scope it already knows. Unknown or out-of-range
 * values are ignored rather than echoed.
 */
function prefillInquiry(form: HTMLFormElement): void {
  const params = new URLSearchParams(window.location.search);
  let usedOptionalDetail = false;

  if (params.get('format')) setField(form, 'format', params.get('format') ?? '');
  if (params.get('budget')) setField(form, 'budget', params.get('budget') ?? '');

  const minutes = whole(params.get('min') ?? '', 1, MAX_MINUTES_INPUT);
  if (minutes !== null) usedOptionalDetail = setField(form, 'min', String(minutes)) || usedOptionalDetail;
  const cues = whole(params.get('cues') ?? '', 0, MAX_CUES);
  if (cues !== null) usedOptionalDetail = setField(form, 'cues', String(cues)) || usedOptionalDetail;
  if (params.get('cx')) usedOptionalDetail = setField(form, 'cx', params.get('cx') ?? '') || usedOptionalDetail;
  if (params.get('lic')) usedOptionalDetail = setField(form, 'lic', params.get('lic') ?? '') || usedOptionalDetail;

  if (usedOptionalDetail) {
    const moreDetails = form.querySelector<HTMLDetailsElement>('[data-zp-inquiry-details]');
    if (moreDetails) moreDetails.open = true;
  }
}

function textOf(form: HTMLFormElement, name: string): string {
  const field = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
  if (!field) return '';
  if (field instanceof HTMLSelectElement) return field.options[field.selectedIndex]?.text ?? '';
  return field.value.trim();
}

/** The select's value, not its label: budget and format submit their labels
 *  as values, complexity and licence submit stable ids. */
function valueOf(form: HTMLFormElement, name: string): string {
  const field = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
  return field ? field.value.trim() : '';
}

function inquiryBody(form: HTMLFormElement): string {
  const get = (name: string) => textOf(form, name);
  const minutes = get('min');
  const cues = get('cues');
  return [
    `Name: ${get('name')}`,
    `Email: ${get('email')}`,
    `Project: ${get('project') || 'Not named yet'}`,
    `Format: ${get('format') || 'Not sure yet'}`,
    `Music budget: ${get('budget') || 'Not sure yet'}`,
    '',
    'Musical references:',
    get('tone') || '(none given)',
    '',
    `Scored music: ${minutes ? `${minutes} minutes (music, not film runtime)` : 'to advise'}`,
    `Cues: ${cues || 'not sure yet'}`,
    `Delivery or picture lock: ${get('deadline') || 'not set'}`,
    `Musical complexity: ${get('cx') || 'Not sure yet'}`,
    `Licence expected: ${get('lic') || 'Not sure yet'}`,
    `Rough cut or scene link: ${get('link') || '(none)'}`,
    '',
    'Notes:',
    get('notes') || '(none)',
    '',
    'Scope: an original score composed to picture. Not sound design or foley unless I have said so above.',
    'Please reply with a written, nonbinding quote.',
  ].join('\n');
}

function validateInquiry(form: HTMLFormElement): string[] {
  const problems: string[] = [];
  const mark = (name: string, bad: boolean) => {
    const field = form.elements.namedItem(name) as HTMLElement | null;
    if (field) field.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return bad;
  };
  if (mark('name', !textOf(form, 'name'))) problems.push('Please add your name.');
  if (mark('email', !EMAIL_PATTERN.test(textOf(form, 'email')))) problems.push('Please add a valid email address.');
  mark('project', false);
  const min = textOf(form, 'min');
  if (mark('min', Boolean(min) && whole(min, 1, MAX_MINUTES_INPUT) === null)) {
    problems.push(`Scored music is whole minutes from 1 to ${MAX_MINUTES_INPUT}, or blank.`);
  }
  const cues = textOf(form, 'cues');
  if (mark('cues', Boolean(cues) && whole(cues, 0, MAX_CUES) === null)) {
    problems.push(`Cues are a whole number from 0 to ${MAX_CUES}, or blank.`);
  }
  return problems;
}

function payloadFromForm(form: HTMLFormElement): InquiryPayload {
  return {
    name: textOf(form, 'name'),
    email: textOf(form, 'email'),
    project: textOf(form, 'project'),
    budget: valueOf(form, 'budget'),
    tone: textOf(form, 'tone'),
    format: valueOf(form, 'format'),
    minutes: textOf(form, 'min'),
    cues: textOf(form, 'cues'),
    deadline: textOf(form, 'deadline'),
    complexity: valueOf(form, 'cx'),
    licence: valueOf(form, 'lic'),
    link: textOf(form, 'link'),
    notes: textOf(form, 'notes'),
  };
}

function mailtoHref(subject: string, body: string): string {
  return `mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function showError(form: HTMLFormElement, message: string): void {
  const error = form.querySelector<HTMLElement>('[data-zp-error]');
  if (!error) return;
  error.hidden = false;
  error.textContent = message;
}

function hideError(form: HTMLFormElement): void {
  const error = form.querySelector<HTMLElement>('[data-zp-error]');
  if (error) error.hidden = true;
}

/* -------------------------------------------------------------- transport */

/** POST the inquiry to our own origin. Nothing is stored in the browser. */
async function sendInquiry(payload: InquiryPayload): Promise<SubmitOutcome> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(INQUIRY_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
      credentials: 'omit',
      cache: 'no-store',
    });

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    const data = (typeof body === 'object' && body !== null ? body : {}) as {
      ok?: boolean;
      message?: string;
      fields?: Record<string, string>;
    };

    if (response.ok && data.ok === true) return { kind: 'saved' };

    // A 4xx with per-field errors is the visitor's to fix: show it, do not
    // hand them to a mail client with the same mistake in it.
    if (response.status === 400 && data.fields) {
      const messages = Object.values(data.fields).filter((m): m is string => typeof m === 'string' && m !== '');
      return { kind: 'invalid', message: messages.join(' ') || 'Some details need a second look.' };
    }
    if (response.status === 413) {
      return { kind: 'invalid', message: 'That inquiry is too long to send. Please shorten it a little.' };
    }
    // 5xx, 503 (no database yet), or anything unexpected: fall back.
    return { kind: 'unreachable' };
  } catch {
    // Offline, blocked, timed out: fall back.
    return { kind: 'unreachable' };
  } finally {
    window.clearTimeout(timer);
  }
}

function setBusy(form: HTMLFormElement, busy: boolean): void {
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!button) return;
  button.disabled = busy;
  if (busy) {
    button.dataset.zpLabel = button.textContent ?? '';
    button.textContent = 'Sending…';
  } else if (button.dataset.zpLabel !== undefined) {
    button.textContent = button.dataset.zpLabel;
    delete button.dataset.zpLabel;
  }
}

/** The in-page confirmation for the structured form. */
function confirmOnPage(form: HTMLFormElement, payload: InquiryPayload): void {
  hideError(form);
  const preview = form.querySelector<HTMLElement>('[data-zp-preview]');
  if (preview) preview.hidden = true;
  const confirmed = form.querySelector<HTMLElement>('[data-zp-confirmed]');
  if (confirmed) {
    confirmed.hidden = false;
    confirmed.querySelector<HTMLElement>('[data-zp-confirmed-text]')?.replaceChildren(
      document.createTextNode(
        `Your inquiry is in. It has been sent to the studio and saved, and Zazie will reply to ${payload.email} by email.`,
      ),
    );
    confirmed.scrollIntoView({ block: 'nearest' });
  }
}

async function handleInquirySubmit(event: Event, form: HTMLFormElement): Promise<void> {
  event.preventDefault();
  const problems = validateInquiry(form);
  if (problems.length) {
    showError(form, problems.join(' '));
    form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    return;
  }
  hideError(form);

  const payload = payloadFromForm(form);
  setBusy(form, true);
  const outcome = await sendInquiry(payload);
  setBusy(form, false);

  if (outcome.kind === 'saved') {
    confirmOnPage(form, payload);
    return;
  }
  if (outcome.kind === 'invalid') {
    showError(form, outcome.message);
    return;
  }

  // Unreachable: the old behaviour, kept whole. The composed message is shown
  // so it can be copied even if no mail client opens.
  const body = inquiryBody(form);
  const project = textOf(form, 'project');
  const format = textOf(form, 'format');
  const subjectLabel = project || (format && format !== 'Not sure yet' ? format : '');
  const subject = subjectLabel ? `Scoring inquiry: ${subjectLabel}` : 'Scoring inquiry';
  const preview = form.querySelector<HTMLElement>('[data-zp-preview]');
  const text = form.querySelector<HTMLTextAreaElement>('[data-zp-text]');
  if (preview) preview.hidden = false;
  if (text) text.value = body;
  showError(
    form,
    'The studio’s form could not be reached just now, so nothing was saved. Your email app is opening with the same message; if it does not, copy the text below and send it to ' +
      `${INQUIRY_EMAIL}.`,
  );
  window.location.href = mailtoHref(subject, body);
  preview?.scrollIntoView({ block: 'nearest' });
}

/* ------------------------------------------------ homepage contact form */

/**
 * The homepage contact form comes from the prebuilt React bundle, which has
 * no source in this repository (AGENTS.md). Its own submit handler builds a
 * mailto link; we intercept the submit in the capture phase, before the
 * bundle's handler on the React root sees it, and send the same inquiry here
 * instead. If the endpoint is unreachable, the mail handoff runs from here
 * instead, so the visitor still gets the old behaviour rather than a dead end.
 */
const HOMEPAGE_FIELDS: readonly (readonly [string, keyof InquiryPayload])[] = [
  ['your-name', 'name'],
  ['your-email', 'email'],
  ['project-title', 'project'],
  ['budget', 'budget'],
  ['theme-tone', 'tone'],
  ['format', 'format'],
  ['scored-minutes-music-not-film-length', 'minutes'],
  ['picture-lock-deadline', 'deadline'],
  ['message', 'notes'],
];

function isHomepageContactForm(form: HTMLFormElement): boolean {
  return !form.matches('[data-zp-inquiry]') && form.querySelector('[name="your-name"]') !== null;
}

function payloadFromHomepage(form: HTMLFormElement): InquiryPayload {
  const payload: InquiryPayload = {
    name: '',
    email: '',
    project: '',
    budget: '',
    tone: '',
    format: '',
    minutes: '',
    cues: '',
    deadline: '',
    complexity: '',
    licence: '',
    link: '',
    notes: '',
  };
  const data = new FormData(form);
  for (const [field, key] of HOMEPAGE_FIELDS) {
    const raw = data.get(field);
    payload[key] = typeof raw === 'string' ? raw.trim() : '';
  }
  return payload;
}

function homepageStatus(form: HTMLFormElement): HTMLElement {
  const existing = form.parentElement?.querySelector<HTMLElement>('[data-zp-home-status]');
  if (existing) return existing;
  const status = document.createElement('p');
  status.className = 'zp-help zp-inq-confirmed';
  status.setAttribute('data-zp-home-status', '');
  status.setAttribute('role', 'status');
  form.insertAdjacentElement('afterend', status);
  return status;
}

function homepageBody(payload: InquiryPayload): string {
  return [
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Project: ${payload.project || 'Not named yet'}`,
    `Format: ${payload.format || 'Not sure yet'}`,
    `Music budget: ${payload.budget || 'Not sure yet'}`,
    `Theme / tone: ${payload.tone || 'Not sure yet'}`,
    `Scored music: ${payload.minutes || 'to advise'}`,
    `Delivery or picture lock: ${payload.deadline || 'not set'}`,
    '',
    'Additional details:',
    payload.notes || '(none)',
    '',
    'Please reply with a written, nonbinding quote.',
  ].join('\n');
}

async function submitHomepageInquiry(form: HTMLFormElement): Promise<void> {
  const payload = payloadFromHomepage(form);
  const status = homepageStatus(form);
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (button) button.disabled = true;
  status.textContent = 'Sending…';

  const outcome = await sendInquiry(payload);
  if (button) button.disabled = false;

  if (outcome.kind === 'saved') {
    status.textContent = `Your inquiry is in. It has been sent to the studio and saved, and Zazie will reply to ${payload.email} by email.`;
    return;
  }
  if (outcome.kind === 'invalid') {
    status.textContent = outcome.message;
    return;
  }

  status.textContent = `The studio’s form could not be reached just now, so nothing was saved. Your email app is opening with the same message; if it does not, write to ${INQUIRY_EMAIL}.`;
  const subject = payload.project ? `Scoring inquiry: ${payload.project}` : 'Scoring inquiry';
  window.location.href = mailtoHref(subject, homepageBody(payload));
}

/* ------------------------------------------------------------------ copy */

async function copyText(button: HTMLElement): Promise<void> {
  const form = button.closest<HTMLFormElement>('[data-zp-inquiry]');
  const text = form?.querySelector<HTMLTextAreaElement>('[data-zp-text]');
  const status = form?.querySelector<HTMLElement>('[data-zp-copied]');
  if (!text) return;
  let copied = false;
  try {
    await navigator.clipboard.writeText(text.value);
    copied = true;
  } catch {
    text.focus();
    text.select();
    copied = document.execCommand?.('copy') ?? false;
  }
  if (status) status.textContent = copied ? 'Copied.' : 'Select the text and copy it manually.';
}

/* ------------------------------------------------------------- wiring */

function onSubmit(event: Event): void {
  const form = event.target as HTMLFormElement | null;
  if (!form) return;
  if (form.matches('[data-zp-inquiry]')) void handleInquirySubmit(event, form);
}

/**
 * Capture phase: the homepage form's bundle handler is attached at the React
 * root, below the document, so stopping the event here keeps the bundle from
 * navigating to its mailto link while we post the inquiry instead.
 */
function onCaptureSubmit(event: Event): void {
  const form = event.target as HTMLFormElement | null;
  if (!form || !isHomepageContactForm(form)) return;
  event.preventDefault();
  event.stopPropagation();
  void submitHomepageInquiry(form);
}

function onClick(event: Event): void {
  const button = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-zp-copy]');
  if (button) void copyText(button);
}

function init(): void {
  document.addEventListener('submit', onSubmit);
  document.addEventListener('submit', onCaptureSubmit, true);
  document.addEventListener('click', onClick);
  const inquiry = document.querySelector<HTMLFormElement>('[data-zp-inquiry]');
  if (inquiry) prefillInquiry(inquiry);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
