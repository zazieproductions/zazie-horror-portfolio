# Commercial overhaul: positioning, packages, and quote estimator

Status: **draft for owner review. Not deployed.** Public prices are PROVISIONAL and
must be approved before this branch is merged to `main`.

## 1. What changed

**Positioning.** Homepage, hire, services, contact, and FAQ now lead with
"Original music for psychological horror & experimental cinema" and
"Dissonance. Atmosphere. Emotional intensity." Specialist scope is named:
psychological horror, folk horror, supernatural, surrealism, and experimental
film. The site no longer presents itself as generic audio or post-production.

**Packages (one source of truth: `src/data/pricing.ts`).** Packages are chosen
by **scored music minutes**, never by film runtime.

| Package | Scored music | Price (provisional) |
| --- | --- | --- |
| Individual Scene Scoring | about 1–3 min | $200–$350 |
| Focused Short-Film Scoring | about 3–6 min | from $500 |
| Extended Short-Film Scoring | about 7–12 min | from $900 |
| Feature & Experimental Film Scoring | above 12 min | custom quote |

**Quote estimator.** Responsive to scored minutes, cue count, musical complexity,
deadline, revisions beyond two rounds per cue, and licence scope. Each estimate
is labelled "indicative range, not a quote". Buyout and soundtrack album are
never added to an estimate; they are quoted individually.

**Standard commission.** Original music composed to picture, agreed scope,
two revision rounds per cue, and professional stereo WAV delivery with a cue list.
Stems, alternate mixes, surround or immersive mixes, dialogue editing, final film
mixing, and advanced post are listed as specialist work, quoted after a
feasibility check. They are not standard inclusions.

**Separation of products.** The downloadable SFX catalogue and store products are
unchanged and kept apart from custom scoring commissions.

**Rights.** Composition is a service. The base price covers a non-exclusive
project licence. Copyright transfer (full buyout), exclusivity, soundtrack album,
and extra uses are quoted separately and are never bundled into low-priced
packages.

**Pages updated.** `/` (homepage patch and estimator), `/services`,
`/hire-a-composer`, `/contact`, `/composer`, `/process`, `/faq` (11 answers
rewritten; the other 24 kept), `/reel` and `/work` hub cards, `/404`, `/sitemap`,
`/purchases`, `/store` (commission copy only), and hub metadata in
`src/data/hubs.ts`. Each page exists in both its root twin and its directory form.

**Removed unsupported claims.** "Lean / Standard / Signature / Orchestral+" tiers,
"sliding scale tied to project funding", "typically a few hundred dollars",
"reply within 48 hours", "Boutique capacity", "award-winning" (outside the flagged
items below), the "5.0 collaborator rating" in the footer, and the award
property in composer JSON-LD. The footer, masthead, and hub text were updated
across all pages.

**Engineering.**
- `scripts/sync-pricing.mjs` fills `{{zp:…}}` tokens and the `<!--zp:NAME-->` blocks from `pricing.ts`. Its `--check` mode fails on drift.
- `scripts/build-estimator.mjs` bundles the estimator into hashed `estimator-<hash>.js/.css`, and wires the references into the pages and `sw.js`.
- `src/lib/pricing-markup.ts` renders the estimator, cards, factors, licences, inquiry form (mailto action preserved), and Offer JSON-LD.
- `npm run build` now runs pricing sync and estimator build before prerender and verify, and checks pricing sync.
- `_headers`: immutable cache rule for `/estimator-*.js`.
- `sw.js`: estimator assets added to `PRECACHE_ASSETS`; cache bumped to `zazie-v31`.
- `tools/pricing.test.mjs`: 9 regression checks on routing, bands, monotonicity, rounding, surcharges, and custom-quote paths. `npm test` runs these with the existing film-player tests.
- Broken section links fixed (`/contact#what-to-send`, `/services#rates`, `/services#tiers`).

## 2. Owner approvals needed before merge

