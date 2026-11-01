# Routing

Canonical policy: **one canonical, extensionless, slashless URL per page**
(root `/` excepted), advertised identically by `sitemap.xml` and each page's
`<link rel="canonical">`.

There is deliberately **no `Link: rel="canonical"` response header**. The site
used to send one from `_headers`; Cloudflare Pages drops an angle-bracketed
segment from a header value, so every route actually served
`Link: ; rel="canonical"` — a canonical hint with no URI in it. The rules were
removed on 2026-10-30 and `tools/check-headers.mjs` now fails the build if an
angle bracket reappears in any header value. The in-page `<link rel="canonical">`
is the signal Google uses for an HTML page, and it is correct on all 80 routes.

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
