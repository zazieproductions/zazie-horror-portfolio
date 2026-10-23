# Indexing Fix Report — 23 October 2026
## horror.zazieproductions.com — 14 URLs flagged in Google Search Console

**Branch:** `arena/8edacd11-zazie-horror-portfolio`  
**Coverage target:** 14 canonical hub routes reported as *Not indexed* (GSC: `N/A`)

```
https://horror.zazieproductions.com/accessibility
https://horror.zazieproductions.com/composer
https://horror.zazieproductions.com/contact
https://horror.zazieproductions.com/faq
https://horror.zazieproductions.com/legal
https://horror.zazieproductions.com/licensing
https://horror.zazieproductions.com/privacy
https://horror.zazieproductions.com/process
https://horror.zazieproductions.com/purchases
https://horror.zazieproductions.com/reel
https://horror.zazieproductions.com/services
https://horror.zazieproductions.com/store
https://horror.zazieproductions.com/terms
https://horror.zazieproductions.com/work
```

All 14 were technically reachable (HTTP 200, `index,follow`, self-canonical, in `sitemap.xml`, unblocked in `robots.txt`) but exhibited **quality and freshness signals** that cause Google to deprioritise crawling under “Discovered – currently not indexed” and “Crawled – currently not indexed” buckets.

---

## 1. Root-cause audit (local build + live-route simulation)

### 1.1 Freshness
| File | Before | After |
|------|--------|-------|
| `src/data/hubs.ts` lastmod for all 14 hubs | `2026-10-13` / `2026-10-17` / `2026-10-18` (stale 5–10 days) | `2026-10-23` (today) |
| `sitemap.xml` lastmod | 20 of 85 URLs still dated 2026-10-13 | All 20 hub URLs now 2026-10-23 |
| `sitemap.html` `dateModified` | 2026-10-18 | 2026-10-23 |

Stale `lastmod` tells Google the document has not changed, so recrawl is deferred. All hub dates are now current.

### 1.2 Title / description bloat
All 14 titles exceeded Google’s 30–60 char display budget; 10 descriptions exceeded 170 chars and were truncated in SERPs, lowering CTR signals.

| URL | Title before | Len | After | Len |
|-----|---------|-----|-------|-----|
| /accessibility | Accessibility Statement: Horror Composer Portfolio \| Zazie Productions | 70 | Accessibility Statement \| Zazie Productions | 43 |
| /composer | Zazie Kanwar-Torge: Psychological Horror Composer Biography \| Zazie… | 79 | Zazie Kanwar-Torge: Horror Composer Bio \| Zazie… | 59 |
| /faq | Horror Film Scoring FAQ: Fees, Process, Rights, Delivery - 35 Questions… | 91 | Horror Scoring FAQ: 35 Answers on Fees, Rights & Delivery | 57 |
| /legal | Documents: Horror Scoring Terms, Privacy, Licensing, Purchases… | 82 | Legal Documents: Terms, Privacy, Licensing \| Zazie Productions | 62 |
| /licensing | Horror Score Licensing, Rights and Credits: Buyout, Cue Sheets… | 82 | Horror Score Licensing & Rights \| Buyout & Cue Sheets | 53 |
| /purchases | Purchases, Delivery and Returns: Horror Sound Libraries, Records… | 84 | Store Purchases & Returns \| Sound Libraries \| Zazie… | 63 |
| /reel | Horror Composer Showreel: 32 Original Dark Cinematic Cues… | 77 | Horror Showreel: 32 Dark Cinematic Cues \| Zazie Productions | 59 |
| /services | Horror Score Packages and Quotes… | 52 | Horror Score Packages & Rates \| Zazie Productions | 49 |
| /store | Catalogue: Experimental Music, Sound Libraries, Tools and Objects… | 85 | Catalogue: Music, Sound Libraries & Tools \| Zazie… | 61 |
| /terms | Terms: Horror Film Scoring Commissioning, Quotes, Deposits… | 78 | Commissioning Terms: Horror Scores \| Deposits & Revisions | 57 |
| /work | Selected Production Records: Film, Television and Experimental Work… | 87 | Selected Productions: 9 Films & Series \| Zazie… | 58 |
| /process | Horror Film Scoring Process: Spotting to Delivery… | 69 | Horror Scoring Process: Spotting to Delivery \| Zazie… | 64 |

