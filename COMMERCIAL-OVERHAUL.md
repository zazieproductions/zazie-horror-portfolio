# Commercial pricing implementation — owner and counsel review

**Implementation status:** pricing and estimator code updated on the Arena session branch. **Not merged or deployed.** New commercial language is proposed for future commissions only; it does not amend existing contracts. Legal approval remains a deployment blocker.

## Approved public price configuration

All fees are USD. Price is based on **scored music minutes**, cue count and the musical brief—not film runtime. Starting prices are not guaranteed maximums; creative complexity and agreed scope determine the final quotation.

| Commission | Public starting price | Published scope guidance |
| --- | ---: | --- |
| Individual Scene Scoring | From $250 | Approximately 1–2 minutes of original music |
| Focused Short-Film Score | From $650 | Up to 5 scored minutes |
| Extended Short-Film Score | From $1,500 | Up to 12 scored minutes |
| Feature Film & Experimental Cinema | Custom quotation | Indicative $2,500 minimum for substantial feature-scoring engagements |

Package bands used by the estimator are adjacent and non-overlapping: scene 1–2 minutes, focused 3–5, extended 6–12, then individually quoted longer scopes. These are routing guides, not caps or promises of maximum music at the starting fee. A single scene in a feature remains eligible for the Individual Scene commission; the $2,500 indicative minimum applies only to substantial feature engagements.

## Commercial rules implemented

- Standard schedule: no surcharge. Expedited (approximately 10–20 days): +15%. Rush (under 10 days): +30%, subject to availability.
- Revisions: one consolidated round for Individual Scene and Focused Short-Film; two for Extended Short-Film. A round is one consolidated set of reasonable changes to the agreed creative direction. Additional rounds: $75 minimum or 10% of the commission fee, whichever is greater. New cues, substantial rewrites and picture recuts are separately quoted.
- Cue counts beyond the estimator's approximate planning baseline return an individually scoped estimate rather than an invented per-cue price. Additional composition is quoted using additional scored minutes, cue count and creative complexity.
- Rights: the estimator distinguishes standard project use from expanded distribution, exclusivity, copyright assignment and soundtrack exploitation. Expanded rights route to written quotation; no fixed buyout fee is invented or included.
- Proposed payment schedule for new agreements: 50% before work begins; remaining 50% before release of final approved deliverables, subject to the written agreement. Existing contracts are unaffected.
- Standard commission deliverables: original music synchronized to picture, agreed scope/cue deliverables, package revision allowance and professional stereo WAV delivery. Stems, alternate mixes, surround/immersive mastering, dialogue editing, final film mixing, comprehensive post and bespoke sound-design packages are not promised. Additional technical requests are subject to feasibility.
- Independent and micro-budget productions are welcome to inquire. Where appropriate, a reduced musical scope or licensing of existing material may offer a more accessible alternative.
- Existing sound-effects products in the store remain unchanged.

## Code and publishing implementation

- `src/data/pricing.ts` remains the authoritative package, rate, scope, modifier and deterministic estimate configuration.
- `src/lib/pricing-markup.ts` creates the same package cards, estimate UI, factors and inquiry budget choices; `scripts/sync-pricing.mjs` propagates that markup and data tokens to the pricing pages and twins.
- `src/estimator/main.ts` uses the central `quote()` model. The price result label is “Preliminary estimate — final quotation subject to creative scope and written agreement.” Out-of-band rights, cue scope and long-form scoring are routed to individual quotation.
- `scripts/build-estimator.mjs` generates content-hashed estimator assets and updates page and service-worker references.
- Services SEO descriptions and the pricing FAQ/process copy were revised. FAQ payment wording is explicitly presented as a proposed schedule for future agreements, not a change to existing contracts.
- Regression coverage includes package boundary routing, new starting rates, monotonic ranges, fee-modifier determinism, individual quote routing for rights/cue scope and long-form work, and package-specific revisions.

## Proposed wording requiring owner/counsel sign-off

These are proposals, not legal amendments:

1. **Standard project-use licence:** a non-exclusive right to use the commissioned score in the named production and specifically agreed exploitation. Territory, duration, media, credit, promotional excerpts and any soundtrack use must be written into the applicable agreement.
2. **Rights exclusions:** exclusivity, copyright assignment, soundtrack exploitation and expanded uses require a separate written agreement and quotation. No package automatically includes a copyright buyout.
3. **Payment:** 50% deposit before work begins; 50% before release of final approved deliverables, in each case subject to the signed written agreement.
4. **Delivery/revisions:** stereo WAV and the explicitly agreed cue deliverables; package-specific consolidated revision rounds. No implied stems or post-production deliverables.

## Unresolved legal conflicts — deployment must wait

The legal documents were not rewritten or silently treated as amended. They currently conflict with the proposed commercial offer and need an owner/counsel decision and coordinated revision:

- `terms.html` / `legal-src/pages/terms.html`: default copyright buyout and assignment language; balance tied to delivery of “final stems”; additional payment/invoice conditions; revision and delivery provisions listing stems/alternate mixes.
- `licensing.html` / `legal-src/pages/licensing.html`: buyout described as default rather than separately negotiated.
- `LEGAL.md`: operating/legal summary must be reviewed against the exact approved licence, payment and delivery schedule.
- `RATIFY.md`: unresolved owner decisions on default ownership, revisions, payment timing and stem deliverables need formal ratification; this implementation does not ratify them.
- `process.html`/FAQ: public explanatory copy now describes the proposed commercial model. Ensure counsel approves it and that the legally binding terms match before publishing.

**No deployment/merge recommendation until the owner and counsel reconcile these documents, confirm the rights grant and approve the final customer-facing language.** Do not apply these terms retroactively to existing contracts.

## Before / after

- **Before:** provisional Scene $200–$350; Focused from $500; Extended from $900; conflicting defaults for buyout, stems and per-cue revisions.
- **After:** approved public starting anchors $250 / $650 / $1,500; custom feature/experimental pricing with the substantial-engagement threshold stated narrowly; estimator scope is music duration, cue count, complexity, timeline, revisions and rights request; legal rights and fees remain quotation/approval-sensitive rather than guessed.

## Verification

- `npm run typecheck`: passed.
- `npm run build`: passed, including pricing sync, estimator hashing, prerender and 84-route verification.
- `npm test`: 23/23 passed (pricing estimator and existing film-player regressions).
- Pricing sync check: passed across nine pricing-bearing routes.
- Build validates all 84 static routes, media links, sitemap, page metadata and schema. Visual browser/accessibility review is still required before release.
