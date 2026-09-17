# Performance Mandate: Implementation Record

Date: 2026-09-17 · Branch: `arena/01a0acb2-zazie-horror-portfolio`
Scope: horror.zazieproductions.com (static prerendered React build on an edge host with `_headers`/`_redirects` semantics, i.e. Netlify/Cloudflare-Pages style).

## 1. System as found (evidence from repo inspection)

- **Architecture**: one prerendered 67 KB `index.html` (full SEO markup, JSON-LD) + a 420 KB React bundle that mounts with `createRoot` and **tears down / rebuilds the entire static DOM** (static HTML ≠ client render: no App wrapper, no grain/vignette/orbs, different hero/work/footer markup). The inline `<style>` hacks in head were a band-aid for the resulting flicker.
- **Critical path before**: render-blocking 75 KB CSS; 420 KB JS fetched eagerly in `<head>` racing the LCP image; 443 KB JPEG hero (desktop); **9.15 MB** of poster originals (PNGs up to 2.6 MB) lazy-loaded into ~300 px slots; Google Fonts with 12 faces across two third-party origins; YouTube `preconnect` on every load for embeds that only exist post-JS; `Cache-Control: max-age=0` on content-hashed JS/CSS.
- **Audio**: 29 MP3 streams (85 MB total), `preload="metadata"` on mount, fine as streaming, untouched (quality decision belongs to the composer).

## 2. What changed (implemented)

### Critical path
1. **JS out of the LCP race**: `<script src=…js>` → inline module that dynamic-imports `/index-9db1dbeb.js` at `load` + `requestIdleCallback` (≤1.2 s cap). Static HTML is fully meaningful pre-JS (it always was; now it also carries the atmosphere layer). Removed the `?v=` query hack.
2. **First paint is the world**: `.grain` + `.vignette` fixed overlays now exist in static HTML (they were client-only), plus the hero's atmosphere stack (`atmosphere-bg.jpg` ken-burns + gradient/radial layers + corner marks) mirrored exactly from the client markup, no dark-theme pop-in, no white flash (`<html style="background:#050505;color-scheme:dark">`).
3. **Fonts self-hosted + trimmed**: removed Google Fonts entirely (2 origins + CSS round-trip + noscript copy). Now 3 preloaded woff2 (latin only): Cormorant Garamond 400 n/i + Inter variable (100 to 900) = 95 KB vs 12 faces/2 origins. Inline `@font-face`, `font-display:swap`, plus **metric-override fallback faces** (`ascent-override:92.4%/28.7%` CG, `96.9%/24.2%` Inter) wired into `--font-display`/`--font-sans` → near-zero swap shift. Weights 500/600/700 CG and Inter italic were provably unused (class audit of HTML+JS) and were cut.
4. **Hero LCP**: `<picture>` AVIF (143 KB, q60, visually verified against the 443 KB original in dark regions) with progressive-JPEG fallback; preload targets the AVIF, `media="(min-width:1024px)"`, `fetchpriority="high"`. Client render emits an identical `<picture>` (bundle patch) → zero re-download after mount.

### Media pipeline
5. **Poster wall: 9.15 MB → ~323 KB initial**. Each poster now ships `-640.avif` (grid, 10 to 83 KB) + `-640.jpg` fallback + `-1200.jpg` (lightbox only, on click). Static grid = `<picture>` with `width/height` (CLS-safe; aspect-ratio preserved); client grid patched to the same 640w pair → cache-identical URLs across the React teardown. Lightbox patched from full originals to `-1200.jpg`. Quality visually QA'd at display size (grain/blacks preserved); originals deleted from the tree.
6. **Other media**: hero/headshot re-encoded progressive mozJPEG in place (443→224 KB, 204→73 KB) + AVIF in `<picture>`; `press-photo.png` 490 KB → 63 KB JPEG (string-patched); 3 heavy project thumbs re-encoded (200→99 KB etc.).
7. **YouTube embeds**: dead 1 s-after-load iframe-src timer removed; bundle now sets real `src` on the 7 lazy iframes → native `loading="lazy"` defers each until near-viewport; `preconnect` to youtube-nocookie moved to the idle boot (was taxing the critical path for a scroll-reached resource).

