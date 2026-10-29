# Maintenance

## Routine

- **Per change:** `npm run build` + relevant checks (see
  [testing](../development/testing.md)); commit source + regenerated output.
- **Per precache/asset change:** bump `CACHE_NAME` in `sw.js`.
- **Counts audit:** when adding/removing content, re-derive hub/item/URL
  counts from `src/data/` + `sitemap.xml` and update any doc quoting them.
- **aislop baseline:** only re-accept findings deliberately, in the same PR
  as the causing code (`npx aislop@0.19.1 baseline write && … prune`).
- **Dependabot/actions pins:** bump workflow action refs and the `npx aislop`
  version together where a workflow notes the coupling.

## Periodic

- Review `RATIFY.md` open human decisions; review stale-workflow noise;
  re-run the live route audit after DNS/Cloudflare changes; check Wayback
  weekly archive health.

## Log

| Date | Note |
|---|---|
| 2026-10-29 | Documentation overhaul: `docs/` taxonomy, README rebuild, `AGENTS.md`, governance files, `check:docs`. Baseline test results recorded in [testing](../development/testing.md). |
