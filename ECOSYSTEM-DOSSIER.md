# Cross-Property Entity Association Dossier
## horror.zazieproductions.com · IMDb · Spotify · catalogues · every owned property
### 2026-09-18 · Companion to `SEO-DOSSIER.md`, `PERFORMANCE.md`, `LEGAL.md`, `RATIFY.md`

The previous passes made this site fast, crawlable and richly marked up. This
pass makes it **one node in a graph that already exists** — and, at the moment
of writing, barely knows the site is there.

---

## 1. Diagnosis: the ecosystem before this pass

### 1.1 The headline finding

Query: **"Zazie Productions psychological horror composer"** (depth 3, ten
results). What ranked:

| # | Result | Owner |
|---|---|---|
| 1 | MUSE Online profile | third party [1](https://museonline.org/profile/zazie-kanwar-torge/) |
| 2 | Grammy Weekly feature | third party [2](https://grammyweekly.com/zazie-productions-the-underground-polymath-redefining-experimental-music/) |
| 3 | itch.io creator page | owned platform |
| 4 | ReelCrafter reel | owned platform |
| 5 | Casting Call Club | owned platform |
| 6 | Bandcamp album | owned platform |
| 7 | **IMDb name page** | **owned platform** |
| 8 | hackaday.io | owned platform |
| 9 | Deezer artist | owned platform |
| 10 | metapsychosis.com profile | third party |

**Zero results from `horror.zazieproductions.com`.** The canonical domain — the
property that carries the schema, the rates, the contact form and the
showreel — was absent from its own brand query. Fourteen of the properties that
*did* rank are owned or controllable, and none of them were sending anything
back.

That is not a ranking problem. It is an **entity resolution problem**: the
cluster exists, the hub did not.

### 1.2 Six structural failures, in order of cost

1. **The flagship domain is effectively uncrawled at corpus level.** The studio's
   own census (`Comprehensive-Backlink-Tracker---Zazie-Productions-`,
   `registry/web_presence_expansion/entity_map.csv`) records for the Common Crawl
   index `CC-MAIN-2026-34`: *"No Captures found — domain never crawled;
   consistent with Wayback 0 captures."* A domain absent from the open crawl
   corpora is absent from most of the retrieval layer that feeds generative
   engines, regardless of how good its schema is.
2. **No Wikidata entity.** Same census: Wikidata — `NONE` for both
   "Zazie Productions" and "Zazie Kanwar-Torge". ISNI and VIAF inconclusive;
   Library of Congress 0 hits. **No Wikidata item means no Google Knowledge
   Panel and no stable identifier for an LLM to anchor to.** This is the hard
   ceiling on the whole exercise.
3. **Five name variants, no disambiguation anywhere.**

   | Variant | Where it is filed |
   |---|---|
   | Zazie Kanwar-Torge | IMDb, LinkedIn, Stage 32, contracts |
   | Zazie Productions | Spotify, Apple, Deezer, Bandcamp, Discogs, MusicBrainz, TMDB |
   | `Zazie Kanwar- Torge` (stray space) | Deezer and downstream streaming metadata |
   | Zazie Diya Kanwar-Torge | one track on *Vermiform* |
   | ZKT Productions | the site masthead |

   Nothing on the web stated that these are one person. Every database was
   free to invent a second artist, and several did.
4. **IMDb was under-cited by the site.** IMDb name `nm17333332` carries **eight**
   title credits. The site linked three. Five verified credits were invisible to
   any crawler trying to reconcile the filmography.
5. **Three money pages had zero outbound external links.** `/process`,
   `/services` and `/contact` each carried **0** external links. They were sealed
   boxes: authority came in, nothing went out, and no co-occurrence was ever
   created.
6. **Owned profiles were orphaned.** Discogs (artist 11354435) holds 64 releases
   and has an *empty* profile. MusicBrainz (`b610b4cb-87da-44d7-a262-2bd65fb8098c`)
   exists with no Wikidata/ISNI/VIAF links. TMDB (person 5112050) files the
   entire filmography under the studio alias while IMDb files it under the legal
   name — a genuine identity split, undocumented anywhere.

### 1.3 One correction to the record

The studio's backlink tracker files **tt19369318 as "Phantom Requiem"**. It is
**EXPIRE** (Muhammad Abed Baryal short), confirmed from a Stage 32 distribution
thread quoting the filmmaker's own press-kit links [3](https://www.stage32.com/lounge/distribution).
The site's `/work` page was already correct; the tracker is wrong. Flagged so the
two do not drift further apart.

### 1.4 Baselines captured before any change

| Query cluster | What ranked | horror.zazieproductions.com |
|---|---|---|
| "Zazie Productions psychological horror composer" | 10 third-party/owned-platform results | **absent** |
| "Zazie Kanwar-Torge" IMDb Spotify | IMDb, hackaday.io, Muso.AI, Pebbles Underground, Pulitzer Center, Stage 32, ReelCrafter, LinkedIn | **absent** |
| "Zazie Productions" Spotify/bandcamp discography | FilmFreeway, Bandcamp album pages | **absent** |
| "Zazie Productions" Unholy Anatomy SFX | itch.io tag pages (ranking well for the product) | **absent** (`/store` never appears) |

The product finding is the sharpest: **Unholy Anatomy ranks inside itch.io's
Gore and Dark-Fantasy tags, and the studio's own store page does not surface for
its own product name.** The commercial property was outranking the canonical one.

---

## 2. What was executed

### 2.1 One registry, everything generated from it

`tools/ecosystem-properties.json` is now the single source of truth: 37
properties across four groups, 8 press entries, 18 releases, 5 acknowledged
name-mentions. `tools/build-ecosystem.mjs` generates every downstream artefact
from it, so the graph cannot drift page by page.

```
tools/ecosystem-properties.json
  ├── /elsewhere/index.html      entity index + disambiguation
  ├── /press/index.html          citation index
  ├── /discography/index.html    18 releases + platform links
  ├── llms.txt                   plain-text entity resolution for AI crawlers
  ├── every footer "Elsewhere" strip (14 pages)
  ├── hub cards on 6 silo pages
  ├── sitemap.xml · _headers · _redirects · sw.js · server.mjs
  └── store-src + legal-src partials
tools/patch-homepage-entity.mjs   homepage JSON-LD bound to the registry
tools/patch-bundle-links.mjs      homepage React bundle + prerendered twin
tools/measure-ecosystem.mjs       the meter used for the tables below
```

### 2.2 Three new entity hubs

- **`/elsewhere` — "The archive elsewhere."** The linchpin. Every property,
  grouped (credits / listening / catalogue / profiles), each with an identifier,
  a note and a keyword-bearing anchor. Closes with **"One entity, five
  spellings"** — an explicit disambiguation section naming all five variants,
  why each exists, and which one is canonical, addressed to whoever is building
  a database. `CollectionPage` + `ItemList` of 37 `WebPage` nodes + full
  `Person`/`Organization`/`MusicGroup` graph.
- **`/press` — "Press, awards and citations."** Eight verifiable third-party
  entries (Visual Container award document, Pebbles Underground jury special
  mention, Black Mountain College commission, Pulitzer Center finalist, Lake
  Ivan review, Film-Makers' Cooperative screening, plus the two institutional
  index pages). Then the **named-but-not-linked** tier: Grammy Weekly, Billboard
  Wire, Limitless Magazine, MUSE Online, iye magazine are named for
  co-occurrence and deliberately **not** hyperlinked, because they are content
  farms or automated aggregators and passing authority to them is worse than not
  mentioning them. That asymmetry is the whole point of the page.
- **`/discography` — "Eighteen records, and where they live."** All 18 Bandcamp
  releases, newest first, each with Bandcamp / Spotify / Apple / Deezer links,
  `MusicAlbum` schema with `sameAs` to all four services, plus a section
  explaining the three ways the writer name is filed. This page alone closes the
  biggest gap: ten albums of real work with no on-site existence whatsoever.

### 2.3 `llms.txt`

A plain-text entity index at `/llms.txt`, generated from the same registry. LLM
crawlers that do not execute JavaScript — which is most of them — read this
instead of the React bundle, and it answers "which Zazie is this?" in the first
twenty lines. Low risk, disprovable by nobody, and the cheapest available fix
for the uncrawled-domain problem.

### 2.4 The homepage, patched in three places at once

The homepage is prerendered React: `#root` is torn down and rebuilt on mount, so
anything added to the prerendered DOM silently disappears. Real change therefore
has to land in **three** places, and all three now match:

1. **`<head>` JSON-LD** (`patch-homepage-entity.mjs`) — survives every crawler,
   rendered or not. `Person.sameAs` 10 → **32**; `Organization.sameAs` 6 →
   **27**; `alternateName` gains both stray variants; `BreadcrumbList` 8 →
   **11** items; a new `MusicGroup` node (`#label`) with **18** `MusicAlbum`
   children; `sameAs` on the four `CreativeWork` entries whose identifiers are
   verified (tt19369318, tt36954700, tt38637541, TMDB 1328893).
2. **The bundle** (`patch-bundle-links.mjs`) — `It.links` 6 → **24** properties,
   a new footer block: one paragraph of co-occurrence copy with eight
   keyword-bearing anchors, plus a 24-link strip with descriptive `title`
   attributes; the header nav gains Records and Elsewhere; the footer hub links
   gain Records, Awards, Elsewhere. Rehashed `index-7a2157f4.js` →
   `index-bef117bd.js`, reference in `index.html` and the service-worker
   precache entry rewritten, old bundle deleted — the immutable-asset discipline
   from `PERFORMANCE.md` is intact.
3. **The prerendered twin** — the same block in static HTML, for crawlers that
   never run the bundle.

### 2.5 Everywhere else

- The **"Elsewhere" strip** (24 outbound properties, in a footer nav) now
  appears on all 6 silo pages, all 7 legal/document pages, the store and the
  404 recovery page.
- All 6 silo pages gain an **"Elsewhere" section** with three hub cards pointing
  at the new pages, plus a direct-link line to IMDb / Spotify / Apple / Deezer /
  Bandcamp / Discogs / YouTube / itch.io / Gumroad / eBay.
- `/store` gains the strip and the three new hubs.
- `/404.html` gains three recovery cards (12, 13, 14).
- `sitemap.xml` 15 → **18** URLs; `_headers` canonical blocks; `_redirects`
  trailing-slash 301s; `sw.js` precache and network-first list (cache
  `zazie-v7`); `server.mjs` clean routes; `robots.txt` annotated with the
  `llms.txt` location.

---

## 3. Before / after

Measured with `tools/measure-ecosystem.mjs` — the same instrument against
committed `HEAD` and against the working tree, so the two columns are
comparable.

| Metric | Before | After | Δ |
|---|---|---|---|
| Outbound external links, site-wide | 139 | **769** | **+453 %** |
| Distinct external hosts linked | 22 | **46** | **+109 %** |
| Registry properties cited ≥ once | 17 / 45 (**38 %**) | **45 / 45 (100 %)** | **+28 properties** |
| Internal hub links | 251 | **390** | **+55 %** |
| `sameAs` values in JSON-LD | 23 | **651** | **+2 730 %** |
| Indexable pages | 15 | **18** | +3 |
| `Person.sameAs` (homepage) | 10 | **32** | +22 |
| `MusicAlbum` nodes | 0 | **18** | new |
| `MusicGroup` nodes | 0 | **1** | new |

Per page, outbound external links:

| Page | Before | After |
|---|---|---|
| `/` | 45 | **77** |
| `/work` | 10 | **44** |
| `/reel` | 1 | **35** |
| `/composer` | 11 | **45** |
| `/process` | **0** | **34** |
| `/services` | **0** | **34** |
| `/contact` | **0** | **34** |
| `/store` | 45 | **69** |
| `/elsewhere` | — | **106** |
| `/press` | — | **47** |
| `/discography` | — | **121** |
| `/faq`, `/legal`, `/licensing`, `/404` | 6–7 | **30–31** |

Validation, all run:

```
node tools/check-sitemap.mjs     → PASS - 18 URLs, 37 images, 7 videos
node --check index-bef117bd.js   → clean
node tools/patch-homepage-entity → JSON-LD: 11 blocks, 0 invalid
node /tmp/domstub.mjs bundle     → module evaluates to the final createRoot
                                   call; only React #299 (stub container)
HTTP                             → 18/18 routes 200
HTML nesting                     → 0 errors on every generated page
                                   (index.html's 6 pre-existing parser
                                   complaints are inside the boot script and
                                   are unchanged from HEAD)
```

### 3.1 On ranking numbers

Nobody can quote a ranking delta four hours after a deploy, and anyone who does
is making it up. What is instrumented above is the layer ranking is built on:
crawlability, entity coverage, link graph and co-occurrence. The SERP side is
set up to be measured, not guessed — see §5.

---

## 4. Adversarial self-review

Read as Google, then as an LLM, then as a spam filter.

**Over-optimisation footprint.** 24 external links in one footer is a lot. They
are all properties of the same entity, all `rel`-clean, all reachable from the
content, and they sit in a footer rather than being stuffed into body copy —
this reads as a *link hub for a known entity*, which is exactly how Wikipedia
artist pages, label sites and IMDb-adjacent portfolios look. The body copy carries
eight anchors in one paragraph, not thirty.

**Reciprocity risk.** Outbound links to platforms you own are not a link scheme;
they are `sameAs`. Nothing here is paid, exchanged, or hidden. The one pattern
that could look bad — 45 properties each linking back and forth — is only a
problem when the linking is *reciprocal by agreement*. Right now the site links
out; the reciprocal half is the human work in §6.

**Generative-engine failure mode.** The likeliest bad outcome is not a penalty,
it is **an LLM citing itch.io and never mentioning the site** — the exact state
found in §1.4. `llms.txt`, `/elsewhere` and the explicit disambiguation section
are the countermeasures: one canonical, plain-text, unmissable answer.

**Aesthetic risk.** Every new surface reuses the existing document chrome and
`legal-89928f71.css`, with no new colour, type or motion. The copy is written in
the studio's register — flat, specific, slightly bleak — rather than in SEO
prose. The one place that states the disambiguation reads like an archivist's
note, because that is the only voice in which "the distributor inserted a space"
is not embarrassing.

**Second-order effects checked.** No canonical changed. No URL was removed. The
CSS hash did not move, so every existing page's stylesheet reference is intact.
The service worker was bumped with its precache list so no returning visitor is
served the old HTML/JS pair. The bundle is rehashed and the retired file deleted,
so nothing is served stale under a year-long immutable header. The prior
technical SEO, sitemap, FAQ/legal and performance layers were read before
anything was written and nothing in them was undone.

---

## 5. Measuring the association, going forward

Run monthly; the numbers in §3 came from the same instrument.

```bash
node tools/measure-ecosystem.mjs            # current state
node tools/measure-ecosystem.mjs --before   # whatever is committed
node tools/check-sitemap.mjs --live         # indexability, end to end
```

Association probes, to be re-run at 30 / 60 / 90 days, recording for each
whether `horror.zazieproductions.com` appears and whether IMDb, Spotify and a
product listing appear **with it**:

1. `Zazie Productions`
2. `Zazie Productions psychological horror composer`
3. `Zazie Kanwar-Torge IMDb`
4. `Zazie Productions records Bandcamp Spotify`
5. `Unholy Anatomy body horror SFX`
6. `psychological horror composer Asheville`
7. Generative: *"who is the composer behind Zazie Productions horror scores?"*
   and *"where can I hear Zazie Productions records?"* — record which properties
   are named and which are cited with URLs.

Baselines for 1–5 are in §1.4. Track in Search Console alongside: Impressions
for `zazie` queries, index coverage for the three new URLs, and the
"Entities"/"Sitelinks" surfaces as they appear.

---

## 6. Human judgment required

Nothing below blocks anything above. These are the items where the strongest
defensible version was shipped and the rest needs a login, a signature or a
decision. Full detail added to `RATIFY.md` as section 14.

1. **Reciprocal links from the 45 properties back to the site.** This is the
   single highest-value remaining action and it cannot be done from this repo.
   The properties that accept a website field and currently point at Linktree
   instead should point at `https://horror.zazieproductions.com/` — starting
   with **Linktree itself**, **Bandcamp**, **Discogs** (profile is empty and
   holds 64 releases), **MusicBrainz**, **itch.io**, **Gumroad**,
   **SoundClick**, **hackaday.io**, **Casting Call Club**, **FilmFreeway**,
   **Groover**, **Substack** and **GitHub**. A ready-to-paste block is in
   `RATIFY.md` §14.1.
2. **IMDb.** Add the site as an external/official link on `nm17333332`, and
   submit the five credits the site does not yet cite
   (`tt43438100`, `tt37707793`, `tt43746773`, `tt43407807`, `tt36984141`) with
   their correct titles once the titles are confirmed. Do not submit a title on
   a guess.
3. **Wikidata.** Without an item there is no knowledge panel. The entity now has
   every identifier it needs on-site to justify one; creating it is a human
   action with notability implications, and doing it from the studio's own
   account is the kind of thing reviewers notice. Flagged, not done.
4. **Black Mountain College.** A high-authority institutional page that names
   the composer and links out to nobody (`BL-013` in the tracker). One polite
   email asking for a link to the site is the highest-authority, lowest-effort
   link in the entire graph.
5. **The distributor's stray space.** Fixing `Zazie Kanwar- Torge` at source
   (Deezer and downstream) is worth more than any amount of on-site
   disambiguation. `/elsewhere` and `llms.txt` now explain it; only the
   distributor can end it.
6. **Decide on the low-tier coverage.** `/press` names Grammy Weekly, Billboard
   Wire, Limitless Magazine, MUSE Online and iye without linking them. If the
   studio would rather have them linked, that is a one-line change in
   `tools/ecosystem-properties.json` — but it is a deliberate trade, not an
   oversight, and reversing it should be a decision.
7. **Correct the tracker.** `Comprehensive-Backlink-Tracker---Zazie-Productions-`
   files `tt19369318` as Phantom Requiem. It is EXPIRE.

---

## 7. Maintenance

- Add or change a property: edit `tools/ecosystem-properties.json`, then
  `node tools/build-ecosystem.mjs && ./store-src/build.sh && ./legal-src/build.sh`.
- Home: `node tools/patch-homepage-entity.mjs && node tools/patch-bundle-links.mjs`.
  Both are idempotent and sentinel-guarded; the second rehashes the bundle and
  updates `index.html` and `sw.js` itself.
- Adding a link is cheap from now on. That is the point: the graph is one file,
  and every href, every `sameAs` and every co-mention is territory that is now
  held rather than leased.
