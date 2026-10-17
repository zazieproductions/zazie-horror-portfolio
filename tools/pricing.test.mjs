#!/usr/bin/env node
/**
 * Regression checks for the approved pricing model in src/data/pricing.ts.
 * Run after `npx tsc -p .`: node --test tools/pricing.test.mjs
 *
 * Covers package boundaries, starting-fee labels, smooth estimator transitions,
 * composition complexity, the substantial-project minimum, form/markup output,
 * and custom-quote paths.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  CURRENCY,
  DEFAULT_SCOPE,
  FEATURE_MINIMUM_ENGAGEMENT,
  FORMATS,
  MINIMUM_FEE,
  ROUND_TO,
  PACKAGES,
  estimatePackageFor,
  priceLabel,
  pricingSummary,
  quote,
  budgetOptions,
} from '../build/data/pricing.js';
import {
  contactHref,
  estimatorHtml,
  pricingMetaHtml,
  inquiryFormHtml,
  offersGraph,
  packagesHtml,
  tokenValue,
} from '../build/lib/pricing-markup.js';

const std = { ...DEFAULT_SCOPE, cueCount: undefined };
const est = (over = {}) => {
  const q = quote({ ...std, ...over });
  assert.equal(q.kind, 'estimate', `expected estimate for ${JSON.stringify(over)}`);
  return q;
};

test('short-form bands cover whole scored minutes once, with no gaps or overlap', () => {
  const expected = [
    ['scene', 1, 2],
    ['focused', 3, 5],
    ['extended', 6, 12],
  ];
  for (const [id, min, max] of expected) {
    const pkg = PACKAGES.find((item) => item.id === id);
    assert.ok(pkg, `${id} package exists`);
    assert.deepEqual(pkg.minutes, { min, max });
    for (let minute = min; minute <= max; minute += 1) {
      assert.equal(estimatePackageFor(minute)?.id, id, `${minute} scored minutes`);
    }
  }
  assert.equal(estimatePackageFor(0), null);
  assert.equal(estimatePackageFor(13), null, 'above 12 scored minutes is custom');
  assert.equal(PACKAGES[0].minutes.max + 1, PACKAGES[1].minutes.min);
  assert.equal(PACKAGES[1].minutes.max + 1, PACKAGES[2].minutes.min);
});

test('published package labels are starting fees, not price ranges', () => {
  assert.equal(CURRENCY, 'USD');
  assert.equal(MINIMUM_FEE, 250);
  assert.equal(FEATURE_MINIMUM_ENGAGEMENT, 2500);
  assert.equal(priceLabel(PACKAGES.find((p) => p.id === 'scene')), 'From $250');
  assert.equal(priceLabel(PACKAGES.find((p) => p.id === 'focused')), 'From $650');
  assert.equal(priceLabel(PACKAGES.find((p) => p.id === 'extended')), 'From $1,500');
  assert.equal(priceLabel(PACKAGES.find((p) => p.id === 'feature')), 'Custom quotation');
});

test('standard estimates start at the published package floors', () => {
  const q1 = est({ scoredMinutes: 1 });
  assert.equal(q1.packageId, 'scene');
  assert.equal(q1.low, 250);
  assert.equal(q1.high, 350);

  const q2 = est({ scoredMinutes: 2 });
  assert.equal(q2.packageId, 'scene');
  assert.equal(q2.low, 500);
  assert.equal(q2.high, 600);

  const q3 = est({ scoredMinutes: 3 });
  assert.equal(q3.packageId, 'focused');
  assert.equal(q3.low, 650);
  assert.equal(q3.high, 800);

  const q6 = est({ scoredMinutes: 6 });
  assert.equal(q6.packageId, 'extended');
  assert.equal(q6.low, 1500);
  assert.equal(q6.high, 1700);
});

test('estimate bands rise smoothly across every minute and package boundary', () => {
  let previousLow = 0;
  let previousHigh = 0;
  for (let minute = 1; minute <= 12; minute += 1) {
    const q = est({ scoredMinutes: minute });
    assert.equal(q.low % ROUND_TO, 0, `low ${q.low} at ${minute} min`);
    assert.equal(q.high % ROUND_TO, 0, `high ${q.high} at ${minute} min`);
    assert.ok(q.low <= q.high, `ordered range at ${minute} min`);
    assert.ok(q.low >= MINIMUM_FEE, `minimum at ${minute} min`);
    if (minute > 1) {
      assert.ok(q.low - previousLow <= 300, `no disproportionate low-band jump at ${minute} min`);
      assert.ok(q.high - previousHigh <= 300, `no disproportionate high-band jump at ${minute} min`);
    }
    previousLow = q.low;
    previousHigh = q.high;
  }
});

test('a complex two-minute cue can quote higher than a simple cue of equal duration', () => {
  const simple = est({ scoredMinutes: 2, complexity: 'standard' });
  const complex = est({ scoredMinutes: 2, complexity: 'bespoke' });
  assert.equal(simple.packageId, 'scene');
  assert.equal(complex.packageId, 'scene');
  assert.ok(complex.low > simple.high);
  assert.match(complex.factors.find((factor) => factor.label === 'Musical complexity').value, /Bespoke/);
});

test('other selected adjustments only raise the indicative estimate', () => {
  const base = est({ scoredMinutes: 5 });
  assert.ok(est({ scoredMinutes: 5, deadline: 'rush' }).low > base.low, 'rush deadline');
  assert.ok(est({ scoredMinutes: 5, complexity: 'layered' }).low > base.low, 'layered complexity');
  assert.ok(est({ scoredMinutes: 5, extraRevisionRounds: 2 }).low > base.low, 'extra revisions');
  assert.ok(est({ scoredMinutes: 5, licence: 'exclusive' }).low > base.low, 'exclusive licence');
});

test('a feature scene remains eligible for the individual-scene estimate', () => {
  const cue = est({ scoredMinutes: 2, substantialProject: false });
  assert.equal(cue.kind, 'estimate');
  assert.equal(cue.packageId, 'scene');
  assert.equal(cue.low, 500);

  const fullScore = quote({ ...std, scoredMinutes: 2, substantialProject: true });
  assert.equal(fullScore.kind, 'custom');
  assert.equal(fullScore.reason, 'feature-project');
  assert.equal(fullScore.packageId, 'feature');
  assert.match(fullScore.message, /\$2,500/);
  assert.match(fullScore.message, /scene\/cue commission.*not subject/i);
});

test('estimator inquiry hand-off preserves substantial-project scope without blocking a feature cue', () => {
  const project = { ...std, scoredMinutes: 2, substantialProject: true };
  const projectUrl = new URL(contactHref(project, quote(project)), 'https://example.com');
  assert.equal(projectUrl.searchParams.get('package'), 'feature');
  assert.equal(projectUrl.searchParams.get('substantial'), '1');

  const cue = { ...std, scoredMinutes: 2, substantialProject: false };
  const cueUrl = new URL(contactHref(cue, quote(cue)), 'https://example.com');
  assert.equal(cueUrl.searchParams.get('package'), 'scene');
  assert.equal(cueUrl.searchParams.has('substantial'), false);
});

test('buyout or soundtrack-album rights stay individually quoted', () => {
  for (const licence of ['buyout', 'album']) {
    const q = quote({ ...std, licence });
    assert.equal(q.kind, 'custom', `${licence} must be quoted individually`);
    assert.equal(q.reason, 'licence');
  }
});

test('more than 12 scored minutes is custom without treating every feature as substantial', () => {
  const q = quote({ ...std, scoredMinutes: 13 });
  assert.equal(q.kind, 'custom');
  assert.equal(q.reason, 'long-form');
  assert.match(q.message, /\$2,500/);
  assert.match(q.message, /not to every project associated with a feature/);
});

test('inquiry budgets and centralized tokens use the approved USD prices', () => {
  const options = budgetOptions().join(' | ');
  assert.match(options, /Individual Scene Scoring: from \$250 USD/);
  assert.match(options, /Focused Short-Film Score: from \$650 USD/);
  assert.match(options, /Extended Short-Film Score: from \$1,500 USD/);
  assert.match(options, /Feature Film & Experimental Cinema: custom quotation; indicative minimum \$2,500/);
  assert.equal(tokenValue('minimum'), '$250');
  assert.equal(tokenValue('feature.minimum'), '$2,500');
  assert.equal(tokenValue('scene.label'), 'From $250');
  assert.equal(tokenValue('focused.label'), 'From $650');
  assert.equal(tokenValue('extended.label'), 'From $1,500');
  assert.equal(tokenValue('scene.high'), null, 'do not publish an estimate ceiling as a package cap');
  assert.match(pricingSummary(), /scene from \$250.*focused short from \$650.*extended short from \$1,500.*\$2,500/s);
});

test('pricing metadata is dynamic and keeps token markers out of HTML attributes', () => {
  const meta = pricingMetaHtml();
  assert.match(meta, /scene from \$250/);
  assert.match(meta, /focused short from \$650/);
  assert.match(meta, /extended short from \$1,500/);
  assert.match(meta, /\$2,500/);
  assert.doesNotMatch(meta, /<!--v:|<!--\/v:|\{\{zp:/);
  assert.equal((meta.match(/<meta\b/g) ?? []).length, 3);
});

test('pricing cards, estimator and inquiry explain starting fees and feature scope', () => {
  const cards = packagesHtml();
  assert.match(cards, /From \$250/);
  assert.match(cards, /From \$650/);
  assert.match(cards, /From \$1,500/);
  assert.match(cards, /not fixed-price caps/);
  assert.match(cards, /not a guarantee of a specific amount of finished music/);
  assert.match(cards, /\$2,500 USD for substantial scoring engagements only/);
  assert.match(cards, /single scene or cue for a feature/);

  const estimator = estimatorHtml();
  assert.match(estimator, /name="substantial"/);
  assert.match(estimator, /leave unchecked for one scene\/cue/i);
  assert.match(estimator, /From \$650|\$650/);

  const inquiry = inquiryFormHtml();
  assert.match(inquiry, /Focused Short-Film Score \(From \$650 USD starting fee\)/);
  assert.match(inquiry, /indicative minimum \$2,500 USD for substantial scores/);
  assert.match(inquiry, /feature-film client commissioning one scene\/cue/i);
});

test('contact inquiry is low-friction and defers optional scope details', () => {
  const inquiry = inquiryFormHtml();
  const requiredInputs = [...inquiry.matchAll(/<input[^>]*required[^>]*>/g)]
    .map((match) => match[0].match(/name="([^"]+)"/)?.[1]);
  assert.deepEqual(requiredInputs, ['name', 'email']);
  const projectInput = inquiry.match(/<input[^>]*name="project"[^>]*>/)?.[0];
  assert.ok(projectInput, 'project field remains available');
  assert.doesNotMatch(projectInput, /required/);
  assert.match(inquiry, /<details class="zp-inq-details" data-zp-inquiry-details>/);
  assert.match(inquiry, /Optional project details/);
  assert.doesNotMatch(inquiry, /<details[^>]*open/);
  assert.equal(FORMATS[0], 'Not sure yet');
});

test('homepage contact keeps a single neutral format and tone default', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const label of ['Theme / tone', 'Format']) {
    const labelIndex = html.indexOf(`aria-label="${label}"`);
    const start = html.lastIndexOf('<select', labelIndex);
    const end = html.indexOf('</select>', labelIndex) + '</select>'.length;
    const select = html.slice(start, end);
    assert.ok(start >= 0 && end > start, `${label} selector exists`);
    assert.equal((select.match(/<option value="Not sure yet"/g) ?? []).length, 1, `${label} has one neutral option`);
    assert.match(select, /<option value="Not sure yet" selected>/);
  }
});

test('estimator hand-off opens optional inquiry details when scope is prefilled', () => {
  const source = readFileSync(new URL('../src/estimator/main.ts', import.meta.url), 'utf8');
  const prefill = source.slice(source.indexOf('const scope = scopeFromParams(params);'), source.indexOf('function textOf'));
  assert.ok(prefill.includes("form.querySelector<HTMLDetailsElement>('[data-zp-inquiry-details]')"));
  assert.ok(prefill.includes('if (moreDetails) moreDetails.open = true;'));
  assert.ok(prefill.indexOf('if (scope) {') < prefill.indexOf('moreDetails.open = true;'));
});

test('Offer schema publishes starting prices only, never a maximum or conditional feature minimum', () => {
  const graph = offersGraph('https://example.com/services#service', 'https://example.com/#org');
  const offers = graph['@graph'];
  const scene = offers.find((offer) => offer.name === 'Individual Scene Scoring');
  const feature = offers.find((offer) => offer.name === 'Feature Film & Experimental Cinema');
  assert.equal(scene.priceSpecification.priceCurrency, 'USD');
  assert.equal(scene.priceSpecification.minPrice, 250);
  assert.equal('maxPrice' in scene.priceSpecification, false);
  assert.equal('priceSpecification' in feature, false);
});
