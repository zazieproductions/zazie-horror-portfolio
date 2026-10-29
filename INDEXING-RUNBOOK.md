# Historical Indexing Runbook — 21 October 2026

> **Superseded on 29 October 2026.** This snapshot predates the current route policy: `/faq`, `/legal`, `/privacy`, `/process` and `/terms` are public `noindex` support pages; `/sitemap` now redirects to `/`; EXPIRE is an archive-only project on `/work`; the 300-word minimum has been removed. Use `README.md`, `SITEMAP.md` and `ITEM-URLS.md` for current behavior. The historical Search Console report below is retained as context, not as an indexing to-do list.

**Historical Search Console status (21 Oct 2026):** 14 URLs, `Last crawled: N/A`, validation started 21 Oct 2026.

```
/accessibility  /composer  /contact  /faq      /legal      /licensing
/privacy        /process   /purchases /reel    /services   /store
/terms          /work
```

**Already indexed (the pages that carried commercial intent):** `/`, `/hire-a-composer`,
`/how-to-hire-a-horror-composer`, `/sound-design`, `/game-scoring`, `/sitemap`.

---

## 1. What the status means (and what it does not)

`Discovered – currently not indexed` is not an error report. Google found the URL,
recorded it, and decided **not to spend a crawl on it yet**. `Last crawled: N/A` is the
tell: Googlebot has not fetched a single byte. Nothing on these pages is broken,
blocked, `noindex`, or mis-canonicalised — every one of the 14 returns the right
canonical, `index, follow`, a single `<title>`, a meta description and valid JSON-LD,
and all 85 sitemap URLs are reachable from `robots.txt`.

What produces this status, in the order it actually matters for a site this size:

1. **Nothing links to the URL.** A URL that appears only in `sitemap.xml` and in the
   sitewide footer has no context and no importance. Google crawls what pages it has
   already indexed point at.
2. **The page does not look worth its own index entry.** Thin text, or a body that is
   mostly a repeat of another page, gets deferred indefinitely on a low-authority host.
3. **Crawl priority.** On a new domain, Google crawls a small slice per visit. The 20
   URLs that everything links to get fetched; the tail waits.
4. **Time and trust.** The domain has no accumulated link equity or click history, so
   the threshold to "worth indexing" is higher than it is for an established site.

Fixes are therefore about **links, substance, and crawl priority — not about resubmitting
the sitemap.** Resubmitting changes nothing and repeatedly pressing *Request indexing*
on 14 URLs at once does not create budget.

---

## 2. What was actually wrong in the build

Measured with `npm run seo:coverage` before the change:

| Fault | Count | Why it matters |
| --- | --- | --- |
| Sitemap URLs with **no internal link anywhere** | 65 of 85 | `/work`, `/reel` and `/store` displayed every item but linked **only** to IMDb / YouTube / Bandcamp / eBay. The 65 generated item pages were discoverable from `sitemap.xml` alone — the exact profile Google defers, and a sitemap that is mostly unlinked URLs lowers the crawl priority of every URL in it, including the 14 hubs. |
| Hubs with **no contextual in-body inbound links** | 6 (`/privacy` 5, `/accessibility` 4, `/terms` 7, `/legal` 8, `/composer` 6, `/sitemap` 1) | Their only inbound links were the identical sitewide footer. Sitewide links are discounted: they are on every page, so they say nothing about any one page. |
| Hub **duplicating another hub** | `/services` 48 % of its text also on `/`, `/composer` 25 % | `/services` was structurally a second home page. When two URLs answer the same thing, Google indexes the stronger one and defers the other. |
| `/composer` thin | 757 words | An entity page for a named person needs enough unique text to be the definitive page about that person. |

After the change: **0 sitemap-only orphans, 0 thin pages, 0 hub duplicates.**
`npm run seo:coverage` is the receipt.

---

## 3. What changed in this branch

1. **Discovery chain rebuilt: `/` → hub → item, with no orphans.**
   `/work` (9), `/reel` (32) and `/store` (24) now link every one of their own item
   pages; the external source link (IMDb, YouTube, Bandcamp, eBay) is kept beside it
   rather than used instead of it. The home page deliberately still links hubs only —
   a 65-link homepage would bury the 19 pages that matter.
   Guarded by `scripts/verify.mjs` and `tools/check-sitemap.mjs`, which now **fail the
   build** if a hub stops linking an item or the home page starts linking items.

2. **Contextual inbound links added** to the weak hubs, in body copy, with descriptive
   anchor text — not another footer block:
   - `/contact` → *privacy notice*, *accessibility statement* (the form is where both
     questions actually arise);
   - `/work` → *licensing, rights and credits* (credit wording);
   - `/services` → *scoring process*, *licensing*, *privacy*, *commissioning terms*,
     *hiring guide*;
   - `/composer` → *production records*, *sound-design*, *showreel*, *scoring process*,
     *scoring services*, *FAQ*.

3. **`/composer` given a real entity page**: new *Credits and how each one is verified*
   and *Palette, instrumentation and method* sections. 757 → 1,337 words, overlap with
   the home page 25 % → 7 %. The credits section states exactly which titles are
   composer, co-composer, sound-design and production credits, and records where a
   credit is **absent** (UNSEEN) — the thing that makes a portfolio page citable.

4. **`/services` differentiated from the home page**: new *What a written quote actually
   contains* section (five scope lines, scope boundaries, three worked scopes, handover
   and confidentiality, how to get an accurate quote first time). 2,213 → 3,227 words,
   overlap with `/` 48 % → 32 %. No new prices are typed by hand; `src/data/pricing.ts`
   remains the only source of fees.

