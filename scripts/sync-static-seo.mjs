#!/usr/bin/env node
/**
 * scripts/sync-static-seo.mjs
 * ----------------------------------------------------------------------------
 * Keeps the hand-authored hub pages, store source, legal page sources, and
 * 404.html synchronized with the canonical Semantic SEO & Knowledge Graph
 * definitions in src/data/*.ts and legal-src/partials/{masthead,footer}.html:
 *
 *   1. Specialist top-fold navigation (<header class="masthead"> / <nav class="tabs">)
 *      preserving aria-current="page" on active hub routes, plus shared footer.
 *   2. Genre-descriptive alt attributes across all <img> tags and social preview
 *      og:image:alt / twitter:image:alt meta tags.
 *   3. Deep-linked JSON-LD Knowledge Graph entities on Person.knowsAbout,
 *      Organization.knowsAbout, Service.category, and CreativeWork/Music* genre
 *      fields pointing to external Wikipedia & IMDb authority URIs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const {
  KNOWS_ABOUT_ENTITIES,
  PORTFOLIO_GENRES_DEEP_LINKED,
  deepLinkGenres,
  organization,
  person,
  website,
} = await import('../build/data/entities.js');
const { productions } = await import('../build/data/productions.js');
const { compilations } = await import('../build/data/compilations.js');
const { releases } = await import('../build/data/releases.js');

const mastheadPartial = fs.readFileSync(path.join(root, 'legal-src/partials/masthead.html'), 'utf8');
const footerPartial = fs.readFileSync(path.join(root, 'legal-src/partials/footer.html'), 'utf8').trim();
const headerMatch = mastheadPartial.match(/<header class="masthead">[\s\S]*?<\/header>/);
const navMatch = mastheadPartial.match(/<nav class="tabs" aria-label="Primary">[\s\S]*?<\/nav>/);
if (!headerMatch || !navMatch) throw new Error('sync-static-seo: masthead partial missing <header> or <nav>');
const baseHeader = headerMatch[0];
const baseNav = navMatch[0];

const escapeAttr = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Canonical Genre-Descriptive alt map keyed by image src substring / exact path.
const IMAGE_ALT_BY_SRC = new Map([
  // Studio & composer portraits
  [
    '/images/hero-portrait.jpg',
    'Zazie Productions: Experimental art house, psychological, folk, and body horror film scores by Zazie Kanwar-Torge featuring bowed metal and experimental synthesis.',
  ],
  [
    '/images/headshot.jpg',
    'Zazie Kanwar-Torge: Experimental art house, psychological, folk, and body horror composer photographed with studio instrumentation.',
  ],
  [
    '/images/press-photo.jpg',
    'Zazie Productions Studio: Experimental art house, psychological, folk, and body horror scoring suite of Zazie Kanwar-Torge featuring bowed metal, prepared strings, and custom synthesis.',
  ],
  [
    '/images/laurels/golden-bloody-globes.png',
    'Golden Bloody Globes horror film festival laurel emblem',
  ],
  // Film sample stills (8 screen samples)
  [
    '/images/project-HaVJP08j77U.jpg',
    'MIKE HAS A VISITOR: Sleep-paralysis psychological horror score by Zazie Kanwar-Torge featuring nerve-scraping strings and sub-audible room tone.',
  ],
  [
    '/images/eclipsed-cover-1280.jpg',
    'ECLIPSED: Surrealist body horror score by Zazie Kanwar-Torge featuring dissonant bowed metal and experimental synthesis.',
  ],
  [
    '/images/project-ItrrcilS0ro.jpg',
    'GOODBYE, BROTHER: Psychological drama-horror score by Zazie Kanwar-Torge featuring intimate chamber strings and somber harmonic decay.',
  ],
  [
    '/images/project-riCvy2abhlc.jpg',
    'Home Intruder: Home-invasion thriller chase score by Zazie Kanwar-Torge featuring brutalist percussion pulses and struck-string tension.',
  ],
  [
    '/images/project-Ty8tPp59mDc.jpg',
    'THE HAUNTED: Sci-fi psychological horror co-score by Zazie Kanwar-Torge featuring psychophonic scraping beds and dark ambient drones.',
  ],
  [
    '/images/project-rvCGO0BJ_2E.jpg',
    'AQUAPHOBIA: Subterranean psychological horror score by Zazie Kanwar-Torge featuring performed waterphone resonance and suffocating sub-bass.',
  ],
  [
    '/images/project-6qa3Uwj47fc.jpg',
    'Whispers In The Dark: Supernatural psychological horror score by Zazie Kanwar-Torge featuring processed vocal whispers, glass harmonics, and dark ambient pads.',
  ],
  [
    '/images/project-UX2kv3G89Jw.jpg',
    'Phantom Requiem: Experimental art house horror score by Zazie Kanwar-Torge featuring electroacoustic synthesis and spectral sound design.',
  ],
  // Store eBay / hardware items (including TEA5767 thumbnail in store.html)
  [
    'https://i.ebayimg.com/images/g/4awAAeSwtpFqrDSI/s-l500.webp',
    'Skull Heads With Motion Sensor: Motion-activated skull horror prop with red LED eyes listed by Zazie Productions.',
  ],
  [
    'https://i.ebayimg.com/images/g/99UAAeSwqhJqd3CA/s-l500.webp',
    'Ghost Glow Fruit Plate: Illuminated musical Halloween prop listed in the Zazie Productions object catalogue.',
  ],
  [
    'https://i.ebayimg.com/images/g/7aAAAeSwAVhqd3Cg/s-l500.webp',
    'F998Pro Live Sound Card: Compact multi-input audio interface and voice processor listed by Zazie Productions.',
  ],
  [
    'https://i.ebayimg.com/images/g/hkQAAeSwAfJqdiA1/s-l500.webp',
    'Voice-Control WiFi Bulb: Programmable RGBCW studio lighting lamp listed in the Zazie Productions object catalogue.',
  ],
  [
    'https://i.ebayimg.com/images/g/FBIAAeSwSL1qta6W/s-l500.webp',
    'TEA5767 Digital Radio Kit: Microcontroller FM receiver circuit kit archived in the Zazie Productions hardware catalogue.',
  ],
  [
    'https://i.ebayimg.com/images/g/77YAAeSwmdlqtauv/s-l500.webp',
    'HD X60 Sound Card Mixer: Compact live audio interface and mixer unit listed by Zazie Productions.',
  ],
]);

for (const prod of productions) {
  IMAGE_ALT_BY_SRC.set(prod.poster.src, prod.poster.alt);
}
for (const comp of compilations) {
  IMAGE_ALT_BY_SRC.set(`https://f4.bcbits.com/img/a${comp.artId}_16.jpg`, comp.alt);
}
for (const rel of releases) {
  if (rel.image?.src && !IMAGE_ALT_BY_SRC.has(rel.image.src)) {
    IMAGE_ALT_BY_SRC.set(rel.image.src, rel.image.alt);
  }
}

function resolveAltForSrc(src) {
  if (!src) return null;
  if (IMAGE_ALT_BY_SRC.has(src)) return IMAGE_ALT_BY_SRC.get(src);
  // Match Bandcamp _10.jpg / _16.jpg artId variants (e.g. og:image on /store)
  const bc = /bcbits\.com\/img\/a(\d+)_\d+\.jpg/.exec(src);
  if (bc) {
    for (const [k, v] of IMAGE_ALT_BY_SRC.entries()) {
      if (k.includes(`a${bc[1]}_`)) return v;
    }
  }
  // Match absolute https://horror.zazieproductions.com/images/... URLs
  if (src.startsWith('https://horror.zazieproductions.com/')) {
    const relPath = src.slice('https://horror.zazieproductions.com'.length);
    if (IMAGE_ALT_BY_SRC.has(relPath)) return IMAGE_ALT_BY_SRC.get(relPath);
  }
  return null;
}

function normalizeStringGenres(raw) {
  const arr = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [];
  return arr.filter((item) => typeof item === 'string' && !/^https?:\/\//i.test(item));
}

function upgradeJsonLdNode(node, relFile) {
  if (!node || typeof node !== 'object') return;
  const type = node['@type'];
  const id = node['@id'] || '';

  if (type === 'Person' && id.endsWith('#person')) {
    node.jobTitle = person.jobTitle;
    node.description = person.description;
    node.knowsAbout = KNOWS_ABOUT_ENTITIES;
  } else if (type === 'Organization' && (id.endsWith('#org') || id.endsWith('#organization'))) {
    node.description = organization.description;
    node.knowsAbout = KNOWS_ABOUT_ENTITIES;
  } else if (type === 'WebSite' && id.endsWith('#website')) {
    node.name = website.name;
    node.description = website.description;
  } else if (type === 'Service') {
    node.category = KNOWS_ABOUT_ENTITIES.slice(0, 6);
  }

  // Deep-link any existing genre property on CreativeWork / Music* / AudioObject nodes
  if (node.genre) {
    const labels = normalizeStringGenres(node.genre);
    if (labels.length > 0) {
      node.genre = deepLinkGenres(labels);
    }
  }

  // Add portfolio-level deep-linked genre to primary CreativeWork hub entities
  if (
    (type === 'CollectionPage' && (relFile === 'work/index.html' || relFile === 'reel/index.html')) ||
    (type === 'MusicPlaylist' && relFile === 'reel/index.html') ||
    (type === 'Article' && relFile.endsWith('how-to-hire-a-horror-composer.html')) ||
    (type === 'WebPage' &&
      ['composer/index.html', 'process/index.html', 'sound-design/index.html', 'game-scoring/index.html', 'store-src/store.html', 'legal-src/pages/hire-a-composer.html'].includes(relFile))
  ) {
    node.genre = PORTFOLIO_GENRES_DEEP_LINKED;
  }

  // Enrich Bandcamp MusicRecording nodes on reel/index.html with their compilation genres
  if (type === 'MusicRecording' && id.includes('#bandcamp-')) {
    const comp = compilations.find((c) => c.title === node.name);
    if (comp?.genres?.length) {
      node.genre = deepLinkGenres(comp.genres);
    }
  }

  // Enrich nested track[] and audio objects (e.g., reel#playlist)
  if (Array.isArray(node.track)) {
    for (const tr of node.track) {
      upgradeJsonLdNode(tr, relFile);
      if (tr?.audio && typeof tr.audio === 'object') {
        if (!tr.audio.creator) {
          tr.audio.creator = { '@id': 'https://horror.zazieproductions.com/#person' };
        }
        if (tr.genre) {
          tr.audio.genre = tr.genre;
        }
      }
    }
  }
}

function syncHtmlFile(relFile, options = {}) {
  const fullPath = path.join(root, relFile);
  let html = fs.readFileSync(fullPath, 'utf8');
  const original = html;

  // 1. Masthead & Footer sync (concise visible labels; specialist signals in non-visible title= attributes)
  if (options.syncHeaderFooter) {
    let header = baseHeader;
    if (options.activeHref) {
      header = header.replace(`<a href="${options.activeHref}"`, `<a href="${options.activeHref}" aria-current="page"`);
    }
    let footer = footerPartial;
    if (options.footerActiveHref) {
      footer = footer.replace(`<a href="${options.footerActiveHref}">`, `<a href="${options.footerActiveHref}" aria-current="page">`);
    }
    html = html.replace(/<header class="masthead">[\s\S]*?<\/header>/, () => header);
    html = html.replace(/<footer class="site-foot">[\s\S]*?<\/footer>/, () => footer);
  } else if (options.syncStoreNav) {
    const storeNav = baseNav.replace('<a href="/store"', '<a href="/store" aria-current="page"');
    html = html.replace(/<nav class="tabs" aria-label="Primary">[\s\S]*?<\/nav>/, () => storeNav);
  }

  // 2. Fix inaccurate EXPIRE title attribute on /sound-design if present
  if (relFile === 'sound-design/index.html') {
    html = html.replace(
      'title="EXPIRE - sound design and score by Zazie Kanwar-Torge"',
      'title="EXPIRE · Dystopian sci-fi horror sound design by Zazie Kanwar-Torge"',
    );
  }

  // 3. Rewrite <img> alt attributes using canonical Genre-Descriptive map
  html = html.replace(/<img\b[^>]*>/gi, (imgTag) => {
    const altMatch = /\balt="([^"]*)"/i.exec(imgTag);
    if (altMatch && altMatch[1] === '') return imgTag; // preserve intentional decorative alt=""
    const srcMatch = /\bsrc="([^"]+)"/i.exec(imgTag);
    if (!srcMatch) return imgTag;
    const newAlt = resolveAltForSrc(srcMatch[1]);
    if (!newAlt) return imgTag;
    const escaped = escapeAttr(newAlt);
    if (altMatch) {
      return imgTag.replace(/\balt="[^"]*"/i, `alt="${escaped}"`);
    }
    return imgTag.replace(/^<img\b/i, `<img alt="${escaped}"`);
  });

  // 4. Rewrite og:image:alt and twitter:image:alt based on og:image / twitter:image
  const ogImg = /<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/i.exec(html)?.[1] ??
                /<meta\b[^>]*content="([^"]+)"[^>]*property="og:image"/i.exec(html)?.[1];
  const ogAlt = resolveAltForSrc(ogImg);
  if (ogAlt) {
    const escaped = escapeAttr(ogAlt);
    html = html.replace(
      /(<meta\b[^>]*property="og:image:alt"[^>]*content=")[^"]*(")/i,
      `$1${escaped}$2`,
    );
    html = html.replace(
      /(<meta\b[^>]*name="twitter:image:alt"[^>]*content=")[^"]*(")/i,
      `$1${escaped}$2`,
    );
    html = html.replace(
      /(<meta\b[^>]*property="twitter:image:alt"[^>]*content=")[^"]*(")/i,
      `$1${escaped}$2`,
    );
  }

  // 5. Deep-link JSON-LD blocks (skipping FAQ_SCHEMA placeholder blocks handled by legal-src/build.sh)
  html = html.replace(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g, (full, rawJson) => {
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed['@graph'])) {
      for (const n of parsed['@graph']) upgradeJsonLdNode(n, relFile);
    } else {
      upgradeJsonLdNode(parsed, relFile);
    }
    return `<script type="application/ld+json">\n${JSON.stringify(parsed, null, 2)}\n</script>`;
  });

  if (html !== original) {
    fs.writeFileSync(fullPath, html, 'utf8');
    return true;
  }
  return false;
}

const hubTargets = [
  ['work/index.html', '/work', '/work'],
  ['reel/index.html', '/reel', '/reel'],
  ['composer/index.html', '/composer', '/composer'],
  ['process/index.html', '/process', '/process'],
  ['services/index.html', '/services', '/services'],
  ['sound-design/index.html', null, '/sound-design'],
  ['game-scoring/index.html', null, '/game-scoring'],
  ['404.html', null, null],
];

let changed = 0;
for (const [relFile, activeHref, footerActiveHref] of hubTargets) {
  if (syncHtmlFile(relFile, { syncHeaderFooter: true, activeHref, footerActiveHref })) changed += 1;
}
if (syncHtmlFile('store-src/store.html', { syncStoreNav: true })) changed += 1;
for (const entry of fs.readdirSync(path.join(root, 'legal-src/pages')).sort()) {
  if (!entry.endsWith('.html')) continue;
  if (syncHtmlFile(`legal-src/pages/${entry}`, {})) changed += 1;
}

console.log(`sync-static-seo: synchronized ${changed} source HTML files`);
