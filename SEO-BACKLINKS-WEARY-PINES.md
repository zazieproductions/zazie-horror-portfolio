# Backlink & citation research: wearypines.com

**Target page:** `https://wearypines.com/hire-a-composer/` (“Hire a Horror Composer — Weary Pines”)
**Target domain:** `wearypines.com`
**Why:** it is the #1 organic and generative-engine result for **“hire a horror composer”** — the query our
`/hire-a-composer` pillar must beat.
**Research date:** 2026-10-22 · **Branch:** `arena/8450f625-zazie-horror-portfolio`
**Companion:** [SEO-COMPETITOR-AUDIT-WEARY-PINES.md](SEO-COMPETITOR-AUDIT-WEARY-PINES.md) (on-page / architecture audit)

---

## 0. TL;DR — five findings

1. **Their money page has zero backlinks.** Not a single external page found anywhere links to
   `wearypines.com/hire-a-composer/` (or quotes its URL). It has also **never been captured by the Wayback
   Machine** (CDX query returns `[]`, re-checked 2026-10-22). Every profile CTA points at the homepage or a
   lead magnet — `/hello`, `/contact`, `/freecd`, `/spooky-content`, `/launch`, `/spacevoyage` — never the
   hire page. It ranks on **domain authority + entity + topical cluster + exact-match on-page**, not page-level links.
2. **The domain-level backlink profile is thin and beatable: ~7 linking domains found, and only ONE is
   editorial** (a 2020 Horror Bound review). Everything else is a self-made profile layer: Bandcamp,
   SoundCloud, Linktree, YouTube, X, LinkedIn.
3. **The real moat is entity corroboration, not links.** “Weary Pines” is a verified composer entity on
   IMDb, Wikipedia infoboxes (*In Search of Darkness*, *In Search of Tomorrow*), Letterboxd, MusicBrainz,
   Discogs, streaming stores, and podcast credits (Minds of Madness). That is what LLMs cite (GEO) and what
   Google associates with the phrase “horror composer”.
4. **Their link equity is deliberately (or accidentally) aimed at lead magnets**, especially the free-score
   funnel (`/hello`, `/freecd`, `/listen`, `/spooky-content`). Nobody links at the commercial page —
   that is an opening we can take.
5. **There is rot in their profile layer:** the SoundCloud “NEW ALBUM” button points at
   `fanlink.to/wearypines`, which is now a hijacked spam page (“Brand not found” on a Thai gambling/fitness
   store). Small, but it shows the profile layer is not being maintained.

**Bottom line:** this is not a link moat. A focused 90-day campaign can reach link parity; page-level links
to our `/hire-a-composer` and one or two genuine editorial placements would put us *ahead* of their page-level
profile. The harder half of the job is entity parity (IMDb/Wikipedia/credits corroboration) — see §6.

---

## 1. Method & honesty box

