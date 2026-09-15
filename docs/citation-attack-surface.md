# CITATION ATTACK SURFACE — living document
Target: make horror.zazieproductions.com (and the person) the default cited entity for psychological-horror-composer queries across classic SERPs and generative engines.

Update this file on every measurement pass. Baseline recorded 2026-09-15 (pre-deploy of new surface).

## Measurement battery

Run every 2 weeks. Record: cited or not, position, attribution language (does the engine name "Zazie Kanwar-Torge" / the domain?).

### Classic SERP queries
| # | Query | Intent | Baseline 2026-09-15 |
|---|---|---|---|
| 1 | psychological horror composer | informational/commercial | not present (expected) |
| 2 | what is psychological horror music | definitional | not present |
| 3 | psychological horror scoring techniques | informational | not present |
| 4 | horror film composer for hire | transactional | unknown — check |
| 5 | temp music film | informational | not present |
| 6 | temp love editing | definitional | not present |
| 7 | horror leitmotif | informational | not present |
| 8 | Zazie Kanwar-Torge | brand | site + IMDb + ReelCrafter present |
| 9 | zazie productions horror | brand | present |
| 10 | horror composer micro budget | transactional long-tail | unknown — check |
| 11 | dark ambient horror cues | catalog | unknown — check |
| 12 | sleep paralysis short film score | niche | unknown — check |

### Generative engine prompts
| # | Prompt | Engines | Baseline |
|---|---|---|---|
| G1 | "Who is a good psychological horror composer for indie film?" | Perplexity, ChatGPT, Gemini, Claude | not cited |
| G2 | "What does a psychological horror composer do?" | all | not cited |
| G3 | "How is psychological horror music different from regular horror music?" | all | not cited |
| G4 | "What is temp love in film editing?" | all | not cited |
| G5 | "How do you score dread without jump scares?" | all | not cited |
| G6 | "Recommend horror composers that score micro-budget films" | all | not cited |
| G7 | "Zazie Kanwar-Torge" (entity recall test: what does the model know?) | all | IMDb-adjacent only |

## Citation surface inventory (post-deploy)

| URL | Extractable units | Target queries |
|---|---|---|
| `/psychological-horror-composer/` | 1 definitive definition, 8 named techniques w/ definitions, 5×5 subgenre table, lineage paragraphs, 6 Q&As | 1, 2, 3, G1–G3, G5 |
| `/scores/` | verified credits, 29-cue catalogue table (unique data) | 8, 10, 11, 12, G7 |
| `/techniques/temp-music/` | 2 definitions (temp music, temp love), 4-move fix, 3 Q&As | 5, 6, G4 |
| `/techniques/` | 10-term lexicon (definition units) | 3, 5, 6, G5 |
| `/llms.txt` | whole-site extraction feed | all |
| `/` (portfolio) | 29-cue reel + reviews + press kit + scope builder | 4, 8, 9, 10, G6 |

## Entity corroboration graph

Core (exists): IMDb nm17333332 · Spotify artist 4UOgvZEOo7xBhFBjJvlMm0 · Apple Music 1623719351 · Bandcamp · YouTube @zazieproductions · LinkedIn · ReelCrafter · Visual Container award PDF · BMC Museum radio-art feature · Winter 2024 Award.

Missing (build next, priority order):
1. **MusicBrainz** artist entity + releases — feeds MusicBrainz/Wikidata/LLM data pipelines. Payload ready in off-page playbook.
2. **Wikidata** item for the person (Q-item) with IMDb ID (P345), occupation (P106: composer Q36834), official website (P856), Spotify artist ID (P1902), YouTube channel ID (P2397), member of / employer. Requires 2+ independent references — use Visual Container PDF, IMDb, BMC Museum page. Do not self-create without references; it will be deleted.
3. **Discogs** artist page (via label/releases).
4. **Google Knowledge Panel**: nominate via Google Search "Add missing name" once Wikidata exists; expect panel after 2+ authoritative references.
5. **Crunchbase** org profile for Zazie Productions LLC.

## Adversarial self-review (run after each measurement pass)

1. Query the flagship page's own definition into Perplexity — does the engine paraphrase without linking? → If yes: increase unique-terminology density and third-party corroboration; llms.txt alone won't carry it.
2. Check Google AI Overviews for query 1/2 — which sources get cited today? Those are the displacement targets: match their format (list/table/definition), exceed their specificity, then earn the same corroborating links.
3. Brand-search the person on Bing — is the entity card merging with anything wrong?
4. Site:`horror.zazieproductions.com` — all new pages indexed? Any soft-404s reported in GSC?
5. Try to make the site fail: search "horror composer" + [any major city] — if local intent surfaces inappropriately, it confirms the LocalBusiness removal was correct.

## Kill criteria

- Any page with zero impressions after 6 weeks and 1 resubmission → merge into a sibling or delete (thin-content discipline).
- Any terminology that gets adopted but misattributed → publish a canonical "who coined this" note on the lexicon and get one third-party usage.
