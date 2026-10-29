# Commercial pricing integration and review notes

Status: **integrated on `arena/5a04007b-zazie-horror-portfolio`; not deployed or merged.** PR #83 is the intended pricing specification. Its approved $250 / $650 / $1,500 package starting fees have been reconciled with compatible newer `main` changes. The pricing source and rendered pages pass the build, test, and website verification listed below. No operative terms or licensing clauses have been changed.

## Public package specification

Pricing follows scored minutes of original music, not the film runtime. All public package fees are starting fees, not ceilings or promises of a specific amount of finished music. Whole-minute bands are contiguous and non-overlapping.

| Package | Scored-music scope guide | Starting fee (USD) | Standard estimate band |
| --- | --- | ---: | --- |
| Individual Scene Scoring | 1–2 minutes | From $250 | 1 min: $250–$350; 2 min: $450–$550 |
| Focused Short-Film Score | 3–5 minutes | From $650 | 3 min: $650–$800; 5 min: $1,150–$1,350 |
| Extended Short-Film Score | 6–12 minutes | From $1,500 | 6 min: $1,500–$1,750; 12 min: $2,250–$2,650 |
| Feature Film & Experimental Cinema | More than 12 minutes, multi-part or expanded scope | Custom quotation | Indicative $2,500 minimum applies only to substantial feature-film or experimental-cinema scoring engagements |

A feature client commissioning one scene or cue may use Individual Scene Scoring and is not subject to the substantial-project minimum. Scope labels are guides; an estimate and final fee depend on the agreed creative scope.

## Estimator rules under review

- Two cues per scored minute are included; each additional cue adds $50 before other adjustments.
- Complexity multipliers: focused palette 1.0, layered hybrid 1.2, bespoke/experimental 1.4.
- Schedule multipliers: standard 1.0; expedited (about 10–20 days) 1.15; rush (under 10 days) 1.3. Rush work is subject to availability.
- Included consolidated revision rounds: one for Individual Scene and Focused, two for Extended and Feature/custom. Each extra round is the greater of $75 or 10% of the commission subtotal, up to three extra rounds. A round is one consolidated set of reasonable changes to an agreed creative direction; new cues, substantial rewrites and picture recuts are scoped separately.
- Licence options in the estimator: standard project-use 1.0; expanded distribution 1.25; exclusive 1.4; copyright assignment/buyout and soundtrack album are individually quoted. **This commercial model conflicts with the current operative legal documents; the base rights model is not approved for publication until resolved with the owner and counsel.**
- The current pricing source describes payment as a 50% deposit before work begins and the remaining 50% before release of final approved deliverables, subject to the written agreement. Its commercial copy says this applies to new commissions only and leaves existing contracts unchanged. The operative terms currently use a different payment trigger; see the legal review below.
- The current commercial standard-inclusions list is original music to agreed scope, consolidated revisions, professional stereo WAV files (24-bit/48 kHz unless specified), and a cue list with timings. Stems, alternate mixes, surround/immersive mastering, final film mixing, dialogue editing, comprehensive audio post, bespoke sound design, live players, soundtrack mastering and other specialist work are separately scoped after a feasibility check. The operative terms currently list some of these as standard delivery; see below.

All figures, ranges, and estimator calculations must continue to come from `src/data/pricing.ts`. `scripts/sync-pricing.mjs` and `scripts/build-estimator.mjs` regenerate synchronized page copy and estimator assets. Built bundles must not be edited by hand.

## Compatible `main` work to preserve

- Low-friction inquiry: only name and email are required; project details remain optional in a closed disclosure, which opens when estimator scope is prefilled. A short first note is enough.
- Keep the composer biography, filmography, existing visual design, SEO metadata, navigation, media players, responsive layout, and route parity from the newer main changes.
- Keep dynamic pricing metadata generated from the pricing source, rather than PR #83's static summary or older metadata dates.
- Preserve the newer homepage defaults and supplied composer biography. Remove any duplicate neutral form option if encountered during integration.
- The estimator must distinguish a substantial feature/experimental project from a single feature scene, and the inquiry hand-off must retain estimator scope without making optional fields mandatory.

