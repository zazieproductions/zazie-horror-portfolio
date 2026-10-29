# Item routes: productions, cues and catalogue

**Current scope:** 62 standalone item pages—8 production details, 30 cue pages and 24 catalogue entries. The archive contains nine verified production records; EXPIRE remains in `/work` as an archive-only record and does not have a detail page.

## Route rules

1. Route data lives in `src/data/`; `src/data/routes.ts` derives and validates each published item URL.
2. Published items use one clean, extensionless canonical path: `/work/<slug>`, `/reel/<slug>` or `/store/<slug>`. The generated file is `<section>/<slug>.html`; there is no item directory twin.
3. Each item page links to its owning archive and related items. The homepage remains a hub index and does not link directly to item details.
4. Only indexable routes are submitted in `sitemap.xml`. Public support pages marked `noindex` are not part of item discovery or sitemap counts.
5. `/work/expire`, `/work/expire/` and `/work/expire.html` redirect to `/work#expire`; the archive preserves the verified EXPIRE sound-design credit and project media.
6. `/sitemap` is a retired human-readable page and redirects to `/`. `/sitemap.xml` remains available and is advertised in `robots.txt`.
7. `/contact` and its existing aliases continue to redirect to `/#contact`.

## Validation

Run `npm run build` after changing route data. The build regenerates item pages and verifies sitemap membership, canonicals, metadata, sibling links, media references and route aliases. `tools/live-route-audit.mjs` checks actual deployed status separately.

Word counts are diagnostic only. Do not add copy merely to meet a word threshold; keep each retained page accurate, distinct and useful for its archive or project purpose.
