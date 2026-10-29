# Homepage Conversion Funnel — Strategy & Copy Deck

**Scope:** the edits in this deck are homepage-only (`/`). The separate `/services` and inquiry routes remain available.
**Mode:** concise direct-response copy with clear positioning, credible proof, objection handling, and repeated CTAs.
**Status (2026-10-29):** the live homepage is generated from `home-src/build.mjs` + `home-src/conversion-copy.mjs`. In addition to the earlier removals, the homepage commissioning section and the “READY WHEN YOU ARE” closing section are now removed. The inquiry form remains at the bottom of the homepage; the separate contact page has been retired, and legacy `/contact` requests redirect to `/#contact`. The dedicated `/services` route remains. The hero leads with **“WE CORRUPT SILENCE TO SERVE THE FRAME.”** and the requested avant-garde scoring description; the Hollywood-score tagline is removed. Film samples are headed **Showreel**, and the music player section is headed **Original cues**. The funnel sections still live are Obsession and Objections.

> The detailed commissioning and closing-section copy below documents an earlier draft; it is not rendered on the current homepage. The Objections section now links to the dedicated `/services` route instead of an in-page `#services` anchor.

---

## 1. The problem this rewrite solves

The old homepage was a beautiful portfolio that assumed the visitor was already
sold. It opened with a craft statement ("Dark, atmospheric horror scores,
written to your picture"), showed credentials, and waited. A skeptical producer
arriving with a locked cut, a festival deadline and three other composer tabs
open got no answer to the only questions that matter:

- **Why does this matter now?** No cost-of-inaction. Nothing said what a
  forgettable score actually costs a film.
- **What will it do for my film?** Copy described *music*, not *outcomes* —
  tension control, audience retention, trailer impact, festival buzz.
- **What if it goes wrong?** No objection handling, no process clarity, no
  turnaround expectations, no delivery specifics.
- **What do I do next?** One CTA at the top, one at the bottom. No repeated
  on-ramps, no low-risk first step.

**Integrity constraint (carried forward).** Testimonials and the "5.0
collaborator rating" badge were removed on 2026-10-24 because there were no
attributable, permissioned quotes to publish. This rewrite does **not**
reintroduce fabricated social proof. Trust is built only from verifiable
assets already on the site: IMDb credit, Ars Electronica 2026, 20.4-channel
spatial audio, MUSLAB/Cero Records, EXiS Seoul, the Black Mountain College
Museum + Arts Center commission, 30 showreel cues, 9 productions, 24 catalogue
releases, and real press coverage. No invented client quotes, ratings, results
statistics, or scarcity numbers.

---

## 2. Funnel architecture

```
ATTENTION  ──►  AGITATION  ──►  DESIRE  ──►  TRUST  ──►  ACTION
   hero          obsession     posters      about        objections
                               work         comps        contact
                               showreel     press
                               method
```

| Stage | Section | Job | Structure used |
|---|---|---|---|
| **Attention** | `#top` hero | Stop the scroll; signal status + distinctive identity | Hook → lead → dual CTA |
| **Attention → Agitation** | `#zp-obsession` **(new, 2026-10-27)** | A distinctive opening manifesto: the owner-supplied hook, an obsession question, and the requested study sentence | Hook → curiosity → study sentence → CTA |
| **Desire** | `#posters`, `#work`, `#showreel`, `#method` | Translate craft into producer outcomes | AIDA-Interest/Desire, benefit-led headlines, specificity |
| **Trust** | `#about`, `#compilations`, `#press`, `#zp-objections` | Lower resistance with proof, process clarity, rights/delivery answers | Verifiable credits and FAQ objection handling; service details link to `/services` |
| **Action** | `#contact` | Keep a direct path to the preserved inquiry form | Hero and form CTAs |

**Two active funnel sections**, injected in the exact same order in both render paths:

1. `#zp-obsession` — immediately after the hero, before `#posters`.
2. `#zp-objections` — between `#method` and `#contact`; its service-details CTA links to `/services`.

---

## 3. The four layers, applied

### Layer 1 — Cinematic identity (distinctive atmosphere/status)
Kept and sharpened rather than replaced. The hero keeps its two-tone display
headline and art-house register, but now leads with an outcome claim:
*"WE CORRUPT SILENCE TO SERVE THE FRAME."* Section headings
keep the franchise voice — "How the dread actually gets built", "Themes that
survive the trailer cut", "A palette that is not a preset" — while the press
section presents a formal **Press Kit** dossier with festival laurels, critical
pull-quotes, and third-party coverage.

### Layer 2 — Problem-aware, outcome-term copy
Every desire/trust section now speaks in producer outcomes instead of music
theory: tension that lands, audiences that stay, trailers that are remembered,
festival buzz, emotional control, and delivery you can plan around. The former
stakes section is retired; its failure-mode cards are not active copy.

### Layer 3 — Conversion structures
- **Headline → hook → lead** on every section.
- **AIDA** across the page: hero Attention → samples/method Desire →
  objections/trust → close Action.
- **Objection handling** as a 6-question FAQ in `#zp-objections`.
- **Offer clarity** — the objections FAQ and commissioning section describe
  what a quote covers without a published-price estimator.
- **Testimonials:** deliberately omitted (see integrity constraint). Replaced
  with attributable press headlines and verifiable credits.

### Layer 4 — Trust architecture
- **Credits/results:** IMDb credited; Ars Electronica 2026; 20.4-channel
  spatial audio; MUSLAB/Cero Records; EXiS Seoul; Black Mountain College
  Museum + Arts Center commission.
- **Sample reels:** 30-cue showreel, 9 productions, 24-track catalogue;
  "listen first, no signup" framed as the low-risk first step.
- **Process clarity:** spotting session, written tone reference, cue list
  before composition, defined consolidated revision rounds, WAV delivery.
- **Turnaround expectations:** rush/expedited quoted only against confirmed
  availability — never promised before the written agreement.
- **Rights:** pointed at `/licensing` and the written agreement rather than
  asserting a grant. **No legal/pricing wording was restated.**
- **FAQs:** six `<details>` items (no JS, works without hydration).

---

## 4. Section-by-section copy deck (old → new)

### `#top` — Attention
| Element | Old | New |
|---|---|---|
| Availability badge | Booking select projects | **Removed** (owner request; no scarcity badge) |
| H1 | Earlier portfolio positioning | **WE CORRUPT SILENCE TO SERVE THE FRAME.** |
| Description | Earlier genre/service summary | Bespoke, avant-garde sonic identities for psychological horror, folk horror, atmospheric dramas, and experimental art-house cinema. |
| Supporting line | Previous Hollywood-score tagline | **Removed** at the owner's request |
| Hero trust strip | IMDb credited | **Removed** with the booking badge; verifiable credits remain in the objections section. |
| Secondary CTA | Play the showreel | Hear the showreel |
| Primary CTA | Request a scoring quote | Get a free written quote |

### `#zp-obsession` — Opening manifesto (new section, 2026-10-27)
This is the page's new cold open, placed immediately after the hero. It gives
the composer a genuinely distinctive voice and leads on a jarring statistic.
Owner decisions: **verbatim** opening statistic and a **new section**. The stakes section was later removed.

**Revision (2026-10-27, same day).** The owner felt the first pass — which
softened the mechanisms into hedged, peer-reviewed claims with `[1][2][3]`
citation links and a collapsed "Sources & method" note — read like an academic
explainer and diluted the pitch. To maximize conversions, all citations,
hedging, and the on-page disclaimer were **removed**; the mechanisms are back
as confident, visceral, outcome-first marketing claims. The owner will add
their own disclaimer and/or long-form articles on sound, technique and the
psychology of horror later (deliberately not started in this pass).

- Kicker: *Field notes / the obsession*
- H2 claim (verbatim, with the brief's `++…++` / `**…**` emphasis rendered as
  bold): *"87% of independent psychological horror, folk dread, atmospheric
  dramas, and experimental thrillers get rejected by **Sundance**, **SXSW**,
  **TIFF, and A24/NEON acquisitions** within the first 600 seconds."*
- Obsession question: *"I became obsessed with a single question: why do
  certain frequencies make our bodies prepare to die?"*
- The requested neurobiology / sonic warfare study sentence remains directly
  beneath the obsession question. No mechanism cards, citations, or science
  explainer were restored.
- Bridge: *"I bring that obsession into every cue — so the dread lands before
  the audience can name it, and your film stays with them long after the credits."*
- CTA: "Hear it in 30 original cues" (#showreel).

**No on-page disclaimer.** The 87% figure is kept verbatim at the owner's
explicit request and is currently unsourced on the page. Naming real
festivals/distributors in an unsourced rejection claim is the main
legal/reputational risk; the owner has chosen to retain it verbatim. No
citations, science explainer, or article are being added unless requested.

### `#zp-stakes` — Retired
The owner removed the full “THE COST OF GETTING IT WRONG / Your film has one
chance to be felt” section, including its three cards, CTAs, and styling. It
remains absent from both the prerendered HTML and the React bundle.

### `#posters` — Credits
- Latest owner revision (2026-10-28): reduced the header to the single word
  **Credits**. Removed the kicker and descriptive lead.

### `#work` — Desire
- Latest owner revision (2026-10-28): the film-samples intro is a plain
  **Showreel** heading; the kicker and explanatory paragraph are removed.
- All film samples and their controls remain.

### `#showreel` — Desire
- Latest owner revision (2026-10-28): the audio/music section is titled
  **Original cues**; the flowery kicker, headline and long cue-description lead
  remain removed.
- The audio player, cue controls, and **Take the reel with you** download link remain.

### `#about` — Trust
- H2: The composer behind the atmosphere →
  **You work with the composer, not a middleman.**
- CTA: Start a Conversation → **Talk to the composer directly**

### `#compilations` — Trust
- Kicker: **Compilation Features**
- H2: **Selected Works**
- The descriptive lead is removed; compilation cards and their players remain.

### `#press` — Press Kit & Critical Recognition
- H2: **Press Kit** (no redundant kicker or side dossier box)
- Lead: *"Independent features, interviews and award coverage - read what
  other people heard before you decide."*
- Four-tier editorial press dossier (`src/lib/press-kit-markup.ts`):
  1. **Festival Laurels & Jury Recognition:** Golden Bloody Globes, Re:Fract Festival (2025) Special Jury Mention, PVTV Fringe Flicks, and Pebbles Underground · VisualcontainerTV (2024).
  2. **Critical Acclaim Spotlight:** Verbatim pull-quotes from David Finkelstein's review in *Lake Ivan Film Journal* (*"Spinning in the Wildness: Phantom Requiem"*).
  3. **Selected Features, Interviews & Coverage:** Six monograph press cards (*Lake Ivan Film Journal*, *Billboard Wire*, *Grammy Weekly*, *Limitless Magazine*, *Black Mountain College Museum*, *Visual Container TV* PDF).
  4. **Official Profiles, Credits & Streaming:** Verified industry directory (*IMDb*, *FilmFreeway*, *Bandcamp*, *Spotify*, *Apple Music*, *YouTube*, *SoundBetter*, *Muso.AI*).

### `#method` — Desire/differentiation
- H2: A distinct point of view, built for the story. →
  **How the dread actually gets built.**
- Lead: now leads with "shaped to your picture, not a template" plus spotting,
  defined revisions, plannable delivery.
- Cards:
  - Psychological architecture → **Tension you can control** (releases timed
    to your cut; audience afraid before anything happens)
  - Dark atmospheric color → **A palette that is not a preset** (never a stock
    scary-pack preset)
  - Cinematic themes that stalk → **Themes that survive the trailer cut**

### `#zp-objections` — Trust/objection handling (active section)
- Kicker: *Before you commit*
- H2: **The questions producers actually ask.**
- Lead: *"straight answers and verifiable credits — no pitch, no invented
  testimonials, no hidden fees."*
- Verifiable credit list: IMDb credited · Ars Electronica 2026 · 20.4-channel spatial
  audio · MUSLAB / Cero Records · EXiS Seoul · Black Mountain College Museum
  + Arts Center commission · 30-cue showreel · 9 selected productions ·
  24-track catalogue.
- FAQ (6): fit to edit / brutal deadline / do I own the music / what is
  delivered / what if it is not right / how much will it cost.
- CTAs: commissioning details (#services), full FAQ (/faq), process
  (/process).

### `#services` — Trust/offer
- Preserves the latest-main commissioning flow: **Commissioning a score**, no
  published rate estimator, and a written inquiry/quote path.
- The homepage does not reintroduce package prices or estimator copy.

### `#zp-close` — Action (new section)
- Kicker: *Ready when you are*
- H2: **Send the cut. Get a written quote. Decide with the music in your ears.**
- Lead: two fields to start; written scope, fee and schedule after review;
  *"If it is not the right fit, I will say so."*
- CTAs: "Get a free written quote" (#contact) + "Or listen first" (#showreel).
- Micro reassurance: *"Listen first. Decide after."*

### `#contact` — Action
- H2 line 1: Tell me about your project. → **Tell me about the film — and the
  deadline.**
- H2 line 2: A written quote follows review. → **A written quote, scope and
  schedule follow review.**
- Lead: now *"No call, no commitment, no spam."*
- Submit: Send scoring inquiry → **Get my written quote**

---

## 5. CTA ladder (repeated, descending commitment)

| Commitment | CTA | Where |
|---|---|---|
| Zero | Hear the showreel / Play 30 cues / Or listen first | hero, showreel, close |
| Zero | Read the FAQ / See the process | objections |
| Low | Listen to the reel / read the process and FAQ | showreel, objections |
| Medium | Get a free written quote | hero, close |
| High | Talk to the composer directly / Get my written quote | about, contact |

---

## 6. Objection → response matrix

| Objection | Response |
|---|---|
| Will it fit my edit? | Spotting session, written tone reference + cue list before composition, defined revision rounds |
| My deadline is brutal | Honest feasibility up front; rush/expedited quoted only against confirmed availability, never promised pre-agreement |
| Do I own the music? | Point to `/licensing` and the written agreement; never assume a grant not in writing |
| What do I get? | Original music to an agreed cue list, WAV files, cue list with timings, revision rounds; stems/mixes/mastering quoted separately |
| What if it is not right? | Defined consolidated revision rounds; one consolidated set of changes per round |
| How much? | Individual written commission quote; no published-price estimator |

---

## 7. Guardrails observed

- **No fabricated testimonials, ratings or client results.** (The opening
  "87% … within 600 seconds" figure is the owner-supplied hook, kept verbatim
  at their explicit request. It remains unsourced. No citations or science
  explainer are in the live copy, and no article work is underway; see §4,
  `#zp-obsession`.)
- **No legal/pricing operative wording restated** — licences, deposits and
  delivery promises are pointed at `/licensing`, `/faq` and the written quote.
- User-requested homepage edits stay scoped to `/`; upstream commission-flow changes from the latest `main` are preserved.
- All new copy avoids unescaped double quotes (the bundle embeds it in JS
  string literals); `assertBundleParses()` still guards the built bundle.
- Section numbering runs `01 · Biography`, `02 · Approach`, and `03 · Contact`;
  film samples and original cues use plain headings. Tests verify both render paths.
- New sections use `<h2>`/`<h3>` only — the page keeps exactly one `<h1>`.
- Styling is a scoped `zp-fn-` inline style block; no shared stylesheet edits,
  no new external resources, no JS (FAQ uses native `<details>`).
- Internal links and fragments all resolve (`/faq`, `/process`, `/licensing`,
  `/services`, `#showreel`, `#contact`, `#zp-objections`).

---

## 8. Implementation & maintenance

**Single source of truth:** `home-src/conversion-copy.mjs` holds the `COPY`
table (current entries, with `bundle`/`html` variants where escaping differs),
the three active section definitions, and the scoped CSS.

**How the dual render path is kept in sync** (`home-src/build.mjs`):
- Funnel copy, injected sections, simple Credits/Showreel/Original cues headings, and hero-badge removal run last in `patchBundle`.
- `normalizeStaticCopy()` + `normalizeStaticSections()` run **first** in
  `patchStatic` (index.html is a committed artifact, so a rebuild must first
  restore canonical strings/sections before the older PAIRS and section-reorder
  logic runs); `applyStaticCopy()` + `injectStaticSections()` run last.
- `ensureFunnelAssets()` injects one `<style id="zp-fn-style">` into `<head>`;
  `ensureCompilationsAssets()` also deduplicates its inline blocks.
- `scripts/normalize-site-copy.mjs` runs after public-site generation so generated
  HTML, XML, and text remain dash-normalized; the homepage bundle is normalized
  before hashing.
- `audit()` in the module lints every `from`/`to` string against both shipped
  artifacts — run it after any source copy change.

**To edit copy:** change `home-src/conversion-copy.mjs`, then
`node home-src/build.mjs` (or `npm run build`). The rebuild is idempotent —
verified byte-identical on repeat.

**Verification run (all green):**
- `npm test` — 64/64
- `node scripts/verify.mjs` — pass
- `check-headers` / `check-links` (8,825 links) / `check-forms` /
  `index-coverage --check` / `sync-commission --check` / `check-sitemap` — pass
- `npm run build` full chain (incl. `prerender.mjs`) — pass; repeated
  `node home-src/build.mjs` output is byte-identical
- rebuild byte-identical; served page + hashed assets HTTP 200

**Regression test expectations were updated** to track the intentional new
wording (the invariants they guard are unchanged):
`tools/boot-skip.test.mjs` (dash-normalized inline labels),
`tools/home-mount.test.mjs` (current homepage headings and hero copy), and
`tools/reel-download.test.mjs` (Take the reel with you link intact).

---

## 9. Recommended follow-ups (not implemented)

1. **Keep the owner-supplied 87% hook verbatim.** It remains unsourced as
   requested. Do not add citations, a science explainer, or an article unless
   the owner asks for that work.
2. **Collect real testimonials.** The FAQ explicitly avoids inventing them.
   Ask 3–5 past collaborators for a permissioned one-line quote + name/role;
   add them under `#zp-objections` with attribution. This is the single
   highest-value trust upgrade.
3. **A/B test the hero H1** — outcome-led ("make them feel it before they see
   it") vs. the original craft-led line — measured on progression to the commissioning section and
   quote-form starts.
4. **Measure the CTA ladder** with privacy-safe, first-party events (the site
   sets no cookies): track clicks on "Hear the showreel" → "Get a free written
   quote" → form submit to find the real drop-off.
5. **Consider a compact case study** on one production (cut → cue → audience
   reaction) once a director permits naming it.
