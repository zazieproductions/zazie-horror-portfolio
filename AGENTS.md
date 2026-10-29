# AGENTS.md — operating guide for AI coding agents (and humans)

Tool-agnostic. Agent-specific tooling must follow this file; if any other
instruction file disagrees with it, this file + `docs/` win, and the
disagreement should be fixed in the same PR. (No pre-existing agent
instruction files were found in this repo on 2026-10-29; this file is the
original, not a replacement.)

## Read before editing (in order)

1. `README.md` → 2. `docs/architecture/system-map.md` →
3. the dated root record for your area (`PERFORMANCE.md`, `LEGAL.md`,
   `STORE.md`, `SEO-DOSSIER.md`, `SITEMAP.md`, `ITEM-URLS.md`, `RATIFY.md`) →
4. the actual source files. Never edit from documentation alone.

## Architectural facts (verified 2026-10-29)

- Static site, no backend. Repo root ≈ served tree; deploy uploads a filtered
  `dist/` (`scripts/build-deploy-dir.mjs`) to Cloudflare Pages project
  `zazie-horror-site` via `.github/workflows/deploy.yml`.
- 17 hubs + 63 generated item pages (9 productions, 30 cues, 24 catalogue
  items) = 80 sitemap URLs. Re-derive from `src/data/` before quoting.
- **The homepage React bundle (`index-<hash>.js`) has no source in this repo.**
  Never describe it as editable source, never "rebuild" it. Homepage changes
  go through `home-src/build.mjs` patching + its tests.
- Generated files (item/hub HTML, `sitemap.xml`, `llms*.txt`, hashed bundles)
  are committed and **never hand-edited**. Edit source → `npm run build` →
  commit both. CI rejects stale generated output.

## Hard rules

- Do not move/rename/delete production files without mapping inbound
  references (code, scripts, workflows, `_headers`/`_redirects`, `sw.js`)
  and recording the move (pattern: `docs/archive/RELOCATION-MANIFEST.md`).
- Do not add runtime dependencies, frameworks, analytics or third-party
  origins. Any new origin ⇒ CSP in `tools/headers.mjs` + `/privacy` update.
- Do not invent credits, reviews, prices, placements or metrics. Unknown ⇒
  omit + record in `RATIFY.md` style.
- Counts move together (data, sitemap, schema, copy). Hash changes ⇒ bump
  `CACHE_NAME` in `sw.js`.
- Preserve the artistic system: documents sit still (no motion effects on
  legal pages); brand red `#C41E1E` is identity, text-red `#e65650` is for
  small text legibility — don't "fix" one into the other.
- Never force-push. Never merge to `main`. Work on the session branch and
  open a PR (template in `.github/pull_request_template.md`).

## Validation (honest reporting required)

```bash
npm ci && npm run build        # note: build rewrites generated output — review git status
npm run typecheck && npm test  # fresh clone: build first (see docs/development/testing.md)
npm run verify && npm run check:links && npm run check:forms && npm run check:headers
npm run check:docs             # after touching README.md or docs/
npm run lint:slop              # aislop gate before calling work done
```

Record exactly what ran and what passed/failed. A check that didn't run is
"not run", never "passing". Known baseline quirks live in
`docs/project/known-limitations.md` — don't silently "fix" unrelated failures
by committing regenerated churn.

## Handoff

Every PR: what changed and why, source-vs-generated note, validation table,
docs updated (README/`docs/`/dated record as applicable), remaining risks.
If architecture changed, add a row to
`docs/architecture/technical-decisions.md`.
