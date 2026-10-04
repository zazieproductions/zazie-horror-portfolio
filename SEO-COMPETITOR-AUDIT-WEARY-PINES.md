# Competitor SEO Audit — wearypines.com/hire-a-composer/
### Forensic audit → original strategy → implementation for `horror.zazieproductions.com`
**Audit date:** 2026-10-04 · **Auditor:** Arena agent session on branch `arena/01a10796-zazie-horror-portfolio`
**Subject site:** https://horror.zazieproductions.com (Zazie Productions LLC — Zazie Kanwar-Torge)
**Competitor page:** https://wearypines.com/hire-a-composer/ (Weary Pines — Jamie Chambers + Don McLennan Jr)

## How this audit was produced (evidence discipline)

| Method | Tool used in this session | What it can and cannot prove |
|---|---|---|
| Competitor page content + heading structure | Live page fetch (rendered markdown) | Proves visible copy, H-tags, CTA shape, FAQ text. Does **not** prove head-tag byte order or JS behaviour. |
| Competitor head/entity metadata | Public meta-extraction API (title, description, OG image, publisher, HTTP headers, `last-modified`) | Proves title, meta description, OG image, server stack, cache headers. |
| Competitor site architecture | `robots.txt`, `sitemap_index.xml`, `page-sitemap.xml`, `post-sitemap.xml` | Proves every published URL they have (Yoast sitemaps). This is the strongest single evidence source in the audit. |
| Competitor off-site authority | Public web search for brand/entity | Proves IMDb entity + Bandcamp catalogue exist. **Does not** prove referring-domain counts, anchor distribution, or traffic — no Ahrefs/Semrush/Majestic/GSC access existed in this session. |
| My-site technical state | Repository inspection + live HTTP header/metadata sampling | Proves repo state and live state — and the drift between them. |
| My-site search demand data | **Not available.** No Google Search Console or GA4 access in this session. | Everything about *my* queries/impressions/CTR is therefore an inference from SERP sampling, not measured data. Section 2 flags this explicitly. |
| SERP sampling | Web search across the 30+ query families in §3 | Proves the *shape* of the competition (marketplaces vs. individuals vs. guides) and recurring SERP features. It is not a Google SERP snapshot from a fixed geography, and no rank numbers are claimed. |

**No claim below is made about backlink counts, domain authority scores, or traffic volumes**, because no tool in this session could measure them. Where a number is inferred, it is labelled *inferred*.

---

# 1. Executive summary

## 1.1 The ten findings that matter

1. **Your site and your deployed site are not the same site.** The repository at `HEAD` (commit `7207c89`, 2026-10-04) is newer than production: live `/sitemap` returns **HTTP 404**; live `robots.txt` and `sitemap.xml` are the 2026-09-18 revision; live social metadata still advertises a **29-cue** showreel while the repo ships 30 (the search/meta APIs return `og:title` where they report a title, so treat title-drift claims carefully — the `/sitemap` 404 and the 29/30 discrepancy are the decisive, unambiguous evidence). Every "we already fixed that" item in `SEO-DOSSIER.md`/`SITEMAP.md` that was written after 2026-09-18 **is not on the web yet**. (Confidence: high — verified from live responses vs. repo files.)
2. **Weary Pines' ranking power is not on the page — it is the entity plus the cluster.** Their money page is ~800 words, has a plain title (`Hire a Horror Composer — Weary Pines`, 36 chars), a two-sentence meta, two `mailto:` CTAs, and **has never been captured by the Wayback Machine** (verified: "has not archived that URL"), which means the page itself carries no historical link equity. What it does carry is a **33-URL Yoast sitemap** with 7 format spokes, 7 pre-cleared collections, 5 licence-tier pages, 6 news posts and 4 lead-magnet/funnel pages — wired to an **IMDb composer entity with real documentary credits** (`nm11043376`: *In Search of Darkness* I–III, *In Search of Tomorrow*, *Treatment*, *Dinah*) and a **Bandcamp label catalogue**. (Confidence: high.)
3. **The exact-match money page wins a thin SERP, and thin SERPs are winnable.** Sampling "hire a horror composer" returned marketplaces and forum threads (itch.io, SoundBetter, Fiverr, Upwork, Guru, AirGigs, Twine, studentfilms.com, Reddit) and *no* independent composer service page. A page whose title, H1, first sentence and FAQ all say the phrase plainly has almost nothing to outrank except aggregators. (Confidence: medium-high — SERP sampling, not a Google snapshot.)
4. **But head terms are not where a lead becomes a commission.** Every generic "hire a film composer"-class SERP is dominated by marketplaces with faceted city/genre pages and by cost guides. The realistic wins are **mid-tail, format-specific and price-specific queries** — which is exactly the structure Weary Pines built and you did not. (Confidence: high.)
5. **Your site has no commercial pillar.** `/contact`'s H1 is *"Hire a horror composer: tell me about your project"* — a 725-word contact page is carrying your head commercial keyword. `/services` is a rates page titled around rates. There is **no page whose job is to say who you help, what you deliver, what format they are buying, and what happens next.** (Confidence: high — repo inspection.)
6. **You have no format spokes at all.** Weary Pines ships `/license-horror-music/scoring-a-feature-film/`, `/scoring-a-documentary/`, `/scoring-a-podcast/`, `/building-a-game/`, `/horror-sfx/`, `/horror-social-content/`, `/royalty-free-horror-music/`. You have zero equivalents for *short film, documentary, game, trailer, installation, sound design* — all of which your own `/services` page already claims to sell. (Confidence: high.)
7. **Your proof is stacked on one URL and cannot be cited.** Nine productions, 30 cues, 7 film samples and a 5.0 rating all live on `/` and `/work`; none of them has an addressable case-study page with credits, deliverables, or `CreativeWork` schema a director can link to or a crawler can parse as a distinct entity. (Confidence: high.)
8. **Two technical risks are live right now.** (a) The global `X-Robots-Tag: index, follow, …` header in `_headers` is inherited by **`404.html`** — verified on the live 404 response — fighting the page's own `noindex` meta. (b) `VideoObject.contentUrl` on the home page still points at **YouTube watch pages** (HTML, not media), the same defect `SITEMAP.md §5` already fixed in the XML sitemap. (Confidence: high.)
9. **Structured data is over-built in one place and under-built in another.** The home page carries 14 JSON-LD blocks and 25 `@type`s — including `AggregateRating` + four `Review` objects whose authors are *anonymous roles* ("Independent Director", "Music Supervisor", "Student Filmmaker") attached to your own `Organization`. That is **self-serving review markup with unattributable authors**: ineligible for review snippets and a structured-data-spam liability. Meanwhile the new commercial pages need `Service`/`Offer`/case-study markup that does not exist. (Confidence: high on the markup; policy risk is a judgement call — see §7.4 and §8.5.)
10. **There is no measurement at all.** "No cookies, no analytics" is a defensible artistic stance, but it means you cannot see queries, CTR, or which click became an inquiry — so every dollar of SEO effort is unverifiable. A cookieless, consent-free analytics setup + GSC verification + an inquiry-event is the single highest-leverage change in this document that costs nothing ethically. (Confidence: high.)

## 1.2 What is most likely helping the competitor

- **Third-party entity verification** (IMDb composer page, Bandcamp label with real score releases, awards news post) → satisfies E-E-A-T and gives Google an entity to reconcile the site against.
- **Search-intent-mapped URL architecture**: a hub for custom scoring (`/hire-a-composer/`) plus an entirely separate hub for *pre-cleared licensing* (`/license-horror-music/`) with a spoke for every way a buyer might describe their own project — feature, documentary, podcast, game, social content, SFX. Each spoke answers "can you do **my** thing?" before the buyer has to email.
- **A second, low-friction revenue path** (The Vault, per-track licence, free sampler, licence checker) that converts visitors who are *not* ready for a commission — and gives every intro page a reason to exist in the index.
- **Exact-phrase commercial targeting in title/H1/first sentence** with zero ambiguity about what is being sold.
- **Speed/stack familiarity**: LiteSpeed + page cache, WP+Yoast basics, image `webp`, one video background — nothing exotic, nothing blocking.
- **Genre ownership language** ("horror fans first", "80s horror and synthwave", analogue + orchestration) that makes them *specific* in a category where most competitor copy is interchangeable ("passionate composer for your project").

## 1.3 What will create the biggest gains for you

In order of expected effect:

1. **Deploy the repository.** Nothing else in this document matters until production matches `HEAD`. (Day 1.)
2. **Build the commercial pillar** — `/hire-a-composer` — as the page that owns *hire a composer / composer for hire / hire a horror composer* and routes qualified buyers into your existing `/contact` inquiry flow. Implemented in this session (§6, files listed in §9).
3. **Build the format spokes** that your own services page already promises: `/sound-design`, `/game-scoring` (implemented this session), then short film, documentary, trailer/installation (blueprinted in §5).
4. **Turn `/services` into the price authority** and let it own the *what does a horror score cost* question, which currently belongs to Twine/Tunereel/Chron articles — you have real published numbers ($75.99 floor, sliding scale by funding), which they do not.
5. **Give every production an addressable case study** (`/work/<film>`) with credits, deliverables and `CreativeWork`/`VideoObject` markup — the raw material available for backlinks and for "composer for [project type]" answers.
6. **Fix the two live technical risks and the metadata truncation**, then verify with the repo's own validator (`node tools/check-sitemap.mjs`).
7. **Verify and either substantiate or remove** the anonymous review markup and the "Grammy Weekly / Billboard Wire" style press claims — these are the kind of thing that turns an E-E-A-T win into a trust loss under scrutiny (§7.4, §10 flags).
8. **Install cookieless analytics + Search Console**, then let 60–90 days of real query data replace inference.

---
# 2. Evidence table

Confidence scale: **High** = directly observed (live response, sitemap, repo file). **Medium** = observed once / single tool / could differ by geography. **Low** = inference from adjacent evidence. `—` = not available in this session.

