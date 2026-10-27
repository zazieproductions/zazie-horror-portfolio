/**
 * src/inquiry/main.ts
 * ----------------------------------------------------------------------------
 * Browser behaviour for the structured scoring inquiry form (/contact).
 * Bundled to inquiry-<hash>.js by scripts/build-inquiry.mjs and loaded with
 * `defer`. Succeeded src/estimator/main.ts when the published rate card and
 * cost estimator were removed (2026-10-27): there is nothing left to
 * estimate, so this script only helps the visitor compose their inquiry.
 *
 * Design rules:
 *   - No network requests, no storage, no analytics. The inquiry opens the
 *     visitor's own mail client; the site never transmits what they type.
 *   - The visitor states their own budget range and musical references;
 *     the script never suggests a figure back to them.
 *   - Event delegation on the document, so the form also works if it is
 *     ever rendered inside a late-loading island.
 *   - Without JavaScript, the form's mailto action and the direct email
 *     link on the page still stand.
 */

import { MAX_CUES, MAX_MINUTES_INPUT } from '../data/commission.js';
import { INQUIRY_EMAIL } from '../lib/commission-markup.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
 * Fill the inquiry from /contact?format=…&min=… style deep links, so a page
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

function inquiryBody(form: HTMLFormElement): string {
  const get = (name: string) => textOf(form, name);
  const minutes = get('min');
  const cues = get('cues');
  return [
    `Name: ${get('name')}`,
    `Email: ${get('email')}`,
    `Project: ${get('project') || 'Not named yet'}`,
    `Format: ${get('format') || 'Not sure yet'}`,
    `Music budget: ${get('budget') || 'Not sure yet — please advise'}`,
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
    'Please reply with a written, nonbinding quote. Unreleased material is confidential; tell me if you need an NDA first.',
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
  const project = textOf(form, 'project');
  const format = textOf(form, 'format');
  const subjectLabel = project || (format && format !== 'Not sure yet' ? format : '');
  const subject = subjectLabel ? `Scoring inquiry: ${subjectLabel}` : 'Scoring inquiry';
  const preview = form.querySelector<HTMLElement>('[data-zp-preview]');
  const text = form.querySelector<HTMLTextAreaElement>('[data-zp-text]');
  if (preview) preview.hidden = false;
  if (text) text.value = body;

  // Opens the visitor's mail client with the message ready to review. The site
  // itself sends nothing; if no client opens, the text above can be copied.
  const href = `mailto:${INQUIRY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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

function onSubmit(event: Event): void {
  const form = event.target as HTMLFormElement | null;
  if (!form) return;
  if (form.matches('[data-zp-inquiry]')) handleInquirySubmit(event, form);
}

function onClick(event: Event): void {
  const button = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-zp-copy]');
  if (button) void copyText(button);
}

function init(): void {
  document.addEventListener('submit', onSubmit);
  document.addEventListener('click', onClick);
  const inquiry = document.querySelector<HTMLFormElement>('[data-zp-inquiry]');
  if (inquiry) prefillInquiry(inquiry);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
