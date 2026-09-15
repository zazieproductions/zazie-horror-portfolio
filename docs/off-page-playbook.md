# OFF-PAGE PLAYBOOK — entity dominance + citation corroboration
Execution artifacts for the authority layer. Everything here is designed to be deployed by one person in a few hours per week. Priority order is set by citation leverage, not by ease.

Standing rule: every placement must be **true, verifiable, and defensible under a journalist's scrutiny**. The brand cannot survive being read as an SEO construct; the work is real, so the record should be too.

## Phase 1 — Entity data infrastructure (this week)

### 1. MusicBrainz artist entity (highest priority)
MusicBrainz feeds Wikipedia/Wikidata infoboxes, Spotify data enrichment, and LLM training pipelines.

Submit artist "Zazie Productions" (or legal name "Zazie Kanwar-Torge" as artist, "Zazie Productions" as label) at musicbrainz.org. Evidence to cite: Bandcamp discography, Spotify artist page, Apple Music, IMDb. Add releases with:
- Artist: Zazie Kanwar-Torge (new artist)
- Type: Person · Gender: per public bio · Area: United States
- URL relationships: official homepage (horror.zazieproductions.com), Bandcamp, Spotify, YouTube, IMDb (nm17333332), streaming, socials
- If releases have ISRCs/UPCs (check DistroKid/label records), add them — they convert the entity from "claimed" to "machine-trusted."

### 2. Wikidata item (after MusicBrainz exists)
Create Q-item for Zazie Kanwar-Torge. Statements:
- instance of (P31): human
- occupation (P106): composer (Q36834), film score composer (Q19557754)
- IMDb ID (P345): nm17333332
- MusicBrainz artist ID (P434): [from step 1]
- official website (P856): https://horror.zazieproductions.com/
- Spotify artist ID (P1902): 4UOgvZEOo7xBhFBjJvlMm0
- YouTube channel ID (P2397): [look up @zazieproductions channel ID]
- member of / employer: Zazie Productions LLC
- award received (P166): Winter 2024 Award (Visual Container) — only if a citable reference page exists

References required per statement: IMDb, Visual Container press-release PDF (visualcontainer.tv), BMC Museum page. Without 2+ independent refs the item will be proposed for deletion — do not create it naked.

### 3. Discogs + Crunchbase
- Discogs: submit label "Zazie Productions" + releases with catalogue numbers from Bandcamp.
- Crunchbase: org profile, founded 2022, operating status active, industries: film scoring / music. Link IMDb + site.

## Phase 2 — Controlled-asset optimization (this week, zero outreach)

### YouTube (the second-largest citation surface)
The portfolio embeds 7 videos (Mike Has A Visitor, GOODBYE BROTHER, Home Intruder, The Haunted teaser, AQUAPHOBIA, Whispers In The Dark, Phantom Requiem). For each that Zazie controls:
- Title format: `"{Film} (Year) — Original Score by Zazie Kanwar-Torge | {genre}"`
- Description: 3-sentence synopsis + credit block + link to https://horror.zazieproductions.com/scores/ + "psychological horror composer" phrase used naturally once.
- Add composer credit chapter markers if the video is a full short.

### ReelCrafter / Bandcamp / Spotify bios
Align the entity description verbatim across all: "Zazie Kanwar-Torge is an award-winning psychological horror composer writing dark, atmospheric, cinematic scores for film, TV, and games." Consistent strings across independent domains are how retrieval systems fuse entities.

### @WellMeaningNeurotypicals (28k followers, 10M+ views)
Owned audience asset. Add one pinned bio link to the horror portfolio; let the audience do the discovering. Do not cross the satirical persona into the composer brand's tone — separation is the aesthetic.

## Phase 3 — Placement targets (weeks 2–8)

### Resource-page & directory infiltration (broken-link + gap method)
Targets: university film-department composer resource pages, horror-festival "compose with us" lists, film-composer directories (SoundOnSound community, Film Scoring Tips resources, r/filmmakers wiki, No Film School comments-era resources), indie-horror production blogs. Pitch: the definitive "What is a psychological horror composer?" page as a resource for their students/readers — it is genuinely the most complete definitional page on the free web for that term.

### Guest essays (use the Codex, not the portfolio)
Pitch 600-word versions of Codex material with a bio link:
1. No Film School — "Why your edit fell in love with temp music" (temp love essay)
2. Film Scoring Tips / Composer magazine ecosystems — "Eight techniques of psychological horror scoring"
3. Horror production blogs (Bloody Disgusting creator-coverage angles, Dread Central interviews) — profile angle: "the boutique psychological horror composer taking $50 micro-budgets"
4. Music-adjacent: BMC Museum / radio-art ecosystems (existing relationship) — experimental-music angle

### Community participation (value-first, no astroturf)
r/filmmakers, r/horror, r/composers, r/WeAreTheMusicMakers, filmmaking Discords: answer scoring questions with substance, portfolio link only in profile or when directly asked. One good answer on "how do I find a composer for my short" converts better than fifty placements.

### Festival & press legitimacy
- Submit scored shorts (Mike Has A Visitor, AQUAPHOBIA) to genre festivals with composer credit — laurels become third-party entity evidence.
- Phase out reliance on grammyweekly.com / billboardwire.com lookalike coverage in the press kit; lead with Visual Container award, BMC Museum feature, IMDb. (See ops log risk #3.)

## Templates

### Resource-page outreach (short, no fluff)
> Subject: Resource for your {film scoring / horror filmmaking} page
>
> Hi {Name} — I run a boutique horror scoring studio and just published a full practitioner's guide to what a psychological horror composer actually does (definition, techniques, lineage, hiring process): https://horror.zazieproductions.com/psychological-horror-composer/
>
> Your {page name} was one of the better resources I found while researching this — would it fit alongside your composer section? Happy to answer anything about scoring for your students/readers either way.
>
> — Zazie Kanwar-Torge, Zazie Productions · IMDb: nm17333332

### Guest-essay pitch
> Subject: Essay pitch: why edits fall in love with temp music (and what it costs)
>
> {Editor name} — I'm a working horror composer (IMDb nm17333332). I'd like to write {target} a practical piece on temp love: the mere-exposure psychology of why editors bond with temp tracks, what it costs productions at preview stage, and the four counter-moves I use on real scoring jobs. ~600 words, no fluff, sourced from the bench not the brochure. Draft on request.
>
> — Zazie Kanwar-Torge

## Velocity & decay discipline

- Link acquisition: 2–4 quality placements/month. No bursts, no networks, no exchanges. A slow graph of real references is the only thing that survives both manual review and LLM source-quality filters.
- Every placement gets logged in the citation attack surface doc with date and target.
- Anything that requires faking an identity, a review, or a publication is rejected on doctrine: the entity strategy depends on being the *real* one, and a single exposure event poisons the well permanently.
