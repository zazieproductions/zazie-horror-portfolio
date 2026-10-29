# Coding standards

Conventions already enforced by the tree (follow them; don't import new ones):

- **TypeScript strict** (`tsconfig.json`: `strict`, `verbatimModuleSyntax`,
  `NodeNext`). Data lives in typed modules under `src/data/`; rendering in
  `src/lib/`. No hand-typed absolute site URLs — build them via
  `src/data/site.ts`.
- **Zero runtime dependencies.** Build-only deps are pinned in
  `package-lock.json` (TypeScript, Vite, esbuild, fflate). Adding a dependency
  needs justification in the PR.
- **Comments explain intent, invariants and edge cases** — not narration of
  obvious lines (the aislop gate literally scores this). Pipeline scripts in
  `scripts/` and `tools/` carry header blocks stating why they exist; keep
  that pattern.
- **Generated files are never hand-edited.** Change source, run the build,
  commit source + regenerated output together (hash bumps included, with
  `sw.js` `CACHE_NAME` bumped when precached assets change).
- **Counts move together**: productions/cues/items totals appear in data,
  sitemap, schema, FAQ and copy — update all or none.
- **No invented portfolio facts.** No fictional films, credits, reviews,
  prices or placements. Unknown ⇒ omit and record (see `RATIFY.md`).
