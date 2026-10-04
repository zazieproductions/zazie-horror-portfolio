#!/usr/bin/env node
/**
 * render-pages.mjs — the site build step for the 65 item routes.
 *
 * In a Vite project this is `vite build`. This repository has no Vite source
 * tree — the React bundle is committed output — so the equivalent step is
 * generating the item pages and wiring the hubs to them, all from `src/data`.
 *
 * What it writes (flat files, one per URL, never directories):
 *
 *     work/<slug>.html     9 productions   → served as /work/<slug>
 *     reel/<slug>.html     32 cues         → served as /reel/<slug>
 *     store/<slug>.html    24 catalogue    → served as /store/<slug>
 *     images/cues/<slug>.svg                 per-cue waveform card
 *
 * Flat files deliberately, not `<slug>/index.html`: Cloudflare Pages answers
 * `/work/expire` from `work/expire.html` with a 200 and no redirect hop, while
 * a directory route would 308 the slashless form to `/work/expire/` — the
 * redirect loop the note at the foot of `_redirects` is about. The `.html`
 * form itself 308s to the extensionless canonical, which is the URL the
 * sitemap, the canonical tag and every internal link use.
 *
 * The <head> is *not* written here: every page ships an empty
 * `<!--SEO:START-->…<!--SEO:END-->` block, and `scripts/prerender.mjs` bakes
 * the route's own head into it afterwards. One writer, one source.
 *
 * Hub linking: the hub cards carry empty `<!--ITEMLINK:…-->` marker pairs
 * (placed by `scripts/attach-item-markers.mjs`) whose contents are filled here
 * from the data, so no URL is ever hand-typed in a hub page.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT,
  SITE,
  absolute,
  assetNames,
  clockDuration,
  counts,
  cueRoutes,
  cues,
  humanDuration,
  mtime,
  productionRoutes,
  productions,
  releaseRoutes,
  releases,
  runGenerator,
  runNode,
  read,
  write,
} from './lib/data.mjs';
import { cueGraph, productionGraph, releaseGraph } from './lib/seo.mjs';

const e = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const plain = (s) => e(String(s).replace(/\s+/g, ' ').trim());

/* ------------------------------------------------------- legacy generators */

// `store-src` and `legal-src` own their own pages. Run them first when their
// sources are newer than their output, so marker filling always operates on
// fresh files (and a maintainer editing the store source gets a correct build).
if (mtime('store-src/store.html') > mtime('store.html')) {
  console.log('render-pages: store-src/store.html is newer than store.html — rebuilding the catalogue');
  runGenerator('store-src/build.sh');
}
if (mtime('legal-src/pages/sitemap.html') > mtime('sitemap/index.html')) {
  console.log('render-pages: legal-src/pages/sitemap.html is newer than the built page — rebuilding the documents');
  runGenerator('legal-src/build.sh');
}

const ASSETS = assetNames();
const MASTHEAD = read('legal-src/partials/masthead.html').trim();
const FOOTER = read('legal-src/partials/footer.html').trim();

/** Mark the current primary-nav tab, the way a hub page does. */
function mastheadFor(href) {
  return MASTHEAD.replace(
    new RegExp(`(<a href="${href}")([^>]*>)`),
    '$1 aria-current="page"$2'
  );
}

/* --------------------------------------------------------------- utilities */

function breadcrumbs(trail) {
  const items = trail
    .map((step, i) =>
      i === trail.length - 1
        ? `        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem" aria-current="page">\n          <span itemprop="name">${plain(step.name)}</span>\n          <meta itemprop="position" content="${i + 1}" />\n        </li>`
        : `        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">\n          <a itemprop="item" href="${e(step.path)}"><span itemprop="name">${plain(step.name)}</span></a>\n          <meta itemprop="position" content="${i + 1}" />\n        </li>\n        <li aria-hidden="true" class="crumb-sep">/</li>`
    )
    .join('\n');
  return `    <nav class="breadcrumbs" aria-label="Breadcrumb">\n      <ol itemscope itemtype="https://schema.org/BreadcrumbList">\n${items}\n      </ol>\n    </nav>`;
}

function relatedCards(cards) {
  return cards
    .map(
      (c) => `          <li class="hub-card">
            <h3><a href="${e(c.path)}">${plain(c.title)}</a></h3>
            <p>${plain(c.summary)}</p>
            <p class="stamp">${plain(c.stamp)}</p>
          </li>`
    )
    .join('\n');
}

