# SEO & structured data

- One canonical extensionless URL per page, consistent across sitemap,
  canonical tags and `Link:` headers (see [routing](../architecture/routing.md)).
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
