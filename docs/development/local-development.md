# Local development

```bash
npm run serve        # node server.mjs → http://localhost:8080
PORT=3000 npm run serve
```

`server.mjs` is a **mirror of Cloudflare Pages routing**, not a convenience
dev server: extensionless item paths resolve from flat `.html` files, hub
paths from root twins / `index.html`, unknown paths return the real
`404.html` with HTTP 404, and headers/compression come from the same
`tools/headers.mjs` policy validated against `_headers`. If local and edge
behaviour ever disagree, that is a bug in one of them — report it, don't
paper over it locally.

Useful env: `PORT`, `LOCAL_HTTPS=1` (also send HSTS), `ALLOW_EMBED=1`
(relax frame headers for local embedding tests).

> [!NOTE]
> There is no hot-reload dev server for the site as a whole. Edit source →
> `npm run build` → refresh. Item-page-only iteration can use
> `node scripts/prerender.mjs --only=<slug>` after one full build.
