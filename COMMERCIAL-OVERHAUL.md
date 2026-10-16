# Commercial overhaul: approved pricing, packages, and quote estimator

Status: **approved pricing implemented on this branch. Draft for review, not
deployed.** Public prices below are the APPROVED structure
(`src/data/pricing.ts`, `PRICING_STATUS = 'approved'`, reviewed 2026-10-16).
Legal documents still carry the previous defaults and must be reconciled
before merge (see §3 and `PROPOSED-LEGAL-UPDATES.md`).

## 1. What changed

**Positioning.** Homepage, hire, services, contact, and FAQ lead with
"Original music for psychological horror & experimental cinema" and
"Dissonance. Atmosphere. Emotional intensity." Specialist scope is named:
psychological horror, folk horror, supernatural, surrealism, and experimental
film. Primary CTA is "Request a scoring quote"; secondary CTA is "Hear
selected film work". The site no longer presents the composer as a generic
audio or post-production contractor.

**Packages (one source of truth: `src/data/pricing.ts`).** Packages are chosen
by **scored music minutes**, never by film runtime. Each package publishes a
**starting fee (a floor), not a guaranteed maximum amount of music (a
ceiling)** — a complex two-minute composition may require a higher quote than
a simple atmospheric cue of the same length. Bands are contiguous and
non-overlapping (1–2, 3–5, 6–12), and the steps between them reflect a
meaningful scope change (single cue vs. spotted short with motifs vs.
developed thematic score), guarded by a regression test that fails any step
that reaches 1.6× for one extra minute.

| Package | Scored music | Price (approved, USD) |
| --- | --- | --- |
| Individual Scene Scoring | about 1–2 min | From $250 |
| Focused Short-Film Score | about 3–5 min | From $650 |
| Extended Short-Film Score | about 6–12 min | From $1,500 |
| Feature Film & Experimental Cinema | more than 12 min, or multi-part work | Custom quotation (indicative minimum $2,500 for substantial engagements) |

Feature clients needing only a single scene commission it as an Individual
Scene; the $2,500 indicative minimum applies to substantial feature-scoring
engagements, not to every project associated with a feature.

**Quote estimator.** Responsive to scored minutes, cue count, musical
complexity, deadline, package-specific revision allowances, and licence
scope. Revision math is deterministic and tested: each round beyond the
included allowance costs $75 minimum or 10% of the commission fee, whichever
is greater. Every estimate is labelled "Preliminary estimate — final
quotation subject to creative scope and written agreement." Copyright
assignment (buyout) and soundtrack albums are never added to an estimate;
they are quoted individually under a separate written agreement, with no
fixed buyout amounts invented anywhere.

**Revisions.** One consolidated revision round included for Individual Scene
and Focused scores; two for Extended scores. A round means one consolidated
set of reasonable changes to an agreed creative direction; new cues,
substantial rewrites, and changes caused by picture recuts are separately
quoted.

**Deadlines.** Standard schedule, no surcharge. Expedited delivery (about
10–20 days), +15%. Rush delivery (under 10 days), +30%, subject to
availability.

**Payment.** 50% deposit before work begins; remaining 50% due before release
of final approved deliverables, subject to the written agreement. Applies to
new commissions only; existing contracts are unchanged (see `terms.html`
clause 24).

**Standard commission.** Original music synchronized to picture, agreed
musical scope and cue deliverables, defined consolidated revisions, and
professional stereo WAV delivery with a cue list and timings. Multitrack
stems, alternate mixes, surround/immersive mastering, dialogue editing, final
film mixing, comprehensive audio post-production and bespoke sound-design
packages are specialist work, considered individually after a feasibility
check. They are not standard inclusions.

**Separation of products.** The downloadable SFX catalogue and store products
are unchanged and kept apart from custom scoring commissions. Sound-design
and game-scoring pages keep their own stem/layer deliverables (natural to
those services) and no longer promise funding-linked pricing.

**Rights.** Composition is a service. The base price covers a standard
project-use licence (use in the named production, its festival run and its
own release; copyright stays with the composer). Exclusivity, copyright
assignment, soundtrack exploitation and expanded uses require a separate
written agreement and are never bundled automatically into low-priced
packages.

**Affordability.** No public student-film floor, no sliding scale, no
"typically a few hundred dollars". Commercial pages carry: "Independent and
micro-budget productions are welcome to inquire. Where appropriate, a reduced
musical scope or licensing of existing material may offer a more accessible
alternative." A reduced scope never implies unlimited music, revisions, or
rights.

**Pages updated.** `/` (homepage island, estimator, budget list), `/services`,
`/hire-a-composer`, `/contact`, `/composer`, `/process` (rewritten delivery,
revisions and rights sections; "spotting to stems" → "spotting to delivery"),
`/faq` (fees, revisions, payment, rights answers rewritten in
`legal-src/pages/faq.html`; schema regenerated), `/sound-design` and
`/game-scoring` (funding-linked pricing removed), `/work` and `/reel` hub
cards, `/404`, `/sitemap`, `/legal`, `/store` (commission copy only), and hub
metadata in `src/data/hubs.ts`. Each page exists in both its root twin and
its directory form. `terms.html` and `licensing.html` operative clauses were
deliberately NOT edited (see §3).