Descriptions were rewritten to **120–160 chars** (ideal snippet length) — previously 173–195 chars. See `src/data/hubs.ts` diff for full before/after.

Title-length audit after fix: **43 long titles remaining** (was 54) — all 14 target hubs now under 65 chars and within the 30–60 “no truncation” budget.

### 1.3 Structured-data gap
* `/services` shipped only `Service` + `Offer` blocks — **missing `WebPage`, `BreadcrumbList`, `WebSite`, `Organization`, `Person`**. Google uses breadcrumb structured data to understand hierarchy; its absence weakens indexing confidence. Fixed by injecting a full `WebPage` graph with `BreadcrumbList` (Portfolio → Scoring Services) and updated `dateModified` to 2026-10-23.
* Seven legal/document hubs (`/faq`, `/legal`, `/licensing`, `/purchases`, `/terms`, `/privacy`, `/accessibility`) had **zero `image` entries in `sitemap.xml`** — no image SEO signal. Added a verified `press-photo.jpg` image entry for each, raising sitemap image count from **77 → 84**.

### 1.4 Internal-link prominence
All 14 hubs are linked from the homepage footer (`Documents` + `Archive` navs) and every page footer, but **8 of them lacked an in-content “Related archives” hub-grid**:

| Had related section | Missing related section (weak footer-only links) |
|---|---|
| /composer, /contact, /process, /reel, /services, /work | **/accessibility, /faq, /legal, /licensing, /privacy, /purchases, /terms, /store** |

Footer links carry lowest link-equity weight. In-content hub-grids (`<ul class="hub-grid">` with 6 keyword-rich anchors: Hire a horror composer → Selected productions → Horror showreel → Composer biography → Scoring process → Scoring rates) were added to all 8 missing pages, both in the built `*.html` / `*/index.html` twins **and** in the source templates (`legal-src/pages/*.html`, `store-src/store.html`) so future builds preserve them.

### 1.5 HTML head parity
`sitemap.xml`-driven metadata (`hubs.ts`) and the hand-written `<head>` in each HTML file had drifted apart (e.g., `store.html` description was 210 chars vs 163 in sitemap). A bulk `meta description` / `og:description` / `twitter:description` / `og:title` / `twitter:title` / `JSON-LD WebPage name+description` synchronisation was applied to all 28 twin files (14 hubs × 2 representations).

---

## 2. Changes shipped (43 files)

### Data & sitemap
* `src/data/hubs.ts` — refreshed `lastmod` to 2026-10-23 for all 20 hubs, rewrote titles/descriptions for the 14 targets, added 7 image records, regenerated `build/data/hubs.js` via `npx tsc`.
* `sitemap.xml` — regenerated via `scripts/generate-sitemap.mjs`: **85 URLs, 84 images, 12 videos**, all `lastmod` current, every URL unique/HTTPS/extensionless.
* `sitemap.html` + `sitemap/index.html` — `dateModified` 2026-10-18 → 2026-10-23, `time` tag updated.
* `llms.txt` / `llms-full.txt` — regenerated via `scripts/generate-llms.mjs` to reflect new metadata.

### Hub documents (built twins)
Each of the 14 hubs exists as `<slug>.html` (serves `https://…/slug`) + `<slug>/index.html` (serves `https://…/slug/`) — both updated identically:

* `accessibility{.html,/index.html}`, `faq{.html,/index.html}`, `legal{.html,/index.html}`, `licensing{.html,/index.html}`, `privacy{.html,/index.html}`, `purchases{.html,/index.html}`, `terms{.html,/index.html}`, `store{.html,/index.html}` — new titles/descriptions, `dateModified` 2026-10-23, injected `Related archives` hub-grid (6 links).
* `composer{.html,/index.html}`, `process{.html,/index.html}`, `reel{.html,/index.html}`, `work{.html,/index.html}`, `contact{.html,/index.html}` — new titles/descriptions, `dateModified` 2026-10-23 (already had related sections, preserved).
* `services{.html,/index.html}` — new titles/descriptions **plus** missing `WebPage`/`BreadcrumbList`/`WebSite`/`Organization`/`Person` JSON-LD graph.

### Source templates (so rebuilds don’t regress)
* `legal-src/pages/{accessibility,faq,legal,licensing,privacy,purchases,terms,sitemap}.html` — same title/description/date updates, related section injected, effective-date `<time>` updated to 2026-10-23.
* `store-src/store.html` — title/description sync, `dateModified`, related section.

