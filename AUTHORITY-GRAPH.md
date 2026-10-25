# AUTHORITY-GRAPH.md

**Dated implementation record — 2026-10-25.**
How every `genre` and `knowsAbout` value on horror.zazieproductions.com stopped
being loose text and became a resolvable link into the film industry's own
knowledge graph.

---

## 1. The brief this answers

Position the site as the authority for **experimental art house** and
**psychological horror** composition, aimed at the people who commission scores:
directors, producers, and music supervisors working in the A24 / NEON / IFC
Midnight lane. The machine-readable half of that job is a knowledge-graph
question, not a keyword question:

> When an answer engine is asked *"who scores psychological and folk horror with
> an experimental art-house sensibility?"*, can it walk from this site to the
> entities it already holds — the genres, the movements, the instrumentation —
> or does it only find the words?

Before this pass, `knowsAbout` and `genre` were plain strings
(`"Folk Horror Music"`, `"Horror"`, `"Dark Ambient"`). A string cannot be
resolved. It has no identifier, no cross-reference, and no way to be reconciled
with the same concept as stated by Wikipedia, Wikidata, or IMDb. This pass gives
every one of them an identity.

---

## 2. The published node

Every genre and every `knowsAbout` entry is now a `DefinedTerm` whose `@id` is a
**Wikidata concept URI**, cross-referenced to its **English Wikipedia** article
and — where IMDb's own vocabulary actually covers the term — an **IMDb genre
filter or keyword deep link**:

```json
{
  "@type": "DefinedTerm",
  "@id": "https://www.wikidata.org/entity/Q118141790",
  "name": "Folk Horror",
  "sameAs": [
    "https://en.wikipedia.org/wiki/Folk_horror",
    "https://www.imdb.com/search/title/?keywords=folk-horror&explore=keywords"
  ]
}
```

Three deliberate choices in that shape:

- **Wikidata owns `@id`.** It is the identifier Google's Knowledge Graph and
  most open film datasets reconcile against. A Wikipedia URL in `@id` would make
  the statement about an encyclopedia article; the Wikidata URI makes it about
  the concept.
- **`name` survives.** `genre` is a `Text|URL` range in schema.org. Keeping the
  human label inside the node means consumers that ignore the object shape still
  read "Folk Horror" instead of dropping the value.
- **`sameAs` only carries URLs this repo publishes.** The registry is the
  allowlist; `tools/authority.mjs` fails the build if a page invents a link.

---

## 3. The vocabulary

`src/data/authority.ts` is the single source of truth. ★ marks the twenty-seven
terms that make up the composer's canonical `knowsAbout` list; the rest are
published on the works, cues, releases, and hub pages that need them, or are
held ready for the next page that does.

