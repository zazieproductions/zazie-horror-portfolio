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
  // Hero
  ['Original music for psychological horror ', 'Dark, atmospheric horror scores, ', HTML],
  ['& experimental cinema.', 'written to your picture.', HTML],
  ['Dissonance. Atmosphere. Emotional intensity.', 'Original music for psychological horror, thrillers, and dark sci-fi,', HTML],
  ['Scores composed directly to picture.', 'composed for film, TV, and games.', HTML],
  ['Start an inquiry', 'Request a scoring quote', BOTH],
  // User-provided biography; HTML emphasis is shared with the static snapshot.
  ["Zazie Kanwar-Torge is an award-winning composer, experimental producer, and multi-instrumentalist. Under Zazie Productions, he writes and performs original scores for psychological, folk, and body horror, supernatural thrillers, and dark sci-fi.", "<strong>Zazie Kanwar-Torge</strong> is an award-winning film composer, experimental producer, and multi-instrumentalist specializing in <strong>psychological horror, folk horror, body horror, supernatural thrillers, and dark science fiction</strong>. Through Zazie Productions, he creates original film scores and immersive sonic atmospheres that explore dread, dissonance, isolation, and the uncanny.", "bundle"],
  ["His palette combines struck strings, bowed metal, hybrid orchestration, and custom synths, shaped to picture for projects from shorts to features.", "Working at the intersection of cinematic scoring, musique concrète, and electroacoustic composition, his distinctive palette combines bowed metal, struck strings, experimental synthesis, and hybrid orchestration. His work has been featured at <strong>Ars Electronica 2026</strong>, performed in 20.4-channel spatial audio, and selected for international experimental music and film programs, including <strong>MUSLAB/Cero Records</strong> and <strong>EXiS in Seoul</strong>. Previously commissioned by the <strong>Black Mountain College Museum + Arts Center</strong>, he also develops original audio instruments and experimental sound libraries.</p><p>Drawing on a background in experimental film, sound art, and audiovisual composition, Zazie approaches each score as an extension of the film's psychological and emotional world, creating visceral, atmospheric music tailored to independent shorts, feature films, series, and horror video games.", "bundle"],
  ['Drawing on a background in experimental film, sound art, and audiovisual composition, Zazie approaches each score as an extension of the film\'s psychological and emotional world, creating visceral, atmospheric music tailored to independent shorts, feature films, and unconventional genre cinema.', 'Drawing on a background in experimental film, sound art, and audiovisual composition, Zazie approaches each score as an extension of the film\'s psychological and emotional world, creating visceral, atmospheric music tailored to independent shorts, feature films, series, and horror video games.', HTML],
  ['<a href="#services" class="px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone">Rates</a><a href="/store"', '<a href="#services" class="px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone">Rates</a><a href="/hire-a-composer" class="px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone">Hire</a><a href="/store"', HTML],
  ['[["/hire-a-composer","Hire a composer"],["/sound-design","Sound design"]', '[["/hire-a-composer","Hire a horror composer"],["/how-to-hire-a-horror-composer","Hiring guide"],["/sound-design","Sound design"]', BUNDLE],
  ['<a href="/hire-a-composer" class="text-[10px] uppercase tracking-[0.25em] text-mist transition-colors hover:text-blood">Hire a composer</a><a href="/sound-design"', '<a href="/hire-a-composer" class="text-[10px] uppercase tracking-[0.25em] text-mist transition-colors hover:text-blood">Hire a horror composer</a><a href="/how-to-hire-a-horror-composer" class="text-[10px] uppercase tracking-[0.25em] text-mist transition-colors hover:text-blood">Hiring guide</a><a href="/sound-design"', HTML],
  // Keep a direct, 44px quote action visible on phones; the full section menu
  // remains available beside it. aria-expanded follows the React menu state.
  [']}),u.jsx("button",{className:"border border-white/10 p-2.5 text-bone transition-colors hover:border-blood/50 xl:hidden",onClick:()=>r(e=>!e),"aria-label":n?"Close menu":"Open menu",', ']}),u.jsx("a",{href:"/contact",className:"zp-mobile-quote",children:"Get a quote"}),u.jsx("button",{type:"button",className:"zp-menu-button xl:hidden",onClick:()=>r(e=>!e),"aria-expanded":n,"aria-controls":"mobile-navigation","aria-label":n?"Close menu":"Open menu",', BUNDLE],
  ['<button class="border border-white/10 p-2.5 text-bone transition-colors hover:border-blood/50 xl:hidden" aria-label="Open menu">', '<a href="/contact" class="zp-mobile-quote">Get a quote</a><button type="button" class="zp-menu-button xl:hidden" aria-expanded="false" aria-controls="mobile-navigation" aria-label="Open menu">', HTML],
  ['className:"overflow-hidden border-t border-white/5 bg-void/95 backdrop-blur-xl xl:hidden",', 'id:"mobile-navigation",className:"overflow-hidden border-t border-white/5 bg-void/95 backdrop-blur-xl xl:hidden",', BUNDLE],
  ["children:It.bio}", "dangerouslySetInnerHTML:{__html:It.bio}}", "bundle"],
  ["u.jsx(\"p\",{className:\"text-mist leading-relaxed mb-8 text-sm sm:text-base\",\"data-source-loc\":\"src/components/About.tsx:43:1\",children:It.bio2})", "u.jsx(\"div\",{className:\"text-mist leading-relaxed mb-8 text-sm sm:text-base space-y-5\",\"data-source-loc\":\"src/components/About.tsx:43:1\",dangerouslySetInnerHTML:{__html:\"<p>\"+It.bio2+\"</p>\"}})", "bundle"],
  // User-supplied standalone poster. It joins the wall and lightbox without
  // creating an unverified production route or claiming credits not present in
  // productions.ts. `contain` preserves the full 3:4 artwork in the 2:3 card.
  ['featured:!0}];function Z5(e)', 'featured:!0},{title:"UNCLE FRED\'S MONSTER PROBLEM",year:"Film",tagline:"His problem is now your problem.",poster:"/images/posters/uncle-freds-monster-problem-1200.jpg",thumb:"/images/posters/uncle-freds-monster-problem-640.jpg",thumbA:"/images/posters/uncle-freds-monster-problem-640.avif",featured:!0,contain:!0,width:640,height:854}];function Z5(e)', BUNDLE],
  // Mobile poster wall: a 400w AVIF keeps the 640w file for retina desktop.
  // Phones render the 46vw cells at ~190 CSS px (~380 device px at DPR 2), so
  // the 640w poster was ~2.6x the pixels the slot needed.
  ['srcSet:e.thumbA+" 640w"', 'srcSet:e.thumbA.replace("-640.avif","-400.avif")+" 400w, "+e.thumbA.replace("-640.avif","-480.avif")+" 480w, "+e.thumbA+" 640w"', BUNDLE],
  // Alt text: the poster wall and the hero portrait are content images, not
  // decoration, so they carry the artwork's own name. (The atmosphere plate and
  // the press photo stay alt="" - they are backgrounds behind live copy.)
  ['width:640,height:960,alt:"",className:"h-full w-full object-cover object-top opacity-95 transition-transform duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"', 'width:e.width||640,height:e.height||960,alt:e.title+" poster artwork",className:"h-full w-full "+(e.contain?"zp-poster-contain":"object-cover object-top group-hover:scale-105")+" opacity-95 transition-transform duration-700 ease-out group-hover:opacity-100"', BUNDLE],
  ['className:"h-full w-full object-cover object-top","data-source-loc":"src/components/PosterWall.tsx:96:1"', 'className:"h-full w-full "+(e.contain?"zp-poster-contain":"object-cover object-top"),"data-source-loc":"src/components/PosterWall.tsx:96:1"', BUNDLE],
  // Hero artwork. The shipped markup sized the portrait off its *height*
  // (`h-full w-auto`) inside a 46%-wide, 92%-tall panel and then clipped the
  // result with `object-cover`, so the poster art (896x1152) was centred-cropped
  // and spilled left past the panel that carried its gradients: the scrimmed
  // band and the unscrimmed band met in a hard vertical seam, and the cropped
  // side panels of the artwork read as a torn image. The plate now derives its
  // width from the artwork's own ratio (see .zp-hero-art-plate), so the whole
  // poster is shown, and it is feathered instead of cut. Alt text and the lazy
  // attribute ride along here; the portrait is display:none below 1024px.
  [
    'className:"pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] lg:block","aria-hidden":!0,"data-source-loc":"src/components/Hero.tsx:56:6",children:u.jsxs("div",{className:"absolute bottom-0 right-0 h-[92%] w-full","data-source-loc":"src/components/Hero.tsx:63:8",children:[u.jsxs("picture",{children:[u.jsx("source",{srcSet:"/images/hero-portrait.avif",type:"image/avif"}),u.jsx("img",{src:It.images.hero,alt:"",width:896,height:1152,decoding:"async",className:"absolute bottom-0 right-0 h-full w-auto max-w-none object-cover object-top opacity-80","data-source-loc":"src/components/Hero.tsx:64:10"})]}),u.jsx("div",{className:"absolute inset-0 bg-gradient-to-l from-transparent via-void/20 to-void","data-source-loc":"src/components/Hero.tsx:69:10"}),u.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-void via-transparent to-void/40","data-source-loc":"src/components/Hero.tsx:70:10"}),u.jsx("div",{className:"absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-void","data-source-loc":"src/components/Hero.tsx:71:10"}),u.jsx("div",{className:"absolute inset-y-[15%] right-0 w-px bg-gradient-to-b from-transparent via-blood/50 to-transparent","data-source-loc":"src/components/Hero.tsx:73:10"})]})',
    'className:"pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] lg:block","aria-hidden":!0,"data-source-loc":"src/components/Hero.tsx:56:6",children:u.jsxs("div",{className:"zp-hero-art","data-source-loc":"src/components/Hero.tsx:63:8",children:[u.jsx("div",{className:"zp-hero-art-plate",children:u.jsxs("picture",{children:[u.jsx("source",{srcSet:"/images/hero-portrait.avif",type:"image/avif"}),u.jsx("img",{src:It.images.hero,alt:"Zazie Kanwar-Torge, horror composer and founder of Zazie Productions",width:896,height:1152,loading:"lazy",decoding:"async",className:"absolute inset-0 h-full w-full object-contain","data-source-loc":"src/components/Hero.tsx:64:10"})]})}),u.jsx("div",{className:"zp-hero-art-scrim","aria-hidden":!0})]})',
    BUNDLE,
  ],
  // Film cards: the close action has to be part of the React render too, not
  // only the early document-delegated handler in index.html. A re-render used
  // to drop the button the inline script had inserted, leaving an open player
  // with no way out except another card.
  [
    'u.jsx("a",{href:n.drive?`https://drive.google.com/file/d/${n.drive}/view`',
    'o?u.jsx("button",{type:"button",className:"zp-player-close","aria-label":`Close ${n.title} player`,onClick:function(e){e.stopPropagation();window.__zpPlayer=null;t(null)},children:"Close player"}):null,u.jsx("a",{href:n.drive?`https://drive.google.com/file/d/${n.drive}/view`',
    BUNDLE,
  ],
  // Poster lightbox: touch-friendly close, Escape support, background scroll
  // lock, and a scrollable dialog on short phone screens.
  ['function Q5(){const[e,t]=_.useState(null);return', 'function Q5(){const[e,t]=_.useState(null);_.useEffect(()=>{if(!e)return;const n=document.body.style.overflow,r=e=>{e.key==="Escape"&&t(null)};return document.body.style.overflow="hidden",document.addEventListener("keydown",r),()=>{document.body.style.overflow=n,document.removeEventListener("keydown",r)}},[e]);return', BUNDLE],
  ['className:"relative grid max-h-[90svh] w-full max-w-3xl overflow-hidden border border-blood/30 bg-ink shadow-[0_0_80px_rgba(196,30,30,0.2)] md:grid-cols-2"', 'className:"zp-poster-dialog relative grid max-h-[90svh] w-full max-w-3xl overflow-hidden border border-blood/30 bg-ink shadow-[0_0_80px_rgba(196,30,30,0.2)] md:grid-cols-2"', BUNDLE],
  ['type:"button",onClick:()=>t(null),className:"absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center border border-ash bg-void/90 text-bone hover:border-blood hover:text-blood","aria-label":"Close"', 'type:"button",autoFocus:!0,onClick:()=>t(null),className:"zp-poster-close absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center border border-ash bg-void/90 text-bone hover:border-blood hover:text-blood","aria-label":"Close "+e.title+" poster"', BUNDLE],
  // Showreel catalogue: The Beautiful Wrongness leads the queue, while the two
  // retired cues are removed. Track IDs stay tied to their original audio files;
  // the visible row number comes from the current array index instead.
  [
    'tracks:[{id:0,title:"Needle in The Nerve",src:"/audio/track-00.mp3",duration:72.363,tag:"Psychological Orchestral"}',
    'tracks:[{id:30,title:"The Beautiful Wrongness",src:"/audio/track-30.mp3",duration:65.411,tag:"Psychological Orchestral"},{id:0,title:"Needle in The Nerve",src:"/audio/track-00.mp3",duration:72.363,tag:"Psychological Orchestral"}',
    BUNDLE,
  ],
  [',{id:30,title:"The Beautiful Wrongness",src:"/audio/track-30.mp3",duration:65.411,tag:"Psychological Orchestral"}', '', BUNDLE],
  [',{id:9,title:"Dark Thriller Cinematic Cue",src:"/audio/track-09.mp3",duration:65.109,tag:"Thriller"}', '', BUNDLE],
  [',{id:23,title:"Screams of The Damned",src:"/audio/track-23.mp3",duration:200.072,tag:"Body Horror"}', '', BUNDLE],
  ['String(t.id+1).padStart(2,"0")', 'String(s+1).padStart(2,"0")', BUNDLE],
  // Showreel rows: 30 rows x 3 decorative nodes became 30 x 1. The duration moves
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

  // Two accessibility fixes that shipped by hand before this build knew about
  // them; without these pairs a rebuild silently reverted them (and the player
  // tests caught it). The poster is a native <button>, so the custom Enter/Space
  // handler is gone, and focus moves into the open player and back to the
  // triggering poster when it closes.
  [
    'u.jsxs("div",{role:"button",tabIndex:0,"aria-label":`Play ${n.title} film sample`',
    'u.jsxs("button",{type:"button","aria-label":`Play ${n.title} film sample`',
    BUNDLE,
  ],
  [
    ',onKeyDown:function(zpEv){(zpEv.key==="Enter"||zpEv.key===" ")&&(zpEv.preventDefault(),zpCard.current=zpEv.currentTarget&&zpEv.currentTarget.closest?zpEv.currentTarget.closest(".zp-vcard"):null,window.__zpPlayer={id:s},t(s))}',
    '',
    BUNDLE,
  ],
  [
    '_.useEffect(function(){const c=zpCard.current;if(!e||!c)return;zpCard.current=null;try{const reduce=',
    '_.useEffect(function(){let c=zpCard.current;if(!e){if(c){const trigger=c.querySelector(".zp-poster");if(trigger)trigger.focus()}zpCard.current=null;return}if(!c)c=document.querySelector(".zp-vcard.is-playing");if(!c)return;zpCard.current=c;const close=c.querySelector(".zp-player-close");if(close)close.focus();try{const reduce=',
    BUNDLE,
  ],
  // Services heading
  ['04 · Scope and budget', '04 · Scoring services', BOTH],
  ['Build a scope and estimate', 'Rates & estimates', BUNDLE],
  ['Build a scope and estimate', 'Rates &amp; estimates', HTML],
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
];

