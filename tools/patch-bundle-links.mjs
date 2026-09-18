#!/usr/bin/env node
/**
 * patch-bundle-links.mjs
 * -----------------------------------------------------------------------------
 * The homepage is prerendered React. Anything added to the visible DOM inside
 * <div id="root"> is destroyed the moment the bundle mounts, so the only place
 * a lasting change to the rendered homepage can live is the bundle itself -
 * plus the prerendered copy that JS-less crawlers (most LLM crawlers included)
 * read instead.
 *
 * This script patches both, from the same registry:
 *
 *   1. It.links          - the config object the Footer maps over, so every
 *                          property appears as a real outbound link.
 *   2. Footer.tsx render - a contextual "archive elsewhere" block: a sentence
 *                          of co-occurrence copy with keyword-rich anchors,
 *                          plus the full property strip with title attributes.
 *   3. index.html        - the prerendered twin of that block.
 *
 * The bundle is content-hashed and served immutable for a year, so the file is
 * rehashed, the reference in index.html is rewritten, the service worker
 * precache entry follows it, and the old bundle is deleted.
 *
 *   node tools/patch-bundle-links.mjs
 *
 * Idempotent: sentinel-guarded, safe to re-run.
 * -----------------------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const hash8 = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);

/* -------------------------------------------------------------- the registry */

/**
 * key: the It.links key. `imdb` is load-bearing - PosterWall.tsx falls back to
 * It.links.imdb for films with no IMDb id and no YouTube id. The others are
 * only read by the Footer's Object.entries map, so they are free.
 * label: rendered anchor text (uppercased by CSS in the strip, verbatim in the
 * sentence). title: the tooltip - also the richest anchor context a crawler
 * gets without a visible body change.
 */
const LINKS = [
  ['imdb', 'https://www.imdb.com/name/nm17333332', 'IMDb', 'Zazie Kanwar-Torge on IMDb: composer and sound department, eight title credits'],
  ['spotify', 'https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0', 'Spotify', 'Zazie Productions on Spotify: eighteen records, dark ambient and experimental'],
  ['apple', 'https://music.apple.com/us/artist/zazie-productions/1623719351', 'Apple Music', 'Zazie Productions on Apple Music, artist 1623719351'],
  ['deezer', 'https://www.deezer.com/us/artist/170543657', 'Deezer', 'Zazie Productions on Deezer, artist 170543657'],
  ['bandcamp', 'https://zazieproductions.bandcamp.com', 'Bandcamp', 'Zazie Productions on Bandcamp: the label home, eighteen records'],
  ['youtube', 'https://youtube.com/@zazieproductions', 'YouTube', 'Zazie Productions on YouTube: horror scores in context'],
  ['discogs', 'https://www.discogs.com/artist/11354435', 'Discogs', 'Zazie Productions on Discogs: sixty-four releases, mostly compilation appearances'],
  ['musicbrainz', 'https://musicbrainz.org/artist/b610b4cb-87da-44d7-a262-2bd65fb8098c', 'MusicBrainz', 'Zazie Productions on MusicBrainz'],
  ['tmdb', 'https://www.themoviedb.org/person/5112050', 'TMDB', 'Zazie Productions on TMDB: Phantom Requiem'],
  ['itch', 'https://zazieproductions.itch.io/', 'itch.io', 'Horror game audio, body horror SFX and sound libraries on itch.io'],
  ['gumroad', 'https://zazieproductions.gumroad.com/', 'Gumroad', 'Plug-in vault, immersive 3D audio and score tools on Gumroad'],
  ['ebay', 'https://www.ebay.com/usr/zazie_productions', 'eBay', 'Instruments, props and objects from the scoring room on eBay'],
  ['linktree', 'https://linktr.ee/zazieproductions', 'Linktree', 'The public link hub for Zazie Productions'],
  ['instagram', 'https://www.instagram.com/zazieproductionsofficial/', 'Instagram', '@zazieproductionsofficial - scores, sessions and instruments'],
  ['linkedin', 'https://www.linkedin.com/in/zazie-kanwar-torge-3b8a98373/', 'LinkedIn', 'Zazie Kanwar-Torge, independent film composer, on LinkedIn'],
  ['github', 'https://github.com/zazieproductions', 'GitHub', 'Zazie Productions on GitHub: instruments, DSP tools and the portfolio source'],
  ['stage32', 'https://www.stage32.com/profile/1164424/about', 'Stage 32', 'Zazie Kanwar-Torge on Stage 32: composer, musician, music supervisor'],
  ['filmfreeway', 'https://filmfreeway.com/ZazieProductions', 'FilmFreeway', 'Zazie Productions on FilmFreeway'],
  ['groover', 'https://groover.co/en/influencer/profile/0.zazie-productions/', 'Groover', 'Zazie Productions curator profile on Groover'],
  ['hackaday', 'https://hackaday.io/ZazieProductions', 'Hackaday.io', 'Zazie Productions on Hackaday.io: modular synthesis and real-time DSP'],
  ['castingcall', 'https://www.castingcall.club/zazieproductions', 'Casting Call Club', 'Zazie Productions on Casting Call Club: voice and audio roles'],
  ['soundclick', 'https://pro.soundclick.com/ZazieProductions', 'SoundClick', 'Zazie Productions on SoundClick'],
  ['muso', 'https://credits.muso.ai/profile/4010f3b7-9a87-4961-8dfd-917de0ba787e', 'Muso.AI', 'Zazie Kanwar-Torge credits index on Muso.AI'],
  ['substack', 'https://substack.com/@zazieproductions', 'Substack', 'Zazie Productions on Substack'],
];

