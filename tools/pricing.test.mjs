#!/usr/bin/env node
/**
 * Regression checks for the commercial pricing model.
 *
 * Run after `npx tsc -p .` (the npm test script does not compile):
 *   node --test tools/pricing.test.mjs
 *
 * What this covers
 *   - routing by SCORED MUSIC minutes (never film runtime)
 *   - published "from" figures and the custom feature path
 *   - non-overlapping package boundaries and no pricing cliffs
 *   - the consolidated-revision policy and the additional-round charge
 *   - cue allowances, licence exclusions, deadline and complexity multipliers
 *   - the approved estimator copy, the micro-budget statement and the
 *     absence of retired prices and terms from every commercial page
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_SCOPE, FEATURE_MINIMUM, MAX_EXTRA_REVISION_ROUNDS, MICRO_BUDGET_STATEMENT, MINIMUM_FEE,
  PACKAGES, PRELIMINARY_NOTICE, REVISION_FEE_MINIMUM, REVISION_FEE_RATE, ROUND_TO,
  budgetOptions, complexityById, deadlineById, estimatePackageFor, licenceById, packageById,
  priceLabel, quote, revisionRoundFee, usd,
} from '../build/data/pricing.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** A standard, fully-specified scope for one scored-minutes value. */
const scope = (over = {}) => ({ ...DEFAULT_SCOPE, cueCount: undefined, ...over });

function est(over = {}) {
  const q = quote(scope(over));
  assert.equal(q.kind, 'estimate', `expected an estimate for ${JSON.stringify(over)}`);
  return q;
}

/* ------------------------------------------------------------ routing */

test('packages route by scored music minutes, not film runtime', () => {
  assert.equal(estimatePackageFor(1)?.id, 'scene');
  assert.equal(estimatePackageFor(2)?.id, 'scene');
  assert.equal(estimatePackageFor(3)?.id, 'focused');
  assert.equal(estimatePackageFor(5)?.id, 'focused');
  assert.equal(estimatePackageFor(6)?.id, 'extended');
  assert.equal(estimatePackageFor(12)?.id, 'extended');
  assert.equal(estimatePackageFor(13), null, 'above 12 scored minutes is custom');
});

test('package minute bands do not overlap and leave no gap from 1 to 12', () => {
  const bands = PACKAGES.filter((p) => p.minutes).map((p) => p.minutes);
  bands.sort((a, b) => a.min - b.min);
  assert.equal(bands[0].min, 1);
  for (let i = 1; i < bands.length; i++) {
    assert.equal(bands[i].min, bands[i - 1].max + 1, `band ${i} must start where the previous one ends`);
  }
  assert.equal(bands.at(-1).max, 12);
});

test('the same scope gives the same answer every time (deterministic)', () => {
  const a = JSON.stringify(quote(scope({ scoredMinutes: 4, complexity: 'layered', deadline: 'rush', extraRevisionRounds: 2 })));
  const b = JSON.stringify(quote(scope({ scoredMinutes: 4, complexity: 'layered', deadline: 'rush', extraRevisionRounds: 2 })));
  assert.equal(a, b);
});

test('fractional and out-of-range minute inputs are rounded up and clamped', () => {
  assert.equal(est({ scoredMinutes: 2.2 }).packageId, 'focused', '2.2 minutes rounds up to 3');
  assert.equal(est({ scoredMinutes: 0 }).scoredMinutes, 1);
  assert.equal(est({ scoredMinutes: Number.NaN }).scoredMinutes, 1);
});

/* ---------------------------------------------- published figures */

test('published "from" figures are the approved rates', () => {
  assert.equal(packageById('scene').startingFee, 250);
  assert.equal(packageById('focused').startingFee, 650);
  assert.equal(packageById('extended').startingFee, 1500);
  assert.equal(FEATURE_MINIMUM, 2500);
  assert.equal(priceLabel(packageById('scene')), 'From $250');
  assert.equal(priceLabel(packageById('focused')), 'From $650');
  assert.equal(priceLabel(packageById('extended')), 'From $1,500');
  assert.equal(priceLabel(packageById('feature')), 'Custom quotation');
});

test('the default estimate is $650 to $750 (Focused, 3 scored minutes, standard)', () => {
  const q = quote(DEFAULT_SCOPE);
  assert.equal(q.kind, 'estimate');
  assert.equal(q.packageId, 'focused');
  assert.equal(q.low, 650);
  assert.equal(q.high, 750);
});

test('the Scene starting fee applies at the bottom of its band and the Extended fee at the bottom of its band', () => {
  assert.equal(est({ scoredMinutes: 1 }).low, 250);
  assert.equal(est({ scoredMinutes: 6 }).low, 1500);
  assert.equal(est({ scoredMinutes: 3 }).low, 650);
});