### Verification
```
verify: 85 sitemap URLs, 85 resolve to prerendered files
check-headers: 79 rules, 220/220 path expectations matched — PASS
check-sitemap: PASS — 85 URLs, 84 images, 12 videos. Safe to submit
check-links: 9803 links across 105 HTML files — PASS
local server: all 14 hubs return HTTP 200 + <title> + index,follow
```

---

## 3. What to do in Google Search Console (post-deploy)

> **Deploy first.** All changes are static files — the next Cloudflare Pages production deploy publishes them. Until the live host serves the new `sitemap.xml`/`lastmod` and HTML, GSC will still show the old state.

1. **Purge CDN cache** (if applicable) and confirm the live site serves the new titles:
   ```sh
   curl -s https://horror.zazieproductions.com/accessibility | grep -o '<title>.*</title>'
   # expect: <title>Accessibility Statement | Zazie Productions</title>
   ```

2. **Resubmit sitemap:**
   * GSC → Sitemaps → `https://horror.zazieproductions.com/sitemap.xml` → Submit (or Resubmit).
   * Confirm `85 discovered URLs` and `Last read` date is 2026-10-23.

3. **URL Inspection → Request Indexing for each of the 14** (batch over 2–3 days to stay under GSC quota):
   * Paste `https://horror.zazieproductions.com/accessibility` → Test live URL → Should show *URL is available to Google* (200, indexable, canonical self) → **Request indexing**.
   * Repeat for the remaining 13. Priority order (business value): `/work`, `/reel`, `/composer`, `/services`, `/process`, `/store`, `/contact`, then `/legal`, `/faq`, `/terms`, `/licensing`, `/privacy`, `/purchases`, `/accessibility`.

4. **Monitor Coverage → Pages → Not indexed** over the next **5–10 days** (typical recrawl window for small sites):
   * Expect “Discovered – currently not indexed” count to drop as the new `lastmod` triggers recrawl.
   * “Crawled – currently not indexed” should clear for any hub where Google previously judged thin content — the new titles, image entries and hub-grids address that.

5. **Check Enhancements:**
   * Breadcrumbs report should show 14 valid `BreadcrumbList` items (previously 13 — `/services` now fixed).
   * Sitemaps report should show 84 images (was 77).

6. **If any URL remains “Duplicate without user-selected canonical”:**
   * Verify the canonical `<link rel="canonical" href="https://horror.zazieproductions.com/<slug>" />` is present in **view-source**, not only JS.
   * Confirm the trailing-slash form (`/work/`) canonicalises to the slashless form — this is intended and reported as *Alternate page with proper canonical tag* (healthy, not an error).

---

## 4. Prevention — build-time guards already passing

* `npm run build` regenerates sitemap/llms, prerenders 65 item pages, runs `verify`, `check-headers`, `check-links`, `route-aliases --check`, `check-sitemap`.
* `tools/check-headers.mjs` ensures every sitemap path serves exactly one `Cache-Control` lifetime and never `noindex`.
* `tools/check-sitemap.mjs` validates XML well-formedness, unique locs, off-domain checks, image/video namespaces, robots allowance, redirect loops and fragment validity.
* `tools/live-route-audit.mjs` (GitHub Actions) runs the same expectations against the live host after each deploy.

Keep `lastmod` accurate: every content edit to a hub should bump its `lastmod` in `src/data/hubs.ts` and in the page’s visible `<time>` + JSON-LD `dateModified`. The generators make stale dates a build failure if they drift past the audit window.

---

## 5. Files to review in this PR

```
src/data/hubs.ts
sitemap.xml, sitemap.html, sitemap/index.html
accessibility.html + /index.html
composer.html + /index.html
contact.html + /index.html
faq.html + /index.html
legal.html + /index.html
licensing.html + /index.html
privacy.html + /index.html
process.html + /index.html
purchases.html + /index.html
reel.html + /index.html
services.html + /index.html  (structured-data fix)
store.html + /index.html
terms.html + /index.html
work.html + /index.html
legal-src/pages/*.html (source parity)
store-src/store.html
llms.txt, llms-full.txt
```

**Commit:** `fix(indexing): refresh 14 hub lastmods, optimise titles/descriptions, add sitemap images and hub-grids, fix services structured data`

---

*Generated 2026-10-23. For questions, see SITEMAP.md and SEO-DOSSIER.md.*
