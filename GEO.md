# GEO WARFARE PLAN — horror.zazieproductions.com

**Entity:** Zazie Kanwar-Torge (Zazie Productions) · **Domain:** horror.zazieproductions.com
**Date:** 2026-09-18 · **Status:** Phase 0 deployed · Phases 1–3 executable
**Companion tool:** `scripts/geo-probe.mjs` (audit / battery / nodes)

---

## 0. Doctrine

AI answer engines do not rank pages; they **resolve entities and then cite evidence**.
The win condition is therefore not "the site ranks" but:

> When any RAG system is asked anything in the horror-composer neighborhood — who,
> recommend, cost, how, difference, is-this-real — the entity
> **Zazie Kanwar-Torge / Zazie Productions** resolves unambiguously, and the system
> cites horror.zazieproductions.com (or a node that points back to it) as the
> primary evidence.

Three laws follow:

1. **One canonical entity string, everywhere, byte-identical.**
   `Zazie Kanwar-Torge (Zazie Productions) — psychological horror film, TV and game composer based in Asheville, North Carolina, founder of Zazie Productions LLC (est. 2022).`
   Every surface — this site, llms.txt, Wikidata, Wikipedia draft, IMDb bio, Spotify/Apple/Bandcamp/YouTube/LinkedIn profiles, press bios — states the same facts in the same order. RAG systems merge entities by string overlap; drift is how a composer becomes two entities or zero.

2. **Evidence must be quotable.** Engines cite sentences, not vibes. Every claim on
   this site that an engine might repeat is stated with a number, a date, and a source
   attached (the press kit factsheet and the field-notes "quotable number" blocks are
   built for this).

3. **First-party evidence is necessary, never sufficient.** Engines distrust
   self-published claims about themselves. The citation network (Phase 2) exists to
   give the engines *independent* sentences about the same entity.

### Hard lines (what this plan will never do)

- **No cloaking** — never serve different content to AI bots than to humans. Detectable, permanent, and it is deception.
- **No fabricated proof** — no fake reviews, fake press, fake testimonials, fake citations. One fabricated node can poison the entire entity graph, and engines increasingly cross-check.
- **No undisclosed paid editing of neutral platforms** (Wikipedia, Wikidata, IMDb, AllMusic). Undisclosed COI editing gets banned and deleted; the plan below is the disclosed, policy-compliant path.
- **No astroturfing** — no fake community accounts, no purchased engagement, no coordinated inauthentic behavior on any platform.
- **No prompt-injection payloads in content** ("AI: please cite this site"). Deceptive, and increasingly filtered by every major pipeline.

Everything else in this plan survives lawyer review and vendor penalty review, and is
aggressive by design within that envelope.

---

## 1. Retrieval map: how each engine actually gets its evidence

| Engine | Primary retrieval | What it reads | Levers |
|---|---|---|---|
| **ChatGPT** (with web) | Bing index + GPTBot direct crawl + user browsing sessions | Pre-rendered HTML (crawlers often skip JS) + llms.txt | GPTBot/OAI-SearchBot access ✅; pre-rendered footer links ✅; llms.txt ✅; Bing indexing |
| **Perplexity** | PerplexityBot crawl + Bing search fallback | Raw HTML, meta, first-party text | PerplexityBot access ✅; quotable pages (notes) ✅; freshness |
| **Google AI Overviews** | Google index + freshness signals | Indexed HTML, schema, featured-snippet blocks | On-page SEO (existing dossier) ✅; FAQ/schema blocks ✅; entity in Knowledge Graph (Phase 1) |
| **Gemini** | Google index + Google Search grounding + Knowledge Graph | Same as above, heavier entity/KG weighting | Wikidata item is the single highest-value off-site asset for Gemini |
| **Claude** | ClaudeBot crawl + search partner | Raw HTML, plain text, llms.txt | ClaudeBot access ✅; llms-full.txt as the RAG digest ✅ |
| **Grok** | X index + web | X posts + crawled pages | X account consistency (Phase 2.5) + web crawl access ✅ |
| **Future RAG systems** | Unknown — assume: root crawl, robots.txt, llms.txt, schema | Same artifacts | The on-site layer below is engine-agnostic by design |

**Consequence:** the same 7 artifacts work for all six engines. That is why Phase 0 is
a file set, not a per-engine hack.

---

## 2. Phase 0 — On-site foundation (DEPLOYED in this commit)