**Removed unsupported claims.** "Lean / Standard / Signature / Orchestral+"
tiers, "sliding scale tied to project funding", "typically a few hundred
dollars", "reply within 48 hours" (scoring), "Boutique capacity",
"award-winning" (outside the flagged items below), the "5.0 collaborator
rating" in the footer, the award property in composer JSON-LD, "two rounds
per cue plus consolidation pass", "production tier", and the HowTo
`estimatedCost` fixed figure on `/process`.

**Engineering.**
- `scripts/sync-pricing.mjs` fills `{{zp:…}}` tokens and the `<!--zp:NAME-->`
  blocks from `pricing.ts`. Its `--check` mode fails on drift. New tokens:
  `feature-minimum`, `revision-minimum`, `revision-rate`,
  `revision-definition`, `starting-fee-note`, `microbudget`, `payment`.
- `scripts/build-estimator.mjs` bundles the estimator into hashed
  `estimator-<hash>.js/.css`, and wires the references into the pages and
  `sw.js`.
- `src/lib/pricing-markup.ts` renders the estimator, cards, factors, licences,
  inquiry form (mailto action preserved), and Offer JSON-LD. Offers publish
  floors only (`minPrice`, no `maxPrice`); the feature offer names the
  indicative minimum in prose with no fixed price.
- `home-src/build.mjs` patches the homepage bundle island, budget list, and
  services header from `pricing.ts` (run manually; committed output).
- `npm run build` runs pricing sync and estimator build before prerender and
  verify, and checks pricing sync.
- `_headers`: immutable cache rule for `/estimator-*.js`.
- `sw.js`: estimator assets in `PRECACHE_ASSETS`.
- `tools/pricing.test.mjs`: 15 regression checks on routing, contiguity,
  bands, monotonicity, cliff guard, rounding, surcharges, package-specific
  revision allowances, the $75/10% rule, custom-quote paths, offers floors,
  budget options, and determinism. `npm test` runs these with the existing
  film-player tests (26 total).
- Route twins kept byte-identical via `tools/route-aliases.mjs`.

## 2. Owner approvals needed before merge

1. **Public prices and bands** in `src/data/pricing.ts` (Scene from $250 at
   1–2 min; Focused from $650 at 3–5 min; Extended from $1,500 at 6–12 min;
   feature custom with $2,500 indicative minimum for substantial
   engagements).
2. **Package steps.** Scene 2-min low $450 → Focused 3-min low $650 (+44%);
   Focused 5-min low $1,150 → Extended 6-min low $1,500 (+30%). Each step is
   a scope change (single cue → spotted short with motifs → developed
   thematic score), guarded under 1.6× by test. Confirm the steps read as
   scope changes, not cliffs.
3. **Licence default.** Legal documents still say the default grant is
   buyout (see §3). This branch prices a standard project-use licence as the
   base. One of these must change — see `PROPOSED-LEGAL-UPDATES.md` item 1.
4. **Surcharge multipliers** (complexity 1.0/1.2/1.4, deadline 1.0/1.15/1.3,
   licence 1.0/1.25/1.4), the extra-cue fee ($50), and the extra-revision
   rule ($75 minimum or 10%, max 3 rounds).
5. **Standard inclusions list** (stereo WAV, cue list, package-specific
   revision rounds).
6. **Phone number** shown on `/contact` (verify before publishing).
7. **Proposed legal updates** in `PROPOSED-LEGAL-UPDATES.md` (items 1–5),
   ideally with counsel for item 1.

## 3. Legal contradictions (NOT edited. Owner approval required)

`terms.html` and `licensing.html` (and their `legal-src/pages/` sources) were
not changed on this branch. The site copy now follows the approved model, so
these pages must be reconciled before deployment. Exact current text and
proposed replacements live in `PROPOSED-LEGAL-UPDATES.md`:

- `terms.html` clause 10 + `licensing.html` §2–§4: default grant is buyout.
  Commercial pages say the base is a standard project-use licence.
- `terms.html` clause 7: two rounds per cue plus one consolidation pass. The
  approved model is 1 / 1 / 2 consolidated rounds plus the $75-or-10% rule.
- `terms.html` clause 6: balance "on delivery of the final stems". The
  approved term is "before release of the final approved deliverables".
- `terms.html` clause 8: standard delivery lists stems, alternate mixes, and
  an MP3 reference set. The approved standard is stereo WAV plus cue list.
- `terms.html` clause 5: "production tier" reference is stale.
- `faq.html` answers that now depart from the legal defaults: q-what-it-costs,
  q-what-moves-price, q-deposit, q-revisions, q-who-owns, q-soundtrack-release,
  q-ai-training (all rewritten on this branch).
- `/process` body and HowTo JSON-LD were rewritten to the approved model and
  now depart from the legal defaults in the same way.
- `LEGAL.md` and `RATIFY.md` are historical records; add a dated addendum on
  approval rather than rewriting them.

## 4. Claims flagged for owner verification (kept, not removed)

