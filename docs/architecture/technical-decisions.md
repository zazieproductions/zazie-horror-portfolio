# Technical decisions (ADR-style log)

Short records of decisions future maintainers must not silently reverse.
Detail lives in the dated root records; this file is the index of *intent*.

| # | Decision | Why | Record |
|---|---|---|---|
| D1 | Fully static, no backend; inquiry composes a `mailto:` | Privacy claim is structural; no accounts/cookies to secure | `LEGAL.md`, `/privacy` |
| D2 | Committed generated output + CI stale-output gate | Deploy proves the served tree matches sources | `.github/workflows/deploy.yml` |
| D3 | Legacy homepage bundle retained; source not in repo | Original React source unavailable; bundle is runtime truth | `PERFORMANCE.md`, [system map](system-map.md) |
| D4 | Item pages are flat files, no slash twins; no SPA fallback | One canonical URL per item; real 404s | `ITEM-URLS.md` |
| D5 | Header policy single-sourced in `tools/headers.mjs`, checked against `_headers` | Cloudflare comma-joins duplicate headers; drift silently breaks caching/CSP | `_headers` top comment |
| D6 | Zero runtime dependencies; only remote script is the disclosed Cloudflare beacon | Privacy + CSP minimalism | `/privacy`, [security](../quality/security.md) |
| D7 | Counts move together (data → sitemap → copy → schema) | Stale totals are factual errors on a portfolio | root README guardrails, `scripts/verify.mjs` |
| D8 | aislop gate with accepted-debt baseline | Fail on *new* slop, not inherited debt | `.aislop/config.yml`, `.github/workflows/aislop.yml` |
| D9 | Deploy uploads a filtered `dist/`, not the repo root | Repo root contains tooling/sources that must not be public | `scripts/build-deploy-dir.mjs` |
| D10 | Root dated `*.md` records stay at root | Referenced by name in code comments, scripts and workflows | [docs index](../README.md) |

New decision? Add a row here **and** write the dated record; do not edit
history to make an old decision look current.