## Owner and counsel decisions still needed

The package starting fees and bands above are the intended PR #83 spec. Please confirm the remaining business decisions before publication:

1. Intermediate package steps and quote ranges (including the 2→3 and 5→6 minute changes); ensure the changes read as scope transitions rather than unexplained price cliffs.
2. Complexity, deadline and expanded/exclusive licence multipliers, $50 extra-cue amount, $75-or-10% extra-revision formula, and the three-round extra-revision cap.
3. Whether two revision rounds are also appropriate for custom Feature/Experimental commissions, and the exact definition and treatment of picture changes.
4. Standard delivery/inclusions, payment wording and the statement that the new payment terms do not change existing contracts.
5. Contact-page phone number and contact details before release.
6. The default rights model and each proposed change in `PROPOSED-LEGAL-UPDATES.md`; involve counsel on copyright assignment and the scope of the project licence.
7. Schedule availability language and the treatment of separately scoped specialist work.

The FAQ currently says the licensing and terms pages are under review and “will be updated before any rights position changes.” That is an additional forward-looking commitment; confirm that wording or revise it before publication.

## Contractual inconsistencies to resolve (operative terms left unchanged)

`terms.html` and `licensing.html` and their `legal-src/pages/` sources have deliberately not been edited. `PROPOSED-LEGAL-UPDATES.md` is a proposal only; it is not effective legal language. The following conflicts require written owner approval and, where appropriate, counsel review before deployment:

- **Rights default:** terms clause 10 and licensing §§2–4 describe copyright buyout/assignment as the default on full payment; the new commercial estimator and FAQ describe a project-use licence with copyright retained by the composer.
- **Revision allowance:** terms clause 7 provides two rounds per cue plus a consolidation pass; the commercial package model is one consolidated round for Scene/Focused and two for Extended (and currently Feature/custom), with paid extra rounds.
- **Payment trigger:** terms clause 6 says the balance is due on delivery of final stems; commercial copy says the balance is due before release of final approved deliverables.
- **Standard deliverables:** terms clause 8 lists stems, alternate mixes and an MP3 reference set as standard; commercial copy limits standard delivery to stereo WAV plus cue list and timings.
- **Scope description:** terms clause 5 refers to a “production tier”; the estimator and quote model use scored minutes and agreed scope.
- **Secondary-rights wording:** commercial FAQ and service copy say the named production's festival run and release are covered by the base project-use licence and that album/exclusive/expanded uses need a separate agreement. The licensing terms need to be checked against every described use, including distribution and publicity.
- **FAQ promise:** the FAQ's statement that terms/licensing pages “will be updated” may itself set an expectation; owner/counsel should approve it.

Do not apply the proposed legal replacements, edit operative clauses, or update `LEGAL.md`/`RATIFY.md` history without approval. If approved, record the decision in a dated addendum rather than rewriting historical records.

## Verification status and release gate

- `npm ci` completed. npm reported two dependency audit advisories (one moderate, one high); no automatic dependency changes were made.
- `npm run build` passed, including source compilation, estimator and homepage builds, pricing synchronization/check (9 pages), sitemap generation (84 URLs), prerender, route-alias checks and sitemap validation.
- `npm test` passed: 32/32 pricing and film-player tests. `npm run typecheck` passed.
- Website verification passed: all 84 sitemap URLs resolve to prerendered files; required SEO/schema checks, route parity, missing-file checks and internal-link/fragment checks passed. The sitemap checker found no errors; external catalogue-image crawlability notes remain informational.
- A conflict-marker scan and `git diff --check` passed. A targeted scan of 14 pricing-facing source/page files found no retired $35 extra-cue, 6% revision, old starting-fee or per-cue revision copy. The old operative legal clauses are intentionally unchanged and their conflicts are documented above.
- No live HTTP crawl, screenshot/visual review, or legal review was performed. Keep those as review gates. Do not merge or deploy until the remaining owner/counsel decisions and visual review are approved. A review PR should target `main`; it must not be merged or deployed by this task.
