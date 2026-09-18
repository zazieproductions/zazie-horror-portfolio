# GEO: generative engine optimisation for horror.zazieproductions.com

Date: 2026-09-18 · Companion to `SEO-DOSSIER.md`, `SITEMAP.md`, `RATIFY.md`
Scope: making this entity the source that answer engines retrieve and cite for
psychological horror scoring, dark atmospheric film composition, dread-score
craft and unsettling sound design.

---

## 1. What was actually wrong

The site had excellent conventional SEO and **zero generative citation**.
Measured on 2026-09-18 before any of this work:

| Signal | Baseline |
|---|---|
| Google AI Mode, brand query | Generates a full entity answer — citing **LinkedIn and IMDb**, not this site |
| Google brand SERP | Populated entirely by third-party profiles (LinkedIn, IMDb, Pulitzer Center, ManicWorld, MUSE, Muso.ai) |
| `best psychological horror composers` | **No presence.** Answer served from editorial listicles and Reddit |
| `who composes psychological horror scores` | **No presence.** Served by low-authority blogs and Wikipedia |
| Citation rate across the battery | **0%** |
| Mention rate across the battery | 50% (identity queries only) |

The diagnosis matters more than the numbers. The entity is not invisible —
the *site* is. Every retrieval system that looked for this entity found
LinkedIn, IMDb, Stage 32, a Reelcrafter page, a festival page and a Pulitzer
Center letter, and built its answer from those. The site held the credits,
the rate card, the rights model and the awards, and was never consulted.

That is a fixable failure, and it is fixable on-site, because an answer engine
has no way to know that a page is the primary source except by how it is
written, structured, dated and attributed.

---

## 2. The system that was built

### 2.1 The citation layer — six reference documents

These exist to be *retrieved and quoted*, which is a different design brief
from a portfolio page. Each one is answer-shaped, dated, attributed, revision
logged, and carries a stable citation string.

| Page | What it is for | Schema |
|---|---|---|
| `/dread` | **The Dread Grammar.** Fifteen named techniques, six-rung dread ladder, genre map, spotting questions, explicit refusals. The flagship asset: named frameworks are what models quote. | Article + DefinedTermSet (15) + FAQPage (6) |
| `/glossary` | 67 defined terms across technique, sound design, delivery and rights. Dense, anchorable definitions. | CollectionPage + DefinedTermSet (67) + FAQPage (5) |
| `/lineage` | The five families of psychological horror scoring, with landmark scores and a **commission map** — what to ask for if you want each sound. Built for "composers like X" and "best horror composers". | CollectionPage + FAQPage (5) + 20 `mentions` |
| `/sound-design` | The subtraction method, fourteen material categories, five passes, the 209-source library. Built for "unsettling cinematic sound designers". | CollectionPage + DefinedTermSet (14) + FAQPage (5) |
| `/press` | Four approved bios (25–250 words), six cleared quotations, verified credits, awards, and an editorial licence for images and audio. The page a journalist *or a model* copies its description from. | WebPage + Person + FAQPage (4) |
| `/facts` | **Canonical entity record.** Identifiers, rates, rights model, awards with the body that recorded each, plus an explicit "what is not true" section. | WebPage + Organization + FAQPage (5) |

All six are generated from `legal-src/pages/*.html` through
`legal-src/build.sh`, so the schema is generated **from the visible markup**
and cannot drift from it.

### 2.2 Machine-readable authority

- `facts.json` — JSON-LD Organization node: founder, 16 `sameAs` profiles,
  18 `knowsAbout` topics, 8 awards, 2 professional affiliations, 8
  `subjectOf` third-party publications, `additionalProperty` facts, `citation`.
- `llms.txt` — curated retrieval index: canonical record, reference documents,
  identifiers, third-party profiles, and notes for retrieval systems.
- `robots.txt` — explicit `Allow` groups for 25 AI/answer-engine user agents,
  no crawl delay, alongside the existing SEO crawler policy.
- Entity graph in `index.html`, `/composer`, `/facts`, `facts.json`: `sameAs`
  expanded from 10 to 16 verified profiles; `award`, `memberOf`, `subjectOf`
  added; the complete set of reference documents attached as `subjectOf` from
  the Person and Organization nodes.

### 2.3 Sitemap, headers, service worker

- `sitemap.xml`: 15 → 21 URLs, 37 → 43 images. Validator passes.
- `_headers`: canonical `Link` headers for all six routes, `Content-Type` and
  caching for `/llms.txt` and `/facts.json`.
- `sw.js`: reference documents added to the precache list *and* the
  network-first list, so a revised document is never served stale. Cache
  version bumped to v5.
- **Build fix:** the hashed stylesheet rotates on every build, and
  `index.html`, `404.html`, the silo hubs and `sw.js` hardcode it. The build
  now rewrites those references in place before deleting the previous build.
  Without this, any future content edit would have silently unstyled most of
  the site.

