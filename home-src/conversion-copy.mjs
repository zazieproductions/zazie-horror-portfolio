#!/usr/bin/env node
/**
 * home-src/conversion-copy.mjs
 * -----------------------------------------------------------------------------
 * Conversion-funnel copy engine for the homepage ONLY.
 *
 * Why this file exists
 * --------------------
 * The homepage has two render paths for the same visible copy:
 *
 *   - index.html            the prerendered snapshot (crawlers, no-JS, first paint)
 *   - index-<hash>.js       the minified React bundle (re-renders #root on load)
 *
 * home-src/build.mjs patches both from bundle.orig.js + the checked-in index.html.
 * This module is the single source of truth for the section-by-section rewrite;
 * it exports one COPY table and three idempotent transforms:
 *
 *   normalizeStatic(html)     NEW -> OLD + strips injected sections (run FIRST in
 *                             patchStatic, so all pre-existing PAIRS and the
 *                             section-reorder logic always see canonical text)
 *   applyBundleCopy(source)   OLD -> NEW in the patched bundle
 *   applyStaticCopy(html)     OLD -> NEW in the patched snapshot
 *   injectBundleSections()    adds the new React sections to the render tree
 *   injectStaticSections()    adds the same sections to index.html (run LAST)
 *   ensureFunnelAssets()      injects <style id="zp-fn-style"> (idempotent)
 *
 * The reverse pass is what makes a rebuild byte-identical: index.html on disk
 * already carries the new copy and the new sections, so patchStatic first puts
 * it back into the shape the older build steps expect, then re-applies the
 * rewrite at the end. See CONVERSION-FUNNEL-BLUEPRINT.md for the strategy deck.
 *
 * Guardrails
 * ----------
 *  - No invented testimonials, client quotes, ratings or outcome statistics.
 *    The "5.0 collaborator rating" badge and #reviews were removed deliberately
 *    on 2026-10-24 because there were no permissioned quotes to publish. This
 *    rewrite does NOT reintroduce them. Trust is built from verifiable credits,
 *    real press coverage, published process and written commitments instead.
 *  - Copy that lands in the BUNDLE must not contain an unescaped double quote
 *    (it sits inside a JS string literal). New copy uses typographic quotes,
 *    "and" instead of "&", and no angle brackets. assertBundleParses() still
 *    guards the result.
 *  - Legal/pricing operative wording (licences, deposits, delivery promises) is
 *    NOT restated here. New copy points at /licensing, /faq and the written
 *    quote instead of asserting a rights grant or a turnaround guarantee.
 */

/**
 * COPY entries run in order. `from`/`to` may be a plain string (identical in
 * both files) or { bundle, html } when escaping or context differs.
 * Every `from` must match exactly once in its target; every `to` must be
 * absent from the untouched file so the reverse direction is unambiguous.
 */
export const COPY = [
  /* ---------------------------------------------- 1. ATTENTION — hero #top */

  {
    id: 'hero.h1a', stage: 'attention',
    from: 'Dark, atmospheric horror scores, ',
    to: 'WE CORRUPT SILENCE ',
  },
  {
    id: 'hero.h1b', stage: 'attention',
    from: 'written to your picture.',
    to: 'TO SERVE THE FRAME.',
  },


  /* The hero keeps the wording it shipped with: "Play the showreel" and
     "Start an inquiry" (2026-10-29). The conversion rewrite to "Hear the
     showreel" / "Get a free written quote" is retired, so this table no longer
     carries hero CTA entries and normalizeStaticCopy unwinds the old labels. */


  /* -------------------------------------------- 3. DESIRE — #work samples */

  /* ----------------------------------------- 4. DESIRE — #showreel player */
  {
    id: 'reel.cta', stage: 'desire',
    from: 'Download demo reel',
    to: 'Take the reel with you',
  },

  /* --------------------------------------- 5. TRUST — #about / #compilations */
  {
    id: 'about.h2', stage: 'trust',
    from: 'The composer behind the atmosphere',
    to: 'You work with the composer, not a middleman.',
  },
  {
    id: 'about.cta', stage: 'trust',
    from: 'Start a Conversation',
    to: 'Talk to the composer directly',
  },

  /* ------------------------------------------------ 6. TRUST — #press kit */
  {
    id: 'press.h2', stage: 'trust',
    from: {
      bundle: 'src/components/PressKit.tsx:13:1",children:"Press kit"',
      html: '>Press kit</h2>',
    },
    to: {
      bundle: 'src/components/PressKit.tsx:13:1",children:"Not my opinion. Theirs."',
      html: '>Not my opinion. Theirs.</h2>',
    },
  },
  {
    id: 'press.lead.bundle', stage: 'trust',
    from: { bundle: 'Selected interviews, features, and award coverage.', html: null },
    to: { bundle: 'Independent features, interviews and award coverage — read what other people heard before you decide.', html: null },
  },
  {
    id: 'press.lead.html', stage: 'trust',
    from: { bundle: null, html: 'Selected interviews and features.' },
    to: { bundle: null, html: 'Independent features, interviews and award coverage — read what other people heard before you decide.' },
  },

  /* ---------------------------------------------- 7. DESIRE — #method cards */
  {
    id: 'method.h2', stage: 'desire',
    from: 'A distinct point of view, built for the story.',
    to: 'How the dread actually gets built.',
  },
  {
    id: 'method.lead', stage: 'desire',
    from: 'Themes, harmony, texture, and tension are shaped to picture, with clear spotting, revisions, and delivery.',
    to: 'Every cue is shaped to your picture, not a template: themes, harmony, texture and tension, with agreed spotting, defined revisions and delivery you can plan around.',
  },
  {
    id: 'method.card1.title', stage: 'desire',
    from: 'Psychological architecture',
    to: 'Tension you can control',
  },
  {
    id: 'method.card1.body', stage: 'desire',
    from: 'Cues built around how dread lands: slow-burn beds, dissociative harmony, and tension that hits the cut, not the cliché.',
    to: 'Cues built around how dread lands: slow-burn beds, dissociative harmony and releases timed to your cut — so the audience is afraid before anything happens.',
  },
  {
    id: 'method.card2.title', stage: 'desire',
    from: 'Dark atmospheric color',
    to: 'A palette that is not a preset',
  },
  {
    id: 'method.card2.body', stage: 'desire',
    from: 'Hybrid orchestral haze, sub-frequency gravity, frozen ambient space. Every color chosen for story. Never stock "scary pack" mood.',
    to: 'Hybrid orchestral haze, bowed metal, sub-frequency gravity and frozen ambient space. Every color chosen for the story. Never a stock scary-pack preset.',
  },
  {
    id: 'method.card3.title', stage: 'desire',
    from: 'Cinematic themes that stalk',
    to: 'Themes that survive the trailer cut',
  },
  {
    id: 'method.card3.body', stage: 'desire',
    from: 'Motifs that survive the festival loop and the trailer cut. Music you remember in the parking lot.',
    to: 'Motifs that survive the festival loop, the trailer cut and the scroll. Music the audience takes out of the room with them.',
  },

  /* ------------------------------- 8. TRUST — retired homepage services copy */




  /* -------------------------------------------------- 9. ACTION — #contact */
  {
    id: 'contact.h2a', stage: 'action',
    from: 'Tell me about your project.',
    to: 'Tell me about the film — and the deadline.',
  },
  {
    id: 'contact.h2b', stage: 'action',
    from: 'A written quote follows review.',
    to: 'A written quote, scope and schedule follow review.',
  },
  {
    id: 'contact.lead', stage: 'action',
    from: 'Only your name and email are needed to start. Project details are optional; the form prepares an email for you to review and send.',
    to: 'Only your name and email are required. Add a cut, a cue list or a deadline if you have them — the form prepares an email for you to review and send. No call, no commitment, no spam.',
  },
  {
    id: 'contact.submit', stage: 'action',
    from: 'Send scoring inquiry',
    to: 'Get my written quote',
  },
];

