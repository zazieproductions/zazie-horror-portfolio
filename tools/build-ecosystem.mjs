#!/usr/bin/env node
/**
 * build-ecosystem.mjs
 * -----------------------------------------------------------------------------
 * Generates and maintains the cross-property entity graph for
 * horror.zazieproductions.com.
 *
 * One file is the source of truth: tools/ecosystem-properties.json. Everything
 * downstream - the /elsewhere hub, the /press index, the /discography page, the
 * "Elsewhere" strip in every footer, the hub cards pointing at the new pages,
 * the sitemap entries, the canonical headers, the redirect map and the service
 * worker precache list - is generated from it, so the graph can never drift
 * apart page by page.
 *
 *   node tools/build-ecosystem.mjs
 *
 * Idempotent: running it twice produces byte-identical output.
 * -----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://horror.zazieproductions.com';
const TODAY = '2026-09-18';

const REG = JSON.parse(fs.readFileSync(path.join(__dirname, 'ecosystem-properties.json'), 'utf8'));

/* ------------------------------------------------------------------ helpers */

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const write = (p, s) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, p), s, 'utf8');
  console.log(`wrote ${p} (${Buffer.byteLength(s)} bytes)`);
};

/** Replace once, loudly. A silent no-op here would mean a drifting graph. */
function sub(file, src, needle, replacement) {
  if (!src.includes(needle)) {
    console.error(`  !! ${file}: anchor not found -> ${JSON.stringify(needle.slice(0, 70))}`);
    process.exitCode = 1;
    return src;
  }
  return src.replace(needle, replacement);
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/* ------------------------------------------------------------- the registry */

const ALL_ITEMS = REG.groups.flatMap((g) => g.items);
const SAME_AS = [
  SITE + '/',
  ...ALL_ITEMS.map((i) => i.url),
  ...REG.press.map((p) => p.url),
].filter((u, i, a) => a.indexOf(u) === i);

/** Highest-signal subset for compact strips: platforms a stranger would name. */
const STRIP = [
  ['IMDb', 'https://www.imdb.com/name/nm17333332', 'Zazie Kanwar-Torge on IMDb: composer and sound department credits'],
  ['Spotify', 'https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0', 'Zazie Productions on Spotify'],
  ['Apple Music', 'https://music.apple.com/us/artist/zazie-productions/1623719351', 'Zazie Productions on Apple Music'],
  ['Deezer', 'https://www.deezer.com/us/artist/170543657', 'Zazie Productions on Deezer'],
  ['Bandcamp', 'https://zazieproductions.bandcamp.com', 'Zazie Productions on Bandcamp: eighteen records'],
  ['YouTube', 'https://youtube.com/@zazieproductions', 'Zazie Productions on YouTube: horror scores in context'],
  ['Discogs', 'https://www.discogs.com/artist/11354435', 'Zazie Productions on Discogs'],
  ['MusicBrainz', 'https://musicbrainz.org/artist/b610b4cb-87da-44d7-a262-2bd65fb8098c', 'Zazie Productions on MusicBrainz'],
  ['TMDB', 'https://www.themoviedb.org/person/5112050', 'Zazie Productions on TMDB'],
  ['itch.io', 'https://zazieproductions.itch.io/', 'Horror game audio and sound libraries on itch.io'],
  ['Gumroad', 'https://zazieproductions.gumroad.com/', 'Plug-in vault and immersive audio on Gumroad'],
  ['eBay', 'https://www.ebay.com/usr/zazie_productions', 'Objects from the scoring room on eBay'],
  ['Linktree', 'https://linktr.ee/zazieproductions', 'The public link hub'],
  ['Instagram', 'https://www.instagram.com/zazieproductionsofficial/', '@zazieproductionsofficial'],
  ['LinkedIn', 'https://www.linkedin.com/in/zazie-kanwar-torge-3b8a98373/', 'Zazie Kanwar-Torge on LinkedIn'],
  ['GitHub', 'https://github.com/zazieproductions', 'Zazie Productions on GitHub'],
  ['Stage 32', 'https://www.stage32.com/profile/1164424/about', 'Zazie Kanwar-Torge on Stage 32'],
  ['FilmFreeway', 'https://filmfreeway.com/ZazieProductions', 'Zazie Productions on FilmFreeway'],
  ['Groover', 'https://groover.co/en/influencer/profile/0.zazie-productions/', 'Zazie Productions curator profile on Groover'],
  ['Hackaday.io', 'https://hackaday.io/ZazieProductions', 'Zazie Productions hardware and DSP projects on Hackaday.io'],
  ['Casting Call Club', 'https://www.castingcall.club/zazieproductions', 'Zazie Productions on Casting Call Club'],
  ['SoundClick', 'https://pro.soundclick.com/ZazieProductions', 'Zazie Productions on SoundClick'],
  ['Muso.AI', 'https://credits.muso.ai/profile/4010f3b7-9a87-4961-8dfd-917de0ba787e', 'Zazie Kanwar-Torge credits index on Muso.AI'],
  ['Substack', 'https://substack.com/@zazieproductions', 'Zazie Productions on Substack'],
];

/* ------------------------------------------------------- shared page chrome */

const masthead = (current) => `<a class="skip" href="#doc">Skip to the document</a>
<div class="grain" aria-hidden="true"></div>
<div class="vignette" aria-hidden="true"></div>
<div class="frame" aria-hidden="true"></div>

<header class="masthead">
  <div class="shell masthead-inner">
    <a class="brand" href="/" aria-label="Zazie Kanwar-Torge, Zazie Productions, back to the portfolio">
      <span class="mark" aria-hidden="true">Z</span>
      <span class="brand-name"><b>ZKT</b><span>Productions</span></span>
    </a>
    <nav class="tabs" aria-label="Primary">
      <a href="/reel" title="Horror composer showreel: 29 original dark cues"${current === '/reel' ? ' aria-current="page"' : ''}>Reel</a>
      <a href="/work" title="Selected horror productions: psychological, folk, body horror"${current === '/work' ? ' aria-current="page"' : ''}>Work</a>
      <a href="/composer" title="Zazie Kanwar-Torge: psychological horror composer biography"${current === '/composer' ? ' aria-current="page"' : ''}>Composer</a>
      <a href="/discography" title="Records: eighteen releases on Bandcamp, Spotify and Apple Music"${current === '/discography' ? ' aria-current="page"' : ''}>Records</a>
      <a href="/press" title="Press, awards and citations for Zazie Productions"${current === '/press' ? ' aria-current="page"' : ''}>Press</a>
      <a href="/elsewhere" title="Every Zazie Productions property: IMDb, Spotify, catalogues, profiles"${current === '/elsewhere' ? ' aria-current="page"' : ''}>Elsewhere</a>
      <a href="/store" title="Catalogue: horror sound libraries"${current === '/store' ? ' aria-current="page"' : ''}>Store</a>
    </nav>
    <a class="btn btn-sm" href="/contact" title="Hire a horror composer: scoring inquiry">Scoring inquiry</a>
  </div>
  <div class="progress" aria-hidden="true"></div>
</header>`;

const elsewhereNav = (indent = '    ') => {
  const rows = STRIP.map(
    ([label, url, title]) =>
      `${indent}<a href="${url}" target="_blank" rel="noopener" title="${title}">${label}</a>`
  ).join('\n');
  return `${indent}<nav class="foot-law" aria-label="Zazie Productions elsewhere">
${indent}  <span class="lbl">Elsewhere</span>
${rows}
${indent}</nav>`;
};

const footer = (current) => `<footer class="site-foot">
  <div class="shell">
    <div class="foot-top">
      <div class="foot-brand">
        <p class="name">Zazie Kanwar-Torge</p>
        <p class="tagline">Zazie Productions LLC · Atmospheric horror scores · Psychological horror composer</p>
      </div>
      <nav class="foot-links" aria-label="Footer">
        <a href="/"${current === '/' ? ' aria-current="page"' : ''}>Portfolio</a>
        <a href="/reel"${current === '/reel' ? ' aria-current="page"' : ''}>Showreel</a>
        <a href="/work"${current === '/work' ? ' aria-current="page"' : ''}>Productions</a>
        <a href="/composer"${current === '/composer' ? ' aria-current="page"' : ''}>Composer</a>
        <a href="/discography"${current === '/discography' ? ' aria-current="page"' : ''}>Records</a>
        <a href="/press"${current === '/press' ? ' aria-current="page"' : ''}>Press</a>
        <a href="/elsewhere"${current === '/elsewhere' ? ' aria-current="page"' : ''}>Elsewhere</a>
        <a href="/process"${current === '/process' ? ' aria-current="page"' : ''}>Process</a>
        <a href="/services"${current === '/services' ? ' aria-current="page"' : ''}>Rates</a>
        <a href="/contact"${current === '/contact' ? ' aria-current="page"' : ''}>Scoring inquiry</a>
        <a href="/store"${current === '/store' ? ' aria-current="page"' : ''}>Catalogue</a>
      </nav>
    </div>
${elsewhereNav()}
    <nav class="foot-law" aria-label="Legal and operating documents">
      <span class="lbl">Documents</span>
      <a href="/legal">All documents</a>
      <a href="/faq">FAQ</a>
      <a href="/terms">Terms</a>
      <a href="/privacy">Privacy</a>
      <a href="/licensing">Licensing and credits</a>
      <a href="/purchases">Purchases and returns</a>
      <a href="/accessibility">Accessibility</a>
    </nav>
    <p class="foot-legal">
      <span>© <span data-year>2026</span> Zazie Productions LLC. All rights reserved. Psychological horror composer portfolio.</span>
      <span>No advertising trackers · no cookies set by this site</span>
    </p>
  </div>
</footer>`;

/** JSON-LD graph shared by every generated page. */
function entityGraph(page) {
  return [
    {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person',
          '@id': REG.entity.personId,
          name: REG.entity.person,
          alternateName: ['Zazie Productions', 'Zazie Kanwar-Torge', 'Zazie Diya Kanwar-Torge'],
          url: SITE + '/',
          sameAs: SAME_AS,
          jobTitle: 'Psychological Horror Composer',
          ...REG.entity.personExtras,
        },
        {
          '@type': 'Organization',
          '@id': REG.entity.orgId,
          name: REG.entity.org,
          alternateName: 'Zazie Productions',
          url: SITE + '/',
          sameAs: SAME_AS.filter((u) => !u.includes('imdb.com/name')),
          founder: { '@id': REG.entity.personId },
        },
        {
          '@type': 'MusicGroup',
          '@id': REG.entity.labelId,
          name: 'Zazie Productions',
          alternateName: 'Zazie Productions LLC',
          genre: ['Psychological Horror', 'Dark Ambient', 'Experimental', 'Musique Concrete', 'Harsh Noise Wall'],
          sameAs: SAME_AS,
          foundingDate: '2019',
          founder: { '@id': REG.entity.personId },
        },
        page,
      ],
    },
  ][0];
}

