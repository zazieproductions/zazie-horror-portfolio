#!/usr/bin/env node
/**
 * tools/authority.mjs
 * ---------------------------------------------------------------------------
 * Guardianship of the knowledge-graph links published in JSON-LD.
 *
 * Every `genre` and `knowsAbout` value on the site has to resolve to a real
 * external entity (a Wikidata item plus its Wikipedia article and, where IMDb
 * indexes the term, an IMDb genre or keyword deep link). Loose strings are the
 * failure mode this file exists to catch: they tell a search engine nothing it
 * can reconcile against the film industry's own vocabulary.
 *
 *   node tools/authority.mjs --check    what `npm run build` runs
 *   node tools/authority.mjs --sync     rewrite the published pages from
 *                                       src/data/authority.ts
 *
 * `--sync` edits only the `genre` / `knowsAbout` value spans inside each
 * JSON-LD block, so formatting and every other property stay byte-identical.
 * A page that already matches the registry is not touched, which keeps the
 * pass idempotent.
 *
 * What --check proves:
 *   * no `genre` / `knowsAbout` anywhere is still a bare string;
 *   * every value is a DefinedTerm whose @id is a registered Wikidata item;
 *   * every sameAs URL is one this repository published (no invented links)
 *     and lives on an allowlisted host;
 *   * each node's name and sameAs set match the registry exactly;
 *   * `knowsAbout` only uses the composer's canonical vocabulary;
 *   * the Person entity resolves to the same terms on / and /composer.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AUTHORITY_HOSTS,
  CONCEPTS,
  KNOWS_ABOUT,
  WIKIDATA_ENTITY,
  conceptKeyForUrl,
  conceptNode,
  conceptsForLabel,
  isRegisteredAuthorityUrl,
  knowsAboutNodes,
} from '../build/data/authority.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SYNC = process.argv.includes('--sync');
const VERBOSE = process.argv.includes('--verbose');

const LINKED_FIELDS = new Set(['genre', 'knowsAbout']);

const SKIP_DIRS = new Set([
  'node_modules', 'build', 'dist', 'out', '.git', '.github', '.wrangler', '.audit',
  // Sources and templates are not published pages; they are rewritten by the
  // generators this pass runs after.
  'src', 'scripts', 'tools', 'legal-src', 'store-src', 'home-src',
  'images', 'fonts', 'audio',
]);

const ALLOWED_HOSTS = new Set(AUTHORITY_HOSTS);

/* --------------------------------------------------------------- discovery */

function collectHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectHtml(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

const BLOCK = /<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

function jsonLdBlocks(text) {
  const blocks = [];
  for (const match of text.matchAll(BLOCK)) {
    const body = match[1];
    const start = match.index + match[0].indexOf(body);
    blocks.push({ body, start, end: start + body.length });
  }
  return blocks;
}

/* -------------------------------------------------------- span-aware edit */

/**
 * Walk a JSON document and report the [start, end) text span of every value
 * whose key is in `wanted`. Offsets are relative to the block body, which is
 * what lets --sync change a value without re-serialising the block.
 */
function valueSpans(body, wanted) {
  const spans = [];
  let index = 0;

  const skipWhitespace = () => {
    while (index < body.length && ' \t\n\r'.includes(body[index])) index += 1;
  };

  const readString = () => {
    const start = index;
    if (body[index] !== '"') throw new Error(`expected a string at offset ${index}`);
    index += 1;
    while (index < body.length) {
      if (body[index] === '\\') {
        index += 2;
        continue;
      }
      if (body[index] === '"') {
        index += 1;
        return JSON.parse(body.slice(start, index));
      }
      index += 1;
    }
    throw new Error('unterminated string in JSON-LD block');
  };

  const parseValue = (key) => {
    skipWhitespace();
    const start = index;
    const char = body[index];
    if (char === '{') {
      index += 1;
      skipWhitespace();
      if (body[index] === '}') {
        index += 1;
      } else {
        for (;;) {
          skipWhitespace();
          const childKey = readString();
          skipWhitespace();
          if (body[index] !== ':') throw new Error(`expected ":" at offset ${index}`);
          index += 1;
          parseValue(childKey);
          skipWhitespace();
          if (body[index] === ',') {
            index += 1;
            continue;
          }
          if (body[index] === '}') {
            index += 1;
            break;
          }
          throw new Error(`expected "," or "}" at offset ${index}`);
        }
      }
    } else if (char === '[') {
      index += 1;
      skipWhitespace();
      if (body[index] === ']') {
        index += 1;
      } else {
        for (;;) {
          parseValue(null);
          skipWhitespace();
          if (body[index] === ',') {
            index += 1;
            continue;
          }
          if (body[index] === ']') {
            index += 1;
            break;
          }
          throw new Error(`expected "," or "]" at offset ${index}`);
        }
      }
    } else if (char === '"') {
      readString();
    } else {
      while (index < body.length && !',}] \t\n\r'.includes(body[index])) index += 1;
    }
    if (key && wanted.has(key)) spans.push({ key, start, end: index });
  };

  parseValue(null);
  return spans;
}

/** Indentation of the line the span starts on, so rewrites keep the file's style. */
function lineIndent(body, offset) {
  const lineStart = body.lastIndexOf('\n', offset) + 1;
  const prefix = body.slice(lineStart, offset);
  return /^[ \t]*/.exec(prefix)[0];
}

/* ------------------------------------------------------------- validation */

const CONCEPTS_BY_NAME = new Map(
  Object.entries(CONCEPTS).map(([key, concept]) => [concept.name.toLowerCase(), key]),
);

/**
 * The concept keys a published value stands for. Strings are resolved through
 * the label map (which is how an unmapped label is caught); nodes through their
 * registered Wikidata @id.
 */
function keysFor(entry, problems, where) {
  if (typeof entry === 'string') {
    problems.push(`${where}: unlinked label "${entry}" - run --sync to publish the authority node`);
    try {
      return conceptsForLabel(entry);
    } catch (error) {
      problems.push(`${where}: ${error.message}`);
      return [];
    }
  }
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    problems.push(`${where}: expected a DefinedTerm object, found ${JSON.stringify(entry)}`);
    return [];
  }
  const id = entry['@id'];
  if (typeof id !== 'string' || !id.startsWith(WIKIDATA_ENTITY)) {
    problems.push(`${where}: node ${JSON.stringify(entry.name ?? entry)} has no Wikidata @id`);
    return [];
  }
  const key = conceptKeyForUrl(id);
  if (!key) {
    problems.push(`${where}: @id ${id} is not in src/data/authority.ts`);
    return [];
  }
  return [key];
}

