# sitemap.xml — Google Search Console readiness

**File:** `sitemap.xml` → `https://horror.zazieproductions.com/sitemap.xml`
**Validator:** `node tools/check-sitemap.mjs`
**Status:** ✅ `PASS — 16 URLs, 44 images, 8 videos. Safe to submit.`
**Date:** 2026-09-25 (first written 2026-09-18; §1–5 below are that pass)

---

## Update, 2026-09-25: sitelinks structure, HTML site map, IndexNow

**Why.** The home page linked none of the six archive pages (`/work`, `/reel`,
`/composer`, `/process`, `/services`, `/contact`) in either DOM copy. They were
reachable only through the sitemap and other inner pages. Google builds
sitelinks from a site's own links, above all the home page's, so those pages
had little chance of showing as sitelinks. The links existed only in the
prerender, so they went with the other prerender-only copy when the prerender
was made to match the React render exactly (`sw.js` v9). They should have been
added to the bundle instead.

| Change | Where |
|---|---|
| "Archive" row in the home footer (Full showreel, Selected productions, Composer biography, Scoring process, Rate card, Contact) and "Site map" in its Documents row | `index.html` **and** the bundle, now `index-4a247d5c.js`. The compiled Footer was rendered and compared with the prerender: byte-identical |
| New `/sitemap` HTML page: every page, plus 112 links to sections inside them | `legal-src/pages/sitemap.html` → `sitemap/index.html` + `sitemap.html` |
| "Site map" in the Documents row of every footer; a site map card on the 404 | legal partial, 6 hubs, `store-src/store.html`, `404.html` |
| Concise footer anchors ("Rates: from $75.99, sliding by funding" → "Rate card", "Hire horror composer" → "Contact", …) | legal partial + 6 hubs |
| One brand suffix in titles, `\| Zazie Productions` | `/faq`, `/legal`, `/privacy`, `/accessibility`, `/store` |
| Site name: `WebSite.name` "Zazie Productions" (alternates "Zazie Productions Horror", "ZKT Productions") and `og:site_name` "Zazie Productions" on every page. Removed the `SearchAction` (feature retired by Google, target never implemented) and the home page `BreadcrumbList` (eight sibling pages posing as one trail) | `index.html` head; `og:site_name` everywhere |
| Two dead deep links on `/services` repointed: `/faq#q-fees` → `#q-what-it-costs`, `/faq#q-game-scoring` → `#q-games` | `services/index.html` |
| `/sitemap` added (priority 0.3). Every `lastmod` → 2026-09-25, because every page's links changed, which Google counts as a significant update | `sitemap.xml` |
| IndexNow key file and `tools/indexnow.mjs` for Bing, Yandex, Seznam, Naver, Yep | site root, `tools/` |

**New validator checks.**

- **18:** every in-site `#fragment` link resolves to an id on its target page (396 today).
- **19:** no orphans, and every top-level sitemap URL is linked from the home page.
- **20:** the React bundle links every page the prerendered home page links, and its file name equals its raw `sha256[:8]`.
- **21:** `/sitemap` lists every sitemap URL inside its own `<main>`.
- **22:** every hashed asset in the `sw.js` precache exists.

Run against the previous tree, checks 18 and 19 report the eight defects this
update fixes.

**After deploying.**

1. Search Console → Sitemaps → resubmit `sitemap.xml` (expect 16 pages).
2. URL Inspection → Request indexing for `/` (the page whose links changed
   most), then `/sitemap`.
3. Bing Webmaster Tools → import the site from Search Console, or add it and
   submit `sitemap.xml`. Then run `node tools/indexnow.mjs` once, from a machine
   with internet access.
4. Sitelinks are Google's decision. If they come, it takes weeks, and only for
   queries where this site is the obvious answer, such as "zazie productions".
   There is no way to request them.

---

## 1. What was wrong, and what was fixed

The previous version of the file was well-formed XML, so it *looked* fine, but it
carried 13 defects that Google Search Console reports as errors rather than
silently ignoring. All 13 are fixed.

