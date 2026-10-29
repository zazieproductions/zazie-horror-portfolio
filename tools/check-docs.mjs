#!/usr/bin/env node
/**
 * tools/check-docs.mjs — local Markdown link validation for README.md + docs/.
 * Checks relative links (files and directories) resolve. Anchors, external
 * URLs and mailto: are out of scope. No dependencies; advisory only — it is
 * deliberately NOT wired into the production build or deploy.
 * Usage: node tools/check-docs.mjs [--verbose]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');
const files = [path.join(root, 'README.md')];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.md')) files.push(p);
  }
})(path.join(root, 'docs'));

let checked = 0; const broken = [];
const linkRe = /\[[^\]]*\]\(([^)\s]+)\)/g;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(linkRe)) {
    let target = m[1].replace(/^<|>$/g, '');
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    target = target.split('#')[0];
    if (!target) continue;
    checked++;
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(target));
    if (!fs.existsSync(resolved)) broken.push(`${path.relative(root, file)} → ${target}`);
    else if (verbose) console.log(`ok ${path.relative(root, file)} → ${target}`);
  }
}
if (broken.length) { console.error(`check-docs: ${broken.length} broken link(s):`); broken.forEach((b) => console.error(`  ${b}`)); process.exit(1); }
console.log(`check-docs: PASS — ${checked} relative links across ${files.length} files resolve.`);