/** Budget options come from the package list; the bundle reads xu[]. */
const BUNDLE_BUDGET_OLD = 'xu=["Under $300","$300 - $500","$500 - $700","$700 - $900","$900+","Flexible / discuss"]';
const BUNDLE_BUDGET_DEFAULT_OLD = 'useState(xu[1])';

/**
 * The hero's right-hand artwork panel: one plate (the poster, whole, at its own
 * aspect ratio), one scrim. All geometry and feathering lives in the
 * .zp-hero-art* rules in index.html so the prerendered and React renders cannot
 * drift; this markup only has to match the bundle's output.
 */
const HERO_ART_HTML =
  '<div class="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] lg:block" aria-hidden="true"><div class="zp-hero-art"><div class="zp-hero-art-plate"><picture><source srcset="/images/hero-portrait.avif" type="image/avif"><img alt="Zazie Kanwar-Torge, horror composer and founder of Zazie Productions" class="absolute inset-0 h-full w-full object-contain" src="/images/hero-portrait.jpg" width="896" height="1152" loading="lazy" decoding="async"></picture></div><div class="zp-hero-art-scrim" aria-hidden="true"></div></div></div>';

const ISLAND_OPEN = '<div class="zp-home-section zp-home-island" data-zp-island="estimator"><div class="zp-shell">';
const ISLAND_CLOSE = '</div></div>';
const SERVICES_HEADER = [
  '<div class="mb-10 max-w-2xl sm:mb-14">',
  '<p class="mb-3 text-[10px] uppercase tracking-[0.35em] text-blood sm:text-[11px] sm:tracking-[0.4em]">04 · Scoring services</p>',
  '<h2 class="mb-4 font-display text-3xl leading-none text-bone sm:text-4xl md:text-6xl">Rates &amp; estimates</h2>',
  '<p class="text-sm leading-relaxed text-mist sm:text-base">Packages are priced by scored music minutes, not film length. Preliminary estimate — final quotation subject to creative scope and written agreement.</p>',
  '</div>',
].join('');

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