const j = (s) => JSON.stringify(s);

/* ------------------------------------------------------- 1. patch the bundle */

let home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const bundleMatch = /index-[0-9a-f]{8}\.js/.exec(home);
if (!bundleMatch) {
  console.error('!! no index-*.js reference found in index.html');
  process.exit(1);
}
const OLD_BUNDLE = bundleMatch[0];
let bundlePath = path.join(ROOT, OLD_BUNDLE);
let src = fs.readFileSync(bundlePath, 'utf8');

if (src.includes('ZP_ELSEWHERE_LINKS')) {
  console.log('  -- bundle: already patched');
} else {
  /* ---- 1a. It.links: replace the object literal ------------------------- */
  const linksRe = /links:\{bandcamp:"[^"]+",imdb:"[^"]+",spotify:"[^"]+",linkedin:"[^"]+",apple:"[^"]+",youtube:"[^"]+"\}/;
  if (!linksRe.test(src)) {
    console.error('  !! It.links literal not matched - bundle shape changed');
    process.exit(1);
  }
  const newLinks =
    'links:{' +
    LINKS.map(([k, u]) => `${k}:${j(u)}`).join(',') +
    '}';
  src = src.replace(linksRe, newLinks);
  console.log(`  ++ It.links -> ${LINKS.length} properties`);

  /* ---- 1b. label map + strip table, module scope ------------------------ */
  const deck = `const ZP_LINK_LABELS={${LINKS.map(([k, , l]) => `${k}:${j(l)}`).join(',')}},ZP_ELSEWHERE_LINKS=[${LINKS.map(
    ([, u, l, t]) => `[${j(u)},${j(l)},${j(t)}]`
  ).join(',')}];`;

  const fnAnchor = 'function fj(){const e=(new Date).getFullYear();';
  if (!src.includes(fnAnchor)) {
    console.error('  !! Footer function anchor not found');
    process.exit(1);
  }
  src = src.replace(fnAnchor, deck + fnAnchor);
  console.log('  ++ ZP_LINK_LABELS + ZP_ELSEWHERE_LINKS injected');

  /* ---- 1c. Footer: use the label instead of the raw key ----------------- */
  const mapAnchor = 'Object.entries(It.links).map(([e,t])=>u.jsx("a",{href:t,target:"_blank",rel:"noreferrer",className:"text-[10px] uppercase tracking-[0.25em] text-mist transition-colors hover:text-blood","data-source-loc":"src/components/Footer.tsx:38:14",children:e},e))';
  if (!src.includes(mapAnchor)) {
    console.error('  !! Footer Object.entries anchor not found');
    process.exit(1);
  }
  src = src.replace(
    mapAnchor,
    'Object.entries(It.links).map(([e,t])=>u.jsx("a",{href:t,target:"_blank",rel:"noreferrer",className:"text-[10px] uppercase tracking-[0.25em] text-mist transition-colors hover:text-blood","data-source-loc":"src/components/Footer.tsx:38:14",children:ZP_LINK_LABELS[e]||e},e))'
  );
  console.log('  ++ Footer link labels -> readable anchors');

  /* ---- 1d. the Elsewhere block itself ----------------------------------- */
  const L = (key, text) =>
    `u.jsx("a",{href:It.links.${key},target:"_blank",rel:"noreferrer",className:"text-bone underline underline-offset-4 hover:text-blood","data-source-loc":"src/components/Footer.tsx:60:12",children:${j(text)}})`;

  const block =
    'u.jsxs("div",{className:"mt-12 border-t border-white/5 pt-8","data-source-loc":"src/components/Footer.tsx:56:8",children:[' +
    'u.jsx("p",{className:"text-[10px] uppercase tracking-[0.25em] text-mist/60","data-source-loc":"src/components/Footer.tsx:57:10",children:"The archive elsewhere"}),' +
    'u.jsxs("p",{className:"mt-3 max-w-3xl text-[11px] leading-relaxed tracking-wide text-mist/80","data-source-loc":"src/components/Footer.tsx:58:10",children:[' +
    j('Psychological horror composer ') + ',It.composer,' + j(' is credited on ') + ',' +
    L('imdb', 'IMDb') + ',' + j(', releases records as Zazie Productions on ') + ',' +
    L('spotify', 'Spotify') + ',' + j(', ') + ',' +
    L('apple', 'Apple Music') + ',' + j(', ') + ',' +
    L('deezer', 'Deezer') + ',' + j(' and ') + ',' +
    L('bandcamp', 'Bandcamp') + ',' + j(', publishes horror sound libraries on ') + ',' +
    L('itch', 'itch.io') + ',' + j(' and ') + ',' +
    L('gumroad', 'Gumroad') + ',' + j(', and sells the instruments and props out of the scoring room on ') + ',' +
    L('ebay', 'eBay') + ',' + j('. Every property, including the credits databases and the three ways the writer name gets filed, is indexed at ') + ',' +
    'u.jsx("a",{href:"/elsewhere",className:"text-bone underline underline-offset-4 hover:text-blood","data-source-loc":"src/components/Footer.tsx:61:12",children:"the archive elsewhere"}),' +
    'u.jsx("a",{href:"/discography",className:"text-bone underline underline-offset-4 hover:text-blood","data-source-loc":"src/components/Footer.tsx:62:12",children:"eighteen records"}),' +
    j(' and ') + ',' +
    'u.jsx("a",{href:"/press",className:"text-bone underline underline-offset-4 hover:text-blood","data-source-loc":"src/components/Footer.tsx:63:12",children:"the award record"}),' +
    j('.') +
    ']}),' +
    'u.jsxs("nav",{"aria-label":"Zazie Productions elsewhere",className:"mt-5 flex flex-col gap-3 sm:flex-row sm:items-center","data-source-loc":"src/components/Footer.tsx:65:10",children:[' +
    'u.jsx("span",{className:"text-[10px] uppercase tracking-[0.25em] text-mist/60","data-source-loc":"src/components/Footer.tsx:66:12",children:"Elsewhere"}),' +
    'u.jsx("div",{className:"flex flex-wrap gap-x-5 gap-y-3","data-source-loc":"src/components/Footer.tsx:67:12",children:ZP_ELSEWHERE_LINKS.map(([h,l,t])=>u.jsx("a",{href:h,target:"_blank",rel:"noreferrer",title:t,className:"text-[10px] uppercase tracking-[0.25em] text-mist transition-colors hover:text-blood","data-source-loc":"src/components/Footer.tsx:68:14",children:l},h))})' +
    ']})' +
    ']}),';

  const navAnchor = 'u.jsx("nav",{"aria-label":"Legal and operating documents",className:"mt-12 flex flex-col gap-3 border-t border-white/5 pt-6 sm:flex-row sm:items-center"';
  if (!src.includes(navAnchor)) {
    console.error('  !! Footer legal-nav anchor not found');
    process.exit(1);
  }
  src = src.replace(navAnchor, block + navAnchor);
  console.log('  ++ Footer Elsewhere block inserted (sentence + 24-link strip)');

  /* ---- 1d-2. header nav: one more hub --------------------------------- */
  const navRe = /Ix=\[\{href:"#showreel",label:"Reel"\},\{href:"#work",label:"Work"\},\{href:"#services",label:"Rates"\},\{href:"\/store",label:"Store"\}\]/;
  if (src.includes('href:"/elsewhere",label:"Elsewhere"')) {
    console.log('  -- header nav: already extended');
  } else if (!navRe.test(src)) {
    console.error('  !! header nav array not matched');
    process.exit(1);
  } else {
    src = src.replace(
      navRe,
      'Ix=[{href:"#showreel",label:"Reel"},{href:"#work",label:"Work"},{href:"#services",label:"Rates"},{href:"/discography",label:"Records"},{href:"/elsewhere",label:"Elsewhere"},{href:"/store",label:"Store"}]'
    );
    console.log('  ++ header nav -> 6 items (Records, Elsewhere added)');
  }

  /* ---- 1d-3. footer hub links: the three new pages --------------------- */
  const storeAnchor = 'u.jsx("a",{href:"/store",className:"text-[10px] uppercase tracking-[0.25em] text-mist transition-colors hover:text-blood","data-source-loc":"src/components/Footer.tsx:34:12",children:"Store"})';
  if (src.includes('"data-source-loc":"src/components/Footer.tsx:35:12"')) {
    console.log('  -- footer hub links: already extended');
  } else if (!src.includes(storeAnchor)) {
    console.error('  !! footer Store link anchor not found');
    process.exit(1);
  } else {
    const extra = [
      ['/discography', 'Records'],
      ['/press', 'Awards'],
      ['/elsewhere', 'Elsewhere'],
    ]
      .map(
        ([href, label]) =>
          `u.jsx("a",{href:${j(href)},className:"text-[10px] uppercase tracking-[0.25em] text-mist transition-colors hover:text-blood","data-source-loc":"src/components/Footer.tsx:35:12",children:${j(label)}})`
      )
      .join(',');
    src = src.replace(storeAnchor, storeAnchor + ',' + extra);
    console.log('  ++ footer hub links -> Records, Awards, Elsewhere');
  }

  /* ---- 1e. rehash, rewrite, retire ------------------------------------- */
  const buf = Buffer.from(src, 'utf8');
  const NEW_BUNDLE = `index-${hash8(buf)}.js`;
  fs.writeFileSync(path.join(ROOT, NEW_BUNDLE), buf);
  home = home.split(OLD_BUNDLE).join(NEW_BUNDLE);
  console.log(`  ++ ${OLD_BUNDLE} -> ${NEW_BUNDLE} (${buf.length} bytes)`);
  if (NEW_BUNDLE !== OLD_BUNDLE) {
    fs.rmSync(path.join(ROOT, OLD_BUNDLE), { force: true });
    bundlePath = path.join(ROOT, NEW_BUNDLE);
  }

  let sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  sw = sw.replace(`'/${OLD_BUNDLE}'`, `'/${NEW_BUNDLE}'`);
  fs.writeFileSync(path.join(ROOT, 'sw.js'), sw);
  console.log(`  ++ sw.js precache -> /${NEW_BUNDLE}`);
}

