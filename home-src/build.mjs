#!/usr/bin/env node
/**
 * home-src/build.mjs
 * ----------------------------------------------------------------------------
 * The homepage is a prerendered React app. On load, the bundle re-renders the
 * whole of #root, so the static copy in index.html and the strings inside the
 * bundle must change together. This script does both, from one list of pairs.
 *
 *   home-src/bundle.orig.js   pristine copy of the bundle as shipped (sha256
 *                             2afd4ec8…414b). Never edited; always the input.
 *   root index-<hash8>.js     patched bundle, content-hashed. Old copies removed.
 *   root index.html           static copy updated in place (idempotent).
 *   root sw.js                points at the new bundle name.
 *
 * Changes made to the bundle:
 *   1. Copy pairs (hero, bio, services heading, contact copy, budget list).
 *   2. The Services estimator component (`lj`, found with the TypeScript parser)
 *      is replaced by static markup generated from src/data/pricing.ts. Its
 *      live behaviour comes from estimator-<hash>.js, which delegates events on
 *      the document, so it works inside the React island.
 *
 * Every pair must match exactly once in the pristine bundle, or the build
 * fails. In index.html, a pair that is already applied is skipped, so the
 * script can run again without damage.
 *
 *   node home-src/build.mjs        (run after `tsc -p .`, before sync-pricing)
 */

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const here = path.join(root, 'home-src');
const pricing = await import('../build/lib/pricing-markup.js');
const { budgetOptions, budgetSelectOptions, estimatorHtml, packagesHtml, inclusionsHtml } = pricing;
const { MICROBUDGET_STATEMENT } = await import('../build/data/pricing.js');

const BOTH = 'both';
const BUNDLE = 'bundle';
const HTML = 'html';