/* ------------------------------------------------------------------------- */
/* New funnel sections                                                        */
/* ------------------------------------------------------------------------- */

const CTA = (href, label, primary = false) =>
  `<a class="zp-fn-btn${primary ? '' : ' zp-fn-btn--ghost'}" href="${href}">${label}</a>`;

/**
 * Opening "obsession" manifesto (2026-10-27; tightened the same day).
 * Owner decision: run the hook hot and lean. The first pass grounded each
 * mechanism in peer-reviewed citations and a "Sources & method" honesty note;
 * the owner felt that read as an academic explainer and diluted the sell, so
 * the research links, hedged pop-science claims and the disclaimer were
 * removed. The three mechanisms are now confident, visceral, outcome-first
 * marketing claims. The opening rejection figure stays verbatim at the
 * owner's request; they will add their own disclaimer and/or long-form pieces
 * on sound, technique and the psychology of horror themselves, later.
 * The `++`/`**` emphasis from the brief is rendered as <strong>.
 */
const OBSESSION_INNER = `
<div class="zp-fn-shell">
  <p class="zp-fn-kicker">Field notes / the obsession</p>
  <h2 class="zp-fn-claim" id="zp-obsession-h">87% of independent psychological horror, folk dread, atmospheric dramas, and experimental thrillers get rejected by <strong>Sundance</strong>, <strong>SXSW</strong>, <strong>TIFF, and A24/NEON acquisitions</strong> within the first 600 seconds.</h2>
  <p class="zp-fn-quest">I became obsessed with a single question: why do certain frequencies make our bodies prepare to die?</p>
  <p class="zp-fn-lead zp-fn-study">I started studying neurobiology, weaponized sonic warfare, animal distress frequencies, and auditory pareidolia (how the human brain hallucinates voices in random frequencies).</p>
  <p class="zp-fn-lead">Quick&#8212;hum the terrifying clicking motif from <em>Hereditary</em>, the nauseating horn from <em>The Lighthouse</em>, or the descending siren of <em>Annihilation</em>.</p>
  <p class="zp-fn-bridge">Now ask yourself: does your project have a signature acoustic scar that audiences emotionally will feel in their gut?</p>
  <div class="zp-fn-actions">${CTA('#showreel', 'Hear it in 30 original cues', true)}</div>
</div>`;

