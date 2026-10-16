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
  COMPLEXITY,
  CURRENCY,
  DEADLINES,
  DEFAULT_SCOPE,
  FEATURE_MINIMUM,
  FORMATS,
  LICENCES,
  LONG_FORM_THRESHOLD_MINUTES,
  MAX_CUES,
  MAX_EXTRA_REVISION_ROUNDS,
  MAX_MINUTES_INPUT,
  MICRO_BUDGET_STATEMENT,
  MINIMUM_FEE,
  PACKAGES,
  PAYMENT_TERMS,
  PRELIMINARY_NOTICE,
  PRICING_NOTICE,
  PRICING_REVIEWED,
  PRICING_STATUS,
  REVISION_FEE_MINIMUM,
  REVISION_FEE_RATE,
  REVISION_RULES,
  RUNTIME_NOTICE,
  SEPARATE_QUOTES,
  SPECIALIST_DELIVERABLES,
  STANDARD_INCLUSIONS,
  budgetOptions,
  packageById,
  priceLabel,
  quote,
  usd,
  type ComplexityId,
  type DeadlineId,
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

const DASH = '\u2013';
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const ROUNDS_WORD: Record<number, string> = { 0: 'no', 1: 'one', 2: 'two', 3: 'three', 4: 'four' };
const roundsWord = (n: number) => `${ROUNDS_WORD[n] ?? String(n)} consolidated ${plural(n, 'round', 'rounds')}`;

/* -------------------------------------------------------------- text tokens */

/**
 * Static pages write prices as {{zp:scene.label}}, {{zp:focused.from}} and so
 * on. sync-pricing.mjs replaces each token with the value from pricing.ts, and
 * fails if an unknown token is found, so a typo cannot ship a wrong figure.
 */
