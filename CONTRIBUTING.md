# Contributing

This is an independently maintained creative-technology project
(Zazie Productions LLC), not a multi-team open-source project. Contributions
are primarily by the maintainer and coding agents working to
[`AGENTS.md`](AGENTS.md).

## Workflow

1. Branch from `main` (never commit directly to `main`).
2. Read `docs/development/getting-started.md`; make the smallest change that
   solves the problem; generated output is rebuilt, never hand-edited.
3. Validate: `npm run build`, `npm run typecheck`, `npm test`,
   `npm run check:links` / `check:forms` / `check:headers` as applicable
   (fresh clone: build before test — see `docs/development/testing.md`).
4. Update documentation with the change (single authoritative location per
   fact — see `docs/README.md`). Run `npm run check:docs` for doc edits.
5. Open a PR using the template; report validation honestly.

## Licensing note

`UNLICENSED` / all rights reserved (see `README.md` → Credits, Copyright and
Licensing). Submitting a change does not grant or imply an open-source
license over site code, copy, artwork or audio.