const OBJECTIONS_INNER = `
<div class="zp-fn-shell">
  <p class="zp-fn-kicker">Before you commit</p>
  <h2 class="zp-fn-h2" id="zp-objections-h">The questions producers actually ask.</h2>
  <p class="zp-fn-lead">Hiring a composer is a leap of faith on a deadline. Here are straight answers and verifiable credits — no pitch, no invented testimonials, no hidden fees.</p>
  <ul class="zp-fn-proof" aria-label="Verifiable credits and catalogue">
    <li>IMDb credited</li>
    <li>Ars Electronica 2026</li>
    <li>20.4-channel spatial audio</li>
    <li>MUSLAB / Cero Records</li>
    <li>EXiS Seoul</li>
    <li>Black Mountain College Museum + Arts Center commission</li>
    <li>30-cue showreel</li>
    <li>9 selected productions</li>
    <li>24-track catalogue</li>
  </ul>
  <div class="zp-fn-faq">
    <details><summary>Will the music actually fit my edit?</summary><p>Every cue is written to picture after a spotting session. You get a written tone reference and a cue list before a note is composed, and defined consolidated revision rounds are included in every package.</p></details>
    <details><summary>What if the deadline is brutal?</summary><p>Tell me the delivery date up front and I will tell you honestly whether it is possible. Rush and expedited schedules are quoted only when availability is confirmed in writing — never assumed, never promised before the agreement.</p></details>
    <details><summary>Do I own the music?</summary><p>Rights are set out in a written agreement before work begins. Read the <a href="/licensing">licensing page</a> for the current terms, or ask for them in your quote — never assume a grant that is not in writing.</p></details>
    <details><summary>What exactly do I get delivered?</summary><p>Original music to an agreed cue list, professional WAV files, a cue list with timings for your edit, and the revision rounds in your package. Stems, alternate mixes and soundtrack mastering are quoted separately.</p></details>
    <details><summary>What if it is not right?</summary><p>Defined, consolidated revision rounds are included. A round means one consolidated set of changes to an agreed direction — you will always know where you stand and what happens next.</p></details>
    <details><summary>How much will it cost?</summary><p>Every score is quoted individually. Share your format, desired music, budget range and references; a written quote follows review of your project.</p></details>
  </div>
  <div class="zp-fn-actions">${CTA('/services', 'See services and inclusions', true)}${CTA('/faq', 'Read the full FAQ')}${CTA('/process', 'See the process')}</div>
</div>`;

/**
 * One definition drives both render paths. `anchor` is the exact string in the
 * React render array / static HTML that the section is inserted BEFORE.
 */
export const SECTIONS = [
  // "Obsession" opens the page immediately after the hero, before #posters.
  { id: 'obsession', titleId: 'zp-obsession-h', variant: 'obsession',
    bundleAnchor: 'u.jsx(Q5,{"data-source-loc":"src/App.tsx:38:10"}),',
    staticAnchor: '<section id="posters"', inner: OBSESSION_INNER },
  { id: 'objections', titleId: 'zp-objections-h', variant: 'objections',
    bundleAnchor: 'u.jsx(dj,{"data-source-loc":"src/App.tsx:47:10"})',
    staticAnchor: '<section id="contact"', inner: OBJECTIONS_INNER },
];

/* ------------------------------------------------------------------------- */
/* Styles — a standalone inline block, like #zp-comp-style.                   */
/* ------------------------------------------------------------------------- */

export const FUNNEL_CSS = `
/* Conversion funnel sections (homepage only). Scoped with zp-fn- so nothing
   here can leak into the rest of the design system. */
.zp-fn{position:relative;padding:4.5rem 1.25rem;border-top:1px solid #1e1e1e;}
.zp-fn--objections{background:#030303;}
.zp-fn--obsession{background:linear-gradient(180deg,#0a0303 0%,#030303 100%);border-top:1px solid #2a0d0d;}
.zp-fn-claim{font-family:"Cormorant Garamond",Georgia,serif;font-weight:600;font-size:clamp(1.75rem,4.2vw,3rem);line-height:1.16;color:#f0ebe3;margin:0 0 1.5rem;max-width:60rem;}
.zp-fn-claim strong{color:#e65650;font-weight:600;font-style:italic;}
.zp-fn-quest{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-size:clamp(1.3rem,2.6vw,1.85rem);line-height:1.35;color:#f0ebe3;max-width:52rem;margin:0 0 2.5rem;}
.zp-fn--obsession .zp-fn-quest{border-left:2px solid #c41e1e;padding-left:1.25rem;}
.zp-fn--obsession .zp-fn-card{background:#060303;}
.zp-fn--obsession .zp-fn-bridge{color:#f0ebe3;border-left:2px solid #e65650;}
.zp-fn-shell{max-width:72rem;margin:0 auto;}
.zp-fn-kicker{font-size:10px;letter-spacing:.38em;text-transform:uppercase;color:#e65650;margin:0 0 1rem;}
.zp-fn-h2{font-family:"Cormorant Garamond",Georgia,serif;font-weight:600;font-size:clamp(2rem,5vw,3.35rem);line-height:1.05;color:#f0ebe3;margin:0 0 1.25rem;max-width:54rem;}
.zp-fn-lead{color:#9a9590;font-size:1rem;line-height:1.7;max-width:48rem;margin:0 0 2.25rem;}
.zp-fn-study{margin-top:-1.25rem;margin-bottom:1.75rem;}
.zp-fn-grid{display:grid;gap:1px;background:#1e1e1e;border:1px solid #1e1e1e;}
.zp-fn-card{background:#030303;padding:1.6rem 1.5rem;}
.zp-fn-num{display:block;color:#e65650;font-size:10px;letter-spacing:.28em;text-transform:uppercase;margin-bottom:.9rem;}
.zp-fn-h3{font-family:"Cormorant Garamond",Georgia,serif;font-weight:600;font-size:1.4rem;line-height:1.2;color:#f0ebe3;margin:0 0 .65rem;}
.zp-fn-card p{color:#9a9590;font-size:.9rem;line-height:1.7;margin:0;}
.zp-fn-bridge{border-left:2px solid #c41e1e;padding-left:1.25rem;margin:2.25rem 0 1.75rem;max-width:48rem;color:#f0ebe3;font-family:"Cormorant Garamond",Georgia,serif;font-size:1.35rem;line-height:1.4;}
.zp-fn-actions{display:flex;flex-wrap:wrap;gap:.75rem 1.25rem;align-items:center;margin-top:1.75rem;}
.zp-fn-btn{display:inline-flex;min-height:48px;align-items:center;justify-content:center;padding:.8rem 1.5rem;background:#c41e1e;color:#f0ebe3;border:1px solid #c41e1e;font-size:11px;letter-spacing:.16em;text-transform:uppercase;text-decoration:underline;text-underline-offset:3px;transition:background-color .15s,border-color .15s;}
.zp-fn-btn:hover{background:#e65650;border-color:#e65650;color:#030303;}
.zp-fn-btn--ghost{background:transparent;color:#f0ebe3;border-color:#1e1e1e;}
.zp-fn-btn--ghost:hover{background:#1e1e1e;color:#f0ebe3;border-color:#e65650;}
.zp-fn a:focus-visible,.zp-fn summary:focus-visible{outline:2px solid #e65650;outline-offset:3px;}
.zp-fn-faq a{color:#e65650;text-decoration:underline;text-underline-offset:3px;}
.zp-fn-proof{display:flex;flex-wrap:wrap;gap:.5rem;margin:0 0 2rem;padding:0;list-style:none;}
.zp-fn-proof li{border:1px solid #1e1e1e;padding:.45rem .75rem;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#9a9590;}
.zp-fn-faq{border-top:1px solid #1e1e1e;max-width:54rem;}
.zp-fn-faq details{border-bottom:1px solid #1e1e1e;}
.zp-fn-faq summary{cursor:pointer;list-style:none;position:relative;padding:1.05rem 2.5rem 1.05rem 0;color:#f0ebe3;font-size:1rem;}
.zp-fn-faq summary::-webkit-details-marker{display:none;}
.zp-fn-faq summary::after{content:"+";position:absolute;right:.3rem;top:1rem;color:#e65650;font-size:1.2rem;line-height:1;}
.zp-fn-faq details[open] summary::after{content:"\\2212";}
.zp-fn-faq details p{color:#9a9590;font-size:.92rem;line-height:1.75;margin:0;padding:0 2rem 1.3rem 0;max-width:50rem;}
@media(min-width:768px){
  .zp-fn{padding:6.5rem 2rem;}
  .zp-fn-grid--3{grid-template-columns:repeat(3,1fr);}
}
`;

