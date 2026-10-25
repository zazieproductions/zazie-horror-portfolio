#!/usr/bin/env node
/**
 * Authority-linking regression tests.
 *
 * These guard the two halves of the knowledge-graph work:
 *
 *   * src/data/authority.ts - every concept carries a Wikidata item, a
 *     Wikipedia article and only IMDb links IMDb actually serves;
 *   * the published tree - no genre/knowsAbout value is left as loose text,
 *     and the composer entity resolves to the same prestige vocabulary on
 *     every page that declares it.
 *
 * The full site-wide audit lives in tools/authority.mjs; this file asserts the
 * same contract from the test runner so `npm test` fails loudly too.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  AUTHORITY_HOSTS,
  AUTHORITY_URLS,
  CONCEPTS,
  KNOWS_ABOUT,
  LABEL_CONCEPTS,
  WIKIDATA_ENTITY,
  conceptNode,
  conceptNodes,
  conceptsForLabel,
  genreTerms,
  knowsAboutNodes,
} from '../build/data/authority.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

function blocks(html) {
  return [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
}

function nodesOf(html) {
  return blocks(html).flatMap((block) => block['@graph'] ?? (Array.isArray(block) ? block : [block]));
}

const HOSTS = new Set(AUTHORITY_HOSTS);

test('every concept is anchored to a live Wikidata item and a Wikipedia article', () => {
  const seen = new Map();
  for (const [key, concept] of Object.entries(CONCEPTS)) {
    assert.match(concept.wikidata, /^Q\d+$/, `${key}: Wikidata id looks like a QID`);
    assert.ok(concept.name.trim().length > 1, `${key}: has a display name`);
    assert.ok(!seen.has(concept.wikidata), `${key}: ${concept.wikidata} duplicates ${seen.get(concept.wikidata)}`);
    seen.set(concept.wikidata, key);

    const node = conceptNode(key);
    assert.equal(node['@id'], `${WIKIDATA_ENTITY}${concept.wikidata}`);
    assert.equal(node.name, concept.name);
    assert.equal(node['@type'], 'DefinedTerm');
    assert.ok(node.sameAs.length >= 1, `${key}: at least one cross-reference`);
    assert.equal(node.sameAs[0], `https://en.wikipedia.org/wiki/${concept.wikipedia}`);

    for (const url of node.sameAs) {
      const parsed = new URL(url);
      assert.equal(parsed.protocol, 'https:', `${key}: ${url} is https`);
      assert.ok(HOSTS.has(parsed.host), `${key}: ${url} is on an allowlisted authority host`);
    }
    assert.deepEqual(conceptNodes([key, key]), [node], `${key}: nodes are deduplicated`);
  }
});

test('IMDb links are genre filters or keywords, never invented title pages', () => {
  for (const [key, concept] of Object.entries(CONCEPTS)) {
    if (!concept.imdb) continue;
    const url = new URL(concept.imdb);
    assert.equal(url.host, 'www.imdb.com');
    assert.equal(url.pathname, '/search/title/');
    assert.match(url.search, /(?:genres|keywords)=[a-z-]+&explore=(?:genres|keywords)$/, `${key}: ${concept.imdb}`);
  }
});

test('every label used by the content modules resolves to an authority node', () => {
  for (const [label, keys] of Object.entries(LABEL_CONCEPTS)) {
    assert.equal(label, label.trim().toLowerCase().replace(/\s+/g, ' '), `${label}: keys are normalised`);
    assert.ok(keys.length > 0, `${label}: maps to at least one concept`);
    for (const key of keys) assert.ok(key in CONCEPTS, `${label}: ${key} exists in the registry`);
  }
  assert.deepEqual(conceptsForLabel('  FOLK   horror '), ['folkHorror'], 'label lookup is whitespace/case tolerant');
  assert.deepEqual(conceptsForLabel('Art Horror'), ['artHorror'], 'a concept name is a valid label');
  assert.throws(() => conceptsForLabel('splatter-adjacent vibes'), /no knowledge-graph mapping/);
});

test('genreTerms keeps order, drops duplicates, and refuses unmapped labels', () => {
  const terms = genreTerms(['Horror', 'Thriller', 'Horror']);
  assert.deepEqual(terms.map((node) => node.name), ['Horror Film', 'Thriller Film']);
  assert.equal(terms[0]['@id'], `${WIKIDATA_ENTITY}Q200092`);
  assert.throws(() => genreTerms('unmapped genre'), /no knowledge-graph mapping/);
});

test('the composer vocabulary is prestige-first and fully linked', () => {
  const prestige = ['Psychological Horror', 'Folk Horror', 'Body Horror', 'Cosmic Horror', 'Supernatural Horror', 'Art Horror'];
  const names = KNOWS_ABOUT.map((key) => CONCEPTS[key].name);
  assert.deepEqual(names.slice(0, prestige.length), prestige, 'horror niches lead the list');
  assert.equal(new Set(KNOWS_ABOUT).size, KNOWS_ABOUT.length, 'no duplicate concepts');
  const nodes = knowsAboutNodes();
  assert.equal(nodes.length, KNOWS_ABOUT.length);
  for (const node of nodes) assert.ok(AUTHORITY_URLS.includes(node['@id']), `${node.name} id is registered`);
});

test('published pages carry no unlinked genre or knowsAbout strings', () => {
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (['node_modules', 'build', 'dist', '.git', 'src', 'scripts', 'tools', 'legal-src', 'store-src', 'home-src'].includes(entry.name)) continue;
        walk(path.join(dir, entry.name));
      } else if (entry.name.endsWith('.html')) {
        const html = fs.readFileSync(path.join(dir, entry.name), 'utf8');
        assert.doesNotMatch(html, /"genre"\s*:\s*"/, `${path.relative(ROOT, path.join(dir, entry.name))}: genre is a node`);
        assert.doesNotMatch(html, /"knowsAbout"\s*:\s*"/, `${path.relative(ROOT, path.join(dir, entry.name))}: knowsAbout is a node`);
        for (const node of nodesOf(html)) {
          for (const field of ['genre', 'knowsAbout']) {
            if (!node?.[field]) continue;
            for (const term of Array.isArray(node[field]) ? node[field] : [node[field]]) {
              if (typeof term === 'string') offenders.push(`${path.relative(ROOT, path.join(dir, entry.name))} ${field}: ${term}`);
            }
          }
        }
      }
    }
  };
  walk(ROOT);
  assert.deepEqual(offenders, [], 'no string-valued genre/knowsAbout anywhere');
});

test('the composer entity publishes the same linked vocabulary on / and /composer', () => {
  const expected = knowsAboutNodes().map((node) => node['@id']);
  for (const relative of ['index.html', 'composer.html', 'composer/index.html']) {
    const person = nodesOf(read(relative)).find((node) => node['@type'] === 'Person');
    assert.ok(person?.knowsAbout, `${relative}: Person declares knowsAbout`);
    assert.deepEqual(person.knowsAbout.map((node) => node['@id']), expected, `${relative}: canonical order`);
    for (const node of person.knowsAbout) {
      assert.equal(node['@type'], 'DefinedTerm');
      for (const url of node.sameAs) {
        assert.ok(HOSTS.has(new URL(url).host), `${relative}: ${url} host`);
      }
    }
  }
  assert.equal(read('composer.html'), read('composer/index.html'), 'hub twins stay byte-identical');
  assert.equal(read('reel.html'), read('reel/index.html'), 'reel twins stay byte-identical');
});

test('prestige niches reach the graph from the pages studios actually read', () => {
  const composer = nodesOf(read('composer.html')).find((node) => node['@type'] === 'Person');
  const ids = new Set(composer.knowsAbout.map((node) => node['@id']));
  for (const [key, label] of [
    ['psychologicalHorror', 'Psychological Horror'],
    ['folkHorror', 'Folk Horror'],
    ['artHorror', 'Art Horror'],
    ['slowCinema', 'Slow Cinema'],
    ['musiqueConcrete', 'Musique Concrète'],
    ['waterphone', 'Waterphone'],
  ]) {
    assert.ok(ids.has(`${WIKIDATA_ENTITY}${CONCEPTS[key].wikidata}`), `${label} is linked`);
  }

  // Work pages link their genre to the same concept ids.
  const movie = nodesOf(read('work/eclipsed.html')).find((node) => node['@type'] === 'Movie');
  assert.ok(
    movie.genre.some((term) => term['@id'] === `${WIKIDATA_ENTITY}Q200092`),
    '/work/eclipsed genre links to Horror Film (Q200092)',
  );
  const cue = nodesOf(read('reel/needle-in-the-nerve.html')).find((node) => node['@type'] === 'MusicComposition');
  assert.ok(
    cue.genre.some((term) => term['@id'] === `${WIKIDATA_ENTITY}Q604725`),
    'psychological horror cue links to Q604725',
  );
});

test('the site-wide authority audit passes', () => {
  const output = execFileSync(process.execPath, [path.join(ROOT, 'tools', 'authority.mjs'), '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.match(output, /PASS - \d+ genre\/knowsAbout values on \d+ pages resolve to \d+ Wikidata-anchored concepts/);
});