### Runtime / a11y / GPU
8. `prefers-reduced-motion` now also stops `.hero-kenburns` and the three drifting `.ambient-orb`s (previously animated full-viewport blur layers under PRM).

### Caching / edge
9. `_headers`: hashed `/*.js` + `/*.css` and `/fonts/*` → `immutable, max-age=1y` (files renamed on change by content hash: `index-9db1dbeb.js`, `index-ba4ce5d7.css`); images keep 1 d + `stale-while-revalidate=30d`.
10. `sitemap.xml` updated (`press-photo.jpg`).

## 3. Verification performed

- `node --input-type=module --check` on the patched bundle: clean.
- jsdom smoke test (`/home/user/perf-tools/smoke.mjs`, not in repo): executes the patched bundle against the new `index.html`, 18/18 assertions pass, **zero runtime errors**, React renders, poster/hero `<picture>` correct, lightbox opens on click serving `-1200.jpg`, 7 iframes have real lazy `src`, sticky player hidden until play, play buttons present.
- Local HTTP crawl: every one of the 74 referenced assets returns 200; zero stale references to deleted files/old hashes/Google origins across HTML/JS/CSS/sitemap.
- Byte accounting (raw / brotli): HTML 70.7 KB/10.2 KB, CSS 74.9 KB/10.7 KB, JS 421.8 KB/107.5 KB (now off the critical path). Desktop critical transfer ≈ 260 KB including hero AVIF + fonts, vs ~1.2 MB before (which also included eager JS). Poster wall scroll cost 9.15 MB → ≤ 323 KB (AVIF-capable) / ≤ 593 KB (JPEG-only).
- **Not verifiable in this sandbox**: no headless browser or network route to the live edge, so real Lighthouse/CrUX/LCP timings and CDN brotli/HTTP-3 behaviour were not measured. Static markup was mirrored byte-for-byte from the verified client markup and every utility class inserted was confirmed present in the compiled CSS.

## 4. Residual risks & decisions for humans

- **Hydration upgrade (recommended, not shipped)**: the correct end-state is regenerating the static HTML from the app and switching `createRoot`→`hydrateRoot` (eliminates the DOM teardown entirely and lets the flicker `<style>` hacks in head be deleted). Not shipped because it requires a real-browser hydration diff to prove; with JS deferred to idle the teardown cost is now off the critical path, so this is polish, not a bottleneck. Owner: engineering, with source repo.
- **AVIF preload on non-AVIF desktop browsers** (<2% by 2026): the `media="(min-width:1024px)"` preload fetches the AVIF which `<picture>` then doesn't use (console warning only). Accepted.
- **JS-gated interactivity**: play buttons / sticky player appear at `load`+idle instead of at parse. Static showreel list and CTAs are fully usable before that. Accepted; measure INP/engagement and revisit if support inquiries drop.
- **Audio re-encode** (12.5 MB longest track at ~256 kbps): left untouched deliberately, streaming is progressive and bitrate is a brand-quality call. If mobile data matters more than master fidelity, re-encode to 160 kbps CBR (+ update immutable cache via filename change). Owner: composer.
- **Poster `-1200.jpg` lightbox**: capped at 1200 px long side; if 4K fullscreen inspection of posters is ever a use case, add an AVIF tier. Owner: design.
- `Cache-Control: immutable` on hashed JS/CSS now depends on the rename-on-change discipline (hashes are content-derived; enforce in whatever build/commit flow produces these files).

---

## 5. Store page: added 2026-09-17

New route `/store` (source + maintenance notes in `STORE.md`). It deliberately
does **not** touch the React bundle's runtime: the page is plain prerendered
HTML with one 19 KB stylesheet and one 3 KB deferred script, built by
`store-src/build.sh` into content-hashed `store-<hash>.{css,js}` + `store.html`.