/** [old, new, targets]. Text is matched exactly; see the header note. */
const PAIRS = [
  // Hero. 2026-10-22 audit: the home title keywords (composer, film, zazie,
  // productions) must appear in the H1, not only in the metadata. The static
  // snapshot maps the original hero line straight to the final H1 (its
  // intermediate rewrite is already applied and would strand the rerun check);
  // the pristine bundle carries the intermediate line, so its pair starts there.
  ['Original music for psychological horror ', 'Horror film, TV and game scores by composer Zazie Kanwar-Torge of Zazie Productions, ', HTML],
  ['Dark, atmospheric horror scores, ', 'Horror film, TV and game scores by composer Zazie Kanwar-Torge of Zazie Productions, ', BUNDLE],
  ['& experimental cinema.', 'written to your picture.', HTML],
  ['Dissonance. Atmosphere. Emotional intensity.', 'Original music for psychological horror, thrillers, and dark sci-fi,', HTML],
  ['Scores composed directly to picture.', 'composed for film, TV, and games.', HTML],
  // 2026-10-22 audit: the homepage used the heading "Phantom Requiem" twice
  // (poster wall + video card). The video card disambiguates; the poster keeps
  // the bare title. One bundle pair (the video-card data object) plus the
  // literal strings it renders into the static snapshot.
  ['{title:"Phantom Requiem",role:"Original Score",yt:"UX2kv3G89Jw"', '{title:"Phantom Requiem (experimental short)",role:"Original Score",yt:"UX2kv3G89Jw"', BUNDLE],
  ['<h3 class="font-display text-xl leading-tight text-bone sm:text-2xl">Phantom Requiem</h3>', '<h3 class="font-display text-xl leading-tight text-bone sm:text-2xl">Phantom Requiem (experimental short)</h3>', HTML],
  ['aria-label="Play Phantom Requiem film sample"', 'aria-label="Play Phantom Requiem (experimental short) film sample"', HTML],
  ['data-title="Phantom Requiem"', 'data-title="Phantom Requiem (experimental short)"', HTML],
  ['alt="Phantom Requiem: still from the film"', 'alt="Phantom Requiem (experimental short): still from the film"', HTML],
  ['aria-label="Open Phantom Requiem on YouTube" title="Open Phantom Requiem on YouTube"', 'aria-label="Open Phantom Requiem (experimental short) on YouTube" title="Open Phantom Requiem (experimental short) on YouTube"', HTML],
  ['Start an inquiry', 'Request a scoring quote', BOTH],
  // User-provided biography; HTML emphasis is shared with the static snapshot.
  ["Zazie Kanwar-Torge is an award-winning composer, experimental producer, and multi-instrumentalist. Under Zazie Productions, he writes and performs original scores for psychological, folk, and body horror, supernatural thrillers, and dark sci-fi.", "<strong>Zazie Kanwar-Torge</strong> is an award-winning film composer, experimental producer, and multi-instrumentalist specializing in <strong>psychological horror, folk horror, body horror, supernatural thrillers, and dark science fiction</strong>. Through Zazie Productions, he creates original film scores and immersive sonic atmospheres that explore dread, dissonance, isolation, and the uncanny.", "bundle"],
  ["His palette combines struck strings, bowed metal, hybrid orchestration, and custom synths, shaped to picture for projects from shorts to features.", "Working at the intersection of cinematic scoring, musique concrète, and electroacoustic composition, his distinctive palette combines bowed metal, struck strings, experimental synthesis, and hybrid orchestration. His work has been featured at <strong>Ars Electronica 2026</strong>, performed in 20.4-channel spatial audio, and selected for international experimental music and film programs, including <strong>MUSLAB/Cero Records</strong> and <strong>EXiS in Seoul</strong>. Previously commissioned by the <strong>Black Mountain College Museum + Arts Center</strong>, he also develops original audio instruments and experimental sound libraries.</p><p>Drawing on a background in experimental film, sound art, and audiovisual composition, Zazie approaches each score as an extension of the film's psychological and emotional world, creating visceral, atmospheric music tailored to independent shorts, feature films, series, and horror video games. Directors, producers, and game developers ready to <a href=\\\"/hire-a-composer\\\" class=\\\"text-bone underline underline-offset-4 hover:text-blood\\\">hire a horror composer</a> can review published packages, verified credits, and the <a href=\\\"/how-to-hire-a-horror-composer\\\" class=\\\"text-bone underline underline-offset-4 hover:text-blood\\\">filmmaker &amp; game-developer hiring guide</a>.", "bundle"],
  ['Drawing on a background in experimental film, sound art, and audiovisual composition, Zazie approaches each score as an extension of the film\'s psychological and emotional world, creating visceral, atmospheric music tailored to independent shorts, feature films, and unconventional genre cinema.', 'Drawing on a background in experimental film, sound art, and audiovisual composition, Zazie approaches each score as an extension of the film\'s psychological and emotional world, creating visceral, atmospheric music tailored to independent shorts, feature films, series, and horror video games. Directors, producers, and game developers ready to <a href="/hire-a-composer" class="text-bone underline underline-offset-4 hover:text-blood">hire a horror composer</a> can review published packages, verified credits, and the <a href="/how-to-hire-a-horror-composer" class="text-bone underline underline-offset-4 hover:text-blood">filmmaker &amp; game-developer hiring guide</a>.', HTML],
  ['<a href="#services" class="px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone">Rates</a><a href="/store"', '<a href="#services" class="px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone">Rates</a><a href="/hire-a-composer" class="px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone">Hire</a><a href="/store"', HTML],
  ['[["/hire-a-composer","Hire a composer"],["/sound-design","Sound design"]', '[["/hire-a-composer","Hire a horror composer"],["/how-to-hire-a-horror-composer","Hiring guide"],["/sound-design","Sound design"]', BUNDLE],
  ['<a href="/hire-a-composer" class="text-[10px] uppercase tracking-[0.25em] text-mist transition-colors hover:text-blood">Hire a composer</a><a href="/sound-design"', '<a href="/hire-a-composer" class="text-[10px] uppercase tracking-[0.25em] text-mist transition-colors hover:text-blood">Hire a horror composer</a><a href="/how-to-hire-a-horror-composer" class="text-[10px] uppercase tracking-[0.25em] text-mist transition-colors hover:text-blood">Hiring guide</a><a href="/sound-design"', HTML],
  ["children:It.bio}", "dangerouslySetInnerHTML:{__html:It.bio}}", "bundle"],
  ["u.jsx(\"p\",{className:\"text-mist leading-relaxed mb-8 text-sm sm:text-base\",\"data-source-loc\":\"src/components/About.tsx:43:1\",children:It.bio2})", "u.jsx(\"div\",{className:\"text-mist leading-relaxed mb-8 text-sm sm:text-base space-y-5\",\"data-source-loc\":\"src/components/About.tsx:43:1\",dangerouslySetInnerHTML:{__html:\"<p>\"+It.bio2+\"</p>\"}})", "bundle"],
  // Services heading
  ['04 · Scope and budget', '04 · Scoring services', BOTH],
  ['Build a scope and estimate', 'Choose a package, then estimate', BOTH],
  ['Choose a project type, scored runtime, complexity, and delivery needs.', 'Packages are priced by scored music minutes, not film length.', BOTH],
  ["Estimates scale with your project's funding.", 'Preliminary estimate — final quotation subject to creative scope and written agreement.', BUNDLE],
  ['Packages are priced by scored music minutes, not film length. Estimates are indicative and nonbinding.', 'Packages are priced by scored music minutes, not film length. Preliminary estimate — final quotation subject to creative scope and written agreement.', HTML],
  // Contact
  ['Share your format, runtime, timeline, and budget.', 'Only your name and email are needed to start. Project details are optional; the form prepares an email for you to review and send.', BUNDLE],
  ['Share your format, scored minutes, timeline, and budget.', 'Only your name and email are needed to start. Project details are optional; the form prepares an email for you to review and send.', HTML],
  // Repair the duplicate sentence present in the latest static homepage snapshot.
  ['Only your name and email are needed to start. Project details are optional; the form prepares an email for you to review and send. The form prepares an email for you to review and send.', 'Only your name and email are needed to start. Project details are optional; the form prepares an email for you to review and send.', HTML],
  ['gu=["Short film","Feature","Series episode","Game / interactive","Installation / art"]', 'gu=["Not sure yet","Short film","Feature","Series episode","Game / interactive","Installation / art"]', BUNDLE],
  ['a1=["Psychological / atmospheric horror","Supernatural dread","Body horror (musical atmosphere)","Folk horror","Techno-thriller","Cosmic dread","Dark drama / thriller","Game adaptive score","Other / hybrid cinematic"]', 'a1=["Not sure yet","Psychological / atmospheric horror","Supernatural dread","Body horror (musical atmosphere)","Folk horror","Techno-thriller","Cosmic dread","Dark drama / thriller","Game adaptive score","Other / hybrid cinematic"]', BUNDLE],
  ['<select class="w-full border border-ash bg-void px-4 py-3 text-sm text-bone outline-none focus:border-blood" aria-label="Theme / tone"><option value="Psychological / atmospheric horror">Psychological / atmospheric horror</option>', '<select class="w-full border border-ash bg-void px-4 py-3 text-sm text-bone outline-none focus:border-blood" aria-label="Theme / tone"><option value="Not sure yet" selected>Not sure yet</option><option value="Psychological / atmospheric horror">Psychological / atmospheric horror</option>', HTML],
  ['<select class="w-full border border-ash bg-void px-4 py-3 text-sm text-bone outline-none focus:border-blood" aria-label="Format"><option value="Short film">Short film</option>', '<select class="w-full border border-ash bg-void px-4 py-3 text-sm text-bone outline-none focus:border-blood" aria-label="Format"><option value="Not sure yet" selected>Not sure yet</option><option value="Short film">Short film</option>', HTML],
  ['I’ll reply within 48 hours.', 'A written quote follows review.', BOTH],
  ['label:"Runtime"', 'label:"Scored minutes (music, not film length)"', BUNDLE],
  ['placeholder:"e.g. 12 min / 90 min"', 'placeholder:"e.g. 3 scored minutes"', BUNDLE],
  ['Runtime: ${v}', 'Scored music: ${v}', BUNDLE],
  ['>Runtime<', '>Scored minutes (music, not film length)<', HTML],
  ['placeholder="e.g. 12 min / 90 min"', 'placeholder="e.g. 3 scored minutes"', HTML],
  ['aria-label="Runtime"', 'aria-label="Scored minutes (music, not film length)"', HTML],
  // Modern image formats (2026-10-22 audit): the hero plate and the eight
  // video-card stills ship AVIF through a <picture>; the JPEG stays as the
  // fallback and keeps every existing attribute, including the onError poster.
  ['u.jsx("img",{src:n.thumb,alt:`${n.title}: still from the film`,width:1280,height:720,className:"absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover/vid:scale-105",loading:"lazy",decoding:"async",onError:function(e){var t=e.currentTarget;if(!t||t.dataset.fb)return;t.dataset.fb="1",t.src="/images/eclipsed-cover-1280.jpg",t.onerror=null}})',
   'u.jsx("picture",{children:[u.jsx("source",{srcSet:n.thumb.replace(/\\.jpg$/,".avif"),type:"image/avif"}),u.jsx("img",{src:n.thumb,alt:`${n.title}: still from the film`,width:1280,height:720,className:"absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover/vid:scale-105",loading:"lazy",decoding:"async",onError:function(e){var t=e.currentTarget;if(!t||t.dataset.fb)return;t.dataset.fb="1",t.src="/images/eclipsed-cover-1280.jpg",t.onerror=null}})]})', BUNDLE],
  ['u.jsx("img",{src:"/images/atmosphere-bg.jpg",alt:"",width:940,height:625,fetchPriority:"high",decoding:"async",className:"absolute inset-0 h-full w-full scale-110 object-cover opacity-40 hero-kenburns","data-source-loc":"src/components/Hero.tsx:35:8"})',
   'u.jsx("picture",{"data-source-loc":"src/components/Hero.tsx:35:8",children:[u.jsx("source",{srcSet:"/images/atmosphere-bg.avif",type:"image/avif"}),u.jsx("img",{src:"/images/atmosphere-bg.jpg",alt:"",width:940,height:625,fetchPriority:"high",decoding:"async",className:"absolute inset-0 h-full w-full scale-110 object-cover opacity-40 hero-kenburns"})]})', BUNDLE],
  // NEW reorders the static <img> attributes so an applied pair cannot match
  // again on a rerun; React normalizes the live DOM either way.
  ['<img alt="" class="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 hero-kenburns" src="/images/atmosphere-bg.jpg" width="940" height="625" fetchpriority="high" decoding="async">',
   '<picture><source srcset="/images/atmosphere-bg.avif" type="image/avif"><img src="/images/atmosphere-bg.jpg" alt="" width="940" height="625" fetchpriority="high" decoding="async" class="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 hero-kenburns"></picture>', HTML],
];