| # | Defect | Why Google cares | Fix |
|---|--------|------------------|-----|
| 1–7 | `video:content_loc` pointed at `youtube.com/watch?v=…` (×7) | `content_loc` must be a **raw media file**. Google: *“HTML and Flash aren't supported formats.”* This is the single most common cause of video-sitemap errors. | Removed. YouTube-hosted video uses **`video:player_loc` only** — the documented Google pattern (`https://www.youtube.com/embed/ID`). |
| 8–13 | `image:title` emitted **before** `image:caption` (×6) | The image schema declares the sequence `loc → caption → geo_location → title → license`. Out-of-order children fail strict XSD validation. | Reordered to `loc → caption → title`. |
| 14 | Only 1 of 7 videos had `publication_date`; only 1 had `family_friendly` | Inconsistent video metadata weakens the video index and can surface as “missing recommended field”. | `family_friendly` on all 7; `publication_date` on the 3 videos whose real date is published on the page; `video:duration` added where known. |
| 15 | Video titles/descriptions drifted from the on-page `VideoObject` markup | Google cross-checks the sitemap against the page. Mismatched titles create duplicate video records. | Titles/descriptions now match `index.html` JSON-LD exactly. |
| 16 | Thin image coverage — 11 image entries site-wide | Image sitemaps only help for images you actually submit. | **37** image entries, every one present in the rendered DOM of the page it is attached to: 11 on `/` (portraits + 8 posters at 1200px), 15 on `/work` (8 posters + 7 film stills), 3 on `/composer`, 8 on `/store` (Bandcamp sleeves with real product names). |
| 17 | `/legal` (0.5) ranked below its child `/licensing` (0.55) | Cosmetic, but priority should follow the silo. | `/legal` → 0.55, `/licensing` → 0.5. |
| 18 | `robots.txt` `Host:` value included a scheme (`Host: https://…`) | The directive takes a bare hostname. Google ignores unknown lines; Yandex would have ignored a malformed one. | `Host: horror.zazieproductions.com`. |

**Net:** 15 URLs, 37 images, 7 videos, 23.6 KB.

---

## 2. What the file now guarantees

Every check below is enforced by `tools/check-sitemap.mjs`, not by eyeballing:

1. Well-formed XML, no DTD, no unescaped `&`.
2. Root `<urlset>` in `http://www.sitemaps.org/schemas/sitemap/0.9`, with the image
   and video namespaces declared on the root.
3. Under the 50,000-URL / 50 MB protocol limits.
4. Every `<loc>` is absolute, `https`, on `horror.zazieproductions.com`, has **no
   query string and no fragment**, and is under 2,048 characters.
5. No duplicate `<loc>`.
6. `lastmod` / `video:publication_date` are valid W3C datetimes and not in the future.
7. `changefreq` and `priority` are within their allowed ranges.
8. Child elements are in schema sequence order, for `url`, `image:image` and
   `video:video`.
9. Every video has `thumbnail_loc`, `title`, `description`, and a `player_loc`;
   if a `content_loc` is ever added it must carry a media-file extension.
10. Every `<loc>` maps to a file that actually ships (no 404s).
11. Each page's `<link rel="canonical">` **equals** the submitted URL — otherwise
    GSC reports *“Alternate page with proper canonical tag”* and drops the URL.
12. No submitted page is `noindex`.
13. Nothing in the sitemap is disallowed by `robots.txt` (wildcard + `$` rules and
    longest-match-wins are honoured, for both `*` and `Googlebot`).
14. `robots.txt` advertises the sitemap with a `Sitemap:` line.
15. On-host `image:loc` and `video:thumbnail_loc` files exist on disk.
16. Every `<route>/index.html` has a **byte-identical** root twin
    `<route>.html` (the file Cloudflare Pages serves the canonical slashless
    URL from, so no submitted URL answers 308 — and no rule can ever loop
    against that 308). Enforced by `tools/route-aliases.mjs --check`.
17. No rule in `_redirects` sends a directory route back into the host's own
    `308` (`/work/ -> /work` while `/work/index.html` ships), the loop that
    takes every link to that route down with it.

Run it:

```bash
node tools/check-sitemap.mjs              # offline: structure, files, canonicals, robots
node tools/check-sitemap.mjs --live       # + real HTTP status for every URL
node tools/check-sitemap.mjs --host example.com --root ./dist --sitemap other.xml
```

Exit code `0` = safe to submit. Exit code `1` = errors, with the offending URL and
the GSC error name it would produce.

Verified against the pre-fix file, the validator reports exactly the 13 defects
above and fails — so the checks are real, not decorative.

---

## 3. Submitting in Search Console