### 2.4 Measurement

- `tools/geo-audit.mjs` — static readiness audit. Currently **100/100**,
  0 fail, 0 warn, across 21 pages, 55 JSON-LD blocks, 7 FAQPage nodes,
  3 DefinedTermSet nodes, 6 citation blocks.
- `tools/geo-battery.mjs` + `geo/query-battery.json` — 35 queries in six
  clusters (identity, craft, discovery, comparison, commercial,
  entity-integrity). `--list` to run them, `--score` to compute mention rate,
  citation rate, sole-source rate and hallucination flags from
  `geo/measurements.jsonl`.
- `geo/measurements.jsonl` — the baseline ledger, with method caveats recorded
  honestly rather than hidden.

**Leading indicator: citation rate. Not traffic, not rankings.** A citation is
what a later retrieval step copies; a mention without a citation does not
compound.

---

## 3. Run this next

### 3.1 The weekly loop (30 minutes)

1. `node tools/geo-battery.mjs --list` — run the 35 queries in ChatGPT,
   Perplexity, Google AI Mode, Gemini, Claude, Grok and Copilot. Signed out,
   clean profile, locale pinned. Record one line per observation in
   `geo/measurements.jsonl`.
2. `node tools/geo-battery.mjs --score` — watch citation rate per cluster.
3. For every answer that describes the entity *without* citing the site, note
   which source it used instead. That source is the competitor to displace,
   and it tells you which of your own pages is not yet citable enough.
4. For every hallucination or contradiction, check the `/facts` "what is not
   true" list: if the fact is not covered there, add it. That list is the
   cheapest possible anti-hallucination lever and it is currently doing more
   work than any other single section.

### 3.2 Off-site, in priority order

Nothing below is done — these need a human with an account, and the first four
are the highest return available.

1. **Create a Wikidata item** for Zazie Kanwar-Torge (`human`) and one for
   Zazie Productions LLC (organisation/record label), with `sameAs` to IMDb,
   Spotify, Bandcamp, official site, and `described at URL` pointing at
   `/facts`. Wikidata has no notability threshold like Wikipedia, is consumed
   directly by Google's knowledge graph and by Wikipedia, and is the single
   highest-leverage entity move left. Sourced, disclosed, honest — no puffery,
   no unsupported statements.
2. **Do not attempt a Wikipedia article yet.** There is no independent
   significant coverage in reliable secondary sources about this entity; a
   draft would be deleted and would leave a public deletion record that
   retrieval systems can surface. Revisit after items 3–5 produce coverage.
3. **Register the works.** ISRC codes for released cues and PRO registration
   mean the repertoire appears in ASCAP/BMI/SoundExchange public databases.
   Those are authoritative third-party records that engines treat as
   definitive, and they carry the writer/publisher split that `/licensing`
   already promises.
