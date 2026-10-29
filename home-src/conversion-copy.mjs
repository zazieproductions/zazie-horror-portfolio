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
 * rewrite at the end. See docs/archive/CONVERSION-FUNNEL-BLUEPRINT.md for the strategy deck.
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
    to: 'Download reel',
  },

  /* --------------------------------------- 5. TRUST — #about / #compilations */
  {
    id: 'about.h2', stage: 'trust',
    from: { bundle: 'children:"The composer behind the atmosphere"', html: '>The composer behind the atmosphere</h2>' },
    to: { bundle: 'children:"Bio"', html: '>Bio</h2>' },
  },
  {
    id: 'about.cta', stage: 'trust',
    from: 'Start a Conversation',
    to: 'Talk to the composer directly',
  },

  /* ------------------------------------------------ 6. TRUST — #press kit
   * Full Electronic Press Kit markup + CSS now lives in
   * `src/lib/press-kit-markup.ts` and is injected identically into both
   * `index.html` and `I5()` by `home-src/build.mjs`. */

  /* -------------------- 7. DESIRE — #method (Approach) section removed */

  /* The "02 · Approach" block (#method) was removed on 2026-10-29. Its three
     cards restated the process story already told on /process and the
     commissioning pages, and the owner wanted the homepage to run from the
     credits and press straight to the inquiry form. The copy entries that used
     to rewrite those cards are gone with the section, so there is nothing left
     to normalize or apply; the static removal lives in removeMethodSectionStatic
     and the bundle render call + component cuts in home-src/build.mjs. */

  /* ------------------------------- 8. TRUST — retired homepage services copy */




  /* -------------------------------------------------- 9. ACTION — #contact */
  {
    id: 'contact.h2a', stage: 'action',
    from: 'Tell me about your project.',
    to: 'Project inquiries',
  },
  {
    id: 'contact.h2b', stage: 'action',
    from: 'A written quote follows review.',
    to: 'A written quote, scope and schedule follow review.',
  },
  {
    id: 'contact.lead', stage: 'action',
    from: 'Only your name and email are needed to start. Project details are optional; the form prepares an email for you to review and send.',
    to: 'Please provide your name and email. Project details and deadlines are optional.',
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
  <h2 class="zp-fn-claim" id="zp-obsession-h">87% of independent psychological horror, folk dread, atmospheric dramas, and experimental thrillers get rejected by <strong>Sundance</strong>, <strong>SXSW</strong>, <strong>TIFF, and A24/NEON acquisitions</strong> within the first 600 seconds.</h2>
  <p class="zp-fn-quest">I became obsessed with a single question: why do certain frequencies make our bodies prepare to die?</p>
  <p class="zp-fn-lead zp-fn-study">I started studying neurobiology, weaponized sonic warfare, animal distress frequencies, and auditory pareidolia (how the human brain hallucinates voices in random frequencies).</p>
  <p class="zp-fn-lead">Quick&#8212;hum the terrifying clicking motif from <em>Hereditary</em>, the nauseating horn from <em>The Lighthouse</em>, or the descending siren of <em>Annihilation</em>.</p>
  <p class="zp-fn-bridge">Now ask yourself: does your project have a signature acoustic scar that audiences emotionally will feel in their gut?</p>
  <section class="zp-listening" aria-labelledby="zp-listening-title">
    <div class="zp-index-terminal-bar" aria-hidden="true"><span>ZP:// AUDIO ARCHIVE <b> / </b> EMOTIONAL INDEX</span><span class="zp-index-online"><i></i> SIGNAL OPEN</span></div>
    <div class="zp-listening-head">
      <div class="zp-index-copy">
        <p class="zp-listening-eyebrow"><span class="zp-listening-dot" aria-hidden="true"></span> Selected cues <span aria-hidden="true">/</span> A closer listen</p>
        <h3 id="zp-listening-title">Emotional <em>Index</em></h3>
        <p class="zp-listening-intro">Four studies in dissonance, vulnerability, and the uneasy space between beauty and dread.</p>
        <div class="zp-index-console" aria-hidden="true"><span>+ &nbsp; SELECT A CUE TO LISTEN</span><span class="zp-index-cursor"></span></div>
      </div>
      <div class="zp-index-scope" aria-hidden="true">
        <div class="zp-index-disc"></div>
        <svg class="zp-index-wave" viewBox="0 0 500 160" preserveAspectRatio="none" focusable="false"><path class="zp-index-wave-base" d="M0 80 L70 80 83 77 96 83 112 80 132 80 145 60 155 108 166 37 180 124 192 74 203 83 225 80 249 80 260 88 271 50 283 113 294 78 310 80 335 80 348 66 357 89 367 80 392 80 405 77 418 83 430 80 500 80"/><path class="zp-index-wave-trace" d="M0 80 L70 80 83 77 96 83 112 80 132 80 145 60 155 108 166 37 180 124 192 74 203 83 225 80 249 80 260 88 271 50 283 113 294 78 310 80 335 80 348 66 357 89 367 80 392 80 405 77 418 83 430 80 500 80"/></svg>
        <div class="zp-index-scope-note"><span>MONITOR // 01</span><span>SIGNAL STUDY</span></div>
      </div>
    </div>
    <div class="zp-listening-register" aria-hidden="true"><span>Listening archive</span><span>Four entries &nbsp; / &nbsp; 01—04</span></div>
    <div class="zp-listening-tracks">
      <article class="zp-listening-track">
        <div class="zp-listening-info">
          <p class="zp-listening-tag">Atmosphere <span aria-hidden="true">/</span> Cue 01</p>
          <h4>The Beautiful Wrongness</h4>
          <p>A visceral, synth-driven soundscape with a mourning sense of tension, inspired by prestige atmospheric dramas and A24.</p>
        </div>
        <div class="zp-listening-player">
          <div class="zp-listening-graphic" aria-hidden="true"><span></span><span></span><span></span><i></i><b></b><canvas class="zp-cue-visualizer"></canvas><small>SIGNAL // LIVE</small></div>
          <audio controls preload="none" aria-label="The Beautiful Wrongness"><source src="/audio/track-30.mp3" type="audio/mpeg">Your browser does not support audio playback. <a href="/audio/track-30.mp3">Listen to The Beautiful Wrongness</a>.</audio>
          <div class="zp-cue-controls" hidden>
            <button class="zp-cue-play" type="button" aria-label="Play The Beautiful Wrongness"><span aria-hidden="true">▶</span></button>
            <div class="zp-cue-timeline"><div class="zp-cue-times"><span class="zp-cue-state">Listen</span><span><span class="zp-cue-current">0:00</span> / 01:05</span></div><input class="zp-cue-seek" type="range" name="cue-seek-30" min="0" max="1000" value="0" aria-label="Seek in The Beautiful Wrongness"></div>
          </div>
        </div>
      </article>
      <article class="zp-listening-track">
        <div class="zp-listening-info">
          <p class="zp-listening-tag">Dissonance <span aria-hidden="true">/</span> Cue 02</p>
          <h4>The Fatal Overdose</h4>
          <p>String mutations and dissonant microtonal tension on waterphone, inspired by <em>The Shining</em>.</p>
        </div>
        <div class="zp-listening-player">
          <div class="zp-listening-graphic" aria-hidden="true"><span></span><span></span><span></span><i></i><b></b><canvas class="zp-cue-visualizer"></canvas><small>SIGNAL // LIVE</small></div>
          <audio controls preload="none" aria-label="The Fatal Overdose"><source src="/audio/track-12.mp3" type="audio/mpeg">Your browser does not support audio playback. <a href="/audio/track-12.mp3">Listen to The Fatal Overdose</a>.</audio>
          <div class="zp-cue-controls" hidden>
            <button class="zp-cue-play" type="button" aria-label="Play The Fatal Overdose"><span aria-hidden="true">▶</span></button>
            <div class="zp-cue-timeline"><div class="zp-cue-times"><span class="zp-cue-state">Listen</span><span><span class="zp-cue-current">0:00</span> / 00:42</span></div><input class="zp-cue-seek" type="range" name="cue-seek-12" min="0" max="1000" value="0" aria-label="Seek in The Fatal Overdose"></div>
          </div>
        </div>
      </article>
      <article class="zp-listening-track">
        <div class="zp-listening-info">
          <p class="zp-listening-tag">Psychological tension <span aria-hidden="true">/</span> Cue 03</p>
          <h4>Variations on a Vanishing Body</h4>
          <p>A string piece inspired by <em>Black Swan</em> and <em>Requiem for a Dream</em>.</p>
        </div>
        <div class="zp-listening-player">
          <div class="zp-listening-graphic" aria-hidden="true"><span></span><span></span><span></span><i></i><b></b><canvas class="zp-cue-visualizer"></canvas><small>SIGNAL // LIVE</small></div>
          <audio controls preload="none" aria-label="Variations on a Vanishing Body"><source src="/audio/track-05.mp3" type="audio/mpeg">Your browser does not support audio playback. <a href="/audio/track-05.mp3">Listen to Variations on a Vanishing Body</a>.</audio>
          <div class="zp-cue-controls" hidden>
            <button class="zp-cue-play" type="button" aria-label="Play Variations on a Vanishing Body"><span aria-hidden="true">▶</span></button>
            <div class="zp-cue-timeline"><div class="zp-cue-times"><span class="zp-cue-state">Listen</span><span><span class="zp-cue-current">0:00</span> / 02:46</span></div><input class="zp-cue-seek" type="range" name="cue-seek-05" min="0" max="1000" value="0" aria-label="Seek in Variations on a Vanishing Body"></div>
          </div>
        </div>
      </article>
      <article class="zp-listening-track">
        <div class="zp-listening-info">
          <p class="zp-listening-tag">Tension sequence <span aria-hidden="true">/</span> Cue 04</p>
          <h4>Needle in The Nerve</h4>
          <p>A tension sequence with sustained high intensity and forward momentum.</p>
        </div>
        <div class="zp-listening-player">
          <div class="zp-listening-graphic" aria-hidden="true"><span></span><span></span><span></span><i></i><b></b><canvas class="zp-cue-visualizer"></canvas><small>SIGNAL // LIVE</small></div>
          <audio controls preload="none" aria-label="Needle in The Nerve"><source src="/audio/track-00.mp3" type="audio/mpeg">Your browser does not support audio playback. <a href="/audio/track-00.mp3">Listen to Needle in The Nerve</a>.</audio>
          <div class="zp-cue-controls" hidden>
            <button class="zp-cue-play" type="button" aria-label="Play Needle in The Nerve"><span aria-hidden="true">▶</span></button>
            <div class="zp-cue-timeline"><div class="zp-cue-times"><span class="zp-cue-state">Listen</span><span><span class="zp-cue-current">0:00</span> / 01:12</span></div><input class="zp-cue-seek" type="range" name="cue-seek-00" min="0" max="1000" value="0" aria-label="Seek in Needle in The Nerve"></div>
          </div>
        </div>
      </article>
    </div>
    <div class="zp-listening-foot" aria-hidden="true"><span>Sound / emotion / memory</span><span>End of selection &nbsp; +</span></div>
  </section>
  <div class="zp-fn-actions">${CTA('#showreel', 'Hear it in 30 original cues', true)}</div>
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
];