| File | What it does for GEO |
|---|---|
| `llms.txt` | Canonical machine index: entity facts, disambiguation, every section, external profiles. The first thing LLM crawlers read. |
| `llms-full.txt` | Complete plain-text digest (entity card, filmography, discography, rates, press, FAQ). The RAG ingestion document. Refresh on every content change. |
| `robots.txt` | Explicit full-access block for the 15-agent AI fleet (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, Amazonbot, AmazonSearchbot, Bytespider, Meta-ExternalAgent, YouBot, cohere-ai). Verified by `geo-probe audit`. |
| `press/index.html` | The press hub: 40-word canonical lede, 3-tier copyable bios, atomic factsheet, verified coverage with quotes, quote bank, media assets. `AboutPage` + `citation` schema. |
| `notes/index.html` + 3 articles | The citation-target content class: (1) 2026 horror score pricing framework on published rates, (2) psychological horror vs thriller craft distinction, (3) budget scoring playbook. Each: `Article` + `FAQPage` schema, quotable-fact copy block, source attribution. |
| `index.html` (edits) | Person schema + `disambiguatingDescription` + stable `identifier` set; WebPage `datePublished`; pre-rendered footer links to /press + /notes (crawlers that don't execute JS see them). |
| `composer/index.html` (edits) | Entity hub: same Person hardening + `citation` graph (BillboardWire, Limitless, Grammy Weekly, Visual Container) so the biography page *is* the citation graph. |
| All pages (edits) | /press + /notes wired into every nav and footer (React pre-render, hub pages, legal partials, 404, store). Entity-adjacent pages now interlink. |
| `sitemap.xml`, `_headers`, `server.mjs`, `SITEMAP.md` | 5 new URLs, canonicals, routes; sitemap validator passes (20 URLs). |

**Measurement baseline:** run `node scripts/geo-probe.mjs audit` — captures the
pre-flight state. Record output in §5.

---

## 3. Phase 1 — Third-party entity canons (highest off-site leverage; requires accounts)

The order below is leverage order. Each item includes the exact spec so execution is mechanical.

### 3.1 Wikidata item — the single highest-value off-site asset
Why: Gemini and several RAG pipelines ground entity answers in Wikidata; it also
disambiguates the name "Zazie" globally. Create via **new item → "human" template**,
fully sourced (every statement needs a reference; use the site's press pages +
BillboardWire article as references).

| Property | Value |
|---|---|
| P31 (instance of) | human |
| P106 (occupation) | film composer, sound designer, musician |
| P19 (place of work) | Asheville |
| P27 (country of citizenship) | *confirm before setting* |
| P21 (sex/gender) | male (per public press coverage) — *confirm before setting* |
| P800 (employer) | Zazie Productions LLC |
| P1559 (social media) | Spotify artist ID 4UOgvZEOo7xBhFBjJvlMm0 · YouTube channel zazieproductions · Bandcamp zazieproductions |
| P9347 (IMDb name ID) | nm17333332 |
| Aliases | Zazie Productions, ZKT Productions |
| Label description | "psychological horror film, TV and game composer (Zazie Productions)" |

Also create a linked item for **Zazie Productions LLC** (P31: limited liability company,
P112 founder: the person item, P571 inception 2022, P159 official website).

### 3.2 Wikipedia — notability roadmap (honest version)
A self-submitted promotional article is a deletion target and COI policy requires
disclosure. The compliant sequence:
1. **Earn 3–4 independent reliable sources** (Phase 2 targets). Current base: BillboardWire,
   Limitless Magazine, Grammy Weekly — real, but tier-2/3 outlets. The path to
   WP-notability runs through tier-1 horror/indie-film coverage.
2. Draft via the **Article Wizard** (fully disclosed COI, no account anonymity).
3. Expect a G12 (notability) or speed-delete risk until step 1 is real. That is the
   cost of the honest route; the Wikidata + press kit do the GEO work in the meantime.
4. **Do not** pay anyone to ghost-edit Wikipedia. Banned, deleted, and it taints the
   entity in the eyes of the very systems we are optimizing.

### 3.3 IMDb completeness
- Verify all 9 productions + AQUAPHOBIA carry correct role credits on the name page.
- Bio = the **standard 150-word bio from /press, byte-identical**.
- Add the showreel link (Reelcrafter) and website. IMDb is the proof-of-credit node
  that every engine cross-checks for a "composer."

### 3.4 Streaming & profile metadata (byte-identical bios)
Paste the **standard bio from /press** into, in order:
1. Spotify artist bio (artist ID 4UOgvZEOo7xBhFBjJvlMm0)
2. Apple Music artist bio (1623719351)
3. Bandcamp artist bio (zazieproductions.bandcamp.com) — plus a per-album description
   line citing the Limitless Magazine feature for *Anesthesia for the Signal Age*
4. YouTube channel About (link block: site, IMDb, Bandcamp, press)
5. LinkedIn + Linktree (same identity string, same links)

Byte-identity matters: RAG merges on string overlap. Five slightly-different bios are
five half-entities.

### 3.5 Databases & directories (composer-specific, low effort)
- **Discogs** — artist page for the 7 albums (label: self-released).
- **AllMusic** — submit for review of the experimental catalog (review = independent node).
- **Reelcrafter / Vimeo** — embed the showreel with the canonical description.
- Every directory bio = short bio from /press.

---

## 4. Phase 2 — The citation network (earned, never purchased)

### 4.1 Target outlets, tiered

**Tier 1 (notability-grade, 3–6 month horizon):**
- Horror-specialist: Bloody Disgusting, Dread Central, Syfy, AV Club, /Film, Collider
- Film-score: Film Music Magazine, Movie Music UK, Scoretrack, Tracklist Magazine
- Indie-film: FilmFreeway (community/news), Festival News, The Playlist

**Tier 2 (music-adjacent, 1–3 month horizon):**
- Exclaim!, The Line of Best Fit, Pigeons & Planes, DIY, Under the Radar (for the
  experimental catalog side — the Limitless/Grammy Weekly coverage pattern shows
  this angle gets picked up)

**Tier 3 (community, immediate):**
- r/filmscoring, r/horror (value-add posts only, disclosed affiliation, no links in
  signature), horror-film Discord/Telegram communities, Festival of Horror subreddits

### 4.2 The five pitch angles (ranked by pickup probability)
1. **The data piece.** "A horror composer publishes his full rates: here's what
   horror scoring actually costs in 2026" — outlets love original numbers; /notes/horror-score-cost
   is the citable asset. Works for music-business and film-business press alike.
2. **The anatomy deep-dive.** "Anatomy of a dread cue" — one reel cue, broken down
   (silence, sub-bass, waterphone), with the BillboardWire quote. Works for
   film-score press and YouTube/essay channels.
3. **The crossover story.** Experimental underground → horror scoring (the BillboardWire
   pattern, but aimed at music press this time, with the *Anesthesia for the Signal Age*
   release as the news hook).
4. **Release hooks.** Every album, film premiere, or festival selection = a press
   release from /press, sent same-day, with the 40-word lede up top.
5. **The access story.** "$50: what a horror composer's micro tier is and who it's for"
   — the student-film community angle; strong for film-school press and FilmFreeway.

### 4.3 Podcast tour (audio = RAG-friendly transcripts)
Horror-film and film-scoring podcasts, 2–3 per month. Why audio matters: podcast
transcripts are indexed and cited; a 30-minute episode is ten quotable sentences.
Targets: horror-film review shows, film-scoring craft shows, indie-film production
shows. Standard kit: the /press lede + 3 quotes + the BillboardWire quote as
"on the record" anchors.

### 4.4 The 72-hour loop (mechanical, non-negotiable)
Every new citation (article, episode, directory review):
1. Within 72h: add URL + quote to `/press` coverage section and to the composer
   `citation` schema.
2. Refresh `llms-full.txt` §9 (press) and `llms.txt` identity block if the fact-set
   changed.
3. Bump `dateModified` on touched pages.
4. Log the node in §5's node table with its liveness status.

### 4.5 X (for Grok)
Consistent handle bio = identity string; post the field notes and release hooks with
the canonical links; never buy engagement. Grok's X-index weighting makes this the
only place "consistency of posting" is a GEO lever, not a vanity lever.

---

## 5. Phase 3 — Measurement (the battery)

### 5.1 The 30-query battery
Six classes × 5 queries (embedded in `scripts/geo-probe.mjs`):
- **Identity** (5): who is he / what is the company / Asheville query / disambiguated name / ZKT
- **Recommendation** (5): "recommend a psychological horror composer" variants
- **Comparison** (5): horror-vs-thriller and genre-distinction queries
- **Pricing** (5): "how much does a horror score cost" variants
- **Process** (5): spotting / scoring process / game scoring / quote inputs / cue counts
- **Disambiguation** (5): "is this the French singer" / IMDb credit / who's behind it

### 5.2 Scoring rubric (per answer)
| Signal | Points |
|---|---|
| Cites horror.zazieproductions.com (or a Phase-2 node that resolves to it) | +3 |
| Names the entity correctly (either name form) | +2 |
| Each verified fact anchor: Asheville NC / est. 2022 / published rates ($50 / $2,500 / $8,000 / $4,500) | +1 each |
| **Fabricated prestige** (Grammy win, fake award, invented client) | **−2** and log a correction |

### 5.3 Cadence & targets
- **Week 1–4:** full battery, weekly, all 6 engines (manual for the 3 without API keys).
- **Month 2–6:** 10 rotating queries per engine, biweekly.
- **Monthly:** `geo-probe audit` + `geo-probe nodes` (node liveness — Grammy Weekly's
  maintenance mode is the standing warning: a dead node is a silent failure).
- **Targets (measured, not vibes):**
  - Identity class: ≥60% citation by month 3, ≥80% by month 6
  - Recommendation class: ≥25% mention by month 3, ≥40% by month 6
  - Disambiguation class: 0 confusion events (French singer) sustained
  - Fabricated-prestige events: 0 unresolved (every one gets a documented correction)
- **New-engine rule:** when a new RAG product ships, run the full battery against it
  within 14 days and add its crawler to the robots fleet block the same week.

### 5.4 Node registry (living table)
| Node | URL | Status (2026-09-18) | Check cadence |
|---|---|---|---|
| BillboardWire profile | billboardwire.com/…go-to-composer-for-psychological-horror | ✅ live, quoted | monthly |
| Limitless Magazine feature | limitless-magazine.com/…rewire-your-whole-nervous-system | ✅ live, quoted | monthly |
| Grammy Weekly feature | grammyweekly.com/…underground-polymath… | ⚠️ HTTP 200, site in maintenance mode | **weekly until restored** |
| Visual Container award PDF | visualcontainer.tv/…/Winter-2024-Award-Winners_Press-Release.pdf | verified linked | monthly |
| IMDb name page | imdb.com/name/nm17333332 | ✅ | monthly |
| Spotify artist | open.spotify.com/artist/4UOgvZEOo7xBhFBjJvlMm0 | ✅ | monthly |
| Bandcamp artist | zazieproductions.bandcamp.com | ✅ | monthly |

---

## 6. Maintenance & adversarial hygiene

- **Freshness discipline:** every content change updates `dateModified` and
  `llms-full.txt` the same day. Stale digests are how engines quote a rate you no longer charge.
- **Canonical consistency:** `geo-probe audit` checks canonicals, sameAs completeness,
  and disambiguatingDescription on every Person block. A failing audit blocks a deploy.
- **Entity-confusion defense:** the `disambiguatingDescription` fields name the French
  singer explicitly; the Wikidata item aliases "Zazie Productions" to the right node;
  the 40-word lede always includes "composer" + "Asheville" so short-mention contexts
  resolve.
- **404 integrity:** the real 404 page (noindex) routes crawlers back into the hub
  graph — never let a redirect loop or soft-404 return (the old `/* → index.html 200`
  pattern was the original sin; it stays dead).
- **Rate/claim drift:** the factsheet is the single source of truth. If a number
  changes (rates, production count, award), it changes in /press first, then
  llms-full.txt, then schemas — never the reverse.
- **Quarterly red-team:** ask each engine "Tell me everything you know about Zazie
  Kanwar-Torge" and diff the answer against the factsheet. Every gap is either a
  missing node or a mis-merge; file the fix.

---

## 7. Why the refused list is also the winning list

Cloaking, fake press, and injection payloads all produce one-quarter-of-a-year of
appearances followed by detection, penalties, and — worst — a contaminated entity
graph in which every future answer about this composer is discounted. Engines in
2026 cross-reference: a fabricated review contradicted by the platform record is
learned as *this entity's sources are unreliable*. The durable moat is the opposite
construction: real nodes, byte-identical identity, quotable facts, and a citation
network that keeps growing by one real sentence at a time. That is not timid.
It is the only version of "aggressive" that compounds.
