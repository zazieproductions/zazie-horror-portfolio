#!/usr/bin/env node
/**
 * Regression checks for the pricing model in src/data/pricing.ts.
 * Run after `npx tsc -p .`:  node --test tools/pricing.test.mjs
 *
 * Checks package routing by SCORED MUSIC minutes, published bands, monotonic
 * quoting, rounding, surcharges, and the custom-quote paths (long-form scores
 * and licences that are never added to an estimate, such as buyout).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_SCOPE, MINIMUM_FEE, ROUND_TO, PACKAGES, estimatePackageFor, quote, budgetOptions,
} from '../build/data/pricing.js';

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

test('standard scope matches the published Scene band', () => {
  const q3 = est({ scoredMinutes: 2 });
  assert.equal(q3.packageId, 'scene');
  assert.equal(q3.low, 350);
  assert.equal(q3.high, 500);
  const q1 = est({ scoredMinutes: 1 });
  assert.ok(q1.low >= MINIMUM_FEE, 'never below the minimum fee');
  assert.ok(q1.low <= q1.high);
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
  let prev = 0;
  for (let m = 1; m <= 12; m++) {
    const q = est({ scoredMinutes: m });
    assert.ok(q.low >= prev, `low fell at ${m} min`);
    prev = q.low;
  }
});

test('surcharges only raise the quote: deadline, complexity, revisions, licence', () => {
  const base = est({ scoredMinutes: 5 });
  assert.ok(est({ scoredMinutes: 5, deadline: 'rush' }).low > base.low, 'rush deadline');
  assert.ok(est({ scoredMinutes: 5, complexity: 'bespoke' }).low > base.low, 'bespoke complexity');
  assert.ok(est({ scoredMinutes: 5, extraRevisionRounds: 2 }).low > base.low, 'extra revisions');
  assert.equal(quote({ ...std, scoredMinutes: 5, licence: 'exclusive' }).kind, 'custom', 'expanded rights require a separate quote');
});

test('a licence buyout or album is never added to an estimate', () => {
  for (const licence of ['buyout', 'album']) {
    const q = quote({ ...std, licence });
    assert.equal(q.kind, 'custom', `${licence} must be quoted individually`);
    assert.equal(q.reason, 'licence');
  }
});

test('scores above the long-form threshold are quoted individually', () => {
  const q = quote({ ...std, scoredMinutes: 13 });
  assert.equal(q.kind, 'custom');
  assert.equal(q.reason, 'long-form');
});

test('every published package has a band and a minute range', () => {
  for (const p of PACKAGES.filter((x) => x.id !== 'feature')) {
    assert.ok(p.minutes && p.low && p.high, `${p.id} band`);
    assert.ok(p.minutes.min <= p.minutes.max, `${p.id} minutes`);
  }
});

test('budget options carry the published package names', () => {
  const opts = budgetOptions().join(' | ');
  assert.match(opts, /Individual Scene Scoring: from \$250/);
  assert.match(opts, /Focused Short-Film Scoring: from \$650/);
  assert.match(opts, /Extended Short-Film Scoring: from \$1,500/);
  assert.doesNotMatch(opts, /\$75\.99|few hundred|sliding/i);
});

test('approved starting prices and package-specific revision allowances', () => {
  assert.equal(PACKAGES[0].low.start, 250);
  assert.equal(PACKAGES[1].low.start, 650);
  assert.equal(PACKAGES[2].low.start, 1500);
  const one = est({ scoredMinutes: 2 });
  assert.match(one.factors.find((f) => f.label === 'Revisions').value, /1 consolidated round/);
  const extended = est({ scoredMinutes: 6 });
  assert.match(extended.factors.find((f) => f.label === 'Revisions').value, /2 consolidated rounds/);
});

test('additional cue counts route to an individually scoped quotation', () => {
  const q = quote({ ...std, scoredMinutes: 2, cueCount: 6 });
  assert.equal(q.kind, 'custom');
  assert.equal(q.reason, 'cue-scope');
  assert.match(q.message, /cue count.*quoted individually/i);
});

test('additional cue counts route to an individually scoped quotation', () => {
  const q = quote({ ...std, scoredMinutes: 2, cueCount: 6 });
  assert.equal(q.kind, 'custom');
  assert.equal(q.reason, 'cue-scope');
  assert.match(q.message, /cue count.*quoted individually/i);
});