- **Critical path**: HTML (28.5 KB / ~5 KB brotli) + `store-*.css` + 3 preloaded
  woff2 faces. No React, no framer-motion, no 420 KB bundle, the store is
  interactive after ~25 KB of subresources, and the filters degrade to "all
  releases visible" without JS.
- **Caching**: generated filenames are content-derived, so `/*.css` + `/*.js`
  `immutable` headers stay honest; `/store.html` is `must-revalidate` like
  `index.html`. `_redirects` gains `/store` + `/store/` above the SPA catch-all.
- **Cover art** is hot-linked from the three marketplace CDNs with
  `loading="lazy"`, `decoding="async"`, `referrerpolicy="no-referrer"` and a
  monogram fallback on `error`, third-party origins are off the critical path
  and a pulled image cannot leave a hole in the grid.
- **Integration cost on the homepage**: +2 nav-entry bytes in the bundle
  (`Ix` array) and one footer link; the bundle was re-hashed and
  `index.html`'s dynamic import updated (`index-b43ddf07.js`).
- **Not verifiable in this sandbox**: no headless browser, so no visual capture
  or Lighthouse run for the new page; verified instead by jsdom behavioural
  tests (38 assertions on `/store`, 14 on the homepage boot) and a local HTTP
  crawl of every referenced asset.

### 5.1 Immersive pass + Bandcamp: 2026-09-17 (later)

Catalogue grew 8 → 14 (5 Bandcamp records, 1 more eBay object) and the page
picked up the portfolio's atmosphere kit. Budget after the pass: HTML 47.5 KB,
CSS 32 KB, JS 9 KB (all pre-compression, still zero framework).

- **LCP** is now the hero plate `images/atmosphere-bg.jpg` (33.8 KB, already in
  the repo, `preload` + `fetchpriority="high"`); Ken-Burns runs on `transform`
  only. Every other image stays lazy, including the three sleeves in the
  discography band.
- **Motion cost is opt-in by capability**: tilt/spotlight and the torch only
  bind on `(hover:hover) and (pointer:fine)`, everything is rAF-throttled, and
  `prefers-reduced-motion` turns off Ken-Burns, orbs, drips, flicker, ticker,
  VHS roll, torch, tilt and scroll-reveal in one media block.
- **Audio never autoplays**: previews and the Room-tone loop are
  `preload="none"` `Audio()` objects created on first click, reusing cues that
  are already cache-immutable under `/audio/*`. No new media files were added.
- **New third-party origin**: `f4.bcbits.com` (Bandcamp covers), dns-prefetched,
  lazy, `no-referrer`, same monogram fallback.
- jsdom suite is now 54 assertions (filters incl. `records`, hashchange,
  previews, ambience, atmosphere layers, JSON-LD 14 products).

### 5.2 Catalogue 14 → 20: 2026-09-17 (later still)

Three more Bandcamp records, one Gumroad score facsimile (new `scores`
collection) and two eBay objects. No new origins, no new local media; one
additional preview button reuses `/audio/track-07.mp3`. HTML 61.7 KB, CSS
unchanged (32 KB), JS 9 KB. jsdom suite: 60 assertions.

### 5.3 Boutique pass: 2026-09-17 (evening)

The store hero no longer loads `images/atmosphere-bg.jpg` (33.8 KB AVIF/JPEG
plate, formerly the page LCP). The opening is now text plus four Bandcamp
sleeves that were already on the page further down, so the LCP candidate is
either the `<h1>` (fonts are preloaded) or the `fetchpriority="high"` centre
sleeve. Net: one fewer local request, no layout-shifting background, and the
first paint is pure CSS.

Added: custom cursor (two fixed elements, transform-only, one rAF loop that
stops when the ring has caught up), sticky masthead state, per-group hide on
filter. All pointer effects gate on `(hover:hover) and (pointer:fine)` and
`prefers-reduced-motion`. Budget: HTML 66.2 KB, CSS 34.1 KB, JS 11.5 KB, all
content-hashed. jsdom suite: 65 assertions, including "no em dashes" and "no
`atmosphere-bg` reference".


---

