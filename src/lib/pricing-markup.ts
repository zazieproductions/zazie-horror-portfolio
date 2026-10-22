/**
 * src/lib/pricing-markup.ts
 * ----------------------------------------------------------------------------
 * Renders every pricing surface from src/data/pricing.ts as HTML strings:
 * package cards, the scope estimator, its result panel, the structured inquiry
 * form, the Offer JSON-LD and the {{zp:...}} text tokens used in static pages.
 *
 * The same module is bundled for the browser (src/estimator/main.ts), so the
 * server-rendered default and the live update run one code path. Keep this file
 * free of Node-only imports.
 */

import {
  CURRENCY,
  DEADLINES,
  DEFAULT_SCOPE,
  FEATURE_MINIMUM_ENGAGEMENT,
  EXTRA_CUE_FEE,
  EXTRA_REVISION_MINIMUM,
  EXTRA_REVISION_RATE,
  FORMATS,
  LICENCES,
  LONG_FORM_THRESHOLD_MINUTES,
  MAX_CUES,
  MAX_EXTRA_REVISION_ROUNDS,
  MAX_MINUTES_INPUT,
  MINIMUM_FEE,
  MICROBUDGET_STATEMENT,
  PACKAGES,
  PAYMENT_TERMS,
  PRICING_NOTICE,
  PRICING_REVIEWED,
  PRICING_STATUS,
  REVISION_DEFINITION,
  RUNTIME_NOTICE,
  SPECIALIST_DELIVERABLES,
  STANDARD_INCLUSIONS,
  STARTING_FEE_NOTE,
  COMPLEXITY,
  budgetOptions,
  packageById,
  priceLabel,
  pricingSummary,
  publishedSpan,
  quote,
  usd,
  type ComplexityId,
  type DeadlineId,
  type EstimateQuote,
  type LicenceId,
  type PackageId,
  type PricingPackage,
  type Quote,
  type QuoteInput,
} from '../data/pricing.js';

export const ESTIMATOR_EMAIL = 'zaziediya@gmail.com';
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

const DASH = '\u2013';

/**
 * Static pages write prices as {{zp:scene.label}}, {{zp:focused.from}} and so
 * on. sync-pricing.mjs replaces each token with the value from pricing.ts, and
 * fails if an unknown token is found, so a typo cannot ship a wrong figure.
 */
export function tokenValue(key: string): string | null {
  const [head, field] = key.split('.');
  if (head === 'minimum' && !field) return usd(MINIMUM_FEE);
  if (head === 'long-form' && !field) return String(LONG_FORM_THRESHOLD_MINUTES);
  if (head === 'extra-cue' && !field) return usd(EXTRA_CUE_FEE);
  if (head === 'notice' && !field) return PRICING_NOTICE;
  if (head === 'runtime-notice' && !field) return RUNTIME_NOTICE;
  if (head === 'reviewed' && !field) return PRICING_REVIEWED;
  if (head === 'status' && !field) return PRICING_STATUS;
  if (head === 'pricing' && field === 'summary') return pricingSummary();
  if (head === 'feature' && field === 'minimum') return usd(FEATURE_MINIMUM_ENGAGEMENT);
  if (head === 'feature-minimum' && !field) return usd(FEATURE_MINIMUM_ENGAGEMENT);
  if (head === 'revision-minimum' && !field) return usd(EXTRA_REVISION_MINIMUM);
  if (head === 'revision-rate' && !field) return `${Math.round(EXTRA_REVISION_RATE * 100)}%`;
  if (head === 'revision-definition' && !field) return REVISION_DEFINITION;
  if (head === 'starting-fee-note' && !field) return STARTING_FEE_NOTE;
  if (head === 'microbudget' && !field) return MICROBUDGET_STATEMENT;
  if (head === 'payment' && !field) return PAYMENT_TERMS;
  const pkg = PACKAGES.find((p) => p.id === head);
  if (!pkg) return null;
  const span = publishedSpan(pkg);
  switch (field) {
    case 'label': return priceLabel(pkg);
    case 'name': return pkg.name;
    case 'minutes': return pkg.scopeLabel;
    case 'summary': return pkg.summary;
    case 'bestFor': return pkg.bestFor;
    case 'from': return span ? usd(span.low) : 'a custom quotation';
    case 'high': return span ? usd(span.high) : 'a custom quotation';
    case 'minimum': return pkg.indicativeMinimum ? usd(pkg.indicativeMinimum) : (span ? usd(span.low) : 'a custom quotation');
    default: return null;
  }
}

