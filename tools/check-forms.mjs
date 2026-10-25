#!/usr/bin/env node
/**
 * tools/check-forms.mjs
 * ----------------------------------------------------------------------------
 * Every form control in the published tree must carry an id or a name.
 *
 * WHY THIS EXISTS
 *
 * Lighthouse's "form field element should have an id or name attribute" fires
 * per field, and a field with neither is not associated with anything: the
 * browser will not autofill it, `form.elements` cannot find it, and assistive
 * technology has only its role and position to describe it. The homepage had
 * eleven of them - the contact form, the showreel scrub and the sticky player's
 * scrub - because the React components rendered every control without a name
 * and the prerendered snapshot copied that markup. Nothing failed; the page was
 * just quietly harder to fill in and slower to use.
 *
 * The homepage is the awkward case: the React bundle and the prerendered copy
 * in index.html both render the same controls, so a hand-added name in one is
 * lost on the next build. home-src/build.mjs now derives the name from the
 * control's accessible label on both paths (see fieldName there). This checker
 * is the guard that the result actually lands: it reads the files the host
 * would serve, not the sources.
 *
 * WHAT IT CHECKS
 *
 *   1. every <input>, <select> and <textarea> has an id or a name (controls of
 *      type hidden/button/submit/reset/image are not form fields and are exempt)
 *   2. no id appears twice on the same page - duplicate ids make every
 *      label/for and aria-describedby reference ambiguous (reported, not fatal:
 *      two hub pages carry a known duplicated section)
 *   3. script, style and template bodies are ignored, so markup inside a
 *      template string is not mistaken for a live field
 *
 *   node tools/check-forms.mjs
 *   node tools/check-forms.mjs --verbose
 *
 * Exit 1 on any unnamed field. No dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');

/** Build sources and tooling are not served; the generated pages are. */
const SKIP_DIRS = new Set([
  'node_modules', 'build', 'dist', '.git', '.wrangler', '.audit', 'public',
  'legal-src', 'store-src', 'home-src', 'src', 'scripts', 'tools',
]);

/** Controls that are not data fields, so neither id nor name is expected. */
const NON_FIELD_TYPES = new Set(['hidden', 'button', 'submit', 'reset', 'image']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const rel = (file) => path.relative(root, file).split(path.sep).join('/');

/** Markup only: script, style and template bodies are never live form fields. */
function markupOf(html) {
  return html
    .split(/(<(?:script|style|template)\b[\s\S]*?<\/(?:script|style|template)>)/i)
    .filter((_part, index) => index % 2 === 0)
    .join('');
}

const attr = (attrs, name) => new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i').exec(attrs)?.[1] ?? null;

const pages = walk(root);
const problems = [];
const duplicates = [];
let controls = 0;
let named = 0;

for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  const where = rel(page);

  for (const match of markupOf(html).matchAll(/<(input|select|textarea)\b([^>]*)>/gi)) {
    const [tag, control, attrs] = match;
    const type = (attr(attrs, 'type') ?? '').toLowerCase();
    if (control.toLowerCase() === 'input' && NON_FIELD_TYPES.has(type)) continue;
    controls += 1;

    const id = attr(attrs, 'id');
    const name = attr(attrs, 'name');
    if (id || name) {
      named += 1;
      if (verbose) console.log(`  ok  ${where}: <${control}${id ? ` id="${id}"` : ''}${name ? ` name="${name}"` : ''}>`);
      continue;
    }

    // Not fatal to the page, but it is the audit failure: report the field by
    // its accessible name if it has one, otherwise by its markup.
    const label = attr(attrs, 'aria-label');
    const hint = label ? `aria-label="${label}"` : tag.replace(/\s+/g, ' ').slice(0, 96);
    problems.push(`${where}: <${control}> has neither an id nor a name (${hint})`);
  }

  const ids = [...markupOf(html).matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const counts = new Map();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  const repeated = [...counts].filter(([, count]) => count > 1).map(([id]) => id);
  if (repeated.length) duplicates.push(`${where}: ${repeated.slice(0, 6).join(', ')}${repeated.length > 6 ? ', …' : ''}`);
}

/* ------------------------------------------------------------------- report */

console.log(`check-forms: ${named}/${controls} form controls carry an id or a name across ${pages.length} HTML files`);

if (duplicates.length) {
  console.log(`\n  warn  ${duplicates.length} page(s) repeat an id (label/aria-describedby targets become ambiguous):`);
  for (const row of duplicates) console.log(`        ${row}`);
}

if (problems.length) {
  console.error(`\ncheck-forms: ${problems.length} unnamed form control(s):`);
  for (const problem of problems.slice(0, 60)) console.error(`  ✗ ${problem}`);
  if (problems.length > 60) console.error(`  … ${problems.length - 60} more`);
  console.error('\n  Give each one an id or a name derived from its label; on the homepage patch both the');
  console.error('  React bundle and the static copy (home-src/build.mjs fieldName / addFieldNames).');
  process.exit(1);
}

console.log('check-forms: PASS — every form field is identifiable by id or name.');
