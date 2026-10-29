# CI/CD — the 12 workflows

| Workflow | Trigger | Job |
|---|---|---|
| `deploy.yml` | push `main`, PRs (site paths), manual | Build → typecheck → test → stale-output gate → assemble `dist/` → wrangler upload → live route audit |
| `aislop.yml` | PRs (code paths) | AI-slop quality gate; floor + baseline in `.aislop/` |
| `roast.yml` | PRs, manual | Non-blocking RoastMyCode-style PR review (`.github/roast/`); zero required secrets, optional LLM upgrade via `COPILOT_PAT`/`OPENAI_API_KEY`/`OPENROUTER_API_KEY` |
| `live-route-audit.yml` | scheduled / manual | Audits production routes against sitemap |
| `lighthouse.yml` | scheduled / manual | Lighthouse checks on production |
| `indexnow.yml` | after deploy | Submits sitemap URLs to IndexNow engines |
| `wayback.yml` | after successful deploy, weekly, manual | Archives core (17) or all (80) sitemap URLs to web.archive.org |
| `label.yml` | PR/issue events | Labelling |
| `stale.yml` | scheduled | Marks/closes stale issues & PRs |
| `summary.yml` | issue opened | AI one-paragraph issue summary comment |
| `neuralegion.yml`, `sonarcloud.yml` | configured scans | External security/quality scanning |

Only `deploy.yml` can change production. A green run of any other workflow
says nothing about the edge — see [verification](verification.md).