test('the Extended band tops out at the 12-minute figure and a feature begins above it', () => {
  assert.equal(est({ scoredMinutes: 12 }).low, 2400);
  const feature = quote(scope({ scoredMinutes: 13 }));
  assert.equal(feature.kind, 'custom');
  assert.equal(feature.indicativeMinimum, 2500);
});

/* -------------------------------------------- continuity and cliffs */

test('quotes never fall as scored minutes rise (standard scope)', () => {
  let prev = 0;
  for (let m = 1; m <= 12; m++) {
    const q = est({ scoredMinutes: m });
    assert.ok(q.low >= prev, `low fell at ${m} minutes (${prev} -> ${q.low})`);
    prev = q.low;
  }
  assert.ok(quote(scope({ scoredMinutes: 13 })).indicativeMinimum >= prev, 'the feature minimum is not below the 12-minute fee');
});

test('within a package each extra minute adds exactly the published per-minute amount', () => {
  for (const pkg of PACKAGES.filter((p) => p.minutes)) {
    for (let m = pkg.minutes.min + 1; m <= pkg.minutes.max; m++) {
      const step = est({ scoredMinutes: m }).low - est({ scoredMinutes: m - 1 }).low;
      assert.equal(step, pkg.perExtraMinute, `${pkg.id} step into ${m} minutes`);
    }
  }
});

test('no package boundary jumps by more than 30% (no pricing cliffs)', () => {
  const boundaries = [2, 5];
  for (const m of boundaries) {
    const before = est({ scoredMinutes: m }).low;
    const after = est({ scoredMinutes: m + 1 }).low;
    const jump = (after - before) / before;
    assert.ok(jump <= 0.3 + 1e-9, `boundary ${m}->${m + 1} jumps ${(jump * 100).toFixed(1)}%`);
  }
  const twelve = est({ scoredMinutes: 12 }).low;
  assert.ok((FEATURE_MINIMUM - twelve) / twelve <= 0.3, 'the 12 to 13 minute step is within 30%');
});

test('the Scene-to-Focused boundary keeps the Focused floor above the Scene top', () => {
  assert.ok(est({ scoredMinutes: 2 }).high < est({ scoredMinutes: 3 }).low, 'no overlap of ranges');
  assert.ok(est({ scoredMinutes: 5 }).high < est({ scoredMinutes: 6 }).low, 'no overlap of ranges');
});

test('every figure is in the published rounding step and ordered low <= high', () => {
  for (let m = 1; m <= 12; m++) {
    for (const complexity of ['standard', 'layered', 'bespoke']) {
      for (const deadline of ['standard', 'expedited', 'rush']) {
        const q = est({ scoredMinutes: m, complexity, deadline, extraRevisionRounds: 1 });
        assert.equal(q.low % ROUND_TO, 0, `low ${q.low}`);
        assert.equal(q.high % ROUND_TO, 0, `high ${q.high}`);
        assert.ok(q.low <= q.high, `order at ${m} min ${complexity} ${deadline}`);
        assert.ok(q.low >= MINIMUM_FEE, `never below the minimum fee at ${m} min`);
      }
    }
  }
});

/* ------------------------------------------- multipliers and surcharges */

test('complexity multipliers are 1.0, 1.2 and 1.4', () => {
  assert.equal(complexityById('standard').multiplier, 1);
  assert.equal(complexityById('layered').multiplier, 1.2);
  assert.equal(complexityById('bespoke').multiplier, 1.4);
  assert.equal(est({ scoredMinutes: 3, complexity: 'layered' }).commissionLow, 775, '650 x 1.2 = 780, rounded to the $25 step');
  assert.equal(est({ scoredMinutes: 3, complexity: 'bespoke' }).commissionLow, 900, '650 x 1.4 = 910, rounded to the $25 step');
});

test('deadline surcharges: standard none, expedited +15%, rush +30%', () => {
  assert.equal(deadlineById('standard').multiplier, 1);
  assert.equal(deadlineById('expedited').multiplier, 1.15);
  assert.equal(deadlineById('rush').multiplier, 1.3);
  assert.equal(est({ scoredMinutes: 3, deadline: 'expedited' }).commissionLow, 750);
  assert.equal(est({ scoredMinutes: 3, deadline: 'rush' }).commissionLow, 850);
});

test('the range is the commission fee plus 15%, rounded to the step', () => {
  const q = est({ scoredMinutes: 3 });
  assert.equal(q.commissionLow, 650);
  assert.equal(q.commissionHigh, 750);
  const q5 = est({ scoredMinutes: 5 });
  assert.equal(q5.commissionLow, 1250);
  assert.equal(q5.commissionHigh, 1450);
});

/* ------------------------------------------------------ revisions */

