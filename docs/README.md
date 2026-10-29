# Documentation index

> [!NOTE]
> This directory is the **single authoritative location** for engineering documentation.
> The root [`README.md`](../README.md) is the GitHub landing page and executive summary;
> it links here instead of duplicating manuals. Dated root records (`PERFORMANCE.md`,
> `LEGAL.md`, `RATIFY.md`, `SEO-DOSSIER.md`, `SITEMAP.md`, `STORE.md`, `ITEM-URLS.md`)
> remain at the root because code comments, workflows and build scripts reference them
> by name — they are the project's dated implementation memory, not drafts to tidy away.

## Colour convention (badges, diagrams, callouts)

| Meaning | Colour |
|---|---|
| Brand / critical | Blood red `#C41E1E` |
| Architecture / infrastructure | Muted blue `#527CA6` |
| Verified / healthy | Muted green `#39846B` |
| Caution / migration risk | Amber `#C89543` |
| Documentation / metadata | Muted violet `#806AA9` |
| Neutral | Slate `#64748B` |

## Map

### Architecture — how the system actually fits together
- [Overview](architecture/overview.md) — purpose, boundaries, verified counts
- [System map](architecture/system-map.md) — source vs generated vs legacy, with diagram
- [Rendering pipeline](architecture/rendering-pipeline.md) — build sequence, step by step
- [Audio systems](architecture/audio-systems.md) — showreel, downloads, previews, embeds
- [Routing](architecture/routing.md) — canonical URLs, twins, redirects, 404
- [Technical decisions](architecture/technical-decisions.md) — decision log (ADR-style)

### Development — working on the code
- [Getting started](development/getting-started.md) — clone → install → build → serve
- [Local development](development/local-development.md) — server semantics, ports, previews
- [Testing](development/testing.md) — every check, what it proves, known baseline
- [Coding standards](development/coding-standards.md) — conventions the tree already follows
- [Troubleshooting](development/troubleshooting.md) — symptom → cause → fix

### Deployment — shipping to Cloudflare Pages
- [Cloudflare](deployment/cloudflare.md) — Pages config, secrets (names only), upload assembly
- [CI/CD](deployment/ci-cd.md) — what each of the 13 workflows does
- [Rollback](deployment/rollback.md) — reverting a bad deploy safely
- [Verification](deployment/verification.md) — the four meanings of "it deployed"

### Features — user-facing systems
- [Portfolio](features/portfolio.md) · [Audio player](features/audio-player.md) ·
  [Catalogue](features/catalogue.md) · [Inquiry](features/inquiry.md) ·
  [Content management](features/content-management.md) — adding productions, cues, items

### Quality
- [Accessibility](quality/accessibility.md) · [Performance](quality/performance.md) ·
  [Security](quality/security.md) · [SEO](quality/seo.md)

### Project
- [Roadmap](project/roadmap.md) · [Known limitations](project/known-limitations.md) ·
  [Maintenance](project/maintenance.md) · [Change manifest](project/change-manifest.md)

### Archive
- [Archive index](archive/README.md) — dated dossiers, audits and proposals moved
  2026-10-29, with the [relocation manifest](archive/RELOCATION-MANIFEST.md).

## Where each fact lives (anti-drift rule)

| Fact | Authoritative source |
|---|---|
| Routes, titles, descriptions | `src/data/hubs.ts`, `src/data/routes.ts` (never hand-typed in docs) |
| Header / cache policy | `tools/headers.mjs` (checked against `_headers` on every build) |
| Build sequence | `package.json` → `build` script |
| Deploy upload contents | `scripts/build-deploy-dir.mjs` |
| Counts (productions / cues / items / URLs) | `src/data/*.ts` + committed `sitemap.xml` |
| Why a past change happened | Dated root records + `docs/archive/` |

If a document disagrees with its authoritative source, the source wins and the
document is the bug. Fix the document in the same PR.
