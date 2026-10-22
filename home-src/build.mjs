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
 *   home-src/home.css/.js    maintained early-player and shared-style sources
 *   home-src/icons.svg       maintained SVG symbol sprite
 *   root index.html           static copy updated in place (idempotent)
 *   root home-<hash8>.*       minified support assets, content-hashed
 *   root home-icons-<hash8>.svg  shared external sprite, content-hashed
 *   root sw.js                points at the current hashed asset names
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

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { transform } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const here = path.join(root, 'home-src');
const pricing = await import('../build/lib/pricing-markup.js');
const { budgetOptions, budgetSelectOptions, estimatorHtml, packagesHtml, inclusionsHtml } = pricing;
const { MICROBUDGET_STATEMENT } = await import('../build/data/pricing.js');

const BOTH = 'both';
const BUNDLE = 'bundle';
const HTML = 'html';

const BIO2 = `His palette mixes bowed metal, struck strings, synths, and orchestral sounds. His work appeared at <strong>Ars Electronica 2026</strong>. It was also presented in 20.4-channel spatial audio. <strong>MUSLAB/Cero Records</strong> and <strong>EXiS in Seoul</strong> have selected his work. The <strong>Black Mountain College Museum + Arts Center</strong> has commissioned him. He also builds audio instruments and sound libraries.</p><p>Zazie has a background in experimental film and sound art. He shapes each score around its story and emotional world. He writes for shorts, features, series, and horror games. Ready to <a href="/hire-a-composer" class="text-bone underline underline-offset-4 hover:text-blood">hire a horror composer</a>? View his packages and verified credits. You can also read the <a href="/how-to-hire-a-horror-composer" class="text-bone underline underline-offset-4 hover:text-blood">guide for filmmakers and game developers</a>.`;

