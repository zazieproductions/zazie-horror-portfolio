#!/usr/bin/env node
/**
 * build-work-pages.mjs — generates work/<slug>/index.html for every entry in
 * tools/work-data.mjs, plus the rewritten /work filmography hub.
 *
 *   node tools/build-work-pages.mjs           # write files
 *   node tools/build-work-pages.mjs --check    # regenerate in memory, diff, exit 1 on drift
 *
 * Design decisions that are load-bearing:
 *
 *  - A work whose credit is sound design is NOT marked up as a
 *    MusicComposition. Inflating a credit is the exact failure mode that
 *    gets an artist entity quietly demoted.
 *  - VideoObject is emitted only when uploadDate is known. uploadDate is
 *    required for video rich results; a guessed date poisons the report.
 *  - sameAs on a work points at the IMDb *title* page, never the
 *    composer's name page. Four entries previously pointed four films at
 *    nm17333332, which tells the graph those films are the person.
 *  - Every page carries a hire CTA. A ranking filmography page with no
 *    path to an inquiry is a trophy in an empty room.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORKS, SITE, PERSON_ID, ORG_ID, SAME_AS, LAST_MODIFIED, workUrl } from './work-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ld = (o) => `<script type="application/ld+json">\n${JSON.stringify(o, null, 2)}\n</script>`;

const COMPOSER = 'Zazie Kanwar-Torge';

/* ------------------------------------------------------------------ *
 * Internal link graph: connect works by shared genre and by method,
 * not by "related posts". This is what teaches the crawler what the
 * house is.
 * ------------------------------------------------------------------ */
