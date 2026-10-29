# Relocation manifest — 2026-10-29 documentation overhaul

Method: `git mv` (history preserved). For each file: inbound references were
searched across code (`*.ts/*.mjs/*.js/*.sh/*.html`), CI (`.github/`) and docs
*before* moving. Production/runtime files were **not** moved.

| Original path | Destination | References found | Validation |
|---|---|---|---|
| `AUTHORITY-POSITIONING-DOSSIER-2026.md` | `docs/archive/…` | none in code/CI | `check:docs` link pass |
| `COMMERCIAL-OVERHAUL.md` | `docs/archive/…` | none in code/CI | link pass |
| `CONVERSION-FUNNEL-BLUEPRINT.md` | `docs/archive/…` | comment in `home-src/conversion-copy.mjs` | comment updated atomically in same change |
| `EDITORIAL-HUB-PASS.md` | `docs/archive/…` | none in code/CI | link pass |
| `INDEXING-RUNBOOK.md` | `docs/archive/…` | none in code/CI | link pass |
| `KEYWORD-UNIVERSE-2026.csv` | `docs/archive/…` | none (research data) | link pass |
| `PRESS-RELEASE-2026.md` | `docs/archive/…` | none in code/CI | link pass |
| `PROPOSED-LEGAL-UPDATES.md` | `docs/archive/…` | none in code/CI | link pass |
| `SEO-COMPETITOR-AUDIT-WEARY-PINES.md` | `docs/archive/…` | none in code/CI | link pass |

**Deliberately not moved:** root `PERFORMANCE.md`, `LEGAL.md`, `RATIFY.md`,
`SEO-DOSSIER.md`, `SITEMAP.md`, `STORE.md`, `ITEM-URLS.md` (referenced by
name in `index.html`, `scripts/verify.mjs`, `tools/`, `legal-src/build.sh`,
`home-src/` comments and workflow history), all HTML/CSS/JS, `src/`,
`scripts/`, `tools/`, `audio/`, `images/`, `sw.js`, `_headers`, `_redirects`
— zero runtime benefit, non-zero risk. Markdown is excluded from the deploy
upload anyway (`scripts/build-deploy-dir.mjs`), so these moves cannot affect
the served site.