function sameAsSet(urls) {
  return [...new Set(urls)].sort();
}

/** Does the published node say exactly what the registry says? */
function nodeIsCanonical(entry, key, problems, where) {
  const canonical = conceptNode(key);
  const label = `${where}: ${canonical.name}`;
  if (entry['@type'] !== 'DefinedTerm') {
    problems.push(`${label}: @type should be DefinedTerm, found ${JSON.stringify(entry['@type'])}`);
  }
  if (entry.name !== canonical.name) {
    problems.push(`${label}: name should be "${canonical.name}", found ${JSON.stringify(entry.name)}`);
  }
  const published = Array.isArray(entry.sameAs) ? entry.sameAs : entry.sameAs ? [entry.sameAs] : [];
  for (const url of published) {
    if (typeof url !== 'string' || !isRegisteredAuthorityUrl(url)) {
      problems.push(`${label}: sameAs ${JSON.stringify(url)} is not published by the registry`);
      continue;
    }
    let host;
    try {
      host = new URL(url).host;
    } catch {
      problems.push(`${label}: sameAs ${url} is not a valid URL`);
      continue;
    }
    if (!ALLOWED_HOSTS.has(host)) problems.push(`${label}: sameAs host ${host} is not allowlisted`);
  }
  if (sameAsSet(published).join('|') !== sameAsSet(canonical.sameAs).join('|')) {
    problems.push(
      `${label}: sameAs should be ${JSON.stringify(canonical.sameAs)}, found ${JSON.stringify(published)}`,
    );
  }
}

function validateValue(value, field, problems, where) {
  const entries = Array.isArray(value) ? value : [value];
  if (!entries.length) {
    problems.push(`${where}: ${field} is empty`);
    return [];
  }
  const keys = [];
  for (const entry of entries) {
    for (const key of keysFor(entry, problems, `${where} ${field}`)) {
      keys.push(key);
      if (typeof entry === 'object') nodeIsCanonical(entry, key, problems, `${where} ${field}`);
    }
  }
  if (field === 'knowsAbout') {
    for (const key of keys) {
      if (!KNOWS_ABOUT.includes(key)) {
        problems.push(`${where} knowsAbout: ${CONCEPTS[key].name} is outside the canonical vocabulary`);
      }
    }
  }
  return keys;
}

/** Recursively validate one JSON-LD document; returns the find counts. */
function validateDocument(document, problems, where, found) {
  const visit = (node, trail) => {
    if (Array.isArray(node)) {
      node.forEach((child, i) => visit(child, `${trail}[${i}]`));
      return;
    }
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      if (LINKED_FIELDS.has(key)) {
        const keys = validateValue(value, key, problems, `${where} ${trail}`);
        found[key] = (found[key] ?? 0) + (Array.isArray(value) ? value.length : 1);
        found.keys.push({ where: `${where} ${trail} ${key}`, keys });
      } else {
        visit(value, `${trail}.${key}`);
      }
    }
  };
  visit(document, '');
}

