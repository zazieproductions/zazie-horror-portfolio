# CI/CD — the 13 workflows

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
| `auto-resolve-conflicts.yml` | PRs (same-repo heads), manual, `resolve-conflicts` label | Merges base into the PR branch and commits regenerated build output when the *only* conflicts are generated files; reports source conflicts to a human (`tools/resolve-conflicts.mjs`) |
| `stale.yml` | scheduled | Marks/closes stale issues & PRs |
| `summary.yml` | issue opened | AI one-paragraph issue summary comment |
| `neuralegion.yml`, `sonarcloud.yml` | configured scans | External security/quality scanning |

Only `deploy.yml` can change production. `auto-resolve-conflicts.yml` writes
to pull-request branches only — never to `main` — and refuses to touch
hand-authored files, so it cannot change what the site says.

### How a conflict is judged (auto-resolve-conflicts.yml)

The repository commits its generated output, so two branches that edit different
sources still collide on `sitemap.xml`, `llms.txt`, `sw.js` and hub pages. The
workflow resolves exactly those and nothing else:

| Conflict | What happens |
|---|---|
| Only generated output (HTML, `sitemap.xml`, `robots.txt`, `llms*.txt`, `_redirects`, `sw.js`, hashed bundles) | Base is merged in, the files are rebuilt with `npm run build`, the merge commit is pushed to the PR branch |
| Any hand-authored file (`.github/`, `src/`, `scripts/`, `tools/`, `docs/`, root Markdown, `package*.json`, `_headers`, config) | Nothing is committed; the PR gets a comment listing the paths that need a decision and the generated files the build will rewrite |
| Merge already clean | Nothing happens unless a maintainer dispatches the workflow with *update branch* |
| Fork PR | Skipped: the workflow token cannot push there |

"Generated" is proven at run time, not assumed from a filename list: the file is
seeded from one side, `npm run build` is run, and only a file the build rewrites
counts as build output. The workflow also builds HEAD first and commits nothing
but merge-induced churn, because bundle hashes are [not reproducible on every
checkout](../project/known-limitations.md). Pushes use `GITHUB_TOKEN`, which does
not start new workflow runs; add a `CONFLICT_RESOLVER_TOKEN` secret (fine-grained
PAT, `contents: write` + `pull-requests: write`) if the PR's other checks must
re-run on the resolution commit. A green run of any other workflow
says nothing about the edge — see [verification](verification.md).