| ★ | Concept | Wikidata | Wikipedia article | IMDb deep link |
| --- | --- | --- | --- | --- |
|  | Horror Film | Q200092 | Horror_film | `IMDb genres=` **horror** |
|  | Horror Fiction | Q16575965 | Horror_fiction | — |
| ★ | Psychological Horror | Q604725 | Psychological_horror | `IMDb keywords=` **psychological-horror** |
| ★ | Folk Horror | Q118141790 | Folk_horror | `IMDb keywords=` **folk-horror** |
| ★ | Body Horror | Q3641550 | Body_horror | — |
| ★ | Cosmic Horror | Q2448865 | Lovecraftian_horror | — |
| ★ | Art Horror | Q97191621 | Art_horror | — |
| ★ | Supernatural Horror | Q43911809 | Supernatural_horror_film | `IMDb keywords=` **supernatural-horror** |
|  | Supernatural Fiction | Q7644030 | Supernatural_fiction | — |
|  | Psychological Thriller | Q590103 | Psychological_thriller | — |
|  | Thriller Film | Q2484376 | Thriller_film | `IMDb genres=` **thriller** |
|  | Mystery Fiction | Q6585139 | Mystery_fiction | `IMDb genres=` **mystery** |
|  | Crime Film | Q959790 | Crime_film | `IMDb genres=` **crime** |
|  | Drama Film | Q130232 | Drama_(film_and_television) | `IMDb genres=` **drama** |
|  | Science Fiction Film | Q471839 | Science_fiction_film | `IMDb genres=` **sci-fi** |
|  | Short Film | Q24862 | Short_film | `IMDb genres=` **short** |
|  | Reality Television | Q182415 | Reality_television | `IMDb genres=` **reality-tv** |
|  | Paranormal Fiction | Q7135551 | Paranormal_fiction | — |
| ★ | Independent Film | Q459290 | Independent_film | — |
| ★ | Art Film | Q1135802 | Art_film | — |
| ★ | Experimental Film | Q790192 | Experimental_film | `IMDb keywords=` **experimental-film** |
| ★ | Slow Cinema | Q7542092 | Slow_cinema | — |
| ★ | Surrealist Cinema | Q1190502 | Surrealist_cinema | — |
| ★ | Found Footage Film | Q3272147 | Found_footage_film | — |
| ★ | Experimental Music | Q1640319 | Experimental_music | — |
| ★ | Musique Concrète | Q823560 | Musique_concrète | — |
| ★ | Electroacoustic Music | Q1326777 | Electroacoustic_music | — |
| ★ | Acousmatic Music | Q423918 | Acousmatic_music | — |
| ★ | Dark Ambient | Q756956 | Dark_ambient | — |
|  | Ambient Music | Q193207 | Ambient_music | — |
|  | Drone Music | Q650316 | Drone_music | — |
|  | Electronic Music | Q9778 | Electronic_music | — |
|  | Industrial Music | Q487965 | Industrial_music | — |
|  | Intelligent Dance Music | Q660984 | Intelligent_dance_music | — |
|  | Avant-Garde Music | Q2332751 | Avant-garde_music | — |
|  | Outsider Music | Q2416307 | Outsider_music | — |
|  | Chamber Music | Q189201 | Chamber_music | — |
| ★ | Folk Music | Q43343 | Folk_music | — |
|  | Noise Music | Q726239 | Noise_music | — |
|  | Free Improvisation | Q592060 | Free_improvisation | — |
|  | Sound Art | Q1744327 | Sound_art | — |
|  | Field Recording | Q360982 | Field_recording | — |
|  | Cosmicism | Q1159897 | Cosmicism | — |
| ★ | Film Score | Q492264 | Film_score | — |
| ★ | Orchestration | Q3367000 | Orchestration | — |
| ★ | Sound Design | Q1937950 | Sound_design | — |
|  | Sound Effect | Q768807 | Sound_effect | — |
|  | Foley | Q762316 | Foley_(sound_design) | — |
| ★ | Surround Sound | Q569874 | Surround_sound | — |
|  | Leitmotif | Q221117 | Leitmotif | — |
| ★ | Video Game Music | Q1062702 | Video_game_music | — |
| ★ | Adaptive Music | Q5318994 | Adaptive_music | — |
| ★ | Waterphone | Q1471374 | Waterphone | — |
| ★ | Prepared Piano | Q754186 | Prepared_piano | — |
| ★ | Modular Synthesizer | Q391640 | Modular_synthesizer | — |
|  | Extended Technique | Q946962 | Extended_technique | — |

Every `@id` is `https://www.wikidata.org/entity/` + the QID; every Wikipedia
link is `https://en.wikipedia.org/wiki/` + the slug.

### Topical reference topics (appended after the craft vocabulary)

These are things the archive *studies or points at*, not expertise it claims.
They are published as their own linked nodes after the craft list, and each one
carries the disclaimer sentence that says so, verbatim:

| Topic | Wikidata | Wikipedia article | Published disclaimer |
| --- | --- | --- | --- |
| A24 film aesthetic | Q16248298 | A24 | "A reference topic in prestige horror scoring; not an affiliation or production credit." |
| Mica Levi scoring techniques | Q926078 | Mica_Levi | "A reference topic in experimental film scoring; not a collaboration or credit." |
| Folk Horror tropes | Q118141790 | Folk_horror | "Genre conventions used as reference topics for horror scoring." |

They appear in `Person.knowsAbout` after the twenty-seven craft terms, and on
`/composer` also in `WebPage.mentions` (where a page-level reference belongs).
`tools/authority.mjs` enforces the order and the wording, and refuses any
reference topic in `genre` or `sameAs`.

### The composer's canonical list, in order

Psychological Horror · Folk Horror · Body Horror · Cosmic Horror · Supernatural
Horror · Art Horror · Art Film · Experimental Film · Slow Cinema · Surrealist
Cinema · Found Footage Film · Experimental Music · Musique Concrète ·
Electroacoustic Music · Acousmatic Music · Dark Ambient · Film Score ·
Orchestration · Sound Design · Surround Sound · Waterphone · Prepared Piano ·
Modular Synthesizer · Video Game Music · Adaptive Music · Independent Film ·
Folk Music

The order is the argument: the two prestige horror lanes first, then the
experimental art-house lane a festival programmer or music supervisor recognises,
then the craft and instrumentation that make the claim creditable.

---

## 4. Where it lands

