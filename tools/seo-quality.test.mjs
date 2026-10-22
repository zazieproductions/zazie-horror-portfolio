#!/usr/bin/env node
/** Homepage regression checks for the three SEO audit warnings. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function decodeEntities(value) {
  const named = { amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"' };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/gi, (match, entity) => {
    if (entity[0] !== '#') return named[entity.toLowerCase()] ?? match;
    const hex = entity[1].toLowerCase() === 'x';
    return String.fromCodePoint(Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10));
  });
}

/** Visible source text, with non-content and external-icon payloads removed. */
export function visibleText(source) {
  const content = source
    .replace(/<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return decodeEntities(content).replace(/\s+/g, ' ').trim();
}

function lexiconCount(value) {
  const plain = value.replace(/[^\p{L}\p{N}\s']/gu, '');
  return plain.split(/\s+/).filter(Boolean).length;
}

function round(value, places = 0) {
  const factor = 10 ** places;
  return Math.floor(value * factor + 0.5) / factor;
}

/** Automated Readability Index, using the same counts and rounding as textstat. */
export function automatedReadabilityIndex(text) {
  const characters = text.replace(/\s/g, '').length;
  const words = lexiconCount(text);
  const segments = text.match(/\b[^.!?]+[.!?]*/gu) ?? [];
  const sentences = Math.max(1, segments.filter((segment) => lexiconCount(segment) > 2).length);
  if (!words) return 0;
  return round(4.71 * round(characters / words, 2) + 0.5 * round(words / sentences, 2) - 21.43, 1);
}

/** Conservative 13px, Arial-compatible SERP glyph estimate in CSS pixels. */
export function estimatedSerpPixelWidth(text) {
  let width = 0;
  for (const character of text) {
    if (/[iIjlt.,'"!|:; `]/.test(character)) width += 3.5;
    else if (/[mMW@]/.test(character)) width += 11;
    else width += 6.5;
  }
  return Math.ceil(width);
}

const text = visibleText(html);

test('homepage visible-text-to-HTML ratio stays at or above 10%', (context) => {
  const ratio = 100 * text.length / html.length;
  context.diagnostic(`Visible text / HTML: ${ratio.toFixed(2)}% (${text.length} / ${html.length} characters)`);
  assert.ok(ratio >= 10, `text-to-HTML ratio ${ratio.toFixed(2)}% is below 10%`);
});

test('home meta description fits a conservative 920px SERP budget', (context) => {
  const descriptions = [...html.matchAll(/<meta\s+name="description"\s+content="([^"]+)"\/>/g)];
  assert.equal(descriptions.length, 1, 'home page must have exactly one meta description');
  const description = decodeEntities(descriptions[0][1]);
  const width = estimatedSerpPixelWidth(description);
  context.diagnostic(`Meta description: ${description.length} characters, approximately ${width}px`);
  assert.ok(description.length <= 140, `description has ${description.length} characters; keep it concise`);
  assert.ok(width <= 920, `estimated description width ${width}px exceeds 920px`);
});

test('homepage content reads at grade 12 or below by ARI', (context) => {
  const grade = automatedReadabilityIndex(text);
  context.diagnostic(`Automated Readability Index: grade ${grade.toFixed(1)}`);
  assert.ok(grade <= 12, `content reading level ${grade.toFixed(1)} exceeds grade 12`);
});