1. **Public prices and bands** in `src/data/pricing.ts` (Scene $200–$350; Focused from $500; Extended from $900; feature custom).
2. **Scene-to-Focused step.** Scene tops out at $350 at 3 min; Focused starts at $500 at 4 min (a 43% jump). Confirm or smooth the bands.
3. **Licence default.** Legal documents still say the default grant is buyout (see §3). This draft says the base price is a non-exclusive project licence. One of these must change.
4. **Surcharge multipliers** (complexity, deadline, licence) and the revision-round rate (6% per extra round, max 3).
5. **Standard inclusions list** (stereo WAV, cue list, two rounds per cue).
6. **Phone number** shown on `/contact` (verify before publishing).

## 3. Legal contradictions (NOT edited. Owner approval required)

These documents were not changed. The site copy now follows the owner brief, so
these pages must be reconciled before this branch is deployed.

- `terms.html` clause 2: default grant is buyout.
- `terms.html` clause 6: 50% deposit, balance on delivery of "final stems", 14-day invoices.
- `terms.html` clause 7: two rounds per cue plus one "consolidation pass". The FAQ no longer mentions a consolidation pass.
- `terms.html` clause 8: standard delivery lists stems, alternate mixes, and an MP3 reference set. This conflicts with the brief.
- `licensing.html` §2–§3: default buyout on full payment, buyout offered as default. Conflicts with the new base licence.
- `process.html` (rights paragraph was rewritten; the legal JSON-LD still says "Default grant is buyout on payment in full"). Reconcile with `licensing.html`.
- `faq.html` answers that now depart from the legal defaults: q-who-owns, q-deliverables, q-revisions, and q-deposit (kept as-is; it still mentions final stems).
- `LEGAL.md` and `RATIFY.md` have not been reviewed against the new positions.

## 4. Claims flagged for owner verification (kept, not removed)

- "Winter 2024 Award Winners" press-release PDF card on the homepage and `/composer`, and the award line on `/404`. Confirm the award and the PDF before keeping it.
- Press placements (Grammy Weekly, Limitless Magazine, Billboard Wire). Confirm each placement.
- "Verified production collaborators" (homepage reviews heading) and "Verified role" credits on work pages. Confirm the basis for "verified".
- "5.0 collaborator rating" in the README, hero, testimonials, and store (footer removed).
- "Shorts to features" capability wording and the "stems" wording on sound-design (an SFX product, kept).
- The reel and cue genre label "Psychological Orchestral" (kept).

## 5. Known issues and limits

- The homepage bundle still contains dead configuration for the old "it" branch (stems, themes) and a "Micro / name-your-price" branch. Neither is rendered. Removing them requires changing the bundle source and is left for a later pass.
- No real browser (Chromium/Playwright) was available. Behaviour was tested in jsdom: estimator updates, validation, package switching, the contact mailto form, and JSON-LD parsing. jsdom reports a "Could not parse CSS stylesheet" warning on the homepage. This is a jsdom limitation with the site CSS, not a page error. Run a visual check on mobile and desktop before merge.
- FAQ answers were rewritten, and the 24 untouched entries still reference the old legal defaults in places. Review the full FAQ with the owner.

## 6. Verification (this branch)

- `npx tsc -p .`: pass.
- `npm run build`: pass. Store build, legal build, route aliases, typecheck, pricing sync and check, estimator build, sitemap, Vite, prerender, verify (84 URLs, 76 images, 12 videos), route aliases check, and sitemap check all succeed.
- `npm test`: 20/20 pass (9 pricing, 11 film-player).
- jsdom load: `/`, `/services`, `/contact`, `/hire-a-composer`, `/faq`. No page errors. All JSON-LD parses. Estimator at 2, 5, 10, 14, and 0 minutes gives the expected results.
- Estimator outputs at the default scope: 2 min → $250–$300; 3 min → $300–$350; 5 min → Focused $550–$675; 10 min → Extended $1,125–$1,275; 14 min → custom quotation.
- Pricing sync `--check`: PASS across 9 pricing pages.
- Not run: visual browser review, Lighthouse, live route audit, IndexNow.

## 7. Deployment notes

- Do not merge until §2 is approved and §3 is reconciled.
- Cloudflare Pages deploys from `main` only. Nothing here is deployed by this branch.
- After merge, submit the sitemap only after the owner has approved the public prices.