| Surface | What is linked |
| --- | --- |
| `/` and `/composer` — `Person` | the full 27-term canonical list |
| `/work/*` — `Movie`, `TVSeries`, `CreativeWork` | each production's genre list |
| `/reel/*` — `MusicComposition` + `AudioObject` | the cue's category, e.g. *Psychological Orchestral* → Psychological Horror + Film Score |
| `/reel` — `MusicRecording` × 30 | the same terms on the showreel playlist |
| `/store/*` — `MusicAlbum`/`Product` | the release's genre list |
| `/` — `CreativeWork` + `MusicPlaylist` | the portfolio genre line and every cue |

Current totals: **354 linked values on 103 pages** (339 craft/vocabulary terms
plus 15 reference-topic nodes), resolving to **45 distinct Wikidata-anchored
concepts**. `node tools/authority.mjs --check --verbose` prints
the per-concept hit count.

### What a label becomes

Authored genre text is mapped, never guessed. `src/data/authority.ts`
(`LABEL_CONCEPTS`) turns the strings the content modules and hub pages already
write into concepts:

| Authored label | Published terms |
| --- | --- |
| `Horror` | Horror Film |
| `Psychological Orchestral` | Psychological Horror + Film Score |
| `Ambient Horror` | Dark Ambient + Ambient Music |
| `Cosmic Horror` | Cosmic Horror (Lovecraftian horror) |
| `Supernatural Thriller` | Supernatural Horror + Psychological Thriller |
| `IDM` | Intelligent Dance Music |
| `Acousmatic` | Acousmatic Music |
| `Avant-garde` | Avant-Garde Music |

A label with no mapping is a **build failure**, not a silent string. Unmapped
text is exactly the state this record exists to prevent.

---

## 5. Guardrails

| Command | What it does |
| --- | --- |
| `node tools/authority.mjs --check` | site-wide audit; runs inside `npm run build` after `prerender` |
| `node tools/authority.mjs --sync` | rewrites `genre`/`knowsAbout` value spans in the published pages from the registry (idempotent; touches nothing else) |
| `node tools/authority.mjs --check --verbose` | per-concept hit counts |
| `npm test` | includes `tools/authority.test.mjs` (9 tests) |

`--check` proves:

1. no published `genre` or `knowsAbout` value is still a bare string;
2. every value is a `DefinedTerm` whose `@id` is a registered Wikidata item;
3. every `sameAs` URL is one the registry published — no invented authority
   links — and lives on `www.wikidata.org`, `en.wikipedia.org`, or
   `www.imdb.com`;
4. each node's `name` and `sameAs` set match the registry exactly;
5. `knowsAbout` uses only the canonical vocabulary, in the canonical order, on
   every page that declares a `Person`;
6. `/` and `/composer` agree term for term.

`knowsAbout` and `mentions` have exactly one published form each, so `--sync`
rewrites those two fields whole from the registry — a page cannot half-adopt the
vocabulary. `genre` values are still mapped span by span.

The `--sync` mode edits only the linked value spans inside each JSON-LD block,
so a page that is already correct stays byte-identical — which is what keeps the
hub twins (`composer.html` / `composer/index.html`, `reel.html` /
`reel/index.html`) in lockstep for `tools/route-aliases.mjs --check`.

### Adding a concept

1. Read the QID from the Wikipedia `pageprops` API
   (`?action=query&prop=pageprops&ppprop=wikibase_item&titles=…`) and confirm the
   English label with the Wikidata `wbgetentities` API.