const script = (obj) =>
  '<script type="application/ld+json">\n' + JSON.stringify(obj, null, 2) + '\n</script>';

function pageShell({ url, title, description, eyebrow, h1, lead, meta, sections, graph, ogtitle }) {
  const contents = sections
    .map((s, i) => `        <li><a href="#${s.id}"><span class="idx">${ROMAN[i]}</span>${s.toc}</a></li>`)
    .join('\n');

  const body = sections
    .map(
      (s, i) => `      <section class="clause" id="${s.id}">
        <h2><span class="no">${ROMAN[i]}</span>${s.h2}</h2>
${s.html}
      </section>`
    )
    .join('\n\n');

  return `<!DOCTYPE html>
<html lang="en" style="background:#030303;color-scheme:dark">
<head>
<meta charset="utf-8"/>
<link href="/favicon.svg" rel="icon" type="image/svg+xml"/>
<meta content="width=device-width, initial-scale=1.0, viewport-fit=cover" name="viewport"/>
<meta content="#030303" name="theme-color"/>
<title>${title}</title>
<meta content="${description}" name="description"/>
<link rel="canonical" href="${SITE}${url}"/>
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"/>
<meta name="author" content="Zazie Kanwar-Torge"/>
<link rel="preload" as="font" type="font/woff2" href="/fonts/cormorant-garamond-latin-400-normal.woff2" crossorigin/>
<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-latin-wght-normal.woff2" crossorigin/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="Zazie Productions: Horror Composer"/>
<meta property="og:locale" content="en_US"/>
<meta property="og:title" content="${ogtitle || title}"/>
<meta property="og:description" content="${description}"/>
<meta property="og:url" content="${SITE}${url}"/>
<meta property="og:image" content="${SITE}/images/hero-portrait.jpg"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${ogtitle || title}"/>
<meta name="twitter:description" content="${description}"/>
<meta name="twitter:image" content="${SITE}/images/hero-portrait.jpg"/>
<link href="/legal-89928f71.css" rel="stylesheet"/>
${script(entityGraph(graph))}
</head>
<body>
${masthead(url)}

<header class="doc-head">
  <div class="shell doc-head-inner">
    <p class="eyebrow">${eyebrow}</p>
    <h1>${h1}</h1>
    <p class="doc-lead">${lead}</p>
    <ul class="doc-meta">
${meta.map(([k, v]) => `      <li>${k} <b>${v}</b></li>`).join('\n')}
    </ul>
  </div>
</header>

<main id="doc" class="doc">
  <div class="shell doc-layout">
    <nav class="doc-index" aria-label="On this page">
      <p>Contents</p>
      <ol>
${contents}
      </ol>
    </nav>

    <div class="doc-body">
${body}
    </div>
  </div>
</main>

${footer(url)}

<script>if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})},{once:true})}</script>
<script src="/legal-ea8a33ec.js" defer></script>
</body>
</html>`;
}

