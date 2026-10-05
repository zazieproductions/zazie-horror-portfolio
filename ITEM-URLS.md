# One item, one URL — productions, cues and catalogue entries

**Date:** 2026-10-04
**Scope:** 65 new indexable URLs (9 productions, 32 showreel cues, 24 catalogue
items) + the 19 URLs that already existed = **84 URLs in `sitemap.xml`**.
**Status:** ✅ `npm run build` green; `node tools/check-sitemap.mjs`
`PASS — 84 URLs, 81 images, 8 videos`; 84/84 sitemap URLs resolve to
prerendered files; unknown paths answer a real 404.
**Validator:** `node tools/check-sitemap.mjs` (offline) / `--live` (adds HTTP)

---

## 1. What was wrong

The site published 19 hub URLs. Every production, every showreel cue and every
catalogue item existed only as a card inside `/work`, `/reel` or `/store`, and
each card's only outbound link went to IMDb, YouTube, Bandcamp, itch.io,
Gumroad or eBay. Sixty-five pieces of the studio's own content had no URL of
their own, no title, no description, no canonical and no structured data — so
none of them could ever appear in search on their own terms, and the only pages
that could rank were three hubs.

`/work/expire` did not exist. Neither did `/reel/needle-in-the-nerve` or
`/store/anesthesia-for-the-signal-age`. They returned the 404 template.

## 2. The seven rules, and where each one is enforced

| # | Rule | Enforcement |
|---|---|---|
| 1 | One item = one URL, a path segment — never `?id=`, never `#anchor` | `src/data/index.ts` builds `path` from `slug` only. `collectProblems()` fails the build on `query-or-fragment`, `bad-slug`, `trailing-slash`. |
| 2 | URLs generated from content data, never hand-typed | The only source of item URLs is `src/data/{productions,cues,releases}.ts` → `productionRoutes` / `cueRoutes` / `releaseRoutes`. `scripts/generate-sitemap.mjs`, `scripts/render-pages.mjs` and `scripts/prerender.mjs` all read the same arrays. |
| 3 | Each URL is a real HTML file at HTTP 200 — no hop, no trailing-slash twin, no soft 404 | Flat files (`work/expire.html`), served extensionless. `scripts/prerender.mjs` resolves every sitemap `<loc>` to `<path>/index.html` → `<path>.html` → bare path and exits 1 if any fails. `_redirects` deliberately carries **no** trailing-slash rule for item routes. |
| 4 | `<title>`, description, self-referential canonical, robots, OG and Twitter in the **first byte** | `scripts/prerender.mjs` replaces the `<!--SEO:START-->`…`<!--SEO:END-->` block in each page with `headBlock()` output (see §5). Nothing is JS-injected; the block sits above the first `<script>`. |
| 5 | JSON-LD per type | `scripts/lib/seo.mjs` — Production: `WebPage` + `ImageObject` + `Movie`/`TVSeries` + `VideoObject` + `BreadcrumbList`; Cue: `WebPage` + `MusicComposition` + `AudioObject` + `BreadcrumbList`; Store: `WebPage` + `MusicAlbum`/`Product` + `Offer` + `BreadcrumbList`. All reference home's `#person` / `#org` / `#website`. |
| 6 | Internal links both ways, nothing orphaned | Hub → item via filled `<!--ITEMLINK:…-->` markers; item → hub in the breadcrumb and footer; item → ≥3 siblings in "Related entries". Verified below: min 3 siblings, median 4; every item linked from its hub; every item listed on `/sitemap`. |
| 7 | Non-content URLs excluded; unknown paths return a real 404 | `robots.txt` blocks `/cart`, `/checkout`, `/basket` and duplicate query views; `404.html` carries `X-Robots-Tag: noindex, follow` in `_headers` and Cloudflare Pages answers unmatched paths with HTTP 404 because a `404.html` exists in the output. |

Explicitly **not** done: no `meta keywords`; no reliance on `<priority>` or
`<changefreq>` (the 19 hub entries keep the values they already had — the
generator emits them for continuity, nothing reads them); no redesign; no
rename or redirect of any of the 19 existing URLs.

## 3. Data modules (`src/data/`)

