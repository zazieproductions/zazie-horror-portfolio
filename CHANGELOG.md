# Changelog

Site-content and engineering history is kept in the dated root records
(`PERFORMANCE.md`, `LEGAL.md`, `STORE.md`, …) and `docs/archive/`. This file
tracks repository-governance and documentation changes only.

## 2026-10-29 — Repository organization & documentation overhaul

- Rebuilt `README.md` as the GitHub landing page with verified counts
  (17 hubs / 63 items / 80 sitemap URLs) and palette-consistent badges.
- Added `docs/` taxonomy (architecture, development, deployment, features,
  quality, project, archive) with Mermaid diagrams.
- Moved 9 archival root documents to `docs/archive/` via `git mv`
  (manifest: `docs/archive/RELOCATION-MANIFEST.md`).
- Added `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODEOWNERS`,
  PR/issue templates and `tools/check-docs.mjs` (`npm run check:docs`).
- No production file moved or behaviourally changed; served tree unchanged.
