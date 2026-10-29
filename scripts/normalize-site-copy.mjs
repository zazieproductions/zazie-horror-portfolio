#!/usr/bin/env node
/**
 * Normalize published page and discovery-document punctuation.
 *
 * Source copy can contain em dashes, but generated HTML, sitemap XML, and
 * public text discovery files should not. This runs after every generator so
 * aliases, product pages, legal pages, sitemap, llms.txt, and the homepage
 * snapshot all receive the same plain-hyphen treatment. The homepage's React
 * bundle is normalized inside home-src/build.mjs before its content hash is computed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const excluded = new Set(['.git', 'node_modules', 'build', 'dist', 'coverage', 'home-src', 'legal-src', 'store-src', 'src', 'tools', 'scripts']);
const textExtensions = new Set(['.html', '.txt', '.xml']);
let filesChanged = 0;
let replacements = 0;

function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && excluded.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      visit(fullPath);
      continue;
    }
    if (!entry.isFile() || !textExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    const before = fs.readFileSync(fullPath, 'utf8');
    const count = (before.match(/—/g) || []).length;
    const after = before.replace(/[ \t]*—[ \t]*/g, ' - ').replace(/[ \t]{2,}-[ \t]{2,}/g, ' - ');
    if (after === before) continue;
    fs.writeFileSync(fullPath, after, 'utf8');
    filesChanged++;
    replacements += count;
  }
}

visit(root);
console.log(`normalize-site-copy: replaced ${replacements} em dash(es) across ${filesChanged} public text file(s)`);
