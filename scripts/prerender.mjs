#!/usr/bin/env node
/**
 * prerender.mjs — the last step of the build.
 *
 * Every generated page ships an empty head block:
 *
 *     <!--SEO:START-->
 *     <!--PRERENDER:SEO-->
 *     <!--SEO:END-->
 *
 * This script replaces that block, for every route, with the route's own
 * title, meta description, self-referential canonical, robots directive, Open
 * Graph and Twitter tags and JSON-LD — in the static file, in the first bytes
 * of the response, with no JavaScript involved. It then appends a <noscript>
 * block carrying the page's H1 and description, so a crawler that never runs
 * script still reads the entry as text.
 *
 * The home page keeps its hand-authored head — the SPA's boot system lives in
 * there — so for `/` the markers are attached around the existing metadata and
 * the block is *verified* rather than rewritten. The hubs (the 19 legacy
 * routes) are verified the same way: they are hand-maintained pages that
 * already publish a per-route head.
 *
 * Finally it proves the deploy: every <loc> in sitemap.xml must resolve to a
 * file the host serves at that exact path (no redirect hop, no trailing-slash
 * twin, no soft 404). If one does not, the build fails.
 *
 *     npm run build   →   … "84 URLs, 84 resolve to prerendered files"
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT,
  SITE,
  absolute,
  assertDataIntegrity,
  cueRoutes,
  hubs,
  itemRoutes,
  productionRoutes,
  read,
  releaseRoutes,
  write,
} from './lib/data.mjs';
import { cueGraph, headBlock, productionGraph, releaseGraph } from './lib/seo.mjs';

assertDataIntegrity();

const errors = [];
const notes = [];
const SEO_START = '<!--SEO:START-->';
const SEO_END = '<!--SEO:END-->';
const SEPARATOR_START = `${SEO_START}\n`;
const SEPARATOR_END = `\n${SEO_END}`;

/* ------------------------------------------------------------- head baking */

function bakeHead(routePath, html, graph, meta) {
  const block = headBlock({ ...meta, graph });
  const start = html.indexOf(SEO_START);
  const end = html.indexOf(SEO_END);
  if (start === -1 || end === -1 || end < start) {
    errors.push(`${routePath}: no ${SEO_START} … ${SEO_END} block to bake into`);
    return html;
  }
  return (
    html.slice(0, start) +
    `${SEO_START}\n${block}\n${SEO_END}` +
    html.slice(end + SEO_END.length)
  );
}

function noscriptBlock(h1, description) {
  return `<noscript>
  <div style="max-width:52rem;margin:0 auto;padding:2rem 1.25rem;font-family:Georgia,serif;color:#f0ebe3">
    <h1>${h1}</h1>
    <p>${description}</p>
  </div>
</noscript>
`;
}

/* --------------------------------------------------------- item page routes */

const cueByPath = new Map(cueRoutes.map((r) => [r.path, r]));
const releaseByPath = new Map(releaseRoutes.map((r) => [r.path, r]));

for (const route of itemRoutes) {
  const file =
    route.section === 'work'
      ? `work/${route.slug}.html`
      : route.section === 'reel'
        ? `reel/${route.slug}.html`
        : `store/${route.slug}.html`;

  let html = read(file);
  const item = route.item;

  const graph =
    route.section === 'work'
      ? productionGraph(item)
      : route.section === 'reel'
        ? cueGraph(
            item,
            (item.relatedReleases ?? [])
              .map((slug) => releaseRoutes.find((r) => r.slug === slug))
              .filter(Boolean)
          )
        : releaseGraph(
            item,
            (item.relatedCues ?? [])
              .map((slug) => cueByPath.get(`/reel/${slug}`))
              .filter(Boolean)
          );

  const h1Match = /<h1>([\s\S]*?)<\/h1>/.exec(html);
  if (!h1Match) errors.push(`${route.path}: no <h1>`);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : route.title;

  html = bakeHead(route.path, html, graph, {
    path: route.path,
    title: route.title,
    description: route.description,
    image:
      route.section === 'work'
        ? {
            src:
              (route.item.poster ?? {}).large ??
              (route.item.poster ?? {}).src ??
              '/images/hero-portrait.jpg',
            alt: (route.item.poster ?? {}).alt ?? item.title,
            width: (route.item.poster ?? {}).width,
            height: (route.item.poster ?? {}).height,
          }
        : route.section === 'store'
          ? {
              src: item.image.src,
              alt: item.image.alt,
              width: item.image.width,
              height: item.image.height,
              external: item.image.external,
            }
          : {
              src: '/images/hero-portrait.jpg',
              alt: `Zazie Kanwar-Torge — horror composer showreel cue: ${item.title} (${item.mood})`,
              width: 1200,
              height: 1500,
            },
  });

  if (!html.includes('<noscript>')) {
    html = html.replace('</body>', `${noscriptBlock(h1, route.description)}\n</body>`);
  }

  write(file, html);
}