/** The eight video-card stills, wrapped into <picture> in the static snapshot. */
const VIDEO_CLS = 'absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover/vid:scale-105';
for (const [title, w, h, base] of [
  ['Mike Has A Visitor', 320, 180, '/images/project-HaVJP08j77U'],
  ['Eclipsed', 1280, 720, '/images/eclipsed-cover-1280'],
  ['GOODBYE, BROTHER', 1280, 720, '/images/project-ItrrcilS0ro'],
  ['Home Intruder', 1280, 720, '/images/project-riCvy2abhlc'],
  ['The Haunted', 1280, 720, '/images/project-Ty8tPp59mDc'],
  ['AQUAPHOBIA', 1280, 720, '/images/project-rvCGO0BJ_2E'],
  ['Whispers In The Dark', 1280, 720, '/images/project-6qa3Uwj47fc'],
  // The Phantom card alt is rewritten by an earlier pair in PAIRS.
  ['Phantom Requiem (experimental short)', 640, 480, '/images/project-UX2kv3G89Jw'],
]) {
  PAIRS.push([
    `<img alt="${title}: still from the film" width="${w}" height="${h}" class="${VIDEO_CLS}" loading="lazy" decoding="async" src="${base}.jpg">`,
    `<picture><source srcset="${base}.avif" type="image/avif"><img src="${base}.jpg" alt="${title}: still from the film" width="${w}" height="${h}" loading="lazy" decoding="async" class="${VIDEO_CLS}"></picture>`,
    HTML,
  ]);
}