/* -------------------------------------------------- 2. prerendered twin block */

const PRERENDER_ANCHOR =
  '    <nav aria-label="Legal and operating documents" class="mt-8 flex flex-col gap-3 border-t border-white/5 pt-6 sm:flex-row sm:items-center">';

if (home.includes('aria-label="Zazie Productions elsewhere"')) {
  console.log('  -- index.html prerendered block: already present');
} else {
  const strip = LINKS.map(
    ([, u, l, t]) =>
      `        <a href="${u}" target="_blank" rel="noreferrer" title="${t.replace(/"/g, '&quot;')}" class="text-[10px] uppercase tracking-[0.25em] text-mist transition-colors hover:text-blood">${l}</a>`
  ).join('\n');

  const block = `    <div class="mt-12 border-t border-white/5 pt-8">
      <p class="text-[10px] uppercase tracking-[0.25em] text-mist/60">The archive elsewhere</p>
      <p class="mt-3 max-w-3xl text-[11px] leading-relaxed tracking-wide text-mist/80">Psychological horror composer <b>Zazie Kanwar-Torge</b> is credited on <a href="https://www.imdb.com/name/nm17333332" target="_blank" rel="noreferrer" class="text-bone underline underline-offset-4 hover:text-blood">IMDb</a>, releases records as Zazie Productions on <a href="https://open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0" target="_blank" rel="noreferrer" class="text-bone underline underline-offset-4 hover:text-blood">Spotify</a>, <a href="https://music.apple.com/us/artist/zazie-productions/1623719351" target="_blank" rel="noreferrer" class="text-bone underline underline-offset-4 hover:text-blood">Apple Music</a>, <a href="https://www.deezer.com/us/artist/170543657" target="_blank" rel="noreferrer" class="text-bone underline underline-offset-4 hover:text-blood">Deezer</a> and <a href="https://zazieproductions.bandcamp.com" target="_blank" rel="noreferrer" class="text-bone underline underline-offset-4 hover:text-blood">Bandcamp</a>, publishes horror sound libraries on <a href="https://zazieproductions.itch.io/" target="_blank" rel="noreferrer" class="text-bone underline underline-offset-4 hover:text-blood">itch.io</a> and <a href="https://zazieproductions.gumroad.com/" target="_blank" rel="noreferrer" class="text-bone underline underline-offset-4 hover:text-blood">Gumroad</a>, and sells the instruments and props out of the scoring room on <a href="https://www.ebay.com/usr/zazie_productions" target="_blank" rel="noreferrer" class="text-bone underline underline-offset-4 hover:text-blood">eBay</a>. Every property, including the credits databases and the three ways the writer name gets filed, is indexed at <a href="/elsewhere" class="text-bone underline underline-offset-4 hover:text-blood">the archive elsewhere</a>, alongside <a href="/discography" class="text-bone underline underline-offset-4 hover:text-blood">eighteen records</a> and <a href="/press" class="text-bone underline underline-offset-4 hover:text-blood">the award record</a>.</p>
      <nav aria-label="Zazie Productions elsewhere" class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <span class="text-[10px] uppercase tracking-[0.25em] text-mist/60">Elsewhere</span>
        <div class="flex flex-wrap gap-x-5 gap-y-3">
${strip}
        </div>
      </nav>
    </div>
`;
  if (!home.includes(PRERENDER_ANCHOR)) {
    console.error('  !! prerendered footer anchor not found');
    process.exit(1);
  }
  home = home.replace(PRERENDER_ANCHOR, block + PRERENDER_ANCHOR);
  console.log('  ++ index.html prerendered Elsewhere block inserted');
}

fs.writeFileSync(path.join(ROOT, 'index.html'), home);
console.log(`\nwrote index.html (${Buffer.byteLength(home)} bytes)`);