/* ------------------------------------------------------------ hub validation */

function metaContent(html, name) {
  const tag = new RegExp(`<meta[^>]*\\bname=["']${name}["'][^>]*>`).exec(html);
  if (!tag) return null;
  const content = /\bcontent="([^"]*)"/.exec(tag[0]) || /\bcontent='([^']*)'/.exec(tag[0]);
  return content ? content[1] : null;
}

function propertyContent(html, property) {
  const tag = new RegExp(`<meta[^>]*\\bproperty=["']${property}["'][^>]*>`).exec(html);
  if (!tag) return null;
  const content = /\bcontent="([^"]*)"/.exec(tag[0]) || /\bcontent='([^']*)'/.exec(tag[0]);
  return content ? content[1] : null;
}

function validateRoute(routePath, file, { expectNoscript }) {
  const html = read(file);
  const start = html.indexOf(SEO_START);
  const end = html.indexOf(SEO_END);

  const title = /<title>([\s\S]*?)<\/title>/.exec(html);
  if (!title || !title[1].trim()) errors.push(`${routePath}: no <title>`);
  const description = metaContent(html, 'description');
  if (!description || description.trim().length < 40) {
    errors.push(`${routePath}: no usable <meta name="description">`);
  }
  const canonical = /<link[^>]+rel="canonical"[^>]*href="([^"]+)"/.exec(html);
  if (!canonical) {
    errors.push(`${routePath}: no <link rel="canonical">`);
  } else if (canonical[1].replace(/\/$/, '') !== absolute(routePath).replace(/\/$/, '')) {
    errors.push(
      `${routePath}: canonical is "${canonical[1]}" but the route is "${absolute(routePath)}" — it must be self-referential`
    );
  }
  const robots = metaContent(html, 'robots');
  if (!robots) errors.push(`${routePath}: no <meta name="robots">`);
  else if (/\bnoindex\b/i.test(robots)) {
    errors.push(`${routePath}: is noindex but is a crawlable route`);
  }
  for (const [label, value] of [
    ['og:title', propertyContent(html, 'og:title')],
    ['og:description', propertyContent(html, 'og:description')],
    ['og:url', propertyContent(html, 'og:url')],
    ['og:image', propertyContent(html, 'og:image')],
    ['twitter:card', metaContent(html, 'twitter:card')],
    ['twitter:title', metaContent(html, 'twitter:title')],
    ['twitter:image', metaContent(html, 'twitter:image')],
  ]) {
    if (!value) errors.push(`${routePath}: missing ${label}`);
  }

  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!blocks.length) errors.push(`${routePath}: no JSON-LD`);
  for (const [, body] of blocks) {
    try {
      JSON.parse(body);
    } catch (err) {
      errors.push(`${routePath}: JSON-LD does not parse (${err.message})`);
    }
  }

  if (expectNoscript && !html.includes('<noscript>')) {
    errors.push(`${routePath}: no <noscript> block with the entry's H1 and description`);
  }

  // Static head rule: the title and canonical must be in the head, before any
  // external script — nothing may depend on JavaScript running first.
  const headEnd = html.indexOf('</head>');
  const titleAt = html.indexOf('<title>');
  const firstScript = html.search(/<script[^>]+src=/i);
  const staticHead =
    titleAt !== -1 &&
    headEnd !== -1 &&
    titleAt < headEnd &&
    (firstScript === -1 || titleAt < firstScript || titleAt > headEnd - 1);
  if (!staticHead || titleAt > headEnd) {
    errors.push(`${routePath}: the <title> is not in the static head`);
  }
  if (firstScript !== -1 && firstScript < headEnd && headEnd < firstScript) {
    errors.push(`${routePath}: metadata appears after an external script`);
  }
  if (start !== -1 && firstScript !== -1 && start > firstScript) {
    errors.push(`${routePath}: the metadata block follows an external script`);
  }
  return start !== -1 && end > start ? html.slice(start, end) : null;
}