/** Read the patched player catalogue so the static first paint uses the same queue. */
function readShowreelTracks(source) {
  const start = source.indexOf('tracks:[');
  const end = source.indexOf('],projects:[', start);
  if (start < 0 || end < 0) throw new Error('bundle: showreel track array not found');
  const body = source.slice(start + 'tracks:['.length, end);
  const pattern = /\{id:(\d+),title:"([^"]*)",src:"([^"]*)",duration:([\d.]+),tag:"([^"]*)"\}/g;
  const tracks = [];
  for (const match of body.matchAll(pattern)) {
    tracks.push({
      id: Number(match[1]),
      title: match[2].replace(/\\'/g, "'"),
      src: match[3],
      duration: Number(match[4]),
      tag: match[5],
    });
  }
  if (tracks.length !== 30) throw new Error(`bundle: expected 30 showreel tracks after patching, found ${tracks.length}`);
  if (tracks[0].title !== 'The Beautiful Wrongness') throw new Error('bundle: The Beautiful Wrongness must be the default first track');
  if (new Set(tracks.map((track) => track.id)).size !== tracks.length) throw new Error('bundle: duplicate showreel track IDs');
  for (const retired of ['Dark Thriller Cinematic Cue', 'Screams of The Damned']) {
    if (tracks.some((track) => track.title === retired)) throw new Error(`bundle: retired track remains: ${retired}`);
  }
  return tracks;
}