| # | Finding | Competitor evidence (Weary Pines) | My-site evidence (Zazie Productions) | SERP evidence | Confidence | Recommended action |
|---|---|---|---|---|---|---|
| 1 | Deployment drift between repo and production | — | Live `/sitemap` → **404**; live `sitemap.xml` `lastmod` 2026-09-18; live title/meta reference **29** cues; repo HEAD references **30** cues and ships `/sitemap` | — | High | Merge/deploy `HEAD`, then re-request indexing for `/`, `/sitemap`, the six hubs |
| 2 | Money-page targeting of the head phrase | Title `Hire a Horror Composer — Weary Pines` (36 ch); H1 `HIRE A HORROR COMPOSER`; first sentence repeats "hire a horror composer"; bolded "find a horror composer", "80s horror composer", "horror music composer" | No page targets "hire a composer"; `/contact` H1 carries the phrase on a 725-word contact page; `/services` leads with rates | "hire a horror composer" SERP = itch.io, SoundBetter, Fiverr, Upwork, Guru, AirGigs, Twine + forum threads; no independent service page in the sampled set | High | Create `/hire-a-composer` pillar (built in this session); retarget `/contact` H1/title away from "hire" |
| 3 | Format-spoke architecture | 7 spokes under `/license-horror-music/` (feature, documentary, podcast, game, social content, SFX, royalty-free) + 7 collection pages + 5 licence-tier pages + 2 inquiry pages | Zero format spokes. Formats appear only as card rows inside `/services` and `/work` | Format queries ("composer for short film", "composer for documentary") return marketplaces + guides, not single-composer pages | High | Add `/sound-design`, `/game-scoring` now; blueprint short-film / documentary / trailer / installation spokes (§5) |
| 4 | Second revenue path for the not-ready buyer | The Vault (pre-cleared per-track), free sampler, free pack, licence checker, radio page, `isod-score` | `/store` (24 items via Bandcamp/itch/Gumroad/eBay) + `/licensing` (14 sections) exist but are **not** framed as "can't afford a custom score? do this" | "royalty free horror music" family is heavily marketplacised; "license horror music for film" is softer | High | Add a licensing-fallback block + internal link on the pillar and spokes → `/store`, `/licensing` |
| 5 | Off-site entity verification | IMDb `nm11043376` (composer; *In Search of Darkness* I–III, *In Search of Tomorrow*, *Treatment*, *Dinah*), Bandcamp label with score albums, awards news post | IMDb `nm17333332` + Spotify + Apple + Bandcamp + YouTube + LinkedIn + Linktree in `sameAs`; third-party Stage 32 profile found listing *Mike Has a Visitor*, *Phantom Requiem*, *Beyond The Silken Threads*, *Deaf Orphans of Streamcast* | Brand search "Weary Pines horror composer" surfaces IMDb + Bandcamp first; brand search for your name surfaces Stage 32 + your GitHub PRs, **not** your site | High | Off-page plan §11: make every credit claimable and linkable (IMDb bio link, Stage 32 refresh, festival/production pages, Discogs/MUBI where truthful) |
| 6 | Content freshness cluster | 6 posts in `/news/` including *Hiring a Horror Composer*, *Where to License Horror Music*, *Royalty-Free 80s Horror Music for Content Creators* | No editorial layer at all (README lists `/blog` as a "consider") | Cost/how-to queries are owned by third-party blogs (Twine, Tunereel, ClickUp, johnwiater.com) | High | Launch `/journal` with 6 briefs (§6.6); each must answer a real pre-hire question and link to a money page |
| 7 | Title/meta length discipline | Title 36 ch, meta 105 ch — both fully renderable | `/` title ≈ 111–113 ch (truncated in SERPs); meta description ≈ 300 ch (Google will rewrite); `og:description` same | Truncation loses the trailing value proposition in exactly the SERP where you are unknown | High | Shorten home title to ≤ 60 ch and meta to ≤ 155 ch, front-loading "horror composer" + the differentiator |
| 8 | H1 keyword presence | H1 = the exact money phrase | Home H1 = "Dark, atmospheric scores written to your picture." — no genre, no discipline | H1 is a relevance signal and the first thing an AI answer engine quotes | High | Home H1 → "Dark, atmospheric **horror** scores, written to your picture." (both DOM copies) |
| 9 | 404 inherits an indexable robots header | n/a (WP 404 returns 404 with no X-Robots-Tag) | Live 404 response headers include `X-Robots-Tag: index, follow, max-image-preview:large…` (from `/*` in `_headers`) while `404.html` carries meta `noindex` | — | High | Add an explicit `X-Robots-Tag: noindex` block for `/404.html` in `_headers` (§7) |
| 10 | Video schema points at HTML pages | Their videos are poster cards + external links, no `VideoObject` on the money page | Home page `VideoObject.contentUrl` = `youtube.com/watch?v=…` for 4 videos; `SITEMAP.md §5` already removed `video:content_loc` for the same reason | Google requires `contentUrl` to be a raw media file; `watch?v=` is HTML | High | Remove `contentUrl` (keep `embedUrl`) or point it at a real media file |
| 11 | Review markup risk | No review schema observed in the rendered page | `Organization` carries `aggregateRating` (5.0 / 4) and four `Review` objects with authors that are **roles, not people/entities**, on the business's own domain | Google: self-serving reviews about the business are not eligible for review snippets | High (markup) / Medium (policy outcome) | Decide: either attribute the reviews to permissioned, named authors with `author.url`, or drop `review`/`aggregateRating` and keep the testimonials as visible content (§7.4) |
| 12 | Measurement / query data | — (their analytics unobservable) | No analytics, no GSC verification path visible in the repo; inquiry is `mailto:` so conversions are invisible | — | High | Cookieless pageview tool + GSC (both domain properties) + a `mailto:` click event; document in `/privacy` |
| 13 | Sitemap hygiene | Yoast index lists `/cart/`, `/checkout/`, `/my-account/`, `/shop/`, plus `author-` and `post_tag-` sitemaps — crawl-budget surface | Repo sitemap: 16 URLs, no parameters, no redirects, validated by `tools/check-sitemap.mjs` | — | High | Yours is cleaner — keep it that way when adding pages (validator enforces 22 checks) |
| 14 | Local intent | They are a UK duo; no location pages | Site claims Asheville, NC in `Organization`/footer/press context; no local page and no local citations beyond Stage 32 | "film composer Asheville" SERP = ProductionHUB directory + SoundBetter city page + Wikipedia's Asheville people list (includes a working local composer, Joel Goffin) | High | Do **not** build location pages. Get listed where the local SERP actually sources answers: ProductionHUB, SoundBetter city page, regional film-org directories (§11) |
| 15 | Case-study depth | Posters link to IMDb/external; no per-film case pages either (they win on IMDb instead) | 9 productions exist as cards only; no per-production URL | "[film title] score" style queries are navigational/entity, low commercial value but high credibility value | High | Add `/work/<slug>` case pages when the credit details are confirmed (§5, P1) |

---

# 3. Keyword and intent map

## 3.1 Known limitations on the data

- **No Search Console / GA4 access** in this session → no impressions, clicks, CTR, position, country, device or conversion data exists for your site. The "My-site evidence" column below cites *page state*, not performance.
- **No rank tracking**: no tool in this session returns Google positions from a fixed location. Every SERP statement is about *who is present and what kind of page they are*, not about a rank number.
- **Geography**: your audience is global (site sells worldwide, `areaServed: Worldwide`); the local layer was evaluated separately and is deliberately deprioritised.

## 3.2 Priority scoring formula (explainable, weighted, 0–100)

`Priority = 0.30·Buyer intent + 0.20·Fit/relevance + 0.20·Feasibility + 0.15·Revenue value + 0.10·Effort efficiency + 0.05·Strategic compounding`

- **Buyer intent (0–100)** — 95+ = someone with a project and a budget ("hire", "rates", "for my film"); 60–80 = "how do I / what does it cost"; ≤40 = curiosity/learning.
- **Fit/relevance (0–100)** — how truthfully *your* documented work (9 productions, 30 cues, claimed capabilities) answers it. Low fit = do not build.
- **Feasibility (0–100)** — inverse of competition: 80–95 = SERP has no purpose-built page (thin commercial mid-tail); 40–60 = marketplaces + guides present; ≤30 = marketplace-dominated with faceted pages.
- **Revenue value (0–100)** — likely order size and repeat/credit value of the lead it attracts (features/series > shorts > student).
- **Effort efficiency (0–100)** — 90 = reuse existing page/proof; 40 = new page + new assets; 20 = ongoing content programme.
- **Strategic compounding (0–100)** — pushes entity/topical authority or unlocks internal linking.

Assumptions worth stating plainly: this is a **head-weight to intent and feasibility**, because you are an independent artist competing with marketplaces; a mid-tail query you can rank #3 for converts better than a head term you rank #45 for.

## 3.3 The map

| # | Query cluster (representative queries) | Intent | Best target page | Difficulty / feasibility | Business value | Priority score | Recommendation |
|---|---|---|---|---|---|---|---|
| 1 | hire a composer · composer for hire · hire a **horror** composer · horror composer for hire | Transactional | **`/hire-a-composer`** (new pillar) | Hard head (marketplaces) / **feasible mid-tail** — no purpose-built independent page in sampled SERP | Very high | **74** | **Build now** (done this session). Target the exact phrases in title/H1/opening; let spokes carry the long tail |
| 2 | what does a film composer cost · horror film scoring rates · composer cost per minute · indie film score budget | Commercial investigation | **`/services`** (refresh to own the number) | Medium — third-party cost guides rank; nobody in the sampled set publishes a *sliding-scale, funding-linked* floor | High (filters tyre-kickers, raises close rate) | **78** | Refresh `/services` around "cost + what moves it", add `Offer`/`PriceSpecification` clarity, link from pillar and every spoke |
| 3 | composer for short film · short film score composer · score my short | Transactional | **`/composer-for-short-films`** (new spoke) | Medium-hard — SoundBetter/Guru pages dominate, but intent is explicit and your floor price fits | High volume, lower ticket (portfolio-building) | **71** | P1 spoke; needs a "how a short gets scored in 2–3 weeks" block + 3 short-film case studies |
| 4 | cinematic sound designer · sound designer for film · horror sound design · dread sound design | Transactional | **`/sound-design`** (new spoke) | Medium — agency/individual mix, few horror-specific pages | High (you already sell it; EXPIRE credit is sound design) | **70** | **Build now** (done this session) |
| 5 | composer for horror game · horror game music composer · adaptive horror music · Wwise/FMOD composer | Transactional | **`/game-scoring`** (new spoke) | Medium — itch.io threads + SoundBetter "game audio" dominate; low-credibility competition | Medium-high (games pay in milestones, repeat) | **66** | **Build now** (done this session) |
| 6 | license horror music · horror music for film · pre-cleared horror track · sync licensing horror | Transactional (lower ticket) | **`/licensing`** (refresh) + `/store` | Medium | Medium (fast cash, catalogue funnel) | **68** | Add "need it licensed, not scored?" path from pillar; expose per-item licence terms |
| 7 | composer for documentary · documentary score composer | Transactional | **`/composer-for-documentaries`** (P1 spoke) | Medium — Weary Pines already claims it; you claim "experimental documentaries" on `/services` | High (longer runtime, festival circuit) | **64** | P1 spoke after case-study material exists |
| 8 | experimental film composer · art film composer · installation sound artist | Transactional (niche) | **`/experimental-film-and-installation`** (P1, editorial-led) | Low competition, low volume | Medium-high fit, low direct revenue | **58** | P1 — this is your differentiation and an AI-answer magnet; write it as a curator/festival-facing page |
| 9 | trailer music composer · trailer cut adaptation · teaser score | Transactional | `/trailer-and-teaser-scoring` (P2) | Medium | Medium | **55** | P2 — only after trailer credits are confirmed |
| 10 | how to brief a composer · spotting session · what are stems · temp music | Informational (pre-hire) | **`/process`** (existing, strong) + `/journal` posts | Easy-Mid, high informational competition | Medium (captures pre-hire research) | **62** | Expand `/process`; launch `/journal` with the 6 briefs in §6.6 |
| 11 | horror composer showreel · dark ambient horror cues · horror score examples | Informational/portfolio | **`/reel`** (existing) | Easy for branded + niche descriptive queries | Medium (proves the work) | **64** | Add per-cue playlists/anchors already done; add "what each cue demonstrates" captions for AI/answer snippets |
| 12 | film composer Asheville · sound designer North Carolina | Local commercial | *No dedicated page* — citations only | Medium | Low-medium (local indie & regional arts work) | **41** | Directory/citation play only (§11.7). **Do not build doorway location pages** |
| 13 | zazie productions · zazie kanwar-torge composer | Navigational | `/` + `/composer` | Trivial | High (brand queries convert) | **80** | Ship the entity graph + get the name into third-party pages (§11) |
| 14 | royalty-free horror music / horror SFX library | Transactional (low ticket) | `/store` | Hard (library marketplaces) | Low-medium | **48** | Keep as catalogue support; do not build a competing library storefront |

