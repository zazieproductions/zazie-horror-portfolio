# One item, one URL — productions, cues, and catalogue entries

**Date:** 2026-10-04
**Scope:** 9 productions, 32 showreel cues, 24 catalogue entries = **65 item pages**. The 19 existing hubs remain, for **84 sitemap URLs** total.
**Build:** `npm run build` — 84 sitemap URLs resolve to prerendered files; missing-file report: none.
**Local audit:** all 84 sitemap URLs returned 200 HTML, zero redirects, and a matching self-canonical. All 166 alias forms passed: 8 legacy `.html` redirects returned 301, 75 other `.html` forms returned 308, 18 original hub slash forms returned 200, and all 65 item slash twins returned 404 HTML with `noindex`. Eight unknown paths (including unknown slash and `.html` forms and the superseded main-only catalogue slug) also returned 404 HTML with `noindex`. The sandbox cannot reach the production host; `.github/workflows/live-route-audit.yml` can run a separate live audit on a GitHub runner.

---

## 1. URL-count delta and scope

The portfolio item-page scope is **19 original hub URLs plus 65 data-generated item URLs = 84 total** (a **+65** change from the original hub-only baseline). PR #72 has already placed an alternate 84-URL implementation on `main`, so the count is unchanged relative to the immediate merge base; this branch replaces that pipeline while preserving the stricter route and link rules. The sole route-set difference is the branch data slug `/store/skull-heads-with-motion-sensor` in place of the alternate `/store/motion-sensor-skull-heads`; all 19 pre-existing hub URLs are unchanged, and the obsolete alternate item path is tested as a real 404. The item routes are data-generated, extensionless paths:

- `/work/<slug>` — 9 productions
- `/reel/<slug>` — 32 cues, with slugs derived from cue titles
- `/store/<slug>` — 24 catalogue entries

Each route is a flat `<section>/<slug>.html` file. It is not a directory page and has no `<section>/<slug>/index.html` twin. The existing 19 hub URLs and their canonical paths are retained.

## 2. Seven rules and enforcement

| # | Requirement | Enforcement |
|---|---|---|
| 1 | One clean path per item; no query IDs or fragments | `src/data/{productions,cues,releases}.ts` owns each item and slug. `src/data/routes.ts` derives its one route. `scripts/verify.mjs` checks slug and path uniqueness. |
| 2 | URLs generated from content data | `src/data/routes.ts` is shared by sitemap generation, prerendering, navigation, and verification. |
| 3 | The canonical item path is a real 200 HTML page, not a redirect or slash-twin page; the trailing-slash twin is a real 404 | `scripts/prerender.mjs` writes flat item files. `tools/route-aliases.mjs` rejects directory twins; `server.mjs` and the live route audit test canonical responses and require item slash twins to return 404 with `noindex`. |
| 4 | Route-specific metadata in the first HTML response | `scripts/prerender.mjs` replaces the complete unified `<head>` from `<!--SEO:START-->` through `<!--SEO:END-->`; nothing injects the head at runtime. |
| 5 | Structured data reflects each item type | `src/lib/head.ts` emits production `Movie`/`TVSeries`/`CreativeWork` and relevant `VideoObject`, cue `MusicComposition` + `AudioObject`, catalogue `Product`/`MusicAlbum` + `Offer`, and `BreadcrumbList`, with consistent shared entity IDs. |
| 6 | Items connect to their hub and siblings without changing hub navigation | Every item links to its hub and at least three same-collection siblings. The homepage, original hubs, and human-readable `/sitemap` do **not** link directly to item pages. `tools/check-sitemap.mjs` verifies both requirements. |
| 7 | Non-content URLs stay out of the sitemap; unknown routes are real 404s | `scripts/generate-sitemap.mjs` validates only the 19 hubs and 65 content routes. The `_redirects` 404 fallback and `404.html` `noindex` response handle unknown paths; robots rules do not block public item pages. |

No meta keywords, `<priority>`, or `<changefreq>` are used as indexing signals. Unavailable facts and artwork are omitted rather than invented; mutable catalogue price and stock claims are not emitted.

## 3. Data and page content

Content is editable separately from layout:

- `src/data/productions.ts` — the nine production records, source-linked credits, available production artwork and video references, item-specific prose, and `updatedAt`.
- `src/data/cues.ts` — 32 title-slugged cue records, track/runtime/category, substantive notes, related-release references, and playable MP3 paths.
- `src/data/releases.ts` — 24 catalogue records, item-specific detail, available artwork, and external marketplace links.
- `src/data/routes.ts` — shared hub/item route registry, per-type counts, route validation, and sibling selection.
- `src/lib/page.ts` and `src/lib/head.ts` — shared markup, breadcrumbs, metadata, and schema.

Cue copy is readable before playback and each cue has a native optional `<audio>` player with a direct MP3 link. Production siblings use poster art; cue and catalogue sibling lists are text-only. Production and catalogue artwork is included only when the source data supplies it. Item pages include the common archive chrome, unique copy, hub links, and at least three sibling links.

## 4. Sitemap and robots

`scripts/generate-sitemap.mjs` creates root `sitemap.xml` and `robots.txt`. It fails on duplicate, malformed, off-domain, query/fragment, or trailing-slash URLs; missing titles/descriptions; and invalid `lastmod` dates. The sitemap is 84 URLs (19 hubs + 65 items), currently with 79 artwork entries and 12 video entries. All sitemap URLs remain crawlable.

The human-readable `/sitemap` is intentionally a hub-and-section guide, not a second item directory. This preserves the approved navigation structure: only the original hubs are reachable directly from `/`; item discovery comes from the XML sitemap and item-to-hub/sibling links.

## 5. Build and verification

```sh
npm run build
npm run typecheck
node --test tools/film-player.test.mjs
```

The build regenerates the catalogue and documents, hub twins, sitemap, item bundle, homepage SEO head, and all 65 item pages. It then verifies sitemap resolution, source metadata, per-type schema, internal links, audio/artwork references, hub aliases, and the unknown-route 404.

Expected summary:

```text
84 URLs, 84 resolve to prerendered files
route-status audit: 19 original hubs 200; 9 productions 200; 32 cues 200; 24 catalogue items 200
missing-file report: none
```

For a local HTTP check, run `npm run serve`; `/work/expire` must return 200 HTML with its own canonical, while `/work/expire/` and `/work/does-not-exist` return 404 HTML with `noindex`. Existing hub directory forms such as `/work/` remain served. The GitHub Actions live audit checks a selected production or Pages host, including redirects and aliases; its results should be recorded separately from local-server results.

## 6. Deployment notes

- `.github/workflows/deploy.yml` builds and validates the committed static tree, assembles the site-only upload with `scripts/build-deploy-dir.mjs`, deploys through Wrangler when Cloudflare credentials are configured, and runs the live audit after deploy.
- The deployment bundle excludes source, tooling, and build-only directories. The root `sitemap.xml`, `robots.txt`, static HTML, audio, fonts, and image assets are the served files.
- `_headers` uses wildcard cache rules for item pages rather than adding 65 canonical header rules; every item page carries its own canonical in HTML.
- Existing hub aliases and the existing 19 URLs are preserved. Item pages use the existing visual system; this change does not add item links to the homepage, hub navigation, or human-readable sitemap.
