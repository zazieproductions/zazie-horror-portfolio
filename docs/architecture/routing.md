# Routing

Canonical policy: **one canonical, extensionless, slashless URL per page**
(root `/` excepted), advertised identically by `sitemap.xml`, each page's
`<link rel="canonical">` and the `Link: rel="canonical"` header in `_headers`.

| Request | Served | Status |
|---|---|---|
| `/` | `index.html` | 200 |
| `/work` | `work.html` root twin (else `work/index.html`) | 200 |
| `/work/` | `work/index.html` | 200 |
| `/work/<slug>` | flat `work/<slug>.html` | 200, no redirect hop |
| `/work/<slug>.html` | → `/work/<slug>` | redirect (see `_redirects`) |
| `/work/<slug>/` | `404.html` (no slash twin for items) | **404** |
| Unknown path | `404.html` ("Signal Lost", `noindex`) | **404** |

Rules that protect this:

- Hub routes exist as `<hub>/index.html` **plus a byte-identical root
  `<hub>.html` twin**; item routes are flat files with **no** slash twin.
- There is deliberately **no SPA fallback** (`/* /index.html 200` would turn
  every typo into a soft-404 duplicate of the homepage).
- `_redirects` holds legacy aliases (e.g. `/contact` → `/#contact`,
  `/composer` → `/#about`); `tools/generate-redirects.mjs --check` guards it.
- `server.mjs` mirrors the host's routing locally so link/route bugs are
  testable before deploy; `tools/check-links.mjs` resolves targets the same way.
- `sw.js` is hand-written; bump `CACHE_NAME` (currently `zazie-v55`) whenever
  precached assets or cache behaviour change, or returning visitors keep the
  old asset graph.
