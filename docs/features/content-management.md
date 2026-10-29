# Content management — adding work

All content is code: edit typed data, run `npm run build`, commit source +
regenerated output together. The build fails on duplicate/malformed paths,
missing titles/descriptions/media, broken relationships and sitemap URLs
without files.

| Add… | Edit | Then |
|---|---|---|
| Production | `src/data/productions.ts` (verify credits role-by-role, poster set, `updatedAt`) | Build; check `/work/<slug>` + poster wall |
| Cue | `src/data/cues.ts` + add `audio/track-NN.mp3` (slug derives from title) | Build; check `/reel/<slug>`, downloads list |
| Catalogue item | `src/data/releases.ts` (verified facts/artwork only; no invented price/stock) | Build; check `/store/<slug>` |
| Compilation | `src/data/compilations.ts` **and** the mirrored `/reel` list | Build; both lists must stay in step |
| Hub page | Its source (`store-src/` or `legal-src/`) if it has one; else the committed hub HTML + root twin together | `node tools/route-aliases.mjs` must pass |
| Document (legal/FAQ/…) | `legal-src/pages/<slug>.html` (shared chrome: `legal-src/partials/`) | Build; documents ship readable with JS off |

> [!WARNING]
> Do not add item links to the homepage or hub navigation. Discovery is
> `/` → hub → item, plus `sitemap.xml`; item pages link to hub + siblings.
> Keep the human `/sitemap` page hub-only.