2. Add the entry to `CONCEPT_DEFS` in `src/data/authority.ts` (and to
   `KNOWS_ABOUT` if it belongs in the composer's list).
3. Add the labels that should resolve to it to `LABEL_CONCEPTS`.
4. `npx tsc && node tools/authority.mjs --sync && node tools/authority.mjs --check`.
5. `npm run build && npm test`.

Only add an IMDb link after IMDb's own search returns results for that genre
slug or keyword; a plausible-looking but empty IMDb URL is worse than none.

---

## 6. Decisions, trade-offs, refusals

**No studio entities as identity.** A24, NEON, and IFC Midnight are the
*audience*, not an affiliation. None of them appear in `sameAs` or `about`, and
nothing claims a collaboration. The lane itself is reached with genre and
movement entities — Art Horror, Art Film, Slow Cinema, Experimental Film,
Musique Concrète — which is both true and exactly how a supervisor searches.

**Reference topics, reconciled.** A parallel change on `main` (PR #128) added
three topical references — the A24 film aesthetic, Mica Levi's scoring
techniques, folk horror tropes — to `knowsAbout` as unlinked `Thing` nodes with
a Wikipedia `url`. The intent is right (say what you study, disclaim the
affiliation) but a bare `Thing` in an expertise list reads as a claim and cannot
be resolved. They are kept, not deleted: each now has a Wikidata `@id` and a
Wikipedia cross-link, they sit *after* the craft vocabulary, they repeat on
`/composer` in `WebPage.mentions` where a page-level reference belongs, and
`--check` fails the build if any of the three disclaimer sentences is reworded
or dropped. `HORROR_REFERENCE_TOPICS` in `src/data/entities.ts` is now derived
from the registry, so its export keeps working with ids added.

**IMDb keywords, not invented IMDb genres.** IMDb's genre list is 27 items; it
has no "folk horror" genre. Where IMDb indexes the term as a *keyword*
(`folk-horror`, `psychological-horror`, `supernatural-horror`,
`experimental-film`), the node links there. Where it does not (body horror, art
horror, cosmic horror, musique concrète), there is **no** IMDb link — a broken
or fabricated deep link costs more trust than a missing one.

**Objects in `genre`, on purpose.** schema.org's range is `Text|URL`, and a
strict validator may warn that a `DefinedTerm` is neither. The trade is
deliberate: the identifier is the point, `name` preserves the text reading, and
this site's rich-result surface is `VideoObject`/`Product`, not `Movie` genre.
If Google ever hard-fails it, `attributeGenre` in `src/lib/head.ts` and
`tools/authority.mjs` are the two places to change.

**Payload.** The homepage grew 227,721 → 246,758 bytes of HTML; gzipped,
42,429 → 43,486 bytes (**+1,057 bytes**), because the URLs repeat and compress
almost perfectly. Catalogue and cue pages gain 0.5–1.0 KB each, raw. That is
acceptable for entity clarity; if it ever stops being acceptable, the fix is to
declare each concept once per page and reference it by `@id`.

**`knowsAbout` is concepts, not sentences.** The old entries ("Bespoke Film
Scoring to Picture", "Dread Sound Design") were vivid but unresolvable. Craft
language still lives in the visible copy and the `<meta name="description">`;
`knowsAbout` is now purely the vocabulary that connects this entity to the
industry's.

**This does not create knowledge-graph membership.** Structured data is a claim.
Google, Wikidata, and IMDb will only bind these claims when the underlying facts
are corroborated — IMDb credits (already in `sameAs`), press coverage (already in
`subjectOf`), and third-party writing that names the same genres. The schema
makes the claim legible; the credits and the work have to make it true.

---

## 7. Verification log

All authority targets were read live on **2026-10-25**, not recalled:

- **Wikipedia** — `en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1`
  for all 56 titles in one request; three titles redirected and are cited under
  their canonical target (`Elevated horror` → `Art horror`, `Found footage (film
  technique)` → `Found footage film`, `Foley (filmmaking)` → `Foley (sound
  design)`).
- **Wikidata** — `www.wikidata.org/w/api.php?action=wbgetentities&props=labels`
  for every QID; each English label matches the concept it anchors.
- **Reference topics** — `A24` → Q16248298 ("American independent entertainment
  company"), `Mica Levi` → Q926078 ("English singer, songwriter and composer"),
  both read from the same APIs; `A24 (company)` redirects to `A24`.
- **IMDb** — `imdb.com/search/title/?genres=horror&explore=genres` returns
  *Top 50 Horror Movies and TV Shows* with the genre filter applied;
  `imdb.com/search/title/?keywords=folk-horror&explore=keywords` returns
  *folk-horror (Sorted by Popularity Ascending)*, 1,891 titles. The four keyword
  terms used here, and the eight genre slugs, were each confirmed against those
  index pages.

Build state at the end of the pass: `npm run build` green (including the new
authority check), `npm test` 68/68 green, `node tools/authority.mjs --check`
reporting 354 values / 103 pages / 45 concepts / 15 reference nodes. The merge
with `main` (PR #128) was resolved in this branch and re-verified.

---

## 8. What would strengthen this next

1. A **Wikidata item for Zazie Kanwar-Torge** (with `occupation`, `genre`,
   `IMDb ID`, and `official website`), and that item added to `Person.sameAs` —
   the single highest-value link still missing, and one only a human can file
   with sources.
2. `MusicBrainz` artist + release-group links in `sameAs` once the discography
   is submitted there.
3. A **`/genres` hub** (`DefinedTermSet` with one `DefinedTerm` per niche,
   `inDefinedTermSet` from every work) — turns this vocabulary into a citable
   page and a stronger internal-link spine.
4. `subjectOf` entries for festival selections and reviews that name the genres,
   so the claims are corroborated by third parties rather than by this site
   alone.
