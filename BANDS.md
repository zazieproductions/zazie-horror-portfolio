# Banded interior pages

Status: **implemented on the Arena working branch; not deployed.** Written 2026-10-26.

Owner request: the sections beyond the front page do not look as professional as
the home page — they read as huge text walls with scattered links, and they lack
the polished boutique feel the site is meant to have.

## The actual fault

Not copy, and not a missing component. **Layout.**

The home page is ten full-bleed bands on alternating surfaces (`bg-void` /
`bg-ink`, `py-24 md:py-32`, blood hairlines between bands, display-scale
headings, wide card grids). Every interior page was built on a different
skeleton: the *document plate* — a 13rem sticky "Contents" rail beside a single
reading column capped at `--measure: 74ch`, filled with roman-numeral clauses.

```
<div class="doc">
  <div class="shell doc-layout">        ← one width-constrained grid
    <nav class="doc-index">…</nav>      ← 13rem sticky Contents rail
    <div class="doc-body">…</div>       ← every section, one 74ch column
```

That is the correct shape for a contract and the wrong shape for a studio site.
It puts a sales page at a single visual weight from top to bottom, which is
exactly what "text wall" describes. Two symptoms followed from it rather than
being separate problems:

- **No page could end.** `.closing` existed in the stylesheet and was used by
  seven documents, but *no hub page used it* — all eight ran out of clauses and
  dropped straight into the footer.
- **Links had nowhere to go.** With one narrow column, outbound references were
  inlined into prose as `·`-separated runs.

## What changed

**Banded architecture (`legal-src/legal.css`, ~250 new lines).** Full-bleed
`.band` sections on alternating `--void` / `--ink` surfaces, a display-scale
`.band-head`, `.stat-rail`, `.link-set`, `.split`, `.hub-grid-3/-4`, an
`.action-row`, and a `.section-jump` bar. It reuses the existing tokens, faces
and texture recipes — no second design system, per the README's
"reuse before new" guardrail.

**One rule makes bands and readability compatible.** Only *text-level* children
of `.doc-body` are held to `--measure`; grids, tables and figures inside the
same band run to the full shell width:

```css
.doc-banded .doc-body{max-width:none}
.doc-banded .doc-body > p, … > ul, … > dl, … > blockquote{max-width:var(--measure)}
```

**Long documents stop alternating.** Above ten sections a page gets `.doc-calm`
and every band sits on `--void` with hairline dividers. Terms carries 25
sections, privacy 15, licensing 14; alternating void/ink that often reads as
stripes rather than as rhythm, and these are documents people rely on. This is
the "documents sit still" guardrail expressed in the new layout.

**Contents rail → horizontal jump bar.** `.section-jump` sticks under the
masthead at *every* width, so long pages stay navigable without a two-column
document layout. It replaces both the desktop `.doc-index` rail and the
mobile-only `.doc-jump` chips, which were two implementations of one control.

**Closing bands on all ten pages that lacked them** — the eight hubs plus
`/hire-a-composer` and `/how-to-hire-a-horror-composer`. Each is written for its
own page; none is copy-pasted.

**Stat rails on `/composer`, `/services`, `/work`, `/reel`**, using the existing
`.stat-rail` component in the hero.

**`/composer`'s five-link `·` run became a `.link-set`** — labelled tiles with a
note each and an external-link affordance.

## Two invariants the migration had to hold

The conversion is mechanical and was run as code, not typed by hand, because 83
pages share one skeleton and consistency *is* the deliverable.

1. **Content moved verbatim.** No re-indentation, no reordering. A
   `.copy-plate` `<pre>` on `/licensing` carries a whitespace-significant credit
   line that a copy button hands to the visitor, and `/contact` has a `<figure>`
   sitting *between* two clauses — bucketing loose content as "leading" or
   "trailing" silently moved it after the last band. Blocks are now emitted in
   strict source order, and a loose run between two sections gets a band of its
   own so it stays where it was.
2. **Every section keeps its own classes and its `<h2>` where they were.** The
   band supplies the surface and the shell; CSS promotes the heading. So
   `.clause > h2`, `.faq-group > h2`, `.site-map > ul` and item.css's
   `.doc-body .table-wrap` all keep matching. Nothing moved, so nothing could
   silently break.

