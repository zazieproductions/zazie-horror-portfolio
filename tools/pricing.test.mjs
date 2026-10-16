#!/usr/bin/env node
/**
 * Regression checks for the pricing model in src/data/pricing.ts.
 * Run after `npx tsc -p .`:  node --test tools/pricing.test.mjs
 *
 * Checks package routing by SCORED MUSIC minutes, published starting fees,
 * monotonic quoting, rounding, surcharges, package-specific revision
 * allowances, and the custom-quote paths (long-form scores and licences that
 * are never added to an estimate, such as a copyright buyout).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_SCOPE, MINIMUM_FEE, ROUND_TO, PACKAGES, EXTRA_REVISION_MINIMUM,
  FEATURE_INDICATIVE_MINIMUM, bandAt, estimatePackageFor, includedRevisionsFor,
  priceLabel, quote, budgetOptions, revisionFeePerRound,
} from '../build/data/pricing.js';
import { offersGraph } from '../build/lib/pricing-markup.js';

const std = { ...DEFAULT_SCOPE, cueCount: undefined };
const est = (over = {}) => {
  const q = quote({ ...std, ...over });
  assert.equal(q.kind, 'estimate', `expected estimate for ${JSON.stringify(over)}`);
  return q;
};

test('packages route by scored music minutes, not film runtime', () => {
  assert.equal(estimatePackageFor(1)?.id, 'scene');
  assert.equal(estimatePackageFor(2)?.id, 'scene');
  assert.equal(estimatePackageFor(3)?.id, 'focused');
  assert.equal(estimatePackageFor(5)?.id, 'focused');
  assert.equal(estimatePackageFor(6)?.id, 'extended');
  assert.equal(estimatePackageFor(12)?.id, 'extended');
  assert.equal(estimatePackageFor(13), null, 'above 12 scored minutes is custom');
});

test('package minute bands are non-overlapping and cover 1..12 contiguously', () => {
  const bands = PACKAGES.filter((x) => x.id !== 'feature').map((p) => p.minutes);
  const seen = new Set();
  for (const b of bands) {
    for (let m = b.min; m <= b.max; m += 1) {
      assert.ok(!seen.has(m), `minute ${m} is covered twice`);
      seen.add(m);
    }
  }
  for (let m = 1; m <= 12; m += 1) assert.ok(seen.has(m), `minute ${m} is uncovered`);
});

test('standard scope matches the published starting-fee bands', () => {
  const q1 = est({ scoredMinutes: 1 });
  assert.equal(q1.packageId, 'scene');
  assert.equal(q1.low, 250);
  assert.equal(q1.high, 350);
  const q2 = est({ scoredMinutes: 2 });
  assert.equal(q2.low, 450);
  assert.equal(q2.high, 550);
  const q3 = est({ scoredMinutes: 3 });
  assert.equal(q3.packageId, 'focused');
  assert.equal(q3.low, 650);
  assert.equal(q3.high, 800);
  const q5 = est({ scoredMinutes: 5 });
  assert.equal(q5.low, 1150);
  assert.equal(q5.high, 1350);
  const q6 = est({ scoredMinutes: 6 });
  assert.equal(q6.packageId, 'extended');
  assert.equal(q6.low, 1500);
  assert.equal(q6.high, 1750);
  const q12 = est({ scoredMinutes: 12 });
  assert.equal(q12.low, 2250);
  assert.equal(q12.high, 2650);
  assert.ok(q1.low >= MINIMUM_FEE, 'never below the minimum fee');
});

test('every figure is rounded to the published step and ordered low <= high', () => {
  for (let m = 1; m <= 12; m++) {
    const q = est({ scoredMinutes: m });
    assert.equal(q.low % ROUND_TO, 0, `low ${q.low} at ${m} min`);
    assert.equal(q.high % ROUND_TO, 0, `high ${q.high} at ${m} min`);
    assert.ok(q.low <= q.high, `order at ${m} min`);
    assert.ok(q.low >= MINIMUM_FEE, `minimum at ${m} min`);
  }
});

test('quotes do not fall as scored minutes rise', () => {
  let prevLow = 0;
  let prevHigh = 0;
  for (let m = 1; m <= 12; m++) {
    const q = est({ scoredMinutes: m });
    assert.ok(q.low >= prevLow, `low fell at ${m} min`);
    assert.ok(q.high >= prevHigh, `high fell at ${m} min`);
    prevLow = q.low;
    prevHigh = q.high;
  }
});

test('package steps stay proportionate: no cliff without a scope change', () => {
  // The 2->3 and 5->6 steps change package (a meaningful scope change), but
  // neither may double the fee for one extra minute.
  for (const [a, b] of [[2, 3], [5, 6]]) {
    const qa = est({ scoredMinutes: a });
    const qb = est({ scoredMinutes: b });
    assert.ok(qb.low < qa.low * 1.6, `low cliff at ${a}->${b}: ${qa.low} to ${qb.low}`);
    assert.ok(qb.high < qa.high * 1.6, `high cliff at ${a}->${b}: ${qa.high} to ${qb.high}`);
  }
});

test('surcharges only raise the quote: deadline, complexity, revisions, licence', () => {
  const base = est({ scoredMinutes: 5 });
  assert.ok(est({ scoredMinutes: 5, deadline: 'rush' }).low > base.low, 'rush deadline');
  assert.ok(est({ scoredMinutes: 5, complexity: 'bespoke' }).low > base.low, 'bespoke complexity');
  assert.ok(est({ scoredMinutes: 5, extraRevisionRounds: 2 }).low > base.low, 'extra revisions');
  assert.ok(est({ scoredMinutes: 5, licence: 'exclusive' }).low > base.low, 'exclusive licence');
});

test('revision allowances are package-specific', () => {
  assert.equal(includedRevisionsFor('scene'), 1);
  assert.equal(includedRevisionsFor('focused'), 1);
  assert.equal(includedRevisionsFor('extended'), 2);
  assert.equal(est({ scoredMinutes: 2 }).includedRevisionRounds, 1);
  assert.equal(est({ scoredMinutes: 4 }).includedRevisionRounds, 1);
  assert.equal(est({ scoredMinutes: 8 }).includedRevisionRounds, 2);
});

test('an extra revision round costs $75 minimum or 10%, whichever is greater', () => {
  assert.equal(EXTRA_REVISION_MINIMUM, 75);
  assert.equal(revisionFeePerRound(250), 75, 'small fee pays the $75 minimum');
  assert.equal(revisionFeePerRound(750), 75, 'boundary pays $75');
  assert.equal(revisionFeePerRound(1000), 100, 'larger fee pays 10%');
  const base = est({ scoredMinutes: 3 });
  const plus1 = est({ scoredMinutes: 3, extraRevisionRounds: 1 });
  assert.equal(plus1.low, 725, '650 + $75 minimum');
  assert.equal(plus1.high, 875, '800 + $80 (10%)');
  assert.ok(plus1.low - base.low >= 75, 'low rises by at least the minimum');
  const big = est({ scoredMinutes: 10, extraRevisionRounds: 1 });
  assert.equal(big.low, 2200, '2000 + 10%');
});

test('a copyright buyout or album is never added to an estimate', () => {
  for (const licence of ['buyout', 'album']) {
    const q = quote({ ...std, licence });
    assert.equal(q.kind, 'custom', `${licence} must be quoted individually`);
    assert.equal(q.reason, 'licence');
    assert.match(q.message, /separate written agreement/);
  }
});

test('scores above the long-form threshold are quoted individually', () => {
  const q = quote({ ...std, scoredMinutes: 13 });
  assert.equal(q.kind, 'custom');
  assert.equal(q.reason, 'long-form');
  assert.match(q.message, /\$2,500/, 'names the indicative minimum');
  assert.match(q.message, /single scene/i, 'a feature scene can still use Individual Scene');
  assert.equal(FEATURE_INDICATIVE_MINIMUM, 2500);
});

test('every published package has a band and a minute range', () => {
  for (const p of PACKAGES.filter((x) => x.id !== 'feature')) {
    assert.ok(p.minutes && p.low && p.high, `${p.id} band`);
    assert.ok(p.minutes.min <= p.minutes.max, `${p.id} minutes`);
    assert.match(priceLabel(p), /^From \$/, `${p.id} publishes a starting fee, not a ceiling`);
    const span = bandAt(p, p.minutes.max);
    assert.ok(span.low >= p.low.start, `${p.id} band rises with minutes`);
  }
  const feature = PACKAGES.find((p) => p.id === 'feature');
  assert.equal(priceLabel(feature), 'Custom quotation');
  assert.equal(feature.indicativeMinimum, 2500);
});

test('offers publish floors only: no ceiling, feature names its indicative minimum', () => {
  const graph = offersGraph('https://horror.zazieproductions.com/services#service', 'https://horror.zazieproductions.com/#org');
  const offers = graph['@graph'];
  assert.equal(offers.length, 4);
  for (const offer of offers.filter((o) => !o['@id'].endsWith('#offer-feature'))) {
    assert.ok(offer.priceSpecification, `${offer.name} has a price`);
    assert.ok(offer.priceSpecification.minPrice, `${offer.name} has a floor`);
    assert.equal(offer.priceSpecification.maxPrice, undefined, `${offer.name} publishes no ceiling`);
  }
  const feat = offers.find((o) => o['@id'].endsWith('#offer-feature'));
  assert.equal(feat.priceSpecification, undefined, 'feature has no fixed price');
  assert.match(feat.description, /\$2,500/);
});

test('budget options carry the published package names', () => {
  const opts = budgetOptions().join(' | ');
  assert.match(opts, /Individual Scene Scoring: from \$250/);
  assert.match(opts, /Focused Short-Film Score: from \$650/);
  assert.match(opts, /Extended Short-Film Score: from \$1,500/);
  assert.match(opts, /Feature Film & Experimental Cinema: custom quotation \(indicative minimum \$2,500\)/);
  assert.doesNotMatch(opts, /\$200[^0-9]|from \$500\b|from \$900\b|few hundred|sliding|75\.99/i);
});

test('estimates are deterministic and fractional minutes round up', () => {
  const a = quote({ ...std, scoredMinutes: 4, cueCount: 9, complexity: 'layered', deadline: 'expedited', extraRevisionRounds: 1, licence: 'distribution' });
  const b = quote({ ...std, scoredMinutes: 4, cueCount: 9, complexity: 'layered', deadline: 'expedited', extraRevisionRounds: 1, licence: 'distribution' });
  assert.deepEqual(a, b);
  const frac = est({ scoredMinutes: 1.2 });
  assert.equal(frac.scoredMinutes, 2);
  assert.equal(frac.packageId, 'scene');
});
