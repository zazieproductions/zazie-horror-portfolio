# Commercial pricing overhaul: final configuration, changes, and open approvals

Status: **draft pull request. Not merged, not deployed.** Public rates follow the
owner-approved brief. Legal documents are not changed (section 3). Merge only
after the owner has reviewed the items in sections 2 and 3.

## 1. Final configuration

Single source of truth: `src/data/pricing.ts`. Every page, the homepage estimator,
the inquiry form and the JSON-LD are generated from it.

### Approved public rates (USD)

| Package | Scored music | Published price | Included cues | Included revision rounds |
| --- | --- | --- | --- | --- |
| Individual Scene Scoring | 1–2 min | From $250 | 3 | 1 consolidated round |
| Focused Short-Film Scoring | 3–5 min | From $650 | 6 | 1 consolidated round |
| Extended Short-Film Scoring | 6–12 min | From $1,500 | 10 | 2 consolidated rounds |
| Feature & Experimental Film Scoring | more than 12 min, or multi-part work | Custom quotation, indicative minimum $2,500 | quoted | quoted |

A single scene or cue from a feature is commissioned as Individual Scene Scoring.
The $2,500 minimum applies to substantial feature engagements only.

### Estimator rules (deterministic, `quote()` in `src/data/pricing.ts`)

- Input is **scored music minutes**, rounded up to whole minutes. Film runtime is never an input.
- Commission fee (low) = `max($250, startingFee + perExtraMinute × (minutes − band minimum)) × complexity × deadline`, rounded to the nearest $25.
- Commission fee (high) = the unrounded fee × 1.15, rounded to $25.
- Per-minute steps within a band: Scene +$250, Focused +$300, Extended +$150.
- Complexity: standard 1.0, layered hybrid 1.2, bespoke or experimental 1.4.
- Deadline: standard 1.0 (no surcharge); expedited 1.15 (10–20 days); rush 1.3 (under 10 days, subject to availability).
- Cues within the allowance are included. Cues above it are listed in `quotedSeparately` and are never priced by formula.
- Additional revision round: the greater of $75 or 10% of the commission fee, charged at each end of the range. Maximum three additional rounds.
- Licence: the standard project licence is included. Expanded distribution, exclusivity, copyright assignment (buyout) and soundtrack or commercial release are listed as "quoted separately in a written agreement". No amount is shown or added for them.
- Every estimate is labelled: **Preliminary estimate — final quotation subject to creative scope and written agreement.**

### Example outputs (standard complexity, standard deadline, no extra rounds)

| Scope | Result |
| --- | --- |
| Default (Focused, 3 min) | $650–$750 |
| Scene, 2 min | $500–$575 |
| Focused, 5 min | $1,250–$1,450 |
| Extended, 6 min | $1,500–$1,725 |
| Extended, 12 min | $2,400–$2,750 |
| 13 min or more | custom, indicative minimum $2,500 |
| Focused, 3 min, layered, rush, 1 extra round, 9 cues | $1,125–$1,300 (3 cues quoted separately) |

### Terms shown publicly (not contractual)

- **Standard deliverables:** original music composed to picture for the agreed cues, agreed scope and cue list, the defined revision rounds, and professional stereo WAV files (24-bit, 48 kHz unless the project specifies otherwise), with a cue list and timings.
- **Not standard:** stems, alternate or clean mixes, surround or immersive mixes, dialogue editing, final film mix, comprehensive post-production, bespoke sound design, live players. These are quoted on request after a feasibility check.
- **Payment (public wording):** 50% deposit before work begins; the remaining 50% before release of the final approved deliverables, as set out in the written agreement.
- **Micro-budget statement (exact):** "Independent and micro-budget productions are welcome to inquire. Where appropriate, a reduced musical scope or licensing of existing material may offer a more accessible alternative." It appears on services, hire, contact and FAQ. It never implies that a lower budget includes unlimited music, revisions or rights.

## 2. Changes made in this branch

**Single source and generated output**
- `src/data/pricing.ts`: rewritten to the approved model. Constants, packages, multipliers, licence list, revision rules, payment terms, budget options, and the exact notice strings.
- `src/lib/pricing-markup.ts`: renders packages, inclusions, terms, factors, licences, the estimator, the result panel and the inquiry form from `pricing.ts`. The result CTA is "Request a Scoring Quote".
- `src/estimator/main.ts`: default licence is standard. Fields that fail validation now get `aria-invalid` (estimator minutes and cues). Inquiry body includes schedule, extra rounds, rights expected and delivery date.
- `scripts/sync-pricing.mjs`: refreshes the `{{zp:…}}` tokens and the `<!--zp:NAME-->` blocks, including the new `terms` block. `--check` fails on drift.
- `home-src/build.mjs`: homepage hero and CTA copy, the budget list, and the estimator island. It is now in the npm build chain, after `tsc` and before `sync-pricing`.
- `package.json`: build chain runs `home-src/build.mjs` before `sync-pricing`.
- `sw.js`: cache bumped to `zazie-v32` because precached pages and bundles changed.

