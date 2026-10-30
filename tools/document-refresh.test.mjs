import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('film samples start with Goodbye, Brother in both render paths', () => {
  const html = read('index.html');
  const bundle = read(/import\("\/(index-[0-9a-f]{8}\.js)"\)/.exec(html)[1]);
  const cards = [...html.matchAll(/<article id="sample-([^\"]+)"/g)].map((m) => m[1]);
  const projects = /projects:\[([\s\S]*?)\],images:/.exec(bundle)[1];
  const slugs = [...projects.matchAll(/slug:"([^\"]+)"/g)].map((m) => m[1]);
  assert.equal(cards[0], 'goodbye-brother');
  assert.deepEqual(slugs, cards);
});

test('compact documents retain full clauses and working fragment targets', () => {
  for (const page of ['terms', 'privacy', 'licensing', 'purchases', 'accessibility', 'sitemap']) {
    const source = read(`legal-src/pages/${page}.html`);
    const output = read(`${page}.html`);
    assert.equal(output, read(`${page}/index.html`));
    assert.match(output, /documents-[a-f0-9]{8}\.css/);
    assert.match(output, /src="\/documents\.js"/);
    const clauses = [...source.matchAll(/<section class="clause(?: site-map)?" id="([^\"]+)">\s*<details class="doc-section"><summary><h2>/g)];
    assert.ok(clauses.length >= 5, `${page} has expandable, named sections`);
    for (const [, id] of clauses) assert.ok(output.includes(`id="${id}"`));
  }
  assert.match(read('terms.html'), /Limitation of liability/);
  assert.match(read('privacy.html'), /Cloudflare Web Analytics/);
  assert.match(read('purchases.html'), /Returns and refunds/);
  assert.match(read('documents.js'), /hashchange/);
  assert.match(read('documents.js'), /beforeprint/);
});