const hubCard = (i, no, href, title, body, stamp, external) => `          <li class="hub-card"${i ? ` style="--i:${i}"` : ''}>
            <span class="no">${no}</span>
            <h2><a class="stretch" href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>${title}</a></h2>
            <p>${body}</p>
            <p class="stamp">${stamp}</p>
          </li>`;

/* =========================================================== 1. /elsewhere */

{
  const sections = REG.groups.map((g) => ({
    id: g.id,
    toc: g.title,
    h2: g.title,
    html: `        <p>${g.lead}</p>
        <ul class="hub-grid" style="margin-top:1.5rem">
${g.items
  .map((it, i) =>
    hubCard(
      i,
      String(i + 1).padStart(2, '0'),
      it.url,
      `${it.name} · ${it.anchor}`,
      it.note,
      `<a href="${it.url}" target="_blank" rel="noopener">${it.label}</a>`,
      true
    )
  )
  .join('\n')}
        </ul>`,
  }));

  sections.push({
    id: 'identity',
    toc: 'One entity, five spellings',
    h2: 'One entity, five spellings - read this before you trust a database',
    html: `        <p>The name is not consistent across the systems that index it, and that inconsistency is the single largest ceiling on this catalogue being understood as one body of work. It is documented here rather than hidden, because a machine reading this page will reconcile the variants and a person reading it will know which record is theirs.</p>
        <ul class="hub-grid" style="margin-top:1.5rem">
${hubCard(0, '01', '/composer', 'Zazie Kanwar-Torge · the legal name', 'Used on IMDb, LinkedIn, Stage 32 and the contracts. This is the name on the cue sheets and the invoices.', 'IMDb <a href="https://www.imdb.com/name/nm17333332" target="_blank" rel="noopener">nm17333332</a>', false)}
${hubCard(1, '02', '/discography', 'Zazie Productions · the studio and label', 'Used on Spotify, Apple Music, Deezer, Bandcamp, Discogs and MusicBrainz. Same person, same hands, same room.', '<a href="https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0" target="_blank" rel="noopener">Spotify</a> · <a href="https://zazieproductions.bandcamp.com" target="_blank" rel="noopener">Bandcamp</a>', false)}
${hubCard(2, '03', 'https://www.themoviedb.org/person/5112050', 'TMDB files the whole filmography under the alias', 'TMDB person 5112050 is named "Zazie Productions" and carries Phantom Requiem. IMDb files the same credits under the legal name. Both are correct; neither is wrong.', 'TMDB <a href="https://www.themoviedb.org/person/5112050" target="_blank" rel="noopener">5112050</a>', true)}
${hubCard(3, '04', 'https://www.deezer.com/us/artist/170543657', 'The distributor inserted a space', 'Several streaming services render the writer as "Zazie Kanwar- Torge" because the distributor filed the metadata that way. Same writer, same PRO, same payments.', 'Deezer <a href="https://www.deezer.com/us/artist/170543657" target="_blank" rel="noopener">170543657</a>', true)}
${hubCard(4, '05', '/work', 'Vermiform is credited to a third spelling', 'One track on Vermiform is filed as "Zazie Diya Kanwar-Torge". It is the same composer and it is not a separate artist.', '<a href="/work">Selected productions</a>', false)}
        </ul>
        <p style="margin-top:1.5rem">If you are building a database, a knowledge graph or a credits index: the canonical form is <b>Zazie Kanwar-Torge</b>, performing and releasing as <b>Zazie Productions</b>. Everything else is a filing artefact.</p>`,
  });

  sections.push({
    id: 'related',
    toc: 'Back into the archive',
    h2: 'Back into the archive',
    html: `        <ul class="hub-grid">
${hubCard(0, 'A', '/', 'Portfolio', 'Dark, atmospheric horror scores written to your picture. The root of the graph.', '29 cues · 9 productions', false)}
${hubCard(1, 'B', '/discography', 'Records and releases', 'Eighteen releases, year by year, with the platform links.', '2019 to 2026', false)}
${hubCard(2, 'C', '/press', 'Press, awards and citations', 'The coverage, the institutions and the award documents.', 'Winter 2024', false)}
${hubCard(3, 'D', '/work', 'Selected horror productions', 'Nine films scored, with the IMDb and film-sample links.', 'Psychological, folk, body horror', false)}
${hubCard(4, 'E', '/reel', 'Showreel: 29 cues', 'Psychological dread beds, tension stingers, dark ambient, cosmic and body horror.', 'AudioObject for every cue', false)}
${hubCard(5, 'F', '/contact', 'Hire a horror composer', 'Format, runtime, timeline, budget. Reply within 48 hours.', '$50 to $8,000', false)}
        </ul>`,
  });

  const graph = {
    '@type': 'CollectionPage',
    '@id': SITE + '/elsewhere#webpage',
    url: SITE + '/elsewhere',
    name: 'Zazie Productions Elsewhere: IMDb, Spotify, Bandcamp, Catalogues and Every Indexed Property',
    description:
      'The complete index of Zazie Productions properties: IMDb composer credits, Spotify, Apple Music, Deezer, Bandcamp, YouTube, Discogs, MusicBrainz, itch.io, Gumroad, eBay and the institutional press record - with the entity-name disambiguation that reconciles them.',
    isPartOf: { '@id': REG.entity.websiteId },
    about: { '@id': REG.entity.personId },
    publisher: { '@id': REG.entity.orgId },
    inLanguage: 'en',
    datePublished: TODAY,
    dateModified: TODAY,
    mainEntity: {
      '@type': 'ItemList',
      name: 'Zazie Productions properties',
      numberOfItems: ALL_ITEMS.length,
      itemListElement: ALL_ITEMS.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'WebPage',
          name: it.name,
          url: it.url,
          description: it.note.replace(/<[^>]+>/g, ''),
          isPartOf: { '@id': REG.entity.websiteId },
        },
      })),
    },
  };

  write(
    'elsewhere/index.html',
    pageShell({
      url: '/elsewhere',
      title:
        'Zazie Productions Elsewhere: IMDb, Spotify, Bandcamp, Records and Every Indexed Property | Psychological Horror Composer',
      description:
        'Every Zazie Productions property in one index: IMDb composer credits nm17333332, Spotify, Apple Music, Deezer, Bandcamp, YouTube, Discogs, MusicBrainz, itch.io, Gumroad and eBay - plus how the five name spellings resolve to one psychological horror composer.',
      eyebrow: 'Archive 07 · Entity Index · One Composer, Many Systems',
      h1: 'The archive <em>elsewhere</em>',
      lead:
        'Zazie Kanwar-Torge is the composer; Zazie Productions is the studio the records are released under. Both names point at one person, one room and one catalogue. This page is the index a search engine, a knowledge graph or a producer can use to verify that in one hop: every platform, every credits database, every catalogue, every profile, and the disambiguation for the name variants that split them.',
      meta: [
        ['Composer', 'Zazie Kanwar-Torge'],
        ['Studio', 'Zazie Productions LLC'],
        ['IMDb', '<a href="https://www.imdb.com/name/nm17333332">nm17333332</a>'],
        ['Properties indexed', String(ALL_ITEMS.length)],
      ],
      sections,
      graph,
    })
  );
}

