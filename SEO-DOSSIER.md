# SEO — horror.zazieproductions.com

**Owner of this file:** SEO principal, acting with technical authority inside the repo.
**Last revised:** 2026-09-18
**Status:** implemented, not proposed. Every claim below is either a command output from
this repo or explicitly marked **unverified**.

---

## 0. What changed from the previous dossier, and why

The previous version of this file (`git show 7a24bec:SEO-DOSSIER.md`) documented a pass that
shipped real technical wins and several decisions that were wrong. Two of them were
disqualifying rather than merely suboptimal.

| Previous claim | Verdict | Evidence |
|---|---|---|
| "AggregateRating 5.0 4 reviews on Organization + LocalBusiness (preserved)" | **Removed.** Self-serving review markup is a Google spam-policy violation, not an aggressive tactic. | The 4 `Review` nodes were authored by `"Independent Director"`, `"Music Supervisor"`, `"Festival Circuit"`, `"Student Filmmaker"` — anonymous role labels, none with a `reviewRating`. A 5.0 aggregate was computed from reviews that carry no rating, and the visible copy called them *"Verified production collaborators."* |
| "Self-referential sameAs including internal hubs … defensible as same entity" | **Removed.** `sameAs` exists to point at the same entity on *other* web pages. Listing `/composer`, `/work`, `/reel` as "the same thing as" the person teaches the graph nothing and dilutes the signal that does resolve. | `Person.sameAs` contained 3 own-domain URLs; `Organization.sameAs` contained its own homepage. |
| Title 110 chars / meta 330 chars, "defensible as descriptive" | **Reversed.** Google truncates both. What was left was keyword cosplay that also mangled the brand's signature lines. | Measured: title 106 chars, description 330 chars, and H2s rewritten to `Horror showreel: 29 original dark cinematic cues. Listen first. Decide in the body.` |
| `VideoObject.contentUrl` deferred to "a deliberate, separate commit" | **Done in this commit.** | 4 × `contentUrl` pointed at `youtube.com/watch?v=…` — an HTML page, not a media file. |

The technical work from that pass that was correct is kept: the soft-404 catch-all removal,
the `_redirects` 301 map, robots parameter blocking, the sitemap image/video extensions, and
`tools/check-sitemap.mjs`.

---

## 1. The system, as measured

### Entity

**Person:** Zazie Kanwar-Torge — composer, experimental producer, multi-instrumentalist.
**Organization:** Zazie Productions LLC, Asheville NC, founded 2022.
**Release/artist name:** "Zazie Productions" — this is genuinely an alias for the *person* on
the music graph (Spotify and Apple Music artist pages both resolve to it), so it stays as
`Person.alternateName`. `"ZKT Productions"` is the masthead lockup and was moved to
`Organization.alternateName`, where it belongs. Previously both sat on the Person, which
asserted that a human being is a limited liability company.

Corroborated off-site (from the site's own `sameAs` set, **not independently fetched** —
no network in this sandbox):

`imdb.com/name/nm17333332` · Spotify `4UOgvZEOo7xBhFBjJvlMm0` · `zazieproductions.bandcamp.com`
· Apple Music `1623719351` · `youtube.com/@zazieproductions` · LinkedIn · Linktree

**Award:** "Winter 2024 Award Winner — Visual Container" is **kept**. It is the one
authority claim on the site that links to a third-party press PDF
(`visualcontainer.tv/wp-content/uploads/2025/01/Winter-2024-Award-Winners_Press…`). That is
the correct corroboration pattern. **Unverified:** I could not fetch the PDF from here.