/* ------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* ------------------------------------------------------------------------- */

const countOf = (text, needle) => (needle ? text.split(needle).length - 1 : 0);

const side = (value, key) => (value && typeof value === 'object' ? value[key] : value);
const cleanStaticText = (value) => (typeof value === 'string' ? value.replace(/[ \t]*—[ \t]*/g, ' - ') : value);
const cleanStaticHtml = (html) => html.replace(/[ \t]*—[ \t]*/g, ' - ').replace(/[ \t]{2,}-[ \t]{2,}/g, ' - ');
const fromBundle = (entry) => side(entry.from, 'bundle');
const fromHtml = (entry) => side(entry.from, 'html');
const toBundle = (entry) => side(entry.to, 'bundle');
const toHtml = (entry) => side(entry.to, 'html');

/** Strict, order-sensitive replacement. Throws loudly on drift. */
function replaceSide(text, entries, from, to, label, { allowAlreadyApplied }) {
  let out = text;
  for (const entry of entries) {
    const oldText = from(entry);
    const newText = to(entry);
    if (!oldText || !newText) continue;
    const n = countOf(out, oldText);
    if (n === 1) {
      out = out.replace(oldText, () => newText);
    } else if (n === 0 && allowAlreadyApplied && countOf(out, newText) >= 1) {
      continue; // already in the desired state
    } else {
      throw new Error(`conversion-copy/${label}: ${entry.id} matched ${n} times, expected 1 — ${JSON.stringify(oldText.slice(0, 70))}`);
    }
  }
  return out;
}

/** OLD -> NEW in the patched React bundle (always built from pristine). */
export function applyBundleCopy(source) {
  return replaceSide(source, COPY, fromBundle, toBundle, 'bundle', { allowAlreadyApplied: false });
}

/** OLD -> NEW in the patched static snapshot. Idempotent on rebuild. */
export function applyStaticCopy(html) {
  return replaceSide(
    html,
    COPY,
    (entry) => cleanStaticText(fromHtml(entry)),
    (entry) => cleanStaticText(toHtml(entry)),
    'static',
    { allowAlreadyApplied: true },
  );
}

/**
 * NEW -> OLD. Called at the START of patchStatic so every pre-existing PAIR
 * and the #about/#compilations reorder sees the canonical text it expects.
 * Applied in reverse order so chained rewrites unwind correctly.
 */
export function normalizeStaticCopy(html) {
  const reverse = [...COPY].reverse();
  const normalizedTarget = (entry) => cleanStaticText(toHtml(entry));
  // The immediately previous build used this hero line. Normalize that
  // already-shipped version too, so the copy change remains rebuild-safe.
  const legacyHero = cleanStaticHtml(html)
    .replace('Horror scores that make them feel it ', 'Dark, atmospheric horror scores, ')
    .replace('before they see it.', 'written to your picture.');
  // The hero CTAs went back to their shipped wording on 2026-10-29
  // ("Play the showreel" / "Start an inquiry"), so an already-built document
  // has to be unwound before the rest of the patch sees canonical text.
  const ctaRestored = restoreHeroCtaLabels(legacyHero);
  const reversed = replaceSide(
    ctaRestored,
    reverse,
    normalizedTarget,
    fromHtml,
    'normalize',
    { allowAlreadyApplied: true },
  );
  return cleanStaticHtml(reversed);
}