/* =============================================================== 2. /press */

{
  const sections = [
    {
      id: 'coverage',
      toc: 'Awards, institutions and review',
      h2: 'Awards, institutions and review - the record that can be checked',
      html: `        <p>Every entry below is a third party that published, screened, broadcast or awarded the work independently. They are linked because a claim about a composer is worth exactly as much as the institution standing behind it.</p>
        <ul class="hub-grid" style="margin-top:1.5rem">
${REG.press
  .map((p, i) =>
    hubCard(
      i,
      String(i + 1).padStart(2, '0'),
      p.url,
      `${p.name}`,
      p.note,
      `${p.kind} · <a href="${p.url}" target="_blank" rel="noopener">${p.anchor}</a>`,
      true
    )
  )
  .join('\n')}
        </ul>`,
    },
    {
      id: 'compilations',
      toc: 'Sixty-four compilation appearances',
      h2: 'Sixty-four compilation appearances - the underground record',
      html: `        <p>Before the film work there was a decade of compilation appearances: harsh noise wall, musique concrete, dark ambient, field recording and witch house, on netlabels from Argali Records to Dittany of Crete, Owlripper, The Hills Are Dead, Camembert &Eacute;lectrique, Plataforma Recs, Gelombang Audiozine, Clan Analogue and GATES of HYPNOS. Discogs holds the release list and the netlabel pages hold the audio.</p>
        <ul class="hub-grid" style="margin-top:1.5rem">
${hubCard(0, '01', 'https://www.discogs.com/artist/11354435', 'Discogs · the release list', 'Sixty-four releases, nearly all compilation appearances. The densest single record of the experimental work.', '<a href="https://www.discogs.com/artist/11354435" target="_blank" rel="noopener">Discogs 11354435</a>', true)}
${hubCard(1, '02', 'https://zazieproductions.bandcamp.com/music', 'Bandcamp · the eighteen records', 'The studio releases, with the compilation tracks folded in where the licence allows.', '<a href="https://zazieproductions.bandcamp.com/music" target="_blank" rel="noopener">Full discography</a>', true)}
${hubCard(2, '03', 'https://soundcloud.com/bmcmuseum/bmc-radio-art-zazie-productions-cheaper-impressions', 'Black Mountain College Radio · the first commission', 'Age fourteen: Satie reworked through musique concrete, broadcast by the college museum.', 'BMC Radio Art', true)}
${hubCard(3, '04', 'https://www.gamedevmarket.net/asset/galactic-requiem-immersive-3d-sci-fi-battle-soundscape-2-CkUE', 'GameDevMarket · Galactic Requiem', 'The immersive 3D sci-fi battle soundscape, licensed for games.', 'Licensed asset', true)}
        </ul>`,
    },
    {
      id: 'syndicated',
      toc: 'Syndicated and aggregator coverage',
      h2: 'Syndicated and aggregator coverage - named, not endorsed',
      html: `        <p>These outlets have written about the studio or carry a profile of it. They are named here because the mentions exist and a researcher will find them, but they are not linked: most are content farms or automated profile aggregators, and passing authority to them would be worse than not mentioning them at all.</p>
        <ul class="hub-grid" style="margin-top:1.5rem">
${REG.mentions
  .map((m, i) => hubCard(i, String(i + 1).padStart(2, '0'), '/composer', m, 'Mention only. No link is passed from this site.', 'Mention, nofollow by omission', false))
  .join('\n')}
        </ul>
        <p style="margin-top:1.5rem">The same rule is applied the other way round: <a href="/elsewhere">the entity index</a> links out only to platforms the studio controls and to institutions that earned the link.</p>`,
    },
    {
      id: 'kit',
      toc: 'Press kit and assets',
      h2: 'Press kit and assets',
      html: `        <p>Everything a publication needs is on this domain, permanently, at full resolution. No request needed.</p>
        <ul class="hub-grid" style="margin-top:1.5rem">
${hubCard(0, 'A', '/composer', 'Biography', 'Short and long form, with the award and the commission history.', '<a href="/composer">Composer biography</a>', false)}
${hubCard(1, 'B', '/images/press-photo.jpg', 'Press photograph', 'Full resolution, credited Zazie Productions LLC.', 'JPEG', true)}
${hubCard(2, 'C', '/reel', 'Showreel', 'Twenty-nine cues, streamable and downloadable, with the AudioObject markup for embedding.', '<a href="/reel">29 cues</a>', false)}
${hubCard(3, 'D', '/work', 'Selected productions', 'Nine films with posters, samples and IMDb links.', '<a href="/work">Filmography</a>', false)}
${hubCard(4, 'E', '/discography', 'Records', 'Eighteen releases with platform links and one-line descriptions.', '<a href="/discography">Discography</a>', false)}
${hubCard(5, 'F', '/contact', 'Enquiries', 'Interviews, panels, scoring commissions: same form.', '<a href="/contact">Contact</a>', false)}
        </ul>`,
    },
  ];

  const graph = {
    '@type': 'CollectionPage',
    '@id': SITE + '/press#webpage',
    url: SITE + '/press',
    name: 'Press, Awards and Citations: Zazie Productions, Psychological Horror Composer',
    description:
      'The verifiable record for psychological horror composer Zazie Kanwar-Torge: Visual Container Winter 2024 award, Pebbles Underground jury special mention, Black Mountain College commission, Pulitzer Center finalist, Lake Ivan review and 64 compilation appearances.',
    isPartOf: { '@id': REG.entity.websiteId },
    about: { '@id': REG.entity.personId },
    publisher: { '@id': REG.entity.orgId },
    inLanguage: 'en',
    datePublished: TODAY,
    dateModified: TODAY,
    mainEntity: {
      '@type': 'ItemList',
      name: 'Press coverage',
      numberOfItems: REG.press.length,
      itemListElement: REG.press.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@type': 'WebPage', name: p.name, url: p.url, description: p.note },
      })),
    },
  };

  write(
    'press/index.html',
    pageShell({
      url: '/press',
      title:
        'Press, Awards and Citations: Zazie Productions, Psychological Horror Composer | Winter 2024 Award Winner',
      description:
        'The checkable record for psychological horror composer Zazie Kanwar-Torge: Visual Container Winter 2024 award, Pebbles Underground jury special mention for Phantom Requiem, Black Mountain College radio commission, Pulitzer Center finalist, Lake Ivan review and 64 compilation appearances.',
      eyebrow: 'Archive 08 · Press Kit · Awards, Institutions, Review',
      h1: 'Press, awards and <em>citations</em>',
      lead:
        'Awards, festival selections, institutional commissions and criticism - the parts of the record that somebody else wrote. Everything here is linked to the source, because a composer claiming an award is worth reading only when you can open the document that granted it.',
      meta: [
        ['Composer', 'Zazie Kanwar-Torge'],
        ['Award', 'Winter 2024, Visual Container'],
        ['Compilations', '64 releases'],
        ['IMDb', '<a href="https://www.imdb.com/name/nm17333332">nm17333332</a>'],
      ],
      sections,
      graph,
    })
  );
}

