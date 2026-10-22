# Subgenre SEO pass — own the long tail, not "horror composer"

Status: **implemented on the Arena working branch; not deployed.** Reviewed 2026-10-22.

Owner request: stop competing head-on for the broad, saturated "horror
composer" head term and instead own the high-intent long tail — the sub-genre,
mood, hiring-cost and festival-prestige queries that festival-bound directors,
indie game studios, music supervisors and experimental curators actually
search when they have a budget and a deadline.

## Architecture: one pillar, five spokes, one intent per URL

`/hire-a-composer` stays the commercial pillar (full estimator, packages,
comparison matrix, Offer schema). Five new `legal-src` documents each own
exactly one query cluster and link back to the pillar; the pillar's new §III
(`#subgenres`) routes to each spoke. Every spoke is linked directly from the
homepage footer and every page footer, so no new route is more than one click
from `/`.

| URL | Owns (exact-match spine) | Title |
|---|---|---|
| `/folk-horror-composer` | "Hire Folk Horror Composer", "Folk horror custom instrumentation" | Hire a Folk Horror Composer |
| `/body-horror-composer` | "Bespoke body horror film composer", "Bespoke Body Horror Score" | Bespoke Body Horror Film Composer |
| `/psychological-thriller-composer` | "Psychological Thriller Film Music", "Psychological thriller short film music" | Psychological Thriller Film Music & Scores |
| `/dark-sci-fi-composer` | "Avant-garde sci-fi film scorer", "Dark atmospheric cinematic drone music", "avant-garde festival film composer" | Dark Sci-Fi & Avant-Garde Film Composer |
| `/short-film-composer-rates` | "Indie short film composer rates", "How much does it cost to score a 10 minute short film", "indie film scoring cost guide" | Indie Short Film Composer Rates & Cost Guide |

Retargeted existing hubs (same URLs, sharper intent):

| URL | Owns | New title |
|---|---|---|
| `/` | generic head term, now subgenre-qualified (keeps the exact substring "Horror Composer for Hire") | Folk, Body & Psychological Horror Composer for Hire |
| `/hire-a-composer` | "Hire experimental horror composer" + pillar for all "hire a … composer" variants | Hire an Experimental Horror Composer |
| `/services` | transactional packages/rates term (keeps the shared `pricing-meta`, now unique sitewide) | Horror Film Scoring Packages & Rates |
| `/sound-design` | "Award winning experimental sound designers for film" | Experimental Sound Design for Horror Film |
| `/game-scoring` | "Horror video game adaptive score packages" | Horror Video Game Adaptive Score Packages |
| `/composer` | biography + "Ars Electronica sound artists for hire" / festival prestige (new §III recognition section) | unchanged (already entity-exact) |
| `/how-to-hire-a-horror-composer` | informational vetting guide; its subgenre table now routes to the four genre spokes + the rates guide | unchanged |

## Cannibalization rules (do not break)

1. **One primary query cluster per URL.** Never retitle a spoke onto another
   spoke's query, and never put a spoke's exact-match phrase into another
   page's title, H1 or first H2. Supporting mentions in body copy and
   footers are fine and expected.
2. `/composer` is the biography entity; `/psychological-thriller-composer`
   is the service page. Keep their titles/H1s distinct ("…Biography" vs
   "…Film Music & Scores").
3. `/services` owns "packages & rates"; `/short-film-composer-rates` owns
   the question ("how much does it cost…"). The rates guide transcludes the
   same generated package blocks — one source of truth, two intents.
4. `/faq` stays at 35 questions (count is hard-coded in titles/descriptions).
   Spokes carry their own FAQPage schema (5–6 questions each).
5. Prices never enter titles/descriptions as typed text. Meta descriptions
   with figures render from `src/data/pricing.ts` via the `<!--zp:…-meta-->`
   blocks in `src/lib/pricing-markup.ts` (`hire-meta`, `folk-meta`,
   `body-meta`, `psychological-thriller-meta`, `dark-sci-fi-meta`,
   `rates-meta`). A fee change in pricing.ts re-renders every snippet.
6. Offer schema (`<!--zp:offers-->`) lives only where it already lived;
   spokes use a lean `Service` node without offers, so Offer `@id`s are
   never duplicated across URLs.

## Copy rules applied

- **Acoustic footprint is indexable:** every spoke has an H2/H3 section on
  bespoke instrument builds, bowed metal, struck/prepared strings,
  performed waterphone, field recordings and hybrid orchestration.
- **Festival angle:** spatial audio / multi-channel sound design (incl. the
  Ars Electronica 2026 20.4-channel presentation) and the Black Mountain
  College Museum + Arts Center commission now appear in meta descriptions,
  headers (H2 copy) and the Person/Organization JSON-LD (`knowsAbout`,
  `award`), not only in body text.
- **Proof, never invention.** Credits used are exactly the verified
  `src/data/productions.ts` records (MIKE HAS A VISITOR composer; ECLIPSED
  and THE HAUNTED co-composer; PEREGRINUS co-composer; EXPIRE sound design
  only). Folk horror has no labelled credit, so the folk spoke sells the
  documented palette and practice — no folk film credit is claimed. Sundance,
  Fantasia, Sitges and SXSW are named only as director aspirations, never as
  credits. Temp-track names (other composers' scores) are not used in sales
  copy.
- **Estimator as snippet bait:** "Individual Scene Scoring ($250)" and
  "Focused Short-Film Score ($650)" render as fully crawlable package cards
  with up-front scope prose on the rates guide, so the pricing can surface
  as a Google snippet without JavaScript.

## Platform changes

- `src/data/hubs.ts`: 20 → 25 hubs; `sitemap.xml`: 85 → 90 URLs.
- `_headers`: +15 canonical/robots rules (94 of Cloudflare's 100-rule limit
  — **only 6 rules of headroom remain**; the next new hub must consolidate,
  e.g. drop `/index.html` variant rules or move to a pattern).
- `_redirects`: +5 `.html → clean` 301s. `sw.js`: cache `zazie-v38`.
- `tools/geo.test.mjs`: title-intent locks updated; new test pins each
  spoke's title, query answer, pillar link, cue proof link and schema.

## What to measure after deploy

Search Console, per spoke: impressions for its owned query cluster, CTR,
and whether `/hire-a-composer` (not a spoke) wins generic "hire a horror
composer" impressions. Request indexing for the five new URLs + `/` after
the deploy; resubmit `sitemap.xml`. If two URLs split one query for more
than a few weeks, sharpen the loser's title/H1 away from the phrase —
do not add another page.
