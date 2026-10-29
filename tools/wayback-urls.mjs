#!/usr/bin/env node
/**
 * wayback-urls.mjs
 * -----------------------------------------------------------------------------
 * Resolves the list of live-site URLs that .github/workflows/wayback.yml hands
 * to the Wayback Machine action (JamieMagee/wayback). Prints one URL per line
 * to stdout and nothing else, so the workflow can drop the output straight
 * into a multiline GitHub Actions output.
 *
 * Scopes:
 *
 *   node tools/wayback-urls.mjs                  # core (default): home + hubs
 *   node tools/wayback-urls.mjs --scope all      # every <loc> in sitemap.xml
 *   node tools/wayback-urls.mjs --scope custom /reel /faq
 *   WAYBACK_CUSTOM_URLS="/reel, /faq" \
 *     node tools/wayback-urls.mjs --scope custom # same, from the environment
 *
 * "Core" is derived, not hand-listed: the homepage plus every single-segment
 * route in sitemap.xml (currently 17 URLs). Item pages (/work/<slug>,
 * /reel/<slug>, /store/<slug>) are two segments, so they only enter through
 * --scope all. Add a hub to src/data/hubs.ts and it is archived automatically.
 *
 * The URL source of truth is the committed sitemap.xml, the same file
 * tools/indexnow.mjs submits from. Only page <loc> entries are read;
 * <image:loc> children never match the pattern. Custom URLs are normalised
 * against the production host and off-host URLs are rejected, so a typo in a
 * manual dispatch cannot archive somebody else's site under this workflow.
 *
 * No dependencies; Node 20+ (matches the repo engines field).
 * -----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const HOST = 'horror.zazieproductions.com';
const MEDIA_PATH = /\.(jpe?g|png|avif|webp|gif|svg|mp3|wav|aiff?|zip)$/i;

/** Every page <loc> in a sitemap document, de-duplicated, order preserved. */
export function sitemapUrls(xml) {
  const urls = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
    .map((m) => m[1].replace(/&amp;/g, '&'))
    .filter((u) => {
      const url = new URL(u);
      return url.host === HOST && !MEDIA_PATH.test(url.pathname);
    });
  return [...new Set(urls)];
}

/** Homepage plus single-segment hub routes — the post-deploy archive set. */
export function coreUrls(urls) {
  return urls.filter((u) => {
    const { pathname } = new URL(u);
    return pathname === '/' || /^\/[^/]+$/.test(pathname);
  });
}

/**
 * Normalise custom paths/URLs against the production host.
 * Accepts paths ("/reel"), bare routes ("reel") and full URLs.
 */
export function customUrls(values) {
  const tokens = values.flatMap((v) => String(v).split(/[\s,]+/)).filter(Boolean);
  if (!tokens.length) {
    throw new Error('scope "custom" needs at least one path or URL (arguments or WAYBACK_CUSTOM_URLS)');
  }
  const urls = tokens.map((token) => new URL(token, `https://${HOST}`).href);
  const offHost = urls.filter((u) => new URL(u).host !== HOST);
  if (offHost.length) throw new Error(`only ${HOST} URLs can be archived: ${offHost.join(', ')}`);
  return [...new Set(urls)];
}

/** Resolve a scope name to the final URL list. */
export function resolveUrls({ xml, scope = 'core', custom = [] }) {
  const all = sitemapUrls(xml);
  if (!all.length) throw new Error('no page URLs found in sitemap.xml');
  switch (scope) {
    case 'core':
      return coreUrls(all);
    case 'all':
      return all;
    case 'custom':
      return customUrls(custom);
    default:
      throw new Error(`unknown scope "${scope}" (expected core, all or custom)`);
  }
}

function main(argv) {
  const args = [...argv];
  let scope = 'core';
  const scopeIndex = args.findIndex((a) => a === '--scope' || a.startsWith('--scope='));
  if (scopeIndex !== -1) {
    const arg = args[scopeIndex];
    scope = arg.includes('=') ? arg.slice('--scope='.length) : args[scopeIndex + 1];
    args.splice(scopeIndex, arg.includes('=') ? 1 : 2);
    if (!scope) throw new Error('--scope needs a value (core, all or custom)');
  }
  if (args.includes('--all')) scope = 'all';
  const positional = args.filter((a) => a !== '--' && a !== '--all');
  const custom = positional.length
    ? positional
    : (process.env.WAYBACK_CUSTOM_URLS ?? '').split(/[\s,]+/).filter(Boolean);

  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const xml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  process.stdout.write(`${resolveUrls({ xml, scope, custom }).join('\n')}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(`\nwayback-urls: ${error.message}\n`);
    process.exit(1);
  }
}