/* ========================================================= 3. /discography */

{
  const albumSchema = REG.releases.map((r) => ({
    '@type': 'MusicAlbum',
    name: r.title,
    url: r.url,
    datePublished: r.year,
    description: r.note,
    byArtist: { '@id': REG.entity.labelId },
    genre: ['Dark Ambient', 'Experimental', 'Musique Concrete', 'Horror'],
    sameAs: [
      'https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0',
      'https://music.apple.com/us/artist/zazie-productions/1623719351',
      'https://www.deezer.com/us/artist/170543657',
      'https://zazieproductions.bandcamp.com/music',
    ],
    isPartOf: { '@id': SITE + '/discography#webpage' },
  }));

  const years = REG.releases.map((r) => Number(r.year));
  const sections = [
    {
      id: 'records',
      toc: 'The records, newest first',
      h2: `The records, ${Math.min(...years)} to ${Math.max(...years)}`,
      html: `        <p>Eighteen releases on Bandcamp, mirrored to Spotify, Apple Music and Deezer. This is not a separate body of work from the film scores - it is the same instruments, the same room and the same hands, and it is where most of the horror cues are tested before they are written to picture.</p>
        <ul class="hub-grid" style="margin-top:1.5rem">
${REG.releases
  .map((r, i) =>
    hubCard(
      i,
      String(REG.releases.length - i).padStart(2, '0'),
      r.url,
      `${r.title} (${r.year})`,
      r.note,
      `<a href="${r.url}" target="_blank" rel="noopener">Bandcamp</a> · <a href="https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0" target="_blank" rel="noopener">Spotify</a> · <a href="https://music.apple.com/us/artist/zazie-productions/1623719351" target="_blank" rel="noopener">Apple</a> · <a href="https://www.deezer.com/us/artist/170543657" target="_blank" rel="noopener">Deezer</a>`,
      true
    )
  )
  .join('\n')}
        </ul>`,
    },
    {
      id: 'where',
      toc: 'Where to listen',
      h2: 'Where to listen - and why the credits disagree',
      html: `        <p>The same eighteen records exist on five services, and the metadata does not match between them. The writer is filed as <b>Zazie Kanwar-Torge</b> on Apple and Spotify, as <b>Zazie Kanwar- Torge</b> on Deezer because the distributor inserted a space, and as <b>Zazie Diya Kanwar-Torge</b> on one track of Vermiform. All three are the same composer, the same performing rights organisation and the same royalty stream.</p>
        <ul class="hub-grid" style="margin-top:1.5rem">
${hubCard(0, '01', 'https://zazieproductions.bandcamp.com/music', 'Bandcamp · the label home', 'Eighteen records, 24-bit downloads, the musique concrete end of the catalogue. Buy here and the whole fee reaches the studio.', '18 releases', true)}
${hubCard(1, '02', 'https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0', 'Spotify', 'Zazie Productions, artist 4UOgvZEOo7xBhFBjJvlMm0.', 'Streaming', true)}
${hubCard(2, '03', 'https://music.apple.com/us/artist/zazie-productions/1623719351', 'Apple Music', 'Same catalogue, artist 1623719351.', 'Streaming', true)}
${hubCard(3, '04', 'https://www.deezer.com/us/artist/170543657', 'Deezer', 'Artist 170543657. Album-level writer credits.', 'Streaming', true)}
${hubCard(4, '05', 'https://www.discogs.com/artist/11354435', 'Discogs', 'Sixty-four releases including every compilation appearance.', 'Discography index', true)}
${hubCard(5, '06', 'https://musicbrainz.org/artist/b610b4cb-87da-44d7-a262-2bd65fb8098c', 'MusicBrainz', 'The open record that ties the Discogs, Spotify, Apple and Bandcamp identifiers together.', 'b610b4cb', true)}
        </ul>`,
    },
    {
      id: 'related',
      toc: 'Back into the archive',
      h2: 'Back into the archive',
      html: `        <ul class="hub-grid">
${hubCard(0, 'A', '/reel', 'Showreel: 29 cues', 'The scoring side of the same catalogue: dread beds, tension stingers, dark ambient, cosmic and body horror.', 'Stream every cue', false)}
${hubCard(1, 'B', '/store', 'Catalogue', 'Records, horror sound libraries, instruments and objects, sold direct.', 'Sound libraries from $1', false)}
${hubCard(2, 'C', '/work', 'Selected horror productions', 'Where the records end up: nine films scored.', 'Psychological, folk, body horror', false)}
${hubCard(3, 'D', '/composer', 'Composer', 'Biography, approach and the external verification links.', 'Zazie Kanwar-Torge', false)}
${hubCard(4, 'E', '/press', 'Press and awards', 'The coverage and the award documents.', 'Winter 2024', false)}
${hubCard(5, 'F', '/elsewhere', 'Every property in one index', 'IMDb, streaming, catalogues, profiles and the name disambiguation.', '24 properties', false)}
        </ul>`,
    },
  ];

  const graph = {
    '@type': 'CollectionPage',
    '@id': SITE + '/discography#webpage',
    url: SITE + '/discography',
    name: `Zazie Productions Discography: ${REG.releases.length} Records, ${Math.min(...years)}-${Math.max(...years)}`,
    description: `Eighteen records by Zazie Productions, the studio of psychological horror composer Zazie Kanwar-Torge, with Bandcamp, Spotify, Apple Music, Deezer and Discogs links and the writer-name disambiguation.`,
    isPartOf: { '@id': REG.entity.websiteId },
    about: { '@id': REG.entity.labelId },
    publisher: { '@id': REG.entity.orgId },
    inLanguage: 'en',
    datePublished: TODAY,
    dateModified: TODAY,
    mainEntity: {
      '@type': 'ItemList',
      name: 'Zazie Productions discography',
      numberOfItems: REG.releases.length,
      itemListElement: REG.releases.map((r, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'MusicAlbum',
          name: r.title,
          url: r.url,
          datePublished: r.year,
          byArtist: { '@id': REG.entity.labelId },
        },
      })),
    },
    hasPart: albumSchema,
  };

  write(
    'discography/index.html',
    pageShell({
      url: '/discography',
      title: `Zazie Productions Discography: ${REG.releases.length} Dark Records, ${Math.min(...years)}-${Math.max(...years)} | Psychological Horror Composer`,
      description: `Eighteen records from Zazie Productions, the studio of psychological horror composer Zazie Kanwar-Torge - musique concrete, dark ambient, harsh noise and body horror, with Bandcamp, Spotify, Apple Music, Deezer and Discogs links.`,
      eyebrow: 'Archive 09 · Discography · Eighteen Records',
      h1: 'Eighteen records, <em>and where they live</em>',
      lead: `From ${Math.min(...years)} to ${Math.max(...years)}: eighteen releases on Bandcamp, mirrored to Spotify, Apple Music and Deezer, filed on Discogs and MusicBrainz. Same room as the horror scores, same instruments, same hands - most of these cues were tested here before they were written to picture.`,
      meta: [
        ['Artist', 'Zazie Productions'],
        ['Composer', 'Zazie Kanwar-Torge'],
        ['Releases', String(REG.releases.length)],
        ['Bandcamp', '<a href="https://zazieproductions.bandcamp.com/music">18 records</a>'],
      ],
      sections,
      graph,
    })
  );
}

