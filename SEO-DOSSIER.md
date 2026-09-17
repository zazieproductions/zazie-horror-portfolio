# SEO DOSSIER — horror.zazieproductions.com
**Operation: category ownership — psychological horror / dark atmospheric film composition**
Executed 2026-09-16 · branch `arena/01a0aca2-zazie-horror-portfolio`

---

## 1. System diagnosis (what was found)

**The property.** A single-page React SPA (pre-rendered HTML shell + 420 KB JS bundle) for Zazie
Kanwar-Torge / Zazie Productions LLC: award-winning psychological-horror composer. Deployed as
static assets (Cloudflare Pages conventions: `_headers`, `_redirects`). Strong existing assets:
authentic dark aesthetic, 29-cue audio showreel, IMDb-verified credits, real press coverage
(Billboard Wire, Limitless Magazine, Grammy Weekly), festival award.

**Strengths preserved (not diluted):** all copy voice, showreel, poster wall, rates, contact flow,
and design tokens are untouched visually. Every SEO change amplifies the existing atmosphere.

**Weaknesses found and attacked:**

| # | Weakness | Severity |
|---|----------|----------|
| 1 | **Zero content depth**: one URL competing for an entire intent cluster | Critical |
| 2 | **Indexable-page count = 1**; sitemap had 1 URL with video entries attached to a page that never embeds them | Critical |
| 3 | Homepage **meta description had no hire-intent** ("Listen to the showreel or request a scoring quote" — no "composer for hire") | High |
| 4 | `/* /index.html 200` SPA catch-all → **every garbage URL soft-200s** a homepage duplicate | High |
| 5 | **Guideline-violating schema**: self-serving `aggregateRating`/`review` on `Organization` (anonymous quotes), invisible `FAQPage` markup | High |
| 6 | `Forbidden: /audio/` in robots.txt → **crawlers can't see the site's 91 MB of MP3 evidence** (no MediaObject/AudioObject schema anywhere) | Medium |
| 7 | VideoObject markup missing `duration`/`uploadDate`; `video:publication_date` absent | Medium |
| 8 | Images: 11 MB (2.5 MB PNG posters; 443 KB hero) — LCP drag | Medium |
| 9 | Image search invisible for poster titles; key press/credit facts (director names, synopses, runtimes) absent from HTML | Medium |
| 10 | Footer (the only site-wide links) = 3 hash anchors; new content layer would have been orphaned without bundle surgery | Medium |
| 11 | "UNSEEN" credit stated as full score; poster credit block reads *additional music* (Steve Merlo main title) — accuracy risk to E-E-A-T | Low |
| 12 | PEREGRINUS described generically; poster identifies it as a *concept series* | Low |

**Competitive read (Phase 1 SERP intelligence):** "psychological horror film composer" and adjacent
heads are owned by editorial entities (WaPo, Rolling Stone, Britannica, Guardian — Herrmann,
Penderecki, Carpenter, Morricone) and directories (SoundBetter, itch.io forums, composer
brochure-sites like marcvdmeulen.com). Nobody in this SERP owns: (a) a *documented working
vocabulary* of horror scoring technique, (b) case-study depth per scored film, (c) transparent
rate content from a practicing horror composer. Zazie's verified filmography + press + the
aesthetic itself are unreplicable by content farms. The play is not to out-rank Wikipedia for
"Herrmann" — it is to own the *transactional + craft* layer: composer-for-hire intent, technique
queries, and "score analysis" long-tail, then let entity consolidation (Person → sameAs → IMDb →
MusicComposition/Movie graph) pull brand queries into a knowledge-panel trajectory.

---

## 2. Leverage taken (Phase 2 priorities → actions)

1. **Architecture that unlocks everything** → 17 new pre-rendered, canonical, linked pages in
   three silos (Work / Lexicon / Guides + Press), zero-JS-required content.