/** [old, new, targets]. Text is matched exactly; see the header note. */
const PAIRS = [
  // Hero
  ['Original music for psychological horror ', 'Dark, atmospheric horror scores, ', HTML],
  ['& experimental cinema.', 'written to your picture.', HTML],
  ['Dissonance. Atmosphere. Emotional intensity.', 'Original music for psychological horror, thrillers, and dark sci-fi.', HTML],
  ['Scores composed directly to picture.', 'Composed for film, TV, and games.', HTML],
  ['Original music for psychological horror, thrillers, and dark sci-fi,', 'Original music for psychological horror, thrillers, and dark sci-fi.', BUNDLE],
  ['composed for film, TV, and games.', 'Composed for film, TV, and games.', BUNDLE],
  ['Start an inquiry', 'Request a scoring quote', BOTH],
  // User-provided biography; HTML emphasis is shared with the static snapshot.
  ["Zazie Kanwar-Torge is an award-winning composer, experimental producer, and multi-instrumentalist. Under Zazie Productions, he writes and performs original scores for psychological, folk, and body horror, supernatural thrillers, and dark sci-fi.", "<strong>Zazie Kanwar-Torge</strong> is an award-winning film composer and producer. He also plays several instruments. At Zazie Productions, he scores <strong>psychological horror, folk horror, body horror, supernatural thrillers, and dark sci-fi</strong>. His music builds dread, tension, and isolation.", "bundle"],
  [`bio2:"His palette combines struck strings, bowed metal, hybrid orchestration, and custom synths, shaped to picture for projects from shorts to features."`, `bio2:${JSON.stringify(BIO2)}`, BUNDLE],
  ['Drawing on a background in experimental film, sound art, and audiovisual composition, Zazie approaches each score as an extension of the film\'s psychological and emotional world, creating visceral, atmospheric music tailored to independent shorts, feature films, and unconventional genre cinema.', 'Zazie has a background in experimental film and sound art. He shapes each score around its story and emotional world. He writes for shorts, features, series, and horror games. Ready to <a href="/hire-a-composer" class="text-bone underline underline-offset-4 hover:text-blood">hire a horror composer</a>? View his packages and verified credits. You can also read the <a href="/how-to-hire-a-horror-composer" class="text-bone underline underline-offset-4 hover:text-blood">guide for filmmakers and game developers</a>.', HTML],
  ['<a href="#services" class="px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone">Rates</a><a href="/store"', '<a href="#services" class="px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone">Rates</a><a href="/hire-a-composer" class="px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone">Hire</a><a href="/store"', HTML],
  ['[["/hire-a-composer","Hire a composer"],["/sound-design","Sound design"]', '[["/hire-a-composer","Hire a horror composer"],["/how-to-hire-a-horror-composer","Hiring guide"],["/sound-design","Sound design"]', BUNDLE],
  ['<a href="/hire-a-composer" class="text-[10px] uppercase tracking-[0.25em] text-mist transition-colors hover:text-blood">Hire a composer</a><a href="/sound-design"', '<a href="/hire-a-composer" class="text-[10px] uppercase tracking-[0.25em] text-mist transition-colors hover:text-blood">Hire a horror composer</a><a href="/how-to-hire-a-horror-composer" class="text-[10px] uppercase tracking-[0.25em] text-mist transition-colors hover:text-blood">Hiring guide</a><a href="/sound-design"', HTML],
  ["children:It.bio}", "dangerouslySetInnerHTML:{__html:It.bio}}", "bundle"],
  ["u.jsx(\"p\",{className:\"text-mist leading-relaxed mb-8 text-sm sm:text-base\",\"data-source-loc\":\"src/components/About.tsx:43:1\",children:It.bio2})", "u.jsx(\"div\",{className:\"text-mist leading-relaxed mb-8 text-sm sm:text-base space-y-5\",\"data-source-loc\":\"src/components/About.tsx:43:1\",dangerouslySetInnerHTML:{__html:\"<p>\"+It.bio2+\"</p>\"}})", "bundle"],
  // Mobile poster wall: a 400w AVIF keeps the 640w file for retina desktop.
  // Phones render the 46vw cells at ~190 CSS px (~380 device px at DPR 2), so
  // the 640w poster was ~2.6x the pixels the slot needed.
  ['srcSet:e.thumbA+" 640w"', 'srcSet:e.thumbA.replace("-640.avif","-400.avif")+" 400w, "+e.thumbA.replace("-640.avif","-480.avif")+" 480w, "+e.thumbA+" 640w"', BUNDLE],
  // Alt text: the poster wall and the hero portrait are content images, not
  // decoration, so they carry the artwork's own name. (The atmosphere plate and
  // the press photo stay alt="" - they are backgrounds behind live copy.)
  ['width:640,height:960,alt:"",className:"h-full w-full object-cover object-top opacity-95', 'width:640,height:960,alt:e.title+" poster artwork",className:"h-full w-full object-cover object-top opacity-95', BUNDLE],
  ['u.jsx("img",{src:It.images.hero,alt:"",width:896,height:1152,decoding:"async"', 'u.jsx("img",{src:It.images.hero,alt:"Zazie Kanwar-Torge, horror composer and founder of Zazie Productions",width:896,height:1152,decoding:"async"', BUNDLE],
  ['<img alt="" class="absolute bottom-0 right-0 h-full w-auto max-w-none object-cover object-top opacity-80" src="/images/hero-portrait.jpg"', '<img alt="Zazie Kanwar-Torge, horror composer and founder of Zazie Productions" class="absolute bottom-0 right-0 h-full w-auto max-w-none object-cover object-top opacity-80" src="/images/hero-portrait.jpg"', HTML],
  // Showreel rows: 32 rows x 3 decorative nodes became 32 x 1. The duration moves
  // into the mood line (it was hidden below 640px, so phones lost it entirely) and
  // the play/pause glyph becomes a pseudo-element keyed off data-row-playing.
  [
    'md:px-6 "+(o?"bg-blood/10":"hover:bg-smoke"),\"data-source-loc\":\"src/components/Showreel.tsx:194:1\"',
    'md:px-6 zp-track "+(o?"bg-blood/10":"hover:bg-smoke"),\"data-row-playing\":String(!!(o&&r)),\"data-source-loc\":\"src/components/Showreel.tsx:194:1\"',
    BUNDLE,
  ],
  [
    'children:t.tag})]}),u.jsx("span",{className:"hidden shrink-0 text-[11px] tabular-nums text-mist xs:inline sm:inline","data-source-loc":"src/components/Showreel.tsx:230:1",children:bi(t.duration)}),u.jsx("span",{className:"shrink-0 text-mist","data-source-loc":"src/components/Showreel.tsx:233:1",children:o&&r?u.jsx(bu,{size:16,"data-source-loc":"src/components/Showreel.tsx:234:24"}):u.jsx(Ai,{size:16,"data-source-loc":"src/components/Showreel.tsx:234:46"})})',
    'children:t.tag+" · "+bi(t.duration)})]})',
    BUNDLE,
  ],
  // Accessible name must contain the visible text (axe label-content-name-mismatch):
  // the link reads "Enter" but announced "Scroll to showreel".
  ['"aria-label":"Scroll to showreel"', '"aria-label":"Enter the showreel"', BUNDLE],
  ['aria-label="Scroll to showreel"', 'aria-label="Enter the showreel"', HTML],
  // The desktop portrait is display:none below 1024px; lazy keeps mobile from
  // downloading 143 KB it can never show (desktop is in-viewport, so it still loads).
  ['alt:"Zazie Kanwar-Torge, horror composer and founder of Zazie Productions",width:896,height:1152,decoding:"async"', 'alt:"Zazie Kanwar-Torge, horror composer and founder of Zazie Productions",width:896,height:1152,loading:"lazy",decoding:"async"', BUNDLE],
  // Services heading
  ['04 · Scope and budget', '04 · Scoring services', BOTH],
  ['Build a scope and estimate', 'Choose a package, then estimate', BOTH],
  ['Choose a project type, scored runtime, complexity, and delivery needs.', 'Prices follow minutes of music, not film length.', BOTH],
  ["Estimates scale with your project's funding.", 'Your estimate is a guide. I confirm the scope and fee in a written quote.', BUNDLE],
  ['Packages are priced by scored music minutes, not film length. Estimates are indicative and nonbinding.', 'Prices follow minutes of music, not film length. Your estimate is a guide. I confirm the scope and fee in a written quote.', HTML],
  // Contact
  ['Share your format, runtime, timeline, and budget.', 'Start with your name and email. Add project details if you know them. The form prepares an email for you to review and send.', BUNDLE],
  ['Share your format, scored minutes, timeline, and budget.', 'Start with your name and email. Add project details if you know them. The form prepares an email for you to review and send.', HTML],
  // Plain-language approach, review, and contact guidance.
  ['Themes, harmony, texture, and tension are shaped to picture, with clear spotting, revisions, and delivery.', 'Every cue serves the picture. I plan the music with you. You get clear revision steps and delivery dates.', BOTH],
  ['Cues built around how dread lands: slow-burn beds, dissociative harmony, and tension that hits the cut, not the cliché.', 'I shape each cue around the story. Slow beds build dread. Sharp sounds mark a turn or reveal. The music fits the cut, not a stock horror formula.', BOTH],
  ['Hybrid orchestral haze, sub-frequency gravity, frozen ambient space. Every color chosen for story. Never stock "scary pack" mood.', 'I blend strings, synths, and low sound to create a dark mood. Each sound has a story purpose. No stock "scary pack" cues.', BOTH],
  ['Motifs that survive the festival loop and the trailer cut. Music you remember in the parking lot.', 'A clear theme can carry a scene. It can also work in a trailer. The best themes stay with you after the film ends.', BOTH],
  ['Feedback from directors, producers, supervisors, and filmmakers across feature, festival, and micro-budget work.', 'Hear from directors, producers, and music supervisors. Their projects include features, festival films, and low-budget work.', BOTH],
  ['Opens your email → ', 'This form opens your email app: ', BOTH],
  [' · subject', '. Subject: ', BOTH],
  [' · atmospheric score focus only. Fees, revisions, rights and delivery: ', '. For original score requests only. Read about fees, revisions, rights, and delivery: ', BOTH],
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
];

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