| File | Contents |
|---|---|
| `types.ts` | `ItemBase`, `Production`, `Cue`, `Release`, `HubRoute`, `RouteSection` |
| `site.ts` | `SITE` (origin, name, brand suffix), `SLUG_RE`, `slugify()`, `MOODS`, documented external hosts |
| `productions.ts` | 9 entries: slug, title, year label, genres, role, tagline, collaborators, description/detail paragraphs, poster + still, IMDb/YouTube links, related cues, `metaDescription`, `updatedAt` |
| `cues.ts` | 32 entries: slug, reel position, title, mood, exact seconds, `/audio/track-NN.mp3`, summary, description, detail, usage, instrumentation, feel, what it was written for, related releases |
| `releases.ts` | 24 entries: slug, catalogue number, platform, price/currency, availability, release date, image, external link, platform-specific detail, related cues |
| `routes.ts` | The 19 hub routes with their existing titles, descriptions, images and video metadata — moved here so the sitemap has one source |
| `index.ts` | Derived routes, `collectProblems()`, `assertDataIntegrity()`, `url()`, `allRoutes()`, `counts` |

`assertDataIntegrity()` runs first in every generator and exits non-zero on:
duplicate URL, hub/item collision, trailing slash, query or fragment, bad slug,
slug that no longer derives from its title, duplicate slug, missing or
too-short description (<60 chars), description over 300 chars, malformed date,
non-HTTPS link, dangling `relatedCues` / `relatedReleases` reference, and a cue
mood outside `MOODS`.

## 4. Pages

65 flat files, no directories:

```
work/expire.html  work/unseen.html  work/peregrinus.html  work/phantom-requiem.html
work/eclipsed.html  work/the-haunted.html  work/choleric.html  work/mike-has-a-visitor.html
work/the-dark-awaits.html                                    (9)
reel/needle-in-the-nerve.html … reel/timeless-retro-splurge.html  (32)
store/anesthesia-for-the-signal-age.html … store/voice-control-wifi-bulb.html (24)
```

Each page reuses the existing visual language verbatim — `legal-src/legal.css`
and the same chrome, so nothing about the design changed:

- hero image (poster frame for productions, generated waveform card for cues,
  cover for catalogue items)
- a unique intro paragraph, then genuine per-item prose: what it is, what it is
  for, instrumentation, tempo/feel, length, and the production or record it was
  written for. No page is a copy-pasted hub sentence.
- an "At a glance" metadata block (role, genre or mood, runtime, collaborators
  or catalogue data)
- player or embed: `<audio>` for every cue (`preload="metadata"`, text
  transcript of what is heard — no content is gated behind playback), YouTube
  embed for the productions that have one, external buy/listen links for
  catalogue items
- breadcrumb + hub link + credit line + "Related entries" (≥3 siblings)
- `<noscript>` with the page H1 and description

The "DECODING TAPE / PRESS ANY KEY" boot overlay is a home-page artefact; it is
not on the item pages, and the item pages' text is in the HTML regardless of
JavaScript.

## 5. Prerendered head

`index.html` and every generated page carry `<!--SEO:START-->` /
`<!--SEO:END-->`. `scripts/prerender.mjs` swaps the block per route for, in
order: `<title>`, description, self-referential canonical, robots
(`index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`),
author, two font preloads, OG (`type`, `site_name`, `locale`, `title`,
`description`, `url`, `image`, `image:alt`, `image:width`, `image:height`),
Twitter `summary_large_image` + title/description/image, then the JSON-LD
`@graph`. It then appends the `<noscript>` block and re-validates every route
(title, description ≥40 chars, self-canonical, robots, OG, Twitter, JSON-LD
parses) before it will write the file.

## 6. `sitemap.xml` and `robots.txt`

`scripts/generate-sitemap.mjs` writes byte-identical output to
`public/sitemap.xml` + `public/robots.txt` (staging) and the served
`sitemap.xml` + `robots.txt`. Item entries carry `<loc>`, a real `<lastmod>`
from `updatedAt`, and image entries (poster + still for productions, cover for
catalogue items). It fails the build on: duplicate URL, non-HTTPS URL, off-domain
URL, trailing slash, query or fragment, missing title or description, and fewer
than 80 URLs — and it diffs against `tools/sitemap-baseline.xml` so none of the
19 pre-existing URLs can be dropped or renamed without the build saying so.

`robots.txt` declares the sitemap, blocks transactional paths (`/cart`,
`/checkout`, `/basket`) and duplicate query views (`?utm_`, `?fbclid`,
`?gclid`, `?ref`, `?sort`, `?filter`, `?view`, `?page`, `?print`), and allows
`/audio/`, `/images/`, `/fonts/` plus `*.mp3|avif|jpg|svg` so `AudioObject` and
image rich results stay crawlable. Nothing that needs a `noindex` is blocked: a
Disallow would hide the directive from the crawler that has to read it.

## 7. Deploy hygiene (Cloudflare Pages)

- Flat `work/<slug>.html` files serve extensionless at 200; Pages 308s the
  `.html` and trailing-slash forms to the slashless canonical, which is what the
  page's own `<link rel="canonical">` and the sitemap both declare.