export function expandTokens(source: string, transform: (text: string) => string = (text) => text): string {
  return source.replace(/\{\{zp:([a-z0-9.\-]+)\}\}/g, (match, key: string) => {
    const value = tokenValue(key);
    if (value === null) throw new Error(`pricing token ${match} has no value in src/data/pricing.ts`);
    return transform(value);
  });
}

/* ---------------------------------------------------------------- packages */

function packageCard(pkg: PricingPackage, index: number): string {
  const label = priceLabel(pkg);
  const contact = `/contact?package=${pkg.id}`;
  const cta = pkg.display === 'custom' ? 'Discuss a feature or experimental score' : `Request a quote for ${esc(pkg.name)}`;
  const priceNote = pkg.display === 'custom'
    ? `Guide minimum for large scores: ${usd(pkg.indicativeMinimum ?? FEATURE_MINIMUM_ENGAGEMENT)} USD. Single scenes may cost less`
    : `Starting fee in ${CURRENCY}. Final fee may vary`;
  return [
    `<article class="zp-pkg" id="package-${pkg.id}" data-package="${pkg.id}">`,
    `<p class="zp-pkg-no">${String(index + 1).padStart(2, '0')}</p>`,
    `<h3 class="zp-pkg-name">${esc(pkg.name)}</h3>`,
    `<p class="zp-pkg-price">${esc(label)}</p>`,
    `<p class="zp-pkg-price-note">${esc(priceNote)}</p>`,
    `<p class="zp-pkg-minutes">${esc(pkg.scopeLabel)}</p>`,
    `<p class="zp-pkg-copy">${esc(pkg.summary)}</p>`,
    `<p class="zp-pkg-best"><span>Best for</span> ${esc(pkg.bestFor)}</p>`,
    `<a class="zp-cta zp-cta-ghost" href="${contact}">${cta}</a>`,
    `</article>`,
  ].join('');
}

/** The four commissioning packages as cards, in order. */
export function packagesHtml(): string {
  return [
    `<p class="zp-pricing-intro">Fees are in USD. Each listed fee is a starting price. Minute ranges are guides, not a promise of finished music length. Your written quote confirms the scope and final fee.</p>`,
    `<div class="zp-packages">`,
    PACKAGES.map(packageCard).join(''),
    `</div>`,
  ].join('');
}