function specTable(rows) {
  const body = rows
    .map(
      ([label, value]) =>
        `            <tr><th scope="row">${plain(label)}</th><td>${value}</td></tr>`
    )
    .join('\n');
  return `        <div class="table-wrap">
          <table>
            <tbody>
${body}
            </tbody>
          </table>
        </div>`;
}

/** A wrapping window of sibling routes, never including the route itself. */
function siblings(routes, index, size) {
  const out = [];
  for (let step = 1; out.length < size && step < routes.length; step++) {
    for (const i of [index + step, index - step]) {
      const route = routes[(i + routes.length) % routes.length];
      if (route.path === routes[index].path) continue;
      if (out.some((r) => r.path === route.path)) continue;
      out.push(route);
      if (out.length >= size) break;
    }
  }
  return out;
}

/* ------------------------------------------------------------ the item page */

const SEO_PLACEHOLDER = '<!--SEO:START-->\n<!--PRERENDER:SEO-->\n<!--SEO:END-->';

function itemPage({ route, css, js, masthead, eyebrow, h1, lead, metaItems, clauses, trail }) {
  return `<!DOCTYPE html>
<html lang="en" style="background:#030303;color-scheme:dark">
<head>
<meta charset="utf-8"/>
<link href="/favicon.svg" rel="icon" type="image/svg+xml"/>
<meta content="width=device-width, initial-scale=1.0, viewport-fit=cover" name="viewport"/>
<meta content="#030303" name="theme-color"/>
${SEO_PLACEHOLDER}
<link href="${e(css)}" rel="stylesheet"/>
<script src="${e(js)}" defer></script>
</head>
<body class="doc-page">
${masthead}

<header class="doc-head">
  <div class="shell doc-head-inner">
${breadcrumbs(trail)}
    <p class="eyebrow">${plain(eyebrow)}</p>
    <h1>${h1}</h1>
    <p class="doc-lead">${lead}</p>
    <ul class="doc-meta">
${metaItems.map((m) => `      <li>${m}</li>`).join('\n')}
    </ul>
  </div>
</header>

<main id="doc" class="doc">
  <div class="shell doc-layout">
    <nav class="doc-index" aria-label="On this page">
      <p>Contents</p>
      <ol>
${clauses.map((c, i) => `        <li><a href="#${c.id}"><span class="idx">${['I', 'II', 'III', 'IV', 'V'][i]}</span>${plain(c.nav)}</a></li>`).join('\n')}
      </ol>
    </nav>

    <div class="doc-body">
${clauses
  .map(
    (c, i) => `      <section class="clause" id="${c.id}">
        <h2><span class="no">${['I', 'II', 'III', 'IV', 'V'][i]}</span>${plain(c.heading)}</h2>
${c.html}
      </section>`
  )
  .join('\n')}
    </div>
  </div>
</main>

<section class="closing">
  <div class="shell closing-inner">
    <div>
      <h2>${plain('Hear it in context')} <em>${plain('or open a brief')}</em></h2>
      <p>${plain('Every cue is available for commission work, and this entry is one of ' + counts.urls + ' archive URLs generated from the same content data.')}</p>
    </div>
    <div class="closing-actions">
      <a class="btn" href="${e('/contact')}">Open a scoring inquiry</a>
      <a class="btn btn-ghost" href="${e(route.section === 'work' ? '/work' : route.section === 'reel' ? '/reel' : '/store')}">Back to the ${route.section === 'work' ? 'productions' : route.section === 'reel' ? 'showreel' : 'catalogue'}</a>
    </div>
  </div>
</section>

${FOOTER}

<script>
if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})},{once:true})}
</script>
</body>
</html>
`;
}

/* -------------------------------------------------- per-section page bodies */

function creditNote() {
  return `        <div class="note">
          <p>Score, sound design, performance and masters by <a href="/composer">Zazie Kanwar-Torge</a> · ${plain(SITE.studio)}, ${plain(SITE.location)}. Written to picture, 100% original composition — no library music, no generative audio.</p>
        </div>`;
}

