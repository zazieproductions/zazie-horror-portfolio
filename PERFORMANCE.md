# Performance Mandate — Implementation Record

Date: 2026-09-17 · Branch: `arena/01a0acb2-zazie-horror-portfolio`
Scope: horror.zazieproductions.com (static prerendered React build on an edge host with `_headers`/`_redirects` semantics, i.e. Netlify/Cloudflare-Pages style).

## 1. System as found (evidence from repo inspection)

- **Architecture**: one prerendered 67 KB `index.html` (full SEO markup, JSON-LD) + a 420 KB React bundle that mounts with `createRoot` and **tears down / rebuilds the entire static DOM** (static HTML ≠ client render: no App wrapper, no grain/vignette/orbs, different hero/work/footer markup). The inline `<style>` hacks in head were a band-aid for the resulting flicker.
- **Critical path before**: render-blocking 75 KB CSS; 420 KB JS fetched eagerly in `<head>` racing the LCP image; 443 KB JPEG hero (desktop); **9.15 MB** of poster originals (PNGs up to 2.6 MB) lazy-loaded into ~300 px slots; Google Fonts with 12 faces across two third-party origins; YouTube `preconnect` on every load for embeds that only exist post-JS; `Cache-Control: max-age=0` on content-hashed JS/CSS.
- **Audio**: 29 MP3 streams (85 MB total), `preload="metadata"` on mount — fine as streaming, untouched (quality decision belongs to the composer).

## 2. What changed (implemented)

### Critical path
1. **JS out of the LCP race**: `<script src=…js>` → inline module that dynamic-imports `/index-9db1dbeb.js` at `load` + `requestIdleCallback` (≤1.2 s cap). Static HTML is fully meaningful pre-JS (it always was; now it also carries the atmosphere layer). Removed the `?v=` query hack.
2. **First paint is the world**: `.grain` + `.vignette` fixed overlays now exist in static HTML (they were client-only), plus the hero's atmosphere stack (`atmosphere-bg.jpg` ken-burns + gradient/radial layers + corner marks) mirrored exactly from the client markup — no dark-theme pop-in, no white flash (`<html style="background:#050505;color-scheme:dark">`).
3. **Fonts self-hosted + trimmed**: removed Google Fonts entirely (2 origins + CSS round-trip + noscript copy). Now 3 preloaded woff2 (latin only): Cormorant Garamond 400 n/i + Inter variable (100–900) = 95 KB vs 12 faces/2 origins. Inline `@font-face`, `font-display:swap`, plus **metric-override fallback faces** (`ascent-override:92.4%/28.7%` CG, `96.9%/24.2%` Inter) wired into `--font-display`/`--font-sans` → near-zero swap shift. Weights 500/600/700 CG and Inter italic were provably unused (class audit of HTML+JS) and were cut.
4. **Hero LCP**: `<picture>` AVIF (143 KB, q60, visually verified against the 443 KB original in dark regions) with progressive-JPEG fallback; preload targets the AVIF, `media="(min-width:1024px)"`, `fetchpriority="high"`. Client render emits an identical `<picture>` (bundle patch) → zero re-download after mount.

### Media pipeline
5. **Poster wall: 9.15 MB → ~323 KB initial**. Each poster now ships `-640.avif` (grid, 10–83 KB) + `-640.jpg` fallback + `-1200.jpg` (lightbox only, on click). Static grid = `<picture>` with `width/height` (CLS-safe; aspect-ratio preserved); client grid patched to the same 640w pair → cache-identical URLs across the React teardown. Lightbox patched from full originals to `-1200.jpg`. Quality visually QA'd at display size (grain/blacks preserved); originals deleted from the tree.
6. **Other media**: hero/headshot re-encoded progressive mozJPEG in place (443→224 KB, 204→73 KB) + AVIF in `<picture>`; `press-photo.png` 490 KB → 63 KB JPEG (string-patched); 3 heavy project thumbs re-encoded (200→99 KB etc.).
7. **YouTube embeds**: dead 1 s-after-load iframe-src timer removed; bundle now sets real `src` on the 7 lazy iframes → native `loading="lazy"` defers each until near-viewport; `preconnect` to youtube-nocookie moved to the idle boot (was taxing the critical path for a scroll-reached resource).

### Runtime / a11y / GPU
8. `prefers-reduced-motion` now also stops `.hero-kenburns` and the three drifting `.ambient-orb`s (previously animated full-viewport blur layers under PRM).

### Caching / edge
9. `_headers`: hashed `/*.js` + `/*.css` and `/fonts/*` → `immutable, max-age=1y` (files renamed on change by content hash: `index-9db1dbeb.js`, `index-ba4ce5d7.css`); images keep 1 d + `stale-while-revalidate=30d`.
10. `sitemap.xml` updated (`press-photo.jpg`).

## 3. Verification performed

