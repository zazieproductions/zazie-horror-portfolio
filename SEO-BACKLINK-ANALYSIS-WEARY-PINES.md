# Backlink Analysis — wearypines.com
### The off-page evidence the 2026-10-04 audit could not measure
**Analysis date:** 2026-10-22 · **Branch:** `arena/b09afaff-zazie-horror-portfolio`
**Subject domain:** https://wearypines.com (Weary Pines — Jamie Chambers + Don McLennan Jr, UK)
**Our domain:** https://horror.zazieproductions.com (Zazie Productions LLC)
**Companion document:** `SEO-COMPETITOR-AUDIT-WEARY-PINES.md` (on-page, architecture, entity and roadmap teardown). That audit states explicitly: *"No claim below is made about backlink counts, domain authority scores, or traffic volumes."* This file fills that gap with the tools available in this session — and is equally explicit about what still cannot be measured.

---

## 1. How this was produced, and what it can and cannot prove

| Method | What it establishes | What it cannot establish |
|---|---|---|
| Brand/URL mention mining via general web search (~20 query families: exact domain, brand + interview/review/podcast/festival, credit titles, platform names) | A candidate universe of pages that mention or link the brand | Search-engine index coverage, not crawl completeness; mentions on platforms that block indexing are invisible |
| Direct page fetch and reading of the rendered HTML/markdown for every material candidate | Whether "Weary Pines" is a **hyperlink**, an **unlinked mention**, or **absent**; page context and anchor shape | Exact `rel="nofollow"`/sponsored status in every case (rendered markdown strips some link attributes — follow status is therefore not asserted except where stated) |
| Open-data entity lookup (MusicBrainz, Wikidata, IMDb, Discogs, Letterboxd) | Entity-graph membership and official-URL relations | Third-party authority *scores* (DR/DA) |
| GitHub code search via authenticated API (`gh api search/code`) | Whether the domain appears in public repositories | The non-GitHub web |
| Tool-access probes (Semrush free web endpoint, Bing exact-match, DuckDuckGo HTML endpoint) | Documented in §8 — all failed or returned junk in this session | Any commercial-index metric |

**The honest headline limitation.** No Ahrefs, Semrush, Majestic, Moz or SimilarWeb index was accessible. There is therefore **no referring-domain count, no authority score, no traffic estimate, and no claim of completeness** in this document. What follows is a *manually verified inventory floor*: every link and mention below was individually opened or returned in indexed content on 2026-10-22. A commercial crawl would almost certainly surface additional low-value links (blog comments, scraper sites, expired profiles); it is unlikely to overturn the profile's *shape*, because the shape is visible in the entity mesh itself.

**Confidence labels:** **Verified** = page fetched and the link/mention read directly. **Evidenced** = returned consistently in indexed content/snippets but not independently fetched. **Negative** = searched for and not found (evidence of absence, not proof).

---

## 2. Executive summary — the six findings that matter

