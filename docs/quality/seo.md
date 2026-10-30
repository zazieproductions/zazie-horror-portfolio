# SEO & structured data

- One canonical extensionless URL per page, consistent between `sitemap.xml`
  and the page's own `<link rel="canonical">` (see
  [routing](../architecture/routing.md)). There is no `Link:` response header:
  Cloudflare Pages truncates angle-bracketed header values, so the site was
  serving `Link: ; rel="canonical"` until those rules were removed (2026-10-30).
- `sitemap.xml` (80 URLs) is generated from the route registry
  (`scripts/generate-sitemap.mjs`); never hand-edit it. `robots.txt`, `llms.txt`
  and `llms-full.txt` are likewise generated/derived — sources in `src/data/`
  and `scripts/generate-llms.mjs`.
- Per-type JSON-LD is rendered by `src/lib/` (productions, cues with
  `MusicComposition`+`AudioObject`, catalogue items without mutable
  price/stock claims). `scripts/verify.mjs` enforces exactly one
  title/canonical/robots/OG set per generated page.
- Programmes and audits: root `SEO-DOSSIER.md`, `SITEMAP.md`,
  `ITEM-URLS.md`; historical audits in `docs/archive/`.
- Post-deploy discovery: `indexnow.yml` pings IndexNow; `wayback.yml`
  archives the sitemap. Human `/sitemap` stays hub-only by design.
- Indexing status, what Search Console is actually seeing, and the actions that
  are not code: [Google indexing](indexing.md). That page records the `Link:`
  header defect fixed on 2026-10-30, the stale index entry for `/`, and the
  duplicate `*.pages.dev` host — the one indexability gap this repository
  cannot close by itself.
