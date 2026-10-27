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
 *   3. The testimonial section is deleted outright (2026-10-24): there are no
 *      attributable, permissioned quotes to publish, and a "5.0 collaborator
 *      rating" badge pointing at placeholder reviews reads as fabricated.
 *      The hero badge + its divider and the App render call come out as
 *      pairs; the section component (`cj`), the now-unreferenced StarRating
 *      pair (`zi`, `t1`) and the quotes data (`s1`) are cut with the parser,
 *      like step 2. The static copy loses the same badge and section.
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
const { compilationsSectionHtml, compilationsInnerHtml, SECTION_CLASS, CONTAINER_CLASS, COMPILATIONS_CSS, COMPILATIONS_JS } =
  await import('../build/lib/compilations-markup.js');
const { homePosterClientData } = await import('../build/lib/home.js');

// Film sample cards are video + title only: no music-description text or
// permalink block underneath (removed 2026-10-25). Each entry carries its
// semantic `sample-${slug}` anchor and genre-descriptive alt text.
const FILM_SAMPLES_META = [
  {
    title: 'Mike Has A Visitor',
    slug: 'mike-has-a-visitor',
    alt: 'Mike Has A Visitor: Sleep-paralysis psychological horror score by Zazie Kanwar-Torge featuring nerve-scraping strings and sub-audible room tone.',
  },
  {
    title: 'Eclipsed',
    slug: 'eclipsed',
    alt: 'Eclipsed: Surrealist body horror score by Zazie Kanwar-Torge featuring dissonant bowed metal and experimental synthesis.',
  },
  {
    title: 'GOODBYE, BROTHER',
    slug: 'goodbye-brother',
    alt: 'GOODBYE, BROTHER: Psychological drama-horror score by Zazie Kanwar-Torge featuring intimate chamber strings and somber harmonic decay.',
  },
  {
    title: 'Home Intruder',
    slug: 'home-intruder',
    alt: 'Home Intruder: Home-invasion thriller chase score by Zazie Kanwar-Torge featuring brutalist percussion pulses and struck-string tension.',
  },
  {
    title: 'The Haunted',
    slug: 'the-haunted',
    alt: 'The Haunted: Sci-fi psychological horror score by Zazie Kanwar-Torge featuring psychophonic scraping beds and dark ambient drones.',
  },
  {
    title: 'AQUAPHOBIA',
    slug: 'aquaphobia',
    alt: 'AQUAPHOBIA: Subterranean psychological horror score by Zazie Kanwar-Torge featuring performed waterphone resonance and suffocating sub-bass.',
  },
  {
    title: 'Whispers In The Dark',
    slug: 'whispers-in-the-dark',
    alt: 'Whispers In The Dark: Supernatural psychological horror score by Zazie Kanwar-Torge featuring processed vocal whispers, glass harmonics, and dark ambient pads.',
  },
  {
    title: 'Phantom Requiem',
    slug: 'phantom-requiem',
    alt: 'Phantom Requiem: Experimental art house horror score by Zazie Kanwar-Torge featuring electroacoustic synthesis and spectral sound design.',
  },
];

const BOTH = 'both';
const BUNDLE = 'bundle';
const HTML = 'html';

/**
 * Form controls need an id or a name. A field with neither is not associated
 * with any data: the browser will not offer to autofill it, `form.elements`
 * cannot find it, and Lighthouse reports "A form field element should have an
 * id or name attribute" for every one of them.
 *
 * The homepage has two render paths for the same fields - the React bundle and
 * the prerendered snapshot in index.html - so they have to agree on the name or
 * a hydration-free first paint and the app would describe the same control two
 * ways. One rule, used by both: the name is the accessible label, lowercased,
 * with every run of non-alphanumerics folded to a single hyphen. The bundle
 * runs FIELD_NAME_FN at render time (its labels are only known then);
 * addFieldNames() applies the identical slug to the static copy.
 */
