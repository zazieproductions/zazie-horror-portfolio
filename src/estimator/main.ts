/**
 * src/estimator/main.ts
 * ----------------------------------------------------------------------------
 * Browser behaviour for the scope estimator (/services and the homepage) and
 * the structured inquiry form (/contact). Bundled to estimator-<hash>.js by
 * scripts/build-estimator.mjs and loaded with `defer`.
 *
 * Design rules:
 *   - No network requests, no storage, no analytics. The inquiry opens the
 *     visitor's own mail client; the site never transmits what they type.
 *   - One calculation path. quote() from src/data/pricing.ts is the same
 *     function the build used to render the default state.
 *   - Event delegation on the document, so the estimator also works inside the
 *     homepage's React island, which renders after this script loads.
 *   - Without JavaScript, the server-rendered estimate and the direct email
 *     link on each page still stand.
 */

import {
  COMPLEXITY,
  DEADLINES,
  LICENCES,
  MAX_CUES,
  MAX_EXTRA_REVISION_ROUNDS,
  MAX_MINUTES_INPUT,
  quote,
  type ComplexityId,
  type DeadlineId,
  type LicenceId,
  type QuoteInput,
} from '../data/pricing.js';
import { ESTIMATOR_EMAIL, esc, estimateSummary, resultHtml } from '../lib/pricing-markup.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DASH = '\u2013';

type Read<T> = { ok: true; value: T } | { ok: false; error: string };

function whole(raw: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return n >= min && n <= max ? n : null;
}

/* ------------------------------------------------------------- estimator */

function readScope(root: HTMLElement): Read<QuoteInput> {
  const form = root.querySelector<HTMLFormElement>('[data-zp-form]');
  if (!form) return { ok: false, error: 'The estimator form could not be read. Email the studio for a quote.' };
  const data = new FormData(form);

  const minRaw = String(data.get('min') ?? '').trim();
  const minutes = whole(minRaw, 1, MAX_MINUTES_INPUT);
  if (minutes === null) {
    return { ok: false, error: `Enter the scored music in whole minutes, from 1 to ${MAX_MINUTES_INPUT}.` };
  }

  const cueRaw = String(data.get('cues') ?? '').trim();
  let cueCount: number | undefined;
  if (cueRaw) {
    const cues = whole(cueRaw, 0, MAX_CUES);
    if (cues === null) return { ok: false, error: `The number of cues must be a whole number from 0 to ${MAX_CUES}, or left blank.` };
    cueCount = cues;
  }

  const complexity = String(data.get('cx') ?? 'standard') as ComplexityId;
  const deadline = String(data.get('dl') ?? 'standard') as DeadlineId;
  const licence = String(data.get('lic') ?? 'nonexclusive') as LicenceId;
  const rounds = whole(String(data.get('rev') ?? '0'), 0, MAX_EXTRA_REVISION_ROUNDS) ?? 0;

  if (!COMPLEXITY.some((c) => c.id === complexity)) return { ok: false, error: 'Choose a musical complexity.' };
  if (!DEADLINES.some((d) => d.id === deadline)) return { ok: false, error: 'Choose a schedule.' };
  if (!LICENCES.some((l) => l.id === licence)) return { ok: false, error: 'Choose a licence.' };

  return {
    ok: true,
    value: { scoredMinutes: minutes, cueCount, complexity, deadline, extraRevisionRounds: rounds, licence },
  };
}

function renderEstimate(root: HTMLElement): void {
  const panel = root.querySelector<HTMLElement>('[data-zp-result]');
  if (!panel) return;
  const scope = readScope(root);
  if (!scope.ok) {
    panel.innerHTML = `<p class="zp-eyebrow">Check your entries</p><p class="zp-error" role="alert">${esc(scope.error)}</p>`;
    return;
  }
  panel.innerHTML = resultHtml(scope.value, quote(scope.value));
}

/* ----------------------------------------------------------- inquiry form */

function scopeFromParams(params: URLSearchParams): QuoteInput | null {
  const minutes = whole(params.get('min') ?? '', 1, MAX_MINUTES_INPUT);
  if (minutes === null) return null;
  const cueRaw = params.get('cues') ?? '';
  const cues = cueRaw ? whole(cueRaw, 0, MAX_CUES) : null;
  const cx = COMPLEXITY.find((c) => c.id === params.get('cx'))?.id ?? 'standard';
  const dl = DEADLINES.find((d) => d.id === params.get('dl'))?.id ?? 'standard';
  const lic = LICENCES.find((l) => l.id === params.get('lic'))?.id ?? 'nonexclusive';
  const rev = whole(params.get('rev') ?? '0', 0, MAX_EXTRA_REVISION_ROUNDS) ?? 0;
  return {
    scoredMinutes: minutes,
    cueCount: cues ?? undefined,
    complexity: cx,
    deadline: dl,
    extraRevisionRounds: rev,
    licence: lic,
  };
}

function setField(form: HTMLFormElement, name: string, value: string): void {
  const field = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
  if (!field) return;
  if (field instanceof HTMLSelectElement) {
    const option = Array.from(field.options).find((o) => o.value === value);
    if (option) field.value = value;
  } else {
    field.value = value;
  }
}