function productionPage(route, index) {
  const p = route.item;
  const siblingsList = siblings(productionRoutes, index, 3);
  const cueSiblings = p.relatedCues
    .map((slug) => cueRoutes.find((c) => c.slug === slug))
    .filter(Boolean)
    .slice(0, 5);

  const hero = p.still ?? p.poster;
  const pictures = p.poster.avif
    ? `          <picture>
            <source srcset="${e(p.poster.avif)} 640w" type="image/avif"/>
            <img src="${e(p.poster.src)}" alt="${e(p.poster.alt)}" title="${plain(p.title)} (${plain(p.yearLabel)})" width="${p.poster.width}" height="${p.poster.height}"${p.poster.large ? ` srcset="${e(p.poster.src)} ${p.poster.width}w, ${e(p.poster.large)} 1200w"` : ''} sizes="(min-width: 900px) 30vw, 70vw" decoding="async"/>
          </picture>`
    : `          <img src="${e(p.poster.src)}" alt="${e(p.poster.alt)}" title="${plain(p.title)} (${plain(p.yearLabel)})" width="${p.poster.width}" height="${p.poster.height}" loading="lazy" decoding="async"/>`;

  const media = [];
  if (p.sample) {
    const src =
      p.sample.provider === 'youtube'
        ? `https://www.youtube-nocookie.com/embed/${e(p.sample.id)}`
        : `https://drive.google.com/file/d/${e(p.sample.id)}/preview`;
    media.push(`        <figure class="media-still">
          <iframe src="${src}" title="${e(p.sample.title)}" loading="lazy" style="display:block;width:100%;aspect-ratio:16/9;border:0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
        </figure>`);
    media.push(`        <p>${plain(p.sample.description)}</p>`);
  } else {
    media.push(`        <p>This production is catalogued with its poster and credits; the score itself is available on request, along with stems and cue sheets for the mix.</p>`);
  }
  const links = p.links
    .map(
      (l) =>
        `          <li><a href="${e(l.href)}" target="_blank" rel="noopener">${plain(l.label)}</a></li>`
    )
    .join('\n');

  const rows = [
    ['Title', `${plain(p.title)} <span class="small">(${plain(p.yearLabel)})</span>`],
    ['Format', plain(p.format)],
    ['Genre', plain(p.genres.join(' · '))],
    ['Composer role', plain(p.role)],
    ...(p.director ? [['Director', plain(p.director)]] : []),
    ...(p.company ? [['Production company', plain(p.company)]] : []),
    ['First line', plain(p.tagline)],
    ...(p.sample
      ? [
          [
            'Sample',
            `<a href="${e(p.links.find((l) => l.kind === 'watch')?.href ?? absolute(route.path))}" target="_blank" rel="noopener">${plain(p.sample.title)}</a>`,
          ],
        ]
      : []),
    ['Entry updated', `<time datetime="${e(p.updatedAt)}">${e(p.updatedAt)}</time>`],
  ];

  return itemPage({
    route,
    css: ASSETS.css,
    js: ASSETS.js,
    masthead: mastheadFor('/work'),
    eyebrow: `Archive · Production entry · ${p.yearLabel}`,
    h1: `${plain(p.title)} <em>${plain(p.tagline)}</em>`,
    lead: `${plain(p.summary)} A ${plain(p.format.toLowerCase())} scored by ${plain(SITE.person)} for ${plain(SITE.studio)}.`,
    metaItems: [
      `Composer <b>${plain(SITE.person)}</b>`,
      `Format <b>${plain(p.format)}</b>`,
      `Genre <b>${plain(p.genres.join(' · '))}</b>`,
    ],
    trail: [
      { name: 'Portfolio', path: '/' },
      { name: 'Selected Horror Productions', path: '/work' },
      { name: `${p.title} (${p.yearLabel})`, path: route.path },
    ],
    clauses: [
      {
        id: 'entry',
        nav: 'The production',
        heading: `Entry · ${p.title}`,
        html: `        <figure class="poster-figure" style="max-width:26rem">
${pictures}
        </figure>
${p.paragraphs.map((text) => `        <p>${plain(text)}</p>`).join('\n')}`,
      },
      {
        id: 'details',
        nav: 'At a glance',
        heading: 'At a glance',
        html: `${specTable(rows)}
        <div class="fact">
          <p>${plain(p.scoreNotes)}</p>
        </div>
${links ? `        <p>Elsewhere:</p>\n        <ul style="list-style:none;padding:0">\n${links}\n        </ul>` : ''}`,
      },
      {
        id: 'media',
        nav: p.sample ? 'Watch' : 'Media',
        heading: p.sample ? `Watch ${p.title}` : `${p.title} — media`,
        html: media.join('\n'),
      },
      {
        id: 'related',
        nav: 'Related entries',
        heading: 'Related entries',
        html: `        <p>The production hub is <a href="/work">selected horror productions</a>; the score palette behind this entry is catalogued in the <a href="/reel">32-cue showreel</a>. Sibling entries:</p>
        <ul class="hub-grid" style="margin-top:1.5rem">
${relatedCards(
  siblingsList.map((r) => ({
    path: r.path,
    title: `${r.item.title} (${r.item.yearLabel})`,
    summary: r.item.summary,
    stamp: `${r.item.format} · ${r.item.genres.join(' · ')}`,
  }))
)}
        </ul>
        <p style="margin-top:2rem">Cues in the same register:</p>
        <ul class="hub-grid">
${relatedCards(
  cueSiblings.map((r) => ({
    path: r.path,
    title: r.item.title,
    summary: r.item.summary,
    stamp: `${r.item.mood} · ${humanDuration(r.item.seconds)}`,
  }))
)}
        </ul>
${creditNote()}`,
      },
    ],
  });
}

