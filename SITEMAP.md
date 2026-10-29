# Sitemap and route policy

- **XML sitemap:** [`sitemap.xml`](https://horror.zazieproductions.com/sitemap.xml)
- **Generator:** `scripts/generate-sitemap.mjs`
- **Validators:** `scripts/verify.mjs`, `tools/check-sitemap.mjs`

The current sitemap contains **73 indexable URLs**: 11 indexable hubs and 62 item-detail routes (8 production pages, 30 cues and 24 catalogue entries). Five public support routes—`/faq`, `/legal`, `/privacy`, `/process` and `/terms`—remain available to visitors with `noindex, follow` and are deliberately excluded. `/contact` remains a redirect to `/#contact`.

The human-readable `/sitemap` page has been retired and redirects to `/`. `/sitemap.xml` is retained and remains advertised by `robots.txt`. These are separate routes and purposes.

## Published item routes

- `/work/<slug>` — 8 production detail pages. Nine verified production records remain in the `/work` archive; EXPIRE is archive-only because its verified credit is sound design, not composition.
- `/reel/<slug>` — 30 cue pages.
- `/store/<slug>` — 24 catalogue pages.

Item pages are prerendered as flat `<section>/<slug>.html` files and use extensionless canonical URLs. Each links back to its owning archive and to related items. The home page remains a hub index; it does not link directly to item-detail URLs.

The retired `/work/expire`, `/work/expire/` and `/work/expire.html` forms redirect to `/work#expire`. The production record, source credit, poster and sample remain on `/work`.

## Validation

`npm run build` regenerates the sitemap and checks route data, canonical paths, page files, robots metadata, media references, internal links and aliases. `tools/index-coverage.mjs --check` checks contextual discovery and duplicate copy; its reported word counts are diagnostic only and are not a minimum-content target.

For live routing, `tools/live-route-audit.mjs` checks deployed canonical pages, aliases and retired-route redirects. A local build does not establish that the production host has deployed those outputs.