The migration was verified before it was applied: for all 18 static pages,
visible `<main>` text, every `href` in order, every `id` in order and every
`<pre>` block were compared byte-for-byte before and after. The only intended
difference is the removal of `.doc-index` / `.doc-jump`, and the replacement
`.section-jump` was separately asserted to carry exactly the same anchor
targets.

## Where the implementation lives

| Concern | Location |
| --- | --- |
| Component layer | `legal-src/legal.css` (banded architecture section) |
| Transform, 65 generated item pages | `src/lib/bands.ts`, called once from `renderItemPage` |
| 10 document sources | `legal-src/pages/*.html`, converted in place |
| 8 hub pages | `<hub>/index.html`, converted in place; twins via `node tools/route-aliases.mjs` |
| Scroll-spy | `legal-src/legal.js` — now queries both spellings of the contents control |
| Regression lock | `tools/banded-pages.test.mjs` |

`src/lib/bands.ts` is a build-time module, not a script left behind: the item
pages are generated from one template, so their layout has to be produced rather
than typed. The 18 static pages were converted with the same algorithm, and
**the two were proven byte-identical** — the TS module, the JS migration and the
files on disk all agree, so there is one definition of the banded structure
rather than a template kept in step with 18 files by hand.

## Knock-on changes

- **`CACHE_NAME` v46 → v47.** The stylesheet and script hashes moved
  (`legal-f4e3a5fb.css` → `legal-e6f22dcd.css`, `legal-c623083a.js` →
  `legal-c44e3ca1.js`) and every interior document changed shape. The README
  forbids shipping a changed hash without bumping the cache name; the build
  syncs `PRECACHE_ASSETS` but nothing bumps `CACHE_NAME`, and
  `tools/boot-skip.test.mjs` pinned it to v46. Both were moved together.
- **Scroll-spy offset.** `rootMargin` was `-96px`, which assumed the masthead
  was the only fixed chrome. With the jump bar also sticky it marked the section
  *above* the one being read; now `-120px`, matching the `7.5rem`
  `scroll-margin-top` the banded sections carry.
- **`scripts/verify.mjs`** matched the related-entries block by
  `class="clause"`. It now matches by `id="related"`, which survives either
  spelling.
- **`tools/reel-download.test.mjs`** stubbed `querySelectorAll` for the old
  selector only. Left as-is it would have returned an empty list, and the test
  would have *passed* while silently ceasing to exercise the `rootMargin` guard.

## Numbers used, and one that was not

The stat rails carry only figures verifiable in the tree: 9 productions, 30
cues, 24 catalogue items (`src/data/*.ts`, and the prerendered file counts
agree), the four package fees (`src/data/pricing.ts`), 2 cues per scored minute
and $50 per additional cue (`/services`), 20.4-channel spatial audio at Ars
Electronica 2026 (the `/composer` biography), and 7 cue categories (distinct
`category` values in `cues.ts`, summing to 30).

One draft figure was dropped: **README says "7 film samples", but
`src/data/productions.ts` has 5 `sample:` entries.** The README is also stale on
"32 cues" (the data and every page say 30) and "84 URLs" (the build reports 83).
Page copy and the data modules are the source of truth here, not the README; the
`/reel` cell now reads "7 cue categories", which is checkable. The README's
stale counts are pre-existing and are left for whoever owns them — flagging
rather than quietly rewriting numbers that also appear in schema and metadata.

## Verification

```
npm run build   → PASS  (verify, check-headers, check-links, check-forms,
                         route-aliases --check, check-sitemap,
                         sync-pricing --check, index-coverage --check)
npm test        → 78 pass / 0 fail   (+ tools/banded-pages.test.mjs)
npx tsc --noEmit → clean
```

`index-coverage --check` still reports `thin: 0`, `orphans: 0`,
`hub near-duplicates: 0`. Banding moved markup, not words, so the per-URL word
counts and in-body inbound-link counts are unchanged.

Coverage after the pass: **83 of 83 sitemap URLs banded** — 8 hubs, 10 documents,
65 item pages. All 18 non-item pages carry a `.section-jump` bar and a
`.closing` band; no page retains `doc-layout` or `.doc-index`.
