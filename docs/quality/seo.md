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
- Meta descriptions are short and niche-forward (2026-11-02 policy). Every
  route stays within the 80-140 character band declared by
  `DESCRIPTION_MIN`/`DESCRIPTION_MAX` in `src/data/routes.ts`, which
  `scripts/verify.mjs` also checks against the served HTML. Sources of truth:
  `src/data/hubs.ts` for hub routes, each item's `metaDescription` in
  `src/data/{productions,cues,releases}.ts` for generated item pages, and the
  `legal-src/` + `store-src/` templates (plus hand-maintained hub HTML and
  their root twins) for static pages. Change the source and run
  `npm run build`; never hand-edit generated item HTML.
- One canonical owner per keyword family (2026-11-04 cannibalisation policy).
  Two indexable pages must not answer the same query, so the transactional
  *hire a horror composer* family lives only on `/hire-a-composer`, while
  `/how-to-hire-a-horror-composer` owns the informational research behind it
  (scored-minute budgeting, custom score vs. library music, vetting, chain of
  title) and links the buyer intent back to the pillar. The split is pinned by
  `tools/geo.test.mjs`; the keyword-to-owner table and the reasoning are in the
  dated record in `SEO-DOSSIER.md`. Shingle overlap in
  `tools/index-coverage.mjs` does **not** catch this class of duplicate - the
  two pages shared 1% of their wording while competing for the same phrase -
  so targeting is reviewed by title/H1/section intent, not by the dupe ratio.
  Same rule for one work published under two intents: the `/reel/` cue page
  (free stream) and the `/store/` catalogue page (Bandcamp purchase) of
  *Opaline Lament* keep distinct headlines and descriptions rather than
  merging, which the 30-cue and 24-item counts forbid.
- Programmes and audits: root `SEO-DOSSIER.md`, `SITEMAP.md`,
  `ITEM-URLS.md`; historical audits in `docs/archive/`.
- Post-deploy discovery: `indexnow.yml` pings IndexNow; `wayback.yml`
  archives the sitemap. Human `/sitemap` stays hub-only by design.
- Indexing status, what Search Console is actually seeing, and the actions that
  are not code: [Google indexing](indexing.md). That page records the `Link:`
  header defect fixed on 2026-10-30, the stale index entry for `/`, and the
  duplicate `*.pages.dev` host — the one indexability gap this repository
  cannot close by itself.