/** Metadata summary generated from pricing.ts without comment markers in attributes. */
export function pricingMetaHtml(): string {
  const description = pricingSummary();
  return [
    `<meta name="description" content="${esc(description)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
  ].join("\n");
}

/** Included in every standard commission. */
export function inclusionsHtml(): string {
  return [
    `<div class="zp-inclusions">`,
    `<div class="zp-list-block"><h3>Included in every commission</h3><ul>`,
    STANDARD_INCLUSIONS.map((item) => `<li>${esc(item)}</li>`).join(''),
    `</ul></div>`,
    `<div class="zp-list-block zp-list-specialist"><h3>Specialist work, quoted on request</h3>`,
    `<p>Ask me about these services. They are not standard inclusions. They are not part of a published estimate.</p><ul>`,
    SPECIALIST_DELIVERABLES.map((item) => `<li>${esc(item)}</li>`).join(''),
    `</ul></div>`,
    `</div>`,
  ].join('');
}

/** What moves the quote, generated from the same constants the estimator uses. */
export function factorsHtml(): string {
  const pct = (m: number) => (m === 1 ? 'no change' : `+${Math.round((m - 1) * 100)}%`);
  const minutePackages = PACKAGES.filter((pkg) => pkg.minutes !== null);
  const bands = minutePackages.map((pkg) => `${pkg.minutes!.min}–${pkg.minutes!.max} minutes (${pkg.name})`).join('; ');
  const items: [string, string][] = [
    ['Starting fee, not a ceiling', STARTING_FEE_NOTE],
    ['Scored music', `Non-overlapping whole-minute bands: ${bands}. More than ${LONG_FORM_THRESHOLD_MINUTES} scored minutes, multi-part or expanded-scope work is quoted individually; scope labels are guides, not duration guarantees.`],
    ['Cues', `Two cues per scored minute are included. Each additional cue is ${usd(EXTRA_CUE_FEE)} before the adjustments below.`],
    ['Musical complexity', COMPLEXITY.map((c) => `${c.label} ${pct(c.multiplier)}`).join('; ') + '.'],
    ['Schedule', DEADLINES.map((d) => `${d.label} ${pct(d.multiplier)}`).join('; ') + '. Rush is subject to availability.'],
    ['Revisions', `One consolidated round is included for Individual Scene and Focused scores; two rounds for Extended and Feature/Experimental scores, as confirmed in the written scope. Each additional round is ${usd(EXTRA_REVISION_MINIMUM)} minimum or ${Math.round(EXTRA_REVISION_RATE * 100)}% of the commission fee, whichever is greater, up to ${MAX_EXTRA_REVISION_ROUNDS} rounds. ${REVISION_DEFINITION}`],
    ['Licence', LICENCES.filter((l) => !l.quoted).map((l) => `${l.label} ${pct(l.multiplier)}`).join('; ') + '. Exclusivity, copyright assignment, soundtrack exploitation and expanded uses require a separate written agreement. A copyright buyout or soundtrack album is quoted individually.'],
    ['Feature & experimental', `Custom quotation. The indicative minimum of ${usd(FEATURE_MINIMUM_ENGAGEMENT)} applies only to substantial feature-film or experimental-cinema scoring engagements; a single scene/cue for a feature may use Individual Scene Scoring.`],
    ['Individual scene minimum', `${usd(MINIMUM_FEE)} starting fee.`],
    ['Payment', PAYMENT_TERMS],
  ];
  return [
    `<dl class="zp-factors-list">`,
    items.map(([term, value]) => `<div><dt>${esc(term)}</dt><dd>${esc(value)}</dd></div>`).join(''),
    `</dl>`,
  ].join('');
}

/** Licence options with their price effect. Buyouts and albums are never priced here. */
export function licencesHtml(): string {
  return [
    `<ul class="zp-licences">`,
    LICENCES.map((l) => {
      const effect = l.quoted
        ? 'Quoted individually under a separate written agreement'
        : (l.multiplier === 1 ? 'Base licence' : `Adds ${Math.round((l.multiplier - 1) * 100)}% to the composition fee under a separate written agreement`);
      return `<li><span class="zp-licence-name">${esc(l.label)}</span> <span class="zp-licence-effect">${esc(effect)}</span><span class="zp-licence-note">${esc(l.description)}</span></li>`;
    }).join(''),
    `</ul>`,
  ].join('');
}

/* ------------------------------------------------------------ estimator */

function complexityOptions(selected: ComplexityId): string {
  return COMPLEXITY.map((c) => [
    `<label class="zp-choice"><input type="radio" name="cx" value="${c.id}"${c.id === selected ? ' checked' : ''}>`,
    `<span class="zp-choice-body"><span class="zp-choice-title">${esc(c.label)}</span>`,
    `<span class="zp-choice-note">${esc(c.description)}</span></span></label>`,
  ].join('')).join('');
}

function deadlineOptions(selected: DeadlineId): string {
  return DEADLINES.map((d) => [
    `<label class="zp-choice"><input type="radio" name="dl" value="${d.id}"${d.id === selected ? ' checked' : ''}>`,
    `<span class="zp-choice-body"><span class="zp-choice-title">${esc(d.label)}</span>`,
    `<span class="zp-choice-note">${esc(d.description)}</span></span></label>`,
  ].join('')).join('');
}

function licenceOptions(selected: LicenceId): string {
  return LICENCES.map((l) => [
    `<label class="zp-choice${l.quoted ? ' zp-choice-quoted' : ''}"><input type="radio" name="lic" value="${l.id}"${l.id === selected ? ' checked' : ''}>`,
    `<span class="zp-choice-body"><span class="zp-choice-title">${esc(l.label)}</span>`,
    `<span class="zp-choice-note">${esc(l.description)}</span></span></label>`,
  ].join('')).join('');
}

function revisionOptions(selected: number): string {
  const options: string[] = [];
  for (let n = 0; n <= MAX_EXTRA_REVISION_ROUNDS; n += 1) {
    const label = n === 0 ? 'None: included package allowance only' : `${n} additional ${n === 1 ? 'round' : 'rounds'}`;
    options.push(`<option value="${n}"${n === selected ? ' selected' : ''}>${esc(label)}</option>`);
  }
  return options.join('');
}

/** The estimator's inputs, as the form is rendered (used by the server and the browser). */
export function estimatorFormHtml(scope: QuoteInput, cueText: string): string {
  return [
    `<form class="zp-est-form" data-zp-form novalidate aria-label="Scope estimator">`,
    `<fieldset class="zp-group"><legend>Music to be composed</legend>`,
    `<div class="zp-grid2">`,
    `<label class="zp-field"><span class="zp-label">Scored music minutes</span>`,
    `<input class="zp-input" type="number" name="min" min="1" max="${MAX_MINUTES_INPUT}" step="1" inputmode="numeric" value="${Math.round(scope.scoredMinutes)}" aria-describedby="zp-min-help">`,
    `<small id="zp-min-help" class="zp-help">Enter minutes of finished music, not film length. Each minute band is separate. Over ${LONG_FORM_THRESHOLD_MINUTES} minutes? Ask for a custom quote. Listed fees are starting prices.</small></label>`,
    `<label class="zp-field"><span class="zp-label">Number of cues <span class="zp-opt">(optional)</span></span>`,
    `<input class="zp-input" type="number" name="cues" min="0" max="${MAX_CUES}" step="1" inputmode="numeric" value="${esc(cueText)}" aria-describedby="zp-cue-help">`,
    `<small id="zp-cue-help" class="zp-help">Leave blank if unsure. Two cues per scored minute are included.</small></label>`,
    `</div></fieldset>`,
    `<fieldset class="zp-group"><legend>Full-project scope</legend>`,
    `<label class="zp-choice zp-choice-quoted"><input type="checkbox" name="substantial" value="yes"${scope.substantialProject ? ' checked' : ''} aria-describedby="zp-feature-help">`,
    `<span class="zp-choice-body"><span class="zp-choice-title">Full feature or experimental score</span>`,
    `<span class="zp-choice-note" id="zp-feature-help">Custom quote. The guide minimum for a full score is ${usd(FEATURE_MINIMUM_ENGAGEMENT)} USD. Leave this unchecked for one scene or cue, even in a feature.</span></span></label></fieldset>`,
    `<fieldset class="zp-group"><legend>Musical complexity</legend><div class="zp-choices">${complexityOptions(scope.complexity)}</div></fieldset>`,
    `<fieldset class="zp-group"><legend>Schedule</legend><div class="zp-choices">${deadlineOptions(scope.deadline)}</div></fieldset>`,
    `<fieldset class="zp-group"><legend>Revisions</legend>`,
    `<label class="zp-field"><span class="zp-label">Extra revision rounds beyond your package</span>`,
    `<select class="zp-input" name="rev">${revisionOptions(scope.extraRevisionRounds)}</select></label></fieldset>`,
    `<fieldset class="zp-group"><legend>Licence</legend><div class="zp-choices">${licenceOptions(scope.licence)}</div>`,
    `<p class="zp-help">The music fee and license fee are separate. Exclusive use, wider release, copyright buyouts, and albums need a written agreement. Buyouts and albums also need their own quotes.</p></fieldset>`,
    `</form>`,
  ].join('');
}

/** Query-string for the inquiry page, so an estimate travels with the enquiry. */
export function contactHref(scope: QuoteInput, q: Quote | null): string {
  const params = new URLSearchParams();
  params.set('min', String(Math.round(scope.scoredMinutes)));
  if (scope.cueCount) params.set('cues', String(scope.cueCount));
  params.set('cx', scope.complexity);
  params.set('dl', scope.deadline);
  params.set('rev', String(scope.extraRevisionRounds));
  params.set('lic', scope.licence);
  if (scope.substantialProject) params.set('substantial', '1');
  if (q && q.kind === 'estimate') {
    params.set('package', q.packageId);
    params.set('range', `${usd(q.low)}${DASH}${usd(q.high)}`);
  } else if (q && q.kind === 'custom' && (q.reason === 'long-form' || q.reason === 'feature-project')) {
    params.set('package', 'feature');
  }
  return `/contact?${params.toString()}`;
}

/** A plain-text summary of an estimate, used to prefill the inquiry. */
export function estimateSummary(scope: QuoteInput, q: Quote): string {
  if (q.kind === 'custom') {
    return `Estimator: custom quotation requested. ${q.message} Scored music ${Math.round(scope.scoredMinutes)} min.`;
  }
  const lines = [
    `Estimator selections (preliminary estimate — final quotation subject to creative scope and written agreement):`,
    ...q.factors.map((f) => `- ${f.label}: ${f.value}`),
    `- Preliminary range: ${usd(q.low)}${DASH}${usd(q.high)}`,
  ];
  return lines.join('\n');
}

/** The live result panel. Identical markup is produced by the browser on each change. */
export function resultHtml(scope: QuoteInput, q: Quote): string {
  const cta = `<a class="zp-cta" href="${esc(contactHref(scope, q))}">Request a scoring quote</a>`;
  if (q.kind === 'custom') {
    const pkg = q.reason === 'long-form' || q.reason === 'feature-project' ? packageById('feature') : null;
    return [
      `<p class="zp-eyebrow">Custom quote · I confirm the scope and fee in writing</p>`,
      `<p class="zp-result-pkg">${esc(pkg ? pkg.name : 'Custom scope')}</p>`,
      `<p class="zp-result-range zp-result-custom">Custom quotation</p>`,
      `<p class="zp-result-msg">${esc(q.message)}</p>`,
      cta,
      `<p class="zp-fine">${esc(PRICING_NOTICE)}</p>`,
    ].join('');
  }
  return [
    `<p class="zp-eyebrow">Estimate only · I confirm the scope and fee in writing</p>`,
    `<p class="zp-result-pkg">${esc(q.packageName)}</p>`,
    `<p class="zp-result-range" aria-label="${esc(usd(q.low))} to ${esc(usd(q.high))}">${esc(usd(q.low))}<span class="zp-dash" aria-hidden="true"> ${DASH} </span>${esc(usd(q.high))}</p>`,
    `<ul class="zp-factors">`,
    q.factors.map((f) => `<li><span>${esc(f.label)}</span>${esc(f.value)}</li>`).join(''),
    `</ul>`,
    `<p class="zp-result-msg">Listed fees are starting prices. Complex music, tight deadlines, extra revisions, and wider rights can raise your quote.</p>`,
    cta,
    `<p class="zp-fine">${esc(PRICING_NOTICE)}</p>`,
  ].join('');
}

/** The complete estimator, server-rendered at its default scope. */
export function estimatorHtml(scope: QuoteInput = DEFAULT_SCOPE): string {
  const q = quote(scope);
  const cueText = scope.cueCount ? String(scope.cueCount) : '';
  return [
    `<div class="zp-est" data-zp-est>`,
    estimatorFormHtml(scope, cueText),
    `<aside class="zp-est-result" data-zp-result aria-live="polite" aria-label="Preliminary estimate">`,
    resultHtml(scope, q),
    `</aside>`,
    `</div>`,
  ].join('');
}

/* ------------------------------------------------------------ inquiry form */

function selectOptions(values: readonly string[], selected?: string): string {
  return values.map((v) => `<option value="${esc(v)}"${v === selected ? ' selected' : ''}>${esc(v)}</option>`).join('');
}

/** Structured inquiry form for /contact. It prepares an email; nothing is sent by the site. */
export function inquiryFormHtml(): string {
  const packageOptions = [
    `<option value="">Not sure yet</option>`,
    PACKAGES.map((pkg) => {
      const detail = pkg.display === 'custom'
        ? `Custom quotation; indicative minimum ${usd(pkg.indicativeMinimum ?? FEATURE_MINIMUM_ENGAGEMENT)} USD for substantial scores`
        : `${priceLabel(pkg)} USD starting fee`;
      return `<option value="${pkg.id}">${esc(pkg.name)} (${esc(detail)})</option>`;
    }).join(''),
  ].join('');
  return [
    `<form class="zp-inq" data-zp-inquiry novalidate aria-label="Scoring inquiry" method="post" enctype="text/plain" action="mailto:${ESTIMATOR_EMAIL}?subject=Scoring%20inquiry">`,
    `<p class="zp-help zp-inq-intro">Start with your name and email. Project details are optional—fill in only what you know. Submitting prepares an email for you to review and send; this site does not store or send your details.</p>`,
    `<p class="zp-help" data-zp-from-estimate hidden></p>`,
    `<div class="zp-grid2">`,
    `<label class="zp-field"><span class="zp-label">Your name <em>required</em></span><input class="zp-input" name="name" autocomplete="name" required aria-required="true"></label>`,
    `<label class="zp-field"><span class="zp-label">Email <em>required</em></span><input class="zp-input" type="email" name="email" autocomplete="email" required aria-required="true"></label>`,
    `</div>`,
    `<label class="zp-field"><span class="zp-label">Project or working title <span class="zp-opt">(optional)</span></span><input class="zp-input" name="project" placeholder="A working title or a few words about the project"></label>`,
    `<div class="zp-grid2">`,
    `<label class="zp-field"><span class="zp-label">Format <span class="zp-opt">(optional)</span></span><select class="zp-input" name="format">${selectOptions(FORMATS, FORMATS[0])}</select></label>`,
    `<label class="zp-field"><span class="zp-label">Closest package <span class="zp-opt">(optional)</span></span><select class="zp-input" name="pkg">${packageOptions}</select></label>`,
    `</div>`,
    `<p class="zp-help">A feature-film client commissioning one scene/cue may start with Individual Scene Scoring. The ${usd(FEATURE_MINIMUM_ENGAGEMENT)} indicative minimum applies only to substantial feature-film or experimental-cinema scores.</p>`,
    `<details class="zp-inq-details" data-zp-inquiry-details>`,
    `<summary>Optional project details <span>minutes, timing, budget, references</span></summary>`,
    `<div class="zp-inq-more">`,
    `<p class="zp-help">Leave anything blank if you are unsure. You do not need to share a rough cut in your first message.</p>`,
    `<div class="zp-grid3">`,
    `<label class="zp-field"><span class="zp-label">Scored music (minutes) <span class="zp-opt">(optional)</span></span><input class="zp-input" type="number" name="min" min="1" max="${MAX_MINUTES_INPUT}" step="1" inputmode="numeric"><small class="zp-help">Music, not film runtime.</small></label>`,
    `<label class="zp-field"><span class="zp-label">Cues <span class="zp-opt">(optional)</span></span><input class="zp-input" type="number" name="cues" min="0" max="${MAX_CUES}" step="1" inputmode="numeric"></label>`,
    `<label class="zp-field"><span class="zp-label">Delivery date <span class="zp-opt">(optional)</span></span><input class="zp-input" name="deadline" placeholder="Date, window or festival deadline"></label>`,
    `</div>`,
    `<div class="zp-grid2">`,
    `<label class="zp-field"><span class="zp-label">Musical complexity <span class="zp-opt">(optional)</span></span><select class="zp-input" name="cx"><option value="">Not sure yet</option>${COMPLEXITY.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join('')}</select></label>`,
    `<label class="zp-field"><span class="zp-label">Licence you expect <span class="zp-opt">(optional)</span></span><select class="zp-input" name="lic"><option value="">Not sure yet</option>${LICENCES.map((l) => `<option value="${l.id}">${esc(l.label)}</option>`).join('')}</select></label>`,
    `</div>`,
    `<label class="zp-field"><span class="zp-label">Budget range <span class="zp-opt">(optional)</span></span><select class="zp-input" name="budget">${selectOptions(budgetOptions(), budgetOptions()[0])}</select><small class="zp-help">Sharing a budget can help tailor scope, but it is fine to leave this at “Not sure yet.”</small></label>`,
    `<label class="zp-field"><span class="zp-label">Tone references <span class="zp-opt">(optional)</span></span><textarea class="zp-input" name="tone" rows="3" placeholder="A film, score or track—and what you like about it."></textarea></label>`,
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
    `<p class="zp-help">Your email app should open with this message to ${ESTIMATOR_EMAIL}. If it does not, copy the text below and send it from your own address.</p>`,
    `<textarea class="zp-input zp-preview-text" data-zp-text rows="12" readonly aria-label="Inquiry text"></textarea>`,
    `<p><button class="zp-cta zp-cta-ghost" type="button" data-zp-copy>Copy inquiry text</button> <span class="zp-help" data-zp-copied role="status"></span></p>`,
    `</div>`,
    `</form>`,
  ].join('');
}

/** Option list for the homepage contact select (React bundle and static preview). */
export function budgetSelectOptions(): string {
  return budgetOptions().map((o) => `<option value="${esc(o)}">${esc(o)}</option>`).join('');
}

/* -------------------------------------------------------------- JSON-LD */

/**
 * Offer nodes for the Service with the same starting fees as the pages.
 * No maximum is emitted: a starting fee is not a price cap. The feature minimum
 * is conditional on substantial full-project scope, so it is explained in text
 * rather than applied to every feature-film offer.
 */
export function offersGraph(serviceId: string, provider: string): object {
  const offers = PACKAGES.map((pkg) => {
    const span = publishedSpan(pkg);
    const minimum = pkg.indicativeMinimum
      ? ` Indicative minimum ${usd(pkg.indicativeMinimum)} for substantial feature-film or experimental-cinema scoring; a single scene/cue for a feature may use Individual Scene Scoring.`
      : '';
    const base: Record<string, unknown> = {
      '@type': 'Offer',
      '@id': `${SITE_ORIGIN}/services#offer-${pkg.id}`,
      name: pkg.name,
      description: `${pkg.summary} Scope guide: ${pkg.scopeLabel}.${minimum} Published figures are starting fees, not ceilings. Preliminary estimate — final quotation subject to creative scope and written agreement.`,
      itemOffered: { '@id': serviceId },
      seller: { '@id': provider },
      availability: 'https://schema.org/LimitedAvailability',
      url: `${SITE_ORIGIN}/services#package-${pkg.id}`,
    };
    if (span) {
      // Every public numeric price is a starting fee. Never publish a ceiling
      // that could be mistaken for a guaranteed maximum quote.
      const spec: Record<string, unknown> = {
        '@type': 'PriceSpecification',
        priceCurrency: CURRENCY,
        minPrice: span.low,
      };
      base.priceSpecification = spec;
    }
    return base;
  });
  return { '@context': 'https://schema.org', '@graph': offers };
}

/* ------------------------------------------------------------ misc helpers */

/** The inline notice used at the foot of every pricing surface. */
export function noticeHtml(): string {
  return `<p class="zp-notice">${esc(PRICING_NOTICE)}</p>`;
}

export { PACKAGES, quote, DEFAULT_SCOPE, budgetOptions, FORMATS, MINIMUM_FEE, PRICING_STATUS };
export type { EstimateQuote, PackageId, QuoteInput };