5. **A regression guard**: `tools/index-coverage.mjs`, wired into `npm run build` as
   `--check`. For every sitemap URL it measures `<main>` word count, **in-body** inbound
   links (header/footer excluded on purpose), and 6-word-shingle overlap with the rest
   of the site. It fails on: a submitted URL with no contextual link, a page under 300
   words, a hub that is ≥34 % duplicated by another hub, or an item not linked from its
   hub. Item-template overlap is warned, not failed — a catalogue legitimately shares a
   template.

---

## 4. Do this in Search Console, in this order

**Do not press *Request indexing* fourteen times and wait.** Work the list in priority
order, after the deploy is live.

### Day 0 — deploy, then verify the live HTML

```bash
npm run build                      # must end: PASS + coverage PASS
npm run build:deploy               # assembles the deploy directory
```

Then, on the deployed origin, confirm the new links are actually served (the build
cannot see the edge):

- `https://horror.zazieproductions.com/work` — view source, search `href="/work/expire"`.
  Expect 9 internal record links.
- `.../reel` — expect 32 `href="/reel/…"` cue links.
- `.../store` — expect 24 `href="/store/…"` catalogue-page links.
- `https://horror.zazieproductions.com/sitemap.xml` — 85 `<loc>` entries, unchanged
  shape, no trailing slashes.

If the edge still serves the old HTML, the deploy did not run — fix that before touching
Search Console. Nothing else on this list matters until the live pages carry the links.

### Day 0 — one validation, three requests

1. **Sitemaps →** resubmit `https://horror.zazieproductions.com/sitemap.xml`. This is
   bookkeeping so the "last read" date is current; it is not the fix.
2. **URL Inspection →** *Request indexing* for the three pages that earn money and now
   have new substance. One at a time, then wait:
   - `https://horror.zazieproductions.com/services`
   - `https://horror.zazieproductions.com/composer`
   - `https://horror.zazieproductions.com/contact`
3. **Leave the existing validation running.** It was started 21 Oct; it samples the 14
   URLs over the following days and weeks. Re-triggering it restarts that sampling and
   gains nothing.

### Days 3–7 — what to expect

| Page | Realistic outcome |
| --- | --- |
| `/services`, `/composer`, `/contact` | Crawled within days of a manual request; indexed or recategorised shortly after. |
| `/work`, `/reel`, `/store` | Crawled because their item pages now carry links back and the hubs gained internal links. Watch *Crawled – currently not indexed* separately from *Discovered*. |
| `/legal`, `/terms`, `/privacy`, `/licensing`, `/purchases`, `/faq`, `/accessibility`, `/process` | The slowest group by design. They are support documents; they convert traffic, they do not earn it. Expect a mix of indexed and deferred, and do not chase them. |

Progress is visible as `Last crawled` filling in with a date. That is the signal that the
discovery fix worked. Indexing is a separate, later decision.

### Days 7–30 — the part that is not code

Page-level fixes raise the ceiling; they do not raise authority. For 14 deferred URLs on
a new domain, the remaining input is **links from somewhere other than this site**:

- IMDb name page (`nm17333332`), Bandcamp, SoundBetter, FilmFreeway, itch.io, Gumroad,
  Spotify and Apple Music profiles — make sure each one links the site with a descriptive
  anchor (e.g. *horror composer portfolio — Zazie Productions*), not `click here`.
- Every credited film's own site, festival page, or press kit that lists the composer.
- A director testimonial or interview that links `/composer` or a specific `/work/…`
  record. Two or three of these do more for the deferred legal pages than any on-page edit.

---

## 5. What not to do

- **Do not add `noindex` "to consolidate".** These pages are the site's trust surface
  (terms, privacy, accessibility, purchasing). They are wanted in the index.
- **Do not delete the 14 pages and redirect them to `/`.** That discards real content and
  creates a soft-404 pattern, which is worse than a deferred page.
- **Do not resubmit the sitemap repeatedly**, request indexing in bulk, or paste the URLs
  into third-party "indexing services". None of it creates crawl budget; some of it looks
  like spam.
- **Do not hand-edit prices into the new `/services` copy.** `src/data/pricing.ts` is the
  only source of fees; hand-typed amounts fail the pricing sync in `npm run build`.
- **Do not re-add the old rule that hubs must not link their items.** That rule is what
  produced this report. It is now inverted and enforced in `tools/check-sitemap.mjs`,
  `scripts/verify.mjs` and `tools/index-coverage.mjs`.

---

## 6. Reference

```bash
npm run seo:coverage            # per-URL words, in-body inbound links, duplicate ratio
npm run seo:coverage:json      # same, machine-readable (for a diff after any change)
node tools/check-sitemap.mjs --live   # HTTP status of all 85 URLs against a live host
```

Columns in the coverage report:

- **words** — unique words of `<main>` text, chrome stripped.
- **in-body** — distinct pages whose `<main>` links to this URL. Footer and header links
  are excluded: they exist on every page, so they carry almost no weight.
- **dupe** — highest 6-word-shingle overlap with another page. Home-page overlap is
  reported separately, because the generated rate card appears on both by design.

Success criterion for this runbook: `npm run seo:coverage` reports
`sitemap-only orphans : 0` and `hub near-duplicates : 0`, and Search Console's *Last
crawled* column stops saying `N/A`.