- `_redirects` stays **301-only**. There is no `/* /404.html 404` rule: Pages
  documents redirect statuses only (a 404 destination is an unsupported
  rewrite), and redirects are followed even when an asset matches, so a splat
  would shadow the whole site. A real 404 needs no rule — the presence of
  `404.html` disables SPA mode and unmatched paths answer 404 with that page.
- `_headers` stays at 71 rules (Cloudflare's limit is 100), so item canonicals
  come from the static `<link>` in each page rather than 65 more `Link:` rules.
- `sw.js` is `zazie-v29` with a network-first prefix policy for item routes.

---

## 8. Audit — BEFORE

**Method caveat.** `horror.zazieproductions.com` is unreachable from the
sandbox this was built in (HTTPS and HTTP both fail at the socket layer, six
attempts), so no live evidence could be collected. The audit below was produced
against the **pre-change tree extracted from git** (`git archive HEAD`) served by
the repository's own `server.mjs`, which mirrors the Cloudflare Pages routing
table (directory index, `.html` fallback, `404.html` at HTTP 404). Every "after"
number came from the same harness, so before and after are comparable.

### 8.1 The 19 URLs the sitemap published, before

| # | path | status | redirect hop | `<title>` (HTML only, no JS) | canonical (HTML only) |
|---|------|--------|--------------|------------------------------|------------------------|
| 1 | `/` | 200 | - | Horror Composer for Film, TV & Games \| Zazie Productions | self |
| 2 | `/work` | 200 | - | Selected Horror Productions: Psychological, Folk, Body Horror Scores \| Zazie Productions | self |
| 3 | `/reel` | 200 | - | Horror Composer Showreel: 32 Original Dark Cinematic Cues \| Zazie Productions | self |
| 4 | `/composer` | 200 | - | Zazie Kanwar-Torge: Psychological Horror Composer Biography \| Zazie Productions | self |
| 5 | `/process` | 200 | - | Horror Film Scoring Process: Spotting to Stems \| Zazie Productions | self |
| 6 | `/services` | 200 | - | Horror Film Scoring Rates: Micro-Budget to Feature \| Zazie Productions | self |
| 7 | `/store` | 200 | - | Catalogue: Horror Sound Libraries, Dark Ambient Records, Tools and Objects \| Zazie Productions | self |
| 8 | `/contact` | 200 | - | Scoring Inquiry: Request a Score Quote \| Zazie Productions | self |
| 9 | `/faq` | 200 | - | Horror Film Scoring FAQ: Fees, Process, Rights, Delivery - 35 Questions \| Zazie Productions | self |
| 10 | `/legal` | 200 | - | Documents: Horror Scoring Terms, Privacy, Licensing, Purchases \| Zazie Productions | self |
| 11 | `/licensing` | 200 | - | Horror Score Licensing, Rights and Credits: Buyout, Cue Sheets \| Zazie Productions | self |
| 12 | `/purchases` | 200 | - | Purchases, Delivery and Returns: Horror Sound Libraries, Records \| Zazie Productions | self |
| 13 | `/terms` | 200 | - | Terms: Horror Film Scoring Commissioning, Quotes, Deposits \| Zazie Productions | self |
| 14 | `/privacy` | 200 | - | Privacy Notice: No Trackers, No Cookies \| Zazie Productions | self |
| 15 | `/accessibility` | 200 | - | Accessibility Statement: Horror Composer Portfolio \| Zazie Productions | self |
| 16 | `/sitemap` | 200 | - | Site Map: Every Page and Section \| Zazie Productions | self |
| 17 | `/hire-a-composer` | 200 | - | Hire a Composer: Original Scores & Sound Design \| Zazie | self |
| 18 | `/sound-design` | 200 | - | Cinematic Sound Design for Horror Film \| Zazie Productions | self |
| 19 | `/game-scoring` | 200 | - | Adaptive Horror Game Scoring & Music \| Zazie Productions | self |

All 19 answered 200 with no redirect hop and a self-referential canonical in
the HTML. **Not one of them changed.** The 19 are byte-for-byte the same paths
in the new sitemap (`tools/sitemap-baseline.xml` is the parity guard).

### 8.2 Item URLs and unknown paths, before

| request | result |
|---|---|
| `/work/expire` | **404** — "Signal Lost: Archive Entry Not Found", canonical `…/404` |
| `/reel/needle-in-the-nerve` | **404** — same template |
| `/store/anesthesia-for-the-signal-age` | **404** — same template |
| `/work/does-not-exist` | **404** — same template, real 404 status (not a 200 soft-404) |
| `/nope` | **404** — same template, real 404 status |

The unknown-path behaviour was already correct: the 404 template is served with
HTTP **404**, not 200, so there was no soft-404 to fix. The only defect was that
real content shared that fate.

---

## 9. Audit — AFTER

### 9.1 Route table — live host, 2026-10-04 21:40 UTC

Run by `tools/live-route-audit.mjs` on a GitHub runner
(`.github/workflows/live-route-audit.yml`). The build sandbox cannot reach the
host at all: its egress is allow-listed to `github.com` and the npm registry,
and `horror.zazieproductions.com` does not resolve there. That — not a host
outage — is what the six socket-level failures of the earlier pass were.

| request | status | Location |
|---|---|---|
| `/` | 200 | - |
| `/work` | 200 | - |
| `/work/` | 200 | - |
| `/work/expire` | **404** (expected 200) | - |
| `/work/expire.html` | **404** (expected 308) | - |
| `/work/expire/` | **404** (expected 308) | - |
| `/work/the-dark-awaits` | **404** (expected 200) | - |
| `/reel` | 200 | - |
| `/reel/needle-in-the-nerve` | **404** (expected 200) | - |
| `/reel/rlyehs-xenolith` | **404** (expected 200) | - |
| `/store` | 200 | - |
| `/store/anesthesia-for-the-signal-age` | **404** (expected 200) | - |
| `/store/f998pro-live-sound-card` | **404** (expected 200) | - |
| `/sitemap` | 200 | - |
| `/sitemap.xml` | 200 | - |
| `/robots.txt` | 200 | - |
| `/work/does-not-exist` | 404 | - |
| `/reel/does-not-exist` | 404 | - |
| `/store/does-not-exist` | 404 | - |
| `/nope` | 404 | - |

Every 404 on an item URL is a deploy gap, not a routing defect — see 9.3.

The live host also answers two things differently from the local mirror in
`server.mjs`, and the audit now expects the live behaviour:

- **A hub's trailing-slash form is 200, not 308.** Pages serves `/work/` from
  `work/index.html`. The mirror 308s it to the slashless form. Both finish on a
  200 carrying the right canonical, so the canonical URL is unaffected — the
  mirror is wrong about the *status*.
- **Eight legacy `.html` forms are 301, not 308.** `/store.html`, `/legal.html`,
  `/faq.html`, `/terms.html`, `/privacy.html`, `/licensing.html`,
  `/purchases.html` and `/accessibility.html` carry a hand-written 301 in
  `_redirects`; every other `.html` form is 308'd by Pages itself. Both land on
  the canonical.

### 9.2 Every sitemap URL, checked against the live host

For each of the 84: HTTP status, no redirect hop, `<title>` present, canonical
present and equal to the `<loc>`, robots present and not `noindex`.

```
checked 84 sitemap URLs against https://horror.zazieproductions.com; failing: 65
checked 166 alias forms (.html / trailing slash); failing: 130
checked   4 unknown paths; failing: 0
```

Read the other way round: **all 19 hub URLs and all 36 of their alias forms
answer exactly as designed on the real host**, and every unknown path 404s. The
195 failures are the 65 item URLs and their 130 alias forms — pages the edge has
not been given yet.

### 9.3 The edge is six merges behind — why the 65 item URLs 404

The item pages are in `main`, but the deployment serving
`horror.zazieproductions.com` predates them. Five independent checks:

| what the live site serves | what `main` says | which merge | merged (UTC) |
|---|---|---|---|
| `sitemap.xml` with 19 URLs | 84 URLs | #72 | 21:14 |
| `/services` with a **Student / Micro / Low-Budget · From $75.99** tier | the tier is gone | #71 | 16:46 |
| "Horror showreel: 30 original cues" | 32 cues | #66 | 16:42 |
| `404.html` with the same student pricing | string removed | #68 | 16:10 |
| `sitemap.xml` with `/hire-a-composer`, `/sound-design`, `/game-scoring` | present | #67 | 16:00 |

The last row is live and the four above it are not, so the last deploy to reach
the edge landed between #67 (16:00 UTC) and #68 (16:10 UTC). Six merges have
queued up behind it. Until a deploy runs, the 65 item URLs will 404.

**Do not ping IndexNow yet.** The submission would tell five engines to crawl
65 URLs that currently answer 404. Re-run the audit, confirm 0 failing, then
submit.

### 9.4 Link graph

- Every item page links its hub (breadcrumb + footer): 65/65.
- Sibling links per item page: **min 3, median 4**, max 32.
- Hub → item: `/work` links all 9, `/reel` links all 32, `/store` links all 24.
- `/sitemap` lists all 65 entries in three generated lists (9 / 32 / 24).
- `check-sitemap.mjs`: 873 in-site `#fragment` links resolve; every sitemap URL
  is reachable from `/`; dual-DOM parity holds.

### 9.5 Build + validator output

```
$ npm run build
tsc: typescript compiler, 7 compiled module(s) in build/data
generate-sitemap: 19 hub URLs + 65 item URLs = 84 URLs (9 productions, 32 cues, 24 catalogue items)
  wrote public/sitemap.xml + public/robots.txt (staging) and sitemap.xml + robots.txt (served)
  lastmod values: 84 entries, all real dates from src/data
wrote store-94c90049.css (35032 bytes)
wrote store-3fc01be0.js (11513 bytes)
wrote store.html (84890 bytes)
wrote store/index.html (84890 bytes)
route aliases: 18 routes, all twins already current.
render-pages: 65 item pages + 32 cue cards written
  hub markers filled: work (9), reel (32), store (24)
  site map entry lists: work, reel, store
prerender: 84 URLs, 84 resolve to prerendered files
  9 production + 32 cue + 24 catalogue + 19 hub pages, each with its own title,
  description, canonical, robots, OG/Twitter tags and JSON-LD in the first bytes

$ node tools/check-sitemap.mjs
  PASS - 84 URLs, 81 images, 8 videos. Safe to submit in Google Search Console.

$ curl -s http://127.0.0.1:8080/sitemap.xml | grep -c '<loc>'
84

$ node scripts/attach-item-markers.mjs --check
attach-item-markers: 9 productions, 32 cues, 24 catalogue items marked.
```

No sitemap URL points at a missing file — `prerender.mjs` would have exited 1.

## 10. Two things a reviewer should know

1. **§9.1 is live now, but it is only half-green.** The 19 hub URLs, their 36
   alias forms and all four unknown paths were checked against
   `horror.zazieproductions.com` and answer exactly as designed. The 65 item
   URLs 404 — not because the routing is wrong, but because the deployment has
   not shipped them (§9.3). Re-run the audit after the next deploy:

   ```
   node tools/live-route-audit.mjs                         # from anywhere with internet
   gh workflow run live-route-audit.yml                    # or on a runner, once it is on main
   ```

   Expected when the deploy lands: 84/84 sitemap URLs 200, 166/166 alias forms
   redirecting to the canonical, 4/4 unknown paths 404, 0 failing.
2. **`_headers` is near its limit.** It holds 71 rules against Cloudflare's cap
   of 100. The 19 hub routes keep their canonical `Link:` headers there; the 65
   item pages use an in-page canonical instead, deliberately. Adding per-item
   header rules would break the file.

## 11. Files

```
src/data/{types,site,productions,cues,releases,routes,index}.ts   new — data + invariants
scripts/tsc.mjs                                                   new — tsc, falls back to Node type stripping
scripts/lib/{data,seo}.mjs                                        new — shared loaders + head/JSON-LD builder
scripts/generate-sitemap.mjs                                      new — sitemap.xml + robots.txt, hard-fails
scripts/render-pages.mjs                                          new — the 65 pages + 32 cue cards
scripts/prerender.mjs                                             new — per-route head + noscript + resolution check
scripts/attach-item-markers.mjs                                   new — hub ↔ item marker contract (+ --check)
tools/sitemap-baseline.xml                                        new — the pre-change 19 URLs, parity guard
work/<slug>.html × 9, reel/<slug>.html × 32, store/<slug>.html × 24 new — generated, do not hand-edit
images/cues/<slug>.svg × 32                                       new — generated waveform cards
public/sitemap.xml, public/robots.txt, sitemap.xml, robots.txt     regenerated
work/index.html, reel/index.html, store-src/store.html (+ store.html, store/index.html)
legal-src/pages/sitemap.html (+ sitemap/index.html)                hub → item links, "Every entry, one URL" section
tools/check-sitemap.mjs, tools/route-aliases.mjs                   flat-page discovery, NOT_ROUTES
tools/live-route-audit.mjs                                        new — the §9 table against a real host
.github/workflows/live-route-audit.yml                            new — runs it on a runner (pull_request + dispatch)
.github/workflows/indexnow.yml                                    new — post-deploy IndexNow ping, dispatch-only
sw.js (v29), server.mjs (Pages-mirror routing), _headers, _redirects
package.json, package-lock.json, tsconfig.json                     new build
README.md, SITEMAP.md, PERFORMANCE.md                              counts 19/47/8 → 84/81/8
```
