# Editorial pass on the nine hub pages

Status: **implemented on the Arena working branch; not deployed.** Reviewed 2026-10-17.

Owner request: the hub pages' additional sections read like raw text — too long,
too verbose, unprofessional — and should be fixed from the frontend while
keeping the pages SEO-optimized and article-grade.

## What changed

**Structural bug (the "raw text" look on /services).** `services/index.html`
was missing its `<div class="shell doc-layout">` wrapper, so the rate card
rendered edge-to-edge with no content shell and no sticky contents column —
unlike every other document on the site. Restored; the root twin regenerated.

**Unstyled blocks styled.** Four generated/static class families had no CSS
anywhere and rendered as bare text: `zp-licences` (+ `zp-licence-name/-effect/
-note`), `zp-factors-list`, `zp-steps` and `zp-cta-row` (now in
`src/estimator/estimator.css`, which is the zp component sheet), plus
`doc-note` and `faq-list` (now in `legal-src/legal.css`).

**Editorial layer (`legal-src/legal.css`, opt-in per element).** Magazine
components for the hub pages: `.standfirst`, `.dropcap`, `.pullquote`,
`.sidenote`, `.doc-more` (read-more disclosure), `.doc-body .doc-note`
(fine print), `.doc-body ol.steps`, `.faq-list`. Print styles included.
Documents (/terms, /privacy, …) are untouched — they do not use the new
classes.

**Tighten + progressive disclosure (owner-approved policy).** Visible copy on
the nine hubs was tightened: the repeated "For X, see Y. For A, see B." lead
chains, duplicated disclaimers and telegraphic card notes were rewritten as
plain professional sentences. Long-form SEO detail (scope bands, palette
notes, recue billing, credit wording, negotiable rights) moved into
`<details class="doc-more">` disclosures — the full text stays in the served
HTML, so nothing was removed from the crawlable page. All pricing
`<!--v:…-->` tokens and `<!--zp:…-->` generated blocks are untouched and
re-synced by `scripts/sync-pricing.mjs`.

**Showreel hub.** The 32 cue accordions no longer ship `open`; the page now
opens as a scannable tracklist with an Expand-all/count toolbar (the existing
`legal.js` FAQ behaviour). Cue copy remains in the DOM, in the head's
AudioObject JSON-LD, and on each `/reel/<slug>` page.

**Q&A accordions.** /hire-a-composer §VIII, /sound-design §VI and
/game-scoring §V questions now use the site's `faq-item` pattern (open by
default, collapsible), with their existing ids preserved.

**Deliverables table.** /process §V now renders standard delivery as a real
`<table>` (already styled in legal.css) instead of a dense paragraph; §VI
leads with the existing `.flag` callout for the buyout default.

**Copy corrections.** "is an psychological horror composer" → "a" (/composer
lead); /composer §I now carries the fuller award/credential bio (Ars
Electronica, MUSLAB, EXiS, BMC Museum+Arts Center) that previously existed
only in the drifted root twin; SEO-insider headings ("intent cluster
coverage", "internal link graph", "hub and spoke reinforcement") renamed to
reader-facing text; stale `[VERIFY]` comments removed from /sound-design and
/game-scoring; /sound-design and /game-scoring doc-meta "Floor: scoped to
project funding" lines replaced to match the approved non-sliding-scale
language from COMMERCIAL-OVERHAUL.md.

**Route drift fixed.** `composer.html` differed from `composer/index.html` at
the base commit (the twin carried the better bio). Twins are generated from
`<hub>/index.html` by `tools/route-aliases.mjs`; parity is restored.

**Housekeeping.** `legal.js` gained a hash-target disclosure opener (deep
links into collapsed content open it). `sw.js` cache bumped to `zazie-v33`.
`src/data/hubs.ts` lastmod set to 2026-10-17 for the nine edited hubs;
`sitemap.xml` regenerated. New asset hashes: `legal-886033c7.css`,
`legal-ab598df8.js`, `estimator-b63bdccc.css`.

## SEO invariants held

Titles, meta descriptions, canonicals, robots, OG/Twitter and every JSON-LD
block are unchanged. All section ids referenced by in-site fragment links
(829 checked) still resolve. Hub reachability from `/` and the no-item-links
rule are intact. Disclosure copy stays in the static HTML (no JS needed to
crawl or to open).

## Verification

- `npm run build`: pass (store/legal builds, route aliases, tsc, estimator,
  home patch, pricing sync + `--check`, sitemap, vite, prerender of 65 item
  pages, verify, alias parity, sitemap audit — "PASS - 84 URLs").
- `npm test`: 28/28 pass.
- Class audit: no hub page uses a class that its linked stylesheets do not
  define (`sibling-figure` on item pages remains a deliberate verify hook).
- No visual browser review or Lighthouse run performed in the sandbox.