/**
 * A replacement string is spliced into the bundle's own JavaScript source, not
 * into HTML. A pair whose new text carries an unescaped `"` turns the enclosing
 * double-quoted literal into two literals and the whole homepage bundle dies at
 * parse time - which is exactly what shipped before 2026-10-22: the file was
 * served, threw `SyntaxError`, and none of the React behaviour (poster lightbox,
 * film player, 32-cue audio player, sticky player) ever ran while every other
 * check still passed. Parsing the patched text here makes that a build failure
 * instead of a silent runtime failure.
 */
function assertBundleParses(source) {
  const file = ts.createSourceFile('index-bundle.js', source, ts.ScriptTarget.ES2020, false, ts.ScriptKind.JS);
  const diagnostics = file.parseDiagnostics ?? [];
  if (diagnostics.length) {
    const first = diagnostics[0];
    const at = first.start ?? 0;
    const context = JSON.stringify(source.slice(Math.max(0, at - 120), at + 80));
    throw new Error(`patched bundle does not parse: ${ts.flattenDiagnosticMessageText(first.messageText, ' ')} near ${context}`);
  }
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
  assertBundleParses(out);
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

  // Showreel rows in the static snapshot must match the patched React rows, so
  // the same three nodes come out of both render paths. Idempotent: once a row
  // has zp-track + the merged duration line, the pattern no longer matches.
  const rowPattern =
    /<button class="(flex min-h-\[56px\][^"]*?)"><span class="w-7[^"]*">([\s\S]*?)<\/span><div class="min-w-0 flex-1"><p class="([^"]*)">([\s\S]*?)<\/p><p class="mt-0\.5[^"]*">([\s\S]*?)<\/p><\/div><span class="hidden shrink-0[^"]*">([\s\S]*?)<\/span><span class="shrink-0 text-mist"><svg[\s\S]*?<\/svg><\/span><\/button>/g;
  let trimmedRows = 0;
  out = out.replace(rowPattern, (_match, buttonClass, indexHtml, titleClass, titleHtml, tagHtml, durationHtml) => {
    trimmedRows += 1;
    return `<button class="${buttonClass} zp-track" data-row-playing="false"><span class="w-7 shrink-0 text-[11px] tabular-nums text-mist sm:w-8">${indexHtml}</span><div class="min-w-0 flex-1"><p class="${titleClass}">${titleHtml}</p><p class="mt-0.5 truncate text-[10px] uppercase tracking-[0.2em] text-mist">${tagHtml} · ${durationHtml}</p></div></button>`;
  });
  if (trimmedRows) applied.push(`showreel rows trimmed (${trimmedRows})`);

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

  // Historical implementation comments add markup bytes but no visible copy.
  // Preserve every marker needed by later build and pricing-sync steps.
  out = out.replace(/<!--[\s\S]*?-->/g, (comment) =>
    /SEO:|HOME-POSTERS:|(?:\/?zp:)|(?:\/?v:)/.test(comment) ? comment : '',
  );

  return { html: out, applied };
}