export function tokenValue(key: string): string | null {
  const [head, field] = key.split('.');
  if (!field) {
    switch (head) {
      case 'minimum': return usd(MINIMUM_FEE);
      case 'feature-minimum': return usd(FEATURE_MINIMUM);
      case 'long-form': return String(LONG_FORM_THRESHOLD_MINUTES);
      case 'revision-fee': return usd(REVISION_FEE_MINIMUM);
      case 'revision-rate': return `${Math.round(REVISION_FEE_RATE * 100)}%`;
      case 'max-cues': return String(MAX_CUES);
      case 'notice': return PRICING_NOTICE;
      case 'preliminary': return PRELIMINARY_NOTICE;
      case 'runtime-notice': return RUNTIME_NOTICE;
      case 'micro-budget': return MICRO_BUDGET_STATEMENT;
      case 'reviewed': return PRICING_REVIEWED;
      case 'status': return PRICING_STATUS;
      default: break;
    }
  }
  const pkg = PACKAGES.find((p) => p.id === head);
  if (!pkg) return null;
  switch (field) {
    case 'label': return priceLabel(pkg);
    case 'name': return pkg.name;
    case 'minutes': return pkg.minutesLabel;
    case 'guarantee': return pkg.guarantee;
    case 'summary': return pkg.summary;
    case 'bestFor': return pkg.bestFor;
    case 'from': return pkg.startingFee !== null ? usd(pkg.startingFee) : 'a custom quotation';
    case 'minimum': return pkg.indicativeMinimum !== null ? usd(pkg.indicativeMinimum) : 'a custom quotation';
    case 'cues': return pkg.cueAllowance !== null ? String(pkg.cueAllowance) : 'by agreement';
    case 'rounds': return pkg.revisionRoundsIncluded !== null ? roundsWord(pkg.revisionRoundsIncluded) : 'agreed in writing';
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
  const isCustom = pkg.display === 'custom';
  const cta = isCustom ? 'Discuss a feature or experimental score' : `Request a quote for ${esc(pkg.name)}`;
  const terms = isCustom
    ? [
        `Indicative minimum ${usd(FEATURE_MINIMUM)} for substantial scoring projects`,
        'Quoted after review of a cut and the agreed schedule',
        'Single scenes or cues are commissioned through Individual Scene Scoring',
      ]
    : [
        `Guaranteed maximum: ${pkg.guarantee.toLowerCase()}`,
        `Cues included: up to ${pkg.cueAllowance}`,
        `Revisions included: ${roundsWord(pkg.revisionRoundsIncluded ?? 0)}`,
      ];
  const price = isCustom
    ? `<p class="zp-pkg-price">Custom quotation</p><p class="zp-pkg-min">Indicative minimum ${esc(usd(FEATURE_MINIMUM))}</p>`
    : `<p class="zp-pkg-price">${esc(priceLabel(pkg))}</p><p class="zp-pkg-min">Starting fee, for the lowest scope in this package</p>`;
  return [
    `<article class="zp-pkg" id="package-${pkg.id}" data-package="${pkg.id}">`,
    `<p class="zp-pkg-no">${String(index + 1).padStart(2, '0')}</p>`,
    `<h3 class="zp-pkg-name">${esc(pkg.name)}</h3>`,
    price,
    `<p class="zp-pkg-minutes">${esc(pkg.minutesLabel)}</p>`,
    `<ul class="zp-pkg-terms">${terms.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`,
    `<p class="zp-pkg-copy">${esc(pkg.summary)}</p>`,
    `<p class="zp-pkg-best"><span>Best for</span> ${esc(pkg.bestFor)}</p>`,
    `<a class="zp-cta zp-cta-ghost" href="/contact?package=${pkg.id}">${cta}</a>`,
    `</article>`,
  ].join('');
}

/** The four commissioning packages as cards, in order. */
export function packagesHtml(): string {
  return [
    `<div class="zp-packages">`,
    PACKAGES.map(packageCard).join(''),
    `</div>`,
    `<p class="zp-pkg-foot">The starting fee is the lowest price in each package. Within a package, each scored minute above the minimum adds to it, up to the guaranteed maximum. Complexity and schedule adjust the figure. A written quote confirms it.</p>`,
  ].join('');
}

/** Included in every standard commission. */
export function inclusionsHtml(): string {
  return [
    `<div class="zp-inclusions">`,
    `<div class="zp-list-block"><h3>Included in every commission</h3><ul>`,
    STANDARD_INCLUSIONS.map((item) => `<li>${esc(item)}</li>`).join(''),
    `</ul></div>`,
    `<div class="zp-list-block zp-list-specialist"><h3>Specialist work, quoted on request</h3>`,
    `<p>Discussed individually after a feasibility check. Not standard inclusions, and not part of a published estimate.</p><ul>`,
    SPECIALIST_DELIVERABLES.map((item) => `<li>${esc(item)}</li>`).join(''),
    `</ul></div>`,
    `</div>`,
  ].join('');
}

/** Revisions, separate quotes and payment, generated from the same rules as the estimator. */
export function termsHtml(): string {
  const list = (items: readonly string[]) => `<ul class="zp-terms-list">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  return [
    `<div class="zp-inclusions">`,
    `<div class="zp-list-block"><h3>Revisions</h3>${list(REVISION_RULES)}</div>`,
    `<div class="zp-list-block"><h3>Quoted separately</h3>${list(SEPARATE_QUOTES)}</div>`,
    `<div class="zp-list-block"><h3>Payment</h3>${list(PAYMENT_TERMS)}</div>`,
    `</div>`,
  ].join('');
}

/** What moves the quote, generated from the same constants the estimator uses. */
export function factorsHtml(): string {
  const pct = (m: number) => (m === 1 ? 'no change' : `adds ${Math.round((m - 1) * 100)}%`);
  const packageLines = PACKAGES.filter((p) => p.display === 'from').map((p) => `${p.name} ${priceLabel(p).replace(/^From /, 'from ')} for up to ${p.guarantee.replace(/^Up to /, '')}`);
  const items: [string, string][] = [
    ['Scored music', `Priced by minutes of finished music, not film runtime. ${packageLines.join('; ')}. Scores over ${LONG_FORM_THRESHOLD_MINUTES} scored minutes are quoted individually.`],
    ['Cues', PACKAGES.filter((p) => p.cueAllowance !== null).map((p) => `${p.name}: up to ${p.cueAllowance}`).join('; ') + '. Cues above the allowance are composed and quoted individually.'],
    ['Musical complexity', COMPLEXITY.map((c) => `${c.label} ${pct(c.multiplier)}`).join('; ') + '.'],
    ['Schedule', DEADLINES.map((d) => `${d.label}: ${d.multiplier === 1 ? 'no surcharge' : pct(d.multiplier)}`).join('; ') + '.'],
    ['Revisions', `${PACKAGES.filter((p) => p.revisionRoundsIncluded !== null).map((p) => `${p.name}: ${roundsWord(p.revisionRoundsIncluded ?? 0)}`).join('; ')}. An additional round costs the greater of ${usd(REVISION_FEE_MINIMUM)} or ${Math.round(REVISION_FEE_RATE * 100)}% of the commission fee.`],
    ['Rights', 'The standard project licence is included. Exclusivity, expanded uses, copyright assignment and soundtrack release are quoted separately in writing.'],
    ['Minimum fee', `${usd(MINIMUM_FEE)} (Individual Scene starting fee). Feature and experimental scoring: indicative minimum ${usd(FEATURE_MINIMUM)}.`],
  ];
  return [
    `<dl class="zp-factors-list">`,
    items.map(([term, value]) => `<div><dt>${esc(term)}</dt><dd>${esc(value)}</dd></div>`).join(''),
    `</dl>`,
  ].join('');
}

/** Licence options with their effect on a published price. Non-standard rights are never priced here. */
export function licencesHtml(): string {
  return [
    `<ul class="zp-licences">`,
    LICENCES.map((l) => {
      const effect = l.included ? 'Included in every published price' : 'Quoted separately in writing';
      return `<li${l.included ? '' : ' class="zp-licence-quoted"'}><span class="zp-licence-name">${esc(l.label)}</span> <span class="zp-licence-effect">${esc(effect)}</span><span class="zp-licence-note">${esc(l.description)}</span></li>`;
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
    `<label class="zp-choice${l.included ? '' : ' zp-choice-quoted'}"><input type="radio" name="lic" value="${l.id}"${l.id === selected ? ' checked' : ''}>`,
    `<span class="zp-choice-body"><span class="zp-choice-title">${esc(l.label)}${l.included ? '' : ' <span class="zp-tag">Quoted separately</span>'}</span>`,
    `<span class="zp-choice-note">${esc(l.description)}</span></span></label>`,
  ].join('')).join('');
}

function revisionOptions(selected: number): string {
  const options: string[] = [];
  for (let n = 0; n <= MAX_EXTRA_REVISION_ROUNDS; n += 1) {
    const label = n === 0
      ? 'None: the rounds included in my package'
      : `${n} additional ${n === 1 ? 'round' : 'rounds'}`;
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
    `<small id="zp-min-help" class="zp-help">Minutes of finished music, not the length of the film. Over ${LONG_FORM_THRESHOLD_MINUTES} minutes is quoted individually. Music is rounded up to whole minutes.</small></label>`,
    `<label class="zp-field"><span class="zp-label">Number of cues <span class="zp-opt">(optional)</span></span>`,
    `<input class="zp-input" type="number" name="cues" min="0" max="${MAX_CUES}" step="1" inputmode="numeric" value="${esc(cueText)}" aria-describedby="zp-cue-help">`,
    `<small id="zp-cue-help" class="zp-help">Leave blank if unsure. Included cues: up to ${PACKAGES.filter((p) => p.cueAllowance !== null).map((p) => `${p.cueAllowance} in ${p.name.replace(/ (Scoring|Short-Film Scoring)$/, '')}`).join(', ')}.</small></label>`,
    `</div></fieldset>`,
    `<fieldset class="zp-group"><legend>Musical complexity</legend><div class="zp-choices">${complexityOptions(scope.complexity)}</div></fieldset>`,
    `<fieldset class="zp-group"><legend>Schedule</legend><div class="zp-choices">${deadlineOptions(scope.deadline)}</div></fieldset>`,
    `<fieldset class="zp-group"><legend>Revisions</legend>`,
    `<label class="zp-field"><span class="zp-label">Additional revision rounds</span>`,
    `<select class="zp-input" name="rev" aria-describedby="zp-rev-help">${revisionOptions(scope.extraRevisionRounds)}</select>`,
    `<small id="zp-rev-help" class="zp-help">Each package includes one consolidated round (Individual Scene and Focused Short-Film) or two (Extended Short-Film). An additional round costs the greater of ${usd(REVISION_FEE_MINIMUM)} or ${Math.round(REVISION_FEE_RATE * 100)}% of the commission fee.</small></label></fieldset>`,
    `<fieldset class="zp-group"><legend>Rights</legend><div class="zp-choices">${licenceOptions(scope.licence)}</div>`,
    `<p class="zp-help">The standard project licence is included in every published price. Other rights are quoted separately in a written agreement, and no amount for them appears in an estimate.</p></fieldset>`,
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
  if (q && q.kind === 'estimate') {
    params.set('package', q.packageId);
    params.set('range', `${usd(q.low)}${DASH}${usd(q.high)}`);
  } else if (q && q.kind === 'custom') {
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
    `Estimator selections (${PRELIMINARY_NOTICE}):`,
    ...q.factors.map((f) => `- ${f.label}: ${f.value}`),
    `- Preliminary range: ${usd(q.low)}${DASH}${usd(q.high)}`,
    ...q.quotedSeparately.map((item) => `- Quoted separately: ${item}`),
  ];
  return lines.join('\n');
}

/** The live result panel. Identical markup is produced by the browser on each change. */
export function resultHtml(scope: QuoteInput, q: Quote): string {
  const cta = `<a class="zp-cta" href="${esc(contactHref(scope, q))}">Request a Scoring Quote</a>`;
  if (q.kind === 'custom') {
    return [
      `<p class="zp-eyebrow">Custom quotation · not an estimate</p>`,
      `<p class="zp-result-pkg">${esc(packageById('feature').name)}</p>`,
      `<p class="zp-result-range zp-result-custom">Custom quotation</p>`,
      `<p class="zp-result-msg">Indicative minimum ${esc(usd(q.indicativeMinimum))} for substantial scoring projects.</p>`,
      `<p class="zp-result-msg">${esc(q.message)}</p>`,
      cta,
      `<p class="zp-fine">${esc(PRELIMINARY_NOTICE)}</p>`,
    ].join('');
  }
  const separate = q.quotedSeparately.length
    ? `<div class="zp-separate"><p class="zp-label">Not included in this range</p><ul>${q.quotedSeparately.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>`
    : '';
  return [
    `<p class="zp-eyebrow">Indicative range · not a quote</p>`,
    `<p class="zp-result-pkg">${esc(q.packageName)}</p>`,
    `<p class="zp-result-range" aria-label="${esc(usd(q.low))} to ${esc(usd(q.high))}">${esc(usd(q.low))}<span class="zp-dash" aria-hidden="true"> ${DASH} </span>${esc(usd(q.high))}</p>`,
    `<ul class="zp-factors">`,
    q.factors.map((f) => `<li><span>${esc(f.label)}</span>${esc(f.value)}</li>`).join(''),
    `</ul>`,
    separate,
    `<p class="zp-result-msg zp-prelim">${esc(PRELIMINARY_NOTICE)}</p>`,
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
    `<aside class="zp-est-result" data-zp-result aria-live="polite" aria-label="Indicative estimate">`,
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
    PACKAGES.map((p) => `<option value="${p.id}">${esc(p.name)} (${esc(priceLabel(p))})</option>`).join(''),
  ].join('');
  return [
    `<form class="zp-inq" data-zp-inquiry novalidate aria-label="Scoring inquiry" method="post" enctype="text/plain" action="mailto:${ESTIMATOR_EMAIL}?subject=Scoring%20inquiry">`,
    `<p class="zp-help zp-inq-intro">Required fields are marked. The form opens an email addressed to the studio so you can review it before sending. It does not store or transmit your details.</p>`,
    `<p class="zp-help" data-zp-from-estimate hidden></p>`,
    `<div class="zp-grid2">`,
    `<label class="zp-field"><span class="zp-label">Your name <em>required</em></span><input class="zp-input" name="name" autocomplete="name" required aria-required="true"></label>`,
    `<label class="zp-field"><span class="zp-label">Email <em>required</em></span><input class="zp-input" type="email" name="email" autocomplete="email" required aria-required="true"></label>`,
    `</div>`,
    `<label class="zp-field"><span class="zp-label">Project title <em>required</em></span><input class="zp-input" name="project" required aria-required="true"></label>`,
    `<div class="zp-grid2">`,
    `<label class="zp-field"><span class="zp-label">Format</span><select class="zp-input" name="format">${selectOptions(FORMATS, FORMATS[0])}</select></label>`,
    `<label class="zp-field"><span class="zp-label">Closest package</span><select class="zp-input" name="pkg">${packageOptions}</select></label>`,
    `</div>`,
    `<div class="zp-grid3">`,
    `<label class="zp-field"><span class="zp-label">Scored music (minutes)</span><input class="zp-input" type="number" name="min" min="1" max="${MAX_MINUTES_INPUT}" step="1" inputmode="numeric"><small class="zp-help">Music, not film runtime.</small></label>`,
    `<label class="zp-field"><span class="zp-label">Cues <span class="zp-opt">(optional)</span></span><input class="zp-input" type="number" name="cues" min="0" max="${MAX_CUES}" step="1" inputmode="numeric"></label>`,
    `<label class="zp-field"><span class="zp-label">Delivery date or festival deadline</span><input class="zp-input" name="deadline" placeholder="Date, window or festival deadline"></label>`,
    `</div>`,
    `<div class="zp-grid3">`,
    `<label class="zp-field"><span class="zp-label">Schedule</span><select class="zp-input" name="dl">${DEADLINES.map((d) => `<option value="${d.id}">${esc(d.label)}</option>`).join('')}</select></label>`,
    `<label class="zp-field"><span class="zp-label">Musical complexity</span><select class="zp-input" name="cx">${COMPLEXITY.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join('')}</select></label>`,
    `<label class="zp-field"><span class="zp-label">Additional revision rounds</span><select class="zp-input" name="rev">${revisionOptions(0)}</select></label>`,
    `</div>`,
    `<label class="zp-field"><span class="zp-label">Rights you expect</span><select class="zp-input" name="lic">${LICENCES.map((l) => `<option value="${l.id}">${esc(l.label)}${l.included ? '' : ' (quoted separately)'}</option>`).join('')}</select></label>`,
    `<label class="zp-field"><span class="zp-label">Budget <span class="zp-opt">(optional)</span></span><select class="zp-input" name="budget">${selectOptions(budgetOptions(), budgetOptions()[0])}</select></label>`,
    `<label class="zp-field"><span class="zp-label">Tone references</span><textarea class="zp-input" name="tone" rows="3" placeholder="Two or three films, scores or tracks, and the job each does for your scene."></textarea></label>`,
    `<label class="zp-field"><span class="zp-label">Rough cut or scene link <span class="zp-opt">(optional)</span></span><input class="zp-input" type="url" name="link" placeholder="A private link is preferred to attachments"></label>`,
    `<label class="zp-field"><span class="zp-label">Anything else</span><textarea class="zp-input" name="notes" rows="4" placeholder="Schedule constraints, live players, rights needs, or questions."></textarea></label>`,
    `<p class="zp-help">Unreleased material is treated as confidential. A mutual NDA is available before anything is sent.</p>`,
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
 * Offer nodes for the Service with the same figures the pages display. "From"
 * packages publish a starting fee as minPrice. Feature & experimental work
 * publishes its indicative minimum, which the page also shows; the price is
 * custom, so no maximum is written.
 */
export function offersGraph(serviceId: string, provider: string): object {
  const offers = PACKAGES.map((pkg) => {
    const base: Record<string, unknown> = {
      '@type': 'Offer',
      '@id': `${SITE_ORIGIN}/services#offer-${pkg.id}`,
      name: pkg.name,
      description: `${pkg.summary} Scope: ${pkg.minutesLabel}; ${pkg.guarantee.toLowerCase()}. Indicative and nonbinding; a written quote follows review.`,
      itemOffered: { '@id': serviceId },
      seller: { '@id': provider },
      availability: 'https://schema.org/LimitedAvailability',
      url: `${SITE_ORIGIN}/services#package-${pkg.id}`,
    };
    const floor = pkg.startingFee ?? pkg.indicativeMinimum;
    if (floor !== null) {
      base.priceSpecification = {
        '@type': 'PriceSpecification',
        priceCurrency: CURRENCY,
        minPrice: floor,
      };
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
export type { PackageId, QuoteInput, Quote };