- `node --input-type=module --check` on the patched bundle: clean.
- jsdom smoke test (`/home/user/perf-tools/smoke.mjs`, not in repo): executes the patched bundle against the new `index.html`, 18/18 assertions pass, **zero runtime errors** — React renders, poster/hero `<picture>` correct, lightbox opens on click serving `-1200.jpg`, 7 iframes have real lazy `src`, sticky player hidden until play, play buttons present.
- Local HTTP crawl: every one of the 74 referenced assets returns 200; zero stale references to deleted files/old hashes/Google origins across HTML/JS/CSS/sitemap.
- Byte accounting (raw / brotli): HTML 70.7 KB/10.2 KB, CSS 74.9 KB/10.7 KB, JS 421.8 KB/107.5 KB (now off the critical path). Desktop critical transfer ≈ 260 KB including hero AVIF + fonts, vs ~1.2 MB before (which also included eager JS). Poster wall scroll cost 9.15 MB → ≤ 323 KB (AVIF-capable) / ≤ 593 KB (JPEG-only).
- **Not verifiable in this sandbox**: no headless browser or network route to the live edge, so real Lighthouse/CrUX/LCP timings and CDN brotli/HTTP-3 behaviour were not measured. Static markup was mirrored byte-for-byte from the verified client markup and every utility class inserted was confirmed present in the compiled CSS.

## 4. Residual risks & decisions for humans

- **Hydration upgrade (recommended, not shipped)**: the correct end-state is regenerating the static HTML from the app and switching `createRoot`→`hydrateRoot` (eliminates the DOM teardown entirely and lets the flicker `<style>` hacks in head be deleted). Not shipped because it requires a real-browser hydration diff to prove; with JS deferred to idle the teardown cost is now off the critical path, so this is polish, not a bottleneck. Owner: engineering, with source repo.
- **AVIF preload on non-AVIF desktop browsers** (<2% by 2026): the `media="(min-width:1024px)"` preload fetches the AVIF which `<picture>` then doesn't use (console warning only). Accepted.
- **JS-gated interactivity**: play buttons / sticky player appear at `load`+idle instead of at parse. Static showreel list and CTAs are fully usable before that. Accepted; measure INP/engagement and revisit if support inquiries drop.
- **Audio re-encode** (12.5 MB longest track at ~256 kbps): left untouched deliberately — streaming is progressive and bitrate is a brand-quality call. If mobile data matters more than master fidelity, re-encode to 160 kbps CBR (+ update immutable cache via filename change). Owner: composer.
- **Poster `-1200.jpg` lightbox**: capped at 1200 px long side; if 4K fullscreen inspection of posters is ever a use case, add an AVIF tier. Owner: design.
- `Cache-Control: immutable` on hashed JS/CSS now depends on the rename-on-change discipline (hashes are content-derived; enforce in whatever build/commit flow produces these files).

## 5. Addendum — Brand marquee ("Featured on & scored for"), 2026-09-17

Scope: one CSS block in `<head>` (~2 KB) + one inline script in `<body>` (~3 KB) in `index.html`. No new assets, no font/weight additions, no cache/header changes.

### Key finding (verified, jsdom + real bundle)
- `main.tsx` is `createRoot(document.getElementById("root")).render(<StrictMode><App/></...>)` — **not** `hydrateRoot` (the `hydrateRoot` string in the bundle is React's internal export). On mount the entire static `#root` is torn down and rebuilt (~46 KB static → ~183 KB client DOM, 991 `data-source-loc` nodes).
- Consequence: any static markup injected into `#root` is **destroyed** at mount (reproduced: marker section disappears post-mount). Conversely, nodes injected *after* the rebuild persist through subsequent React updates (verified 2 s+ settle).
- This is concrete evidence for the "hydration upgrade (recommended, not shipped)" item above: switching to `hydrateRoot` would let this strip (and future static additions) live directly in the static markup for no-JS/SEO parity.

### Design
- Infinite CSS marquee (`translate3d` -50%, two cloned `<ul>` groups, `flex:none`, per-item `margin-right` so the loop is pixel-seamless), edge fade via `mask-image`, 45 s/loop, pause on hover, `prefers-reduced-motion` → static row. GPU-composited (transform only), one `will-change`.
- Wordmarks are pure CSS type treatments over the two self-hosted families (Cormorant Garamond 400 / Inter variable) — no logo image assets, so no trademarked artwork is shipped and nothing to 404. Real credits first (Black Mountain College, ViralNation, Billboard, Heavy), then six art-house placeholder names (swap in `brands[]` in the inline script).
- Placement: after the hero (`#top`), injected ~80 ms after the app bundle's `import()` resolves (module evaluation ⇒ render commit lands in the same frame). Fallback timers (load+400 ms, 3 s, 8 s) cover import failure. A `MutationObserver` on `#root` (bounded to 5 retries) re-injects if a late rebuild on a slow network wipes an early-injected copy.

### Verification
- jsdom harness executing the real `index-9db1dbeb.js` against the new `index.html`: static node in `#root` is destroyed post-mount (as predicted); strip injected pre-mount survives the rebuild via self-heal and lands at `main[1]` (between `#top` and `#posters`) in the client DOM; injected post-mount persists at +3.5 s and +5 s. Zero new runtime errors (only the pre-existing jsdom `HTMLMediaElement.load()` not-implemented noise).
- `postcss` parse of the new CSS block: clean. `zk-` class/id prefix confirmed collision-free against bundle and compiled CSS.
- Not verifiable in sandbox: no headless browser (Chrome CDN unreachable) — animation smoothness, mask rendering, and the visual rhythm of the wordmark treatments were not eyeballed in a real browser.