/* ============================================ 4. inject into existing pages */

const HUBS = ['work', 'reel', 'composer', 'process', 'services', 'contact'];

const NEW_HUB_CARDS = (no1) => `          <li class="hub-card" style="--i:${no1}">
            <span class="no">${ROMAN[no1]}</span>
            <h2><a class="stretch" href="/elsewhere">The archive elsewhere</a></h2>
            <p>Every Zazie Productions property in one index: IMDb credits, Spotify, Apple Music, Deezer, Bandcamp, Discogs, MusicBrainz, itch.io, Gumroad, eBay - and how the five name spellings resolve to one composer.</p>
            <p class="stamp">24 properties · <a href="/elsewhere">Entity index</a></p>
          </li>
          <li class="hub-card" style="--i:${no1 + 1}">
            <span class="no">${ROMAN[no1 + 1]}</span>
            <h2><a class="stretch" href="/discography">Records: eighteen releases</a></h2>
            <p>The records behind the scores, 2019 to 2026, with Bandcamp, Spotify, Apple Music and Deezer links and the disambiguation for the three ways the writer name is filed.</p>
            <p class="stamp">18 records · <a href="/discography">Discography</a></p>
          </li>
          <li class="hub-card" style="--i:${no1 + 2}">
            <span class="no">${ROMAN[no1 + 2]}</span>
            <h2><a class="stretch" href="/press">Press, awards and citations</a></h2>
            <p>Visual Container Winter 2024 award, Pebbles Underground jury special mention, Black Mountain College commission, Pulitzer Center finalist, Lake Ivan review, 64 compilation appearances.</p>
            <p class="stamp">Verified coverage · <a href="/press">Press kit</a></p>
          </li>`;