/** Undo the retired hero CTA wording, at most once each. */
function restoreHeroCtaLabels(html) {
  let out = html;
  for (const [shipped, original] of [
    ['Hear the showreel', 'Play the showreel'],
    ['Get a free written quote', 'Start an inquiry'],
  ]) {
    const n = countOf(out, shipped);
    if (n > 1) throw new Error(`conversion-copy/normalize: "${shipped}" appears ${n} times`);
    if (n === 1) out = out.replace(shipped, () => original);
  }
  return out;
}

const POSTER_HEADER_STATIC_TITLE = '<h2 class="mb-4 font-display text-3xl leading-none text-bone sm:text-4xl md:text-6xl">Credits</h2>';

/** Replace the poster-wall header with only its simple Credits heading. */
export function simplifyPosterHeaderStatic(html) {
  const sectionStart = html.indexOf('<section id="posters"');
  const start = html.indexOf('<div class="max-w-2xl">', sectionStart);
  const end = html.indexOf('</div>', start);
  if (sectionStart < 0 || start < 0 || end < 0) throw new Error('conversion-copy/static: poster header boundary not found');
  const block = html.slice(start, end + '</div>'.length);
  if (block.includes(POSTER_HEADER_STATIC_TITLE) && !/Proof of work|Additional credits|Selected productions|Scores already out in the world|A selection of productions|Film poster covers/.test(block)) return html;
  const replacement = `<div class="max-w-2xl">${POSTER_HEADER_STATIC_TITLE}</div>`;
  return html.slice(0, start) + replacement + html.slice(end + '</div>'.length);
}

/** Same header simplification in the pristine React bundle's PosterWall JSX. */
export function simplifyPosterHeaderBundle(bundle) {
  const startMarker = 'u.jsxs("div",{className:"max-w-2xl","data-source-loc":"src/components/PosterWall.tsx:24:1",children:[';
  const endMarker = ']})]}),u.jsx("div",{className:"grid grid-cols-2';
  const start = bundle.indexOf(startMarker);
  const contentStart = start + startMarker.length;
  const end = bundle.indexOf(endMarker, contentStart);
  if (start < 0 || end < 0) throw new Error('conversion-copy/bundle: PosterWall header boundary not found');
  const originalChildren = bundle.slice(contentStart, end);
  if (!originalChildren.includes('children:"Selected productions"') || !originalChildren.includes('children:"Additional credits"')) {
    throw new Error('conversion-copy/bundle: expected PosterWall header copy not found');
  }
  const title = 'u.jsx("h2",{className:"mb-4 font-display text-3xl leading-none text-bone sm:text-4xl md:text-6xl","data-source-loc":"src/components/PosterWall.tsx:28:1",children:"Credits"})';
  return bundle.slice(0, contentStart) + title + bundle.slice(end);
}

const WORK_HEADER_OPEN = '<div class="mb-10 max-w-2xl sm:mb-14">';
const WORK_HEADER_TITLE = '<h2 class="mb-4 font-display text-3xl leading-none text-bone sm:text-4xl md:text-6xl">Showreel</h2>';

/** Replace the #work intro with a plain Showreel heading; keep all film cards. */
export function simplifyWorkHeaderStatic(html) {
  const sectionStart = html.indexOf('<section id="work"');
  const start = html.indexOf(WORK_HEADER_OPEN, sectionStart);
  const end = html.indexOf('</div>', start);
  if (sectionStart < 0 || start < 0 || end < 0) throw new Error('conversion-copy/static: #work header boundary not found');
  const replacement = `${WORK_HEADER_OPEN}${WORK_HEADER_TITLE}</div>`;
  if (html.slice(start, end + '</div>'.length) === replacement) return html;
  return html.slice(0, start) + replacement + html.slice(end + '</div>'.length);
}

/** Same header simplification in the pristine React bundle. */
export function simplifyWorkHeaderBundle(bundle) {
  const startMarker = 'u.jsxs("div",{className:"mb-10 max-w-2xl sm:mb-14","data-source-loc":"src/components/Projects.tsx:9:8",children:[';
  const gridMarker = ',u.jsx("div",{className:"grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2","data-source-loc":"src/components/Projects.tsx:21:8"';
  const start = bundle.indexOf(startMarker);
  const gridStart = bundle.indexOf(gridMarker, start);
  if (start < 0 || gridStart < 0) {
    if (bundle.includes('children:"Showreel"') && bundle.includes('src/components/Projects.tsx:9:8')) return bundle;
    throw new Error('conversion-copy/bundle: #work header boundary not found');
  }
  const replacement = 'u.jsx("div",{className:"mb-10 max-w-2xl sm:mb-14","data-source-loc":"src/components/Projects.tsx:9:8",children:u.jsx("h2",{className:"mb-4 font-display text-3xl leading-none text-bone sm:text-4xl md:text-6xl","data-source-loc":"src/components/Projects.tsx:13:10",children:"Showreel"})})';
  return bundle.slice(0, start) + replacement + bundle.slice(gridStart);
}

const SHOWREEL_HEADER_STATIC_END = '</div><div class="flex items-end gap-3 rounded-sm border border-white/5 bg-white/[0.02] px-5 py-4 backdrop-blur-sm md:flex-col md:items-end">';
const SHOWREEL_HEADER_STATIC_TITLE = '<h2 class="font-display text-3xl leading-[1.05] tracking-tight text-bone sm:text-4xl md:text-5xl lg:text-[3.35rem]">Original cues</h2>';

