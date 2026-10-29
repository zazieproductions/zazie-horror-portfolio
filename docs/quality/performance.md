# Performance

Authoritative record: root `PERFORMANCE.md` (dated implementation history).
Principles enforced by the current tree:

- Static first paint; the legacy bundle loads off the critical path.
- Poster derivatives (640 AVIF/JPG + click-only 1200 JPG); self-hosted woff2
  fonts with metric-override fallbacks; no font CDN.
- Service-worker tiers in `sw.js` (network-first for HTML/documents/store,
  cache-first for hashed assets, SWR for media) — bump `CACHE_NAME` on change.
- Media is the growth axis: new audio/images enter via the pipelines in
  [audio systems](../architecture/audio-systems.md) and
  [content management](../features/content-management.md), never as raw uploads
  wired straight into pages. (Root-level raw uploads exist as provenance only.)
- Field data (LCP/CLS/CrUX) has historically not been measured in a real
  browser; don't quote lab numbers as field results.
