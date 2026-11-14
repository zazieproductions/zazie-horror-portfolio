# Cloudflare Pages deployment

- **Project:** `zazie-horror-site` (default in `deploy.yml`), production
  domain `https://horror.zazieproductions.com`, production branch `main`.
- **Method:** GitHub Actions direct upload (`wrangler pages deploy`), **not**
  the Pages Git integration. History: the Git integration published the whole
  repo and drifted behind `main`; see the header of
  `.github/workflows/deploy.yml`.
- **Upload contents:** `node scripts/build-deploy-dir.mjs dist` — repo root
  minus `.git`, `.github`, `node_modules`, `build`, `scripts`, `src`, `tools`,
  `store-src`, `legal-src`, `home-src`, `functions`, `migrations`,
  `wrangler.toml`, `server.mjs`, and all `*.md`/`*.json`.
  It refuses trees missing `index.html`, `404.html`, `sw.js`, `sitemap.xml`,
  `robots.txt` or the IndexNow key file, trees where a sitemap URL doesn't
  resolve, >20,000 files, or any file >25 MB.
- **Pages Function + D1:** `POST /api/inquiry` is
  `functions/api/inquiry.ts`, which lives at the **repository root**, not in
  `dist` — Cloudflare requires the `functions` directory at the project root
  and `wrangler pages deploy` bundles it itself. `wrangler.toml` declares the
  Pages project and the D1 binding `DB` (`database_name = "zazie-inquiries"`).
  Setup, once: create the database (Workers & Pages → D1 → Create database,
  named `zazie-inquiries`), put its UUID in `wrangler.toml` in place of the
  placeholder, then `npx wrangler d1 migrations apply zazie-inquiries --remote`.
  Until the binding exists the endpoint answers 503 and the form falls back to
  the `mailto:` handoff. After every production deploy, a workflow step GETs
  `/api/inquiry` and fails on anything but 405 (405 = Function live; 404 = not
  deployed; 503 = binding missing).
- **Required secrets (names only):** `CLOUDFLARE_API_TOKEN` (Pages:Edit),
  `CLOUDFLARE_ACCOUNT_ID`. Without both, CI still builds/tests/assembles but
  deploys nothing and warns — by design.
- **Triggers:** push to `main`; PRs touching site/build paths (build +
  validate only, never deploy); manual `workflow_dispatch` (production only
  from `main`; preview allowed). The build step runs the complete pipeline
  twice, then typecheck/tests and the tracked/untracked stale-output gate.
- **Live release gate:** after production upload, `tools/live-route-audit.mjs`
  checks routes, delivery headers and `.zp-hero-laurels` above the headline:
  all four festival marks must exist in both the served HTML and the exact
  React bundle imported by that HTML.
- **Edge config in-repo:** `_headers` (security + cache; policy source is
  `tools/headers.mjs`), `_redirects` (legacy aliases + real-404 fallback).
  `_headers` is **not** a cascade — read its top comment before editing.
- **Service worker:** `sw.js` must be served `no-cache`; bump `CACHE_NAME`
  on precache changes.