1. **The link profile is small, clean and almost entirely self-controlled.** Manually verified or strongly evidenced hyperlinks sit on **nine domains**, and **seven of the nine are profiles the duo created themselves** (Bandcamp, SoundCloud, LinkedIn, X, Facebook, Instagram, YouTube). Only **two hyperlinks are independent of their own accounts**: one editorial review on **horrorbound.net** and one open-data official-URL relation on **MusicBrainz**. There are no PBNs, no paid directories, no guest-post farms, no press-release wires, no `.edu`/`.gov` links, and no forum-signature spam anywhere in the visible footprint. (Confidence: high on shape, medium on completeness.)
2. **Their ranking is not being bought with links — it is an entity-graph win.** Around **20 additional high-trust domains** carry Weary Pines as a *named composer entity* without linking the site at all: IMDb, Wikipedia (three articles, plain text), Letterboxd, FilmAffinity, Radio Times, FilmBooster, Discogs, Spotify, Apple Music, Deezer, Amazon Music, Napster, iHeartRadio, Genius, Uppbeat, Music Vine, SoundBetter, BestEverAlbums. Google can reconcile "Weary Pines = composer of these specific films" from this mesh without a single followed vote. That, plus exact-match on-page targeting and a thin SERP, is the whole mechanism.
3. **The money page has no observed external links of its own.** No external page found links to `wearypines.com/hire-a-composer/`. Inbound links point at the root (or `/hello`, their lead-magnet path). The page that ranks for "hire a horror composer" does so on domain-level entity authority and phrase matching, not anchor-targeted link equity. Its anchor profile for commercial terms is effectively **zero**.
4. **Their biggest credits are unlinked — sometimes even uncredited.** The Steam and itch.io store pages for *I'm Counting to 6…* (EMIKA_GAMES, 724 Steam reviews) contain **no composer credit at all** (verified). The Minds of Madness podcast names them in show notes with **no link** (verified). The Wikipedia infoboxes say "Music by Weary Pines" as **plain text** on all three articles (verified). A historical soundtrack.net album citation now **redirects to an unrelated startup homepage**. They do not systematically convert credits into links — which means the industry-standard bar is low.
5. **There is no press, interview or listicle layer.** No horror-press coverage (Rue Morgue, Bloody Disgusting, Dread Central class), no composer interviews, no podcast guest appearances, no "best horror composers" listicles, no FilmFreeway or festival programme pages, and no GitHub/awesome-list mentions (the only GitHub hit for the domain is our own audit repository). The single editorial link found is from 2020. **This is the widest open lane for Zazie.**
6. **Brand collisions are quietly diluting them.** A separate New York folk-rock band also called **Weary Pines** exists on Bandcamp (2011) and in streaming metadata (a 2012 EP is mixed into iHeart/Genius results), while the TV show **Wayward Pines** dominates broad-match noise. Their brand SERP requires disambiguation effort. A distinctive artist name (Zazie Kanwar-Torge / Zazie Productions) does not.

**Strategic conclusion.** Weary Pines is beatable on links precisely because they are not competing on links. A disciplined programme of (a) entity parity on the same open platforms, (b) systematic credit-link recovery on work already delivered, and (c) a small number of genuine editorial features would produce a *more relevant* link profile than theirs within 90 days — without buying anything.

---

## 3. Verified linking domains (actual hyperlinks to wearypines.com)

Access date for all entries: 2026-10-22. "Controlled by" distinguishes self-created profile links from independent editorial votes.