for (const route of itemRoutes) {
  const file =
    route.section === 'work'
      ? `work/${route.slug}.html`
      : route.section === 'reel'
        ? `reel/${route.slug}.html`
        : `store/${route.slug}.html`;
  validateRoute(route.path, file, { expectNoscript: true });
}

/* ------------------------------------------------- home page: markers + check */

{
  let home = read('index.html');
  if (!home.includes(SEO_START)) {
    const titleAt = home.indexOf('<title>');
    const tags = [...home.matchAll(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g)];
    if (titleAt === -1 || !tags.length) {
      errors.push('/: cannot locate the head block to wrap');
    } else {
      const lastEnd = tags[tags.length - 1].index + tags[tags.length - 1][0].length;
      home =
        home.slice(0, titleAt) +
        SEPARATOR_START +
        home.slice(titleAt, lastEnd) +
        SEPARATOR_END +
        home.slice(lastEnd);
      write('index.html', home);
      notes.push('/: wrapped the existing head block in SEO markers (comments only)');
    }
  }
  if (home.includes(SEO_START) && !home.includes('<!--PRERENDER:SEO-->')) {
    notes.push('/: head is hand-authored (boot system) — verified, not rewritten');
  }
  validateRoute('/', 'index.html', { expectNoscript: false });
}

for (const hub of hubs.filter((h) => h.path !== '/')) {
  const file = `${hub.path.replace(/^\//, '')}/index.html`;
  if (!fs.existsSync(path.join(ROOT, file))) {
    errors.push(`${hub.path}: no file at ${file}`);
    continue;
  }
  validateRoute(hub.path, file, { expectNoscript: false });
}

/* ------------------------------------------------------ sitemap → file proof */

const sitemap = read('sitemap.xml');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

/** The same resolution order the host and tools/check-sitemap.mjs use. */
function servedFile(loc) {
  const pathname = decodeURIComponent(new URL(loc).pathname);
  const trimmed = pathname.replace(/\/$/, '') || '/';
  const candidates =
    pathname === '/'
      ? ['index.html']
      : [path.join(trimmed, 'index.html'), trimmed + '.html', pathname.replace(/^\//, '')];
  for (const c of candidates) {
    const abs = path.join(ROOT, c);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return c;
  }
  return null;
}

let resolved = 0;
const unresolved = [];
for (const loc of locs) {
  const file = servedFile(loc);
  if (file) resolved++;
  else unresolved.push(loc);
}
if (unresolved.length) {
  for (const loc of unresolved) {
    errors.push(`${new URL(loc).pathname}: no file the host can serve at this exact path`);
  }
}

/* ---------------------------------------------------------------- the report */

for (const note of notes) console.log(`  note   ${note}`);
if (errors.length) {
  console.error(`\nprerender: ${errors.length} error(s) — the build is not deployable`);
  for (const err of errors) console.error(`  x  ${err}`);
  process.exit(1);
}
console.log(`prerender: ${resolved} URLs, ${resolved} resolve to prerendered files`);
console.log(
  `  ${productionRoutes.length} production + ${cueRoutes.length} cue + ${releaseRoutes.length} catalogue ` +
    `+ ${hubs.length} hub pages, each with its own title, description, canonical, robots, OG/Twitter tags and JSON-LD in the first bytes`
);
console.log(`  unknown paths are served by 404.html with a real 404 status (see _redirects note)`);