/* -------------------------------------------------------------------- main */

const files = collectHtml(ROOT).sort();
const problems = [];
const found = { keys: [] };
let pages = 0;
let blocks = 0;
let rewritten = 0;

for (const file of files) {
  const relative = path.relative(ROOT, file);
  const original = fs.readFileSync(file, 'utf8');
  if (!original.includes('application/ld+json')) continue;
  pages += 1;

  if (!SYNC) {
    for (const block of jsonLdBlocks(original)) {
      blocks += 1;
      try {
        validateDocument(JSON.parse(block.body), problems, relative, found);
      } catch (error) {
        problems.push(`${relative}: unparseable JSON-LD block (${error.message})`);
      }
    }
    continue;
  }

  /* --sync: rewrite linked values in place, one block at a time, then rescan so
     every offset is measured against the text as it currently stands. */
  let text = original;
  for (let pass = 0; pass < 200; pass += 1) {
    let changed = false;
    for (const block of jsonLdBlocks(text)) {
      const spans = valueSpans(block.body, LINKED_FIELDS);
      let body = block.body;
      let blockChanged = false;
      for (const span of [...spans].reverse()) {
        let parsed;
        try {
          parsed = JSON.parse(body.slice(span.start, span.end));
        } catch {
          continue;
        }
        const keys = [];
        let resolvable = true;
        for (const entry of Array.isArray(parsed) ? parsed : [parsed]) {
          try {
            keys.push(...(typeof entry === 'string' ? conceptsForLabel(entry) : keysFor(entry, [], relative)));
          } catch (error) {
            problems.push(`${relative}: ${error.message}`);
            resolvable = false;
          }
        }
        if (!resolvable || !keys.length) continue;
        const indent = lineIndent(body, span.start);
        const replacement = JSON.stringify(conceptKeys(keys), null, 2).replace(/\n/g, `\n${indent}`);
        if (replacement === body.slice(span.start, span.end)) continue;
        body = body.slice(0, span.start) + replacement + body.slice(span.end);
        blockChanged = true;
        rewritten += 1;
      }
      if (blockChanged) {
        text = text.slice(0, block.start) + body + text.slice(block.end);
        blocks += 1;
        changed = true;
        break;
      }
    }
    if (!changed) break;
  }
  if (text !== original) fs.writeFileSync(file, text, 'utf8');
}

function conceptKeys(keys) {
  const unique = [...new Set(keys)];
  return unique.map((key) => conceptNode(key));
}

/* ------------------------------------------------------------------ report */

if (SYNC) {
  console.log(`authority: rewrote ${rewritten} linked value${rewritten === 1 ? '' : 's'} across ${pages} pages`);
  const syncProblems = [];
  for (const file of collectHtml(ROOT)) {
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes('application/ld+json')) continue;
    for (const block of jsonLdBlocks(html)) {
      try {
        validateDocument(JSON.parse(block.body), syncProblems, path.relative(ROOT, file), found);
      } catch {
        /* reported by --check */
      }
    }
  }
  if (syncProblems.length) {
    console.log(`authority: ${syncProblems.length} problem(s) remain - run --check for detail`);
    process.exit(1);
  }
  console.log('authority: registry and published pages agree');
  process.exit(0);
}

/* consistency: the composer entity must publish the same vocabulary everywhere */
const personKnowsAbout = found.keys.filter((row) => row.where.endsWith('knowsAbout'));
const canonical = knowsAboutNodes().map((node) => node['@id']).join('|');
for (const row of personKnowsAbout) {
  const ids = row.keys.map((key) => conceptNode(key)['@id']).join('|');
  if (ids !== canonical) {
    problems.push(
      `${row.where}: knowsAbout differs from the canonical list (${row.keys.length} terms vs ${KNOWS_ABOUT.length}) - run --sync`,
    );
  }
}

const genreCount = (found.genre ?? 0) + (found.knowsAbout ?? 0);
if (VERBOSE) {
  for (const [key, concept] of Object.entries(CONCEPTS)) {
    const hits = found.keys.filter((row) => row.keys.includes(key)).length;
    console.log(`  ${hits.toString().padStart(3)}  ${concept.name}  ${WIKIDATA_ENTITY}${concept.wikidata}`);
  }
}

if (problems.length) {
  console.error(`authority: ${problems.length} problem(s) across ${pages} pages\n`);
  for (const problem of [...new Set(problems)].slice(0, 60)) console.error(`  ✗ ${problem}`);
  console.error('\n  fix with: node tools/authority.mjs --sync');
  process.exit(1);
}

const distinct = new Set(found.keys.flatMap((row) => row.keys)).size;
console.log(
  `PASS - ${genreCount} genre/knowsAbout values on ${pages} pages resolve to ${distinct} Wikidata-anchored concepts`,
);