/** Budget options come from the package list; the bundle reads xu[]. */
const BUNDLE_BUDGET_OLD = 'xu=["Under $300","$300 - $500","$500 - $700","$700 - $900","$900+","Flexible / discuss"]';
const BUNDLE_BUDGET_DEFAULT_OLD = 'useState(xu[1])';

const ISLAND_OPEN = '<div class="zp-home-section"><div class="zp-shell">';
const ISLAND_CLOSE = '</div></div>';

/**
 * Markup for the homepage island. The bundle renders the real markup; the
 * static copy in index.html carries sync-pricing marker blocks in the same
 * places, so sync-pricing fills it from pricing.ts and it never drifts.
 */
function islandHtml(staticMarkers = false) {
  const block = (name, render) => (staticMarkers ? `<!--zp:${name}--><!--/zp:${name}-->` : render());
  // The static copy carries a pricing token so sync-pricing keeps it in step;
  // the bundle inlines the same statement from pricing.ts at build time.
  const microbudget = staticMarkers
    ? '<p class="zp-microbudget">{{zp:microbudget}}</p>'
    : `<p class="zp-microbudget">${MICROBUDGET_STATEMENT}</p>`;
  return [
    ISLAND_OPEN,
    '<p class="zp-kicker">Commission packages</p>',
    '<h3 class="zp-sub" style="margin-top:0">Choose by scored music minutes</h3>',
    block('packages', packagesHtml),
    block('inclusions', inclusionsHtml),
    microbudget,
    '<h3 class="zp-sub">Estimate your scope</h3>',
    block('estimator', estimatorHtml),
    ISLAND_CLOSE,
  ].join('');
}

