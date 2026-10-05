# Sitemap and crawl-path audit

**Sitemap:** [`sitemap.xml`](https://horror.zazieproductions.com/sitemap.xml)
**Generator:** `scripts/generate-sitemap.mjs`, backed by the typed records in `src/data/`
**Validator:** `node tools/check-sitemap.mjs`
**Scope:** 84 canonical URLs — 19 original hub URLs + 65 item URLs (9 productions, 32 cues, 24 catalogue entries). The current XML contains 79 image entries and 12 video entries.

The sitemap describes the intended committed static tree. A successful local build is not evidence that the production host has deployed it; the live URL audit is run separately by GitHub Actions after a production deploy.

## URL set and navigation policy

The 19 original routes (home and the existing portfolio/document hubs) are retained at their existing canonical paths. They remain the only routes linked directly from the homepage; the original hub/navigation pages do not link directly to item pages. The human-readable `/sitemap` remains a directory to the original hubs and their sections, not a second item catalogue.

The XML sitemap includes all content item URLs:

- `/work/<production-slug>` — 9 production pages.
- `/reel/<cue-title-slug>` — 32 cue pages; cue slugs derive from titles, never moods.
- `/store/<catalogue-slug>` — 24 catalogue pages.

Each item page is a real static HTML document generated at `<hub>/<slug>.html`, served at its extensionless canonical path with a 200 response and no canonical redirect hop. There is no `<hub>/<slug>/index.html` twin. Item pages link back to their original hub and to same-type siblings; production sibling cards use poster artwork, while cue and catalogue sibling cards are text-only. No item links are added to the homepage, original hubs, or human sitemap.

Non-content paths (assets, build tooling, source files, and the 404 document) are not sitemap entries. `robots.txt` advertises the XML sitemap and does not block its URLs. Sitemap priority/changefreq and meta keywords are not used as indexing signals; the generator omits `<priority>` and `<changefreq>` entirely.

## Source-rendered item metadata

`scripts/prerender.mjs` writes item HTML from `src/data/routes.ts` and the shared renderers in `src/lib/`. It replaces the complete unified `<head>` in the homepage source template as well as rendering route-specific item heads. Title, description, canonical, robots, Open Graph, Twitter, and JSON-LD are in the initial HTML response; they are not injected by client JavaScript.

Structured data is type-specific: productions use their declared `Movie`, `TVSeries`, or `CreativeWork` type and add a `VideoObject` only when the record has a real sample; cues use `MusicComposition` and `AudioObject`; catalogue entries use `Product` or `MusicAlbum` with `Offer`; each item also carries `WebPage` and `BreadcrumbList` data. Unknown or mutable facts, prices, stock claims, and unavailable artwork are omitted rather than invented.

## Validation

`npm run build` regenerates the route pages, sitemap and robots files, then checks the data model, static paths, canonicals, substantive unique prose, structured data, asset references, sibling/hub links, and link policy. `tools/check-sitemap.mjs` additionally validates the sitemap structure, URL set, crawl rules, media references, page canonical tags, hub reachability, fragment links, and service-worker assets. `tools/route-aliases.mjs --check` verifies that the original hub twins match and that item directory twins do not exist.

Run locally:

```sh
npm ci
npm run build
npm run typecheck
node --test tools/film-player.test.mjs
node tools/check-sitemap.mjs
node tools/route-aliases.mjs --check
npm run serve
```

HTTP expectations for `npm run serve`:

| Request | Expected |
|---|---|
| Every one of the 84 sitemap URLs | 200 HTML, no redirect, exact self-canonical, indexable |
| Existing original hub directory forms such as `/work/` | Existing hub content remains available with its canonical pointing to the slashless hub URL |
| Item `.html` alias (for example `/work/expire.html`) | Redirect to the extensionless item canonical |
| Item trailing-slash twin (for example `/work/expire/`) | 404 HTML with `noindex`; no duplicate item page |
| Unknown item or unrelated path | 404 HTML with `noindex` |

`tools/live-route-audit.mjs` applies the same expectations to a reachable production or Pages host. The build sandbox cannot reach the production domain. `.github/workflows/deploy.yml` runs the live audit after a configured production deploy; `.github/workflows/live-route-audit.yml` supports a deliberate manual re-audit. Do not label a local-server table as a production audit.

## Maintenance

- Add or edit item copy and metadata in `src/data/`; do not hand-edit generated item HTML.
- The build checks exact slug derivation, unique paths, source-backed references, two or more substantive unique body paragraphs, valid dates, and resolvable links.
- Preserve the 19 pre-existing hub URLs and their approved visual/navigation structure. Do not add item hrefs to `/`, hub pages, or `/sitemap`.
- After adding content, run the complete command set above. For a production status snapshot, run the live route audit only after the relevant URLs have been deployed, and retain its host and timestamp with the results.