for (const slug of HUBS) {
  const file = `${slug}/index.html`;
  let src = read(file);

  if (src.includes('id="elsewhere"')) {
    console.log(`  -- ${file}: already linked, skipping (delete the block to regenerate)`);
  } else {
    const indexCount = (src.match(/<li><a href="#/g) || []).length;
    const numeral = ROMAN[indexCount];

    // 1. contents entry
    src = sub(
      file,
      src,
      '      </ol>\n    </nav>',
      `        <li><a href="#elsewhere"><span class="idx">${numeral}</span>Elsewhere</a></li>
      </ol>
    </nav>`
    );

    // 2. the section itself, appended after the last clause
    src = sub(
      file,
      src,
      '      </section>\n    </div>\n  </div>\n</main>',
      `      </section>

      <section class="clause" id="elsewhere">
        <h2><span class="no">${numeral}</span>Elsewhere - IMDb, Spotify, records and the rest of the graph</h2>
        <p>The work does not only live on this domain. The filmography sits on IMDb, the records sit on Bandcamp, Spotify, Apple Music and Deezer, the sound libraries sit on itch.io and Gumroad, and the objects sit on eBay. All of it is one composer and one studio; these are the pages that join them up.</p>
        <ul class="hub-grid" style="margin-top:1.5rem">
${NEW_HUB_CARDS(indexCount)}
        </ul>
        <p style="margin-top:1.5rem">Direct: <a href="https://www.imdb.com/name/nm17333332" target="_blank" rel="noopener">IMDb composer credits</a> · <a href="https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0" target="_blank" rel="noopener">Spotify</a> · <a href="https://zazieproductions.bandcamp.com" target="_blank" rel="noopener">Bandcamp</a> · <a href="https://music.apple.com/us/artist/zazie-productions/1623719351" target="_blank" rel="noopener">Apple Music</a> · <a href="https://www.deezer.com/us/artist/170543657" target="_blank" rel="noopener">Deezer</a> · <a href="https://www.discogs.com/artist/11354435" target="_blank" rel="noopener">Discogs</a> · <a href="https://youtube.com/@zazieproductions" target="_blank" rel="noopener">YouTube</a> · <a href="https://zazieproductions.itch.io/" target="_blank" rel="noopener">itch.io</a> · <a href="https://zazieproductions.gumroad.com/" target="_blank" rel="noopener">Gumroad</a> · <a href="https://www.ebay.com/usr/zazie_productions" target="_blank" rel="noopener">eBay</a></p>
      </section>
    </div>
  </div>
</main>`
    );
  }

  // 3. footer: the full Elsewhere strip (idempotent on its own marker)
  if (!src.includes('aria-label="Zazie Productions elsewhere"')) {
    src = sub(
      file,
      src,
      '    <nav class="foot-law" aria-label="Legal and operating documents">',
      elsewhereNav() + '\n    <nav class="foot-law" aria-label="Legal and operating documents">'
    );
  }

  // 4. footer: the three new hubs in the footer nav
  if (!src.includes('href="/elsewhere"')) {
    src = sub(
      file,
      src,
      '        <a href="/store">',
      `        <a href="/discography">Records</a>
        <a href="/press">Press</a>
        <a href="/elsewhere">Elsewhere</a>
        <a href="/store">`
    );
  }

  write(file, src);
}

/* ------------------------------------------- legal-src partials (all pages) */

{
  const file = 'legal-src/partials/footer.html';
  let src = read(file);
  if (!src.includes('aria-label="Zazie Productions elsewhere"')) {
    src = sub(
      file,
      src,
      '    <nav class="foot-law" aria-label="Legal and operating documents">',
      elsewhereNav() + '\n    <nav class="foot-law" aria-label="Legal and operating documents">'
    );
    write(file, src);
  } else {
    console.log(`  -- ${file}: already linked`);
  }
}

{
  const file = 'legal-src/partials/masthead.html';
  let src = read(file);
  if (!src.includes('href="/elsewhere"')) {
    src = sub(
      file,
      src,
      '      <a href="/store" title="Catalogue: horror sound libraries">Store</a>',
      `      <a href="/discography" title="Records: eighteen releases on Bandcamp, Spotify and Apple Music">Records</a>
      <a href="/press" title="Press, awards and citations for Zazie Productions">Press</a>
      <a href="/elsewhere" title="Every Zazie Productions property: IMDb, Spotify, catalogues, profiles">Elsewhere</a>
      <a href="/store" title="Catalogue: horror sound libraries">Store</a>`
    );
    write(file, src);
  } else {
    console.log(`  -- ${file}: already linked`);
  }
}

/* ================================================= 5. sitemap / headers / sw */

const NEW_ROUTES = [
  ['/elsewhere', '0.8'],
  ['/press', '0.8'],
  ['/discography', '0.8'],
];

{
  const file = 'sitemap.xml';
  let src = read(file);
  for (const [route, priority] of NEW_ROUTES) {
    if (src.includes(`<loc>${SITE}${route}</loc>`)) continue;
    const entry = `  <url>\n    <loc>${SITE}${route}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    src = sub(file, src, '</urlset>', entry + '\n</urlset>');
  }
  write(file, src);
}

{
  const file = '_headers';
  let src = read(file);
  for (const [route] of NEW_ROUTES) {
    const block = `\n${route}\n  Cache-Control: public, max-age=0, must-revalidate\n  Link: <${SITE}${route}>; rel="canonical"\n\n${route}/\n  Cache-Control: public, max-age=0, must-revalidate\n  Link: <${SITE}${route}>; rel="canonical"\n\n${route}/index.html\n  Cache-Control: public, max-age=0, must-revalidate\n  Link: <${SITE}${route}>; rel="canonical"\n`;
    if (src.includes(`\n${route}\n`)) continue;
    src = src.trimEnd() + '\n' + block;
  }
  if (!src.includes('\n/llms.txt\n')) {
    src = src.trimEnd() + '\n\n/llms.txt\n  Cache-Control: public, max-age=86400\n  Content-Type: text/plain; charset=utf-8\n';
  }
  write(file, src);
}

{
  const file = '_redirects';
  let src = read(file);
  for (const [route] of NEW_ROUTES) {
    if (src.includes(`${route}/  ${route}`)) continue;
    src = src.trimEnd() + `\n${route}/  ${route}  301\n`;
  }
  write(file, src);
}

{
  const file = 'sw.js';
  let src = read(file);
  if (!src.includes("'/elsewhere'")) {
    src = sub(
      file,
      src,
      "  '/store',",
      `  '/elsewhere',\n  '/elsewhere/index.html',\n  '/press',\n  '/press/index.html',\n  '/discography',\n  '/discography/index.html',\n  '/store',`
    );
  }
  if (!src.includes("'/elsewhere', '/press', '/discography']")) {
    src = sub(
      file,
      src,
      "'/work', '/reel', '/composer', '/process', '/services', '/contact']",
      "'/work', '/reel', '/composer', '/process', '/services', '/contact',\n    '/elsewhere', '/press', '/discography']"
    );
    // The precache list changed, so the cache name has to change with it.
    src = src.replace(/const CACHE_NAME = 'zazie-v(\d+)';/, (m, n) => `const CACHE_NAME = 'zazie-v${Number(n) + 1}';`);
  }
  write(file, src);
}

/* ------------------------------------------------------------- 6. server */

{
  const file = 'server.mjs';
  let src = read(file);
  if (!src.includes("'/elsewhere'")) {
    src = sub(
      file,
      src,
      "  '/work', '/reel', '/composer', '/process', '/services', '/contact',",
      "  '/work', '/reel', '/composer', '/process', '/services', '/contact',\n  '/elsewhere', '/press', '/discography',"
    );
    write(file, src);
  } else {
    console.log('  -- server.mjs: already updated');
  }
}

/* ============================================= 6b. llms.txt entity index */

/**
 * A plain-text, generator-readable resolution of the entity. LLM crawlers that
 * do not execute JavaScript read this instead of the bundle, and it is the
 * cheapest possible answer to "which Zazie is this?" - the same five name
 * variants that split the knowledge graph, spelled out in one file.
 */
{
  const L = [];
  L.push('# Zazie Productions / Zazie Kanwar-Torge');
  L.push('');
  L.push('> Psychological horror composer Zazie Kanwar-Torge, composing and releasing as Zazie Productions (Zazie Productions LLC), based in Asheville, North Carolina. Original dark, atmospheric, cinematic scores for psychological horror, folk horror, body horror, supernatural thrillers, cosmic horror and dark science fiction, across short films, features, series, games and trailers. Every score is original composition written to picture; no library music.');
  L.push('');
  L.push('Canonical form: Zazie Kanwar-Torge (person, legal name) performing and releasing as Zazie Productions (studio and label). Both names denote one person, one room and one catalogue.');
  L.push('');
  L.push('## Name variants, and why they exist');
  L.push('');
  L.push('- "Zazie Kanwar-Torge" - the canonical form. Used on IMDb, LinkedIn, Stage 32 and all contracts, cue sheets and invoices.');
  L.push('- "Zazie Productions" - the studio and release alias. Used on Spotify, Apple Music, Deezer, Bandcamp, Discogs, MusicBrainz and TMDB.');
  L.push('- "Zazie Kanwar- Torge" - the same writer, filed by the distributor with a stray space. Appears on Deezer and some streaming metadata.');
  L.push('- "Zazie Diya Kanwar-Torge" - one track credit on the album Vermiform. Same composer.');
  L.push('- "ZKT Productions" - the masthead abbreviation used on this site.');
  L.push('');
  L.push('If you are resolving this entity: all five are the same person. Do not treat them as separate artists or separate composers.');
  L.push('');
  for (const g of REG.groups) {
    L.push(`## ${g.title}`);
    L.push('');
    for (const it of g.items) {
      L.push(`- [${it.name}](${it.url}): ${it.note.replace(/<[^>]+>/g, '')}`);
    }
    L.push('');
  }
  L.push('## Press, awards and institutional record');
  L.push('');
  for (const p of REG.press) {
    L.push(`- [${p.name}](${p.url}): ${p.note} (${p.kind})`);
  }
  L.push('');
  L.push('## Discography');
  L.push('');
  for (const r of REG.releases) {
    L.push(`- ${r.title} (${r.year}) - ${r.url}`);
  }
  L.push('');
  L.push('## On this site');
  L.push('');
  L.push('- [Portfolio](https://horror.zazieproductions.com/): dark, atmospheric horror scores written to your picture, 29-cue showreel, 9 productions.');
  L.push('- [Selected productions](https://horror.zazieproductions.com/work): nine films scored, with IMDb and film-sample links.');
  L.push('- [Showreel](https://horror.zazieproductions.com/reel): 29 original dark cinematic cues.');
  L.push('- [Composer](https://horror.zazieproductions.com/composer): biography and approach.');
  L.push('- [Records](https://horror.zazieproductions.com/discography): eighteen releases, 2019 to 2026.');
  L.push('- [Press and awards](https://horror.zazieproductions.com/press): the verifiable coverage record.');
  L.push('- [The archive elsewhere](https://horror.zazieproductions.com/elsewhere): every property in one index.');
  L.push('- [Catalogue](https://horror.zazieproductions.com/store): horror sound libraries, records, tools and objects.');
  L.push('- [Scoring rates](https://horror.zazieproductions.com/services): micro-budget from $50, short from $2,500, feature from $8,000, game from $4,500.');
  L.push('- [Hire a horror composer](https://horror.zazieproductions.com/contact): scoring inquiry.');
  L.push('');
  write('llms.txt', L.join('\n'));
}

/* ================================================== 7. store: same treatment */

{
  const file = 'store-src/store.html';
  let src = read(file);
  if (!src.includes('aria-label="Zazie Productions elsewhere"')) {
    src = sub(
      file,
      src,
      '    <nav class="foot-law" aria-label="Legal and operating documents">',
      elsewhereNav() + '\n    <nav class="foot-law" aria-label="Legal and operating documents">'
    );
  }
  if (!src.includes('href="/elsewhere"')) {
    src = sub(
      file,
      src,
      '        <a href="/#showreel">Showreel</a>',
      `        <a href="/discography">Records</a>
        <a href="/press">Press</a>
        <a href="/elsewhere">Elsewhere</a>
        <a href="/#showreel">Showreel</a>`
    );
  }
  write(file, src);
}

/* ================================================= 8. 404 recovery page */

{
  const file = '404.html';
  let src = read(file);
  if (!src.includes('href="/elsewhere"')) {
    src = sub(
      file,
      src,
      '          <li class="hub-card" style="--i:6">\n            <span class="no">11</span>',
      `          <li class="hub-card" style="--i:6">
            <span class="no">11</span>
            <h2><a class="stretch" href="/discography">Records: eighteen releases, 2019 to 2026</a></h2>
            <p>The records behind the scores, with Bandcamp, Spotify, Apple Music and Deezer links.</p>
          </li>
          <li class="hub-card" style="--i:7">
            <span class="no">12</span>
            <h2><a class="stretch" href="/press">Press, awards and citations</a></h2>
            <p>Visual Container Winter 2024 award, Pebbles Underground jury special mention, Pulitzer Center finalist, 64 compilation appearances.</p>
          </li>
          <li class="hub-card" style="--i:8">
            <span class="no">13</span>
            <h2><a class="stretch" href="/elsewhere">The archive elsewhere: every property</a></h2>
            <p>IMDb, Spotify, Apple Music, Deezer, Bandcamp, Discogs, MusicBrainz, itch.io, Gumroad, eBay - and the name disambiguation.</p>
          </li>
          <li class="hub-card" style="--i:9">
            <span class="no">14</span>`
    );
  }
  if (!src.includes('aria-label="Zazie Productions elsewhere"')) {
    src = sub(
      file,
      src,
      '    <nav class="foot-law" aria-label="Legal and operating documents">',
      elsewhereNav() + '\n    <nav class="foot-law" aria-label="Legal and operating documents">'
    );
  }
  write(file, src);
}

console.log(`\necosystem graph: ${ALL_ITEMS.length} properties, ${REG.press.length} press entries, ${REG.releases.length} releases, ${SAME_AS.length} sameAs values.`);