/** The estimator stylesheet and script used by the homepage island. */
function ensureEstimatorAssets(html) {
  const css = fs.readdirSync(root).find((f) => /^estimator-[0-9a-f]{8}\.css$/.test(f));
  const js = fs.readdirSync(root).find((f) => /^estimator-[0-9a-f]{8}\.js$/.test(f));
  if (!css || !js) throw new Error('estimator assets missing: run node scripts/build-estimator.mjs first');
  let out = html;
  if (!/\/estimator-[0-9a-f]{8}\.css/.test(out)) {
    // Non-blocking: this sheet only paints the below-fold scope builder and the
    // inquiry form, so it must never sit on the hero's render path.
    out = out.replace(
      '</head>',
      () =>
        `<link href="/${css}" rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'"/>\n` +
        `<noscript><link href="/${css}" rel="stylesheet"/></noscript>\n</head>`,
    );
  } else {
    // A rebuild that changes the estimator hash must not leave the preload
    // pointing at a file that no longer exists. Also upgrade an older static
    // snapshot whose stylesheet still blocks the hero paint.
    out = out.replace(/\/estimator-[0-9a-f]{8}\.css/g, () => `/${css}`);
    if (!out.includes(`<link href="/${css}" rel="preload"`)) {
      out = out.replace(
        `<link href="/${css}" rel="stylesheet"/>`,
        () =>
          `<link href="/${css}" rel="preload" as="style" onload="this.onload=null;this.rel='stylesheet'"/>\n` +
          `<noscript><link href="/${css}" rel="stylesheet"/></noscript>`,
      );
    }
  }
  if (!/\/estimator-[0-9a-f]{8}\.js/.test(out)) {
    out = out.replace('</body>', () => `<script src="/${js}" defer></script>\n</body>`);
  }
  return out;
}

/**
 * Build the homepage's active support CSS/JS outside the HTML document.
 * Keeping these assets external leaves more visible text per byte of HTML;
 * minification and content hashes keep them cache-safe. The module's dynamic
 * React import follows the bundle hash generated by this same build.
 */