function cuePage(route, index) {
  const c = route.item;
  const siblingRoutes = siblings(cueRoutes, index, 4);
  const releaseSiblings = (c.relatedReleases ?? [])
    .map((slug) => releaseRoutes.find((r) => r.slug === slug))
    .filter(Boolean);
  const art = `/images/cues/${c.slug}.svg`;

  return itemPage({
    route,
    css: ASSETS.css,
    js: ASSETS.js,
    masthead: mastheadFor('/reel'),
    eyebrow: `Showreel · Cue ${String(c.position).padStart(2, '0')} of ${cues.length} · ${c.mood}`,
    h1: `${plain(c.title)} <em>${plain(c.mood)} cue, ${plain(humanDuration(c.seconds))}</em>`,
    lead: `${plain(c.summary)} Cue ${c.position} of ${cues.length} on the ${plain(SITE.studio)} showreel, written and performed by ${plain(SITE.person)}.`,
    metaItems: [
      `Mood <b>${plain(c.mood)}</b>`,
      `Length <b>${plain(humanDuration(c.seconds))}</b>`,
      `Reel position <b>${c.position} of ${cues.length}</b>`,
    ],
    trail: [
      { name: 'Portfolio', path: '/' },
      { name: 'Horror Composer Showreel', path: '/reel' },
      { name: c.title, path: route.path },
    ],
    clauses: [
      {
        id: 'entry',
        nav: 'The cue',
        heading: `Entry · ${c.title}`,
        html: `        <figure class="media-still">
          <img src="${e(art)}" alt="Waveform card for ${e(c.title)} — ${e(c.mood)} horror cue by ${e(SITE.person)}, ${e(humanDuration(c.seconds))}" title="${plain(c.title)} — ${plain(c.mood)}" width="1200" height="300" decoding="async"/>
        </figure>
        <p>${plain(c.description)}</p>
        <p>${plain(c.detail)}</p>
        <p>${plain(c.usage)}</p>`,
      },
      {
        id: 'details',
        nav: 'At a glance',
        heading: 'At a glance',
        html: `${specTable([
          ['Cue', `${plain(c.title)} <span class="small">(reel position ${c.position})</span>`],
          ['Mood cluster', plain(c.mood)],
          ['Length', `${plain(clockDuration(c.seconds))} <span class="small">(${c.seconds.toFixed(3)} s master)</span>`],
          ['Feel', plain(c.feel)],
          ['Instrumentation', plain(c.instrumentation.join(' · '))],
          ['Written for', plain(c.writtenFor)],
          ['Master', `<a href="${e(c.src)}">${e(c.src)}</a> · MP3, streamed from the site`],
          ['Composer', `<a href="/composer">${plain(SITE.person)}</a>`],
          ['Entry updated', `<time datetime="${e(c.updatedAt)}">${e(c.updatedAt)}</time>`],
        ])}
        <div class="fact">
          <p>This page is text-first: the cue description, metadata and links above are complete without JavaScript and without playing a single second of audio. The player below is an ordinary HTML audio element — no script gates the content.</p>
        </div>`,
      },
      {
        id: 'media',
        nav: 'Listen',
        heading: `Listen to ${c.title}`,
        html: `        <audio controls preload="none" src="${e(c.src)}" class="audio-player"><a href="${e(c.src)}">Listen to ${plain(c.title)} MP3</a></audio>
        <p>Direct MP3: <a href="${e(c.src)}">${e(c.src)}</a> · stream the whole reel from the <a href="/reel">horror composer showreel</a> or filter it by <a href="/reel#moods">mood cluster</a>.</p>`,
      },
      {
        id: 'related',
        nav: 'Related entries',
        heading: 'Related entries',
        html: `        <p>This cue is one entry of the <a href="/reel">32-cue showreel</a>. Cues it sits beside:</p>
        <ul class="hub-grid" style="margin-top:1.5rem">
${relatedCards(
  siblingRoutes.map((r) => ({
    path: r.path,
    title: r.item.title,
    summary: r.item.summary,
    stamp: `${r.item.mood} · ${humanDuration(r.item.seconds)}`,
  }))
)}
        </ul>
${
  releaseSiblings.length
    ? `        <p style="margin-top:2rem">Released on:</p>
        <ul class="hub-grid">
${relatedCards(
  releaseSiblings.map((r) => ({
    path: r.path,
    title: r.item.title,
    summary: r.item.summary,
    stamp: `${r.item.platform} · ${r.item.price}`,
  }))
)}
        </ul>`
    : ''
}
${creditNote()}`,
      },
    ],
  });
}