/* ----------------------------------------------------------- bundle patch */

function findTopLevelFunction(source, name) {
  const sf = ts.createSourceFile('bundle.js', source, ts.ScriptTarget.ES2020, true, ts.ScriptKind.JS);
  const hits = sf.statements.filter((s) => ts.isFunctionDeclaration(s) && s.name?.text === name);
  if (hits.length !== 1) throw new Error(`expected exactly one top-level function ${name}, found ${hits.length}`);
  return { start: hits[0].getStart(sf), end: hits[0].getEnd() };
}

function countOf(text, needle) {
  return text.split(needle).length - 1;
}

function patchBundle(orig) {
  let out = orig;
  for (const [oldText, newText, target] of PAIRS) {
    if (target === HTML) continue;
    const n = countOf(out, oldText);
    if (n !== 1) throw new Error(`bundle: "${oldText.slice(0, 60)}" matched ${n} times, expected 1`);
    out = out.replace(oldText, () => newText);
  }
  for (const [oldText, newText] of [[BUNDLE_BUDGET_OLD, `xu=${JSON.stringify(budgetOptions())}`], [BUNDLE_BUDGET_DEFAULT_OLD, 'useState(xu[0])']]) {
    const n = countOf(out, oldText);
    if (n !== 1) throw new Error(`bundle: "${oldText}" matched ${n} times, expected 1`);
    out = out.replace(oldText, () => newText);
  }
  const { start, end } = findTopLevelFunction(out, 'lj');
  const replacement = `function lj(){return u.jsx("div",{className:"zp-home-island","data-zp-island":"estimator",dangerouslySetInnerHTML:{__html:${JSON.stringify(islandHtml(false))}}})}`;
  out = out.slice(0, start) + replacement + out.slice(end);
  return out;
}

/* ------------------------------------------------------ static copy patch */

function patchStatic(html) {
  let out = html;
  const applied = [];
  for (const [oldText, newText, target] of PAIRS) {
    if (target === BUNDLE) continue;
    const n = countOf(out, oldText);
    if (n === 1) {
      out = out.replace(oldText, () => newText);
      applied.push(oldText.slice(0, 40));
    } else if (n === 0 && countOf(out, newText) >= 1) {
      continue; // already applied
    } else {
      throw new Error(`index.html: "${oldText.slice(0, 60)}" matched ${n} times, expected 1`);
    }
  }

  // Services: replace the old React estimator snapshot with the static island.
  // The header paragraph is followed by its wrapper's </div>, then the grid
  // that holds the old "Scope builder". We replace the grid, matched by depth.
  const sectionStart = out.indexOf('<section id="services"');
  const sectionEnd = out.indexOf('</section>', sectionStart);
  if (sectionStart < 0 || sectionEnd < 0) throw new Error('index.html: no #services section');
  if (!out.slice(sectionStart, sectionEnd).includes('zp-home-section')) {
    const header = out.indexOf('Packages are priced by scored music minutes, not film length.', sectionStart);
    if (header < 0) throw new Error('index.html: services header paragraph not found');
    const gridOpen = '<div class="grid gap-5 lg:grid-cols-12 lg:gap-6">';
    const gridStart = out.indexOf(gridOpen, header);
    if (gridStart < 0 || gridStart > sectionEnd) throw new Error('index.html: services grid not found');
    let depth = 0;
    let gridEnd = -1;
    const tag = /<div\b[^>]*>|<\/div>/g;
    tag.lastIndex = gridStart;
    for (let m = tag.exec(out); m; m = tag.exec(out)) {
      depth += m[0].startsWith('</') ? -1 : 1;
      if (depth === 0) { gridEnd = m.index + m[0].length; break; }
    }
    if (gridEnd < 0 || gridEnd > sectionEnd) throw new Error('index.html: services grid did not close inside #services');
    out = out.slice(0, gridStart) + islandHtml(true) + out.slice(gridEnd);
    applied.push(`services grid replaced by island (${gridEnd - gridStart} chars)`);
  }

  // Budget select: option list from the package list.
  const budgetRe = /(<select[^>]*aria-label="Budget">)[\s\S]*?(<\/select>)/;
  if (!budgetRe.test(out)) throw new Error('index.html: budget select not found');
  out = out.replace(budgetRe, (_m, open, close) => `${open}${budgetSelectOptions()}${close}`);

  return { html: out, applied };
}