- "Winter 2024 Award Winners" press-release PDF card on the homepage and
  `/composer`, and the award line on `/404`. Confirm the award and the PDF
  before keeping it.
- Press placements (Grammy Weekly, Limitless Magazine, Billboard Wire).
  Confirm each placement.
- "Verified production collaborators" (homepage reviews heading) and
  "Verified role" credits on work pages. Confirm the basis for "verified".
- "5.0 collaborator rating" in the README, hero, testimonials, and store
  (footer removed).
- "Shorts to features" capability wording removed from the bio; the "stems"
  wording on sound-design and game-scoring pages is service-accurate (kept).
- The reel and cue genre label "Psychological Orchestral" (kept).
- Catalogue `/purchases` "reply target is 48 hours" for order failures
  (kept; catalogue-only, not a scoring promise).

## 5. Known issues and limits

- The homepage bundle still contains dead configuration for the old "it"
  branch (stems, themes) and a "Micro / name-your-price" branch. Neither is
  rendered. Removing them requires changing the bundle source and is left
  for a later pass.
- No real browser (Chromium/Playwright) was available. Behaviour was verified
  by unit tests (26/26), `verify.mjs` structural/link/schema/media audits,
  static accessibility-attribute checks, and estimator output checks at nine
  realistic configurations. Run a visual check on mobile and desktop before
  merge.
- FAQ answers were rewritten, and the untouched entries still reference the
  old legal defaults in places. Review the full FAQ with the owner after §3
  is resolved.

## 6. Verification (this branch)

- `./node_modules/.bin/tsc -p .`: pass.
- Full pipeline: store build, legal build, route aliases, typecheck,
  home-src bundle build, pricing sync, estimator build, pricing sync check,
  sitemap, Vite, prerender, verify (84 URLs, 76 images, 12 videos), route
  aliases check, sitemap check: all pass.
- `npm test`: 26/26 pass (15 pricing, 11 film-player).
- Estimator outputs at realistic scopes: 1 min → Scene $250–$350; 2 min →
  $450–$550; 2 min bespoke+rush → $825–$1,000; 4 min layered → Focused
  $1,075–$1,300; 5 min +1 revision → $1,275–$1,475; 8 min → Extended
  $1,750–$2,050; 10 min layered+rush+exclusive+1 revision → $4,800–$5,650;
  12 min → $2,250–$2,650; 14 min → custom quotation (indicative $2,500
  minimum, single-scene path noted); buyout/album → custom, never priced.
- Pricing sync `--check`: PASS across 9 pricing pages.
- Contradiction sweep: no `$200–$350`, `From $500`, `From $900`, `$75.99`,
  "few hundred dollars", or "sliding scale" remains in any served HTML/JS
  (only historical notes and the pristine `bundle.orig.js` retain them).
- JSON-LD: services offers carry `minPrice` only (250/650/1500, USD);
  feature offer carries no fixed price. All blocks parse under `verify.mjs`.
- Not run: visual browser review, Lighthouse, live route audit, IndexNow.

## 7. Deployment notes

- Do not merge until §2 is approved and §3 is reconciled
  (`PROPOSED-LEGAL-UPDATES.md` applied or formally deferred).
- Cloudflare Pages deploys from `main` only. Nothing here is deployed by
  this branch.
- After merge, submit the sitemap only after the owner has approved the
  public prices.

## 8. Before-and-after comparison

| Area | Before (provisional) | After (approved) |
| --- | --- | --- |
| Scene | $200–$350 range, 1–3 min | From $250, 1–2 min |
| Focused | From $500, 3–6 min (overlapping label) | From $650, 3–5 min |
| Extended | From $900, 7–12 min | From $1,500, 6–12 min |
| Feature | Custom, no guidance | Custom, $2,500 indicative minimum for substantial engagements; single scenes use Scene |
| Price meaning | Mixed range/from labels | Every package publishes a starting fee (floor); no ceiling published anywhere |
| Revisions | Two rounds per cue + consolidation pass (all) | 1 / 1 / 2 consolidated rounds by package; +$75 min or 10% per round |
| Revision definition | "One collected set of notes" | Full definition; new cues, rewrites, recuts separately quoted |
| Deadlines | Three weeks / two weeks / under ten days | Standard / expedited 10–20 days +15% / rush under 10 days +30% |
| Extra cues | $35 each | $50 each (2 per minute included) |
| Base licence | Non-exclusive project licence | Standard project-use licence, clearly defined |
| Buyout/album | Quoted individually | Quoted individually under separate written agreement; never automatic |
| Estimate label | "Indicative range, not a quote" | "Preliminary estimate — final quotation subject to creative scope and written agreement" |
| Payment | 50/50, "balance on delivery of final stems" | 50% deposit before work begins; balance before release of final approved deliverables |
| Delivery | Stems/alts/MP3 promised in places | Stereo WAV + cue list; stems/alts/surround/mix/post are specialist work |
| Low budgets | $75.99 student floor in history; "few hundred dollars" | Micro-budget statement; reduced scope or licensing existing material |
| Legal docs | Buyout default, stems delivery, 2-round terms | Untouched (see §3); replacements proposed in `PROPOSED-LEGAL-UPDATES.md` |