function releasePage(route, index) {
  const r = route.item;
  const siblingRoutes = siblings(releaseRoutes, index, 3);
  const cueSiblings = (r.relatedCues ?? [])
    .map((slug) => cueRoutes.find((c) => c.slug === slug))
    .filter(Boolean);

  const cover = `        <figure class="poster-figure" style="max-width:24rem">
          <img src="${e(r.image.src)}" alt="${e(r.image.alt)}" title="${plain(r.title)}" width="${r.image.width}" height="${r.image.height}" loading="lazy" decoding="async"${r.image.external ? ' referrerpolicy="no-referrer"' : ''}/>
        </figure>`;

  const media = [];
  if (r.preview) {
    media.push(`        <audio controls preload="none" src="${e(r.preview.src)}" class="audio-player"><a href="${e(r.preview.src)}">${plain(r.preview.label)}</a></audio>`);
    media.push(`        <p>${plain(r.preview.label)} — a cue from the same body of work, streaming from this site.</p>`);
  }
  media.push(
    `        <p>${plain(r.cta)}: <a href="${e(r.links[0].href)}" target="_blank" rel="noopener">${plain(r.links[0].label)}</a></p>`
  );
  media.push(
    `        <p>The catalogue hub is <a href="/store">the store</a>; checkout, delivery and licence terms stay with ${plain(r.platform)}, and the buying terms are summarised in <a href="/purchases">purchases and returns</a>.</p>`
  );

  return itemPage({
    route,
    css: ASSETS.css,
    js: ASSETS.js,
    masthead: mastheadFor('/store'),
    eyebrow: `Catalogue № ${String(r.number).padStart(2, '0')} · ${r.platform} · ${r.kicker}`,
    h1: `${plain(r.title)} <em>${plain(r.price)}${r.priceNote === 'or more' ? ' or more' : ''} · ${plain(r.platform)}</em>`,
    lead: `${plain(r.summary)} Catalogue item ${String(r.number).padStart(2, '0')} of ${releases.length}, sold through ${plain(r.platform)}.`,
    metaItems: [
      `Catalogue № <b>${String(r.number).padStart(2, '0')}</b>`,
      `Platform <b>${plain(r.platform)}</b>`,
      `Price <b>${plain(r.price)}${r.priceNote ? ` (${plain(r.priceNote)})` : ''}</b>`,
    ],
    trail: [
      { name: 'Portfolio', path: '/' },
      { name: 'Catalogue', path: '/store' },
      { name: r.title, path: route.path },
    ],
    clauses: [
      {
        id: 'entry',
        nav: 'The item',
        heading: `Entry · ${r.title}`,
        html: `${cover}
        <p>${plain(r.copy)}</p>
        <p>${plain(r.detail)}</p>
        <p>${plain(r.audience)}</p>`,
      },
      {
        id: 'details',
        nav: 'At a glance',
        heading: 'At a glance',
        html: `${specTable([
          ['Catalogue entry', `${String(r.number).padStart(2, '0')} of ${releases.length}`],
          ['Item', plain(r.kicker)],
          ['Platform', plain(r.platform)],
          ['Price', `${plain(r.price)} <span class="small">${plain(r.priceNote)}</span>`],
          ...r.specs.map((s) => [s.label, plain(s.value)]),
          ['Seller', `${plain(SITE.studio)}, ${plain(SITE.location)}`],
          ['Entry updated', `<time datetime="${e(r.updatedAt)}">${e(r.updatedAt)}</time>`],
        ])}`,
      },
      {
        id: 'media',
        nav: r.preview ? 'Listen & buy' : 'Buy',
        heading: `${r.title} — ${r.preview ? 'listen & buy' : 'buy'}`,
        html: media.join('\n'),
      },
      {
        id: 'related',
        nav: 'Related entries',
        heading: 'Related entries',
        html: `        <p>More of the catalogue: <a href="/store">all ${releases.length} items</a>. Neighbouring entries:</p>
        <ul class="hub-grid" style="margin-top:1.5rem">
${relatedCards(
  siblingRoutes.map((rt) => ({
    path: rt.path,
    title: rt.item.title,
    summary: rt.item.summary,
    stamp: `${rt.item.platform} · ${rt.item.price}`,
  }))
)}
        </ul>
${
  cueSiblings.length
    ? `        <p style="margin-top:2rem">Cues from this item:</p>
        <ul class="hub-grid">
${relatedCards(
  cueSiblings.map((rt) => ({
    path: rt.path,
    title: rt.item.title,
    summary: rt.item.summary,
    stamp: `${rt.item.mood} · ${humanDuration(rt.item.seconds)}`,
  }))
)}
        </ul>`
    : ''
}
${creditNote()}`,
      },
    ],
  });
}

