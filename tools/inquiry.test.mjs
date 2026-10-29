#!/usr/bin/env node
/**
 * Regression checks for the inquiry-led quoting model in
 * src/data/commission.ts. Run after `npx tsc -p .` (and a site build):
 * node --test tools/inquiry.test.mjs
 *
 * The published rate card, packages and cost estimator were removed
 * deliberately on 2026-10-27 so inquirers are not anchored by a figure seen
 * before writing. These tests keep it that way: no generated surface may
 * carry a studio fee, and the inquiry must keep asking the visitor for
 * their own budget range and musical references. Succeeded
 * tools/pricing.test.mjs.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  BUDGET_RANGES,
  COMMISSION_STEPS,
  FORMATS,
  QUOTE_FACTORS,
} from '../build/data/commission.js';
import {
  commissioningHtml,
  factorsHtml,
  inclusionsHtml,
  inquiryFormHtml,
  licencesHtml,
  serviceOfferGraph,
  tokenValue,
} from '../build/lib/commission-markup.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');

/** The retired rate card's figures and phrasing — none may reappear. */
const RETIRED_FEE = /\$650|\$1,500|From \$\d|starting fee|indicative minimum|Preliminary estimate|Individual Scene Scoring|Focused Short-Film Score|Extended Short-Film Score/i;

test('budget ranges are client-stated bands, never package fees', () => {
  assert.ok(BUDGET_RANGES[0].startsWith('Not sure yet'), 'first option lets an early inquiry skip the budget');
  assert.ok(BUDGET_RANGES.some((r) => r.startsWith('Flexible')), 'a flexible escape hatch exists');
  assert.doesNotMatch(BUDGET_RANGES.join(' | '), RETIRED_FEE);
  assert.ok(FORMATS.includes('Short film') && FORMATS.includes('Feature film'));
});

test('only price-free studio statements remain as {{zp:}} tokens', () => {
  for (const key of ['payment', 'microbudget', 'revision-definition', 'notice']) {
    assert.ok(tokenValue(key), `${key} token has a value`);
  }
  for (const key of ['scene.label', 'focused.from', 'minimum', 'feature-minimum', 'pricing.summary', 'extra-cue', 'revision-rate', 'starting-fee-note']) {
    assert.equal(tokenValue(key), null, `retired pricing token ${key} stays retired`);
  }
});

test('commissioning, inclusions, licences and factors carry no figure at all', () => {
  for (const [name, html] of [
    ['commissioning steps', commissioningHtml()],
    ['inclusions', inclusionsHtml()],
    ['licences', licencesHtml()],
    ['quote factors', factorsHtml()],
  ]) {
    assert.doesNotMatch(html, /\$\d/, `${name}: no dollar figure`);
    assert.doesNotMatch(html, RETIRED_FEE, `${name}: no retired rate-card language`);
  }
  assert.doesNotMatch(licencesHtml(), /Adds \d+%/, 'licences are described by rights, not price effects');
  assert.match(factorsHtml(), /Your budget/, 'the visitor\u2019s budget leads the factor list');
  assert.equal(COMMISSION_STEPS.length, 3);
  assert.match(COMMISSION_STEPS[1].title, /budget/i);
  assert.match(QUOTE_FACTORS.at(-1)[1], /50% deposit/, 'payment terms remain stated');
});

test('inquiry form asks for a stated budget and musical references, visibly', () => {
  const form = inquiryFormHtml();
  assert.match(form, /name="budget"/);
  for (const range of BUDGET_RANGES) assert.ok(form.includes(range), `budget option: ${range}`);
  assert.match(form, /name="tone"/, 'musical references field');
  assert.match(form, /Musical references/);
  // Budget and references sit before the optional-details disclosure.
  assert.ok(form.indexOf('name="budget"') < form.indexOf('zp-inq-details'), 'budget is always visible');
  assert.ok(form.indexOf('name="tone"') < form.indexOf('zp-inq-details'), 'references are always visible');
  assert.doesNotMatch(form, /name="pkg"/, 'no package select');
  assert.doesNotMatch(form, /type="checkbox"|mutual NDA|unreleased material is treated as confidential/i, 'no NDA checkbox or helper claim remains in the form');
  assert.doesNotMatch(form, RETIRED_FEE, 'no retired fee language anchors the form');
  assert.match(form, /no published rate card/i, 'the form explains the model in place');
});