function escapeStaticText(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatTrackDuration(seconds) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

/** Keep the prerendered homepage player byte-for-byte aligned with its new queue. */
function patchStaticShowreel(html, tracks) {
  const sectionStart = html.indexOf('<section id="showreel"');
  const sectionEnd = html.indexOf('</section>', sectionStart);
  if (sectionStart < 0 || sectionEnd < 0) throw new Error('index.html: #showreel section not found');
  let section = html.slice(sectionStart, sectionEnd);
  const first = tracks[0];

  section = section.replace(
    /(<p class="font-display text-5xl leading-none text-blood sm:text-6xl">)\d+(<\/p><p class="pb-1 text-\[10px\] uppercase tracking-\[0.3em\] text-mist">Curated cues<\/p>)/,
    (_match, open, close) => `${open}${tracks.length}${close}`,
  );
  section = section.replace(
    /(<h3 class="mb-1 truncate font-display text-xl text-bone sm:text-2xl md:text-4xl">)[^<]*(<\/h3>)/,
    (_match, open, close) => `${open}${escapeStaticText(first.title)}${close}`,
  );
  section = section.replace(
    /(<p class="text-\[10px\] uppercase tracking-\[0.2em\] text-blood sm:text-xs">)[^<]*(<\/p>)/,
    (_match, open, close) => `${open}${escapeStaticText(first.tag)}${close}`,
  );
  section = section.replace(
    /(<input class="seek[^>]*? max=")[^"]+("[^>]*aria-label="Seek through current track")/,
    (_match, open, close) => `${open}${first.duration}${close}`,
  );
  section = section.replace(
    /(<input class="seek[^>]*aria-label="Seek through current track"[^>]*><span class="w-9 shrink-0 text-right text-\[10px\] tabular-nums text-mist">)[^<]+/,
    (_match, open) => `${open}${formatTrackDuration(first.duration)}`,
  );

  const listStart = section.indexOf('<div class="max-h-[min(60svh,480px)]');
  const listOpenEnd = section.indexOf('>', listStart) + 1;
  const listEnd = section.indexOf('</div><p class="mt-5 px-1', listOpenEnd);
  if (listStart < 0 || listOpenEnd <= 0 || listEnd < 0) throw new Error('index.html: showreel row container not found');
  const rows = tracks.map((track, index) => {
    const number = String(index + 1).padStart(2, '0');
    const stateClass = index === 0 ? 'bg-blood/10' : 'hover:bg-smoke';
    const titleClass = index === 0 ? 'text-blood' : 'text-bone';
    return `<button class="flex min-h-[56px] w-full items-center gap-3 px-3 py-3 text-left transition-colors sm:gap-4 sm:px-4 sm:py-4 md:px-6 ${stateClass} zp-track" data-row-playing="false"><span class="w-7 shrink-0 text-[11px] tabular-nums text-mist sm:w-8">${number}</span><div class="min-w-0 flex-1"><p class="truncate font-display text-base sm:text-lg md:text-xl ${titleClass}">${escapeStaticText(track.title)}</p><p class="mt-0.5 truncate text-[10px] uppercase tracking-[0.2em] text-mist">${escapeStaticText(track.tag)} · ${formatTrackDuration(track.duration)}</p></div></button>`;
  }).join('');
  section = section.slice(0, listOpenEnd) + rows + section.slice(listEnd);
  return html.slice(0, sectionStart) + section + html.slice(sectionEnd);
}

/**
 * A replacement string is spliced into the bundle's own JavaScript source, not
 * into HTML. A pair whose new text carries an unescaped `"` turns the enclosing
 * double-quoted literal into two literals and the whole homepage bundle dies at
 * parse time - which is exactly what shipped before 2026-10-22: the file was
 * served, threw `SyntaxError`, and none of the React behaviour (poster lightbox,
 * film player, 30-cue audio player, sticky player) ever ran while every other
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
  const servicesMarkup = SERVICES_HEADER + islandHtml(false);
  const replacement = `function lj(){return u.jsx("section",{id:"services",className:"relative bg-ink py-14 sm:py-20 md:py-28",children:u.jsx("div",{className:"mx-auto max-w-7xl px-4 sm:px-6 md:px-8",dangerouslySetInnerHTML:{__html:${JSON.stringify(servicesMarkup)}}})})}`;
  out = out.slice(0, start) + replacement + out.slice(end);
  assertBundleParses(out);
  return out;
}

/* ------------------------------------------------------ static copy patch */

function patchStatic(html, tracks) {
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

  // Hero artwork panel. Structural rather than a text pair: the panel is
  // rebuilt from one opening div to the hero copy wrapper, so a rebuild repairs
  // an older or hand-edited snapshot instead of demanding exact old markup.
  // Idempotent - once the panel carries .zp-hero-art it is left alone.
  {
    const heroPanel = /<div class="pointer-events-none absolute inset-y-0 right-0 hidden w-\[46%\] lg:block"[^>]*>[\s\S]*?(?=<div class="relative z-10)/;
    if (!heroPanel.test(out)) throw new Error('index.html: hero artwork panel not found');
    const next = out.replace(heroPanel, () => HERO_ART_HTML);
    if (next !== out) {
      out = next;
      applied.push('hero artwork panel rebuilt');
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

  const previousShowreel = out;
  out = patchStaticShowreel(out, tracks);
  if (out !== previousShowreel) applied.push(`showreel queue synced (${tracks.length} cues; ${tracks[0].title} first)`);

  // Services: replace the old React estimator snapshot with the static island.
  // The header paragraph is followed by its wrapper's </div>, then the grid
  // that holds the old "Scope builder". We replace the grid, matched by depth.
  const sectionStart = out.indexOf('<section id="services"');
  const sectionEnd = out.indexOf('</section>', sectionStart);
  if (sectionStart < 0 || sectionEnd < 0) throw new Error('index.html: no #services section');
  const previousPackageSubheading = '<h3 class="zp-sub" style="margin-top:0">Choose by scored music minutes</h3>';
  if (out.includes(previousPackageSubheading)) {
    out = out.replace(previousPackageSubheading, '');
    applied.push('redundant package subheading removed');
  }
  const legacyIslandOpen = '<div class="zp-home-section"><div class="zp-shell">';
  if (out.includes(legacyIslandOpen)) {
    out = out.replace(legacyIslandOpen, ISLAND_OPEN);
    applied.push('services island identity updated');
  }
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
    // pointing at a file that no longer exists.
    out = out.replace(/\/estimator-[0-9a-f]{8}\.css/g, () => `/${css}`);
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
const showreelTracks = readShowreelTracks(patched);
const hash = crypto.createHash('sha256').update(patched).digest('hex').slice(0, 8);
const name = `index-${hash}.js`;

for (const f of fs.readdirSync(root)) {
  if (/^index-[0-9a-f]{8}\.js$/.test(f) && f !== name) fs.rmSync(path.join(root, f));
}
fs.writeFileSync(path.join(root, name), patched, 'utf8');

const indexFile = path.join(root, 'index.html');
const { html, applied } = patchStatic(fs.readFileSync(indexFile, 'utf8'), showreelTracks);
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