/* ---------------------------------------------------------- cue waveform art */

/** Deterministic per-cue waveform card, in the site's palette. */
function cueArtwork(cue) {
  const hash = [...cue.slug].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const bars = 96;
  const values = [];
  let state = hash || 1;
  for (let i = 0; i < bars; i++) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const noise = (state % 1000) / 1000;
    const envelope = Math.sin((Math.PI * i) / (bars - 1));
    values.push(0.15 + envelope * (0.35 + noise * 0.6));
  }
  const w = 1200;
  const h = 675;
  const bw = w / bars;
  const top = 140;
  const bottom = 560;
  const rects = values
    .map((v, i) => {
      const bh = Math.max(6, Math.round(v * (bottom - top)));
      const y = (top + bottom) / 2 - bh / 2;
      return `<rect x="${(i * bw + 1).toFixed(1)}" y="${y.toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${bh}" fill="${i % 7 === 3 ? '#ff2a2a' : '#c41e1e'}" opacity="${(0.45 + v * 0.55).toFixed(2)}"/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${e(cue.title)}, ${e(cue.mood)} horror cue, ${e(humanDuration(cue.seconds))}">
<rect width="${w}" height="${h}" fill="#050505"/>
<g>${rects}</g>
<text x="40" y="80" fill="#9a9590" font-family="Helvetica,Arial,sans-serif" font-size="20" letter-spacing="6">CUE ${String(cue.position).padStart(2, '0')} · ${e(cue.mood.toUpperCase())}</text>
<text x="40" y="630" fill="#f0ebe3" font-family="Georgia,serif" font-size="32">${e(cue.title)}</text>
<text x="${w - 40}" y="630" text-anchor="end" fill="#9a9590" font-family="Helvetica,Arial,sans-serif" font-size="24" letter-spacing="3">${e(clockDuration(cue.seconds))}</text>
</svg>
`;
}

/* ------------------------------------------------------------------- render */

const written = [];
for (const [index, route] of productionRoutes.entries()) {
  write(`work/${route.slug}.html`, productionPage(route, index));
  written.push(`work/${route.slug}.html`);
}
for (const [index, route] of cueRoutes.entries()) {
  write(`reel/${route.slug}.html`, cuePage(route, index));
  write(`images/cues/${route.slug}.svg`, cueArtwork(route.item));
  written.push(`reel/${route.slug}.html`);
}
for (const [index, route] of releaseRoutes.entries()) {
  write(`store/${route.slug}.html`, releasePage(route, index));
  written.push(`store/${route.slug}.html`);
}

/* -------------------------------------------------- hub + site-map markers */

const MARKER = /<!--ITEMLINK:([a-z0-9/-]+)-->(.*?)<!--\/ITEMLINK-->/gs;

function fillMarkers(file, label, expected) {
  let html = read(file);
  const seen = [];
  let filled = 0;
  html = html.replace(MARKER, (whole, marker, body) => {
    const routePath = '/' + marker.replace(/^\/+/, '');
    const route = [...productionRoutes, ...cueRoutes, ...releaseRoutes].find(
      (r) => r.path === routePath
    );
    if (!route) {
      console.error(`render-pages: ${file} marks an unknown route "${routePath}"`);
      process.exit(1);
    }
    seen.push(routePath);
    const link = `<a href="${e(route.path)}">${e(label)}</a>`;
    if (body !== link) filled++;
    return `<!--ITEMLINK:${marker}-->${link}<!--/ITEMLINK-->`;
  });
  const unique = new Set(seen);
  if (unique.size !== expected) {
    console.error(
      `render-pages: ${file} carries ${unique.size} distinct item markers, expected ${expected}`
    );
    process.exit(1);
  }
  write(file, html);
  return { filled, total: unique.size };
}

const workMarkers = fillMarkers('work/index.html', 'Full production entry', productions.length);
const reelMarkers = fillMarkers('reel/index.html', 'Full cue entry', cues.length);

// The catalogue source is the authority: fill the markers there, then rebuild
// the served copies (store.html + store/index.html) so both stay byte-equal.
{
  const before = read('store-src/store.html');
  const after = before.replace(MARKER, (whole, marker, body) => {
    const route = releaseRoutes.find((r) => r.path === '/' + marker.replace(/^\/+/, ''));
    if (!route) {
      console.error(`render-pages: store-src/store.html marks an unknown route "${routePath}"`);
      process.exit(1);
    }
    return `<!--ITEMLINK:${marker}--><a href="${e(route.path)}">Full catalogue entry</a><!--/ITEMLINK-->`;
  });
  if (after !== before) write('store-src/store.html', after);
  const count = new Set([...after.matchAll(MARKER)].map((m) => m[1])).size;
  if (count !== releases.length) {
    console.error(`render-pages: store-src/store.html carries ${count} markers, expected ${releases.length}`);
    process.exit(1);
  }
  if (after !== read('store.html')) {
    runGenerator('store-src/build.sh');
  }
}

// The human-facing site map lists every entry, generated from the same data.
for (const [section, routes] of [
  ['work', productionRoutes],
  ['reel', cueRoutes],
  ['store', releaseRoutes],
]) {
  const file = 'legal-src/pages/sitemap.html';
  const open = `<!--ITEMLINKS:${section}-->`;
  const close = `<!--/ITEMLINKS:${section}-->`;
  const source = read(file);
  const start = source.indexOf(open);
  const end = source.indexOf(close);
  if (start === -1 || end === -1) {
    console.error(`render-pages: ${file} is missing the ${section} entry list marker`);
    process.exit(1);
  }
  const list = routes
    .map(
      (r) =>
        `          <li><a href="${e(r.path)}">${e(r.item.title)}</a> — ${e(r.item.summary)}</li>`
    )
    .join('\n');
  const next = source.slice(0, start + open.length) + '\n' + list + '\n        ' + source.slice(end);
  if (next !== source) write(file, next);
}
if (mtime('legal-src/pages/sitemap.html') > mtime('sitemap/index.html')) {
  runGenerator('legal-src/build.sh');
}

// The hub twins (`work.html` beside `work/index.html`) must stay byte-equal
// after the marker fill; the repository's own tool owns that rule, so call it
// rather than reimplement it. It is idempotent and writes nothing when the
// twins already match.
runNode('tools/route-aliases.mjs');

/* ------------------------------------------------------------------ report */

const section = (name, routes) =>
  `${routes.length} ${name} pages (${routes.map((r) => r.path).slice(0, 2).join(', ')}, …)`;
console.log(
  `render-pages: ${written.length} item pages + ${cueRoutes.length} cue cards written\n` +
    `  ${section('production', productionRoutes)}\n` +
    `  ${section('showreel cue', cueRoutes)}\n` +
    `  ${section('catalogue item', releaseRoutes)}\n` +
    `  hub markers filled: work (${workMarkers.total}), reel (${reelMarkers.total}), store (${releases.length})\n` +
    `  site map entry lists: work, reel, store`
);