test('included revision rounds: Scene 1, Focused 1, Extended 2', () => {
  assert.equal(packageById('scene').revisionRoundsIncluded, 1);
  assert.equal(packageById('focused').revisionRoundsIncluded, 1);
  assert.equal(packageById('extended').revisionRoundsIncluded, 2);
  assert.equal(est({ scoredMinutes: 2 }).includedRevisionRounds, 1);
  assert.equal(est({ scoredMinutes: 4 }).includedRevisionRounds, 1);
  assert.equal(est({ scoredMinutes: 8 }).includedRevisionRounds, 2);
});

test('an additional round costs the greater of $75 or 10% of the commission fee', () => {
  assert.equal(REVISION_FEE_MINIMUM, 75);
  assert.equal(REVISION_FEE_RATE, 0.1);
  assert.equal(revisionRoundFee(250), 75, '10% of 250 is 25, so the $75 minimum applies');
  assert.equal(revisionRoundFee(650), 75, '10% of 650 is 65, so the $75 minimum applies');
  assert.equal(revisionRoundFee(1000), 100);
  assert.equal(revisionRoundFee(1250), 125);
});

test('each requested extra round adds the charge at both ends of the range', () => {
  const base = est({ scoredMinutes: 3 });
  const one = est({ scoredMinutes: 3, extraRevisionRounds: 1 });
  assert.equal(one.revisionRoundLow, revisionRoundFee(base.commissionLow));
  assert.equal(one.revisionRoundHigh, revisionRoundFee(base.commissionHigh));
  assert.equal(one.low, base.low + 75);
  assert.equal(one.high, base.high + 75);
  const two = est({ scoredMinutes: 3, extraRevisionRounds: 2 });
  assert.equal(two.low, base.low + 150);
});

test('extra revision rounds are capped at the maximum', () => {
  const capped = est({ scoredMinutes: 3, extraRevisionRounds: 99 });
  assert.equal(capped.extraRevisionRounds, MAX_EXTRA_REVISION_ROUNDS);
});

test('the revision policy is stated in the factors, not left implicit', () => {
  const q = est({ scoredMinutes: 3, extraRevisionRounds: 1 });
  const revisions = q.factors.find((f) => f.label === 'Revisions');
  assert.ok(revisions, 'revisions factor present');
  assert.match(revisions.value, /1 consolidated round included/);
  assert.match(revisions.value, /greater of \$75 or 10%/);
});

/* -------------------------------------------- cues and licence scope */

test('cue allowances: Scene 3, Focused 6, Extended 10', () => {
  assert.equal(packageById('scene').cueAllowance, 3);
  assert.equal(packageById('focused').cueAllowance, 6);
  assert.equal(packageById('extended').cueAllowance, 10);
});

test('an unspecified cue count assumes the package allowance', () => {
  assert.equal(est({ scoredMinutes: 4, cueCount: undefined }).cueCount, 6);
  assert.equal(est({ scoredMinutes: 4, cueCount: 0 }).cueCount, 6);
});

test('cues above the allowance are quoted separately and never priced by formula', () => {
  const within = est({ scoredMinutes: 4, cueCount: 6 });
  const above = est({ scoredMinutes: 4, cueCount: 9 });
  assert.equal(above.low, within.low, 'the range does not move with extra cues');
  assert.equal(above.high, within.high);
  assert.equal(above.quotedSeparately.length >= 1, true);
  assert.match(above.quotedSeparately[0], /3 cues above the 6 included/);
});

test('expanded, exclusive, buyout and album licences are excluded from every range', () => {
  const standard = est({ scoredMinutes: 3, licence: 'standard' });
  for (const licence of ['expanded', 'exclusive', 'buyout', 'album']) {
    const q = est({ scoredMinutes: 3, licence });
    assert.equal(q.low, standard.low, `${licence} must not change the range`);
    assert.equal(q.high, standard.high, `${licence} must not change the range`);
    assert.ok(q.quotedSeparately.some((line) => /quoted separately/.test(line)), `${licence} is listed as quoted separately`);
    assert.equal(licenceById(licence).included, false);
  }
  assert.equal(licenceById('standard').included, true);
});

test('no licence or extra service is given a dollar amount on the estimator', () => {
  for (const licence of ['expanded', 'exclusive', 'buyout', 'album']) {
    const q = est({ scoredMinutes: 3, licence });
    for (const line of q.quotedSeparately) assert.doesNotMatch(line, /\$/, `${licence}: ${line}`);
  }
});

/* -------------------------------------------- feature and custom path */

test('a feature is custom above 12 minutes with the $2,500 indicative minimum', () => {
  const q = quote(scope({ scoredMinutes: 20 }));
  assert.equal(q.kind, 'custom');
  assert.equal(q.nonbinding, true);
  assert.equal(q.indicativeMinimum, FEATURE_MINIMUM);
  assert.match(q.message, /2,500/);
});

