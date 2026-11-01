# Google indexing — live record and what actually blocks a crawl

> **Scope.** Why `https://horror.zazieproductions.com/` can sit unindexed (or
> indexed as an older version) while every on-page signal is already correct,
> what was verified live on **2026-10-30**, what was wrong and is now fixed,
> and the short list of actions that are *not* code.
>
> This is the follow-up to the on-page work in
> [`INDEXING-RUNBOOK.md`](../archive/INDEXING-RUNBOOK.md). That runbook fixed
> discovery and substance; `npm run seo:coverage` still reports
> `sitemap-only orphans : 0`, `thin (<300 words) : 0`,
> `hub near-duplicates : 0`. Nothing here repeats it.

---

## 1. What the live site actually served on 2026-10-30

Probed with `curl -sI`-equivalent HEAD requests through two independent
fetchers, and with a headless metadata extractor for the in-page values.

| Probe | Result | Verdict |
|---|---|---|
| `GET /` status | `200`, `content-type: text/html; charset=utf-8` | ok |
| `x-robots-tag` header on `/` | `index, follow, max-image-preview:large` | ok — no noindex |
| `<link rel="canonical">` in `/` | `https://horror.zazieproductions.com/` | ok — self-referencing |
| `<meta name="robots">` in `/` | `index, follow, max-image-preview:large` | ok |
| `<html lang>` / `<title>` / `<h1>` | `en` / one title / one `h1` | ok |
| `Link:` response header on `/`, `/work` | **`; rel="canonical"`** (URI missing) | **broken — fixed, §3** |
| `http://` → `https://` | `301` to `https://horror.zazieproductions.com/` | ok |
| `/index.html` → `/` | `301` | ok |
| `robots.txt` | `200`, `text/plain`, every `User-agent` group `Allow: /`, `Sitemap:` line present | ok |
| `sitemap.xml` | `200`, `application/xml`, 80 `<loc>`, all 80 self-canonical | ok |
| All 80 sitemap routes (static tree) | exactly 1 title, 1 canonical, 1 `index, follow` meta, 1 `h1`, 1 description, `lang` | ok |
| `zazie-horror-site.pages.dev/` | `200` **with `x-robots-tag: index, follow`** and the same self-canonical | duplicate host — §4 |

**There is no noindex, no robots block, no canonical mismatch, no redirect
loop, no soft-404 and no thin page on `/` on the date measured.** If Search
Console reports a problem for `/`, it is either a crawl-freshness decision or
something outside this repository — see the next section — and not markup.

### Proving the edge is configured outside this repository

Two live response headers are **not** in `_headers` and cannot be:

```
access-control-allow-origin: *        # on every response, HTML included
speculation-rules: "/cdn-cgi/speculation"
```

and `/robots.txt` is served `cache-control: public, max-age=14400` while
`_headers` declares `max-age=3600`. Something in the Cloudflare dashboard —
a Transform Rule, a Managed Transform, or a Cache Rule — is rewriting headers
for this zone, and it runs *after* `_headers`. That is why `_headers` is not
the last word on what a crawler receives.

Before blaming markup again, open **Cloudflare → Rules → Transform Rules
(Response Header Modification)** and **Caching → Cache Rules** and confirm
nothing there sets or overrides `X-Robots-Tag`, `Link`, `Content-Type` or the
cache lifetime on HTML. A response-header rule scoped to `/*` that sets
`X-Robots-Tag: noindex` would produce exactly the "it is perfect in the repo
but not indexed" symptom, and it would never show up in a build check.


### The real symptom: the index entry is *stale*, not missing

A `site:horror.zazieproductions.com` query returns `/`, but as an older
version of the page:

- indexed title: **`Horror Composer for Hire — Film, TV & Game Scores`**
- indexed snippet: *"…Custom scores from $250 USD."*
- live title: `Experimental Psychological Horror Composer | Arthouse Film`
- the exact current `<h1>`, `WE CORRUPT SILENCE TO SERVE THE FRAME.`, returns
  **zero results**

Neither the old title nor `$250` exists anywhere in the current published
tree (the old title survives only in `SEO-DOSSIER.md` /
`docs/archive/AUTHORITY-POSITIONING-DOSSIER-2026.md` as the title that was
deliberately replaced). So Google is not reading the current `/` — it is
serving the entry from its last successful crawl, and has not re-fetched since
the repositioning.

That is the "not indexing" the site owner sees: the page is in the index, the
**current content is not**. It is a crawl-scheduling outcome, and the levers
are §5, not markup.

---

## 2. Why this is not caused by the build

Everything a crawler reads is generated and gated. Run these and expect
`PASS`:

```bash
npm run build                     # tsc → pages → sitemap → vite → 6 validators
npm run seo:coverage              # links, word count, duplicate ratio per URL
node tools/check-sitemap.mjs      # 15-point Search Console pre-flight
node tools/check-headers.mjs      # _headers ⇄ policy, one cache lifetime per path
node tools/check-links.mjs        # every href/src/srcset/#fragment resolves
```

`tools/index-coverage.mjs` (wired into `npm run build --check`) fails the build
if a submitted URL loses its contextual inbound link, drops under 300 words, or
a hub becomes a near-duplicate of another hub. `/` currently measures ~1,956
words, 79 in-body inbound links and 3 % shingle overlap with the rest of the
site — the strongest page on the domain by those measures.

---

## 3. Fixed: the `Link: rel="canonical"` header never arrived intact