**Rating:** every "5.0 collaborator rating" claim is **gone**. It appeared in 4 places:
`Organization.aggregateRating`, `Person.award[]`, a hero badge, and the shared footer tagline
baked into 8 pages. The hero badge was the worst instance — `5.0` rendered in `#F5C518`
(IMDb's brand gold) linking to the IMDb name page, immediately beside a separate
"IMDb credited" link. It read as an IMDb rating IMDb does not publish.

### Index

Measured from the repo (the live site was unreachable from this sandbox — see §7):

| | before this commit | after |
|---|---|---|
| URLs in `sitemap.xml` | 15 | **24** |
| Images submitted | 37 | **46** |
| Videos submitted | 7 | **9** |
| Real crawlable film objects | **0** | **9** |
| `<title>` over 65 chars | 15 of 16 pages | **0** |
| meta description over 160 chars | 16 of 16 pages | **0** |
| Self-serving review markup | 2 pages | **0** |
| `sameAs` self-references | 4 | **0** |
| Internal links that 404 | not measured | **0 of 572** |

### The bottleneck that mattered

**The filmography did not exist as objects.** Nine productions were nine `<h2>` sections on a
single 771-word page. There was no `Movie`, no `MusicComposition`, no per-work URL. Every
"[film] composer" and "[film] score" query had nothing to land on, and four of the nine
`CreativeWork.url` values pointed at the composer's IMDb **name** page — telling the graph
that four films *are* that person.

That was the single largest structural gap, and it is now closed.

---

## 2. Committed architecture

One URL per intent. No page is built to be a thin satellite of another.

| Intent cluster | Winning URL | Why it wins |
|---|---|---|
| **Brand** — `zazie kanwar-torge`, `zazie productions` | `/` | Title now leads with the entity name; `Person` + `Organization` resolve; press kit corroborates |
| **Hire** — `psychological horror composer`, `hire horror composer`, `dark atmospheric film composer` | `/` → `/services` → `/contact` | Homepage carries the term in `<title>` and H1; `/services` owns rates; `/contact` is the conversion |
| **Method / craft** — `how psychological horror is scored`, `experimental horror scoring` | `/process`, `/composer` | Real documented process, first-person, named human |
| **Catalogue / discovery** — `dark ambient cues`, cue-name queries | `/reel` | 29 named cues with `AudioObject` per MP3 — the most distinctive, least copyable asset on the property |
| **Credit / entity** — `[film] composer`, `[film] score`, `[film] Zazie` | **`/work/<slug>` ×9** ← new | `Movie`/`TVSeries` + `MusicComposition`, director, year, genre, poster, sample |
| **Filmography overview** | `/work` | `ItemList` of the nine, each item pointing at its own record |

### The filmography graph

`tools/work-data.mjs` is the single source of truth. `tools/build-work-pages.mjs` generates
all 10 pages from it. Homepage `ItemList` and `/work` `ItemList` are generated from the same
data, so they cannot drift.

```
/                      9 tiles, each → /work/<slug>     (previously: all 9 went off-site)
/work                  ItemList → 9 records
/work/<slug>           Movie + MusicComposition + BreadcrumbList + Person
   ├─ adjacent work    linked by SHARED GENRE, not "related posts"
   ├─ /reel            "the material outside a specific picture"
   ├─ /process         the method
   ├─ /composer        the vocabulary
   └─ /contact         the CTA
```

Internal links are conceptual: EXPIRE connects to CHOLERIC because both are body horror, not
because both were published last year. That is what teaches a crawler what this house *is*.

### Three rules the generator enforces

1. **A sound-design credit is never marked up as a `MusicComposition`.** EXPIRE is credited as
   sound designer on this site, so `/work/expire` emits `Movie` + `Role{roleName:"Sound designer"}`
   and states in visible copy: *"This credit is sound design rather than a composed score."*
   Verified: `musicBy present? False`.
2. **`VideoObject` is emitted only when `uploadDate` is known.** `uploadDate` is required for
   video rich results. Phantom Requiem has a real video and no published date, so it gets the
   embed and no schema rather than a guessed date.
3. **A work's `sameAs` is its own IMDb *title* page, or absent.** Never the name page.

### What will not be built

- **No blog.** A news/magazine layer would change what the site is and dilute the entity type.
- **No listicles.** "Top 10 psychological horror movies 2026" is brand assassination.
- **No tag or category pages.** Nine productions do not need faceted navigation.
- **No `psychological horror` head-term page.** See §6.
- **No hreflang.** Single language, no measured international demand.
- **No per-film pages for the four sample-only works.** See §7, escalation 2.

---

## 3. Verification

Four commands, all passing:

```
node tools/build-work-pages.mjs --check     # 10 pages in sync with work-data.mjs
node tools/check-seo.mjs                    # PASS - 25 pages, 24 sitemap URLs, 572 internal links, 0 errors
node tools/check-sitemap.mjs                # PASS - 24 URLs, 46 images, 9 videos
node server.mjs && curl -I /work/expire     # 200; /nope-not-a-page returns a real 404
```

`tools/check-seo.mjs` is new and is the regression gate. Every rule in it exists because it
was actually broken here. It fails the build on: `AggregateRating`/`Review` markup, "Verified
collaborator" claims, `sameAs` self-references, `Person.alternateName` company conflation,
`VideoObject` without `uploadDate`, `contentUrl` pointing at an HTML watch page, title >65 or
description >160, missing/duplicate/non-self-referencing canonical, ≠1 `<h1>`, SEO jargon in
visible copy, internal links that do not resolve, sitemap/canonical disagreement.

It caught 39 real defects on first run, including seven legal pages still carrying the
fabricated rating in the shared footer partial. It now returns 0.

Rebuilds were run through the project's own scripts (`legal-src/build.sh`,
`store-src/build.sh`). Asset hashes are unchanged — `legal-89928f71.css`,
`store-8af6034d.css` — so no reference churn and no `sw.js` precache invalidation.