1. **Merge and deploy first.** The live site is currently still serving the *old*
   9-URL sitemap. Cloudflare Pages rebuilds on merge to `main`, so confirm
   `https://horror.zazieproductions.com/sitemap.xml` shows 15 URLs before you
   submit — otherwise GSC indexes the stale file.
2. Property: **`https://horror.zazieproductions.com`** (URL-prefix property). A
   domain property works too, but the URL-prefix property shows per-URL detail
   more reliably.
3. **Sitemaps → Add a new sitemap →** enter `sitemap.xml` (not the full URL).
   Expect `Success` and `15 pages discovered` within a few minutes.
4. Use **URL Inspection → Request Indexing** on the six new silos: `/work`,
   `/reel`, `/composer`, `/process`, `/services`, `/contact`. They are live and
   return 200, but have never been submitted, so Google has no reason to crawl
   them promptly.
5. Check back in 2–7 days:
   - **Sitemaps** report → *Success*, 15 discovered, 0 errors.
   - **Page indexing** → the six new URLs move from *Discovered – currently not
     indexed* to *Indexed*.
   - **Video pages** (under Indexing) → 7 videos on `/`.
   - **Image** coverage grows from the 11 previously submitted images.

### Nothing should appear here

| GSC error | Guard |
|-----------|-------|
| *Sitemap could not be read* | well-formedness check |
| *Invalid XML* / *Invalid sitemap format* | namespace + root + order checks |
| *Sitemap too large* | size/URL-count check |
| *Invalid URL* / *URL not allowed* | host, protocol, param and robots checks |
| *Blocked by robots.txt* | robots cross-check |
| *URL not found (404)* | file-existence check |
| *Alternate page with proper canonical tag* | canonical equality check |
| *Excluded by noindex tag* | robots-meta check |
| *Invalid date* | W3C datetime check |
| *Duplicate URL* | duplicate `<loc>` check |

---

## 4. Maintenance

- **lastmod** is currently `2026-09-25` on every URL. It is honest only for the
  day it was written. When a page changes, bump its `lastmod` — or leave the tag
  off entirely rather than lying. Google ignores `lastmod` values that are
  demonstrably fake.
- Re-run `node tools/check-sitemap.mjs` after adding any page, image or video.
  It is fast and exits non-zero, so it can drop straight into CI.
- Add new pages to `sitemap.xml`, to `robots.txt` if needed, to `_headers`
  (canonical + `Cache-Control: max-age=0, must-revalidate`), to `server.mjs`
  `CLEAN_ROUTES`, to `sw.js`, and to the HTML site map
  (`legal-src/pages/sitemap.html`, check 21). A new top-level page also needs a
  link from the home page, in both `index.html` and the bundle (checks 19–20).
- Give every new `<route>/index.html` its root twin: `node
  tools/route-aliases.mjs` (add `--check` in CI). The twins are generated, never
  hand-edited; `legal-src/build.sh` and `store-src/build.sh` write their own on
  every run, and a drifted twin fails check 16 above.
- Never add a trailing-slash redirect to `_redirects`. Cloudflare Pages already
  308s `/route` to `/route/` for directory routes, so `/route/ -> /route` loops
  and takes every hub link down with it — that is what the twins exist to avoid.
  See the note at the foot of `_redirects`.

---

## 5. Two follow-ups worth doing next

These are **not** in this change set, because they are page-level rather than
sitemap-level, but they are the same class of problem and will show up in GSC's
Enhancements reports:

1. **`index.html` `VideoObject.contentUrl`** still points at
   `https://www.youtube.com/watch?v=…`, i.e. an HTML page, for all four videos
   that carry schema. Same rule as `video:content_loc`. Since `embedUrl` is
   already present and correct, dropping `contentUrl` removes a likely
   “invalid video content URL” finding. *Not changed here — it edits live
   structured data, so it should be a deliberate, separate commit.*
2. **Only 4 of the 7 showreel videos have `VideoObject` markup** on `/`
   (`GOODBYE, BROTHER`, `Home Intruder`, `Whispers In The Dark` have none). The
   sitemap covers all 7, so they are discoverable, but adding schema for the
   remaining three would let GSC's Video pages report go from 4 to 7. It needs a
   real `uploadDate` for each; `uploadDate` is a **required** field for video
   rich results, so it should not be guessed.
