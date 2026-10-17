# Approved pricing implementation

Status: **approved rate card implemented on the Arena working branch; not deployed.**
The rates below replace all earlier provisional pricing in this project. Reviewed
2026-10-17.

## Approved packages

| Commission | Scored-music scope guide | Starting fee |
| --- | --- | ---: |
| Individual Scene Scoring | Approximately 1–2 minutes of original music | From $250 USD |
| Focused Short-Film Score | More than 2 and up to 5 scored minutes | From $650 USD |
| Extended Short-Film Score | More than 5 and up to 12 scored minutes | From $1,500 USD |
| Feature Film & Experimental Cinema | Substantial full-project scoring; custom scope | Custom quotation; indicative minimum engagement of $2,500 USD for substantial scoring projects |

The short-form bands use whole scored minutes and have no gaps or overlap. They
refer to original music, not the runtime of the film. The duration descriptions
are scope guides—not guaranteed quantities of finished music and not caps on a
quote. Published amounts are starting fees, not fixed-price maximums. Complexity,
cue count, schedule, revisions, licence and agreed deliverables can affect a
quote; two compositions of the same duration can price differently.

A feature-format production can still commission one scene or cue under
Individual Scene Scoring. The $2,500 indicative minimum applies only to a
substantial feature-film or experimental-cinema scoring engagement, not to every
project associated with a feature.

## Implementation

- `src/data/pricing.ts` is the single source for package boundaries, starting
  fees, estimator rules, feature-project threshold, inquiry options and concise
  pricing summaries.
- `src/lib/pricing-markup.ts` renders the service cards, estimator markup,
  inquiry form, package Offer data and the generated service metadata block.
  Offer data publishes USD starting prices only; it does not publish estimate
  ceilings or a feature minimum as an unconditional price.
- The estimator, its contact hand-off and the homepage budget list share the
  same pricing rules. The estimate is described as indicative and nonbinding;
  clients can mark a substantial full-project score, while a single feature
  scene/cue remains eligible for scene pricing.
- The inquiry form now requires only name and email; project title is optional,
  and scope questions start inside a closed native disclosure. Estimator-filled
  scope opens that disclosure automatically, and format/theme defaults are
  neutral. The direct-email fallback, homepage prompt, FAQ and process copy all
  make clear that a short first note is enough. This is a qualitative friction
  reduction; there is no analytics evidence yet to claim a conversion lift.
- Pricing copy and/or synchronized markup is updated on the homepage,
  `/services`, `/hire-a-composer`, `/contact`, `/faq` and the 404 page. The
  sound-design page now describes separately scoped quoting; game scoring is
  custom-scoped apart from the short-film packages. Composer/process/work/reel
  pages continue to link to the rate card without duplicating numeric rates.
  Root/directory route aliases and generated FAQ/pricing blocks were rebuilt.
- Pricing-related service metadata derives its short rate summary from the
  central config. Sitemap modification dates reflect the edited pricing pages.
- Sound-design work is described as separately scoped and quoted, not priced on
  a funding-linked sliding scale. Interactive game scoring is also described as
  custom-scoped apart from the short-film packages. Commissioning terms now
  refer to scored minutes and agreed scope instead of a production tier; this
  pricing change does not revise separate rights, deposit, or delivery terms.
- `home-src/**` is included in the deploy workflow's pull-request path filter.
  The service-worker cache identifier is now `zazie-v32` for the rebuilt assets.
- `tools/pricing.test.mjs` covers the approved fees, non-overlapping bands,
  gradual estimator transitions, same-duration complexity differences,
  feature-scene exception, conditional minimum, low-friction inquiry form and
  estimator hand-off, pricing markup and Offer schema.

## Verification

- `npm ci`: pass. npm reported two dependency advisories (one moderate, one
  high); dependencies were not force-upgraded as part of the pricing change.
- `npm run build`: pass. This includes TypeScript compilation, store/legal
  builds, estimator and homepage asset generation, pricing sync and drift check,
  sitemap generation, Vite build, prerender, route aliases and sitemap checks.
- Pricing sync: 9 pricing pages scanned; check passed.
- Site verification: all 84 sitemap URLs resolve to prerendered files; route,
  metadata/schema, internal-link, section-link and media audits passed. Sitemap
  contains 84 unique HTTPS URLs.
- `npm test`: 28/28 pass (17 pricing and 11 film-player checks).
- No visual browser review, Lighthouse run, or live production-route audit was
  performed. This branch itself is not deployed.

## Scope note

This document supersedes the former draft's provisional rates, bands, approval
requests and verification summary. It records the pricing implementation only;
it is not legal advice or approval of unrelated rights, payment, delivery or
licensing terms.