2. **Topical authority** → The Lexicon of Dread (24 techniques), 12 case studies, 2 money-intent
   guides. Total ~11,400 new words of original, expertise-dense content.
3. **On-page precision** → title/meta/H1 system per page; breadcrumb + BreadcrumbList everywhere;
   internal link graph: homepage → hub → case studies → lexicon → guides → contact.
4. **Entity fortification** → `Person`/`Organization` @id chain on every page; `Movie`,
   `MusicComposition`, `VideoObject`, `DefinedTermSet`, `ProfilePage`, `CollectionPage`, `Article`
   with real dates/durations/credits harvested from the actual YouTube uploads and IMDb.
5. **Rich results** → 7 VideoObjects with full metadata + thumbnails; sitemap video entries moved
   onto the pages that embed the videos; image sitemap expanded to all posters.
6. **Performance** → images 11 MB → 3.2 MB (-71%); lazy loading; preconnects retained.
7. **Measurement** → Tracking & validation plan in §6 (GSC/rich-results checks; no fake numbers).

---

## 3. Exact changes executed (Phase 3)

### New assets (all static HTML, pre-rendered, on-brand)
- `/work/` — filmography hub: 7 embeddable film samples + 5 poster credits, intro copy, dual CTAs.
- **12 case studies** `/work/{slug}/`: `mike-has-a-visitor`, `the-haunted`, `whispers-in-the-dark`,
  `aquaphobia`, `goodbye-brother`, `home-intruder`, `phantom-requiem`, `expire`, `choleric`,
  `eclipsed`, `unseen`, `peregrinus`. Each: video embed (nocookie) or poster, The brief / The
  score (3 named techniques) / The hard problem / Signals & techniques (deep links into lexicon
  anchors) / credits block / prev-next pager. ~450 words unique each.
- `/lexicon/` — **The Lexicon of Dread**: 24 defined techniques (drone, stinger, sub-drop,
  shepherd tone, bowed metal, struck strings, prepared piano, close-miked breath, negative space,
  motif stalking, dissociative harmony, psychophonic bed, waterphone, hybrid orchestration,
  granular texture, tape degradation, pulse engine, cluster voicing, whisper choir, folk detune,
  ritual pulse, diegetic bleed, corrupted innocence, riser abstinence), each with definition,
  deployment guidance, and "hear it" links into the showreel and case studies. `DefinedTermSet` schema.
- `/guides/horror-film-score-cost/` — "What a horror film score actually costs": full rate card
  ($50 micro → $8,000 feature), intensity tiers, add-on pricing table, quote process, 6-question
  FAQ. Targets the cluster's highest commercial-intent queries.
- `/guides/hire-a-horror-composer/` — the complete hiring process: timing, the brief, spotting,
  revisions, deliverables & rights, red flags, 6-question FAQ.
- `/press/` — structured press kit: 50-word and 150-word bios, photos, coverage list, credits at
  a glance, contact. `ProfilePage` + full `Person` entity.
- `404.html` + `site-404.css` — branded, on-voice 404 (flickering 404, recovery links).

### Generator (maintainable, not hand-spun)
- `tools/sitegen.py` (shared shell: meta system, header/footer, JSON-LD builders),
  `tools/works_data.py` + `tools/build_works.py` (case studies + hub),
  `tools/build_other.py` (lexicon, guides, press). `tools/` is disallowed to crawlers.
- `site-20260916.css` — static stylesheet reusing the exact design tokens from the compiled
  Tailwind bundle (void/ink/smoke/ash/mist/bone/blood/ember, Cormorant Garamond + Inter).
  Immersion preserved: same typography, same palette, same micro-label grammar.

### Homepage surgery (`index.html` + `index-daKuu3pI.js`)
- Meta description (all three tags) → hire-intent: *"Psychological horror composer for hire.
  Original dark, atmospheric scores for film, TV, and games…"*