**Copy (all pages, root and directory twins identical)**
- Homepage: headline "Original Music for Psychological Horror & Experimental Cinema", tagline "Dissonance. Atmosphere. Emotional intensity.", primary CTA "Request a Scoring Quote", secondary CTA "Hear Selected Film Work". The composer is not framed as a generic audio contractor.
- Services: from-prices, packages, licence and revision text, factors, the micro-budget statement, and the payment paragraph.
- Hire a composer: revisions, rights, micro-budget answer, and CTA.
- Contact: review paragraph (rights, payment, micro-budget statement), and the package and licence options.
- FAQ (`legal-src/pages/faq.html`, regenerated with its JSON-LD): cost, what moves the price, budgets, revisions, deliverables, rights, payment.
- Process: title, meta and H1 "spotting to delivery"; revisions, deliverables, rights and payment clauses; HowTo JSON-LD.
- Composer hub card, 404 card, sitemap blurb, and the hub metadata in `src/data/hubs.ts`.

**Removed**
- The $200–$350 Scene band, "From $500" Focused, "From $900" Extended, the "$200 minimum", the student floor of $75.99, "Lean / Standard / Signature / Orchestral+" tiers, "sliding scale tied to project funding", and "typically a few hundred dollars".
- Two revision rounds per cue. The 6% extra-round rate. The $35 extra-cue charge. Licence uplifts of +25% and +40%.
- The "two weeks +15%" wording (now "expedited, 10–20 days").
- Stems, alternate mixes, MP3 reference sets and surround listed as standard deliverables on the public pages.
- Buyout as the default grant on the public pages (the legal pages still say this; see section 3).

**Preserved**
- SFX store products and `store.html` / `store-src/store.html` prices (not modified).
- Cinematic and analog-horror visual identity. No section redesign.

**Legal-source comments only**
- `legal-src/pages/terms.html` and `legal-src/pages/licensing.html` have a non-visible owner-review HTML comment listing the conflicts. No published term changed.

### Before and after

| Item | Before (branch base b75ea87) | After (this branch) |
| --- | --- | --- |
| Scene | $200–$350, about 1–3 min | From $250, 1–2 min, +$250 per minute |
| Focused | From $500, about 3–6 min | From $650, 3–5 min, +$300 per minute |
| Extended | From $900, about 7–12 min | From $1,500, 6–12 min, +$150 per minute |
| Feature | Custom | Custom, indicative minimum $2,500 |
| Default estimate | varied | $650–$750 |
| Revision rounds | Two per cue; extra round +6% | Scene 1, Focused 1, Extended 2; extra round greater of $75 or 10% |
| Cues | Flat | Scene 3, Focused 6, Extended 10; extra cues quoted separately ($35 each before) |
| Licence | Multipliers +25% and +40%; buyout as default in legal copy | Standard included; expanded, exclusive, buyout and album quoted separately, no amounts |
| Schedule | Two weeks +15%; under ten days +30% | Expedited 10–20 days +15%; rush under 10 days +30%, subject to availability |
| Payment (public) | 50% deposit; 50% on delivery of final stems, 14 days | 50% deposit; 50% before release of final approved deliverables |
| Standard deliverables | Stems, alternate mixes, MP3 reference set | Stereo WAV and cue list; other items quoted on request |
| Student / low rates | $75.99 floor | Removed |

## 3. Legal conflicts for owner review (NOT edited)

No published legal term has been changed. The public pricing pages now describe the
approved commercial position. The following documents still describe the previous
position and must be reconciled before this branch is merged. Each item is also
listed in the owner-review comment in its source file.

- **`terms.html` (source `legal-src/pages/terms.html`)**
  - Clause 2, The default grant: "default grant is buyout on full payment". Conflicts with the standard project licence included in every published price.
  - Clause 6, Payment: balance "on delivery of the final stems"; invoices due within 14 days. Public copy says the balance is due before release of the final approved deliverables.
  - Clause 7, Revisions: "two rounds of notes per cue" plus one consolidation pass. Public copy says one round (Scene and Focused) or two (Extended), with the extra-round charge.
  - Clause 8, Delivery: standard delivery includes stems by family, alternate mixes and an MP3 reference set. Public copy says these are not standard.
- **`licensing.html` (source `legal-src/pages/licensing.html`)**
  - Summary list: "Default grant: Buyout on full payment".
  - Section 2, "The default grant for a commissioned score", and its table row "Buyout (default)".
  - Section 3 text presenting buyout as the default position.