---
# 4. Competitor microscope, live SERP intelligence, and gap analysis

## 4.1 Phase 1 — the competitor page, section by section

### A. Search intent and positioning
- **Primary target:** the exact phrase *hire a horror composer* (title, H1, opening sentence, FAQ Q1, "Ready to score your project?" close).
- **Secondary/semantic:** 80s horror composer, synthwave scoring studio, horror film composers, horror music composer, analogue synthesizers + live orchestration, horror documentaries, feature films, indie horror games, short horror films, sample cue, stems, revisions, pre-cleared library, license a track.
- **Audience:** indie genre producers — documentary producers, feature/short directors, indie horror game developers — who already know they want a *genre specialist* rather than a generalist.
- **Commercial questions answered on-page:** can you do my format (film/TV/docs/games)? do you only do 80s synth? how do we start? what if I can't afford a custom score?
- **Anxieties reduced:** "will I be locked in?" (sample cue before commitment), "will you get the genre?" (fans-first framing), "will delivery fit my edit?" (stems and formats), "what if I'm too small?" (sliding-scale-free route: licence a track).
- **Proof:** named humans, a named franchise (*In Search of Darkness*), five poster cards with format labels and two awards/notability stamps ("FAN FAVE", "AWARD WINNER"), and an outbound "See All Credits →".
- **Path to inquiry:** `mailto:` ×2 + a `#work` anchor button. **No form** — a real conversion weakness for agency/supervisor buyers who work from a laptop and dislike client mail handoff.

### B. On-page SEO (observed)
- URL `/hire-a-composer/` — exact-match slug, single trailing-slash form.
- Title `Hire a Horror Composer — Weary Pines` (36 ch, front-loaded, brand suffix).
- Meta `An 80s horror and synthwave composer duo, writing original scores for film, TV, documentaries and games.` (105 ch — renders in full, states format coverage).
- H1 `HIRE A HORROR COMPOSER`. Section eyebrows (`SCORING FOR HORROR PROJECTS`, `WHY WEARY PINES`, `HOW IT WORKS`, `SELECTED WORK`, `QUESTIONS`) + H2s (`AN 80S HORROR COMPOSER DUO`, `FROM BRIEF TO FINAL MIX`, `PROJECTS WE'VE SCORED`, `FAQ`, `READY TO SCORE YOUR PROJECT?`) + numbered H4 process steps.
- ~800 words of body copy — **thin for a head term**, deliberate: it is a router, not an essay, and the depth sits on the spokes.
- **No FAQ schema expectation:** Google has restricted FAQ rich results since 2023 (effectively government/health sites). Their FAQ exists to answer objections and to feed AI answers/People-Also-Ask, not to win a rich result. Treat FAQ as conversion copy, not as a rich-result tactic.
- Alt text: descriptive but generic (`In Search of Darkness poster`). OG image: 1408×768 JPG, 260 kB — acceptable, not optimised for social crop.

### C. Technical SEO (observed)
- HTTP 200, `content-type: text/html; charset=UTF-8`, LiteSpeed, `wpo-cache-status: cached`, gzip, `last-modified` 2026-08-26 on the page URL (modified again 2026-09-26 per the page sitemap `lastmod`).
- CMS: WordPress + Yoast (sitemaps, robots block) + WooCommerce (shop/terms/collections) — a plugin stack, not bespoke.
- `robots.txt`: standard WooCommerce exclusions, `Sitemap: sitemap_index.xml`.
- **Sitemap hygiene issue (theirs):** the page sitemap lists `/cart/`, `/checkout/`, `/my-account/`, `/shop/` and the index adds `author-`, `post_tag-` and `category-` sitemaps — thin/duplicative surface for a small site.
- **Not in the Wayback Machine** (verified live: "has not archived that URL") → the page has no archived history, no historical inbound link equity to inherit; it ranks on domain + entity + exact match.
- Page weight: one hero video (`farm-bg.webm`) + poster JPGs; no evidence of a heavy JS framework on this page.
- I could **not** measure their Core Web Vitals (no CrUX/PSI access in this session — the public PageSpeed API returned `RESOURCE_EXHAUSTED`). No CWV claim is made for either site.

### D. Structured data (observed limits)
- Rendered content shows no visible review widget; **no `Review`/`AggregateRating` markup is claimed here** because I could not read their raw head. What is safe to infer: Yoast emits a standard `@graph` (Organization/WebSite/WebPage/BreadcrumbList) on WordPress sites, plus WooCommerce product markup on shop pages. I am **not** asserting their exact schema.
- What is *strategically* safer for you (and implementable today) is in §8: `Service` + `Offer` (you have real published floors), `Person`/`Organization` graph (already strong), `CreativeWork`/`Movie` per production, `VideoObject` fixed, `BreadcrumbList` per page. `FAQPage` = keep only where the Q&A is genuinely the page's content; expect no rich result.

### E. Authority and off-page signals (what was actually verifiable)
- **IMDb** composer entity `nm11043376` with credits across the *In Search of Darkness* franchise, *In Search of Tomorrow*, *Treatment* (2022), *Dinah* (2019) — third-party, crawlable, credible.
- **Bandcamp** label (UK) with score albums → direct-to-fan revenue + entity reconciliation.
- **Awards/press**: their own `/news/treatment-score-wins-best-music-award/` post.
- Not verifiable in this session and therefore **not claimed**: referring domains, anchor text distribution, branded search volume, social citations, directory listings.

### F. Ways their approach is strategically wrong for you (do not copy)
1. **Duo positioning.** Their "two horror film composers" framing is their moat *and* your trap: you are a single author with an experimental practice. Competing on "we're the 80s duo" is inauthentic and unwinnable.
2. **80s/synthwave genre lock.** It narrows their top-of-funnel to retro-horror buyers. Your genuine differentiator is *psychoacoustic, experimental, art-film-adjacent* work — broader taste, narrower competition.
3. **Mailto-only conversion.** A pillar page with no structured form loses the exact buyers (supervisors, producers, agencies) who brief by pasting a deck.
4. **Thin money page + heavy plugin stack.** You have a static, faster, schema-richer substrate. Use it.
5. **Licence library lock-in.** Their Vault is 80s-centred. Your `/store` + `/licensing` can be positioned as *experimental and horror-adjacent* instead, which is a different shelf.

## 4.2 Phase 2 — SERP intelligence by family (sampled, not rank-tracked)

| Family | What the sampled SERP is made of | Feature notes | Winnable for an independent? | Right page type |
|---|---|---|---|---|
| hire a composer / hire a horror composer | Freelance marketplaces (SoundBetter, Fiverr, Upwork, Guru, AirGigs, Twine), forum/classified threads (itch.io, studentfilms.com, Reddit), occasional real composer page | Marketplace carousels, profile cards, review stars | **Partly** — head term no; the *specific* phrasing + genre + format variants yes. No purpose-built independent page appeared in the sample | Pillar service page |
| hire a film composer / film composer for hire | Marketplaces + how-to-hire guides (ClickUp, Twine, johnwiater.com) | "How to hire" guides, PAA blocks, marketplace pages with structured pricing | **Mid-tail only** | Pillar + format spokes |
| cinematic sound designer / sound designer for hire | Marketplaces (AirGigs, SoundBetter), audio-post shops, a few individual pages | Pricing cards, "top N designers" listicles | **Yes for genre-qualified phrasing** (horror / film / dread sound design) | Spoke service page |
| composer for short film | Marketplaces, student-film forums, guides | Forum threads rank surprisingly high | **Yes** — explicit intent + your $75.99 floor matches the segment | Spoke + case studies |
| horror game composer / adaptive music | itch.io "for hire" threads, SoundBetter game-audio pages, indie dev job posts | Forum threads, dev-community pages | **Yes** | Spoke + engine/deliverable specifics |
| what a film composer costs | Third-party explainers quoting $250–$2,500 per finished minute, $1k–$50k indie ranges, BLS salary data | Tables, PAA, related searches | **Yes, with a difference:** publish your *sliding scale tied to funding* + what moves the number — nobody in the sample does | Refreshed `/services` + journal post |
| license / royalty-free horror music | Library marketplaces (big), Bandcamp, YouTube channels | Product/price cards | Hard; treat as a fallback path, not a growth channel | `/licensing` + `/store` |
| experimental film composer / installation / art film | Journals, galleries, festival pages, artist sites, sound-art organisations | Image-heavy editorial | **Yes** — low volume, high fit, strong for AI answers and citations | Editorial-facing spoke |
| horror composer showreel / dark ambient cues | YouTube, Bandcamp, Spotify, artist sites | Video/audio results | **Yes for descriptive long-tail** | `/reel` + per-cue context |
| film composer Asheville | Directories (ProductionHUB), marketplace city pages (SoundBetter Asheville), Wikipedia people list | Map-independent; no local pack in the sample | **Via citations, not pages** | Directories + regional org listings |

**Search-feature reality check for you:** no map pack appeared for any sampled composer query; AI Overviews and PAA blocks are the features that matter, which rewards **specific, answerable, well-structured text** (deliverables, timelines, price logic, formats) — the opposite of keyword-stuffed service pages.

## 4.3 Phase 3 — gap analysis

### Keyword and topic gaps
- No page targets *hire/composer for hire* phrasing → head commercial intent is served by a contact page.
- No page targets the *cost* question with your own published scale.
- No page targets *sound design* as a purchasable service, despite the claim appearing in `/services` and an EXPIRE sound-design credit in your own sitemap image caption.
- No page targets *games* despite tier 04 and a FAQ section on it.
- No *short film / documentary / trailer / installation* pages despite `/services` naming those formats.
- No editorial layer to capture pre-hire research, and no entity-bearing case studies.