- Removed self-serving `aggregateRating` + anonymous `Review` markup from `Organization`.
- Removed invisible `FAQPage` block (content now exists visibly on the guides).
- Added `hasPart` (5 content-layer URLs) + `significantLink` expansion to `WebPage`.
- **New "Inside the score" section** (8 cue cards with descriptions + Lexicon CTA + cost-guide
  link) — injected into BOTH the pre-rendered HTML and the React bundle via a
  `dangerouslySetInnerHTML` element placed before the press section, so content survives
  `createRoot().render()`. Bundle re-validated with `node --check` (exit 0).
- Prerendered footer links repointed: `#press → /press/`, `#work → /work/` + new **Lexicon of
  Dread** and **Scoring rates** links — mirrored by an identical edit inside the minified bundle
  (Footer children array), so the rendered DOM and prerender agree. Bundle re-validated.
- Poster alt text corrected: UNSEEN = "additional music by…".

### Technical / edge configuration
- **`_redirects`**: SPA catch-all `/* /index.html 200` REMOVED (soft-200 duplicate-URL risk
  eliminated; real 404s restored). Added: `/work`, `/lexicon`, `/press`, `/guides`, `/work/index`,
  `/index.php`, `/home` → canonical 301s. Verified against Cloudflare Pages semantics: static
  assets are served before `_redirects`, so content files are unaffected by the removal.
- **`_headers`**: `X-Robots-Tag: noindex` on `/audio/*` (defense-in-depth), immutable cache for
  `/site-*.css`, all prior security headers preserved.
- **`robots.txt`**: `/audio/` unblocked for crawlers (schema now describes the catalog; header
  carries noindex), `/tools/` blocked, explicit AI-engine policy (GPTBot, OAI-SearchBot, ClaudeBot,
  PerplexityBot, Applebot-Extended: content yes, audio no), SEO backlink crawlers throttled.
- **`sitemap.xml`**: 1 URL → **18 URLs**; every poster in `<image:image>`; 7 `<video:video>`
  entries relocated to their case-study URLs with `publication_date` + `duration` (real values
  scraped from the uploads: e.g. Mike Has A Visitor 2025-06-30 PT14M23S).
- **Images**: recompressed/resized in place — hero 443→232 KB, headshot 204→82 KB, posters
  7.9 MB→2.6 MB (peregrinus/unseen to 780px 200-color paletted PNG — visually verified: dithered
  style suits the art, text crisp). Total 11 MB→3.2 MB.

### Factual corrections (E-E-A-T hygiene)
- UNSEEN role → "additional music" (per poster credit block) across case study, hub, press kit,
  sitemap image title, homepage alt.
- PEREGRINUS → "concept series" (per poster) across all surfaces.

---

## 4. Before → after (measured in this session)

| Metric | Before | After |
|---|---|---|
| Indexable pages | 1 | **18** (+ branded 404) |
| Sitemap URLs | 1 | 18 |
| Words of crawlable content (subpages + home) | ~900 | **~12,300** |
| JSON-LD entities | 7 blocks, 2 guideline risks | 30+ valid blocks across silo; zero violations |
| VideoObject entries (complete metadata) | 0 of 7 | **7 of 7** (duration + uploadDate + thumbnails) |
| Sitemap video entries on embedding pages | 0 | 7 |
| Internal links from homepage to content layer | 0 | 8 (section + footer) |
| Image payload | ~11 MB | **3.2 MB** (−71%) |
| Garbage-URL behavior | soft-200 homepage duplicates | real 404 + branded recovery page |
| Trailing-slash/entry variants | 200 duplicates | 301 canonicalized |
| Audio crawlability | blocked + no schema | open + X-Robots-Tag guarded |