- **`LEGAL.md`**: section 4 now points to the pricing conflicts. The FAQ count (35) is unchanged. Read it with `RATIFY.md`, which holds the drafted positions.
- **`RATIFY.md`**: the drafted rights position ("Drafted as: buyout"), the payment position ("50 percent deposit and 50 percent on delivery of final stems; invoices due in 14 days"), and the standard delivery position ("stereo full mix, stems by instrumental family ... MP3 reference set") conflict with this branch. Owner decision needed on each.
- **`faq.html` / `faq/index.html`** are regenerated from `legal-src/pages/faq.html`. Answers now match the approved position. The "who owns" answer (question 20) says the licensing and terms pages "are being reviewed against this position, and they will be updated before any rights position changes". That is a public commitment the owner has not approved. Keep it, reword it, or remove it.
- **`sound-design.html`** (and hub metadata): describes sound design as "delivered as mix-ready stems". This is a separate SFX-adjacent service, not a score deliverable. Left unchanged for owner review.
- **Historic SEO audit files** (`SEO-DOSSIER.md`, `SEO-COMPETITOR-AUDIT-WEARY-PINES.md`, `PERFORMANCE.md`) record the old $75.99 floor as history. Not public. Left as an audit trail.

## 4. Owner approvals needed before merge

1. **Per-minute steps** (Scene +$250, Focused +$300, Extended +$150). The approved brief set the from-prices and the bands, not these steps. They are my design, chosen so that no package boundary jumps more than 30%. Focused was +$250 at first and was raised to +$300 during implementation to remove a 30.4% jump at 5 to 6 minutes.
2. **Cue allowances** (3 / 6 / 10) and **included revision rounds** (1 / 1 / 2). Proposed, not yet confirmed.
3. **Range spread** (+15%), **complexity multipliers** (1.2 / 1.4), **deadline multipliers** (1.15 / 1.3).
4. **Feature naming.** The brief names the tier "Feature Film & Experimental Cinema". The site uses "Feature & Experimental Film Scoring". The code keeps the existing name pending confirmation.
5. **Legal documents** (section 3).
6. **FAQ question 20 commitment** (section 3): keep, reword or remove the sentence that says the licensing and terms pages will be updated.
7. **Contact details.** The site shows the phone number (864) 430-0606 on the homepage and `/contact`. This branch did not change it. Confirm the number and the area code before the merge.
8. **Pre-existing claims, not changed or verified in this branch.** The homepage still shows "Winter 2024 Award Winners. Press Release", a "5.0" collaborator rating, and the "Psychological Orchestral" genre label. Confirm each before the merge.

## 5. Known issues and limits

- **Homepage section eyebrows** ("01 · On screen", "04 · Scoring services", etc.) use the brand red `text-blood` at 10–11px. Axe reports them as below WCAG AA contrast (11 nodes). This is a brand decision, so it is not changed in this branch. A lighter tint for small text would fix it.
- **Mobile revision select.** The "None" option label is truncated in the select at 390px wide. Cosmetic. A shorter label would fix it.
- **Revision select and estimator options** have not been checked with a screen reader. Only axe and DOM checks were run.
- Legal pages were not restyled. Their contrast fixes are limited to the hub index, numerals and footer colour tokens in `legal-src/legal.css`.
- `hubs.ts` sound-design description still says "mix-ready stems" (sound design is not a score deliverable). Left for the owner (section 3).
- `hubs.ts` licensing title and description still say "Buyout". This is the title of a legal page under owner review (section 3).

## 6. Verification (this branch)

- `npx tsc -p .`: pass.
- `npm run build`: pass. Store build, legal build, route aliases, typecheck, homepage bundle patch, pricing sync, estimator build, sync check, sitemap, Vite build, prerender, verify (84 URLs, 76 images, 12 videos), route-alias check and sitemap check all succeed.
- `npm test`: **49 of 49 pass** (38 pricing regression tests, 11 film-player tests). The pricing tests cover routing by scored minutes, the published from-figures, the default $650–$750, no decrease as minutes rise, constant per-minute steps within each band, no boundary jump over 30%, rounding, the complexity and deadline multipliers, the revision policy and additional-round charge, cue allowances, licence exclusions, the feature path, the exact notice and micro-budget strings, the budget list, and a scan of 13 commercial pages for retired prices and terms and for unapproved dollar figures.
- Browser checks (headless Chromium 131, outside the repository): the 9 pages tested (`/`, `/services`, `/hire-a-composer`, `/contact`, `/faq`, `/process`, `/composer`, `/terms`, `/licensing`) return 200 with no page errors. `/no-such-page` returns 404 as expected. Homepage estimator: default $650–$750; 2 minutes $500–$575; 12 minutes $2,400–$2,750; 0 minutes shows the "Check your entries" alert and sets `aria-invalid`; the preliminary notice is present; budget list is correct. The mobile viewport at 390px has no horizontal overflow.
- Accessibility (axe, WCAG 2A/AA): the only remaining violations are the homepage red eyebrows noted in section 5.
- `sync-pricing --check`: pass across 9 pricing pages.
- Not run: full visual review at all breakpoints, Lighthouse, a live route audit, screen-reader testing, and IndexNow.

## 7. Deployment notes

- Do not merge until the owner has decided section 4 and reconciled section 3. The public pages state the approved position, so the legal pages should be updated before or with the merge.
- Cloudflare Pages deploys from `main` only. This branch deploys nothing.
- After merge, resubmit the sitemap only after the owner has approved the public rates.