/** Fill the inquiry from /contact?package=…&min=…, as written by the estimator. */
function prefillInquiry(form: HTMLFormElement): void {
  const params = new URLSearchParams(window.location.search);
  const pkg = params.get('package');
  if (pkg) setField(form, 'pkg', pkg);

  const scope = scopeFromParams(params);
  if (scope) {
    setField(form, 'min', String(scope.scoredMinutes));
    if (scope.cueCount !== undefined) setField(form, 'cues', String(scope.cueCount));
    setField(form, 'cx', scope.complexity);
    setField(form, 'lic', scope.licence);

    const notes = form.elements.namedItem('notes') as HTMLTextAreaElement | null;
    const summary = estimateSummary(scope, quote(scope));
    if (notes && !notes.value) notes.value = `${summary}\n\n`;

    const intro = form.querySelector<HTMLElement>('[data-zp-from-estimate]');
    if (intro) {
      const q = quote(scope);
      intro.hidden = false;
      intro.textContent = q.kind === 'estimate'
        ? `Your estimator selections are included in the notes: preliminary ${q.packageName} estimate ${Math.round(q.low)}${DASH}${Math.round(q.high)} dollars. Final quotation subject to creative scope and written agreement.`
        : 'Your estimator selections are included in the notes. This scope needs a quotation, so it is priced after review.';
    }
  }
}

function textOf(form: HTMLFormElement, name: string): string {
  const field = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
  if (!field) return '';
  if (field instanceof HTMLSelectElement) return field.options[field.selectedIndex]?.text ?? '';
  return field.value.trim();
}

function inquiryBody(form: HTMLFormElement): string {
  const get = (name: string) => textOf(form, name);
  const minutes = get('min');
  const cues = get('cues');
  return [
    `Name: ${get('name')}`,
    `Email: ${get('email')}`,
    `Project: ${get('project')}`,
    `Format: ${get('format')}`,
    `Closest package: ${get('pkg') || 'Not sure yet'}`,
    `Scored music: ${minutes ? `${minutes} minutes (music, not film runtime)` : 'to advise'}`,
    `Cues: ${cues || 'not sure yet'}`,
    `Delivery or picture lock: ${get('deadline') || 'not set'}`,
    `Musical complexity: ${get('cx')}`,
    `Licence expected: ${get('lic')}`,
    `Budget: ${get('budget')}`,
    '',
    'Tone references:',
    get('tone') || '(none given)',
    '',
    `Rough cut or scene link: ${get('link') || '(none)'}`,
    '',
    'Notes:',
    get('notes') || '(none)',
    '',
    'Scope: an original score composed to picture. Not sound design or foley unless I have said so above.',
    'Please reply with a written quote. I understand estimates are preliminary and the final quotation is subject to creative scope and written agreement. Unreleased material is confidential; tell me if you need an NDA first.',
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
  if (mark('project', !textOf(form, 'project'))) problems.push('Please add a project title.');
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

function handleInquirySubmit(event: Event, form: HTMLFormElement): void {
  event.preventDefault();
  const error = form.querySelector<HTMLElement>('[data-zp-error]');
  const problems = validateInquiry(form);
  if (problems.length) {
    if (error) {
      error.hidden = false;
      error.textContent = problems.join(' ');
    }
    const firstInvalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
    firstInvalid?.focus();
    return;
  }
  if (error) error.hidden = true;

  const body = inquiryBody(form);
  const subject = `Scoring inquiry: ${textOf(form, 'project')} (${textOf(form, 'format')})`;
  const preview = form.querySelector<HTMLElement>('[data-zp-preview]');
  const text = form.querySelector<HTMLTextAreaElement>('[data-zp-text]');
  if (preview) preview.hidden = false;
  if (text) text.value = body;

  // Opens the visitor's mail client with the message ready to review. The site
  // itself sends nothing; if no client opens, the text above can be copied.
  const href = `mailto:${ESTIMATOR_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = href;
  preview?.scrollIntoView({ block: 'nearest' });
}

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

function onInput(event: Event): void {
  const target = event.target as HTMLElement | null;
  const root = target?.closest<HTMLElement>('[data-zp-est]');
  if (root) renderEstimate(root);
}

function onSubmit(event: Event): void {
  const form = event.target as HTMLFormElement | null;
  if (!form) return;
  if (form.matches('[data-zp-form]')) {
    event.preventDefault();
    const root = form.closest<HTMLElement>('[data-zp-est]');
    if (root) renderEstimate(root);
    return;
  }
  if (form.matches('[data-zp-inquiry]')) handleInquirySubmit(event, form);
}

function onClick(event: Event): void {
  const button = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-zp-copy]');
  if (button) void copyText(button);
}

function init(): void {
  document.addEventListener('input', onInput);
  document.addEventListener('change', onInput);
  document.addEventListener('submit', onSubmit);
  document.addEventListener('click', onClick);
  const inquiry = document.querySelector<HTMLFormElement>('[data-zp-inquiry]');
  if (inquiry) prefillInquiry(inquiry);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