**Visibility trajectory — what to watch (cannot be read from this sandbox; GSC access required):**
1. GSC Coverage: 17 new URLs "Indexed" within ~2–4 weeks of deploy.
2. Rich results: video marks appearing for the 7 case-study URLs; sitelinks/breadcrumbs on brand.
3. Query trajectory: impressions first (2–6 weeks) for "horror composer for hire", "horror film
   score cost", "dark ambient film composer", technique terms ("motif stalking", "sub-drop",
   "psychophonic"), film-title queries ("Mike Has A Visitor score", "The Haunted teaser music").
4. Clicks/inquiries: contact CTA from guides within the first full month post-indexation.
5. Brand SERP: knowledge-panel inputs consolidate (Person @id + sameAs: IMDb, Spotify, Bandcamp,
   Apple Music, YouTube, LinkedIn, Linktr.ee).

---

## 5. Residual risks & competitive counters (owned, not hedged)

- **Bundle edits are surgical, not source-level.** The React bundle (`index-daKuu3pI.js`) was
  edited post-build (footer links ×2, one section node). Syntax-validated; if the site is ever
  rebuilt from source, `src/components/Footer.tsx`, a new `InsideScore` section, and the prerender
  pipeline (`tools/`) must be ported. All generator code ships in `tools/` for exactly that.
- **Audio is large.** 29 MP3s (91 MB) are now crawlable but schema-described, header-noindexed,
  and not in the sitemap; if audio pages are ever wanted as landing pages, generate per-cue pages
  from `tools/works_data.py`-style data rather than exposing raw files to index.
- **Competitive counters to expect:** content farms will clone lexicon-style glossaries — the moat
  is that every term cross-links to a real showreel cue and a real scored film; directories
  (SoundBetter et al.) will keep outranking single-site rate pages for generic "hire" heads — the
  cost guide targets the long-tail ("how much does a horror short film score cost"), where intent
  converts and authority compounds. Continue digital PR (the existing Billboard Wire / Limitless
  press pipeline) pointing at `/lexicon/` or `/work/` — one high-signal music-tech or film-craft
  link per quarter maintains the gap.
- **No analytics/Search Console access from this environment.** Deploy-side: submit the new
  sitemap in GSC (it is auto-referenced in robots.txt), request indexing for the Lexicon and the
  cost guide first (fastest authority feedback loop), then the work hub.

## 6. Decisions that genuinely require human judgment

1. **Google Search Console verification** (if not already done) + one-time sitemap resubmission —
   requires account access.
2. **Named testimonials.** The four collaborator quotes are anonymous; if any director will allow
   a named credit, re-adding review markup becomes eligible and materially strengthens E-E-A-T.
   Do not re-add markup until then.
3. **Press-grade audio excerpts page** (per-cue landing pages with AudioObject schema) — high
   value, but it exposes the full cue catalog to per-URL scrutiny; a rights/positioning call, not
   an SEO call. Recommended within Q4 if the catalog is cleared for public embedding.
4. **Backlink acquisition** (film-festival blogs, horror-press features, game-audio communities) —
   the site-side work is done; outreach is a human-relationship campaign and stays out of scope
   per the no-spam doctrine.

## 7. File manifest (this branch)

```
new      tools/sitegen.py, tools/works_data.py, tools/build_works.py, tools/build_other.py
new      site-20260916.css, site-404.css, 404.html
new      work/index.html + 12 × work/{slug}/index.html
new      lexicon/index.html, guides/horror-film-score-cost/index.html,
         guides/hire-a-horror-composer/index.html, press/index.html
mod      index.html (meta, schema surgery, Inside-the-score section, footer links, alts)
mod      index-daKuu3pI.js (footer links, #inside node — node --check clean)
mod      sitemap.xml (18 URLs, images + videos with dates/durations)
mod      robots.txt, _headers, _redirects
mod      images/* (recompressed; −7.8 MB total)
```

**Aesthetic integrity: unchanged.** Zero visual changes to the homepage above the fold, the
showreel, or any existing section; every new surface reuses the site's own palette, type, and
voice. The horror is intact. Now it ranks.