`_headers` carried 53 `Link: <https://horror.zazieproductions.com/…>; rel="canonical"`
rules, one per indexable route and per alias spelling. **Cloudflare Pages drops
an angle-bracketed segment from a `_headers` value**, so what the edge actually
served was:

```
$ curl -sI https://horror.zazieproductions.com/ | grep -i '^link'
link: ; rel="canonical"
```

The quotes arrived; the URI did not. Every indexable route advertised a
canonical hint with no canonical in it, and because the file on disk looked
correct, no build check noticed.

It is removed rather than "fixed": RFC 8288 requires the URI in angle brackets,
so every syntactically valid `Link` value would be truncated identically.
Nothing was lost — each page already serves a correct, self-referencing
`<link rel="canonical">`, which is the signal Google uses for an HTML page.

Guarded so it cannot come back:

- `tools/check-headers.mjs` now **fails the build** if any header value in
  `_headers` contains `<` or `>`.
- The note at the top of the `_headers` canonical block records the observed
  edge behaviour, the exact live value, and the date.

> While you are in Search Console: this header was never an indexing *blocker* —
> a malformed one is ignored, and the in-page canonical was always correct.
> It is cleaned up because it was wrong, not because it explains the stale entry.

---

## 4. Watch (cannot be fixed from this repository): the `*.pages.dev` twin

```
GET https://zazie-horror-site.pages.dev/        → 200
x-robots-tag: index, follow, max-image-preview:large
<link rel="canonical" href="https://horror.zazieproductions.com/">
```

The production Pages hostname serves the whole site and is explicitly
indexable. In practice the self-canonical on every page consolidates it onto
the custom domain — and Google's index does show
`horror.zazieproductions.com/`, so consolidation is working. It is listed here
because it is the one duplicate-host signal that only a human can remove.

- `_headers` cannot scope a rule by hostname, so `noindex` cannot be applied to
  the `pages.dev` host alone from this repo. Do **not** add a global `noindex`
  to try: that would deindex the real site.
- If you want it gone, it needs a Cloudflare-side control (a Pages Function /
  middleware keyed on `request.url` hostname, rolled out to a **preview**
  deployment first) — not a change to `_headers`. Treat it as optional: the
  canonical is doing the consolidation.

---

## 5. The part that is not code

Work this list in order. Nothing in it is a bulk action.

0. **Rule out a dashboard header override first** (§1, "Proving the edge is
   configured outside this repository"). It takes two minutes, it is the only
   failure mode that is invisible to every build check, and if a Response
   Header Transform Rule is emitting `noindex`, nothing below will help.
1. **Search Console → URL Inspection → `https://horror.zazieproductions.com/`.**
   Read the *Tested page* panel before requesting anything:
   - **Crawled page → View crawled page / HTML** — this shows the HTML
     Googlebot actually received. If it shows the current title
     (`Experimental Psychological Horror Composer | Arthouse Film`), Google has
     the new page and is simply deferring the index update. If it shows the old
     title, Googlebot has not re-fetched: the block is crawl scheduling, and
     step 2 is all you can do today.
   - **Coverage** — `Discovered – currently not indexed` means no crawl yet;
     `Crawled – currently not indexed` means Google has the page and chose not
     to index it (quality/authority decision).
2. **Request indexing — once, for `/` only.** One request, then leave it. It
   does not create crawl budget, and re-pressing it daily does nothing.
3. **Sitemaps → resubmit `sitemap.xml`** only so the "last read" date is
   current. `/` already carries `lastmod 2026-10-27`, which is honest and
   recent; do not fake-bump it.
4. **Links from somewhere other than this site.** This is the only input that
   raises the ceiling. IMDb (`nm17333332`), Bandcamp, SoundBetter, FilmFreeway,
   Spotify, Apple Music, itch.io and Gumroad profiles should each link the site
   with a descriptive anchor. Every credited film's page, festival listing or
   press kit that names the composer is worth more than any further on-page
   edit.
5. **Audit the press/award surface before promoting it further.** The home
   page's JSON-LD lists four press articles under `subjectOf` — some on
   press-release domains (`billboardwire.com`, `grammyweekly.com`,
   `limitless-magazine.com`) — and an `award` array that includes
   "Golden Bloody Globes". Programmatically generated award and press claims
   are a quality/trust signal Google's systems read. Keep a claim only if you
   can show the underlying page; otherwise drop it from the markup and from the
   visible press band. This is editorial, so it is listed, not changed.

---

## 6. What not to do

- **Do not add `noindex` "to consolidate"** anything you want indexed.
- **Do not add a global `noindex` for the `pages.dev` host** — `_headers` is not
  host-scoped and you would deindex the real site.
- **Do not put the URI back in a `Link:` header.** The edge truncates it; the
  build now fails on purpose.
- **Do not bulk-submit URLs to third-party "indexing services".** They do not
  create crawl budget and some look like spam.
- **Do not chase the 59 item-template overlap warnings** (`index-coverage`
  reports them, does not fail). A catalogue legitimately shares a template.

---

## 7. Re-verify

```bash
# live header + status, from any machine with egress
curl -sI https://horror.zazieproductions.com/ | grep -Ei '^(HTTP|content-type|x-robots-tag|link):'
# expect: HTTP/1.1 200, text/html, index, follow…, and NO link: header

curl -s https://horror.zazieproductions.com/robots.txt | tail -3
curl -s https://horror.zazieproductions.com/sitemap.xml | grep -c '<loc>'   # 80

# offline gates
npm run build && node tools/check-headers.mjs && node tools/check-sitemap.mjs
node tools/live-route-audit.mjs https://horror.zazieproductions.com          # from CI or a networked host
```