test('a single scene from a feature is still an Individual Scene estimate', () => {
  const q = est({ scoredMinutes: 1, licence: 'standard' });
  assert.equal(q.packageId, 'scene');
  assert.equal(q.low, 250);
});

/* ------------------------------------------------ copy and budget list */

test('the approved micro-budget statement is exact', () => {
  assert.equal(
    MICRO_BUDGET_STATEMENT,
    'Independent and micro-budget productions are welcome to inquire. Where appropriate, a reduced musical scope or licensing of existing material may offer a more accessible alternative.',
  );
});

test('the preliminary-estimate notice is exact', () => {
  assert.equal(PRELIMINARY_NOTICE, 'Preliminary estimate — final quotation subject to creative scope and written agreement.');
});

test('the budget list offers the approved packages with their from-figures', () => {
  const options = budgetOptions().join('\n');
  assert.match(options, /Individual Scene Scoring: from \$250/);
  assert.match(options, /Focused Short-Film Scoring: from \$650/);
  assert.match(options, /Extended Short-Film Scoring: from \$1,500/);
  assert.match(options, /custom quotation \(indicative minimum \$2,500\)/);
  assert.doesNotMatch(options, /\$200|\$75\.99|Under \$300|\$900\+/);
});

test('usd() formats whole dollars with thousands separators', () => {
  assert.equal(usd(250), '$250');
  assert.equal(usd(1500), '$1,500');
  assert.equal(usd(2500), '$2,500');
});

/* ------------------------------------------- generated copy and pages */

const RETIRED = [
  '$200', '$75.99', '$350', '$900', 'Scene from', 'Minimum fee $200', 'Two weeks', 'Under ten days',
  'Spotting to Stems', 'Two defined revision rounds', 'two rounds of notes per cue', 'Default grant is buyout',
  'Dark, atmospheric horror scores', 'Play the showreel',
];

/** Pages that present prices or the hire offer. Legal pages are reviewed separately (see COMMERCIAL-OVERHAUL.md). */
const COMMERCIAL_PAGES = [
  'index.html', 'services.html', 'hire-a-composer.html', 'contact.html', 'faq.html', 'process.html',
  'composer.html', '404.html', 'services/index.html', 'hire-a-composer/index.html', 'contact/index.html',
  'faq/index.html', 'process/index.html',
];

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
}

const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

test('commercial pages carry none of the retired prices or terms', () => {
  for (const rel of COMMERCIAL_PAGES) {
    const html = read(rel);
    for (const needle of RETIRED) {
      assert.equal(html.includes(needle), false, `${rel} still contains "${needle}"`);
    }
  }
});

test('the homepage headline and CTAs use the approved copy', () => {
  const text = visibleText(read('index.html'));
  assert.match(text, /Original Music for Psychological Horror & Experimental Cinema/);
  assert.match(text, /Dissonance\. Atmosphere\. Emotional intensity\./);
  assert.match(text, /Request a Scoring Quote/);
  assert.match(text, /Hear Selected Film Work/);
  assert.doesNotMatch(text, /audio contractor|generic audio/i);
});

test('the preliminary notice appears on every page that shows an estimate', () => {
  for (const rel of ['index.html', 'services.html', 'faq.html']) {
    assert.ok(visibleText(read(rel)).includes(PRELIMINARY_NOTICE), `${rel} shows the notice`);
  }
});

test('the micro-budget statement appears on the inquiry pages', () => {
  for (const rel of ['services.html', 'hire-a-composer.html', 'contact.html', 'faq.html']) {
    assert.ok(visibleText(read(rel)).includes(MICRO_BUDGET_STATEMENT), `${rel} carries the statement`);
  }
});

test('every dollar figure on a commercial page is an approved or derived figure', () => {
  const allowed = new Set([
    ...PACKAGES.map((p) => p.startingFee).filter((v) => v !== null),
    FEATURE_MINIMUM,
    REVISION_FEE_MINIMUM,
    quote(DEFAULT_SCOPE).low,
    quote(DEFAULT_SCOPE).high,
  ]);
  const allowedText = new Set([...allowed].map((v) => usd(v)));
  for (const rel of COMMERCIAL_PAGES) {
    const text = visibleText(read(rel));
    for (const [figure] of text.matchAll(/\$\d{1,3}(?:,\d{3})*(?!\d)/g)) {
      assert.ok(allowedText.has(figure), `${rel} shows ${figure}, which is not a published or derived figure`);
    }
  }
});

test('the homepage and services show the same package names and from-figures', () => {
  for (const rel of ['index.html', 'services.html']) {
    const text = visibleText(read(rel));
    assert.match(text, /Individual Scene Scoring[\s\S]*?\$250/, rel);
    assert.match(text, /Focused Short-Film Scoring[\s\S]*?\$650/, rel);
    assert.match(text, /Extended Short-Film Scoring[\s\S]*?\$1,500/, rel);
  }
});
