# Changelog

Site-content and engineering history is kept in the dated root records
(`PERFORMANCE.md`, `LEGAL.md`, `STORE.md`, …) and `docs/archive/`. This file
tracks repository-governance and documentation changes only.

## 2026-10-29 — Automatic merge-conflict resolution

- Added `.github/workflows/auto-resolve-conflicts.yml`: on a conflicting PR it
  merges base into the PR branch and commits the *regenerated* build output,
  which is where nearly all conflicts in this repository come from.
- Added `tools/resolve-conflicts.mjs` (+ `tools/resolve-conflicts.test.mjs`,
  wired into `npm test`). It proves a file is build output by rebuilding it
  rather than trusting a filename list, and it refuses to touch hand-authored
  files (`.github/`, `src/`, `docs/`, `tools/`, `scripts/`, Markdown,
  `package*.json`, `_headers`, config), reporting them to the PR instead.
- Only merge-induced churn is committed: HEAD is built first, so pre-existing
  bundle-hash drift stays out of the commit.
- Documentation: `docs/deployment/ci-cd.md` (13 workflows + the decision
  table), `docs/architecture/technical-decisions.md` (D11),
  `docs/development/testing.md`, count fixes in `docs/architecture/overview.md`
  (13 workflows, 16 test files) and `docs/README.md`.
- No production file, served route or build output was changed by this PR.

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