test('Offer schema carries availability, never a price', () => {
  const graph = serviceOfferGraph('https://horror.zazieproductions.com/services#service', 'https://horror.zazieproductions.com/#org');
  const text = JSON.stringify(graph);
  assert.doesNotMatch(text, /price/i);
  const offer = graph['@graph'][0];
  assert.equal(offer.availability, 'https://schema.org/LimitedAvailability');
  assert.ok(offer.url.endsWith('/#contact'));
});

test('built commissioning pages publish no fee and funnel to the inquiry', () => {
  const services = read('services/index.html');
  assert.doesNotMatch(services, RETIRED_FEE, '/services: no retired fees');
  assert.doesNotMatch(services, /data-zp-est|Preliminary estimate/, '/services: no estimator');
  assert.doesNotMatch(services, /priceSpecification/, '/services: no priced Offer schema');
  assert.match(services, /href="\/#contact"[^>]*>\s*Start a scoring inquiry/, '/services links to the homepage inquiry form');

  const home = read('index.html');
  assert.match(home, /id="contact"/, 'the homepage carries the inquiry section');
  assert.match(home, /name="scored-minutes-music-not-film-length"/);
  assert.doesNotMatch(home, RETIRED_FEE, 'the homepage inquiry carries no retired fees');
  assert.ok(!existsSync(path.join(ROOT, 'contact/index.html')), 'the standalone contact page is removed');
  assert.match(read('_redirects'), /^\/contact\s+\/#contact\s+301$/m, 'legacy contact links redirect to the homepage inquiry');

  const hire = read('hire-a-composer/index.html');
  assert.doesNotMatch(hire, RETIRED_FEE, '/hire-a-composer: no retired fees');

  const faq = read('faq/index.html');
  assert.doesNotMatch(faq, RETIRED_FEE, '/faq: fee answers carry no figures');
});

test('homepage omits commissioning and closing sections while preserving the service route and inquiry form', () => {
  const home = read('index.html');
  assert.doesNotMatch(home, /id="services"|Commissioning a score|How commissioning works|zp-steps|READY WHEN YOU ARE|zp-close/);
  assert.doesNotMatch(home, /href="#services"/, 'no homepage link points to a removed anchor');
  assert.match(home, /href="\/services"[^>]*>Services/, 'the separate services route remains linked');
  assert.match(home, /id="contact"/, 'the homepage inquiry section remains');
  assert.doesNotMatch(home, /WGA|DGA|mutual NDA protocol/i, 'the removed confidentiality claim stays absent');
  for (const range of [BUDGET_RANGES[0], BUDGET_RANGES[3]]) {
    assert.ok(home.includes(range), `homepage budget select: ${range}`);
  }

  const bundleName = readdirSync(ROOT).find((f) => /^index-[0-9a-f]{8}\.js$/.test(f));
  assert.ok(bundleName, 'patched homepage bundle exists');
  const bundle = read(bundleName);
  assert.doesNotMatch(bundle, /id:"services"|Commissioning a score|How commissioning works|zp-steps|READY WHEN YOU ARE|zp-close/);
  assert.doesNotMatch(bundle, /href:"#services"/, 'bundle has no dead services anchor');
  assert.match(bundle, /href:"\/services",label:"Services"/, 'bundle keeps a link to the dedicated services route');
  assert.ok(bundle.includes(BUDGET_RANGES[3]), 'bundle budget list comes from commission.ts');
  assert.doesNotMatch(bundle, /Individual Scene Scoring: from/, 'no package-derived budget strings');
});