/* ------------------------------------------------------------------------- */
/* Styles — a standalone inline block, like #zp-comp-style.                   */
/* ------------------------------------------------------------------------- */

export const FUNNEL_CSS = `
/* Conversion funnel sections (homepage only). Scoped with zp-fn- so nothing
   here can leak into the rest of the design system. */
.zp-fn{position:relative;padding:4.5rem 1.25rem;border-top:1px solid #1e1e1e;}
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
/* Listening archive: editorial lines, restrained instrumentation and native fallback. */
.zp-listening{margin:4rem 0 3rem;background:#0c0909;border:1px solid #443130;position:relative;}
.zp-listening:before{content:"";position:absolute;top:-1px;left:0;width:5rem;height:2px;background:#d2685d;}
.zp-listening-head{display:grid;gap:1.5rem;padding:clamp(1.5rem,4vw,3.5rem);background:radial-gradient(ellipse at 85% 0%,#2c1718 0%,transparent 55%);}
.zp-listening-eyebrow,.zp-listening-tag,.zp-listening-register,.zp-listening-foot{font-family:Inter,Arial,sans-serif;text-transform:uppercase;letter-spacing:.18em;font-size:.62rem;line-height:1.6;color:#d88b82;margin:0;}
.zp-listening-eyebrow{display:flex;align-items:center;gap:.65rem;margin-bottom:1.35rem;}
.zp-listening-dot{width:6px;height:6px;border-radius:50%;background:#cf655a;box-shadow:0 0 12px #b3423a;}
.zp-listening-eyebrow span:not(.zp-listening-dot),.zp-listening-tag span{color:#765450;}
.zp-listening h3{font-family:"Cormorant Garamond",Georgia,serif;font-weight:400;font-size:clamp(2.2rem,4.5vw,4rem);line-height:1;color:#f0ebe3;margin:0;}
.zp-listening h3 em{color:#cfa7a0;font-weight:400;}
.zp-listening-intro{font-size:.88rem;line-height:1.7;color:#bfb0aa;max-width:23rem;margin:0;align-self:end;}
.zp-listening-register,.zp-listening-foot{display:flex;justify-content:space-between;gap:1rem;padding:.8rem clamp(1.5rem,4vw,3.5rem);border-top:1px solid #443130;color:#a99089;font-size:.58rem;}
.zp-listening-track{display:grid;grid-template-columns:minmax(0,1fr);gap:1rem;padding:2rem clamp(1.5rem,4vw,3.5rem);border-top:1px solid #443130;transition:background-color .2s;}
.zp-listening-track:hover,.zp-listening-track.is-playing{background:#171010;}
.zp-listening-index{font-family:"Cormorant Garamond",Georgia,serif;color:#dbb2a9;font-size:1.5rem;line-height:1;}
.zp-listening-index span+span{display:block;margin-top:.55rem;font-family:Inter,Arial,sans-serif;font-size:.56rem;letter-spacing:.12em;color:#9e827a;}
.zp-listening-tag{font-size:.58rem;margin:0 0 .6rem;}
.zp-listening-info h4{font-family:"Cormorant Garamond",Georgia,serif;font-weight:500;font-size:clamp(1.6rem,2.5vw,2.15rem);line-height:1.08;color:#f0ebe3;margin:0 0 .65rem;}
.zp-listening-info>p:last-child{font-size:.85rem;line-height:1.65;color:#bfb0aa;max-width:31rem;margin:0;}
.zp-listening-player{grid-column:1;min-width:0;margin-top:.35rem;}
.zp-listening-player audio{display:block;width:100%;max-width:21rem;height:40px;color-scheme:dark;}.zp-listening-player audio[hidden]{display:none;}
.zp-listening-graphic{height:28px;display:flex;align-items:center;gap:4px;position:relative;overflow:hidden;margin-bottom:.65rem;opacity:.7;}
.zp-listening-graphic:before,.zp-listening-graphic:after{content:"";position:absolute;left:0;right:0;height:1px;background:#563a38;top:50%;}
.zp-listening-graphic:after{left:auto;right:6px;width:24px;height:24px;top:2px;border:1px solid #ad756c;border-radius:50%;background:transparent;}
.zp-listening-graphic span{position:relative;z-index:1;width:1px;height:18px;background:#b77b70;}
.zp-listening-graphic span:nth-child(2){height:8px}.zp-listening-graphic span:nth-child(3){height:24px}.zp-listening-graphic i{position:absolute;right:17px;width:1px;height:28px;background:#ad756c;}
.zp-cue-controls[hidden]{display:none}.zp-cue-controls{display:flex;align-items:center;gap:1rem;}
.zp-cue-play{flex:none;display:grid;place-items:center;width:44px;height:44px;border:1px solid #bc8178;border-radius:50%;background:transparent;color:#f2e1d9;cursor:pointer;font-size:.8rem;transition:background .2s,color .2s;}
.zp-cue-play:hover,.zp-listening-track.is-playing .zp-cue-play{background:#d39b91;color:#160b0b;}
.zp-cue-play:focus-visible,.zp-cue-seek:focus-visible{outline:2px solid #e7a399;outline-offset:4px;}
.zp-cue-timeline{min-width:0;flex:1;max-width:21rem;}.zp-cue-times{display:flex;justify-content:space-between;gap:1rem;font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:#c0a39a;font-variant-numeric:tabular-nums;}
.zp-cue-seek{display:block;width:100%;height:22px;margin:.25rem 0 0;accent-color:#d18c80;cursor:pointer;}
.zp-listening-foot{border-top:1px solid #443130;}
@media(min-width:768px){.zp-listening-head{grid-template-columns:1fr 19rem;gap:2rem;}.zp-listening-track{grid-template-columns:minmax(0,1fr) minmax(13rem,18rem);gap:1.5rem;align-items:center;}.zp-listening-index{align-self:start}.zp-listening-player{grid-column:auto;margin-top:0;}}
@media(max-width:420px){.zp-listening-register,.zp-listening-foot{font-size:.5rem;letter-spacing:.1em}.zp-listening-track{grid-template-columns:minmax(0,1fr);gap:.8rem}}
/* The index behaves like an editorial instrument panel, not a waveform. */
.zp-listening{overflow:hidden;border-color:#4b2727;background:#0b0808;}
.zp-listening:before{width:7rem;background:#e14c43;box-shadow:0 0 20px #b7211c;}
.zp-listening-head{position:relative;isolation:isolate;overflow:hidden;min-height:17rem;align-items:end;background:radial-gradient(ellipse at 83% 42%,#351517 0%,#170b0c 30%,#0b0808 72%);}
.zp-listening-head:after{content:"";position:absolute;z-index:-1;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,transparent 0 47px,rgba(197,76,68,.055) 48px),repeating-linear-gradient(90deg,transparent 0 95px,rgba(197,76,68,.04) 96px);mask-image:linear-gradient(90deg,transparent 10%,#000 100%);}
.zp-listening h3{font-size:clamp(3rem,6.2vw,5.6rem);letter-spacing:-.035em;}
.zp-listening h3 em{color:#e58d80;}
.zp-listening-aside{display:flex;align-items:end;gap:1.3rem;position:relative;}
.zp-listening-intro{position:relative;z-index:1;}
.zp-index-emblem{position:relative;flex:none;width:5.75rem;aspect-ratio:1;border:1px solid rgba(217,95,83,.55);border-radius:50%;}
.zp-index-emblem:before,.zp-index-emblem:after{content:"";position:absolute;inset:13%;border:1px solid rgba(217,95,83,.35);border-radius:50%;}
.zp-index-emblem:after{inset:31%;border-color:rgba(236,130,115,.65);}
.zp-index-orbit{position:absolute;inset:-5px;border:1px solid transparent;border-top-color:#e15f53;border-radius:50%;animation:zp-index-orbit 16s linear infinite;}
.zp-index-orbit:after{content:"";position:absolute;top:10%;right:10%;width:4px;height:4px;border-radius:50%;background:#f07163;box-shadow:0 0 8px #ed4c41;}
.zp-index-core{position:absolute;inset:46%;border-radius:50%;background:#e15f53;box-shadow:0 0 15px #e23c32;animation:zp-index-breathe 4s ease-in-out infinite;}
.zp-index-cross:before,.zp-index-cross:after{content:"";position:absolute;background:rgba(217,95,83,.45);}
.zp-index-cross:before{width:1px;top:-10px;bottom:-10px;left:50%;}.zp-index-cross:after{height:1px;left:-10px;right:-10px;top:50%;}
.zp-listening-register{border-color:#5a302e;background:#1c0d0e;color:#d7a49a;}
.zp-listening-track{position:relative;transition:background-color .3s,border-color .3s;}
.zp-listening-track:before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:#d44b40;opacity:0;transition:opacity .3s;}
.zp-listening-track:hover:before,.zp-listening-track.is-playing:before{opacity:1;}
.zp-listening-track.is-playing{background:linear-gradient(90deg,#211011,#120b0b 55%,#160b0b);}
.zp-listening-track.is-playing .zp-listening-index{color:#ef7969;}
.zp-listening-graphic{height:38px;opacity:.8;margin-bottom:.85rem;}
.zp-listening-graphic b{position:absolute;left:0;top:50%;width:24%;height:1px;background:linear-gradient(90deg,transparent,#f26a5b,transparent);box-shadow:0 0 7px #d13d34;opacity:.65;animation:zp-index-scan 7s ease-in-out infinite alternate;}
.zp-listening-track:nth-child(2) .zp-listening-graphic b{animation-delay:-2s;}.zp-listening-track:nth-child(3) .zp-listening-graphic b{animation-delay:-4s;}
.zp-listening-track.is-playing .zp-listening-graphic b{opacity:1;animation-duration:3s;}
.zp-cue-play{border-color:#ce766a;}.zp-cue-play:hover,.zp-listening-track.is-playing .zp-cue-play{background:#e06a5c;color:#100707;}
@keyframes zp-index-orbit{to{transform:rotate(360deg)}}
@keyframes zp-index-breathe{50%{opacity:.45;transform:scale(.7)}}
@keyframes zp-index-scan{from{transform:translateX(0)}to{transform:translateX(300%)}}
@media(max-width:767px){.zp-listening-head{min-height:0;}.zp-listening-aside{align-items:center;}.zp-index-emblem{width:4rem;}.zp-listening-intro{font-size:.82rem;}}
@media(prefers-reduced-motion:reduce){.zp-index-orbit,.zp-index-core,.zp-listening-graphic b{animation:none;}.zp-listening-track,.zp-listening-track:before,.zp-cue-play{transition:none;}}
/* Analog terminal styling echoes the archive boot without obscuring controls. */
.zp-listening{--index-red:#ee3e42;--index-mono:ui-monospace,"Cascadia Mono","SF Mono",Menlo,Consolas,"Liberation Mono",monospace;background:#090304;border:1px solid rgba(233,57,65,.35);box-shadow:inset 0 0 0 1px #030102,0 20px 70px rgba(0,0,0,.3);}
.zp-listening:before{z-index:3;pointer-events:none;inset:-1px;width:auto;height:auto;background:linear-gradient(var(--index-red),var(--index-red)) left top / 25px 2px no-repeat,linear-gradient(var(--index-red),var(--index-red)) left top / 2px 25px no-repeat,linear-gradient(var(--index-red),var(--index-red)) right top / 25px 2px no-repeat,linear-gradient(var(--index-red),var(--index-red)) right top / 2px 25px no-repeat,linear-gradient(var(--index-red),var(--index-red)) left bottom / 25px 2px no-repeat,linear-gradient(var(--index-red),var(--index-red)) left bottom / 2px 25px no-repeat,linear-gradient(var(--index-red),var(--index-red)) right bottom / 25px 2px no-repeat,linear-gradient(var(--index-red),var(--index-red)) right bottom / 2px 25px no-repeat;box-shadow:none;opacity:.8;}
.zp-listening:after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;background:repeating-linear-gradient(0deg,transparent 0 2px,rgba(0,0,0,.12) 3px 4px);opacity:.5;}
.zp-index-terminal-bar,.zp-listening-register,.zp-listening-foot,.zp-listening-eyebrow,.zp-listening-tag,.zp-listening-index span+span,.zp-cue-times,.zp-index-console,.zp-index-scope-note{font-family:var(--index-mono);}
.zp-index-terminal-bar{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1.1rem clamp(1.5rem,4vw,3.5rem);border-bottom:1px solid rgba(224,68,72,.25);color:#c18c89;font:500 .62rem/1.4 var(--index-mono);letter-spacing:.13em;}
.zp-index-terminal-bar b{color:#ef5052;font-weight:400;}.zp-index-online{color:#f27b75;white-space:nowrap;display:flex;align-items:center;gap:.55rem;}.zp-index-online i{width:6px;height:6px;border-radius:50%;background:#ee3e42;box-shadow:0 0 10px #ee3e42;animation:zp-index-breathe 3s ease-in-out infinite;}
.zp-listening-head{min-height:0;align-items:center;gap:1.5rem;background:radial-gradient(ellipse 50% 90% at 78% 50%,rgba(156,11,25,.26),transparent),radial-gradient(ellipse at 45% 40%,#1c0709,#090304 70%);}
.zp-index-copy{position:relative;z-index:1;}.zp-listening-eyebrow{color:#f46b66;letter-spacing:.23em;}.zp-listening h3{text-transform:uppercase;font-size:clamp(3.3rem,6.4vw,5.7rem);line-height:.88;letter-spacing:.01em;color:#ee3e42;text-shadow:2px 3px 0 #3c070b;}.zp-listening h3 em{display:block;margin-top:.16em;color:#e9d8d3;font-size:.54em;font-style:normal;letter-spacing:.25em;}
.zp-listening-intro{margin:1.5rem 0 0;max-width:27rem;color:#dac2bb;}.zp-index-console{max-width:27rem;margin-top:1.7rem;padding:.8rem 1rem;border-top:1px solid rgba(202,58,61,.32);border-left:2px solid #d7484b;background:linear-gradient(90deg,rgba(76,12,19,.35),transparent);color:#d9aaa4;font-size:.62rem;line-height:1.6;letter-spacing:.12em;}
.zp-index-console span:first-child{color:#e7b7b0;}.zp-index-cursor{display:inline-block;vertical-align:-.1em;width:.55em;height:1em;margin-left:.5em;background:#f2605c;box-shadow:0 0 9px rgba(238,62,66,.75);animation:zp-index-cursor 1.2s steps(2) infinite;}
.zp-index-scope{position:relative;width:min(100%,16rem);aspect-ratio:1;justify-self:center;display:grid;place-items:center;pointer-events:none;}.zp-index-scope:before{content:"";position:absolute;inset:-8%;border-radius:50%;background:radial-gradient(circle,rgba(183,13,25,.2),transparent 68%);filter:blur(20px);}
.zp-index-disc{width:80%;aspect-ratio:1;border:1px solid rgba(238,64,69,.36);border-radius:50%;background:repeating-radial-gradient(circle,rgba(244,73,72,.09) 0 1px,transparent 1px 15px),radial-gradient(circle,#020101 0 7%,#4c070e 11%,#9e1521 15%,#3b060c 23%,#0e0305 48%,#070203 70%);box-shadow:0 0 65px rgba(184,12,25,.25),inset 0 0 48px rgba(0,0,0,.88);animation:zp-index-scope-breathe 5s ease-in-out infinite;}
.zp-index-disc:after{content:"";position:absolute;inset:10%;border-radius:50%;background:linear-gradient(90deg,transparent calc(50% - .5px),rgba(238,62,66,.4) 50%,transparent calc(50% + .5px)),linear-gradient(0deg,transparent calc(50% - .5px),rgba(238,62,66,.4) 50%,transparent calc(50% + .5px));}
.zp-index-wave{position:absolute;left:0;top:35%;width:100%;height:30%;overflow:visible;filter:drop-shadow(0 0 7px rgba(239,56,62,.9));}.zp-index-wave path{fill:none;stroke-linecap:round;stroke-linejoin:round;}.zp-index-wave-base{stroke:rgba(247,112,103,.25);stroke-width:1;}.zp-index-wave-trace{stroke:#fa7670;stroke-width:1.5;stroke-dasharray:1100;animation:zp-index-trace 7s ease-in-out infinite;}
.zp-index-scope-note{position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;color:#c78b86;font-size:.55rem;letter-spacing:.14em;}
.zp-listening-register{background:#16090b;border-color:rgba(224,68,72,.3);color:#d5a5a0;}.zp-listening-track{border-color:rgba(224,68,72,.22);}.zp-listening-track:hover,.zp-listening-track.is-playing{background:linear-gradient(90deg,rgba(88,12,19,.34),rgba(16,4,5,.5));}.zp-listening-index{color:#e66963;}.zp-listening-tag{color:#f07870;}.zp-listening-info>p:last-child{color:#d1b9b3;}
.zp-listening-player{padding:.9rem 1rem;border:1px solid rgba(202,58,61,.24);background:linear-gradient(130deg,rgba(56,10,14,.34),rgba(4,1,2,.6));}.zp-listening-graphic{height:25px;}.zp-cue-play{width:44px;height:44px;border-radius:0;border-color:#ee3e42;background:#26070b;color:#f3c4ba;}.zp-cue-play:hover,.zp-listening-track.is-playing .zp-cue-play{background:#ee3e42;color:#160405;}.zp-cue-times{color:#e1b3ac;}
.zp-cue-seek{appearance:none;-webkit-appearance:none;background:transparent;accent-color:#f36f68;}.zp-cue-seek::-webkit-slider-runnable-track{height:4px;background:linear-gradient(90deg,#ec3940 0%,#ff8f80 var(--seek,0%),#361014 var(--seek,0%),#361014 100%);}.zp-cue-seek::-moz-range-track{height:4px;background:#361014;}.zp-cue-seek::-moz-range-progress{height:4px;background:#ee3e42;}.zp-cue-seek::-webkit-slider-thumb{-webkit-appearance:none;width:10px;height:10px;margin-top:-3px;border-radius:0;background:#f07b70;box-shadow:0 0 8px rgba(248,57,64,.65);}.zp-cue-seek::-moz-range-thumb{width:10px;height:10px;border:0;border-radius:0;background:#f07b70;box-shadow:0 0 8px rgba(248,57,64,.65);}
@keyframes zp-index-cursor{50%{opacity:0}}@keyframes zp-index-scope-breathe{50%{filter:brightness(1.22)}}@keyframes zp-index-trace{0%{stroke-dashoffset:1100;opacity:.4}45%,75%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:-1100;opacity:.4}}
@media(min-width:768px){.zp-listening-head{grid-template-columns:minmax(0,1fr) minmax(12rem,17rem);}}
@media(max-width:767px){.zp-listening-head{grid-template-columns:minmax(0,1fr) minmax(6rem,9rem);gap:.75rem;}.zp-index-scope{width:100%;}.zp-index-scope-note{font-size:.45rem;letter-spacing:.06em;}.zp-listening h3{font-size:clamp(2.7rem,9vw,4rem);}.zp-listening h3 em{letter-spacing:.14em;}.zp-index-console{font-size:.55rem;}}
@media(max-width:480px){.zp-index-terminal-bar{font-size:.51rem;letter-spacing:.07em;}.zp-listening-head{grid-template-columns:1fr;}.zp-index-scope{width:8.5rem;margin-top:-.25rem;justify-self:end;}.zp-listening-intro{margin-top:1rem;}.zp-index-console{margin-top:1rem;}}
@media(prefers-reduced-motion:reduce){.zp-index-online i,.zp-index-cursor,.zp-index-disc,.zp-index-wave-trace{animation:none;}.zp-index-wave-trace{stroke-dashoffset:0;}}
/* A live oscilloscope sits inside the active cue's terminal. */
.zp-listening-graphic{height:54px;border:1px solid rgba(204,69,68,.2);background:repeating-linear-gradient(90deg,transparent 0 23px,rgba(226,65,66,.08) 24px),repeating-linear-gradient(0deg,transparent 0 17px,rgba(226,65,66,.06) 18px),#0c0405;}
.zp-listening-graphic:before{background:#66312f}.zp-listening-graphic:after{right:10px;top:14px}.zp-listening-graphic span:first-child{margin-left:10px;}
.zp-listening-graphic i{right:21px;}.zp-listening-graphic small{display:none;position:absolute;right:6px;top:4px;z-index:2;font:500 8px/1 ui-monospace,monospace;letter-spacing:.12em;color:#eaa39a;}
.zp-cue-visualizer{display:none;position:absolute;inset:0;width:100%;height:100%;z-index:1;}
.zp-listening-track.has-visualizer .zp-cue-visualizer,.zp-listening-track.has-visualizer .zp-listening-graphic small{display:block;}
.zp-listening-track.has-visualizer .zp-listening-graphic>span,.zp-listening-track.has-visualizer .zp-listening-graphic>i,.zp-listening-track.has-visualizer .zp-listening-graphic>b,.zp-listening-track.has-visualizer .zp-listening-graphic:before,.zp-listening-track.has-visualizer .zp-listening-graphic:after{opacity:0;}
@media(prefers-reduced-motion:reduce){.zp-listening-track.has-visualizer .zp-cue-visualizer,.zp-listening-track.has-visualizer .zp-listening-graphic small{display:none;}}
.zp-fn-actions{display:flex;flex-wrap:wrap;gap:.75rem 1.25rem;align-items:center;margin-top:1.75rem;}
.zp-fn-btn{display:inline-flex;min-height:48px;align-items:center;justify-content:center;padding:.8rem 1.5rem;background:#c41e1e;color:#f0ebe3;border:1px solid #c41e1e;font-size:11px;letter-spacing:.16em;text-transform:uppercase;text-decoration:underline;text-underline-offset:3px;transition:background-color .15s,border-color .15s;}
.zp-fn-btn:hover{background:#e65650;border-color:#e65650;color:#030303;}
.zp-fn-btn--ghost{background:transparent;color:#f0ebe3;border-color:#1e1e1e;}
.zp-fn-btn--ghost:hover{background:#1e1e1e;color:#f0ebe3;border-color:#e65650;}
.zp-fn a:focus-visible,.zp-fn summary:focus-visible{outline:2px solid #e65650;outline-offset:3px;}
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

/** Remove the former second-line contact promise from the homepage heading. */
export function removeContactSubheadStatic(html) {
  return html
    .replace(
      /<span class="mt-2 block italic text-blood">A written quote, scope and schedule follow review\.<\/span>/,
      '',
    )
    .replace(/Project inquiries\s+<\/h2>/, 'Project inquiries</h2>');
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
  let legacyHtml = cleanStaticHtml(html)
    .replace('Take the reel with you', 'Download reel')
    .replace('You work with the composer, not a middleman.', 'Bio')
    .replace('Horror scores that make them feel it ', 'Dark, atmospheric horror scores, ')
    .replace('before they see it.', 'written to your picture.')
    // Normalize the immediately previous contact-copy release as well as the
    // current table, so this one-time copy refresh remains rebuild-safe.
    .replace('Tell me about the film - and the deadline.', 'Project inquiries')
    .replace('Only your name and email are required. Add a cut, a cue list or a deadline if you have them - the form prepares an email for you to review and send. No call, no commitment, no spam.', 'Please provide your name and email. Project details and deadlines are optional.');
  // Restore the generated contact subheading before reversing copy pairs. This
  // keeps future homepage rebuilds compatible with snapshots where the visible
  // subheading was intentionally removed.
  const contactStart = legacyHtml.indexOf('<section id="contact"');
  const headingStart = legacyHtml.indexOf('<h2 ', contactStart);
  const headingEnd = legacyHtml.indexOf('</h2>', headingStart);
  if (contactStart >= 0 && headingStart >= 0 && headingEnd >= 0 &&
      !legacyHtml.slice(headingStart, headingEnd).includes('mt-2 block italic text-blood')) {
    legacyHtml = legacyHtml.slice(0, headingEnd) +
      ' <span class="mt-2 block italic text-blood">A written quote, scope and schedule follow review.</span>' +
      legacyHtml.slice(headingEnd);
  }
  // The hero CTAs went back to their shipped wording on 2026-10-29
  // ("Play the showreel" / "Start an inquiry"), so an already-built document
  // has to be unwound before the rest of the patch sees canonical text.
  const ctaRestored = restoreHeroCtaLabels(legacyHtml);
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
  if (sectionStart < 0 || start < 0) throw new Error('conversion-copy/static: Showreel header boundary not found');
  if (end < 0 && html.startsWith(SHOWREEL_HEADER_STATIC_TITLE, start + '<div class="min-w-0">'.length)) return html;
  if (end < 0) throw new Error('conversion-copy/static: Showreel header boundary not found');
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

/** Remove the redundant cue-count badge, but keep the player and download. */
export function removeShowreelCountBundle(bundle) {
  return removeBundleCall(bundle,
    'u.jsxs("div",{className:"flex items-end gap-3 rounded-sm border border-white/5 bg-white/[0.02] px-5 py-4 backdrop-blur-sm md:flex-col md:items-end"',
    'showreel cue count');
}

export function removeShowreelCountStatic(html) {
  return html.replace(/<div class="flex items-end gap-3 rounded-sm border border-white\/5 bg-white\/\[0\.02\] px-5 py-4 backdrop-blur-sm md:flex-col md:items-end"><p class="font-display text-5xl leading-none text-blood sm:text-6xl">\d+<\/p><p class="pb-1 text-\[10px\] uppercase tracking-\[0\.3em\] text-mist">Curated cues<\/p><\/div>/, '');
}

/**
 * Drop the homepage "02 · Approach" block (#method) outright (2026-10-29).
 * The section is a single top-level `<section id="method">…</section>` with no
 * nested section, so the first closing tag ends it. Idempotent: once the
 * section is gone from the snapshot this returns the markup untouched.
 */
export function removeMethodSectionStatic(html) {
  const opening = '<section id="method"';
  const start = html.indexOf(opening);
  if (start < 0) return html;
  if (html.indexOf(opening, start + opening.length) >= 0) {
    throw new Error('conversion-copy/static: #method matched more than once');
  }
  const end = html.indexOf('</section>', start);
  if (end < 0) throw new Error('conversion-copy/static: #method section never closes');
  return html.slice(0, start) + html.slice(end + '</section>'.length);
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
  if (!kept) {
    if (!out.includes('</head>')) throw new Error('conversion-copy: no </head> to attach funnel styles');
    out = out.replace('</head>', () => `${block}\n</head>`);
  }
  const script = '<script defer src="/selected-cues.js?v=2"></script>';
  // Keep the script in place: moving it after the generated SEO tags leaves
  // their empty lines in the head on every prerender, causing CI drift.
  let scriptKept = false;
  out = out.replace(/<script defer src="\/selected-cues\.js(?:\?v=[^"]+)?"><\/script>\n?/g, () => {
    if (scriptKept) return '';
    scriptKept = true;
    return `${script}\n`;
  });
  if (!scriptKept) out = out.replace(block, () => `${block}\n${script}`);
  return out;
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