function fieldName(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** The same slug as a JS expression, spliced into the bundle. */
const FIELD_NAME_FN = '(label=>label.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,""))';

/** A bundle JSX attribute that names a control after a literal label. */
const nameAttr = (label) => `name:${JSON.stringify(fieldName(label))},`;

/** [old, new, targets]. Text is matched exactly; see the header note. */
const PAIRS = [
  // Non-visible semantic title attributes on primary navigation (visible labels stay concise & uncrowded)
  [
    'Ix=[{href:"#showreel",label:"Reel"},{href:"#work",label:"Work"},{href:"#services",label:"Rates"},{href:"/hire-a-composer",label:"Hire"},{href:"/store",label:"Store"}]',
    'Ix=[{href:"#showreel",label:"Reel",title:"Body horror, folk horror, and psychological horror composer showreel"},{href:"#work",label:"Work",title:"Experimental art house, psychological, folk, and body horror film scores"},{href:"#services",label:"Rates",title:"Horror and experimental art house film scoring rates"},{href:"/store",label:"Store",title:"Horror sound libraries, experimental art house records, and audio tools"}]',
    BUNDLE,
  ],
  [
    'Ix.map(e=>u.jsx("a",{href:e.href,className:"px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone"',
    'Ix.map(e=>u.jsx("a",{href:e.href,title:e.title,className:"px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone"',
    BUNDLE,
  ],
  [
    'Ix.map((e,t)=>u.jsx(Bt.a,{href:e.href,',
    'Ix.map((e,t)=>u.jsx(Bt.a,{href:e.href,title:e.title,',
    BUNDLE,
  ],
  [
    '<a href="#showreel" title="Body horror, folk horror, and psychological horror composer showreel" class="px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone">Reel</a><a href="#work" title="Experimental art house, psychological, folk, and body horror film scores" class="px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone">Work</a><a href="#services" title="Horror and experimental art house film scoring rates" class="px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone">Rates</a><a href="/hire-a-composer" title="Hire a folk horror, body horror, and psychological horror composer" class="px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone">Hire</a><a href="/store" title="Horror sound libraries, experimental art house records, and audio tools" class="px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone">Store</a>',
    '<a href="#showreel" title="Body horror, folk horror, and psychological horror composer showreel" class="px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone">Reel</a><a href="#work" title="Experimental art house, psychological, folk, and body horror film scores" class="px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone">Work</a><a href="#services" title="Horror and experimental art house film scoring rates" class="px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone">Rates</a><a href="/store" title="Horror sound libraries, experimental art house records, and audio tools" class="px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-mist transition-colors hover:text-bone">Store</a>',
    HTML,
  ],
  [
    '<a href="#contact" class="ml-3 bg-blood px-5 py-2.5 text-[10px] uppercase tracking-[0.22em] text-bone shadow-[0_0_24px_rgba(196,30,30,0.25)] transition-all hover:bg-ember hover:shadow-[0_0_32px_rgba(255,42,42,0.35)]">Scoring inquiry</a>',
    '<a href="#contact" title="Commission an experimental art house, psychological, folk, or body horror score" class="ml-3 bg-blood px-5 py-2.5 text-[10px] uppercase tracking-[0.22em] text-bone shadow-[0_0_24px_rgba(196,30,30,0.25)] transition-all hover:bg-ember hover:shadow-[0_0_32px_rgba(255,42,42,0.35)]">Scoring inquiry</a>',
    HTML,
  ],
  [
    'u.jsx("a",{href:"#contact",className:"ml-3 bg-blood px-5 py-2.5 text-[10px] uppercase tracking-[0.22em] text-bone shadow-[0_0_24px_rgba(196,30,30,0.25)] transition-all hover:bg-ember hover:shadow-[0_0_32px_rgba(255,42,42,0.35)]","data-source-loc":"src/components/Nav.tsx:55:10",children:"Scoring inquiry"})',
    'u.jsx("a",{href:"#contact",title:"Commission an experimental art house, psychological, folk, or body horror score",className:"ml-3 bg-blood px-5 py-2.5 text-[10px] uppercase tracking-[0.22em] text-bone shadow-[0_0_24px_rgba(196,30,30,0.25)] transition-all hover:bg-ember hover:shadow-[0_0_32px_rgba(255,42,42,0.35)]","data-source-loc":"src/components/Nav.tsx:55:10",children:"Scoring inquiry"})',
    BUNDLE,
  ],
  // Hero (keep visible copy clean & uncrowded)
  [
    '<h1 class="font-display text-[2.35rem] leading-[1.02] tracking-tight text-bone sm:text-4xl md:text-5xl">Experimental Art House &amp; Psychological Horror <span class="mt-1 block bg-gradient-to-r from-blood via-ember to-blood bg-clip-text italic text-transparent">Scores for Folk Horror &amp; Body Horror.</span></h1>',
    '<h1 class="font-display text-[2.35rem] leading-[1.02] tracking-tight text-bone sm:text-5xl md:text-6xl lg:text-[3.75rem]">Dark, atmospheric horror scores, <span class="mt-1 block bg-gradient-to-r from-blood via-ember to-blood bg-clip-text italic text-transparent">written to your picture.</span></h1>',
    HTML,
  ],
  [
    '<p class="mt-5 max-w-lg font-display text-xl leading-snug text-bone/90 sm:mt-6 sm:text-2xl">Bespoke Body Horror, Folk Horror, and Experimental Art House film scores — <span class="text-mist">bowed metal, prepared strings, and psychological dread composed to picture for prestige cinema, TV, and games.</span></p>',
    '<p class="mt-5 max-w-md font-display text-xl leading-snug text-bone/90 sm:mt-6 sm:text-2xl">Experimental psychological horror film composer <span class="text-mist">for independent and arthouse cinema.</span></p>',
    HTML,
  ],
  // Primary identity (2026-10-26): the hero subhead states the specialist
  // positioning verbatim in the same two-tone slot. The bundle renders the
  // subhead as two string children, so each half is its own pair; the H1
  // above it ("Dark, atmospheric horror scores...") is deliberately kept.
  ['Original music for psychological horror, thrillers, and dark sci-fi,', 'Experimental psychological horror film composer', BUNDLE],
  ['composed for film, TV, and games.', 'for independent and arthouse cinema.', BUNDLE],
  ['Start an inquiry', 'Request a scoring quote', BOTH],
  // User-provided biography; HTML emphasis is shared with the static snapshot.
  ["Zazie Kanwar-Torge is an award-winning composer, experimental producer, and multi-instrumentalist. Under Zazie Productions, he writes and performs original scores for psychological, folk, and body horror, supernatural thrillers, and dark sci-fi.", "<strong>Zazie Kanwar-Torge</strong> is an award-winning film composer, experimental producer, and multi-instrumentalist specializing in <strong>experimental psychological horror for independent and arthouse cinema, folk horror, body horror, supernatural thrillers, and dark science fiction</strong>. Through Zazie Productions, he creates original film scores and immersive sonic atmospheres that explore dread, dissonance, isolation, and the uncanny.", "bundle"],
  [
    'specializing in <strong>experimental art house, psychological horror, folk horror, body horror, supernatural thrillers, and dark science fiction</strong>.',
    'specializing in <strong>experimental psychological horror for independent and arthouse cinema, folk horror, body horror, supernatural thrillers, and dark science fiction</strong>.',
    HTML,
  ],
  ["His palette combines struck strings, bowed metal, hybrid orchestration, and custom synths, shaped to picture for projects from shorts to features.", "Working at the intersection of cinematic scoring, musique concrète, and electroacoustic composition, his distinctive palette combines bowed metal, struck strings, experimental synthesis, and hybrid orchestration. His work has been featured at <strong>Ars Electronica 2026</strong>, performed in 20.4-channel spatial audio, and selected for international experimental music and film programs, including <strong>MUSLAB/Cero Records</strong> and <strong>EXiS in Seoul</strong>. Previously commissioned by the <strong>Black Mountain College Museum + Arts Center</strong>, he also develops original audio instruments and experimental sound libraries.</p><p>Drawing on a background in experimental film, sound art, and audiovisual composition, Zazie approaches each score as an extension of the film's psychological and emotional world, creating visceral, atmospheric music tailored to independent shorts, feature films, series, and horror video games.", "bundle"],
  ['Drawing on a background in experimental film, sound art, and audiovisual composition, Zazie approaches each score as an extension of the film\'s psychological and emotional world, creating visceral, atmospheric music tailored to independent shorts, feature films, and unconventional genre cinema.', 'Drawing on a background in experimental film, sound art, and audiovisual composition, Zazie approaches each score as an extension of the film\'s psychological and emotional world, creating visceral, atmospheric music tailored to independent shorts, feature films, series, and horror video games.', HTML],
  [
    'src:It.images.headshot,alt:It.composer,width:864,height:996',
    'src:It.images.headshot,alt:"Zazie Kanwar-Torge: Experimental art house, psychological, folk, and body horror composer photographed with studio instrumentation.",width:864,height:996',
    BUNDLE,
  ],
  [
    '<img alt="Zazie Kanwar-Torge" class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" src="/images/headshot.jpg"',
    '<img alt="Zazie Kanwar-Torge: Experimental art house, psychological, folk, and body horror composer photographed with studio instrumentation." class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" src="/images/headshot.jpg"',
    HTML,
  ],
  ['Zazie Productions LLC · Experimental Art House &amp; Psychological, Folk &amp; Body Horror Scores', 'Zazie Productions LLC · Psychological horror film scores', HTML],
  [' · Atmospheric horror scores', ' · Psychological horror film scores', BUNDLE],
  ['[["/hire-a-composer","Hire a composer"],["/sound-design","Sound design"]', '[["/hire-a-composer","Hire a horror composer"],["/how-to-hire-a-horror-composer","Hiring guide"],["/sound-design","Sound design"]', BUNDLE],
  ['<a href="/hire-a-composer" class="text-[10px] uppercase tracking-[0.25em] text-mist transition-colors hover:text-blood">Hire a composer</a><a href="/sound-design"', '<a href="/hire-a-composer" class="text-[10px] uppercase tracking-[0.25em] text-mist transition-colors hover:text-blood">Hire a horror composer</a><a href="/how-to-hire-a-horror-composer" class="text-[10px] uppercase tracking-[0.25em] text-mist transition-colors hover:text-blood">Hiring guide</a><a href="/sound-design"', HTML],
  // Keep a direct, 44px quote action visible on phones; the full section menu
  // remains available beside it. aria-expanded follows the React menu state.
  [']}),u.jsx("button",{className:"border border-white/10 p-2.5 text-bone transition-colors hover:border-blood/50 xl:hidden",onClick:()=>r(e=>!e),"aria-label":n?"Close menu":"Open menu",', ']}),u.jsx("a",{href:"/contact",className:"zp-mobile-quote",children:"Get a quote"}),u.jsx("button",{type:"button",className:"zp-menu-button xl:hidden",onClick:()=>r(e=>!e),"aria-expanded":n,"aria-controls":"mobile-navigation","aria-label":n?"Close menu":"Open menu",', BUNDLE],
  ['<button class="border border-white/10 p-2.5 text-bone transition-colors hover:border-blood/50 xl:hidden" aria-label="Open menu">', '<a href="/contact" class="zp-mobile-quote">Get a quote</a><button type="button" class="zp-menu-button xl:hidden" aria-expanded="false" aria-controls="mobile-navigation" aria-label="Open menu">', HTML],
  ['u.jsxs("nav",{className:"hidden items-center gap-1 xl:flex",', 'u.jsxs("nav",{"aria-label":"Primary navigation",className:"hidden items-center gap-1 xl:flex",', BUNDLE],
  ['n&&u.jsx(Bt.div,{initial:{opacity:0,height:0},animate:{opacity:1,height:"auto"},exit:{opacity:0,height:0},className:"overflow-hidden border-t border-white/5 bg-void/95 backdrop-blur-xl xl:hidden",', 'n&&u.jsx(Bt.nav,{initial:{opacity:0,height:0},animate:{opacity:1,height:"auto"},exit:{opacity:0,height:0},id:"mobile-navigation","aria-label":"Mobile navigation",className:"overflow-hidden border-t border-white/5 bg-void/95 backdrop-blur-xl xl:hidden",', BUNDLE],
  ['tj.map((e,t)=>u.jsxs(Bt.div,{initial:{opacity:0,y:16},whileInView:{opacity:1,y:0}', 'tj.map((e,t)=>u.jsxs(Bt.article,{initial:{opacity:0,y:16},whileInView:{opacity:1,y:0}', BUNDLE],
  ['u.jsxs("div",{className:"relative min-h-[100svh] bg-void text-bone","data-source-loc":"src/App.tsx:26:6",children:[u.jsx("div",{className:"grain","aria-hidden":!0,"data-source-loc":"src/App.tsx:27:8"}),u.jsx("div",{className:"vignette opacity-80","aria-hidden":!0,"data-source-loc":"src/App.tsx:28:8"}),u.jsx(zv,{"data-source-loc":"src/App.tsx:29:8"}),u.jsx(H5,{"data-source-loc":"src/App.tsx:30:8"}),u.jsxs("main",{className:"relative z-[2] overflow-x-hidden pb-[max(1.5rem,env(safe-area-inset-bottom))]","data-source-loc":"src/App.tsx:31:8"', 'u.jsxs(u.Fragment,{children:[u.jsx("div",{className:"grain","aria-hidden":!0,"data-source-loc":"src/App.tsx:27:8"}),u.jsx("div",{className:"vignette opacity-80","aria-hidden":!0,"data-source-loc":"src/App.tsx:28:8"}),u.jsx(zv,{"data-source-loc":"src/App.tsx:29:8"}),u.jsx(H5,{"data-source-loc":"src/App.tsx:30:8"}),u.jsxs("main",{id:"main-content",className:"relative z-[2] overflow-x-hidden pb-[max(1.5rem,env(safe-area-inset-bottom))]","data-source-loc":"src/App.tsx:31:8"', BUNDLE],
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
  ['width:640,height:960,alt:"",className:"h-full w-full object-cover object-top opacity-95 transition-transform duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"', 'width:e.width||640,height:e.height||960,alt:e.alt||e.title+" poster artwork",className:"h-full w-full "+(e.contain?"zp-poster-contain":"object-cover object-top group-hover:scale-105")+" opacity-95 transition-transform duration-700 ease-out group-hover:opacity-100"', BUNDLE],
  ['alt:`${e.title} poster`,className:"h-full w-full object-cover object-top","data-source-loc":"src/components/PosterWall.tsx:96:1"', 'alt:e.alt||`${e.title} poster`,loading:"lazy",decoding:"async",className:"h-full w-full "+(e.contain?"zp-poster-contain":"object-cover object-top"),"data-source-loc":"src/components/PosterWall.tsx:96:1"', BUNDLE],
  ['src:n.thumb,alt:`${n.title}: still from the film`,width:1280', 'src:n.thumb,alt:n.alt||`${n.title}: still from the film`,width:1280', BUNDLE],
  ['e.tagline&&u.jsxs("p",{className:"mt-5 font-display text-lg italic leading-snug text-bone/90","data-source-loc":"src/components/PosterWall.tsx:114:1",children:["“",e.tagline,"”"]})', 'e.tagline&&u.jsxs("p",{className:"mt-5 font-display text-lg italic leading-snug text-bone/90","data-source-loc":"src/components/PosterWall.tsx:114:1",children:["“",e.tagline,"”"]}),e.summary&&u.jsx("p",{className:"mt-4 text-base leading-relaxed text-mist",children:e.summary})', BUNDLE],
  ['linkcol=c41e1e', 'linkcol=e65650', BUNDLE],
  // Film sample cards carry a semantic ID only — no music-description text or
  // permalink block under the video (the pristine bundle renders none, and
  // patchStatic strips any that an older snapshot still carries).
  ['return u.jsxs(Bt.article,{initial:{opacity:0,y:14}', 'return u.jsxs(Bt.article,{id:n.slug?"sample-"+n.slug:void 0,initial:{opacity:0,y:14}', BUNDLE],
  // Hero artwork. The shipped markup sized the portrait off its *height*
  // (`h-full w-auto`) inside a 46%-wide, 92%-tall panel and then clipped the
  // result with `object-cover`, so the poster art (896x1152) was centred-cropped
  // and spilled left past the panel that carried its gradients: the scrimmed
  // band and the unscrimmed band met in a hard vertical seam, and the cropped
  // side panels of the artwork read as a torn image. The plate now derives its
  // width from the artwork's own ratio and is framed at full opacity (see the
  // .zp-hero-art* rules in index.html), so the whole poster is shown without
  // masks or a bottom fade. Alt text and the lazy attribute ride along here;
  // the portrait is display:none below 1024px.
  [
    'className:"pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] lg:block","aria-hidden":!0,"data-source-loc":"src/components/Hero.tsx:56:6",children:u.jsxs("div",{className:"absolute bottom-0 right-0 h-[92%] w-full","data-source-loc":"src/components/Hero.tsx:63:8",children:[u.jsxs("picture",{children:[u.jsx("source",{srcSet:"/images/hero-portrait.avif",type:"image/avif"}),u.jsx("img",{src:It.images.hero,alt:"",width:896,height:1152,decoding:"async",className:"absolute bottom-0 right-0 h-full w-auto max-w-none object-cover object-top opacity-80","data-source-loc":"src/components/Hero.tsx:64:10"})]}),u.jsx("div",{className:"absolute inset-0 bg-gradient-to-l from-transparent via-void/20 to-void","data-source-loc":"src/components/Hero.tsx:69:10"}),u.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-void via-transparent to-void/40","data-source-loc":"src/components/Hero.tsx:70:10"}),u.jsx("div",{className:"absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-void","data-source-loc":"src/components/Hero.tsx:71:10"}),u.jsx("div",{className:"absolute inset-y-[15%] right-0 w-px bg-gradient-to-b from-transparent via-blood/50 to-transparent","data-source-loc":"src/components/Hero.tsx:73:10"})]})',
    'className:"pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] lg:block","data-source-loc":"src/components/Hero.tsx:56:6",children:u.jsxs("div",{className:"zp-hero-art","data-source-loc":"src/components/Hero.tsx:63:8",children:[u.jsx("div",{className:"zp-hero-art-plate",children:u.jsxs("picture",{children:[u.jsx("source",{srcSet:"/images/hero-portrait.avif",type:"image/avif"}),u.jsx("img",{src:It.images.hero,alt:"Zazie Productions: Experimental art house, psychological, folk, and body horror film scores by Zazie Kanwar-Torge featuring bowed metal and experimental synthesis.",width:896,height:1152,loading:"lazy",decoding:"async",className:"absolute inset-0 h-full w-full object-contain","data-source-loc":"src/components/Hero.tsx:64:10"})]})}),u.jsx("div",{className:"zp-hero-art-scrim","aria-hidden":!0})]})',
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
  ['32-cue showreel', '30-cue showreel', HTML],
  // Give visitors a clear route to the downloadable reel in both the static
  // first paint and React's replacement render. The ZIP itself is prepared on
  // the archive page, where individual MP3 links also work without JavaScript.
  [
    'children:"Browse and play original horror cues by mood."})]})',
    'children:"Browse and play original horror cues by mood."}),u.jsxs("a",{href:"/reel#download",className:"mt-5 inline-flex min-h-[48px] items-center gap-2 border border-ash px-5 py-3 text-xs uppercase tracking-[0.2em] text-bone transition-colors hover:border-blood",children:[u.jsx("span",{"aria-hidden":!0,children:"↓"}),"Download demo reel"]})]})',
    BUNDLE,
  ],
  [
    '<p class="mt-4 max-w-lg text-sm leading-relaxed text-mist md:text-base">Browse and play original horror cues by mood.</p></div>',
    '<p class="mt-4 max-w-lg text-sm leading-relaxed text-mist md:text-base">Browse and play original horror cues by mood.</p><a href="/reel#download" class="mt-5 inline-flex min-h-[48px] items-center gap-2 border border-ash px-5 py-3 text-xs uppercase tracking-[0.2em] text-bone transition-colors hover:border-blood"><span aria-hidden="true">↓</span>Download demo reel</a></div>',
    HTML,
  ],
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
  // Testimonials removed (2026-10-24): no attributable, permissioned quotes to
  // publish, so the "5.0 collaborator rating" hero badge and its divider come
  // out with the section itself. The unreferenced statements (cj, zi, t1, s1)
  // are cut in patchBundle; the matching static markup comes out in
  // patchStatic. Without the badge pair, the zi/t1 cut below would leave the
  // hero pointing at a component that no longer exists.
  [
    'u.jsxs("a",{href:"#reviews",className:"inline-flex items-center gap-2.5 transition-colors hover:text-bone","data-source-loc":"src/components/Hero.tsx:175:12",children:[u.jsx(zi,{rating:5,size:"sm","data-source-loc":"src/components/Hero.tsx:179:14"}),u.jsxs("span",{className:"text-[11px] text-mist","data-source-loc":"src/components/Hero.tsx:180:14",children:[u.jsx("span",{className:"font-semibold text-[#F5C518]","data-source-loc":"src/components/Hero.tsx:181:16",children:"5.0"})," collaborator rating"]})]}),u.jsx("span",{className:"hidden h-4 w-px bg-white/10 sm:block","aria-hidden":!0,"data-source-loc":"src/components/Hero.tsx:184:12"}),',
    '',
    BUNDLE,
  ],
  ['u.jsx(cj,{"data-source-loc":"src/App.tsx:46:10"}),', '', BUNDLE],
  // Section order: the biography (#about, rj) now sits before the compilations
  // section (see addCompilationsSection / patchStatic), so the numbered
  // kickers renumber with it — Biography 05→03, Approach 03→04, Services
  // 04→05; Contact stays 06. The HTML-only services pair migrates a snapshot
  // already carrying the previous build's "04 · Scoring services"; it must run
  // before the BOTH pair below, whose bundle source still reads "Scope and
  // budget" and whose static side then sees the new text and skips.
  ['03 · Approach', '04 · Approach', BOTH],
  ['05 · Biography', '03 · Biography', BOTH],
  ['04 · Scoring services', '05 · Scoring services', HTML],
  // Services heading
  ['04 · Scope and budget', '05 · Scoring services', BOTH],
  ['Build a scope and estimate', 'Rates & estimates', BUNDLE],
  ['Build a scope and estimate', 'Rates &amp; estimates', HTML],
  ['Choose a project type, scored runtime, complexity, and delivery needs.', 'Packages are priced by scored music minutes, not film length.', BOTH],
  ["Estimates scale with your project's funding.", 'Preliminary estimate — final quotation subject to creative scope and written agreement.', BUNDLE],
  ['Packages are priced by scored music minutes, not film length. Estimates are indicative and nonbinding.', 'Packages are priced by scored music minutes, not film length. Preliminary estimate — final quotation subject to creative scope and written agreement.', HTML],
  // Contact
  ['Share your format, runtime, timeline, and budget. The form prepares an email for you to review and send.', 'Only your name and email are needed to start. Project details are optional; the form prepares an email for you to review and send.', BUNDLE],
  ['Share your format, scored minutes, timeline, and budget.', 'Only your name and email are needed to start. Project details are optional; the form prepares an email for you to review and send.', HTML],
  // Repair the duplicate sentence present in the latest static homepage snapshot.
  ['Only your name and email are needed to start. Project details are optional; the form prepares an email for you to review and send. The form prepares an email for you to review and send.', 'Only your name and email are needed to start. Project details are optional; the form prepares an email for you to review and send.', HTML],
  ['gu=["Short film","Feature","Series episode","Game / interactive","Installation / art"]', 'gu=["Not sure yet","Short film","Feature","Series episode","Game / interactive","Installation / art"]', BUNDLE],
  ['a1=["Psychological / atmospheric horror","Supernatural dread","Body horror (musical atmosphere)","Folk horror","Techno-thriller","Cosmic dread","Dark drama / thriller","Game adaptive score","Other / hybrid cinematic"]', 'a1=["Not sure yet","Psychological / atmospheric horror","Supernatural dread","Body horror (musical atmosphere)","Folk horror","Techno-thriller","Cosmic dread","Dark drama / thriller","Game adaptive score","Other / hybrid cinematic"]', BUNDLE],
  ['<select class="w-full border border-ash bg-void px-4 py-3 text-sm text-bone outline-none focus:border-blood" aria-label="Theme / tone"><option value="Not sure yet" selected>Not sure yet</option><option value="Experimental art house">Experimental art house</option><option value="Psychological / atmospheric horror">Psychological / atmospheric horror</option>', '<select class="w-full border border-ash bg-void px-4 py-3 text-sm text-bone outline-none focus:border-blood" aria-label="Theme / tone"><option value="Not sure yet" selected>Not sure yet</option><option value="Psychological / atmospheric horror">Psychological / atmospheric horror</option>', HTML],
  ['<select class="w-full border border-ash bg-void px-4 py-3 text-sm text-bone outline-none focus:border-blood" aria-label="Format"><option value="Short film">Short film</option>', '<select class="w-full border border-ash bg-void px-4 py-3 text-sm text-bone outline-none focus:border-blood" aria-label="Format"><option value="Not sure yet" selected>Not sure yet</option><option value="Short film">Short film</option>', HTML],
  ['I’ll reply within 48 hours.', 'A written quote follows review.', BOTH],
  ['label:"Runtime"', 'label:"Scored minutes (music, not film length)"', BUNDLE],
  ['placeholder:"e.g. 12 min / 90 min"', 'placeholder:"e.g. 3 scored minutes"', BUNDLE],
  ['Runtime: ${v}', 'Scored music: ${v}', BUNDLE],
  ['>Runtime<', '>Scored minutes (music, not film length)<', HTML],
  ['placeholder="e.g. 12 min / 90 min"', 'placeholder="e.g. 3 scored minutes"', HTML],
  ['aria-label="Runtime"', 'aria-label="Scored minutes (music, not film length)"', HTML],

  // Form controls (see fieldName above). The two Contact field components are
  // patched once each and derive their name from the label they already render
  // as the accessible name, so every input and select in the form is covered -
  // and stays covered when a label is edited. The three media scrubs are single
  // instances with no label prop, so their names are literals.
  [
    'u.jsx("input",{type:r,value:t,onChange:e=>n(e.target.value),required:s,placeholder:o,className:',
    `u.jsx("input",{type:r,value:t,onChange:e=>n(e.target.value),required:s,placeholder:o,name:(${FIELD_NAME_FN})(e),className:`,
    BUNDLE,
  ],
  [
    'u.jsx("select",{value:t,onChange:e=>n(e.target.value),className:',
    `u.jsx("select",{value:t,onChange:e=>n(e.target.value),name:(${FIELD_NAME_FN})(e),className:`,
    BUNDLE,
  ],
  [
    'u.jsx("input",{type:"range",className:"seek min-h-[28px] flex-1",min:0,max:o||1,step:.1,value:s,onChange:e=>p(Number(e.target.value)),"aria-label":"Seek through current track"',
    `u.jsx("input",{type:"range",className:"seek min-h-[28px] flex-1",min:0,max:o||1,step:.1,value:s,onChange:e=>p(Number(e.target.value)),${nameAttr('Seek through current track')}"aria-label":"Seek through current track"`,
    BUNDLE,
  ],
  [
    'u.jsx("input",{type:"range",className:"seek min-h-[28px] flex-1",min:0,max:1,step:.01,value:a,onChange:e=>m(Number(e.target.value)),"aria-label":"Volume"',
    `u.jsx("input",{type:"range",className:"seek min-h-[28px] flex-1",min:0,max:1,step:.01,value:a,onChange:e=>m(Number(e.target.value)),${nameAttr('Volume')}"aria-label":"Volume"`,
    BUNDLE,
  ],
  [
    'u.jsx("input",{type:"range",className:"seek min-h-[28px] flex-1",min:0,max:r||1,step:.1,value:n,onChange:e=>i(Number(e.target.value)),"aria-label":"Seek"',
    `u.jsx("input",{type:"range",className:"seek min-h-[28px] flex-1",min:0,max:r||1,step:.1,value:n,onChange:e=>i(Number(e.target.value)),${nameAttr('Seek')}"aria-label":"Seek"`,
    BUNDLE,
  ],
];

/** Budget options come from the package list; the bundle reads xu[]. */
const BUNDLE_BUDGET_OLD = 'xu=["Under $300","$300 - $500","$500 - $700","$700 - $900","$900+","Flexible / discuss"]';
const BUNDLE_BUDGET_DEFAULT_OLD = 'useState(xu[1])';

/**
 * The hero's right-hand artwork panel: one plate (the poster, whole, at its own
 * aspect ratio) plus the legacy scrim node, hidden by CSS. All geometry and
 * framing lives in the .zp-hero-art* rules in index.html so the prerendered and
 * React renders cannot drift; this markup only has to match the bundle's output.
 */
const HERO_ART_HTML =
  '<div class="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] lg:block"><div class="zp-hero-art"><div class="zp-hero-art-plate"><picture><source srcset="/images/hero-portrait.avif" type="image/avif"><img alt="Zazie Productions: Experimental art house, psychological, folk, and body horror film scores by Zazie Kanwar-Torge featuring bowed metal and experimental synthesis." class="absolute inset-0 h-full w-full object-contain" src="/images/hero-portrait.jpg" width="896" height="1152" loading="lazy" decoding="async"></picture></div><div class="zp-hero-art-scrim" aria-hidden="true"></div></div></div>';

const ISLAND_OPEN = '<div class="zp-home-section zp-home-island" data-zp-island="estimator"><div class="zp-shell">';
const ISLAND_CLOSE = '</div></div>';
const SERVICES_HEADER = [
  '<div class="mb-10 max-w-2xl sm:mb-14">',
  '<p class="mb-3 text-[10px] uppercase tracking-[0.35em] text-blood sm:text-[11px] sm:tracking-[0.4em]">05 · Scoring services</p>',
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

/** Same lookup for a `const name = ...;` statement (the testimonials data). */
function findTopLevelVariable(source, name) {
  const sf = ts.createSourceFile('bundle.js', source, ts.ScriptTarget.ES2020, true, ts.ScriptKind.JS);
  const hits = sf.statements.filter(
    (s) =>
      ts.isVariableStatement(s) &&
      s.declarationList.declarations.some((d) => ts.isIdentifier(d.name) && d.name.text === name),
  );
  if (hits.length !== 1) throw new Error(`expected exactly one top-level variable ${name}, found ${hits.length}`);
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
  if (tracks[1].title !== 'The Fatal Overdose') throw new Error('bundle: The Fatal Overdose must be the second track');
  if (new Set(tracks.map((track) => track.id)).size !== tracks.length) throw new Error('bundle: duplicate showreel track IDs');
  for (const retired of ['Dark Thriller Cinematic Cue', 'Screams of The Damned']) {
    if (tracks.some((track) => track.title === retired)) throw new Error(`bundle: retired track remains: ${retired}`);
  }
  return tracks;
}

function escapeStaticText(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Apply `transform` to the markup only, never to script/style/template bodies. */
function mapMarkup(html, transform) {
  return html
    .split(/(<(?:script|style|template)\b[\s\S]*?<\/(?:script|style|template)>)/i)
    .map((part, index) => (index % 2 === 1 ? part : transform(part)))
    .join('');
}

/** The name addFieldNames gives a control with this accessible name. */
function derivedFieldName(attrs) {
  const label = /aria-label\s*=\s*"([^"]*)"/i.exec(attrs)?.[1];
  return label === undefined ? null : fieldName(label.replace(/&amp;/g, '&'));
}

/**
 * Give every control in the prerendered snapshot the name the bundle derives at
 * render time (fieldName). Idempotent - a control that already carries an id or
 * a name is left alone - and a control with no accessible name to derive from is
 * left untouched rather than guessed at, which tools/check-forms.mjs then fails
 * on by name.
 */
function addFieldNames(html) {
  let count = 0;
  const named = mapMarkup(html, (markup) =>
    markup.replace(/<(input|select|textarea)\b([^>]*)>/gi, (tag, control, attrs) => {
      if (/\b(?:id|name)\s*=/i.test(attrs)) return tag;
      const value = derivedFieldName(attrs);
      if (value === null) return tag;
      count += 1;
      return `<${control}${attrs} name="${value}">`;
    }),
  );
  return { html: named, count };
}

/**
 * The inverse of addFieldNames, run at the top of patchStatic. The PAIRS table
 * matches markup by exact text and several entries span the closing `>` of a
 * select or input, so the names this script wrote on the previous build would
 * stop those pairs matching on the next one. Removing exactly the attributes
 * this script derives (and nothing else) lets a rebuild read the snapshot as if
 * the names were never there, then put them back at the end.
 */
function stripDerivedFieldNames(html) {
  return mapMarkup(html, (markup) =>
    markup.replace(/<(input|select|textarea)\b([^>]*)>/gi, (tag, control, attrs) => {
      const current = /\sname="([^"]*)"/i.exec(attrs)?.[1];
      if (current === undefined) return tag;
      if (/\sid\s*=/i.test(attrs)) return tag;
      if (current !== derivedFieldName(attrs)) return tag;
      return `<${control}${attrs.replace(/\sname="[^"]*"/i, '')}>`;
    }),
  );
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
  // Keep explicit opener protection when React replaces the static homepage.
  let out = orig.replaceAll('rel:"noreferrer"', 'rel:"noopener noreferrer"');
  for (const [oldText, newText, target] of PAIRS) {
    if (target === HTML) continue;
    const n = countOf(out, oldText);
    if (n !== 1) throw new Error(`bundle: "${oldText.slice(0, 60)}" matched ${n} times, expected 1`);
    out = out.replace(oldText, () => newText);
  }
  // The Beautiful Wrongness is the default; retain main's promotion of The
  // Fatal Overdose immediately after it. IDs remain stable audio-file mappings;
  // visible row numbers already come from each track's queue index.
  const tracksMatch = out.match(/tracks:\[([\s\S]*?)\],projects:/);
  if (!tracksMatch) throw new Error('bundle: homepage player track list not found');
  const tracks = tracksMatch[1].split('},{').map((track) =>
    `{${track.replace(/^\{/, '').replace(/\}$/, '')}}`
  );
  const fatalIndex = tracks.findIndex((track) => track.includes('title:"The Fatal Overdose"'));
  if (tracks.length !== 30 || fatalIndex < 0) throw new Error('bundle: expected 30 tracks including The Fatal Overdose');
  if (!tracks[0].includes('title:"The Beautiful Wrongness"')) throw new Error('bundle: The Beautiful Wrongness must remain first');
  const [fatal] = tracks.splice(fatalIndex, 1);
  tracks.splice(1, 0, fatal);
  out = out.replace(tracksMatch[0], `tracks:[${tracks.join(',')}],projects:`);

  // Enrich It.projects with slug so K5 renders the semantic `sample-${slug}` anchor.
  {
    const projStart = out.indexOf('projects:[');
    const projEnd = out.indexOf('],images:{', projStart);
    if (projStart < 0 || projEnd < 0) throw new Error('bundle: It.projects block not found');
    let projSlice = out.slice(projStart, projEnd);
    for (const sample of FILM_SAMPLES_META) {
      const marker = `{title:${JSON.stringify(sample.title)},`;
      if (countOf(projSlice, marker) !== 1) throw new Error(`bundle: It.projects entry not found for ${sample.title}`);
      projSlice = projSlice.replace(
        marker,
        () => `{title:${JSON.stringify(sample.title)},slug:${JSON.stringify(sample.slug)},alt:${JSON.stringify(sample.alt)},`,
      );
    }
    out = out.slice(0, projStart) + projSlice + out.slice(projEnd);
  }

  // Enrich PosterWall data (n1) with slug, meta, and summary from homePosterClientData.
  {
    const n1Cut = findTopLevelVariable(out, 'n1');
    let n1Slice = out.slice(n1Cut.start, n1Cut.end);
    for (const posterMeta of homePosterClientData) {
      const escapedTitle = posterMeta.title.replace(/'/g, "\\'");
      const candidates = [`{title:"${posterMeta.title}",`, `{title:"${escapedTitle}",`];
      const marker = candidates.find((c) => n1Slice.includes(c));
      if (!marker) throw new Error(`bundle: n1 entry not found for ${posterMeta.title}`);
      n1Slice = n1Slice.replace(
        marker,
        () =>
          `${marker}slug:${JSON.stringify(posterMeta.slug)},alt:${JSON.stringify(posterMeta.alt)},meta:${JSON.stringify(posterMeta.meta)},summary:${JSON.stringify(posterMeta.summary)},`,
      );
    }
    out = out.slice(0, n1Cut.start) + n1Slice + out.slice(n1Cut.end);
  }

  // Replace F5 so PosterWall cards render as <article id="poster-${slug}"> with artwork only; summaries remain in the clicked lightbox.
  {
    const cut = findTopLevelFunction(out, 'F5');
    const f5Replacement =
      'function F5({film:e,delay:t=0,onOpen:n}){return u.jsxs("article",{id:e.slug?"poster-"+e.slug:void 0,className:"zp-poster-card flex flex-col border border-ash bg-smoke transition-all duration-500 hover:border-blood/60 hover:shadow-[0_12px_40px_rgba(80,0,0,0.35)]",children:[u.jsx(Bt.button,{type:"button",initial:!1,animate:{opacity:1,y:0},onClick:n,className:"group relative w-full overflow-hidden bg-smoke text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blood","aria-label":`View ${e.title} poster`,"data-home-poster":e.slug,"data-source-loc":"src/components/PosterWall.tsx:166:1",children:u.jsxs("div",{className:"relative aspect-[2/3] overflow-hidden bg-void","data-source-loc":"src/components/PosterWall.tsx:177:1",children:[u.jsxs("picture",{children:[u.jsx("source",{srcSet:e.thumbA.replace("-640.avif","-400.avif")+" 400w, "+e.thumbA.replace("-640.avif","-480.avif")+" 480w, "+e.thumbA+" 640w",sizes:"(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 46vw",type:"image/avif"}),u.jsx("img",{src:e.thumb,srcSet:e.thumb+" 640w, "+e.poster+" 1200w",sizes:"(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 46vw",width:e.width||640,height:e.height||960,alt:e.alt||e.title+" poster artwork",className:"h-full w-full "+(e.contain?"zp-poster-contain":"object-cover object-top group-hover:scale-105")+" opacity-95 transition-transform duration-700 ease-out group-hover:opacity-100",loading:"lazy",decoding:"async","data-source-loc":"src/components/PosterWall.tsx:178:1"})]}),u.jsx("div",{className:"pointer-events-none absolute inset-0 bg-gradient-to-t from-void via-void/5 to-transparent opacity-80","data-source-loc":"src/components/PosterWall.tsx:184:1"}),u.jsx("div",{className:"pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100","data-source-loc":"src/components/PosterWall.tsx:185:1",children:u.jsx("div",{className:"absolute inset-0 bg-blood/10 mix-blend-multiply","data-source-loc":"src/components/PosterWall.tsx:186:1"})}),u.jsxs("div",{className:"absolute inset-x-0 bottom-0 z-10 p-3 sm:p-4 md:p-5","data-source-loc":"src/components/PosterWall.tsx:189:1",children:[u.jsx("h3",{className:"font-display text-base leading-tight text-bone transition-colors group-hover:text-blood sm:text-xl md:text-2xl","data-source-loc":"src/components/PosterWall.tsx:190:1",children:e.title})]})]})})]})}';
    out = out.slice(0, cut.start) + f5Replacement + out.slice(cut.end);
  }

  for (const [oldText, newText] of [[BUNDLE_BUDGET_OLD, `xu=${JSON.stringify(budgetOptions())}`], [BUNDLE_BUDGET_DEFAULT_OLD, 'useState(xu[0])']]) {
    const n = countOf(out, oldText);
    if (n !== 1) throw new Error(`bundle: "${oldText}" matched ${n} times, expected 1`);
    out = out.replace(oldText, () => newText);
  }
  // Testimonials excision, part two. The pairs above removed the render call
  // and the hero badge, so the section component (cj), the StarRating widget
  // only it and the badge used (zi + its star glyph t1), and the quotes data
  // (s1) are unreferenced. Statement-level cuts keep the minified neighbours
  // intact; each finder re-parses the current text and demands exactly one
  // top-level hit, so a future minifier rename fails the build here instead
  // of shipping a half-removed section.
  for (const name of ['cj', 'zi', 't1']) {
    const cut = findTopLevelFunction(out, name);
    out = out.slice(0, cut.start) + out.slice(cut.end);
  }
  {
    const cut = findTopLevelVariable(out, 's1');
    out = out.slice(0, cut.start) + out.slice(cut.end);
    if (/\bs1\b/.test(out)) {
      throw new Error('bundle: testimonials data s1 is still referenced after removal');
    }
  }
  const { start, end } = findTopLevelFunction(out, 'lj');
  const servicesMarkup = SERVICES_HEADER + islandHtml(false);
  const replacement = `function lj(){return u.jsx("section",{id:"services",className:"relative bg-ink py-14 sm:py-20 md:py-28",children:u.jsx("div",{className:"mx-auto max-w-7xl px-4 sm:px-6 md:px-8",dangerouslySetInnerHTML:{__html:${JSON.stringify(servicesMarkup)}}})})}`;
  out = out.slice(0, start) + replacement + out.slice(end);
  out = addCompilationsSection(out);
  // Remove unneeded explanatory paragraph under red \"Send scoring inquiry\" button
  // Pristine bundle renders: <button>Send scoring inquiry</button><p>Opens your email → ...</p>
  // That text is redundant next to the button and clutters the contact form.
  // Removal is idempotent: if already gone, no change.
  {
    const marker = ',u.jsxs(\"p\",{className:\"text-[10px] leading-relaxed text-mist\",\"data-source-loc\":\"src/components/Contact.tsx:371:1\",children:[\"Opens your email';
    const idx = out.indexOf(marker);
    if (idx !== -1) {
      // Find the matching \".\"]}) that closes this p's children array
      // The p node ends with \".\"]}) — after that comes the form wrapper close.
      // We take the nearest \".\"]}) after the marker and cut to right after it.
      const endMarker = '\".\"]})';
      const endIdx = out.indexOf(endMarker, idx);
      if (endIdx === -1) throw new Error('bundle: contact helper paragraph end not found');
      const cutEnd = endIdx + endMarker.length;
      out = out.slice(0, idx) + out.slice(cutEnd);
    }
  }
  assertBundleParses(out);
  return out;
}

/**
 * Homepage "Compilations" section (src/lib/compilations-markup.ts). It is a
 * static-markup component placed between the biography (About, rj) and the
 * press kit (I5) in App, with the biography itself moved up from its shipped
 * slot between Services (lj) and Contact (dj) so the bio sits before the
 * compilations; index.html carries the identical order (patchStatic).
 */
function addCompilationsSection(source) {
  let out = source;
  const component =
    `function zpCompilations(){return u.jsx("section",{id:"compilations",className:${JSON.stringify(SECTION_CLASS)},` +
    `children:u.jsx("div",{className:${JSON.stringify(CONTAINER_CLASS)},dangerouslySetInnerHTML:{__html:${JSON.stringify(compilationsInnerHtml())}}})})}`;
  for (const [oldText, newText] of [
    ['function I5(){return u.jsx("section",{id:"press"', `${component}function I5(){return u.jsx("section",{id:"press"`],
    // Biography before compilations, straight after the showreel (G5).
    ['u.jsx(G5,{"data-source-loc":"src/App.tsx:34:10"}),u.jsx(I5,', 'u.jsx(G5,{"data-source-loc":"src/App.tsx:34:10"}),u.jsx(rj,{"data-source-loc":"src/App.tsx:45:10"}),u.jsx(zpCompilations,{}),u.jsx(I5,'],
    // …and out of its shipped slot, so About renders exactly once.
    ['u.jsx(lj,{"data-source-loc":"src/App.tsx:44:10"}),u.jsx(rj,{"data-source-loc":"src/App.tsx:45:10"}),', 'u.jsx(lj,{"data-source-loc":"src/App.tsx:44:10"}),'],
  ]) {
    const n = countOf(out, oldText);
    if (n !== 1) throw new Error(`bundle: "${oldText.slice(0, 60)}" matched ${n} times, expected 1`);
    out = out.replace(oldText, () => newText);
  }
  return out;
}

/* ------------------------------------------------------ static copy patch */

function patchStatic(html, tracks) {
  let out = stripDerivedFieldNames(html).replaceAll('rel="noreferrer"', 'rel="noopener noreferrer"');
  const applied = [];
  for (const [oldText, newText, target] of PAIRS) {
    if (target === BUNDLE) continue;
    const n = countOf(out, oldText);
    if (n === 1) {
      out = out.replace(oldText, () => newText);
      applied.push(oldText.slice(0, 40));
    } else if (n === 0 && countOf(out, newText) >= 1) {
      continue; // already applied
    } else if (n === 0 && countOf(out, newText) === 0 && oldText === '32-cue showreel') {
      // This string lives only inside the helper paragraph removed below.
      // If the paragraph was already deleted (e.g., manual edit before a rebuild),
      // there is no copy left to transform — skip rather than fail.
      continue;
    } else {
      throw new Error(`index.html: "${oldText.slice(0, 60)}" matched ${n} times, expected 1`);
    }
  }
  // Remove unneeded explanatory paragraph under red \"Send scoring inquiry\" button
  // Static snapshot carries: <p class=\"text-[10px] leading-relaxed text-mist\">Opens your email → ...</p>
  // This must run AFTER the PAIRS above, because the pristine snapshot has
  // \"32-cue showreel\" inside this paragraph and PAIRS converts it to \"30-cue\"
  // before we delete the whole node. Idempotent: if already gone, no change.
  if (out.includes('Opens your email →')) {
    out = out.replace(/<p class="text-\[10px\] leading-relaxed text-mist">Opens your email →[\s\S]*?<\/p>/, '');
    applied.push('removed contact helper paragraph under Send scoring inquiry button');
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

  // Testimonials removed in the bundle too, so the static copy must drop the
  // same two pieces or first paint would resurrect them: the hero "5.0
  // collaborator rating" badge (plus the divider that only separated the
  // badge from the IMDb note) and the complete #reviews section. The section
  // contains no nested <section> and the badge no nested <a>, so the first
  // closer is the right one. Idempotent - once both are gone, nothing runs.
  {
    const badgeOpen = '<a href="#reviews" class="inline-flex items-center gap-2.5 transition-colors hover:text-bone">';
    const badgeStart = out.indexOf(badgeOpen);
    if (badgeStart >= 0) {
      const anchorEnd = out.indexOf('</a>', badgeStart);
      if (anchorEnd < 0) throw new Error('index.html: hero rating badge never closes');
      let badgeEnd = anchorEnd + '</a>'.length;
      const divider = '<span class="hidden h-4 w-px bg-white/10 sm:block" aria-hidden="true"></span>';
      if (out.startsWith(divider, badgeEnd)) badgeEnd += divider.length;
      out = out.slice(0, badgeStart) + out.slice(badgeEnd);
      applied.push('hero rating badge removed');
    } else if (out.includes('href="#reviews"')) {
      throw new Error('index.html: a #reviews link exists in an unexpected shape');
    }
    const reviewsStart = out.indexOf('<section id="reviews"');
    if (reviewsStart >= 0) {
      const reviewsEnd = out.indexOf('</section>', reviewsStart);
      if (reviewsEnd < 0) throw new Error('index.html: #reviews section never closes');
      out = out.slice(0, reviewsStart) + out.slice(reviewsEnd + '</section>'.length);
      applied.push('reviews section removed');
    } else if (out.includes('id="reviews"')) {
      throw new Error('index.html: a #reviews target exists in an unexpected shape');
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

  // Biography before compilations: #about is lifted out of its shipped slot
  // (between #services and #contact) and the two sections are placed together
  // straight after the showreel, biography first — the same order the bundle
  // renders (addCompilationsSection). Idempotent: both sections are extracted
  // wherever they currently sit and re-inserted in this order, and the
  // compilations markup is regenerated, so a change to the data still
  // reaches index.html.
  {
    const section = compilationsSectionHtml();
    const aboutMatch = /<section id="about"[\s\S]*?<\/section>/.exec(out);
    if (!aboutMatch) throw new Error('index.html: #about (biography) section not found');
    const about = aboutMatch[0];
    out = out.replace(about, () => '');
    out = out.replace(/<section id="compilations"[\s\S]*?<\/section>/, () => '');
    const showreelStart = out.indexOf('<section id="showreel"');
    if (showreelStart < 0) throw new Error('index.html: #showreel section not found');
    const at = out.indexOf('</section>', showreelStart) + '</section>'.length;
    out = out.slice(0, at) + about + section + out.slice(at);
    applied.push('biography placed before the compilations section, after the showreel');
  }

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

  // Flatten div#root > div.relative > main.relative into semantic direct children of #root.
  if (out.includes('<div id="root" tabindex="-1">\n<div class="relative min-h-[100svh] bg-void text-bone">')) {
    out = out.replace(
      '<div id="root" tabindex="-1">\n<div class="relative min-h-[100svh] bg-void text-bone">',
      '<div id="root" class="relative min-h-[100svh] bg-void text-bone" tabindex="-1">',
    );
    out = out.replace('</footer></div>\n</div>', '</footer>\n</div>');
    applied.push('flattened #root outer div wrapper');
  }

  // Ensure <main> carries id="main-content" and <nav> in <header> carries aria-label="Primary navigation".
  if (out.includes('<main class="relative z-[2]')) {
    out = out.replace('<main class="relative z-[2]', '<main id="main-content" class="relative z-[2]');
    applied.push('added id="main-content" to <main>');
  }
  if (out.includes('<nav class="hidden items-center gap-1 xl:flex">')) {
    out = out.replace(
      '<nav class="hidden items-center gap-1 xl:flex">',
      '<nav aria-label="Primary navigation" class="hidden items-center gap-1 xl:flex">',
    );
    applied.push('added aria-label="Primary navigation" to header <nav>');
  }

  // Convert the 3 Approach cards in #method from generic <div> to semantic <article>.
  {
    const methodStart = out.indexOf('<section id="method"');
    const methodEnd = out.indexOf('</section>', methodStart);
    if (methodStart >= 0 && methodEnd > methodStart) {
      const beforeMethod = out.slice(methodStart, methodEnd);
      const afterMethod = beforeMethod.replace(
        /<div class="(group border border-ash bg-ink\/70 p-5 transition-colors hover:border-blood\/40 sm:p-7)">([\s\S]*?<p class="text-sm leading-relaxed text-mist">[\s\S]*?<\/p>)<\/div>/g,
        '<article class="$1">$2</article>',
      );
      if (afterMethod !== beforeMethod) {
        out = out.slice(0, methodStart) + afterMethod + out.slice(methodEnd);
        applied.push('converted #method cards to <article>');
      }
    }
  }

  // The 8 film sample <article> cards in #work keep id="sample-${slug}" but
  // carry no text block under the video: strip the former zp-sample-meta
  // (music description + permalink line) if an older snapshot still has it.
  // Idempotent — once the block is gone, nothing runs.
  for (const sample of FILM_SAMPLES_META) {
    const dataAttr = `data-title="${sample.title}"`;
    const pos = out.indexOf(dataAttr);
    if (pos < 0) throw new Error(`index.html: film sample card not found for ${sample.title}`);
    const articleStart = out.lastIndexOf('<article ', pos);
    const articleEnd = out.indexOf('</article>', pos);
    if (articleStart < 0 || articleEnd < 0) throw new Error(`index.html: malformed <article> for ${sample.title}`);
    let cardHtml = out.slice(articleStart, articleEnd + '</article>'.length);
    if (!cardHtml.includes(`id="sample-${sample.slug}"`)) {
      cardHtml = cardHtml.replace('<article ', `<article id="sample-${sample.slug}" `);
    }
    if (cardHtml.includes('<div class="zp-sample-meta')) {
      cardHtml = cardHtml.replace(/<div class="zp-sample-meta[\s\S]*?<\/div>(?=<\/article>)/, '');
    }
    cardHtml = cardHtml.replace(/(<img\b[^>]*?\balt=")[^"]*(")/, `$1${escapeStaticText(sample.alt)}$2`);
    if (cardHtml !== out.slice(articleStart, articleEnd + '</article>'.length)) {
      out = out.slice(0, articleStart) + cardHtml + out.slice(articleEnd + '</article>'.length);
      applied.push(`film sample ${sample.slug} synced`);
    }
  }

  // Wrap raw email display in <!--email_off-->...<!--/email_off--> so Cloudflare
  // Email Obfuscation does not rewrite mailto: or inject email-decode.min.js.
  if (!out.includes('<!--email_off-->')) {
    out = out.replace(
      '<span class="break-all text-sm">zaziediya@gmail.com</span>',
      '<!--email_off--><span class="break-all text-sm">zaziediya@gmail.com</span><!--/email_off-->',
    );
    out = out.replace(
      '<strong class="text-bone">zaziediya@gmail.com</strong>',
      '<!--email_off--><strong class="text-bone">zaziediya@gmail.com</strong><!--/email_off-->',
    );
    applied.push('wrapped visible email in <!--email_off-->');
  }

  // Ensure #top h1 span in #zp-atelier uses #e65650 (>=4.5:1 AA contrast).
  if (out.includes('-webkit-text-fill-color:#c41e1e;\n  color:#c41e1e;')) {
    out = out.replace(
      '-webkit-text-fill-color:#c41e1e;\n  color:#c41e1e;',
      '-webkit-text-fill-color:#e65650;\n  color:#e65650;',
    );
    applied.push('updated #zp-atelier h1 span contrast to #e65650');
  }

  // Form controls: the React bundle names these fields at render time, so the
  // snapshot has to carry the same names or first paint has anonymous fields.
  {
    const named = addFieldNames(out);
    if (named.html !== out) applied.push(`form controls named (${named.count})`);
    out = named.html;
  }

  return { html: out, applied };
}

/** Inline style and click-to-load script for the compilations section. */
function ensureCompilationsAssets(html) {
  let out = html;
  const style = `<style id="zp-comp-style">${COMPILATIONS_CSS}</style>`;
  const script = `<script id="zp-comp-script">${COMPILATIONS_JS}</script>`;
  for (const [id, tag, block] of [['zp-comp-style', 'style', style], ['zp-comp-script', 'script', script]]) {
    const existing = new RegExp(`<${tag} id="${id}">[\\s\\S]*?</${tag}>`);
    out = existing.test(out) ? out.replace(existing, () => block) : out.replace('</head>', () => `${block}\n</head>`);
  }
  return out;
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

// Content-hash index-*.css so any stylesheet edit automatically renames the file
// and updates index.html + sw.js (verified by tools/film-player.test.mjs).
const currentCssFile = fs.readdirSync(root).find((f) => /^index-[0-9a-f]{8}\.css$/.test(f));
if (!currentCssFile) throw new Error('index-*.css missing in repository root');
const cssContent = fs.readFileSync(path.join(root, currentCssFile), 'utf8');
const cssHash = crypto.createHash('sha256').update(cssContent).digest('hex').slice(0, 8);
const cssName = `index-${cssHash}.css`;
if (currentCssFile !== cssName) {
  fs.writeFileSync(path.join(root, cssName), cssContent, 'utf8');
  for (const f of fs.readdirSync(root)) {
    if (/^index-[0-9a-f]{8}\.css$/.test(f) && f !== cssName) fs.rmSync(path.join(root, f));
  }
}

let nextHtml = html
  .replace(/\/?index-[0-9a-f]{8}\.js/g, (m) => (m.startsWith('/') ? `/${name}` : name))
  .replace(/\/?index-[0-9a-f]{8}\.css/g, (m) => (m.startsWith('/') ? `/${cssName}` : cssName));
nextHtml = ensureEstimatorAssets(nextHtml);
nextHtml = ensureCompilationsAssets(nextHtml);
fs.writeFileSync(indexFile, nextHtml, 'utf8');

const swFile = path.join(root, 'sw.js');
if (fs.existsSync(swFile)) {
  const sw = fs.readFileSync(swFile, 'utf8');
  const nextSw = sw
    .replace(/\/index-[0-9a-f]{8}\.js/g, `/${name}`)
    .replace(/\/index-[0-9a-f]{8}\.css/g, `/${cssName}`);
  if (nextSw !== sw) fs.writeFileSync(swFile, nextSw, 'utf8');
}

console.log(`home-src: wrote ${name} (${patched.length} bytes), css ${cssName}`);
console.log(`home-src: index.html updated (${applied.length} static edits)`);
