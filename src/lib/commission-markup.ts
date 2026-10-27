/**
 * src/lib/commission-markup.ts
 * ----------------------------------------------------------------------------
 * Renders every commissioning surface from src/data/commission.ts as HTML
 * strings: the three-step commissioning summary, what's included, the
 * licence options, what shapes a quote, the structured inquiry form, the
 * price-free Offer JSON-LD and the {{zp:...}} text tokens used in static
 * pages.
 *
 * No renderer here may output a fee, a price band or an estimate — the site
 * deliberately publishes no rates (see src/data/commission.ts). The only
 * money strings allowed are the client-stated BUDGET_RANGES inside the
 * inquiry form's budget select.
 *
 * The same module is bundled for the browser (src/inquiry/main.ts), so the
 * server-rendered form and its live behaviour share one code path. Keep
 * this file free of Node-only imports.
 */

import {
  BUDGET_RANGES,
  COMMISSION_STEPS,
  COMPLEXITY_OPTIONS,
  FORMATS,
  LICENCE_OPTIONS,
  MAX_CUES,
  MAX_MINUTES_INPUT,
  MICROBUDGET_STATEMENT,
  PAYMENT_TERMS,
  QUOTE_FACTORS,
  QUOTE_NOTICE,
  REVISION_DEFINITION,
  SPECIALIST_DELIVERABLES,
  STANDARD_INCLUSIONS,
} from '../data/commission.js';

export const INQUIRY_EMAIL = 'zaziediya@gmail.com';
export const SITE_ORIGIN = 'https://horror.zazieproductions.com';

export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* -------------------------------------------------------------- text tokens */

/**
 * Static pages repeat a few studio statements as {{zp:payment}} and so on.
 * sync-commission.mjs replaces each token with the value from
 * commission.ts, and fails if an unknown token is found, so a retired
 * pricing token can never ship a stale figure.
 */
export function tokenValue(key: string): string | null {
  switch (key) {
    case 'notice': return QUOTE_NOTICE;
    case 'payment': return PAYMENT_TERMS;
    case 'microbudget': return MICROBUDGET_STATEMENT;
    case 'revision-definition': return REVISION_DEFINITION;
    default: return null;
  }
}

export function expandTokens(source: string, transform: (text: string) => string = (text) => text): string {
  return source.replace(/\{\{zp:([a-z0-9.\-]+)\}\}/g, (match, key: string) => {
    const value = tokenValue(key);
    if (value === null) throw new Error(`commission token ${match} has no value in src/data/commission.ts`);
    return transform(value);
  });
}

/* ------------------------------------------------------------------- meta */

