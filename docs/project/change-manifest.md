# Change manifest — repository organization & documentation overhaul (2026-10-29)

Branch: `arena/5d495e3f-zazie-horror-portfolio`. No production file was moved,
renamed, deleted or edited except one documentation comment path
(`home-src/conversion-copy.mjs`, see manifest below). The served site is
byte-identical to `main` at the start of this change.

## Added

| Path | Purpose |
|---|---|
| `README.md` (rebuilt) | GitHub landing page; verified counts; palette badges; Mermaid diagrams |
| `docs/README.md` | Documentation index + anti-drift source-of-truth table |
| `docs/architecture/{overview,system-map,rendering-pipeline,audio-systems,routing,technical-decisions}.md` | Architecture system |
| `docs/development/{getting-started,local-development,testing,coding-standards,troubleshooting}.md` | Developer system |
| `docs/deployment/{cloudflare,ci-cd,rollback,verification}.md` | Deployment system incl. failure decision tree |
| `docs/features/{portfolio,audio-player,catalogue,inquiry,content-management}.md` | Feature docs + content recipes |
| `docs/quality/{accessibility,performance,security,seo}.md` | Quality docs |
| `docs/project/{roadmap,known-limitations,maintenance,change-manifest}.md` | Project governance |
| `docs/archive/{README,RELOCATION-MANIFEST}.md` | Archive index + relocation audit trail |
| `docs/assets/banner.svg` | Theme-safe repository banner (palette #C41E1E/#527CA6/#39846B/#806AA9/#C89543) |
| `AGENTS.md` | Tool-agnostic AI-agent operating guide |
| `CONTRIBUTING.md`, `SECURITY.md` | Contributor + vulnerability-reporting guides (UNLICENSED preserved) |
| `.github/CODEOWNERS`, `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/{bug_report,content_change,config}.yml` | Review routing & structured intake |
| `tools/check-docs.mjs` + `check:docs` script | Local Markdown link validation (not wired into deploy; cannot break production) |
| `CHANGELOG.md` | Maintenance changelog (docs/governance scope; site history stays in dated records) |

## Moved (git mv, history preserved)

9 archival files → `docs/archive/` — full audit in
[RELOCATION-MANIFEST.md](../archive/RELOCATION-MANIFEST.md).

## Edited

| Path | Change |
|---|---|
| `home-src/conversion-copy.mjs` | One comment: `CONVERSION-FUNNEL-BLUEPRINT.md` → `docs/archive/CONVERSION-FUNNEL-BLUEPRINT.md` (comment-only; no behaviour change) |
| `package.json` | Added `check:docs` script only; no dependency or build changes |

## Decisions

- Living root records (`PERFORMANCE.md` etc.) **not** relocated: referenced
  by name from code/workflows; moving them buys tidiness at real risk.
- `check:docs` is advisory/local + documented, **not** added to `deploy.yml`,
  so documentation linting can never block a production deploy.
- No license introduced; `UNLICENSED` / all-rights-reserved preserved.
