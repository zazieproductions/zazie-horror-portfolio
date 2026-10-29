# Architecture overview

**System:** `horror.zazieproductions.com` — the horror-facing portfolio of
Zazie Productions (composer Zazie Kanwar-Torge, Zazie Productions LLC).
**Model:** fully static site. No backend, no database, no server-side code in
production. The repository root *is* (mostly) the served tree; the deploy
workflow uploads a filtered copy of it to Cloudflare Pages.

## Verified inventory (checked against source, 2026-10-29)

| Thing | Count | Source of truth |
|---|---|---|
| Hub routes | 17 (incl. `/`) | `src/data/hubs.ts` |
| Productions | 9 | `src/data/productions.ts` |
| Showreel cues | 30 | `src/data/cues.ts` |
| Catalogue items | 24 | `src/data/releases.ts` |
| Generated item pages | 63 (9 + 30 + 24) | flat files under `work/`, `reel/`, `store/` |
| Sitemap URLs | 80 (17 + 63) | committed `sitemap.xml` |
| Showreel MP3s | 30 files in `audio/` | `audio/track-*.mp3` (no `track-09`/`track-23`) |
| Test files | 16 (`tools/*.test.mjs`) | `package.json` → `test` |
| GitHub workflows | 13 | `.github/workflows/` |

> [!WARNING]
> Older prose in places (including the pre-2026-10-29 README) cites 19 hubs,
> 65 items, 32 cues and 84 URLs. Those numbers described an earlier tree.
> Trust the table above and re-derive it from `src/data/` before quoting counts.

## Boundaries

- **In scope:** committed static HTML/CSS/JS, typed data (`src/`), build and
  validation scripts (`scripts/`, `tools/`), edge config (`_headers`,
  `_redirects`), service worker (`sw.js`), local server (`server.mjs`).
- **Out of scope / external:** checkout (delegated to Bandcamp, itch.io,
  Gumroad, eBay), video hosting (YouTube nocookie, Google Drive), the
  ReelCrafter player (linked, never embedded), Cloudflare Web Analytics
  (edge-injected beacon; the only remote script, disclosed in `/privacy`).

## The one-paragraph mental model

Three generations of build pipeline coexist and are all still load-bearing —
see [system map](system-map.md). Data-driven TypeScript (`src/`) renders the
63 item pages; hand-rolled `store-src/` and `legal-src/` pipelines render the
catalogue hub and the legal/document hubs; the homepage is committed static
HTML enhanced by a **legacy React bundle whose original source is not in this
repository**. That last fact shapes every safe-change rule in
[`AGENTS.md`](../../AGENTS.md).

Next: [system map](system-map.md) · [rendering pipeline](rendering-pipeline.md)
