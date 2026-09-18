# sitemap.xml — Google Search Console readiness

**File:** `sitemap.xml` → `https://horror.zazieproductions.com/sitemap.xml`
**Validator:** `node tools/check-sitemap.mjs`
**Status:** ✅ `PASS — 20 URLs, 37 images, 7 videos. Safe to submit.`
**Date:** 2026-09-18

> **2026-09-18 GEO layer update:** five URLs added for the entity/press and
> field-notes silos: `/press`, `/notes`, `/notes/horror-score-cost`,
> `/notes/psychological-horror-vs-thriller-scores`, `/notes/scoring-horror-on-a-budget`.
> Each is a real static page with a self-referencing canonical (see `GEO.md`).
> Companion machine-readable files at the domain root: `llms.txt`, `llms-full.txt`
> (deliberately not in the sitemap — they are crawl directives, not indexable pages).

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

Run it:

```bash
node tools/check-sitemap.mjs              # offline: structure, files, canonicals, robots
node tools/check-sitemap.mjs --live       # + real HTTP status for all 15 URLs
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

- **lastmod** is currently `2026-09-18` on every URL. It is honest only for the
  day it was written. When a page changes, bump its `lastmod` — or leave the tag
  off entirely rather than lying. Google ignores `lastmod` values that are
  demonstrably fake.
- Re-run `node tools/check-sitemap.mjs` after adding any page, image or video.
  It is fast and exits non-zero, so it can drop straight into CI.
- Add new pages to `sitemap.xml`, to `robots.txt` if needed, to `_headers`
  (canonical + `Cache-Control: max-age=0, must-revalidate`), to `server.mjs`
  `CLEAN_ROUTES`, and to `sw.js`.

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