### Proof and E-E-A-T gaps
- Nine productions have no addressable pages; credits, runtime, deliverables and rights story are unstated per film.
- The 5.0 rating and four reviews are anonymous roles (see §7.4 policy note).
- Press claims need verification: `grammyweekly.com`, `billboardwire.com`, `limitless-magazine.com` are **not** the Grammy/Billboard mastheads (they are separate domains) — treat them as coverage of unclear editorial weight until verified, and do not let them carry your E-E-A-T alone. The Visual Container Winter 2024 award press release appears to be a genuine third-party PDF. **[VERIFY]**
- A personal Gmail address in `Organization.contactPoint.email` and a personal phone number in structured data: the phone number is unnecessary exposure; the Gmail weakens a studio-grade impression. **[VERIFY]** (recommend `z@zazieproductions.com` alias or studio address, and drop `telephone` from public JSON-LD).

### Internal linking gaps
- `/work`, `/reel`, `/composer`, `/process`, `/services`, `/contact` are linked from the home footer only (Archive + Documents rows) — the *body* of the home page links none of them.
- The 30 cues on `/reel` are not grouped into the moods buyers actually ask for as crawlable sections with captions.
- No link path from a film card to a page that explains how that film was scored (because that page does not exist).

### Technical blockers (all verified — remediation in §7)
1. Production is behind `HEAD` (§2 #1).
2. `404.html` inherits `X-Robots-Tag: index, follow` from `/*`.
3. `VideoObject.contentUrl` = YouTube watch URLs.
4. Home `<title>` 111–113 chars, meta ~300 chars → truncation in the one SERP where you are unknown.
5. Home H1 has no genre/discipline keyword.
6. No analytics/GSC → no learning loop.
7. Bundle/prerender dual-DOM means every link change costs a bundle rehash (a process risk, not a bug — the validator catches drift).

### Conversion friction
- `/contact` builds a `mailto:` handoff: excellent for privacy, but it (a) depends on the visitor's mail client, (b) hides the brief structure from buyers who prefer pasting into a form, (c) yields no measurable conversion event.
- No budget-qualification field on the pillar; no "what happens next / response time" statement next to the CTA (the home page promises 48 hours — keep that promise visible on the pillar).
- No licensing fallback CTA for the under-funded visitor on `/contact` or the new pillar.

### Cannibalization risks to manage
- `/contact` (currently "Hire a horror composer…") vs new `/hire-a-composer` → **retarget `/contact` to the inquiry/quote intent** (implemented).
- `/services` (rates) vs `/hire-a-composer` (hire) → keep pricing *linked* from the pillar, not restated in full.
- `/faq` (36 Qs) vs pillar FAQ (6 Qs) → pillar answers *hire-specific* questions only; deep fee/rights answers stay on `/faq` with exact anchors.
- `/reel` vs future per-cue pages → do not create per-cue URLs; keep cues on `/reel` with stable `#track-NN` anchors.

### Where the competitor's strategy would be wrong for you
Copying their exact-match slug-and-shout approach without their IMDb/Bandcamp entity would produce a page that ranks for nothing; copying their genre lock would shrink your addressable work; copying their plugin-heavy stack would regress your Core Web Vitals posture; copying their mailto-only CTA would cost you the professional buyers you actually want.

**Resulting positioning (evidence-based, not aspirational):**
> *Cinematic experimental composer and sound designer for directors, game creators and art-driven projects that need psychologically vivid, atmospheric, textural, original sound.*

Everything in §5–§6 is built to make that sentence rankable, credible and convertible.

---

# 5. Recommended site architecture (hub and spoke)

```
/  (portfolio — brand, proof, atmosphere)
│
├── /hire-a-composer            ★ P0  THE MONEY PILLAR — "hire a composer / composer for hire"
│     │                              who you help · formats · deliverables · process · proof · FAQ · CTA
│     ├── /sound-design         P1  spoken: "cinematic sound designer / horror sound design"      [BUILT]
│     ├── /game-scoring         P1  spoken: "composer for horror game / adaptive horror music"   [BUILT]
│     ├── /composer-for-short-films      P1  spoke (needs 3 short-form case studies first)
│     ├── /composer-for-documentaries    P1  spoke (needs the doc credit confirmed)
│     ├── /experimental-film-and-installation  P1  editorial-facing spoke (your differentiator)
│     └── /trailer-and-teaser-scoring    P2  spoke (only with confirmed trailer credits)
│
├── /services                   P0  REFRESH — owns "what does a horror score cost"
├── /contact                    P0  RETARGET — inquiry/quote intent, not "hire"
├── /process                    P1  REFRESH — pre-hire research magnet (spotting → delivery)
├── /reel                       P1  REFRESH — cue context captions for AI answers/PAA
├── /work                       P1  REFRESH — hub that feeds case studies
│     └── /work/<production>    P1  NEW case studies (9 × when credits confirmed)
├── /composer                   P1  REFRESH — E-E-A-T, credits, working method
├── /licensing                  P1  REFRESH — "need it licensed, not scored?" path
├── /faq                        P2  KEEP — delete nothing; link deeper from new pages
├── /journal                    P1  NEW editorial layer (§6.6) — 6 briefs to start
├── /store                      P2  KEEP — catalogue; never a primary SEO target
└── /legal · /sitemap · /privacy · /terms · /purchases · /accessibility · /404   P3  KEEP
```

## 5.1 Page specifications

### P0 — `/hire-a-composer` ★ built this session
| Field | Value |
|---|---|
| Primary keyword | hire a composer / composer for hire |
| Secondary | hire a horror composer, horror composer for hire, original score composer, film composer for hire, sound designer for hire, custom score |
| Intent | transactional |
| Purpose | convert qualified buyers into a structured inquiry; route everyone else to proof, rates, licensing |
| Audience | directors, producers, showrunners, game creators, curators, agency producers |
| H1 | **Hire a composer for original scores and sound design** |
| Title (≤60) | `Hire a Composer: Original Scores & Sound Design \| Zazie` (56) |
| Meta (≤155) | `Hire composer Zazie Kanwar-Torge for original film, game and experimental scores: dark, atmospheric, written to picture. Student films from $75.99.` (150) |
| H2 structure | Who this is for · What you can commission · How a commission runs · Proof · What lands in your edit · What it costs (link) · Not ready for a custom score? · Questions · Start an inquiry |
| Proof required | 30-cue showreel, 9 productions, per-format sample, [VERIFY] reviews, award |
| In-links | home footer + nav, `/services`, `/contact`, `/work`, `/reel`, `/process`, `/licensing`, both spokes |
| Out-links | `/reel`, `/work`, `/services`, `/process`, `/licensing`, `/sound-design`, `/game-scoring`, `/faq#fees`, `/contact` |
| Primary CTA | `Start a scoring inquiry →` (to `/contact`) |
| Secondary CTA | `Hear the showreel` (`/reel`) and `Not ready? Licence a track` (`/store`) |
| Schema | `WebPage` + `Service` + `Offer`(s) + `BreadcrumbList` (+ optional `FAQPage` — no rich result expected) |
| Action | **CREATE**; link from nav + every footer + home page (both DOM copies) |
| Priority / effort / value | P0 · 1 session · highest commercial value on the site |
| Cannibalisation notes | Does not restate rates (links to `/services`), does not restate the full FAQ (links to `/faq`), does not own "scoring inquiry" (that is `/contact`) |

### P0 — `/services` refresh (spec)
Retarget from *rates* to *cost*, keep every number, add: "what a score costs and why", three worked examples with funding bands, "what is NOT included", payment/deposit terms, and links to the pillar. Keep the existing tier table. Title ≤60: `Horror Film Score Cost & Rates \| Zazie Productions`. Add `PriceSpecification` clarity (§8).

### P0 — `/contact` retarget (implemented)
H1 becomes *"Scoring inquiry: tell me about your project"*; title `Scoring Inquiry: Request a Score Quote \| Zazie`; add the five-field brief checklist (already present), response-time promise, and a "prefer email?" line. This hands the word *hire* to the pillar.

### P1 — `/sound-design` (built), `/game-scoring` (built)
Specs identical in shape to the pillar but with format-specific deliverables, engine/format specifics, and their own FAQ trio. Both must link back to the pillar with the anchor **"hire a composer"**.

### P1 — case studies `/work/<production>`
One page per confirmed production, each with: title, year, format/runtime, role (composer / sound designer / both) **[VERIFY]**, tone brief, 2–3 cues, deliverables list (mix, stems, alternates, cue sheet), `CreativeWork` + `Movie`/`TVSeries` + `VideoObject` schema, IMDB/YouTube links, and an inward link to the pillar. Runtime/production facts must come from the production's own materials — do not invent.

### P1 — `/journal` editorial layer
Not a blog for volume. Six posts, each a genuine pre-hire question, each linking to one money page (§6.6).

### P3 — local
No location pages. Citations and directory listings only (§11.7).

---
# 6. Priority page blueprint — `/hire-a-composer`

> **Implementation status:** the copy below is implemented verbatim (as semantic HTML, in the site's own document chrome) at `hire-a-composer/index.html` + `hire-a-composer.html`, wired into nav, footers, sitemap, `_headers`, `sw.js`, the HTML site map and the home page (both DOM copies). Every fact is either already published on your site or tagged **[VERIFY]** — nothing was invented.

## 6.1 URL
`https://horror.zazieproductions.com/hire-a-composer`

## 6.2 Title tag options (ranked)
1. `Hire a Composer: Original Scores & Sound Design | Zazie` — 56 ch. Starts with the exact phrase, adds the two purchasable services, brand last.
2. `Hire a Composer for Film, Games & Art Projects | Zazie` — 55 ch. Names buyer types.
3. `Composer for Hire: Dark, Atmospheric Original Scores` — 53 ch. Strongest for "composer for hire".
4. `Zazie Kanwar-Torge | Hire a Horror Composer & Sound Designer` — 60 ch. Best if you want the horror phrase in the title rather than the H1.

## 6.3 Meta description options (ranked)
1. `Hire composer Zazie Kanwar-Torge for original film, game and experimental scores: dark, atmospheric, written to picture. Student films from $75.99.` — 150 ch. Price hook + deliverable promise.
2. `Original scores and cinematic sound design for horror, experimental and genre-flexible work. 30-cue showreel, nine productions, replies within 48 hours.` — 141 ch. Proof-led.
3. `Composer for hire: custom scores, sound design and stems for film, games, trailers and installations. Sliding scale by funding. Start an inquiry.` — 141 ch. Format-led.

## 6.4 H1 options (ranked)
1. **Hire a composer for original scores and sound design** *(implemented — exact phrase + both purchases)*
2. Hire a composer who hears what your film is afraid of
3. Composer for hire: dark, atmospheric, written to picture

## 6.5 Full draft copy (implemented verbatim)

**Eyebrow:** Archive 06 · Commission a score

**H1:** Hire a composer for original scores and sound design

**Lead paragraph:**
> I'm Zazie Kanwar-Torge. I write original music and design sound for directors, game creators and art-driven projects that need a specific atmosphere — psychological dread, uncanny texture, dark ambient weight, or an orchestral score with the lights off. Every commission starts from the story, not from a library.

**Doc meta row:** *Formats* Film · series · short · documentary · games · trailer · installation  ·  *Floors* Student films from $75.99, sliding scale by funding  ·  *Reply* Written quote within 48 hours of rough-cut review **[VERIFY: keep only if the 48-hour promise is operationally true]**

### H2 — Who this is for
- **Directors and producers** cutting a horror, thriller, folk-horror, body-horror or dark-sci-fi picture who need a score written to picture, not dropped in.
- **Game creators** building dread into interactive space and needing loops, layers and states that behave.
- **Documentary and experimental teams** whose subject needs a musical argument rather than a mood bed. **[VERIFY: only if you want documentary commissions named]**
- **Curators, galleries and producers of installations** where sound is the work, not the accompaniment. **[VERIFY]**
- **Agencies and branded teams** needing an original, uncanny cue that is licensed cleanly. **[VERIFY]**

*If you are not sure which of these you are, send the brief anyway — the first reply is usually three questions.*

### H2 — What you can commission
Three cards, each linking deeper:
1. **Original score, written to picture** — themes, motifs, cues, tension architecture and silence, spotted scene by scene against your cut. → `/process`
2. **Cinematic sound design** — designed dread: bowed metal, waterphone, struck objects, processed voice, sub-bass pressure, transitions and stingers that live in the same sonic world as the score. → `/sound-design`
3. **Interactive and adaptive sound** — loops, stems and intensity states that respond to play, prepared for your engine. → `/game-scoring`

Also available: trailer and teaser cuts, alternate mixes, cue-sheet-ready delivery, and licensing of existing catalogue material when a commission isn't the right fit. → `/licensing`

### H2 — How a commission runs
1. **Inquiry** — you send the brief: format, runtime, tone, references, deadline, what you can spend. I reply within 48 hours with questions or a first read. **[VERIFY]**
2. **Spotting** — we watch the cut together (or you send timecoded notes) and decide where music earns its place, and where silence does more. The cheapest place to change your mind.
3. **Direction** — a short sample cue or two, so you hear the world before the whole score is built. No full commitment until the direction is agreed. **[VERIFY: confirm you are willing to commit to a sample-cue stage on every commission]**
4. **Score and sound design** — cues written to picture, revisions in rounds, sound design built in the same palette.
5. **Delivery** — full mix, stems, alternate mixes and clean versions in the formats your edit and dub stage need; cue sheets filed where the production requires.
→ Full process: `/process`

### H2 — What lands in your edit
Stereo full mix · stem families (dialogue-safe music, ambience, designed elements, low-end pressure) · alternate and clean versions · timecode-matched cues · WAV delivery at production bit depth · cue sheet metadata. Delivery formats adapt to your picture department's spec — say what you need at inquiry and it is written into the quote.

### H2 — Proof, not adjectives
- **30 original cues** across psychological dread, stingers, thriller, dark ambient, body horror and cosmic horror → `/reel`
- **Nine productions scored** — EXPIRE, UNSEEN, PEREGRINUS, Phantom Requiem, ECLIPSED, THE HAUNTED, CHOLERIC, MIKE HAS A VISITOR, THE DARK AWAITS → `/work`
- **Film samples with the score in context** → `/work#samples`
- **IMDb-credited composer** → https://www.imdb.com/name/nm17333332
- **Award**: Winter 2024 Visual Container award recognition **[VERIFY: name the award exactly, or state it in the same words already used on `/` and `/composer`]**
- **Collaborator rating: 5.0 from four collaborators** **[VERIFY: permission to publish; see §7.4 on markup policy]**

### H2 — What it costs
Not a flat fee and not a mystery: quotes are built from your project's funding, then shaped by scored runtime, cue density, live players, delivery complexity, timeline and rights. Student films start at $75.99; most projects land in the few-hundred-dollar range. → `/services` and `/faq#fees`

### H2 — Not ready for a custom score?
If you need one track, a stinger or a piece of atmosphere this week, licence existing material from the catalogue instead — no briefing call, no lead time. → `/store` and `/licensing`

### H2 — Questions people ask before they commit
1. **Do you only score horror?** Horror is the centre of gravity — psychological, folk, body, supernatural and cosmic — but the same palette scores thrillers, dark sci-fi, experimental documentary and art-film work.
2. **How long does a score take?** A short typically takes 2–3 weeks from spotting; a feature or series episode 4–8 weeks, depending on runtime and cue density. **[VERIFY against `/services` wording]**
3. **Can you work to my temp track?** Yes — as a reference for function, not a template to imitate. The score is written to your picture and your story.
4. **What do you need from me to quote?** Format and runtime, rough cut or scene list, tone references, deadline, and the number you can realistically spend.
5. **Who owns the music?** The default grant is a buyout on final payment, with the composer retaining authorship and the right to credit; details, alternatives and cue-sheet practice are written down. → `/licensing`
6. **I have almost no budget. Should I still write?** Yes. Ask about the sliding scale, or licence a track — the answer is not always "come back later". **[VERIFY: keep if true to your policy]**

### H2 — Start an inquiry
> Send five things — format, runtime, references, deadline, budget — and you will get a real reply, not a pitch deck. → **`/contact`** · or email **[VERIFY: publish the studio address you want used publicly]**

**CTA copy set (exact):**
- Primary: `Start a scoring inquiry →`
- Secondary: `Hear the showreel` · `See selected work`
- Fallback: `Not ready? Licence a track`

## 6.6 Inquiry form specification (`/contact`, upgrade from `mailto:`-only)
Keep the privacy stance: the form composes the brief in the visitor's client *and* offers a copyable block. Fields:

| # | Field | Type | Why | Required |
|---|---|---|---|---|
| 1 | Project type | select: film / series episode / short / documentary / game / trailer / installation / other | routes the reply and the quote | ✅ |
| 2 | Format & runtime | text (`short, 14 min`) | drives cue density and price | ✅ |
| 3 | Tone or emotional objective | textarea (`dread that builds without release`) | the single most useful creative input | ✅ |
| 4 | Creative references | text | anchors taste, prevents mis-scoping | optional |
| 5 | Timeline / deadline | date or text | rush scheduling affects price | ✅ |
| 6 | Budget range | select of funding bands (`student/micro`, `< $250`, `$250–$750`, `$750–$2,500`, `$2,500+`, `not sure yet`) | qualifies without pricing you out; "not sure" must be a real option | ✅ |
| 7 | Deliverables needed | checkboxes: full mix · stems · alternates/clean · cue sheet · surround/immersive | prevents scope surprises | optional |
| 8 | Name / role | text | attribution and etiquette | ✅ |
| 9 | Email / preferred contact | email + phone optional | reply channel | ✅ |
| 10 | Links to picture or materials | url / password note | makes a quote possible without a call | optional |

Add next to the submit: response promise, statement that nothing is stored on the site, and a fallback email address. Emit an analytics event on submit (see §7.6).

## 6.7 Internal linking (exact anchors, implemented)
| From | Anchor text | To |
|---|---|---|
| `/hire-a-composer` | `Hear the showreel` / `30 original cues` | `/reel` |
| `/hire-a-composer` | `Nine productions scored` / `See selected work` | `/work` |
| `/hire-a-composer` | `cinematic sound design` | `/sound-design` |
| `/hire-a-composer` | `interactive and adaptive sound` | `/game-scoring` |
| `/hire-a-composer` | `What it costs` / `rates` | `/services` |
| `/hire-a-composer` | `Full process` | `/process` |
| `/hire-a-composer` | `Licence a track` / `licensing` | `/store`, `/licensing` |
| `/hire-a-composer` | `Start a scoring inquiry` | `/contact` |
| `/services`, `/sound-design`, `/game-scoring`, `/process`, `/work`, `/licensing`, `/faq` | `hire a composer` | `/hire-a-composer` |
| Nav (all pages) | `Hire` | `/hire-a-composer` |

## 6.8 Media placement plan
- **Hero of the pillar:** no autoplay audio. One still (press photo) + the two secondary CTAs. Audio on demand only.
- **Above "How a commission runs":** a 90-second *scoring-in-context* clip — one film scene with score, then the same scene with score muted, then stems isolated. This single asset answers "can you actually score?" faster than any paragraph. **[VERIFY: assemble from assets you own — do not use another production's footage without permission]**
- **Inside "Proof":** the poster wall thumbnails (already in repo) linking to `/work`.
- **Inside "What you can commission" (sound design card):** a 20–40-second designed-dread asset (waterphone/bowed metal/struck objects) so the sound-design promise is audible.
- **Reel placement:** keep the full 30-cue player on `/reel`; the pillar carries only two excerpts with captions naming the crew mood ("psychological dread, dialogue-safe"), never the whole library.
- **Captions/transcripts:** every embedded video gets a 1–2 sentence caption naming format, role and mood — these captions are what AI answer engines quote. Add `VideoObject` for each embedded video with real `uploadDate` (required) — do not guess dates.

## 6.9 On-page SEO checklist (pillar)
- [x] Single H1 containing the primary phrase
- [x] Exact-match slug `/hire-a-composer`
- [x] Title ≤ 60 ch with phrase first
- [x] Meta ≤ 155 ch with a concrete hook
- [x] `canonical` self-reference; `robots: index, follow, max-image-preview:large`
- [x] OG + Twitter card with absolute image URL and alt text
- [x] Breadcrumb (visible + `BreadcrumbList`)
- [x] `Service` + `Offer` schema using only published prices
- [x] Internal links in/out with descriptive anchors (no "click here")
- [x] Descriptive `alt` + `title` on every image, explicit `width`/`height`
- [x] Content answers the *hire* question; fees/rights deferred to canonical pages
- [x] No keyword stuffing: primary phrase appears in H1, lead, one H2-adjacent line and one internal anchor
- [ ] **VERIFY** facts tagged in §6.5 before publishing
- [ ] Add to `sitemap.xml` with today's honest `lastmod` (done this session)

## 6.10 Accessibility checklist
- [x] `lang="en"`, `viewport-fit=cover`, colour-scheme dark
- [x] Skip link to `#doc`
- [x] One `<h1>`, sequential `<h2>`/`<h3>`
- [x] Landmarks: `header`/`nav`/`main`/`footer`, `aria-label` on every nav
- [x] Focus-visible styles inherited from the shared document stylesheet
- [x] Contrast: body text `bone #f0ebe3` on `void #030303`; muted `mist #9a9590` reserved for ≥14 px non-essential text
- [x] Cards are lists, not div soup; link text is meaningful out of context
- [x] No autoplaying audio; media controls are user-initiated
- [x] `prefers-reduced-motion` respected by existing chrome (grain/vignette are static)
- [ ] Run axe/Lighthouse a11y pass after deploy and record the score in `PERFORMANCE.md`

## 6.11 Schema JSON-LD draft (truthful values only)
Implemented in the page head; §8.1 reproduces it with placeholders flagged.

---

# 7. Technical SEO backlog (evidence → impact → fix → verification)

Severity: **Critical** = blocks indexation/ranking; **High** = directly costs clicks or risks a penalty; **Medium** = measurable drag; **Low** = hygiene.

## 7.1 Deployment drift — **CRITICAL**
- **Evidence:** live `/sitemap` → HTTP 404; live `robots.txt`/`sitemap.xml` = 2026-09-18 revision; live title says 29 cues, repo says 30; live meta description is the pre-hardening string.
- **Impact:** the entire post-2026-09-18 IA (six hubs' links from home, the HTML site map, footer Archive rows, the 30th cue) is invisible to crawlers. Rankings reflect a site that no longer exists in the repo.
- **Fix:** merge `main`/this branch → deploy on Cloudflare Pages; confirm deployment completes without build error.
- **Verify:** `curl -sI https://horror.zazieproductions.com/sitemap | head -1` → `200`; compare `sitemap.xml` `lastmod` to repo; then Search Console → URL Inspection → *Request indexing* for `/`, `/sitemap`, `/hire-a-composer`, `/sound-design`, `/game-scoring`.

## 7.2 `404.html` inherits `X-Robots-Tag: index, follow` — **HIGH**
- **Evidence (live):** the 404 response carries `x-robots-tag: index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1` (from the `/*` block) while `404.html` itself declares `<meta name="robots" content="noindex, follow">`.
- **Impact:** conflicting signals on the one page Google is most likely to probe for a soft-404 pattern; in the worst case the 404 template is treated as indexable, and soft-404 detection is exactly the failure this repo already lived through once.
- **Fix:** add an explicit block in `_headers` **before** nothing — order does not matter for Cloudflare's longest-prefix matching, but keep it grouped:
  ```
  /404.html
    X-Robots-Tag: noindex, follow
    Cache-Control: public, max-age=0, must-revalidate
  ```
- **Verify:** `curl -sI https://horror.zazieproductions.com/404.html | grep -i x-robots-tag` → `noindex, follow`.

## 7.3 `VideoObject.contentUrl` points at HTML pages — **HIGH**
- **Evidence:** `index.html` JSON-LD carries `contentUrl: https://www.youtube.com/watch?v=…` for four videos; `SITEMAP.md §5` already removed the XML equivalent for the same reason (Google: *HTML and Flash aren't supported formats*).
- **Impact:** an invalid media URL can invalidate the video record for rich results; the sitemap and the page then disagree.
- **Fix (implemented):** delete `contentUrl`, keep `embedUrl` + `thumbnailUrl`; only add `contentUrl` if you ever host a real `.mp4`.
- **Verify:** Rich Results Test / Schema Markup Validator on `/` → zero `VideoObject` errors; GSC *Video pages* report keeps the videos.

## 7.4 Self-serving review markup with anonymous authors — **HIGH (policy), Medium (SEO)**
- **Evidence:** `Organization` on `/` carries `aggregateRating` (5.0, `reviewCount: 4`) and four `Review` objects whose `author.name` values are roles ("Independent Director", "Music Supervisor", "Festival Circuit", "Student Filmmaker"), published on your own domain about your own business.
- **Impact:** Google excludes self-serving reviews from review snippets; unnamed authors make the markup hard to defend. The downside is not "no stars" — it is structured-data-spam exposure on the domain you are trying to grow.
- **Fix (choose one, do not do both):**
  1. **Preferred:** attribute each review to a named person or company, with permission, plus `author.url` (their site/IMDb) and `itemReviewed` pointing at the `Service`, then keep `aggregateRating` only if the four reviews are real and permissioned. **[VERIFY with each collaborator]**
  2. **Safe fallback:** delete `review` and `aggregateRating` from the JSON-LD entirely and keep the testimonials as visible quotes with names/roles. Losing markup you were never eligible for costs nothing.
  Implementation `diff` for option 2 is written in §8.5 — **not applied**, because it edits claims about your own collaborators.
- **Verify:** after the change, Rich Results Test reports no review markup; the visible testimonials are unchanged for human visitors.

## 7.5 Home-page metadata truncation — **HIGH**
- **Evidence:** `<title>` = `Zazie Kanwar-Torge | Psychological Horror Composer | Original Dark Atmospheric Scores for Film, TV & Games` (111–113 ch). Meta description ≈ 300 ch.
- **Impact:** Google truncates both; the SERP shows an ellipsis where your differentiation should be — on the query class where you are least known.
- **Fix (implemented, both files):** title → `Horror Composer for Film, TV & Games | Zazie Productions` (54) [alternate: `Psychological Horror Composer | Zazie Kanwar-Torge` (48)]; meta → `Original dark, atmospheric horror scores for film, TV, games and experimental projects. Listen to 30 cues or send a brief — student films from $75.99.` (145). Update `og:title`/`twitter:title` to match, and keep the long-form description out of the meta (it still lives in the JSON-LD `WebPage.description`, which is fine).
- **Verify:** view-source on `/` after deploy; GSC → *Performance* → position/CTR before vs after 28 days.

## 7.6 No analytics and no conversion event — **HIGH (strategic)**
- **Evidence:** repo states no cookies/no analytics; inquiry is a `mailto:` handoff; nothing measures which page produced an email.
- **Impact:** every decision in this audit is inference. You cannot prove the pillar works.
- **Fix (implemented as documentation, needs your account):** add a cookieless, no-personal-data pageview tool (e.g. a self-hosted or privacy-first endpoint), send one custom event on `mailto:` click and one on inquiry-form submit, and verify GSC (URL-prefix property + domain property) with the DNS or HTML-file method — note the IndexNow key file already present at the repo root is unrelated. Update `/privacy` in the same commit so the statement "no analytics" stays true. **Do not** add cookie-based analytics without rewriting `/privacy` and `/terms`.
- **Verify:** realtime report shows your own visit; after a test email, the event appears; `/privacy` text matches reality.

## 7.7 Home H1 lacks the discipline keyword — **MEDIUM**
- **Evidence:** H1 = `Dark, atmospheric scores written to your picture.` — an excellent sentence that contains neither "horror" nor "composer".
- **Fix (implemented, both DOM copies):** `Dark, atmospheric horror scores, written to your picture.`
- **Verify:** validator check 20 (bundle/prerender parity) still passes; `grep -c "horror scores, written" index.html index-<hash>.js`.

## 7.8 Home body links no hub page — **MEDIUM**
- **Evidence:** the six hubs are linked only from the footer rows (Archive/Documents) in both DOM copies; the body copy links none.
- **Impact:** the pillar and hubs depend on footer links + nav alone; sitelink selection and PageRank distribution both suffer.
- **Fix:** add one contextual in-body link per section that already discusses the topic (e.g. the services section → `/hire-a-composer` "hire a composer", the press section → `/composer`, the gear/method copy → `/process`). Because the bundle is minified, do this as a *link-array* edit (the same pattern the footer uses) — the validator's check 20 enforces parity.
- **Verify:** `node tools/check-sitemap.mjs` → check 8c notes parity; click the links in the live page.

## 7.9 Image/social hygiene — **LOW/MEDIUM**
- `og:image` = `press-photo.jpg` (no explicit dimensions on some pages) — add `og:image:width/height` everywhere (the hub pages already do this; the home page should too).
- Poster JPGs are served at 1200 px for the lightbox and 640 px for the grid — already responsive; keep AVIF first in `<picture>`.
- Add `loading="lazy"` + `decoding="async"` to any below-fold `<img>` added by new pages (new pages follow the existing pattern).
- Fonts are self-hosted `woff2`, preloaded, with metric overrides — nothing to change. **Do not** add a font CDN.

## 7.10 Crawl-control hygiene — **LOW (no change needed, documented)**
- `robots.txt` already allows all relevant crawlers and blocks parameter waste; `Host:` is ignored by Google (Yandex-only) and `Crawl-delay` is ignored by Googlebot — harmless, keep or trim at your discretion.
- Sitemap is validated by the repo's own 22-check harness; every new page added in this session was added to `sitemap.xml`, `_headers`, `sw.js`, `server.mjs`, the HTML site map and the home page (both DOM copies) so the validator passes.

## 7.11 Security headers — **out of scope, noted**
The CSP already allowlists exactly the embeds in use. Nothing in this audit requires loosening it; if analytics is added (§7.6), the `connect-src` list must be extended deliberately.

---

# 8. Structured-data plan

## 8.1 `/hire-a-composer` — `Service` + `Offer` + `WebPage` + `BreadcrumbList` (implemented)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://horror.zazieproductions.com/hire-a-composer#webpage",
      "url": "https://horror.zazieproductions.com/hire-a-composer",
      "name": "Hire a Composer: Original Scores & Sound Design",
      "description": "Hire composer Zazie Kanwar-Torge for original film, game and experimental scores and cinematic sound design. Written to picture; student films from $75.99.",
      "isPartOf": { "@id": "https://horror.zazieproductions.com/#website" },
      "about": { "@id": "https://horror.zazieproductions.com/#person" },
      "primaryImageOfPage": "https://horror.zazieproductions.com/images/press-photo.jpg",
      "datePublished": "2026-10-04",
      "dateModified": "2026-10-04"
    },
    {
      "@type": "Service",
      "@id": "https://horror.zazieproductions.com/hire-a-composer#service",
      "name": "Original score composition and cinematic sound design for film, games and experimental projects",
      "serviceType": "Composition, film scoring and sound design",
      "provider": { "@id": "https://horror.zazieproductions.com/#org" },
      "areaServed": "Worldwide",
      "availableChannel": {
        "@type": "ServiceChannel",
        "serviceUrl": "https://horror.zazieproductions.com/contact",
        "servicePhone": "[VERIFY: omit if you do not want a public number]"
      },
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "USD",
        "lowPrice": "75.99",
        "offerCount": "5",
        "url": "https://horror.zazieproductions.com/services"
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Portfolio", "item": "https://horror.zazieproductions.com/" },
        { "@type": "ListItem", "position": 2, "name": "Hire a Composer", "item": "https://horror.zazieproductions.com/hire-a-composer" }
      ]
    }
  ]
}
```

Notes: `lowPrice` **is** a published fact (student floor) — it stays. Do **not** add `aggregateRating` here. Do not add `FAQPage` expecting a rich result (Google restricted FAQ rich results in 2023); the FAQ is on the page because it answers objections and feeds AI answers, and it may be marked up or left plain — either is acceptable. This page's FAQ is intentionally *not* marked up, to avoid duplicating `/faq`'s markup.

## 8.2 `/sound-design` — `Service` (implemented)
Same `@graph` shape; `name: "Cinematic sound design for horror and experimental film"`, `serviceType: "Sound design"`, `offers` → `AggregateOffer` with `lowPrice` **omitted** unless you publish a sound-design floor (do not reuse the scoring floor for a different service).

## 8.3 `/game-scoring` — `Service` (implemented)
`serviceType: "Interactive and adaptive music composition"`, `areaServed: "Worldwide"`, `provider` → `#org`. No engine names in schema unless they are also in visible copy.

## 8.4 Case studies (blueprint, per production)
```json
{
  "@type": "CreativeWork",
  "@id": "https://horror.zazieproductions.com/work/<slug>#work",
  "name": "<Production Title>",
  "creator": { "@id": "https://horror.zazieproductions.com/#person" },
  "datePublished": "<year>",
  "genre": ["Psychological horror"],
  "about": "Original score and sound design",
  "workExample": { "@type": "Movie", "name": "<Production Title>", "sameAs": "https://www.imdb.com/title/<id>/" }
}
```
Plus `VideoObject` for each embedded sample **with a real `uploadDate`** (required field — never guess) and `thumbnailUrl` that exists on disk.

## 8.5 Change to remove (awaiting your decision — `diff`, not applied)
```diff
  {
    "@type": "Organization",
    "@id": "https://horror.zazieproductions.com/#org",
-   "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5.0", "bestRating": "5", "reviewCount": "4" },
-   "review": [ { "@type": "Review", "reviewBody": "…", "author": { "@type": "Person", "name": "Independent Director" } }, … ],
    "makesOffer": { … }
  }
```
Replace with visible, attributed quotes on the page (names/roles, with permission) and no review markup — until such time as each review is attributable to a named, permissioned author with a `sameAs`/`url`.

## 8.6 What *not* to add
- `LocalBusiness`/`ProfessionalService` with a street address you do not operate publicly from — `Organization` + `areaServed: Worldwide` is already correct for a remote studio.
- `Person.award` for anything you cannot name precisely — **[VERIFY]** the exact award name/title first; a vague `award` is worse than none.
- `SearchAction`, sitelinks markup, or `SpeakableSpecification` expansion — no rich result depends on them (the existing `speakable` is harmless but inert).

---

# 9. Implementation changelog (this session, branch `arena/01a10796-zazie-horror-portfolio`)

Everything below is committed to the session branch and validated by the repository's own harness (`node tools/check-sitemap.mjs` → **PASS — 19 URLs, 47 images, 8 videos**, 452 section links resolving, dual-DOM parity, HTML site map complete). Nothing was deployed; merge to `main` is yours to approve.

## 9.1 New pages (3)
| File | What it is |
|---|---|
| `hire-a-composer/index.html` + `hire-a-composer.html` (twin) | The commercial pillar: who it is for, what can be commissioned, how a commission runs, deliverables, proof, cost, licensing fallback, six-question FAQ, inquiry CTA. `Service` + `Offer` + `WebPage` + `BreadcrumbList` schema. |
| `sound-design/index.html` + twin | Cinematic sound design spoke (source/object recordings, atmospheres, transitions, voice treatment, deliverables, design+score together, FAQ). |
| `game-scoring/index.html` + twin | Adaptive horror scoring spoke (states, loops, layers, mix behaviour, implementation notes, vertical-slice workflow, deliverables, FAQ). |

Every page carries `<!-- [VERIFY] -->` comments at the exact claims needing your confirmation — see §10.

## 9.2 Wiring (so the new pages are actually discoverable)
- `sitemap.xml` — three URLs added with image entries and honest `lastmod 2026-10-04`; the nine pages whose markup changed were re-dated. **19 URLs / 47 images / 8 videos.**
- `_headers` — canonical `Link:` headers for `/hire-a-composer`, `/sound-design`, `/game-scoring` (all three URL forms each), plus an explicit `X-Robots-Tag: noindex, follow` block for `/404.html`.
- `sw.js` — the three routes join `PRECACHE_ASSETS`; `CACHE_NAME` bumped `zazie-v22 → zazie-v23`; release note added.
- `server.mjs` — `CLEAN_ROUTES` extended (local dev parity).
- `robots.txt` — no change needed (everything new is already allowed).
- Nav: a `Hire` tab added between **Rates** and **Store** on every document page, the store, the 404 and the React nav (`Ix` array in the bundle).
- Footers: `Hire a composer` · `Sound design` · `Game scoring` added to the footer link rows site-wide (legal partial, all hubs, store, 404) and to the `Archive` row of the home page in **both DOM copies**.
- Related-archive cards linking to the pillar added to `/work`, `/reel`, `/composer`, `/process`, `/services`, `/contact`.
- HTML site map (`legal-src/pages/sitemap.html`) lists the three pages and their sections; `./legal-src/build.sh` and `./store-src/build.sh` re-run; `node tools/route-aliases.mjs` regenerated all twins.

## 9.3 Technical fixes applied
- **Home metadata**: `<title>` → `Horror Composer for Film, TV & Games | Zazie Productions` (54 ch); meta/OG/Twitter descriptions → 145 ch with the price hook and the 30-cue count; JSON-LD `WebPage.name` aligned to the visible page.
- **Home H1**: `Dark, atmospheric scores written to your picture.` → `Dark, atmospheric horror scores, written to your picture.` in **both** the prerender and the React bundle.
- **Video schema**: seven `contentUrl` values pointing at `youtube.com/watch?v=…` and one at a Google Drive `/preview` page were removed; `embedUrl` remains. The 30 `AudioObject.contentUrl` values pointing at real `/audio/*.mp3` files were left untouched — those are valid.
- **`/contact` retargeted**: title → `Scoring Inquiry: Request a Score Quote | Zazie Productions`, H1 → `Scoring inquiry: tell me about your project` — the *hire* phrase now belongs to the pillar alone.
- **Bundle re-hash**: `index-0e50167c.js` → `index-60c930a1.js` (nav array, footer array and hero H1 edits); references updated in `index.html`, `sw.js` and `PERFORMANCE.md`; validator confirms the filename equals its `sha256[:8]`.

## 9.4 Not applied (needs your decision)
1. Removing the anonymous `Review`/`AggregateRating` markup on `Organization` (§7.4 / §8.5) — do it as a deliberate commit, either by naming the reviewers with permission or by deleting the markup.
2. Removing `telephone` from public JSON-LD and moving the public contact address off Gmail (§4.3).
3. Any analytics/GSC installation, because it changes the privacy promise and therefore `/privacy` text (§7.6).

## 9.5 How to verify after deploy
```bash
node tools/check-sitemap.mjs --live        # every sitemap URL must answer 200
curl -sI https://horror.zazieproductions.com/404.html | grep -i x-robots-tag   # → noindex, follow
curl -s https://horror.zazieproductions.com/hire-a-composer | grep -o '<title>[^<]*'
```
Then Search Console → URL Inspection → Request indexing for `/`, `/sitemap`, `/hire-a-composer`, `/sound-design`, `/game-scoring`; Bing Webmaster Tools → `node tools/indexnow.mjs`.

---

# 10. [VERIFY] register — confirm before publishing

| # | Claim, tag, file | What to confirm |
|---|---|---|
| 1 | "Written quote within 48 hours of rough-cut review" — pillar meta row, CTA paragraph, hero promise | Is a 48-hour quote actually what you deliver? If it is 72 hours or "within a week", say that instead. |
| 2 | "A short sample cue or two … nothing is committed until the direction is agreed" — pillar, stage 3 | Do you offer a sample-cue stage on *every* commission, or only above a budget threshold? |
| 3 | Documentary / installation / branded commissions named under "Who this is for" | Do you want those commission types advertised, or keep the pillar to film/games/sound design? |
| 4 | Award sentence — "Winter 2024 award recognition on the press page" | The exact award name and issuing body, as already worded on `/` and `/composer`. A vague award is worse than none. |
| 5 | Collaborator rating "5.0 from four collaborators" and the four review bodies | Permission from each collaborator to publish; whether they can be named. Until then, the markup decision in §7.4 stands. |
| 6 | Press features (Grammy Weekly, Billboard Wire, Limitless Magazine) | These are separate domains from the Grammy/Billboard mastheads. Verify what they are before they carry E-E-A-T weight; the Visual Container press-release PDF looks like genuine third-party recognition. |
| 7 | Sound design credited on EXPIRE (figcaption + sitemap caption) | Confirm the credit and wording with the production. |
| 8 | "Nine productions", "30 cues", "eight film samples" | Counts are already used site-wide; they were not changed in this session — confirm they are still exact after the 30th cue landed. |
| 9 | Service capabilities: Wwise/FMOD/Unity/Unreal delivery, adaptive states, surround/immersive stems | Already published on `/services` and `/faq`; confirm you want them restated on the game and sound-design pages. |
| 10 | Contact details: `zaziediya@gmail.com`, `+1-864-430-0606` in JSON-LD | Whether the phone number should be public at all, and whether a `@zazieproductions.com` address should front the studio. |
| 11 | Turnaround "2–3 weeks short / 4–8 weeks feature" | Must match `/services` exactly; if they differ, make them agree. |
| 12 | Student floor $75.99 and "typically a few hundred dollars" | Only restate if the published floor is still the real floor. |

---

# 11. Off-page authority plan (Phase 7)

Principles: only links and citations a real person would actually earn, and only where the credit is true. No purchased links, no PBNs, no reciprocal-link schemes, no mass guest posting, no fake credits, no fake reviews.

| # | Tactic | Why it matters | Effort | SEO value | Business value | Ethical angle / asset | Outreach note |
|---|---|---|---|---|---|---|---|
| 1 | **Production & festival pages** (Filmmaker/Freeway, FilmFreeway project pages, festival programme pages) for each of the nine productions, each crediting the composer with a link to the matching `/work` page | The strongest genuinely-earnable links in this industry: every film already has a page somewhere | Low per film | Medium-high (relevant, contextual) | High (directors find composers from other films' credits) | Ask the director for a credit link, not a favour: "here is the case-study page so the score is credited properly" | Template A |
| 2 | **IMDb entity cleanup** — complete `nm17333332` (bio, composer credits, links to the site where IMDb permits), and add the studio to every title's composer field that qualifies | Entity reconciliation is what makes "composer" queries resolvable | Low | Medium (no strong link, high entity value) | Medium | Only true credits | n/a |
| 3 | **Sound/music platforms as entities**: Bandcamp (link to `/store` and `/licensing`), Spotify/Apple artist profiles (link to `/reel`), Discogs for physical releases, MUBI for films you scored where available | Third-party entities corroborate the same facts | Low | Medium | Medium | Only where releases/credits exist | n/a |
| 4 | **Stage 32 / regional film orgs / co-op directories** (refresh the existing Stage 32 profile first — it is already indexed, which is why your name surfaces there and not your site) | A citation you already own but which does not point at the new pages | Low | Low-medium | Medium | Genuine profile, real credits | Template B |
| 5 | **ProductionHUB and SoundBetter city/format listings** | These *are* the Asheville and "hire a film composer" SERPs today; being present is better than being absent | Low | Low (nofollow/aggregator) | Medium-high (qualified inbound) | Real listing with real reel | n/a |
| 6 | **Press-kit & interview cycle**: pitch the experimental/horror-adjacent angle (psychoacoustic instrument building, waterphone/struck-metal work, sound design as score) to sound-art and genre publications, college radio, horror podcasts | One genuine feature beats ten directory rows | Medium | Medium | High (audience + credibility) | A one-page press kit PDF + three images + 30-second audio embeds, hosted at `/composer` | Template C |
| 7 | **Collaborator link-backs**: every director, editor, production company and game studio you have worked with — ask for the credit + link once, at delivery, with the asset ready | Compounding, zero-cost, entirely legitimate | Low (ongoing habit) | Medium | High | "Here is the credit wording and the URL" | Template A |
| 8 | **Open-source / craft contributions**: sound-design tools in the catalogue, sample packs, a free cue for a festival's trailer, university/guild talks | Earns links from maker communities and course pages | Medium | Medium | Medium | Real free asset, real teaching | Template D |
| 9 | **Local/regional arts**: Asheville-area film orgs, arts councils, university film programmes, regional festivals (listings + talks) | Regional credibility and real local relevance without doorway pages | Medium | Low-medium | Medium-high | Public talk, screening, panel | Template B |
| 10 | **Music-supervision & sync directories** where the application is genuine | Discovery channel for licensing revenue | Low | Low | Medium | Accurate catalogue metadata | n/a |
| 11 | **Data/asset that attracts citations**: publish the real cost logic ("what a horror score actually costs, and why a sliding scale is not a discount") as a `/journal` piece with a downloadable scope sheet | The cost SERP is currently owned by third-party blogs quoting US averages; your published floor is a genuine differentiator | Medium | Medium-high | High (pre-qualifies buyers) | Table + PDF | n/a |
| 12 | **Wikipedia/Wikidata hygiene** | Entity reconciliation for AI answers | Low | Low | Low-medium | Only with independent sourcing — do not self-promote | n/a |

**Outreach templates (short, non-spammy)**

- **Template A — credit link (to a director/producer, at delivery):**
  > "The score is delivered — cue sheet, stems and alternates are in the folder. Two small things: here's the credit wording for the film's page and press notes, and here's the case-study page for the score if you'd like to link the music credit: `horror.zazieproductions.com/work/<film>`. No obligation — credit as it suits the production."
- **Template B — directory/profile refresh:**
  > "I've scored nine productions including EXPIRE and THE HAUNTED; my profile here lists the earlier ones. Could we refresh the credits, and link the reel to `horror.zazieproductions.com/reel`?"
- **Template C — press pitch (sound-art/genre publication):**
  > "Subject: A horror composer who builds instruments out of sheet metal. Three angles, no press-release fluff: (1) scoring psychological horror with struck metal and waterphone, with audio; (2) the sliding-scale economics of indie scoring, with real numbers; (3) the catalogue of horror sound libraries. Happy to send audio first."
- **Template D — teaching/talk (university, guild, festival panel):**
  > "I can give a 45-minute session on scoring dread without cliché — using stems from a real short, showing the same scene with score, without score, and score stripped to stems. Free for student programmes."

---

# 12. Measurement and prioritisation (Phase 8)

## 12.1 Scoring the work (ICE)
`ICE = Impact × Confidence × Ease`, each 1–10, and **shown with its assumption** so you can disagree with the input rather than the output.

| Task | Impact | Confidence | Ease | ICE | Notes / assumption |
|---|---|---|---|---|---|
| Deploy `HEAD` to production | 10 | 10 | 9 | **900** | Assumes main merges cleanly; nothing else works until this does |
| Ship the pillar + spokes + wiring (done) | 9 | 9 | 7 | **567** | Confidence from the thin exact-match SERP |
| Home title/meta/H1 + VideoObject + 404 robots fix (done) | 7 | 9 | 9 | **567** | Deterministic technical gains |
| Analytics + GSC + inquiry event | 9 | 8 | 7 | **504** | Assumes you accept a cookieless tool and a privacy-text edit |
| Refresh `/services` around cost | 8 | 7 | 7 | **392** | Assumes you keep publishing the sliding scale |
| Case studies for 9 productions | 8 | 8 | 4 | **256** | Ease is low because credits/runtimes must be confirmed |
| `/journal` first 3 pieces | 6 | 6 | 6 | **216** | Cost piece is the strongest |
| Short-film + documentary spokes | 7 | 6 | 5 | **210** | Needs case-study material first |
| Off-page: credits, IMDb, Stage 32, directories | 6 | 5 | 6 | **180** | Slow compounding; no guarantee of link placement |
| Review-markup decision + attribution | 4 | 7 | 8 | **224** | Small SEO effect, real risk reduction |

## 12.2 30 / 60 / 90 days

### Days 0–30 — repair, ship, measure
| Task | Priority | Impact | Effort | Owner | Dependency | Success metric | Validation |
|---|---|---|---|---|---|---|---|
| Merge branch → deploy; confirm prod == repo | P0 | Critical | S | Owner/dev | Branch approval | `/sitemap` 200; 30 cues live | `node tools/check-sitemap.mjs --live` |
| Submit sitemap; request indexing for `/`, `/sitemap`, 3 new pages | P0 | High | S | Owner | Deployment | GSC "Discovered/Crawled" | GSC Sitemaps + URL Inspection |
| Verify the [VERIFY] claims on the new pages | P0 | High | S | Owner | — | Pages contain only true claims | §10 checklist |
| Install cookieless analytics + GSC + `mailto:`/form events; update `/privacy` | P0 | High | M | Dev | Privacy text | Events visible in realtime | Test inquiry end-to-end |
| Decide review markup (attribute or remove) | P0 | Medium | S | Owner | Permission from reviewers | Rich Results Test clean | Schema validator |
| Refresh `/services` around the cost question | P1 | High | M | Owner/copy | — | Time on page, `mailto:` clicks | GA4/analytics events |
| Publish two case studies with confirmed credits | P1 | Medium | M | Owner/dev | Production confirmations | Case pages indexed | GSC |
| Fix `og:image` dimensions on home; add `decoding`/`lazy` where missing | P2 | Low | S | Dev | — | Social preview renders | Debugger tools |

### Days 31–60 — spokes and proof
- Publish `/composer-for-short-films` and `/composer-for-documentaries` (needs the first two case studies).
- Add the in-body contextual links from the home page sections to `/hire-a-composer` and `/services` (bundle link-array edit + validator).
- Publish journal pieces 1–2 (what a score costs; how to brief a composer without wasting a week).
- Refine the `/contact` form spec into the copyable-brief block (§6.6) — keep `mailto:` as an option.
- First outreach cycle for credits and directory refreshes (templates A + B).
- CTR test: rewrite the home meta description twice, 3 weeks apart, comparing CTR in GSC.

### Days 61–90 — authority and pruning
- Journal pieces 3–5; the experimental/installation spoke; trailer spoke only with confirmed credits.
- Second outreach cycle (press pitch, teaching, collaborator links) — measure *link placements*, not emails sent.
- Cannibalisation review: for every query with impressions, check that GSC's landing page matches §3.3's assignment; merge or redirect when it does not.
- Content refresh pass: update `/reel` cue captions, `/process` timings, `/faq` answers that drifted from the new pages.
- Quarterly review: indexed-page count, query coverage, inquiries per landing page, and the next 90-day roadmap.

---

# 13. Journal briefs (the first five, in priority order)

1. **"What a horror score actually costs — and why a sliding scale isn't a discount"** → `/services`. Real bands, what moves the number, what a deposit covers. Target: cost queries currently answered by third parties quoting US averages.
2. **"How to brief a composer without wasting a week"** → `/hire-a-composer`. The five things, with a copyable brief template. Target: pre-hire research traffic.
3. **"Temp love is a trap: what to send instead of 'like this, but different'"** → `/hire-a-composer`. Target: directors mid-edit; high empathy, high shareability.
4. **"What are stems, and which ones does your edit actually need?"** → `/process`, `/sound-design`. Target: producers who have never delivered to a dub stage.
5. **"Building an instrument out of sheet metal: scoring dread with objects"** → `/sound-design`, `/composer`. Target: sound-art and genre press — the piece most likely to earn a genuine citation.

Each piece: one money-page link in the body, one in the close, `Article` schema, real audio embedded, no keyword stuffing, no AI filler.

---

# 14. Appendix — Phase 0 baseline (my site) and the honest limits of this audit

**Domain:** `https://horror.zazieproductions.com` (canonical, HTTPS, Cloudflare Pages). **No staging URL was verified** in this session — Cloudflare Pages preview deployments exist per branch but were not inspected.
**Stack:** static HTML + hashed CSS/JS, React bundle for the home experience, generated document pages, service worker, no backend, no CI build (what is on `main` is what the edge serves).
**Editable from the repo:** copy, templates, metadata, schema, internal links, images, redirects, sitemap, robots, headers, service worker, performance settings — all of it. **Not available:** GSC/GA4/backlink data (no access in this session), and no CrUX/PSI data (public API returned quota-exhausted).

**Page inventory (repo `HEAD`, post-session count):** `/` · `/work` · `/reel` · `/composer` · `/process` · `/services` · `/contact` · `/hire-a-composer` *(new)* · `/sound-design` *(new)* · `/game-scoring` *(new)* · `/store` · `/legal` · `/faq` (36 Qs) · `/terms` · `/privacy` · `/licensing` · `/purchases` · `/accessibility` · `/sitemap` · `/404.html`.

**Duplication / thin / orphan audit:** no orphans (validator check 19), no thin duplicates, no accidental noindex, one canonical per page, one H1 per page, and the only genuinely thin commercial page was `/contact` (725 words) — now relieved by the pillar.

**Claims in this audit that I could not verify and did not assert:** referring-domain counts, anchor-text distribution, competitor traffic, your click/impression/CTR/position data, Core Web Vitals numbers, and whether the competitor's credits involve the exact role descriptions used in marketing copy.

---

*End of audit. Implementation lives in the same branch: three new pages, the wiring, the technical fixes, and a validator PASS. Start with deployment — everything else is waiting on it.*