function relatedFor(work) {
  const shared = (w) => w.genre.filter((g) => work.genre.includes(g)).length;
  return WORKS.filter((w) => w.slug !== work.slug)
    .map((w) => ({ w, n: shared(w) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || a.w.title.localeCompare(b.w.title))
    .slice(0, 4)
    .map((x) => x.w);
}

function posterBlock(w) {
  const [w_, h_] = w.posterRatio;
  return `<figure class="poster">
<picture>
<source srcset="/images/posters/${w.poster}-640.avif" type="image/avif"/>
<img src="/images/posters/${w.poster}-640.jpg" alt="${esc(w.title)} poster \u2014 ${esc(w.role.toLowerCase())} by ${esc(COMPOSER)}" width="${w_}" height="${h_}" fetchpriority="high" decoding="async"/>
</picture>
<figcaption>Poster: <em>${esc(w.title)}</em>${w.year ? ` (${w.year})` : ''}. ${esc(w.role)}: ${esc(COMPOSER)}.</figcaption>
</figure>`;
}

function videoBlock(w) {
  if (!w.video) return '';
  if (w.video.drive) {
    return `<section class="clause" id="sample">
<h2><span class="no">II</span>Film sample</h2>
<p>A sample from <em>${esc(w.title)}</em> is hosted on Google Drive and plays in place.</p>
<p><a class="btn" href="https://drive.google.com/file/d/${w.video.drive}/view" target="_blank" rel="noopener noreferrer">Play the ${esc(w.title)} sample</a></p>
<img class="still" src="/images/${w.video.still}" alt="${esc(w.title)}: still from the film" width="1280" height="720" loading="lazy" decoding="async"/>
</section>`;
  }
  const frame = `<iframe src="https://www.youtube-nocookie.com/embed/${w.video.id}" title="${esc(w.title)} \u2014 original score by ${esc(COMPOSER)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  return `<section class="clause" id="sample">
<h2><span class="no">II</span>Film sample</h2>
<p>Original score in context. The upload lives on the <a href="https://youtube.com/@zazieproductions" target="_blank" rel="noopener noreferrer">Zazie Productions YouTube channel</a>.</p>
<div class="video">${frame}</div>
<p><a class="btn btn-ghost" href="https://www.youtube.com/watch?v=${w.video.id}" target="_blank" rel="noopener noreferrer">Watch on YouTube</a></p>
</section>`;
}

/* ------------------------------------------------------------------ *
 * Structured data
 * ------------------------------------------------------------------ */
function workGraph(w) {
  const isSeries = w.format === 'Series';
  const isSoundDesign = w.role === 'Sound design';
  const url = workUrl(w.slug);
  const workType = isSeries ? 'TVSeries' : 'Movie';

  const work = {
    '@type': workType,
    '@id': `${url}#work`,
    name: w.title,
    url,
    genre: w.genre,
    image: `${SITE}/images/posters/${w.poster}-1200.jpg`,
  };
  if (w.year) work.datePublished = String(w.year);
  if (w.tagline) work.description = w.tagline;
  if (w.director) {
    work.director = { '@type': 'Person', name: w.director };
  }
  if (w.studio) {
    work.producer = { '@type': 'Organization', name: w.studio };
  }
  // sameAs = the work's own canonical record elsewhere. Title page only.
  if (w.imdb) work.sameAs = [w.imdb];

  // Credit. Honest and type-accurate.
  if (isSoundDesign) {
    work.contributor = [
      {
        '@type': 'Role',
        roleName: 'Sound designer',
        contributor: { '@id': PERSON_ID },
      },
    ];
  } else {
    work.musicBy = { '@id': PERSON_ID };
  }

  const nodes = [work];

  if (!isSoundDesign) {
    nodes.push({
      '@type': 'MusicComposition',
      '@id': `${url}#score`,
      name: `${w.title} \u2014 original score`,
      url,
      about: { '@id': `${url}#work` },
      composer: { '@id': PERSON_ID },
      inLanguage: 'Instrumental',
      genre: w.genre,
      description: w.summary,
      isPartOf: { '@id': `${SITE}/#person` },
    });
  }

  // VideoObject only when uploadDate is known (required for rich results).
  if (w.video && w.video.id && w.video.uploadDate) {
    nodes.push({
      '@type': 'VideoObject',
      '@id': `${url}#video`,
      name: `${w.title} \u2014 original score by ${COMPOSER}`,
      description: w.summary,
      uploadDate: w.video.uploadDate,
      thumbnailUrl: `${SITE}/images/${w.video.still}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${w.video.id}`,
      publisher: { '@id': ORG_ID },
    });
  }

  nodes.push({
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Zazie Kanwar-Torge', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Selected productions', item: `${SITE}/work` },
      { '@type': 'ListItem', position: 3, name: w.title, item: url },
    ],
  });

  nodes.push({
    '@type': 'Person',
    '@id': PERSON_ID,
    name: COMPOSER,
    url: `${SITE}/`,
    jobTitle: 'Psychological Horror Composer',
    sameAs: SAME_AS,
    worksFor: { '@id': ORG_ID },
  });

  return ld({ '@context': 'https://schema.org', '@graph': nodes });
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
function page(w) {
  const url = workUrl(w.slug);
  const title = w.year
    ? `${w.title} (${w.year}) \u2014 ${w.role} by ${COMPOSER}`
    : `${w.title} \u2014 ${w.role} by ${COMPOSER}`;
  const safeTitle = esc(title.length > 62 ? `${w.title} \u2014 ${w.role} by ${COMPOSER}` : title);
  const desc = `${w.title}${w.year ? ` (${w.year})` : ''}, a ${w.format.toLowerCase()}${
    w.director ? ` directed by ${esc(w.director)}` : ''
  }. ${esc(w.role)} by ${esc(COMPOSER)}. ${w.genre.join(', ')}.`;
  const related = relatedFor(w);

  const specs = [
    ['Title', w.title],
    w.year ? ['Year', String(w.year)] : null,
    ['Format', w.format],
    [w.role === 'Sound design' ? 'Role' : 'Credit', w.role],
    w.director ? ['Director', w.director] : null,
    w.studio ? ['Production', w.studio] : null,
    ['Genre', w.genre.join(' \u00b7 ')],
    w.tagline ? ['Tagline', `\u201c${w.tagline}\u201d`] : null,
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en" style="background:#030303;color-scheme:dark">
<head>
<meta charset="utf-8"/>
<link href="/favicon.svg" rel="icon" type="image/svg+xml"/>
<meta content="width=device-width, initial-scale=1.0, viewport-fit=cover" name="viewport"/>
<meta content="#030303" name="theme-color"/>
<title>${safeTitle}</title>
<meta content="${esc(desc.slice(0, 155))}" name="description"/>
<link rel="canonical" href="${url}"/>
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/>
<meta name="author" content="${COMPOSER}"/>
<link rel="preload" as="font" type="font/woff2" href="/fonts/cormorant-garamond-latin-400-normal.woff2" crossorigin/>
<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-latin-wght-normal.woff2" crossorigin/>
<link rel="preload" as="image" href="/images/posters/${w.poster}-640.avif" type="image/avif"/>
<meta property="og:type" content="video.movie"/>
<meta property="og:site_name" content="Zazie Productions: Horror Composer"/>
<meta property="og:locale" content="en_US"/>
<meta property="og:title" content="${safeTitle}"/>
<meta property="og:description" content="${esc(desc.slice(0, 155))}"/>
<meta property="og:url" content="${url}"/>
<meta property="og:image" content="${SITE}/images/posters/${w.poster}-1200.jpg"/>
<meta property="og:image:alt" content="${esc(w.title)} poster"/>
<meta name="twitter:card" content="summary_large_image"/>
<link href="/legal-89928f71.css" rel="stylesheet"/>
<style>
/* Page-scoped components. Deliberately NOT added to legal-89928f71.css:
   that bundle is content-hashed and precached by sw.js, so adding three
   rules here avoids invalidating the cache for all 20 existing pages. */
.poster{margin:0 0 1.5rem}
.poster img{display:block;width:100%;max-width:340px;height:auto;border:1px solid rgba(240,235,227,.14)}
.poster figcaption{margin-top:.6rem;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:rgba(240,235,227,.55)}
.video{position:relative;aspect-ratio:16/9;margin:0 0 1rem;border:1px solid rgba(240,235,227,.14);background:#000}
.video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.still{display:block;max-width:100%;height:auto;margin-top:.5rem;border:1px solid rgba(240,235,227,.14)}
.specs{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:.75rem 1.5rem;margin:1.5rem 0;padding:0;border-top:1px solid rgba(240,235,227,.12)}
.spec-row{display:flex;gap:.75rem;padding:.75rem 0;border-bottom:1px solid rgba(240,235,227,.08);margin:0}
.spec-row dt{flex:0 0 88px;font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;color:rgba(240,235,227,.5)}
.spec-row dd{margin:0;font-size:.9rem;color:rgba(240,235,227,.92)}
</style>
${workGraph(w)}
</head>
<body>
<a class="skip" href="#doc">Skip to the document</a>
<div class="grain" aria-hidden="true"></div>
<div class="vignette" aria-hidden="true"></div>
<div class="frame" aria-hidden="true"></div>

<header class="masthead">
  <div class="shell masthead-inner">
    <a class="brand" href="/"><span class="brand-name">ZKT</span> Productions</a>
    <nav class="tabs" aria-label="Primary">
      <a href="/reel">Reel</a>
      <a href="/work" aria-current="page">Work</a>
      <a href="/composer">Composer</a>
      <a href="/services">Rates</a>
      <a href="/contact" class="btn btn-sm">Scoring inquiry</a>
    </nav>
  </div>
  <div class="progress" aria-hidden="true"></div>
</header>

<header class="doc-head">
  <div class="shell">
    <p class="eyebrow">Archive ${String(WORKS.indexOf(w) + 1).padStart(2, '0')} \u00b7 ${esc(w.format)}</p>
    <h1>${esc(w.title)}${w.year ? ` <span class="small">(${w.year})</span>` : ''}</h1>
    <p class="doc-lead">${esc(w.summary)}</p>
    <ul class="doc-meta">
      <li><span class="k">${w.role === 'Sound design' ? 'Role' : 'Credit'}</span> <span class="v">${esc(w.role)}</span></li>
      <li><span class="k">${w.role === 'Sound design' ? 'Sound designer' : 'Composer'}</span> <span class="v"><a href="/composer">${esc(COMPOSER)}</a></span></li>
      <li><span class="k">Genre</span> <span class="v">${esc(w.genre.join(' \u00b7 '))}</span></li>
    </ul>
  </div>
</header>

<main id="doc" class="doc">
  <div class="shell doc-layout">
    <nav class="doc-index" aria-label="On this page">
      <p>Contents</p>
      <ul>
        <li><a href="#credits"><span class="idx">I</span>Credits and record</a></li>
        ${w.video ? '<li><a href="#sample"><span class="idx">II</span>Film sample</a></li>' : ''}
        <li><a href="#score"><span class="idx">${w.video ? 'III' : 'II'}</span>How the ${w.role === 'Sound design' ? 'sound' : 'score'} works</a></li>
        <li><a href="#related"><span class="idx">${w.video ? 'IV' : 'III'}</span>Adjacent work</a></li>
      </ul>
    </nav>

    <div class="doc-body">
      <section class="clause" id="credits">
        <h2><span class="no">I</span>Credits and record</h2>
        ${posterBlock(w)}
        <dl class="specs">
${specs.map(([k, v]) => `          <div class="spec-row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('\n')}
        </dl>
        <p class="note">Credit as published on this site. ${
          w.imdb
            ? `Corroborated on <a href="${w.imdb}" target="_blank" rel="noopener noreferrer">IMDb</a>.`
            : 'A public IMDb title record is not yet linked for this production.'
        } Full filmography: <a href="/work">selected productions</a>.</p>
      </section>

${videoBlock(w)}

      <section class="clause" id="score">
        <h2><span class="no">${w.video ? 'III' : 'II'}</span>How the ${w.role === 'Sound design' ? 'sound' : 'score'} works</h2>
        <p>${esc(w.summary)}</p>
        <p>${
          w.role === 'Sound design'
            ? 'This credit is sound design rather than a composed score, and the page says so plainly: the value here is the treatment of space and texture, not a theme.'
            : 'Written to picture as original composition \u2014 no library music. The house method across these productions is composition-first: themes, harmony and texture are settled against the cut before anything is orchestrated, so the dread is structural rather than applied.'
        } The full method is documented on the <a href="/process">scoring process</a> page, and the vocabulary of the work \u2014 drone, bowed metal, struck strings, waterphone, custom synthesiser builds \u2014 on the <a href="/composer">composer</a> page.</p>
        <p>To hear the material outside a specific picture: the <a href="/reel">29-cue showreel</a> collects the psychological dread beds, tension stingers, dark ambience and body-horror cues that this production draws from.</p>
      </section>

      <section class="clause" id="related">
        <h2><span class="no">${w.video ? 'IV' : 'III'}</span>Adjacent work</h2>
        <p>Productions in the catalogue that share genre ground with <em>${esc(w.title)}</em>.</p>
        <ul class="hub-grid">
${related
  .map(
    (r) => `          <li class="hub-card">
            <h2><a class="stretch" href="/work/${r.slug}">${esc(r.title)}</a></h2>
            <p>${esc(r.format)} \u00b7 ${esc(r.role.toLowerCase())}</p>
            <p class="stamp">${esc(r.genre.join(' \u00b7 '))}</p>
          </li>`,
  )
  .join('\n')}
        </ul>
      </section>

      <section class="clause closing">
        <div class="closing-inner">
          <p class="eyebrow">Commission</p>
          <h2>Scoring a film that needs this register?</h2>
          <p>Send the format, runtime, timeline and budget. Boutique capacity means a limited number of concurrent scores.</p>
          <div class="closing-actions">
            <a class="btn" href="/contact">Open a scoring inquiry</a>
            <a class="btn btn-ghost" href="/services">Rates and packages</a>
          </div>
        </div>
      </section>
    </div>
  </div>
</main>

<footer class="site-foot">
  <div class="shell">
    <div class="foot-top">
      <div class="foot-brand">
        <p class="name">${COMPOSER}</p>
        <p class="tagline">Zazie Productions LLC \u00b7 Psychological horror composer \u00b7 Winter 2024 Award Winner, Visual Container</p>
      </div>
      <nav class="foot-links" aria-label="Footer">
        <a href="/">Portfolio</a>
        <a href="/reel">Showreel: 29 cues</a>
        <a href="/work">Selected productions</a>
        <a href="/composer">Composer biography</a>
        <a href="/process">Process: spotting to stems</a>
        <a href="/services">Rates</a>
        <a href="/contact">Hire a horror composer</a>
        <a href="/store">Catalogue</a>
        <a href="https://www.imdb.com/name/nm17333332" target="_blank" rel="noopener noreferrer">IMDb</a>
        <a href="https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0" target="_blank" rel="noopener noreferrer">Spotify</a>
        <a href="https://youtube.com/@zazieproductions" target="_blank" rel="noopener noreferrer">YouTube</a>
      </nav>
    </div>
    <nav class="foot-law" aria-label="Legal and operating documents">
      <span class="lbl">Documents</span>
      <a href="/legal">All documents</a>
      <a href="/faq">FAQ</a>
      <a href="/terms">Terms</a>
      <a href="/privacy">Privacy</a>
      <a href="/licensing">Licensing and credits</a>
      <a href="/accessibility">Accessibility</a>
    </nav>
    <p class="foot-legal">
      <span>\u00a9 <span data-year>2026</span> Zazie Productions LLC. All rights reserved.</span>
      <span>No advertising trackers \u00b7 no cookies set by this site</span>
    </p>
  </div>
</footer>
<script src="/legal-ea8a33ec.js" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ *
 * /work hub — the filmography spine. Now a real index of objects.
 * ------------------------------------------------------------------ */
function hubPage() {
  const cards = WORKS.map(
    (w, i) => `          <li class="hub-card">
            <span class="no">${String(i + 1).padStart(2, '0')}</span>
            <h2><a class="stretch" href="/work/${w.slug}">${esc(w.title)}${w.year ? ` <span class="small">(${w.year})</span>` : ''}</a></h2>
            <p>${esc(w.format)} \u00b7 ${esc(w.role)}</p>
            <p>${esc(w.summary.split('.')[0])}.</p>
            <p class="stamp">${esc(w.genre.join(' \u00b7 '))}${w.director ? ` \u00b7 dir. ${esc(w.director)}` : ''}</p>
          </li>`,
  ).join('\n');

  const list = WORKS.map((w, i) => {
    const url = workUrl(w.slug);
    const node = {
      '@type': w.format === 'Series' ? 'TVSeries' : 'Movie',
      '@id': `${url}#work`,
      name: w.title,
      url,
      genre: w.genre,
    };
    if (w.year) node.datePublished = String(w.year);
    if (w.director) node.director = { '@type': 'Person', name: w.director };
    if (w.imdb) node.sameAs = [w.imdb];
    if (w.role === 'Sound design') {
      node.contributor = [{ '@type': 'Role', roleName: 'Sound designer', contributor: { '@id': PERSON_ID } }];
    } else {
      node.musicBy = { '@id': PERSON_ID };
    }
    return { '@type': 'ListItem', position: i + 1, item: node };
  });

  const schema = ld({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${SITE}/work#webpage`,
        url: `${SITE}/work`,
        name: 'Selected productions \u2014 horror filmography',
        description:
          `Filmography of psychological horror composer Zazie Kanwar-Torge: ${WORKS.length} productions across psychological horror, folk horror, body horror, supernatural and dark science fiction.`,
        isPartOf: { '@id': `${SITE}/#website` },
        about: { '@id': PERSON_ID },
        dateModified: LAST_MODIFIED,
      },
      {
        '@type': 'ItemList',
        name: 'Selected horror productions',
        numberOfItems: WORKS.length,
        itemListOrder: 'https://schema.org/ItemListUnordered',
        itemListElement: list,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Zazie Kanwar-Torge', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Selected productions', item: `${SITE}/work` },
        ],
      },
      {
        '@type': 'Person',
        '@id': PERSON_ID,
        name: COMPOSER,
        url: `${SITE}/`,
        jobTitle: 'Psychological Horror Composer',
        sameAs: SAME_AS,
        worksFor: { '@id': ORG_ID },
      },
    ],
  });

  return `<!DOCTYPE html>
<html lang="en" style="background:#030303;color-scheme:dark">
<head>
<meta charset="utf-8"/>
<link href="/favicon.svg" rel="icon" type="image/svg+xml"/>
<meta content="width=device-width, initial-scale=1.0, viewport-fit=cover" name="viewport"/>
<meta content="#030303" name="theme-color"/>
<title>Selected productions \u2014 horror filmography | ${esc(COMPOSER)}</title>
<meta content="Filmography of psychological horror composer ${esc(COMPOSER)}: ${WORKS.length} productions with credits, directors, genre and film samples." name="description"/>
<link rel="canonical" href="${SITE}/work"/>
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/>
<meta name="author" content="${COMPOSER}"/>
<link rel="preload" as="font" type="font/woff2" href="/fonts/cormorant-garamond-latin-400-normal.woff2" crossorigin/>
<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-latin-wght-normal.woff2" crossorigin/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="Zazie Productions: Horror Composer"/>
<meta property="og:title" content="Selected productions \u2014 horror filmography"/>
<meta property="og:description" content="Nine productions scored or sound-designed by ${esc(COMPOSER)}. Credits, directors and film samples."/>
<meta property="og:url" content="${SITE}/work"/>
<meta property="og:image" content="${SITE}/images/hero-portrait.jpg"/>
<meta name="twitter:card" content="summary_large_image"/>
<link href="/legal-89928f71.css" rel="stylesheet"/>
${schema}
</head>
<body>
<a class="skip" href="#doc">Skip to the document</a>
<div class="grain" aria-hidden="true"></div>
<div class="vignette" aria-hidden="true"></div>
<div class="frame" aria-hidden="true"></div>

<header class="masthead">
  <div class="shell masthead-inner">
    <a class="brand" href="/"><span class="brand-name">ZKT</span> Productions</a>
    <nav class="tabs" aria-label="Primary">
      <a href="/reel">Reel</a>
      <a href="/work" aria-current="page">Work</a>
      <a href="/composer">Composer</a>
      <a href="/services">Rates</a>
      <a href="/contact" class="btn btn-sm">Scoring inquiry</a>
    </nav>
  </div>
  <div class="progress" aria-hidden="true"></div>
</header>

<header class="doc-head">
  <div class="shell">
    <p class="eyebrow">Archive 01 \u00b7 Filmography</p>
    <h1>Nine productions, <em>scored for dread</em></h1>
    <p class="doc-lead">Composition-first, dark, atmospheric, cinematic: hybrid orchestral dread, ambient minimalism, bowed metal, struck strings, waterphone and custom synthesiser builds shaped for picture. Every entry is 100% original composition written to picture \u2014 no library music. Each production has its own record: credit, director, genre and sample where one exists.</p>
    <ul class="doc-meta">
      <li><span class="k">Composer</span> <span class="v"><a href="/composer">${esc(COMPOSER)}</a></span></li>
      <li><span class="k">Studio</span> <span class="v">Zazie Productions LLC</span></li>
      <li><span class="k">Productions</span> <span class="v">${WORKS.length} records</span></li>
    </ul>
  </div>
</header>

<main id="doc" class="doc">
  <div class="shell doc-layout">
    <nav class="doc-index" aria-label="On this page">
      <p>Contents</p>
      <ul>
        <li><a href="#productions"><span class="idx">I</span>Productions</a></li>
        <li><a href="#method"><span class="idx">II</span>Method</a></li>
        <li><a href="#related"><span class="idx">III</span>Related archives</a></li>
      </ul>
    </nav>

    <div class="doc-body">
      <section class="clause" id="productions">
        <h2><span class="no">I</span>Selected productions</h2>
        <p>Open a record for full credits, the director, and the film sample where one is published.</p>
        <ul class="hub-grid">
${cards}
        </ul>
      </section>

      <section class="clause" id="method">
        <h2><span class="no">II</span>Method</h2>
        <p>The catalogue is organised by what the score is doing rather than by release order. Psychological horror asks for interiority \u2014 the audience hears a mind; folk horror asks for ritual and repetition; body horror asks for texture over melody; supernatural work asks for suggestion that never confirms itself.</p>
        <p>Across all nine productions the approach is the same: themes, harmony and texture are settled against the cut in the spotting session before anything is orchestrated. The full sequence, from spotting to stems, is on the <a href="/process">process</a> page.</p>
        <p>Four further productions have public film samples but no published director or year on this site, so they are not given a record here: <em>AQUAPHOBIA</em>, <em>GOODBYE, BROTHER</em>, <em>Home Intruder</em> and <em>Whispers In The Dark</em>. Their samples are on the <a href="/reel">showreel</a> page and the portfolio. A record will be added when the credits are confirmed.</p>
      </section>

      <section class="clause" id="related">
        <h2><span class="no">III</span>Related archives</h2>
        <ul class="hub-grid">
          <li class="hub-card">
            <h2><a class="stretch" href="/reel">Showreel \u2014 29 cues</a></h2>
            <p>Psychological dread beds, tension stingers, dark ambience, cosmic and body horror, thriller chase cues.</p>
          </li>
          <li class="hub-card">
            <h2><a class="stretch" href="/composer">Composer</a></h2>
            <p>${esc(COMPOSER)}: biography, press, and the point of view behind the work.</p>
          </li>
          <li class="hub-card">
            <h2><a class="stretch" href="/process">Process</a></h2>
            <p>From spotting session to stems: how a horror score is built, revised and delivered.</p>
          </li>
          <li class="hub-card">
            <h2><a class="stretch" href="/services">Rates</a></h2>
            <p>Micro-budget from $50, short from $2,500, feature from $8,000, game from $4,500.</p>
          </li>
          <li class="hub-card">
            <h2><a class="stretch" href="/contact">Scoring inquiry</a></h2>
            <p>Send format, runtime, timeline and budget.</p>
          </li>
        </ul>
      </section>
    </div>
  </div>
</main>

<footer class="site-foot">
  <div class="shell">
    <div class="foot-top">
      <div class="foot-brand">
        <p class="name">${COMPOSER}</p>
        <p class="tagline">Zazie Productions LLC \u00b7 Psychological horror composer \u00b7 Winter 2024 Award Winner, Visual Container</p>
      </div>
      <nav class="foot-links" aria-label="Footer">
        <a href="/">Portfolio</a>
        <a href="/reel">Showreel: 29 cues</a>
        <a href="/work" aria-current="page">Selected productions</a>
        <a href="/composer">Composer biography</a>
        <a href="/process">Process: spotting to stems</a>
        <a href="/services">Rates</a>
        <a href="/contact">Hire a horror composer</a>
        <a href="/store">Catalogue</a>
        <a href="https://www.imdb.com/name/nm17333332" target="_blank" rel="noopener noreferrer">IMDb</a>
        <a href="https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0" target="_blank" rel="noopener noreferrer">Spotify</a>
        <a href="https://youtube.com/@zazieproductions" target="_blank" rel="noopener noreferrer">YouTube</a>
      </nav>
    </div>
    <nav class="foot-law" aria-label="Legal and operating documents">
      <span class="lbl">Documents</span>
      <a href="/legal">All documents</a>
      <a href="/faq">FAQ</a>
      <a href="/terms">Terms</a>
      <a href="/privacy">Privacy</a>
      <a href="/licensing">Licensing and credits</a>
      <a href="/accessibility">Accessibility</a>
    </nav>
    <p class="foot-legal">
      <span>\u00a9 <span data-year>2026</span> Zazie Productions LLC. All rights reserved.</span>
      <span>No advertising trackers \u00b7 no cookies set by this site</span>
    </p>
  </div>
</footer>
<script src="/legal-ea8a33ec.js" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ */
const files = new Map();
for (const w of WORKS) files.set(`work/${w.slug}/index.html`, page(w));
files.set('work/index.html', hubPage());

let drift = 0;
for (const [rel, content] of files) {
  const abs = path.join(ROOT, rel);
  if (CHECK) {
    const existing = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
    if (existing !== content) {
      console.error(`drift: ${rel} is not up to date with tools/work-data.mjs`);
      drift++;
    } else {
      console.log(`ok:      ${rel}`);
    }
  } else {
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
    console.log(`wrote    ${rel}  (${(content.length / 1024).toFixed(1)} KB)`);
  }
}

if (CHECK && drift) {
  console.error(`\n${drift} file(s) drifted. Run: node tools/build-work-pages.mjs`);
  process.exit(1);
}
console.log(`\n${CHECK ? 'checked' : 'generated'} ${files.size} pages from ${WORKS.length} work records.`);