/** Keep only a simple Original cues heading and the existing reel-download link. */
export function simplifyShowreelHeaderStatic(html) {
  const sectionStart = html.indexOf('<section id="showreel"');
  const start = html.indexOf('<div class="min-w-0">', sectionStart);
  const end = html.indexOf(SHOWREEL_HEADER_STATIC_END, start);
  if (sectionStart < 0 || start < 0 || end < 0) throw new Error('conversion-copy/static: Showreel header boundary not found');
  const blockEnd = end + '</div>'.length;
  const block = html.slice(start, blockEnd);
  if (block.includes(SHOWREEL_HEADER_STATIC_TITLE) && !block.includes('02 · Showreel')) return html;
  const anchorStart = block.indexOf('<a href="/reel#download"');
  const anchorEnd = block.indexOf('</a>', anchorStart);
  if (anchorStart < 0 || anchorEnd < 0) throw new Error('conversion-copy/static: reel download link not found in Showreel header');
  const downloadLink = block.slice(anchorStart, anchorEnd + '</a>'.length);
  const replacement = `<div class="min-w-0">${SHOWREEL_HEADER_STATIC_TITLE}${downloadLink}</div>`;
  return html.slice(0, start) + replacement + html.slice(blockEnd);
}

/** Same heading simplification in the pristine React bundle's Showreel JSX. */
export function simplifyShowreelHeaderBundle(bundle) {
  const startMarker = 'u.jsxs("div",{className:"min-w-0","data-source-loc":"src/components/Showreel.tsx:54:1",children:[';
  const endMarker = ']})' + ',u.jsxs("div",{className:"flex items-end gap-3 rounded-sm border border-white/5 bg-white/[0.02] px-5 py-4 backdrop-blur-sm md:flex-col md:items-end"';
  const start = bundle.indexOf(startMarker);
  const contentStart = start + startMarker.length;
  const end = bundle.indexOf(endMarker, contentStart);
  if (start < 0 || end < 0) throw new Error('conversion-copy/bundle: Showreel header boundary not found');
  const originalChildren = bundle.slice(contentStart, end);
  const anchorStart = originalChildren.indexOf('u.jsxs("a",{href:"/reel#download"');
  const anchorEnd = originalChildren.indexOf(']})', anchorStart);
  if (anchorStart < 0 || anchorEnd < 0 || !originalChildren.includes('02 · Showreel')) {
    throw new Error('conversion-copy/bundle: expected Showreel header and reel-download link not found');
  }
  const downloadLink = originalChildren.slice(anchorStart, anchorEnd + 3);
  const title = 'u.jsx("h2",{className:"font-display text-3xl leading-[1.05] tracking-tight text-bone sm:text-4xl md:text-5xl lg:text-[3.35rem]","data-source-loc":"src/components/Showreel.tsx:59:1",children:"Original cues"})';
  return bundle.slice(0, contentStart) + `${title},${downloadLink}` + bundle.slice(end);
}

/** Drop the hero booking pill and the remaining IMDb proof strip in both
 * render paths; those claims distract from the positioning and call to action. */
function removeBundleCall(bundle, marker, label) {
  const start = bundle.indexOf(marker);
  if (start < 0) return bundle; // already removed by a prior transformation
  if (bundle.indexOf(marker, start + marker.length) >= 0) {
    throw new Error(`conversion-copy/bundle: ${label} matched more than once`);
  }
  let depth = 0;
  let quote = null;
  let escaped = false;
  let end = -1;
  for (let i = start; i < bundle.length; i++) {
    const ch = bundle[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '(') depth++;
    else if (ch === ')' && --depth === 0) { end = i + 1; break; }
  }
  if (end < 0) throw new Error(`conversion-copy/bundle: ${label} did not close`);
  if (bundle[end] === ',') end++;
  else if (start > 0 && bundle[start - 1] === ',') return bundle.slice(0, start - 1) + bundle.slice(end);
  return bundle.slice(0, start) + bundle.slice(end);
}

export function removeHeroBookingBundle(bundle) {
  return removeBundleCall(
    bundle,
    'u.jsxs(Bt.div,{custom:0,variants:Ss,initial:"hidden",animate:"show",className:"mb-5 inline-flex flex-wrap items-center gap-2"',
    'hero booking badge',
  );
}

export function removeHeroProofBundle(bundle) {
  return removeBundleCall(
    bundle,
    'u.jsxs(Bt.div,{custom:6,variants:Ss,initial:"hidden",animate:"show",className:"mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6"',
    'hero proof strip',
  );
}

function removeStaticDiv(html, opening, label, nestedDivs = 0) {
  const start = html.indexOf(opening);
  if (start < 0) return html; // already removed by a prior transformation
  if (html.indexOf(opening, start + opening.length) >= 0) {
    throw new Error(`conversion-copy/static: ${label} matched more than once`);
  }
  let end = start + opening.length;
  let depth = 1;
  let nestedDivsSeen = 0;
  const token = /<\/?div\b[^>]*>/gi;
  token.lastIndex = end;
  let match;
  while ((match = token.exec(html))) {
    if (/^<div\b/i.test(match[0])) { depth++; nestedDivsSeen++; }
    else depth--;
    if (depth === 0) { end = token.lastIndex; break; }
  }
  if (depth !== 0 || nestedDivsSeen !== nestedDivs) {
    throw new Error(`conversion-copy/static: unexpected nested markup in ${label}`);
  }
  return html.slice(0, start) + html.slice(end);
}