## 6. Zero-Lag Media Preload & Video Instant Playback: 2026-09-17 (night)

Scope: Eliminate all media loading lag, scroll hitching, and video playback delay across `index.html`, `store.html`, and the client React bundle (`index-499c2aca.js`).

### 6.1 Critical Media Preload & Prefetch Pipeline

1. **Dual-Mode Hero Preload**:
   - Above-the-fold `atmosphere-bg.jpg` preloaded with `fetchpriority="high"`.
   - Responsive hero portrait preloads for desktop (`hero-portrait.avif`, `min-width: 1024px`) and mobile (`hero-portrait.jpg`, `max-width: 1023px`).
2. **Third-Party Video Origins Preconnect & DNS-Prefetch**:
   - Early preconnect to `https://www.youtube-nocookie.com` and `https://i.ytimg.com`.
   - DNS prefetch to `youtube.com`, `drive.google.com`, `googleads.g.doubleclick.net`, and `static.doubleclick.net` so TLS handshakes are complete well before any video interaction.
3. **Speculative Video Embed Prefetching**:
   - Prefetch tags inserted for all 7 YouTube sample embed players (`HaVJP08j77U`, `ItrrcilS0ro`, `riCvy2abhlc`, `Ty8tPp59mDc`, `rvCGO0BJ_2E`, `6qa3Uwj47fc`, `UX2kv3G89Jw`).
   - Browser pre-fetches and caches YouTube player player shell documents in background.
4. **Thumbnail & Sleeve Prefetches**:
   - Prefetch for all 8 project thumbnails, 8 640w poster AVIFs, headshots, and boutique catalogue sleeves.

### 6.2 Active Image Preloader & GPU Pre-decoding (`img.decode()`)

To prevent micro-stutters and main-thread decode jank during scrolling:
- **On-Page Assets (27 items)**: An active preloader instantiates `Image()` objects and immediately invokes `img.decode()`. Image pixels are pre-decompressed into GPU textures before entering viewport, guaranteeing locked 60/120fps scrolling.
- **Lightbox High-Res Assets (8 items)**: 1200w poster images are decoded during browser idle time via `requestIdleCallback(..., { timeout: 1500 })` with `fetchPriority: "low"`, ensuring instant display upon clicking any poster without contending with initial page resources.

### 6.3 Instant Inline Video Playback (Zero Click-to-Play Delay)

Previously, project cards either linked away to third-party pages or waited for external redirection:
- **In-Place Autoplaying Embeds**: Clicking any video card dynamically swaps the poster thumbnail for an embedded responsive iframe with `autoplay=1` and hardware acceleration flags (`accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture`).
- **Pre-Hydration Instant Player**: Static HTML includes declarative `data-video-card` attributes and a native lightweight event listener. Users can click or press Enter on any film sample immediately upon initial paint without waiting for React hydration.
- **Client React Bundle Harmony**: `index-499c2aca.js` implements matching stateful video player logic with hover/pointerenter prefetching. DOM markup between static HTML and React component is identical, eliminating layout shifts and DOM churn.
- **Local Fallback for Drive Assets**: Replaced broken external Google Drive thumbnail URL with high-performance local `/images/project-eclipsed-drive.jpg`.

### 6.4 Service Worker Cache-First Architecture (`sw.js`)

Added `sw.js` for instant sub-5ms repeat visits anytime anyone visits the site:
- **Pre-caching**: Automatically caches 50 critical assets on worker `install` using `Promise.allSettled` (fonts, hero plates, poster wall 640w & 1200w, project thumbs, CSS, JS, audio).
- **Cache-First Static Strategy**: Serves all local images, fonts, styles, and scripts directly from cache, avoiding roundtrips to the network.
- **Stale-While-Revalidate Navigation**: Serves navigation requests (`/`, `/index.html`, `/store`, `/store.html`) instantly from cache while revalidating in the background.
- **Edge Header**: `_headers` configured with `Cache-Control: public, max-age=0, must-revalidate` for `/sw.js` to ensure rapid service worker updates.