async function buildHomeAssets(bundleName) {
  const jsSource = fs.readFileSync(path.join(here, 'home.js'), 'utf8')
    .replace(/\/index-[0-9a-f]{8}\.js/g, `/${bundleName}`);
  const cssSource = fs.readFileSync(path.join(here, 'home.css'), 'utf8');
  const icons = fs.readFileSync(path.join(here, 'icons.svg'), 'utf8');
  const js = (await transform(jsSource, { loader: 'js', minify: true, legalComments: 'none', target: 'es2019' })).code;
  const css = (await transform(cssSource, { loader: 'css', minify: true, legalComments: 'none' })).code;
  const hash = (text) => crypto.createHash('sha256').update(text).digest('hex').slice(0, 8);
  const assets = {
    jsName: `home-${hash(js)}.js`,
    cssName: `home-${hash(css)}.css`,
    iconsName: `home-icons-${hash(icons)}.svg`,
  };

  for (const file of fs.readdirSync(root)) {
    const staleSupport = /^home-[0-9a-f]{8}\.(?:js|css)$/.test(file) && file !== assets.jsName && file !== assets.cssName;
    const staleIcons = /^home-icons-[0-9a-f]{8}\.svg$/.test(file) && file !== assets.iconsName;
    if (staleSupport || staleIcons) fs.rmSync(path.join(root, file));
  }
  fs.writeFileSync(path.join(root, assets.jsName), js, 'utf8');
  fs.writeFileSync(path.join(root, assets.cssName), css, 'utf8');
  fs.writeFileSync(path.join(root, assets.iconsName), icons, 'utf8');
  console.log(`home-src: wrote ${assets.jsName}, ${assets.cssName}, and ${assets.iconsName}`);
  return assets;
}

function ensureHomeAssets(html, assets) {
  if (!/\/home-[0-9a-f]{8}\.js/.test(html) || !/\/home-[0-9a-f]{8}\.css/.test(html) || !/\/home-icons-[0-9a-f]{8}\.svg/.test(html)) {
    throw new Error('index.html must reference the external home CSS, module, and icon assets');
  }
  if (/<path\b/.test(html)) {
    throw new Error('index.html contains a new inline SVG path; add it to home-src/icons.svg and use the shared sprite');
  }
  return html
    .replace(/\/home-[0-9a-f]{8}\.js/g, `/${assets.jsName}`)
    .replace(/\/home-[0-9a-f]{8}\.css/g, `/${assets.cssName}`)
    .replace(/\/home-icons-[0-9a-f]{8}\.svg/g, `/${assets.iconsName}`);
}

/* ----------------------------------------------------------------- main */

const orig = fs.readFileSync(path.join(here, 'bundle.orig.js'), 'utf8');
const origHash = crypto.createHash('sha256').update(orig).digest('hex');
if (!origHash.startsWith('2afd4ec8')) throw new Error(`bundle.orig.js is not the shipped bundle (sha256 ${origHash})`);

const patched = patchBundle(orig);
const hash = crypto.createHash('sha256').update(patched).digest('hex').slice(0, 8);
const name = `index-${hash}.js`;
const homeAssets = await buildHomeAssets(name);

for (const f of fs.readdirSync(root)) {
  if (/^index-[0-9a-f]{8}\.js$/.test(f) && f !== name) fs.rmSync(path.join(root, f));
}
fs.writeFileSync(path.join(root, name), patched, 'utf8');

const indexFile = path.join(root, 'index.html');
const { html, applied } = patchStatic(fs.readFileSync(indexFile, 'utf8'));
let nextHtml = html.replace(/\/?index-[0-9a-f]{8}\.js/g, (m) => (m.startsWith('/') ? `/${name}` : name));
nextHtml = ensureHomeAssets(nextHtml, homeAssets);
nextHtml = ensureEstimatorAssets(nextHtml);
fs.writeFileSync(indexFile, nextHtml, 'utf8');

const swFile = path.join(root, 'sw.js');
if (fs.existsSync(swFile)) {
  const sw = fs.readFileSync(swFile, 'utf8');
  const nextSw = sw
    .replace(/\/index-[0-9a-f]{8}\.js/g, `/${name}`)
    .replace(/\/home-[0-9a-f]{8}\.js/g, `/${homeAssets.jsName}`)
    .replace(/\/home-[0-9a-f]{8}\.css/g, `/${homeAssets.cssName}`)
    .replace(/\/home-icons-[0-9a-f]{8}\.svg/g, `/${homeAssets.iconsName}`);
  if (nextSw !== sw) fs.writeFileSync(swFile, nextSw, 'utf8');
}

console.log(`home-src: wrote ${name} (${patched.length} bytes)`);
console.log(`home-src: index.html updated (${applied.length} static edits)`);