export function removeHeroBookingStatic(html) {
  return removeStaticDiv(html, '<div class="mb-5 inline-flex flex-wrap items-center gap-2">', 'hero booking badge');
}

export function removeHeroProofStatic(html) {
  return removeStaticDiv(html, '<div class="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">', 'hero proof strip', 1);
}

/* ------------------------------------------------------------------------- */
/* Hero "boutique footnote" — the lineage strip.                              */
/*                                                                            */
/* One desaturated, low-contrast horizontal line sitting directly beneath the */
/* hero call-to-action row: three monochrome marks, no caption and no label   */
/* (2026-10-29: the working "Lineage" label was removed, and the marks grew   */
/* to carry the line on their own). It is the hero's only third-party social  */
/* proof, so it stays deliberately quiet - no boxes, no borders, no hover     */
/* affordances, and nothing that competes with the H1 or the primary button.  */
/*                                                                            */
/* The marks live in /images/lineage as white-on-transparent rasters rendered */
/* at 2x their display height, so one asset is sharp on retina and small on   */
/* the wire. Each one carries the institution's name as alt text, so a screen */
/* reader announces "Black Mountain College, Ars Electronica, Dolby Atmos"    */
/* instead of three orphaned images.                                          */
/* ------------------------------------------------------------------------- */

export const LINEAGE_START = '<!--ZP-LINEAGE-START-->';
export const LINEAGE_END = '<!--ZP-LINEAGE-END-->';

/** Display heights are set in CSS; these are the 2x raster dimensions. */
const LINEAGE_MARKS = [
  ['black-mountain-college.png', 'Black Mountain College', 'zp-lineage-seal', 89, 88],
  ['ars-electronica.png', 'Ars Electronica', 'zp-lineage-festival', 81, 72],
  ['dolby-atmos.png', 'Dolby Atmos', 'zp-lineage-format', 210, 54],
];

export const LINEAGE_INNER =
  LINEAGE_MARKS.map(
    ([file, alt, className, width, height]) =>
      `<img class="zp-lineage-mark ${className}" src="/images/lineage/${file}" alt="${alt}" width="${width}" height="${height}" loading="lazy" decoding="async">`,
  ).join('');

export const LINEAGE_HTML = `${LINEAGE_START}<p class="zp-lineage">${LINEAGE_INNER}</p>${LINEAGE_END}`;

/** The CTA row the strip is appended to, in the prerendered document. */
const HERO_CTA_STATIC =
  '<div class="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center">';

/** The same row in the minified bundle: its secondary anchor is the last child. */
const HERO_CTA_BUNDLE = 'children:"Start an inquiry"})]})';

/** Remove a previously injected strip so patchStatic always starts canonical. */
export function normalizeHeroLineage(html) {
  return html.replace(
    new RegExp(`${LINEAGE_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${LINEAGE_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`, 'g'),
    '',
  );
}

/**
 * Insert the strip directly after the hero CTA row in the prerendered document.
 * The row must close before the strip opens, or the strip would inherit the
 * row's `sm:flex-row` and stop being a single line.
 */
export function injectHeroLineageStatic(html) {
  const out = normalizeHeroLineage(html);
  const start = out.indexOf(HERO_CTA_STATIC);
  if (start < 0 || out.indexOf(HERO_CTA_STATIC, start + 1) >= 0) {
    throw new Error('conversion-copy/static: hero CTA row not found exactly once');
  }
  const end = matchDiv(out, start, 'hero CTA row');
  return out.slice(0, end) + LINEAGE_HTML + out.slice(end);
}

/**
 * Same strip in the React tree. The markup is a static island, exactly like
 * zpCompilations and the funnel sections, so both render paths cannot drift.
 */
export function injectHeroLineageBundle(bundle) {
  if (bundle.includes('function zpLineage(') || bundle.includes('u.jsx(zpLineage,{})')) {
    throw new Error('conversion-copy/bundle: lineage strip is patched twice');
  }
  const definitionAnchor = 'function I5(){return u.jsx("section",{id:"press"';
  if (countOf(bundle, definitionAnchor) !== 1) {
    throw new Error('conversion-copy/bundle: press component anchor drifted');
  }
  const definition = `function zpLineage(){return u.jsx("p",{className:"zp-lineage",dangerouslySetInnerHTML:{__html:${JSON.stringify(LINEAGE_INNER)}}})}`;
  let out = bundle.replace(definitionAnchor, () => `${definition}${definitionAnchor}`);
  if (countOf(out, HERO_CTA_BUNDLE) !== 1) {
    throw new Error('conversion-copy/bundle: hero CTA row anchor drifted');
  }
  out = out.replace(HERO_CTA_BUNDLE, (match) => `${match.slice(0, -3)},u.jsx(zpLineage,{})]})`);
  return out;
}

export const LINEAGE_CSS = `
/* Hero lineage footnote: one quiet line under the call to action. */
.zp-lineage{
  display:flex;
  flex-wrap:nowrap;
  align-items:center;
  gap:1rem;
  margin:1.15rem 0 0;
  padding:0;
  line-height:1;
  opacity:.85;
}
.zp-lineage-mark{
  flex:none;
  width:auto;
  max-width:none;
  filter:grayscale(1) brightness(.72) contrast(.9);
  opacity:.62;
  -webkit-mask-image:none;
  mask-image:none;
  mix-blend-mode:normal;
}
.zp-lineage-seal{height:44px;}
.zp-lineage-festival{height:36px;}
.zp-lineage-format{height:27px;}
@media (max-width:359px){
  .zp-lineage{gap:.6rem;}
  .zp-lineage-seal{height:36px;}
  .zp-lineage-festival{height:30px;}
  .zp-lineage-format{height:23px;}
}
`;