| Method | What it proves | Coverage |
|---|---|---|
| Direct fetch of candidate pages | Live hyperlink markup (`[text](url)`) inspected on the linking page | Strongest evidence; used for every “verified” row below |
| Exact-URL search (`"wearypines.com/hello"` etc.) | Pages whose content quotes a target URL | Finds linkers and mentions; link markup not always inspectable (bot walls) |
| Brand/entity search (`"Weary Pines" composer…`) | Citation layer: who names them and where | Good for entity map; not a link graph |
| GitHub code search (`wearypines.com`) | Technical backlinks in public repos | Only hit: our own audit (PR #67) |
| Wayback CDX API | Page history / age signals | `hire-a-composer`: 0 captures; domain: live since 2018-08-08 |
| Reverse-link engines (Mojeek `link:`, DDG, Bing, backlinktest) | Would show indexed backlinks | **All failed** this session: captcha, HTTP 500, poisoned SERP, or shut down |

**Not available in this session:** Ahrefs, Semrush, Majestic, Moz, GSC — therefore **no counts of referring
domains, anchors, or traffic are claimed**. Everything below is a **verified floor**: the links and mentions
that could be proven by fetching the source. The true graph is a superset.

Verification levels used in tables:

- **FETCHED** — page fetched 2026-10-22; hyperlink markup to `wearypines.com` seen.
- **SNIPPET** — search result content quotes the URL; markup not directly inspected (bot wall).
- **MENTION** — fetched or snippet-confirmed plain-text mention, no hyperlink seen.
- **UNVERIFIED** — presence known, link field not inspected.

---

## 2. Verified backlinks to wearypines.com

### 2a. Confirmed hyperlink sources (FETCHED)

| # | Linking page | Target URL | Anchor / context | Link notes | Level |
|---|---|---|---|---|---|
| 1 | [wearypineshorror.bandcamp.com](https://wearypineshorror.bandcamp.com/) (label profile, shown sitewide on all Bandcamp pages) | `https://wearypines.com/` | `wearypines.com` | Profile “website” link; high-DA platform | FETCHED |
| 2 | [soundcloud.com/wearypines](https://soundcloud.com/wearypines) profile links block | `https://wearypines.com/` | `WEBSITE` | Sidebar link block | FETCHED |
| 3 | same SoundCloud profile | `http://wearypines.com/contact` | `HIRE US` | **http://**, points at `/contact`, not the hire page | FETCHED |
| 4 | same SoundCloud profile (bio) + set descriptions | `https://wearypines.com/hello` | `wearypines.com/hello` | Lead-magnet URL | FETCHED |
| 5 | [linktr.ee/wearypines](https://linktr.ee/wearypines) | `https://wearypines.com/launch` | `IN SEARCH OF TOMORROW VINYL CD SCORE (BUY NOW)` | Linktree CTA | FETCHED |
| 6 | same Linktree | `https://wearypines.com/product/in-search-of-tomorrow-score-digital` | `IN SEARCH OF TOMORROW DIGITAL SCORE (BUY NOW)` | | FETCHED |
| 7 | same Linktree | `https://wearypines.com/spacevoyage` | `JOIN OUR FREE SPACE VOYAGE EXPERIENCE (FREE ALBUM)` | Lead magnet | FETCHED |
| 8 | [horrorbound.net — “A Review of In Search of Darkness” (2020-06-26)](https://www.horrorbound.net/blog/2020/6/26/a-review-of-in-search-of-darkness) | `https://wearypines.com/` | `Weary Pines` (“the score was provided by Ireland based music production company Weary Pines”) | **The only editorial backlink found.** Squarespace review site, in-copy link | FETCHED |
| 9 | [youtube.com/@wearypines](https://www.youtube.com/@wearypines) channel About → Links module | `https://wearypines.com/spooky-content` | `WEARY PINES` | YouTube redirect wrapper; channel joined Jan 21, 2018 | FETCHED |

### 2b. Profile-layer links (SNIPPET — URL confirmed in page content, markup not inspected)

| # | Source | Target URL | Context | Level |
|---|---|---|---|---|
| 10 | YouTube video descriptions (e.g. `watch?v=7SBhbKCHAa0` ISOD Pt.2 full score; `watch?v=xKmHm4sojnE` ISOD full score) | `https://wearypines.com/freecd`, `https://wearypines.com/listen`-era funnels | “Simply pop over to https://wearypines.com/freecd” | SNIPPET |
| 11 | [x.com/wearypines](https://x.com/wearypines) profile + tweets | `wearypines.com/hello`, `wearypines.com/listen`, `wearypines.com/product/…` | Website field + “LINK IN BIO” tweets | SNIPPET (nofollow platform) |
| 12 | [linkedin.com/in/jamiechambersmusic](https://www.linkedin.com/in/jamiechambersmusic/) | `https://wearypines.com/` | Jamie Chambers profile “website” field (he is SFX Lead at Uppbeat) | SNIPPET (nofollow platform) |

**Not-inspected but near-certain profile links (UNVERIFIED):** Facebook (`facebook.com/wearypines` — video
description says “pop over to our website”), Instagram (`instagram.com/wearypines` — bio).

### 2c. Dead / degraded link

| Source | Target | Status |
|---|---|---|
| SoundCloud “NEW ALBUM” sidebar button | `https://fanlink.to/wearypines` | **Rot.** fanlink.to now serves a hijacked spam store (“Brand not found”). Smart-link is gone; the button is a broken funnel. |

### 2d. Backlinks to `/hire-a-composer/` specifically

| Check | Result |
|---|---|
| Exact-URL search for `"wearypines.com/hire-a-composer"` | Only hit: **our own** PR #67 / audit in `zazieproductions/zazie-horror-portfolio` |
| GitHub code search for `wearypines.com` | Only hit: our audit file |
| Wayback CDX for `wearypines.com/hire-a-composer/` | `[]` — never captured |
| Profile CTAs (Bandcamp, SoundCloud, Linktree, YouTube, X, LinkedIn) | None point at `/hire-a-composer/` |

**Conclusion:** external page-level link equity to their money page ≈ **zero**. Its ranking is inherited from
the domain and the entity cluster.

### 2e. Domain age signals (for context)

- Wayback: `wearypines.com` captured **2018-08-08** (earliest), consistent captures since.
- YouTube channel created **Jan 21, 2018** (136 subs, 34 videos — tiny channel).
- MusicBrainz begin date **2018-01-02** (Derry). “Established 2019” claimed on site.

---

## 3. Citation layer — unlinked mentions & entity corroboration (this is the GEO moat)

These pages name “Weary Pines” as composer but (where inspected) do **not** hyperlink to the site. They are
still the corpus generative engines quote, and they are the strongest “association with horror scoring”
signals Google has.

| Source | What it says | Link? |
|---|---|---|
| [IMDb `nm11043376` “Weary Pines”](https://www.imdb.com/name/nm11043376/) | Composer entity: *Treatment*, *Dinah*, *In Search of Tomorrow*, ISOD I–III, *Ossesione*, *Camp Butcher*, *The Breakwater*, … 1 win & 1 nomination | No external link seen (FETCHED) |
| IMDb `fullcredits` for ISOD films | “Composer: Weary Pines” | credit only |
| Wikipedia — *In Search of Darkness* & *In Search of Tomorrow* | Infobox **“Music by: Weary Pines”** on both films | no outbound site link |
| Letterboxd (ISOD I & II pages) | “Composer: Weary Pines” crew listing | plain text |
| **Minds of Madness** “Who Killed Jennifer?” 4-part series (2024) + Apple Podcasts, Audible, LiSTNR, podtail, audioboom | “Theme music produced for this series – Weary Pines” in every episode’s credits | **Unlinked** on the podcast site (the adjacent link goes to `sicktanick.com`) and on all platforms |
| [indiemacuser.com ISOD review (2019)](https://indiemacuser.com/2019/10/28/review-in-search-of-darkness-the-definitive-80s-horror-documentary/) | “reflectively 80s music from Weary Pines” | plain text (FETCHED) |
| [MusicBrainz artist](https://musicbrainz.org/artist/cc402245-3ce9-4a73-aa00-46321c11159f) | Entity + 3 official release groups | no URL relationship seen |
| [Discogs artist 8837959](https://www.discogs.com/artist/8837959-Weary-Pines) | 3 releases (ISOD Score, ISOD Pt.2, ISOT) | “Websites” field unverified (Cloudflare) |
| Uppbeat — [artist page](https://uppbeat.io/browse/artist/weary-pines) + 13 tracks/SFX + curated collections (“Haunted Atmospheres”, “Cinematic Jump Scares”, horror SFX categories) | Full royalty-free horror library presence (Jamie is Uppbeat’s SFX Lead) | platform-internal |
| SoundBetter — `soundbetter.com/s/weary-pines` (“worked with Weary Pines”) + [Jamie Chambers profile](https://www.soundbetter.com/profiles/42969-jamie-chambers) | Marketplace presence; profile lists Weary Pines as credit; genre: “Alternative Pop and 80s horror” | citation |
| Streaming stores (Spotify, Apple Music, Deezer, Amazon Music, iHeart, Tidal…) | Artist pages for scores, ℗ Weary Pines Farm | citations |
| MuckRack, BestEverAlbums | release mentions | citations |
| X: retweets/mentions by ISOD director David Weiner et al. | brand buzz 2019–2023 | nofollow |

---

## 4. What is actually powering their #1 for “hire a horror composer”

Stacking this research on top of the competitor audit:

1. **Exact-match page + clean intent match** — H1 “HIRE A HORROR COMPOSER”, title “Hire a Horror Composer
   for Film, TV & Games”, FAQ answers the query directly (audit §2–3).
2. **Entity authority** — IMDb/Wikipedia/streaming/podcast credits make “Weary Pines ↔ horror scoring ↔
   In Search of Darkness” a corroborated fact across the web. LLMs answer “hire a horror composer” by
   summarizing that corpus; they are the only studio with this corroboration.
3. **Domain age & consistency** — live since 2018, one topic throughout.
4. **Cluster/internal architecture** — 33-URL Yoast sitemap, licensing hub + spokes (audit §4).
5. **Backlinks** — last, and the weakest leg: ~7 linking domains, 1 editorial link, 0 to the money page.

---

## 5. What we must not over-read

- No traffic, anchor distribution, or referring-domain totals are claimed — no tool in this session could
  measure them. The inventory is a **floor**; forums, directories and regional listings may exist unobserved.
- Nofollow profile links (X, LinkedIn, YouTube redirect) still matter for entity/GEO even if discounted for PageRank.
- One editorial link from 2020 does not mean “easy to rank” by itself — the entity layer does the heavy lifting.

---

## 6. Link-gap plan: beating them (mapped to zazie-horror-portfolio)

### 6a. Parity plays — replicate every piece of their profile layer (one afternoon each)

| Their asset | Our equivalent action | Notes |
|---|---|---|
| Bandcamp label w/ website link | Create/claim **Bandcamp artist+label** for Zazie Kanwar-Torge / Zazie Productions with website field → `zazieproductions.com` (or live domain), scores/releases attached | Highest-DA link in their profile; directly replicable |
| SoundCloud profile (3 links) | SoundCloud profile with **website + hire CTA links → `/hire-a-composer`** | Point CTAs at the money page — they never did |
| Linktree | Linktree (or better: our own `/links` page) with CTAs → `/hire-a-composer`, `/services`, `/contact` | |
| YouTube channel links + descriptions | Channel About link → `/hire-a-composer`; every upload description links the pillar | Their channel is tiny (136 subs) — the bar is low |
| X / LinkedIn website fields | Set website fields → `/hire-a-composer` (not homepage) | |
| MusicBrainz / Discogs entities | Create MusicBrainz artist + Discogs artist with **URL relationship → site** (MusicBrainz URL relationships are cited by knowledge graphs) | Their MusicBrainz has *no* URL relationship — free win |
| SoundBetter / marketplace profiles | SoundBetter, AirGigs, Music Gateway, Fiverr Pro, ProductionHUB profiles citing credits + site | Their SoundBetter is via Jamie’s personal profile |
| IMDb `nm11043376` | **Claim every credit for Zazie on IMDb** (audit §11) and set the official site on the name page (IMDbPro) | IMDb entity is the GEO keystone |

### 6b. Leapfrog plays — things they do NOT have

1. **Page-level links to `/hire-a-composer`.** Their money page has zero. Earn even 3–5 genuine links
   (guest articles, podcast show-notes, festival/programme pages, film-school resources) pointed **at the
   pillar URL** with anchors like “hire a horror composer” / “horror composer for hire” and we win the
   page-level comparison outright.
2. **Editorial links on our credited works.** Horror Bound-style review links exist for ISOD; our credits
   (*Mike Has a Visitor*, *Phantom Requiem*, *Beyond The Silken Threads*, *Deaf Orphans of Streamcast*, audit
   §7) are unexploited. Ask each production’s press page/reviewer for a “music by Zazie Kanwar-Torge” link
   to the pillar.
3. **A linkable lead magnet that isn’t a free mp3 dump.** Their funnel is free scores; a *pricing guide*
   (“What does a horror score cost?” — audit recommendation #4) or a short “horror scoring for indie games”
   guide earns links from filmmaking/game-dev blogs that never link a music store.
4. **Structured `sameAs` + `Person` schema done right** on our composer entity page (audit §8) so LLMs have
   one canonical entity to cite.
5. **Podcast theme/credit placements.** The Minds of Madness credit shows the pattern: true-crime/horror
   podcasts commission themes and print “Music by …” in every episode’s notes on high-DA platforms
   (Apple Podcasts, Spotify, Audible). Two or three unpaid/low-paid theme credits for horror-adjacent
   podcasts = recurring citations LLMs already quote.
6. **GEO corpus seeding.** Wikipedia-notable is out of reach for now, but Letterboxd crew pages, MusicBrainz,
   Discogs, TV/composer databases, and our own `llms.txt`/`llms-full.txt` (already shipped) feed the models.

### 6c. Suggested 30-day order of operations

1. Profile layer (§6a) — Bandcamp, SoundCloud, MusicBrainz, Discogs, YouTube About, social website fields.
2. IMDb credit claiming + official-site link (slow-moving; start now).
3. One linkable asset (pricing guide or cost page) + outreach to 10 horror-film blogs/podcasts.
4. Direct asks: 3–5 page-level links to `/hire-a-composer` from productions, collaborators, film-school pages.
5. Re-run this inventory’s queries against ourselves quarterly (appendix §7).

---

## 7. Appendix — re-verification queries

Run these to refresh the inventory (all were used 2026-10-22):

- `"wearypines.com"` and `"wearypines.com/hire-a-composer"` (exact-URL searches)
- `"wearypines.com/listen" OR "wearypines.com/freecd" OR "wearypines.com/hello"`
- `"Weary Pines" composer "In Search of Darkness"` · `"Weary Pines" podcast interview`
- `"hire a horror composer"` (SERP landscape)
- GitHub code search: `wearypines.com`
- Wayback CDX: `https://web.archive.org/cdx/search/cdx?url=wearypines.com/hire-a-composer/&output=json`
- Fetch-audit any candidate page and grep for `](https://wearypines.com`

When Ahrefs/Semrush/Majestic access exists: export referring domains + anchors for `wearypines.com/*` and
diff against this file; also pull the same export for our domain and track the gap monthly.