/** Description meta trio generated from the hub's canonical description. */
export function metaHtml(description: string): string {
  return [
    `<meta name="description" content="${esc(description)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
  ].join("\n");
}

/* ----------------------------------------------------------- commissioning */

/** The three steps from first message to written quote, as a numbered list. */
export function commissioningHtml(): string {
  return [
    `<ol class="zp-steps">`,
    COMMISSION_STEPS.map(
      (step) => `<li><span><strong>${esc(step.title)}</strong> — ${esc(step.body)}</span></li>`,
    ).join(''),
    `</ol>`,
  ].join('');
}

/** Included in every standard commission. */
export function inclusionsHtml(): string {
  return [
    `<details class="zp-inclusions-disclosure">`,
    `<summary><span>What’s included</span><small>Standard delivery &amp; optional add-ons</small></summary>`,
    `<div class="zp-inclusions">`,
    `<div class="zp-list-block"><h3>Included in every commission</h3><ul>`,
    STANDARD_INCLUSIONS.map((item) => `<li>${esc(item)}</li>`).join(''),
    `</ul></div>`,
    `<div class="zp-list-block zp-list-specialist"><h3>Specialist work, quoted on request</h3>`,
    `<p>Discussed individually after a feasibility check. Not standard inclusions; quoted per project on request.</p><ul>`,
    SPECIALIST_DELIVERABLES.map((item) => `<li>${esc(item)}</li>`).join(''),
    `</ul></div>`,
    `</div>`,
    `</details>`,
  ].join('');
}

/** What shapes a written quote, without a single published figure. */
export function factorsHtml(): string {
  return [
    `<dl class="zp-factors-list">`,
    QUOTE_FACTORS.map(([term, value]) => `<div><dt>${esc(term)}</dt><dd>${esc(value)}</dd></div>`).join(''),
    `</dl>`,
  ].join('');
}

/** Licence options, described by what each grants — never by a price effect. */
export function licencesHtml(): string {
  return [
    `<ul class="zp-licences">`,
    LICENCE_OPTIONS.map(
      (l) => `<li><span class="zp-licence-name">${esc(l.label)}</span><span class="zp-licence-note">${esc(l.description)}</span></li>`,
    ).join(''),
    `</ul>`,
  ].join('');
}

/* ------------------------------------------------------------ inquiry form */

function selectOptions(values: readonly string[], selected?: string): string {
  return values.map((v) => `<option value="${esc(v)}"${v === selected ? ' selected' : ''}>${esc(v)}</option>`).join('');
}

/**
 * Structured inquiry form for /contact. It prepares an email; nothing is
 * sent by the site. Budget and musical references sit in the always-visible
 * part of the form: they are the two inputs a quote is now built from, and
 * the budget is stated by the visitor, in bands, never suggested by a
 * package price.
 */
export function inquiryFormHtml(): string {
  return [
    `<form class="zp-inq" data-zp-inquiry novalidate aria-label="Scoring inquiry" method="post" enctype="text/plain" action="mailto:${INQUIRY_EMAIL}?subject=Scoring%20inquiry">`,
    `<p class="zp-help zp-inq-intro">Start with your name and email. Everything else is optional — but your budget range and musical references are what the quote is built from, so add them if you can. Submitting prepares an email for you to review and send; this site does not store or send your details.</p>`,
    `<div class="zp-grid2">`,
    `<label class="zp-field"><span class="zp-label">Your name <em>required</em></span><input class="zp-input" name="name" autocomplete="name" required aria-required="true"></label>`,
    `<label class="zp-field"><span class="zp-label">Email <em>required</em></span><input class="zp-input" type="email" name="email" autocomplete="email" required aria-required="true"></label>`,
    `</div>`,
    `<label class="zp-field"><span class="zp-label">Project or working title <span class="zp-opt">(optional)</span></span><input class="zp-input" name="project" placeholder="A working title or a few words about the project"></label>`,
    `<div class="zp-grid2">`,
    `<label class="zp-field"><span class="zp-label">Format <span class="zp-opt">(optional)</span></span><select class="zp-input" name="format">${selectOptions(FORMATS, FORMATS[0])}</select></label>`,
    `<label class="zp-field"><span class="zp-label">Your music budget (USD) <span class="zp-opt">(optional)</span></span><select class="zp-input" name="budget">${selectOptions(BUDGET_RANGES, BUDGET_RANGES[0])}</select><small class="zp-help">The range you have set aside for music. There is no published rate card — the scope is built around what you share here, and “not sure yet” is fine.</small></label>`,
    `</div>`,
    `<label class="zp-field"><span class="zp-label">Musical references <span class="zp-opt">(optional)</span></span><textarea class="zp-input" name="tone" rows="3" placeholder="Films, scores or tracks you love — and what each one does for its scene. Links welcome."></textarea></label>`,
    `<details class="zp-inq-details" data-zp-inquiry-details>`,
    `<summary>Optional project details <span>minutes, cues, timing, complexity, licence</span></summary>`,
    `<div class="zp-inq-more">`,
    `<p class="zp-help">Leave anything blank if you are unsure. You do not need to share a rough cut in your first message.</p>`,
    `<div class="zp-grid3">`,
    `<label class="zp-field"><span class="zp-label">Scored music (minutes) <span class="zp-opt">(optional)</span></span><input class="zp-input" type="number" name="min" min="1" max="${MAX_MINUTES_INPUT}" step="1" inputmode="numeric"><small class="zp-help">Music, not film runtime.</small></label>`,
    `<label class="zp-field"><span class="zp-label">Cues <span class="zp-opt">(optional)</span></span><input class="zp-input" type="number" name="cues" min="0" max="${MAX_CUES}" step="1" inputmode="numeric"></label>`,
    `<label class="zp-field"><span class="zp-label">Delivery date <span class="zp-opt">(optional)</span></span><input class="zp-input" name="deadline" placeholder="Date, window or festival deadline"></label>`,
    `</div>`,
    `<div class="zp-grid2">`,
    `<label class="zp-field"><span class="zp-label">Musical complexity <span class="zp-opt">(optional)</span></span><select class="zp-input" name="cx"><option value="">Not sure yet</option>${COMPLEXITY_OPTIONS.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join('')}</select></label>`,
    `<label class="zp-field"><span class="zp-label">Licence you expect <span class="zp-opt">(optional)</span></span><select class="zp-input" name="lic"><option value="">Not sure yet</option>${LICENCE_OPTIONS.map((l) => `<option value="${l.id}">${esc(l.label)}</option>`).join('')}</select></label>`,
    `</div>`,
    `<label class="zp-field"><span class="zp-label">Rough cut or scene link <span class="zp-opt">(optional)</span></span><input class="zp-input" type="url" name="link" placeholder="Share a private link only when you are ready"></label>`,
    `<label class="zp-field"><span class="zp-label">Anything else <span class="zp-opt">(optional)</span></span><textarea class="zp-input" name="notes" rows="3" placeholder="Questions, constraints or anything you would like me to know."></textarea></label>`,
    `<p class="zp-help">Unreleased material is treated as confidential. A mutual NDA is available before anything is shared.</p>`,
    `</div></details>`,
    `<p class="zp-help">${esc(MICROBUDGET_STATEMENT)}</p>`,
    `<p class="zp-help">Payment terms: ${esc(PAYMENT_TERMS)}</p>`,
    `<p class="zp-error" data-zp-error role="alert" hidden></p>`,
    `<div class="zp-inq-actions"><button class="zp-cta" type="submit">Prepare my scoring inquiry</button></div>`,
    `<div class="zp-inq-preview" data-zp-preview hidden>`,
    `<p class="zp-eyebrow">Your inquiry is ready</p>`,
    `<p class="zp-help">Your email app should open with this message to ${INQUIRY_EMAIL}. If it does not, copy the text below and send it from your own address.</p>`,
    // The preview is a form control inside the inquiry form, so it needs an id
    // (or a name) of its own: without one, browser autofill and every "form
    // field has a name" audit treat it as an anonymous field. It is read-only
    // and its value is set from script, so an id is the right attribute here --
    // a name would suggest it is submitted, which it never is.
    `<textarea class="zp-input zp-preview-text" id="zp-inquiry-preview" data-zp-text rows="12" readonly aria-label="Inquiry text"></textarea>`,
    `<p><button class="zp-cta zp-cta-ghost" type="button" data-zp-copy>Copy inquiry text</button> <span class="zp-help" data-zp-copied role="status"></span></p>`,
    `</div>`,
    `</form>`,
  ].join('');
}

/** Option list for the homepage contact select (React bundle and static preview). */
export function budgetSelectOptions(): string {
  return BUDGET_RANGES.map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('');
}

/* -------------------------------------------------------------- JSON-LD */

/**
 * One price-free Offer node for the Service: commissions are available and
 * quoted per project, so the graph carries availability and the inquiry
 * URL — never a priceSpecification.
 */
export function serviceOfferGraph(serviceId: string, provider: string): object {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Offer',
        '@id': `${SITE_ORIGIN}/services#offer`,
        name: 'Original score commission',
        description:
          'Original music composed to picture for independent and arthouse psychological horror cinema. No published rate card: every commission is quoted individually, in writing, against the budget range, scope and musical references shared in the inquiry.',
        itemOffered: { '@id': serviceId },
        seller: { '@id': provider },
        availability: 'https://schema.org/LimitedAvailability',
        url: `${SITE_ORIGIN}/contact`,
      },
    ],
  };
}

/* ------------------------------------------------------------ misc helpers */

/** The inline notice used at the foot of every commissioning surface. */
export function noticeHtml(): string {
  return `<p class="zp-notice">${esc(QUOTE_NOTICE)}</p>`;
}

export { BUDGET_RANGES, FORMATS };
export type { ComplexityId, LicenceId } from '../data/commission.js';
