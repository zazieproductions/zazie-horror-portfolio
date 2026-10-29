# Testing and verification

All commands below exist in `package.json` (verified 2026-10-29).

| Command | Proves |
|---|---|
| `npm run build` | Full pipeline incl. `verify`, `check:headers`, `check:links`, `check:forms`, sitemap/redirect/alias/coverage gates |
| `npm run typecheck` | `src/` type-checks under strict TS (`tsc --noEmit`) |
| `npm test` | 15 `node --test` files in `tools/` (routing, headers, players, homepage render paths, SEO semantics, mobile UX, laurels, …) |
| `npm run verify` | Structural/content/schema audit of prerendered pages (`scripts/verify.mjs`) |
| `npm run check:links` | Every internal link + `#fragment` resolves the way the host would resolve it |
| `npm run check:forms` | Every form control in served HTML carries an `id` or `name` |
| `npm run check:headers` | `_headers` matches `tools/headers.mjs`; one cache lifetime per path |
| `npm run check:docs` | Local Markdown links in `README.md` + `docs/` resolve |
| `npm run lint:slop` | aislop quality gate (score floor + baseline in `.aislop/`) |
| `npm run seo:coverage` | Per-URL word count / inbound links / duplication report |

## Repaired baseline (2026-10-29, Node 22)

- `npm ci` — pass.
- Two consecutive complete `npm run build` runs — pass; all 116 tracked/generated
  site artifacts were byte-identical between the two snapshots.
- `npm run typecheck` — pass.
- `npm test` after the build — **95/95 pass**, including the original mobile UX
  assertion, complete-head idempotence, duplicate-block convergence, and all
  four festival laurels in static HTML and the patched React bundle.
- `npm run verify`, `check:links`, `check:forms`, `check:headers`, `check:docs`
  — pass. `node scripts/build-deploy-dir.mjs dist` — pass (231 files, 80/80
  sitemap URLs resolve).
- `npm run lint:slop` — pass against the accepted baseline; no new findings.

The former `tools/mobile-ux.test.mjs` failure was real: the homepage pass put
mobile CSS last, then the SEO prerender appended canonical/JSON-LD after it.
The next build moved the block again. The final head render now converges in
one pass, and `deploy.yml` repeats the full build before its stale-output gate.
See [known limitations](../project/known-limitations.md) and `PERFORMANCE.md`.

## Fresh-clone ordering

Run `npm run build` (or at least `tsc`) before `npm test`: `tools/geo.test.mjs`
and `tools/inquiry.test.mjs` import compiled output from ignored `build/`.
This ordering requirement remains; it is not a reason to skip or disable tests.

> [!IMPORTANT]
> Never represent an unexecuted check as passing. Record command, date and
> result — especially in PR descriptions.