---

## 4. Subdomain vs apex — one recommendation

**Keep `horror.zazieproductions.com` as the canonical host. Do not merge into the apex.**

Reasoning: every asset on this property — canonicals, `_headers` Link headers, `robots.txt`,
the sitemap, all `@id` values in the structured data, and every `sameAs` target — already
resolves to the subdomain as a single consistent entity. A merge would mean 301-ing 24 URLs
and rewriting every `@id`, and the equity being protected is small enough that the migration
risk exceeds the gain. Splitting the *store* onto the same host would be a different question
and is not worth reopening now.

Residual risk: if the apex `zazieproductions.com` carries significant equity or ranks for
brand terms, the two hosts compete for the brand SERP. **Unverified** — I could not fetch
either host from this sandbox. This is the one item in §7 that needs an operator with
Search Console access to settle.

---

## 5. Measurement

In place: `tools/check-seo.mjs` and `tools/check-sitemap.mjs` both exit non-zero, so they can
run in CI on every commit.

**Not in place, and the next thing to wire:** conversion events. There is no analytics on this
property (by design — the privacy notice says "no advertising trackers · no cookies set by
this site"). The measurement gap is real: a #1 page whose inquiries nobody counts is a trophy
in an empty room. The instrumentation must be cookie-free to stay consistent with the notice —
server-side log counting on the `mailto:` click, or a privacy-preserving beacon. That is an
operator decision, not something to add silently.

**Search Console actions, in order:**
1. Confirm `https://horror.zazieproductions.com/sitemap.xml` serves 24 URLs (it currently
   serves 15 in production until this merges).
2. Resubmit the sitemap.
3. Request indexing on `/work` and all nine `/work/<slug>` URLs — never crawled before.
4. Check the **Video pages** report: expect 3 valid `VideoObject` on `/` (was 4, one of which
   was invalid) plus 2 on film pages.
5. Watch for the *Excluded by "Alternate page with proper canonical tag"* row — it should
   stay empty; the sitemap validator enforces canonical equality.

---

## 6. Attacking my own strategy

**What I cannot win:** `psychological horror`. That SERP is Wikipedia, streamers and
magazines, and it is not a hire-intent query anyway. Nobody searching it is buying a score.
There is no version of this site that should want it.

**What is owned instead:** the composer/craft neighbourhood. `psychological horror composer`,
`dark atmospheric film composer`, `experimental horror score`, and — the defensible moat —
every `[film] composer` and `[film] score` query for the nine productions, which now have a
real object to resolve to and did not have one yesterday.

**Where the strategy is still exposed:**

1. **Thin per-film content.** Each record runs 452–549 visible words (measured). That is enough to resolve
   the entity and win a long-tail credit query; it is not enough to win a competitive one.
   The missing layer is per-film craft commentary — which cues, what instrumentation, what the
   director asked for. I did not write it, because inventing it is the one thing this brief
   forbids. See §7, escalation 1.
2. **Off-site corroboration is unchanged.** I could not verify or edit IMDb, Wikidata,
   MusicBrainz or Discogs from here. Entity resolution depends on those records agreeing with
   this page, and I have not confirmed they do.
3. **Four scored works have public samples and no filmography record** — AQUAPHOBIA,
   GOODBYE BROTHER, Home Intruder, Whispers In The Dark. They are named on `/work` with an
   honest explanation rather than given invented credits.
4. **No backlink work.** Nothing in this commit earns a citation. The nine film pages are the
   linkable artifact — a director's festival page can now link to a real record instead of a
   portfolio homepage — but the outreach has not happened.
5. **Performance unmeasured.** The nine new pages add ~13 KB of HTML each and no new assets
   (posters are preloaded AVIF, already on disk). I did not run Lighthouse: no browser in this
   sandbox. LCP on the filmography template is **unverified**.

**Adversarial self-review, as the brief asks it:**
- *Would a music supervisor land here and believe this is the one?* On `/` and `/work`, yes —
  nine credited productions with directors, a named award with a third-party source, and a
  clear inquiry path. The removed star rating was hurting this, not helping: a director reads
  an unattributed "5.0" as a red flag.
- *Would a crawler understand who this is in 15 seconds of HTML?* Yes. `<title>` names the
  person and the discipline; `Person` and `Organization` are separated and cross-linked;
  `sameAs` points only at off-site canonical profiles.
- *Would a spam classifier see an artist or a content site?* Artist. Zero jargon in visible
  copy (enforced by the linter), no blog, no tag pages, 24 URLs total.

---

## 7. Waiting on a human

Decision memos, not a menu.

### 1. Per-film craft commentary — **the highest-value thing left**
**Recommend:** the composer writes 100–150 words per production covering what the cue work
actually is (instrumentation, the problem the director brought, one specific moment).
**Why:** it is the only remaining information gain. Everything factual about these films is
already on IMDb; the sonic argument is not, and it is the thing nobody can copy.
**Already implemented:** the page template, schema, internal graph and CTA are live, so this
is copy-in, no rebuild. Add the text to `tools/work-data.mjs` and run
`node tools/build-work-pages.mjs`.
**Residual risk:** none. Absent fields are simply omitted.

### 2. The four sample-only works
**Recommend:** supply director, year and role for AQUAPHOBIA, GOODBYE BROTHER, Home Intruder
and Whispers In The Dark. Each becomes a 10th–13th record.
**Why:** four scored works with public video and no filmography entry is four credit queries
going to IMDb instead of here.
**Already implemented:** they are named on `/work` with an honest "credits not yet confirmed"
note, so nothing on the site is misleading in the meantime.
**Residual risk:** shipping a page with a guessed director would be a fabricated credit. That
is why they are not built.

### 3. Phantom Requiem upload date
**Recommend:** supply the real YouTube upload date for `UX2kv3G89Jw`.
**Why:** `uploadDate` is required for video rich results. The invalid `VideoObject` was
removed rather than guessed at.
**Already implemented:** the embed and the film record are live; only the schema is absent.
**Residual risk:** none.

### 4. Store ratings
**Recommend:** if the 17 ratings on the Gumroad sound library are real Gumroad data, keep them
on Gumroad and link out. Do not republish the aggregate in first-party `Product` markup.
**Why:** Google treats reviews about your own product on your own page as self-serving, and
the manual action risk is domain-wide. The `aggregateRating` was removed from
`store-src/store.html`.
**Residual risk:** losing product review stars in the store SERP. That is the correct trade.

### 5. Conversion measurement
**Recommend:** cookie-free inquiry counting (server log or privacy beacon), so "qualified
inquiries" becomes a number.
**Why:** §5. Currently there is no way to know whether any of this worked.
**Residual risk:** adding a tracker would contradict the published privacy notice. Hence the
constraint in the recommendation.

### 6. Apex vs subdomain equity
**Recommend:** check Search Console for `zazieproductions.com` brand impressions before
assuming the subdomain is the right canonical host. See §4.
**Residual risk:** if the apex holds real equity, two hosts are splitting the brand SERP.

---

## 8. Housekeeping not done deliberately

- **`The Dark Awaits.png`** — 2.8 MB at the repo root, spaces in the filename, referenced by
  nothing except `PERFORMANCE.md`. It is crawlable dead weight. Not deleted, because it may be
  the source asset for a poster. Recommendation: move to `images/posters/` under a hyphenated
  name, or delete.
- **`robots.txt` `Host:` directive** — kept. Google ignores it; Yandex dropped support for it
  too. Harmless, and removing it is churn.
- **`sw.js` offline fallback** serves `/index.html` when a cached page misses and the network
  is down. That is a client-side soft 404, but only for offline users; the server returns real
  404 status, which is what Googlebot sees. Left alone.
- **Film pages are not precached** by the service worker. Nine × 13 KB on first load to
  precache pages nobody has asked for is a performance cost with no benefit; the runtime
  stale-while-revalidate handler already covers them.

---

## 9. Files

**New**
`tools/work-data.mjs` · `tools/build-work-pages.mjs` · `tools/check-seo.mjs` ·
`work/{expire,unseen,peregrinus,phantom-requiem,eclipsed,the-haunted,choleric,mike-has-a-visitor,the-dark-awaits}/index.html`

**Modified**
`index.html` (integrity, entity, titles, H2s, internal links, ItemList) ·
`work/index.html` (regenerated as a real filmography hub) ·
`sitemap.xml` (24 URLs) · `_headers` (72 canonicals) · `_redirects` (9 trailing-slash 301s) ·
`composer/`, `reel/`, `process/`, `services/`, `contact/`, `404.html` ·
`legal-src/partials/footer.html` + 7 page sources (and their built output) ·
`store-src/store.html` (and built output)

**Untouched on purpose**
`server.mjs` (its generic directory resolution already serves nested routes) ·
`sw.js` (runtime SWR already covers the new pages) ·
`robots.txt` (already correct) ·
all imagery, fonts, audio, and the entire cinematic boot sequence
