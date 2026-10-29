# Getting started

## Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | `>=20.19` (`package.json` engines; CI uses 22) | Build, tests, tooling |
| npm | bundled with Node | `npm ci` for reproducible installs |
| Bash + Python 3 | any current | `store-src/build.sh`, `legal-src/build.sh` |

## First run

```bash
git clone https://github.com/zazieproductions/zazie-horror-portfolio.git
cd zazie-horror-portfolio
npm ci            # exact lockfile install; node_modules/ is never committed or deployed
npm run build     # full pipeline — rewrites committed generated output; review git status after
npm run serve     # → http://localhost:8080 (PORT env overrides)
```

> [!TIP]
> On a fresh clone, run `npm run build` **before** `npm test`: two test files
> import compiled output from `build/`, which only `tsc` (the first build step)
> creates. See [testing](testing.md#known-baseline-2026-10-29).

## The 10-minute orientation

1. [`README.md`](../../README.md) — what the site is.
2. [Architecture overview](../architecture/overview.md) + [system map](../architecture/system-map.md) — what is source, generated, or legacy.
3. [`AGENTS.md`](../../AGENTS.md) — rules that apply to every change, human or AI.
4. The dated root record for your area (`PERFORMANCE.md`, `LEGAL.md`, `STORE.md`, …).
