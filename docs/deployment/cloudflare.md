# Cloudflare Pages deployment

- **Project:** `zazie-horror-site` (default in `deploy.yml`), production
  domain `https://horror.zazieproductions.com`, production branch `main`.
- **Method:** GitHub Actions direct upload (`wrangler pages deploy`), **not**
  the Pages Git integration. History: the Git integration published the whole
  repo and drifted behind `main`; see the header of
  `.github/workflows/deploy.yml`.
- **Upload contents:** `node scripts/build-deploy-dir.mjs dist` — repo root
  minus `.git`, `.github`, `node_modules`, `build`, `scripts`, `src`, `tools`,
  `store-src`, `legal-src`, `home-src`, `server.mjs`, and all `*.md`/`*.json`.
  It refuses trees missing `index.html`, `404.html`, `sw.js`, `sitemap.xml`,
  `robots.txt` or the IndexNow key file, trees where a sitemap URL doesn't
  resolve, >20,000 files, or any file >25 MB.
- **Required secrets (names only):** `CLOUDFLARE_API_TOKEN` (Pages:Edit),
  `CLOUDFLARE_ACCOUNT_ID`. Without both, CI still builds/tests/assembles but
  deploys nothing and warns — by design.
- **Triggers:** push to `main`; PRs touching site/build paths (build +
  validate only, never deploy); manual `workflow_dispatch` (production only
  from `main`; preview allowed).
- **Edge config in-repo:** `_headers` (security + cache; policy source is
  `tools/headers.mjs`), `_redirects` (legacy aliases + real-404 fallback).
  `_headers` is **not** a cascade — read its top comment before editing.
- **Service worker:** `sw.js` must be served `no-cache`; bump `CACHE_NAME`
  on precache changes.