/** Idempotently keep <style id="zp-lineage-style"> in <head>. */
export function ensureLineageAssets(html) {
  const block = `<style id="zp-lineage-style">${LINEAGE_CSS}</style>`;
  let kept = false;
  let out = html.replace(/<style id="zp-lineage-style">[\s\S]*?<\/style>/g, () => {
    if (kept) return '';
    kept = true;
    return block;
  });
  if (kept) return out;
  if (!out.includes('</head>')) throw new Error('conversion-copy: no </head> to attach lineage styles');
  return out.replace('</head>', () => `${block}\n</head>`);
}

/** Index of the character just past the </div> that closes the div at `start`. */
function matchDiv(html, start, label) {
  const token = /<\/?div\b[^>]*>/gi;
  token.lastIndex = html.indexOf('>', start) + 1;
  let depth = 1;
  let match;
  while ((match = token.exec(html))) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return token.lastIndex;
  }
  throw new Error(`conversion-copy/static: ${label} never closes`);
}

const marker = (id) => ({ start: `<!--ZP-FN-START:${id}-->`, end: `<!--ZP-FN-END:${id}-->` });

const sectionMarkup = (section) =>
  `<section id="zp-${section.id}" class="zp-fn zp-fn--${section.variant}" aria-labelledby="${section.titleId}">${section.inner}</section>`;

/** Remove previously injected sections so patchStatic works on canonical DOM. */
export function normalizeStaticSections(html) {
  // Strip every generated funnel block, including sections retired from SECTIONS.
  return html.replace(/<!--ZP-FN-START:([a-z-]+)-->[\s\S]*?<!--ZP-FN-END:\1-->\n?/g, '');
}

/** Insert sections at stable anchors. Throws if an anchor ever drifts. */
export function injectStaticSections(html) {
  let out = html;
  for (const section of SECTIONS) {
    const { start, end } = marker(section.id);
    const anchor = section.staticAnchor;
    const n = countOf(out, anchor);
    if (n !== 1) throw new Error(`conversion-copy/static: ${section.id} anchor matched ${n} times, expected 1 — ${anchor}`);
    out = out.replace(anchor, () => `${start}${sectionMarkup(section)}${end}\n${anchor}`);
  }
  return out;
}

/**
 * Inject the remaining funnel sections into the React render array. Each is a
 * static dangerouslySetInnerHTML island, exactly like zpCompilations in
 * build.mjs — no client-side behaviour is needed for these sections.
 */
export function injectBundleSections(source) {
  let out = source;
  const definitionAnchor = 'function I5(){return u.jsx("section",{id:"press"';
  if (countOf(out, definitionAnchor) !== 1) {
    throw new Error('conversion-copy/bundle: press component anchor drifted');
  }
  const definitions = SECTIONS.map((section) => {
    const className = `zp-fn zp-fn--${section.variant}`;
    return `function zpFn${section.id[0].toUpperCase()}${section.id.slice(1)}(){return u.jsx("section",{id:${JSON.stringify(`zp-${section.id}`)},className:${JSON.stringify(className)},"aria-labelledby":${JSON.stringify(section.titleId)},dangerouslySetInnerHTML:{__html:${JSON.stringify(section.inner)}}})}`;
  }).join('');
  out = out.replace(definitionAnchor, () => `${definitions}${definitionAnchor}`);

  for (const section of SECTIONS) {
    const anchor = section.bundleAnchor;
    if (countOf(out, anchor) !== 1) {
      throw new Error(`conversion-copy/bundle: ${section.id} render anchor matched ${countOf(out, anchor)} times, expected 1 — ${anchor}`);
    }
    const component = `zpFn${section.id[0].toUpperCase()}${section.id.slice(1)}`;
    out = out.replace(anchor, () => `u.jsx(${component},{}),${anchor}`);
  }
  return out;
}

/** Idempotently keep <style id="zp-fn-style"> in <head>. */
export function ensureFunnelAssets(html) {
  const block = `<style id="zp-fn-style">${FUNNEL_CSS}</style>`;
  const existing = /<style id="zp-fn-style">[\s\S]*?<\/style>/g;
  let kept = false;
  let out = html.replace(existing, () => {
    if (kept) return '';
    kept = true;
    return block;
  });
  if (kept) return out;
  if (!out.includes('</head>')) throw new Error('conversion-copy: no </head> to attach funnel styles');
  return out.replace('</head>', () => `${block}\n</head>`);
}

/**
 * Lint the table against the two shipped artifacts. `from` values must appear
 * exactly once and `to` values not at all before the build runs; this catches
 * drift when a source string changes in a future deploy.
 */
export function audit(bundle, html) {
  const problems = [];
  for (const entry of COPY) {
    for (const [key, sideName, file] of [
      ['from', 'bundle', bundle], ['to', 'bundle', bundle],
      ['from', 'html', html], ['to', 'html', html],
    ]) {
      const value = side(entry[key], sideName);
      if (!value) continue;
      const expected = key === 'from' ? 1 : 0;
      const n = countOf(file, value);
      if (n !== expected) problems.push(`${entry.id}/${key}.${sideName}: count ${n}, expected ${expected}`);
    }
  }
  return problems;
}