/** The estimator stylesheet and script used by the homepage island. */
function ensureEstimatorAssets(html) {
  const css = fs.readdirSync(root).find((f) => /^estimator-[0-9a-f]{8}\.css$/.test(f));
  const js = fs.readdirSync(root).find((f) => /^estimator-[0-9a-f]{8}\.js$/.test(f));
  if (!css || !js) throw new Error('estimator assets missing: run node scripts/build-estimator.mjs first');
  let out = html;
  if (!/\/estimator-[0-9a-f]{8}\.css/.test(out)) {
    out = out.replace('</head>', () => `<link href="/${css}" rel="stylesheet"/>\n</head>`);
  }
  if (!/\/estimator-[0-9a-f]{8}\.js/.test(out)) {
    out = out.replace('</body>', () => `<script src="/${js}" defer></script>\n</body>`);
  }
  return out;
}

/* ----------------------------------------------------------------- main */

const orig = fs.readFileSync(path.join(here, 'bundle.orig.js'), 'utf8');
const origHash = crypto.createHash('sha256').update(orig).digest('hex');
if (!origHash.startsWith('2afd4ec8')) throw new Error(`bundle.orig.js is not the shipped bundle (sha256 ${origHash})`);

const patched = patchBundle(orig);

// Regression guard: an under-escaped pair once shipped a bundle no browser
// could parse (HTML attribute quotes inside a bundle string literal need the
// \\\" form in PAIRS). The test suite only evaluates slices of the bundle, so
// the build itself has to parse the whole thing.
try {
  execFileSync(process.execPath, ['--input-type=module', '--check'], {
    input: patched,
    stdio: ['pipe', 'ignore', 'pipe'],
  });
} catch (err) {
  const detail = String(err.stderr ?? '')
    .split('\n')
    .filter((line) => /SyntaxError|Unexpected|Expected/.test(line))
    .join(' | ');
  throw new Error(`patched bundle is not valid JavaScript: ${detail || 'node --check failed'}`);
}

const hash = crypto.createHash('sha256').update(patched).digest('hex').slice(0, 8);
const name = `index-${hash}.js`;

for (const f of fs.readdirSync(root)) {
  if (/^index-[0-9a-f]{8}\.js$/.test(f) && f !== name) fs.rmSync(path.join(root, f));
}
fs.writeFileSync(path.join(root, name), patched, 'utf8');

const indexFile = path.join(root, 'index.html');
const { html, applied } = patchStatic(fs.readFileSync(indexFile, 'utf8'));
let nextHtml = html.replace(/\/?index-[0-9a-f]{8}\.js/g, (m) => (m.startsWith('/') ? `/${name}` : name));
nextHtml = ensureEstimatorAssets(nextHtml);
fs.writeFileSync(indexFile, nextHtml, 'utf8');

const swFile = path.join(root, 'sw.js');
if (fs.existsSync(swFile)) {
  const sw = fs.readFileSync(swFile, 'utf8');
  const nextSw = sw.replace(/\/index-[0-9a-f]{8}\.js/g, `/${name}`);
  if (nextSw !== sw) fs.writeFileSync(swFile, nextSw, 'utf8');
}

console.log(`home-src: wrote ${name} (${patched.length} bytes)`);
console.log(`home-src: index.html updated (${applied.length} static edits)`);