4. **Place the Dread Grammar as a guest craft piece**, not as an advert:
   pitch a 1,200–1,800 word extraction ("the silence budget", "why horror
   scores decay faster than any other kind") to one outlet at a time —
   *Film Score Monthly*, *Score It Magazine*, *The Film Scorer* podcast,
   *No Film School*, *Directors Notes*, *Little White Lies*, *Fangoria*,
   *Rue Morgue*, *Bloody Disgusting*, *Dread Central*, *MUBI Notebook*.
   The pitch is a genuine craft argument with the taxonomy as a public
   reference; the link and the entity co-occurrence follow from the piece
   being useful, and the outlet keeps its own byline.
5. **Publish the cue corpus as primary data.** A small, real dataset derived
   from the studio's own 29 cues — duration, tempo, key centre, mood cluster,
   whether a cue is designed or performed, where the vacuum sits in the film.
   No other composer has published this. Datasets get cited, and citation is
   the whole game. Ship as `/dread#corpus` plus a CSV and a `Dataset` schema
   node.
6. **Entity consistency sweep.** The same name, role string, location, phone
   and one-paragraph description should appear on every profile that already
   exists (IMDb, MUSE, Stage 32, SoundBetter, Musicians Directory, Muso,
   Reelcrafter, Bandcamp, itch.io, Gumroad). Identical phrasing across
   independent profiles is what makes an entity resolvable; drifting phrasing
   is what makes models hedge.
7. **Offer the taxonomy for syndication with canonical control.** CC BY-ND
   with a required canonical link, offered to horror-adjacent newsletters and
   film-school course lists. Model answers cite the copy that is cleanest, so
   make the clean copy point home.
8. **Community participation, disclosed.** r/soundtracks, r/horror,
   r/Filmmakers, VI-Control, Gearspace, Film Score Monthly's forum. Answer
   technique questions properly, sign as the composer, link only when the link
   is the answer. These forums are in every retrieval set for craft queries;
   self-promotion without disclosure gets removed and poisons the account.
9. **Festival and conference panels.** Sitges, Fantasia, Fantastic Fest,
   Brooklyn Horror, Nightstream industry programming. A panel credit is an
   independent, citable record — and it converges with item 2.

Aim the sequence at **craft queries first, discovery second, commercial
third**. Craft queries are definitional ("what is a silence budget"), the
retrieval bar is currently low, and `/dread` and `/glossary` already answer
them better than anything indexed.

### 3.3 Adversarial review — what a competitor or a filter sees

- **Thin-entity chain.** The site had no Wikidata, no Wikipedia, no PRO
  records, and until now no machine-readable entity record. A quality filter
  sees a self-published portfolio with an unusually enthusiastic schema graph.
  The reference documents are the substance that answers this, which is why
  they carry real technique and real lineage instead of adjectives.
- **Self-serving rating markup.** The homepage carries `AggregateRating` 5.0
  with four reviews attributed to roles rather than people, on the studio's
  own Organization node. Google's structured data policy excludes reviews of
  your own business. This is the most likely single cause of a manual action
  or a rich-result suppression on this site. See §4.
- **Over-optimisation tells.** Exact-match keyword stacking in titles
  ("psychological horror composer" five ways), a footer paragraph that reads
  as a keyword list, and nine hub pages created in one pass. Models discount
  repetitive phrasing and reward specific claims; the fix is to let the
  reference documents carry the keywords and shorten the boilerplate.
- **Unverifiable superlatives.** "Award-winning" is safe now that §2.1 lists
  the awards with the body that recorded each. The unverified press list
  ("Grammy Weekly", "Limitless Magazine", "Billboard Wire") is not, and is not
  repeated anywhere in the new material. See §4.
- **Freshness decay.** An answer engine weights recency. Every reference
  document carries `dateModified`; the honest move is to actually revise them
  — a new technique, a new term, a corrected claim — rather than to touch the
  date. A touched date with unchanged content is detectable.

---

## 4. Ratify before relying on it

Facts and structures that create an obligation. Nothing here is legal advice.

1. **The 5.0 collaborator rating and the four reviews.** `AggregateRating` and
   `review` are attached to the studio's own Organization node in
   `index.html`. Google's policy: *"Reviews must not be for your own
   business."* Recommended edit: keep the visible testimonials, drop the
   `AggregateRating` and `review` markup from the Organization node, and move
   the feedback to a plain page section. The `/facts` and `/press` pages
   already describe the rating as "5.0 across four recorded collaborator
   reviews", which is accurate for what it is. **Your call: drop the markup,
   or document the reviews properly.**
2. **The unverified press list.** The homepage footer and the press section
   name *Grammy Weekly*, *Limitless Magazine* and *Billboard Wire*. I could
   not verify any of the three, and have not repeated them in any new page.
   Either produce the clippings or remove the names.
3. **"Visual Container Winter 2024 Award Winner".** Listed on `/facts` and
   `/press` as self-reported, because I could not find the awarding body's own
   publication of it. If documentation exists, it should be linked; if not, it
   should be removed from the new pages and it weakens the pre-existing claim.
4. **llms.txt licensing statement.** `/llms.txt` currently states that audio
   and images may not be used to train generative models, while text may be
   retrieved and quoted with attribution. That is a deliberate distinction:
   retrieval-time visibility is fully enabled (and is the whole strategy),
   training-time inclusion of the audio catalogue is not. If you want that
   enforced technically rather than asserted, add a `Disallow: /audio/` and
   `Disallow: /images/` group for the AI user agents in `robots.txt` — but note
   it will also remove the images from image search, which is a real loss.
   **Decide which side of that trade you want.**
5. **Award and profile claims in the entity graph.** `facts.json`, `/facts`
   and `/press` now carry the award list and the AFM / Council of Music
   Creators affiliations, sourced from the studio's own profiles and from the
   bodies that published them. Confirm each is current and that membership is
   in good standing, because a professional affiliation is a factual claim
   like any other.
6. **`/dread` is a published framework under your name.** It claims authorship
   of the taxonomy (not of the techniques), names living composers, and
   credits their scores as lineage. That is normal craft writing and it is the
   most persuasive thing on the site. Read it once as if you were Colin
   Stetson's manager.

---

## 5. Definition of done

The system is finished when, for the craft and discovery clusters:

1. `citation rate` on `geo/measurements.jsonl` is above 30%, and
2. at least three of the six reference documents are cited by name by an
   engine that has never been prompted with the brand, and
3. the entity answer in Google AI Mode and Perplexity cites
   `horror.zazieproductions.com` alongside LinkedIn and IMDb rather than
   instead of it, and
4. `/facts` "what is not true" is the answer the engines give when asked about
   the entity's Wikipedia article.

Then re-run the battery, find the new weakest cluster, and go again.