| # | Domain / URL | Link context and anchor | Controlled by | Link value assessment | Confidence |
|---|---|---|---|---|---|
| 1 | **horrorbound.net** — `/blog/2020/6/26/a-review-of-in-search-of-darkness` | Inline contextual link in an editorial review: *"the score was provided by Ireland based music production company [Weary Pines](https://wearypines.com/)"*. Squarespace horror-culture blog, June 2020. Anchor = branded. | Independent | **Highest-value link in the profile**: genuine third-party editorial, topically relevant, natural anchor. Modest domain size, but the kind of link Google treats as a real vote. | **Verified** (page fetched; hyperlink read in rendered HTML) |
| 2 | **musicbrainz.org** — `/artist/cc402245-3ce9-4a73-aa00-46321c11159f` | Artist entity (est. 2018, Derry) with an **official homepage relationship** `http://wearypines.com/`, plus relations to Discogs, Facebook, SoundCloud and Bandcamp. | Semi-independent (open database, anyone can edit, relations are sourced) | High entity-reconciliation value on a trusted open-data domain that feeds many downstream music databases. Direct ranking weight is secondary to the graph signal. | **Verified** (relationships tab fetched) |
| 3 | **bandcamp.com** — `wearypineshorror.bandcamp.com` (artist page and every release) | Artist-links module shows `wearypines.com`; release-page JSON-LD repeatedly carries `"description":"http://wearypines.com"` (observed on *The Lakeside Killer*, *Weary Pines*, and the ISOD scores). | Self | Strong branded entity signal and real human traffic; profile-class link repeated across many URLs on one root domain (counts once as a referring domain). | **Verified** (multiple indexed captures incl. structured data) |
| 4 | **soundcloud.com** — `/wearypines` | Bio link `https://wearypines.com/hello` ("Would you like some free music?"). | Self | Profile link; primarily discovery/entity value. | **Evidenced** (indexed profile content) |
| 5 | **linkedin.com** — `/in/jamiechambersmusic` | "Company Website" field = `https://wearypines.com/`; profile JSON-LD `description` carries the URL. 260 connections, SFX Lead at Uppbeat since Aug 2022. | Self | Professional entity citation; also the likely explanation for the Uppbeat/Music Vine catalogue placement (see §5). | **Evidenced** (two independent indexed captures incl. structured data) |
| 6 | **x.com** — `/wearypines` | Profile website field = `wearypines.com/hello`; bio "ORIGINAL MUSIC FOR FILM & TELEVISION". | Self | Profile link; nofollow-class, brand-query reinforcement. | **Evidenced** (indexed profile content, multiple captures) |
| 7 | **facebook.com** — `/wearypines` | Business page exists; website field is the standard placement and the brand's own homepage `sameAs` graph lists this property. | Self | Profile link; value is entity consistency, not equity. | **Evidenced** (page indexed; website field not independently rendered) |
| 8 | **instagram.com** — `/wearypines` | Profile exists (listed in the site's own `sameAs`). Instagram bios are not crawlable HTML hyperlinks. | Self | Entity/citation only; effectively no traditional link value. | **Evidenced** (existence verified; link value assessed as nil) |
| 9 | **youtube.com** — `@wearypines` | Channel exists ("HORROR MUSIC PRODUCTION STUDIO BASED IN IRELAND"); about-page custom links not rendered in this session. | Self | Likely profile link, nofollow regardless; treat as entity. | **Evidenced** (channel verified; specific link not rendered) |

**Reading the table.** Nine domains with hyperlinks, but only #1 and #2 sit outside the duo's own account control. There is no second editorial link, no interview, no podcast, no directory, no festival, no production-company page and no marketplace profile that links out to the site. The profile would be described in commercial tool language as *low referring-domain volume, zero toxic/spam pattern, branded-anchor-only*.

---

## 4. Anchor and destination shape

- **Anchor text:** every observed link uses either the bare brand ("Weary Pines") or a bare URL (`wearypines.com`, `wearypines.com/hello`). **No commercial anchor** ("horror composer", "hire a composer", "film scoring") points at any page. They cannot be out-anchored on the money phrase because they were never anchored to it.
- **Destination distribution:** links resolve to the root or to `/hello` (the free-score lead magnet). **Zero observed external links to `/hire-a-composer/`**, the licensing hub, or any product page. Link equity is root-weighted; internal architecture (the Yoast hub-and-spoke cluster documented in the companion audit) redistributes it.
- **No follow-status arms race visible:** nothing in the footprint suggests paid or manipulated links. This is a profile Google has no reason to distrust — and also no reason to rank on link strength alone.

---

## 5. Entity-and-mention mesh (named on the page, no link to the site)

These pages reconcile Weary Pines as a *composer entity* without passing a hyperlink. This is the layer doing the real ranking work, and the layer Zazie must match first.

| Platform | Evidence (accessed 2026-10-22) | Link to wearypines.com? |
|---|---|---|
| **IMDb** — name `nm11043376` | 16 composer credits including *In Search of Darkness* I–III, *In Search of Tomorrow*, *Treatment*, *Dinah*, *Camp Butcher*, *The Breakwater*, *Ossesione*; 1 win & 1 nomination. Contact/agent detail is IMDbPro-gated. | No official-site link in the free render |
| **Wikipedia (EN)** — *In Search of Darkness*, *…Part II*, *In Search of Tomorrow` | Infobox "Music by | Weary Pines" on all three articles — **plain text, not hyperlinked** (verified article by article). Part III has no standalone article. | No (unlinked mention ×3) |
| **Wikidata** | Searched 2026-10-22: **no Weary Pines item exists** (only an unrelated geological-map result). | Gap — entity hole |
| **Letterboxd** — `/composer/weary-pines/` | Dedicated composer entity with 4 titles incl. *Rito de Resurrección* (2023, a credit not shown on their own reel). JSON-LD `Person`/`Movie` graph, no external composer URL. | No |
| **Discogs** — artist `8837959` | 3 self-released albums, "Not On Label (Weary Pines Self-released)". Artist URL section not populated in the public render (Cloudflare-gated on fetch). | No observed external URL |
| **FilmAffinity** | *In Search of Darkness* (`film330343`) and *…Part III* (`film316461`): "Music: Weary Pines". | No |
| **Radio Times** movie guide | *…Part III* crew table: "Composer | Weary Pines". | No |
| **FilmBooster** | *…Part III* overview: "Composer: Weary Pines". | No |
| **Uppbeat** — `/contributors/weary-pines` + dozens of track, collection and SFX category pages | Deepest commercial placement found: their tracks are woven into Uppbeat's horror categories and SFX library. **No outbound link to wearypines.com** on the contributor page (verified across full page render). Note: co-founder Jamie Chambers is Uppbeat's SFX Lead — an insider relationship, not an earned placement. | No |
| **Music Vine** — `/browse/artist/weary-pines` | 15 tracks with a bespoke bio; same catalogue (Uppbeat serves Music Vine CDN assets). All links internal. | No |
| **SoundBetter** — `/profiles/42969-jamie-chambers` | Jamie's personal marketplace profile, **11 verified client reviews**, Discogs-verified Weary Pines credits. Platform suppresses external contact. | No (by platform design) |
| **Spotify** — artist `70hW4WXiy5nt6hGi5dSdMx` | Artist profile; **464 monthly listeners** (small but real). About-page external links not renderable. | Not verified |
| **Apple Music** — artist `1433618420` | Full score catalogue incl. Pt. Three (2023). Public artist pages carry no external homepage field. | No |
| **Deezer** — artist `50393062`; **Amazon Music** (`B08C96SWSN`, 71-track score); **Napster** (GB); **iHeartRadio** (`artist/weary-pines-33475184`) | Standard streaming mirror catalogue, label "Weary Pines Farm". | No external homepage fields observed |
| **Genius** — `/artists/Weary-pines` | Artist page exists with four albums; **0 followers**, thin annotations. | No |
| **BestEverAlbums** — `thechart.php?a=186895` | Album chart entry, 74/100 from 1 vote; outbound links are affiliate (Amazon/eBay) and Spotify *search* URLs only. | No |
| **Minds of Madness podcast** — episode 201 page + Apple Podcasts show notes | "Theme music produced for this series - Weary Pines". Plain text on both surfaces (verified). | No |
| **Reddit** — r/Shudder thread (Jul 2023) | A comment **from the Weary Pines account itself** clarifying their hire on Part III. Reddit links are nofollow; this is self-promotion, not an earned mention. | No (and self-authored) |

### Credits where the link — or the credit itself — is missing

| Production | Surface | Finding | Confidence |
|---|---|---|---|
| *I'm Counting to 6…* (2024, EMIKA_GAMES) | Steam app `2717260` (724 reviews, 83% positive) | Full store page fetched: developer/publisher links only; **no composer credit anywhere**, including "About This Game". | **Verified negative** |
| Same title | itch.io `emika-games/im-counting-to-6` | Page fetched: no composer credit. | **Verified negative** |
| *In Search of Darkness* score (2019/2020) | soundtrack.net album page | Domain repurposed: the old URL now **302/redirects to soundtrakd.com's generic homepage**. The historical citation is dead. | **Verified** |
| Short films (*Treatment*, *Dinah*, *The Breakwater*, *Camp Butcher*, etc.) | FilmFreeway, festival programme sites | No project or festival pages naming Weary Pines found in targeted searches. | **Negative** (searched, not found) |
| Minds of Madness mini-series | Podcast site + Apple Podcasts | Named, not linked (above). | **Verified** |

### Name-collision inventory (brand-SERP drag)

- **Weary Pines (NY folk-rock band):** separate act on `wearypines.bandcamp.com` (4-track EP, 2011, tags: rock/folk/garage/jangle/post-punk) and a "Weary Pines EP, May 2012" appearing in iHeart/Genius catalogue results. Same brand name, different genre, different country.
- **"Wayward Pines" (Fox/Blumhouse TV series):** dominates broad and typo-tolerant brand searches (Reddit, Wikipedia, fan wikis). Every non-exact query costs them clarity.
- Implication for Zazie: a unique personal-name brand avoids this tax entirely; protect it with consistent `sameAs` wiring while the SERP is still uncluttered.

---

## 6. Negative evidence — what the footprint conspicuously lacks

Each item below was specifically searched for and not found. These are *gaps in their moat*, listed in priority order for exploitation.

1. **Independent editorial beyond one 2020 review.** No interviews, features, bylines, podcast-guest spots, or music-press reviews of the self-titled album or any score.
2. **"Best horror composer" listicles and resource pages.** No directory or guide inclusion beyond marketplaces they joined directly.
3. **Festival and competition pages.** No FilmFreeway project links, no festival laurels pages crediting them, despite an IMDb-listed award win for *Treatment*.
4. **Production-company links.** CreatorVC (the *In Search of* producer) and EMIKA_GAMES do not link them; neither do the podcast or YouTube channels they scored (Goodbadflicks exists only as a YouTube credit).
5. **Wikidata item and any Wikipedia external link.** Three Wikipedia mentions, zero clickable ones.
6. **Education, community or open-source links.** No talks, workshops, sample-pack community contributions, or forum resource threads.
7. **Any link aimed at a commercial page.** No anchor or destination supports the hire/license funnel directly.
8. **Recent link velocity signals.** The newest independent citation found is the 2024 podcast text credit; the only independent hyperlink is from 2020. The profile is essentially static.

---

## 7. Why they still outrank almost everything despite this

Link inventory is not the same as ranking mechanism. The companion audit's on-page findings combine with this off-page evidence into a coherent explanation:

1. **Entity resolution replaces link volume.** IMDb + MusicBrainz + the streaming mesh (a dozen databases carrying identical name/credit/label facts) let Google treat "Weary Pines" as a resolved, trusted composer entity with verifiable film credits. Entities can rank for exact-match queries on far fewer links than unknown brands need.
2. **Exact-match page on a thin commercial SERP.** The 2026-10-04 audit found the "hire a horror composer" SERP is marketplaces and forum threads — no independent composer service page competes. Their `/hire-a-composer/` says the phrase in title, H1, body and FAQ with almost no purpose-built opposition.
3. **Root-level equity is enough because the site is small.** A 33-URL cluster with tight internal linking means root authority reaches the money page in one hop; direct deep links are unnecessary at this scale.
4. **Brand-demand flywheel.** *In Search of Darkness* shipped on Shudder to a built-in horror audience; branded searches and direct visits reinforce the entity continuously. Links are a side effect they never optimised.
5. **No penalties to carry.** A small, clean, organic profile has no spam discount. Nothing has to be disavowed or rehabilitated.

The vulnerable assumption in that stack: **it only works while no credible competitor builds both the entity mesh and a handful of real editorial links.** That is the opening.

---

## 8. Tool-access log (so the limits are auditable)

| Tool / endpoint attempted | Result on 2026-10-22 |
|---|---|
| Semrush free web overview (`/website/wearypines.com/overview/`) | HTTP 200 but a "We got lost / page doesn't exist" marketing shell — no data rendered without app sign-up |
| Bing exact-match web search (`"wearypines.com"`) | Returned 10 irrelevant AI-generated apartment-site results; query effectively ignored — no usable link data |
| DuckDuckGo HTML endpoint (`html.duckduckgo.com/html/`) | HTTP 500, repeated |
| GitHub code search (authenticated `gh api search/code?q=wearypines.com`) | 1 hit — our own audit file in `zazieproductions/zazie-horror-portfolio`; zero third-party repositories |
| Direct fetch of ~30 candidate pages | Successful for all major platforms except Discogs (Cloudflare interstitial) and parts of IMDb (ad-blocker noise, but name/credit data rendered) |
| Ahrefs / Majestic / Moz / SimilarWeb | No accessible free tier for competitor domains in this environment |

**To get hard numbers later** (see §10): Google Search Console "Links" report and Bing Webmaster Tools "Backlinks" are free for sites you own; Ahrefs Webmaster Tools is free for verified own-domain monitoring; a 7-day Ahrefs/Semrush trial can snapshot competitor referring domains and anchor text for a fixed point in time.

---

## 9. Counter-plan — how Zazie builds a better profile than theirs

Principles inherited from the companion audit's off-page plan: only links a real person would genuinely earn, true credits only, nothing purchased, no PBNs, no mass guest posting. The difference here is sequencing against *their specific gaps*.

### 9.1 Match the entity mesh first (weeks 1–2, low effort, they did this piecemeal over years)

| Action | Why it beats/parity-matches Weary Pines | Notes |
|---|---|---|
| Create/claim the **MusicBrainz artist** and add an official-homepage relation to `horror.zazieproductions.com` | Exact same open-data relation they have; free, followed entity signal that feeds downstream databases | Use the existing IMDb `nm17333332` and release data as sources |
| Audit every existing profile (Bandcamp, Spotify, Apple, YouTube, SoundCloud, LinkedIn) so the **website field points at the canonical domain everywhere**, with identical NAP/brand spelling | Their streaming profiles mostly don't link out; ours should, consistently | Include the Linktree/Stage 32 refresh already queued in the companion audit |
| Complete **IMDb `nm17333332`** (bio, every qualifying credit, external links where IMDb permits) | Entity parity on the single strongest composer-trust database | Only true credits |
| Create a **Wikidata item** for the artist *once independent sourcing exists* (festival PDF, IMDb ID, MusicBrainz ID are acceptable references) | They have **no Wikidata item at all** — an immediate structural advantage available to us | Never self-promote unsourced statements; Wikidata editors reject them |
| Claim/create **Discogs, SoundBetter, ProductionHUB** profiles | SoundBetter is where Jamie himself competes (11 reviews) — the marketplace is proven, not saturated for horror specialists | Real reel, real credits; reviews gathered from actual collaborators |

### 9.2 Exploit the credit-link gap they leave open (weeks 2–6, highest ROI)

Their *I'm Counting to 6…* Steam page doesn't even name them. Zazie's nine productions are nine addressable opportunities they are systematically leaving on the table industry-wide:

1. **Delivery-time credit-link habit.** Every future delivery email includes a credit block: exact wording, IMDb link, and the URL of the matching `/work/<production>` case study (the case-study format is blueprinted in the companion audit §5.1). One ask, at the moment goodwill peaks.
2. **Retroactive sweep of the nine existing productions.** For each: director's site, production company site, FilmFreeway project page, festival programme page, YouTube/Vimeo description, Steam/itch pages where applicable. Ask for the composer credit **with a link** to the case-study URL. Target: at least one link per production.
3. **Anchor instruction, politely.** Where a page will name the role, request natural phrasing — "score by [Zazie Kanwar-Torge](…), horror composer" — rather than a bare URL. This builds the commercial-anchor profile Weary Pines entirely lacks.
4. **Podcast/channel credits.** Any podcast or YouTube work gets the same treatment in show notes (their Minds of Madness credit is linkless — show producers usually say yes when asked).

### 9.3 Win the editorial layer they never built (weeks 4–10, compounding)

| Tactic | Concrete target shapes | Why it works |
|---|---|---|
| **One genuine feature, then three** | Horror-culture blogs in the Horror Bound tier (they proved this tier accepts composer coverage), synth/film-music podcasts, regional horror-festival blogs | A single contextual editorial link outranks their entire self-controlled profile cluster in relevance terms |
| **Pitch the differentiator, not the genre** | Psychoacoustic instrument building, struck-metal/waterphone practice, experimental/arthue horror positioning (companion audit §11 Template C) | Weary Pines owns "80s synth duo"; that lane is taken, the sound-art lane is empty |
| **Publish citeable data** | The sliding-scale cost logic and a downloadable scoring scope sheet (already a journal brief in the companion audit §13) | Listicles and guides cite data; nobody else publishes real horror-scoring numbers |
| **Curated resource inclusion** | Horror-filmmaking resource pages, game-audio resource lists, student-film guides | Their zero-listicle footprint means every inclusion is net-new coverage for us |
| **Teaching/talks** | University film programmes, guild panels, festival workshops (Template D in the companion audit) | Earns `.edu`/organisation links — a domain type entirely absent from their profile |

### 9.4 Defensive notes specific to this competitor

- **Do not chase their Uppbeat/Music Vine placement.** It is an insider relationship (employee-led), platform links don't point out to artist sites anyway, and Zazie's licensing runs through `/store` + `/licensing` by design.
- **Do not replicate their volume play** (500+ Vault tracks, £9 self-serve). Compete on bespoke commission authority, not catalogue size.
- **Do not worry about their anchor text.** They have no commercial anchors; the first party to earn contextual "horror composer" links owns that signal in this niche.
- **Watch the `/hello` lead-magnet path.** Their strongest external links funnel to a free-download capture page, not the money page. Our equivalent funnels should point at `/hire-a-composer` and `/reel`, with tracking so link value is measurable.

---

## 10. Measurement plan (replace inference with numbers)

1. **Verify both domains in Google Search Console and Bing Webmaster Tools** (own-domain, free). GSC's Links report gives actual linking domains/pages/anchors for our site; Bing WMT includes a backlinks module.
2. **Ahrefs Webmaster Tools** (free for owned domains): ongoing RD trend, anchor cloud, broken inbound links — including alerting when the soundtrack.net-style decay happens to us.
3. **One timed commercial trial** (Ahrefs or Semrush, 7 days): snapshot Weary Pines' referring domains, DR, anchor distribution and top-linked pages once per quarter. Store the export in the repo as a dated record so this manual inventory gets a numerical baseline.
4. **Quarterly re-run of this document's method** (the §1 query set + entity-page audit) to detect new editorial links, new platform placements and any change to their Wikipedia/Wikidata status.
5. **Track our own leading indicators monthly:** entity pages completed, credit-link requests sent vs. placed, editorial features published, commercial-anchor links earned. Placements, not emails, are the metric.

---

## 11. 30 / 60 / 90-day link roadmap

### Days 0–30 — parity and plumbing
- [ ] MusicBrainz artist with official-homepage relation; cross-check Discogs/Wikidata eligibility
- [ ] Audit and normalise website fields across all existing profiles (Bandcamp, Spotify, Apple, YouTube, SoundCloud, LinkedIn, Stage 32)
- [ ] IMDb `nm17333332` completeness pass
- [ ] SoundBetter + ProductionHUB profiles created with the real reel
- [ ] GSC + Bing WMT + Ahrefs Webmaster Tools verification; baseline own-link report exported
- [ ] Credit-link request block added to the delivery email template

### Days 31–60 — convert credits into links
- [ ] Retroactive outreach to all nine productions' directors/producers (companion audit Template A)
- [ ] Two case-study pages live (dependency from the companion audit) so requests have linkable destinations
- [ ] First editorial pitch sent to five horror-culture/podcast targets with the sound-art angle
- [ ] Wikidata item created if sourcing threshold is met

### Days 61–90 — editorial and compounding
- [ ] First feature published and linked; three more pitches in pipeline
- [ ] Cost-data journal piece live as a citeable asset, offered to two guide/listicle authors
- [ ] One teaching/talk booked (university, guild or festival)
- [ ] First quarterly competitor snapshot via commercial trial; this document updated with hard RD/anchor numbers
- [ ] Review: linking domains earned vs. the nine-domain manual inventory documented here; target is **parity on entity coverage and superiority on independent editorial links within the quarter**

---

## 12. Evidence index (all accessed 2026-10-22)

**Independent hyperlink**
- Horror Bound review: https://www.horrorbound.net/blog/2020/6/26/a-review-of-in-search-of-darkness
- MusicBrainz artist (relationships): https://musicbrainz.org/artist/cc402245-3ce9-4a73-aa00-46321c11159f/relationships

**Self-controlled profile links**
- https://wearypineshorror.bandcamp.com/ · https://soundcloud.com/wearypines · https://www.linkedin.com/in/jamiechambersmusic/ · https://x.com/wearypines · https://www.facebook.com/wearypines/ · https://www.instagram.com/wearypines/ · https://www.youtube.com/@wearypines

**Entity mesh (unlinked)**
- https://www.imdb.com/name/nm11043376/ · https://letterboxd.com/composer/weary-pines/ · https://www.discogs.com/artist/8837959-Weary-Pines
- https://en.wikipedia.org/wiki/In_Search_of_Darkness · https://en.wikipedia.org/wiki/In_Search_of_Darkness:_Part_II · https://en.wikipedia.org/wiki/In_Search_of_Tomorrow
- https://www.filmaffinity.com/us/film330343.html · https://www.filmaffinity.com/en/film316461.html · https://www.radiotimes.com/movie-guide/b-bpl4ou/in-search-of-darkness-part-iii/ · https://www.filmbooster.com/film/1271754-in-search-of-darkness-part-iii/overview/
- https://uppbeat.io/contributors/weary-pines · https://musicvine.com/browse/artist/weary-pines · https://soundbetter.com/profiles/42969-jamie-chambers
- https://open.spotify.com/artist/70hW4WXiy5nt6hGi5dSdMx · https://music.apple.com/us/artist/weary-pines/1433618420 · https://www.deezer.com/en/artist/50393062 · https://www.amazon.com/Search-Darkness-Original-Score/dp/B08C96SWSN · https://gb.napster.com/artist/weary-pines · https://www.iheart.com/artist/weary-pines-33475184/ · https://genius.com/artists/Weary-pines · https://www.besteveralbums.com/thechart.php?a=186895

**Unlinked credits / dead links / collisions**
- https://www.mindsofmadnesspodcast.com/episode/8452614 (text credit only) · https://podcasts.apple.com/us/podcast/episode-201-who-killed-jennifer-part-1-of-4-a/id1191274361?i=1000644148647
- https://store.steampowered.com/app/2717260/Im_counting_to_6/ (no composer credit) · https://emika-games.itch.io/im-counting-to-6 (no composer credit)
- https://www.soundtrack.net/album/in-search-of-darkness-score/ (redirects to soundtrakd.com)
- Colliding band: https://wearypines.bandcamp.com/album/weary-pines
- Wikidata search confirming no item: https://www.wikidata.org/w/index.php?search=Weary+Pines&title=Special:Search

*End of backlink analysis. The on-page, architecture and roadmap evidence lives in `SEO-COMPETITOR-AUDIT-WEARY-PINES.md`; the two documents are intended to be read together.*
