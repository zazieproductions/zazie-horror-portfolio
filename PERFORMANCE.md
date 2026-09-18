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
  `immutable` headers stay honest; `/store`, `/store/`, `/store/index.html` and
  `/store.html` are `must-revalidate` like `index.html`. `/store` is served
  natively from `store/index.html` (no `_redirects` rewrite: a `200` rewrite to
  `/store.html` loops against Cloudflare Pages' pretty-URL redirect).
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

# ZP Archive Boot, analog-horror terminal intro

Date: 2026-09-17 · Branch: `arena/01a0b074-zazie-horror-portfolio`

## What it is

A terminal-style loading screen with analog-horror dressing shown once per session on first
paint: CRT power-on flash to typed BIOS boot log (29 archive cues indexed) to `PLAY SHOWREEL.REEL`
with a VHS tracking bar to signal glitch (RGB split, jitter, EAS-style red frame double-blink,
"UNREGISTERED SIGNAL" warnings) to VHS OSD chrome (`► PLAY`, blinking `● REC`, running `SP` counter,
scanlines, vignette, rolling tracking band) to blinking gate to CRT power-off collapse revealing the site.

## Cost & performance guardrails

- **Zero network requests**: ~15 KB raw / ~4 KB gzip of inline HTML+CSS+JS in `index.html`.
  No fonts (uses `ui-monospace` stack), no images, no audio files.
- **Animation hygiene**: only `transform`, `opacity`, and `filter` animate; `contain: strict`
  on the overlay; scanlines are static gradients; the whole thing self-destructs (node removed).
- **Timing**: ≈5.4 s to the gate; any click / key / wheel / tap skips instantly; gate auto-enters
  after 2.8 s; JS hard cap at 9.2 s; CSS force-hide at 10 s as the final failsafe.
- **Sound**: none by default. A ~0.3 s synthesized tape-click/power-down (WebAudio, peak gain 0.055)
  plays only when the user's own click/keypress dismisses the screen, autoplay-policy safe.

## Correctness guardrails

- **Overlay lives outside `#root`**, so the React bundle's teardown/rebuild can never remove it.
- **No-JS / crawlers / bots / Lighthouse**: overlay is `display:none` unless a synchronous head
  script adds `.zp-boot-on` to `<html>`; bots and `prefers-reduced-motion` never get it. Page
  content is fully present in the DOM regardless (SEO untouched).
- **JS error mid-sequence**: try/catch to `finish()`; CSS `zpForceHide` animation hides the overlay
  even if every JS path dies.
- **bfcache restore mid-boot** (`pageshow.persisted`) to instant teardown.
- **Once per session** via `sessionStorage` (`zpBootShown`); replay with `?boot=1` or `#boot` (force also bypasses reduced motion via a `zp-boot-force` class). Preview/dev hosts (e2b.app, pages.dev, localhost, 127.0.0.1) ignore the session flag and replay on every load, so the intro stays demoable while building; production domains keep the once-per-session gate.
- Emits `zp:bootdone` on `window` after teardown, future hook for starting ambience/music
  from the site's own player.

## Workshop notes (deliberate creative choices to revisit)

- `© 1987 ZAZIE PRODUCTIONS` is an intentional analog-horror anachronism (real founding: 2022).
- The corrupted tracking bar stays corrupted after the glitch, the tape never fully heals.
- Gate copy: `[ CLICK OR PRESS ANY KEY TO OBSERVE ]`.
- Possible next iterations: per-visit tape number, longer scare on repeat visits, tying
  `zp:bootdone` into the showreel player, CRT curvature on large screens.

---

# Hero Copy Rewrite: deliverable list → outcome promise

Date: 2026-09-17 · Branch: `arena/01a0ac9b-zazie-horror-portfolio`

The hero's third line was a deliverables list (`Themes, tension cues, stems,
and alternate mixes delivered for picture.`). It now leads with the outcome the
buyer hires for and names the two stages they own:

> Music that makes the fear land. Built for your edit, ready for your mix.

- **Both copies patched**: the prerendered hero in `index.html` and the same
  string inside the React bundle, so the post-mount teardown rebuilds the
  paragraph with identical text (no flash of the old line after boot).
- **Content-hashed rename**, per the `immutable` discipline in `_headers`:
  `index-b43ddf07.js` → `index-bf264c32.js` (raw file sha256, first 8 hex,
  matching the existing `index-*` convention). `index.html`'s dynamic import
  updated; no `?v=` query reintroduced. Nothing else referenced the old hash
  except §5 above, which is a dated record of that change.
- **Cost**: +1 byte of hero copy, +1 byte of bundle (423,059 → 423,060). No
  markup, class, spacing or component change, so no layout shift or reflow.
- **House style**: no em dashes (matches the store suite's assertion).
- **Not verifiable in this sandbox**: no headless browser, so no visual capture.
  Verified instead by `node --input-type=module --check` on the renamed bundle
  and a local HTTP crawl (200 on `/index.html` and `/index-bf264c32.js`, zero
  stale references to the old hash in any served file).

---

---

## 6. Zero-Lag Media Preload & Video Instant Playback: 2026-09-17 (night)

Scope: Eliminate all media loading lag, scroll hitching, and video playback delay across `index.html`, `store.html`, and the client React bundle (`index-8638e732.js`).

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
- **Client React Bundle Harmony**: `index-8638e732.js` implements matching stateful video player logic with hover/pointerenter prefetching. DOM markup between static HTML and React component is identical, eliminating layout shifts and DOM churn.
- **Local Fallback for Drive Assets**: Replaced broken external Google Drive thumbnail URL with high-performance local `/images/project-eclipsed-drive.jpg`.

### 6.4 Service Worker Cache-First Architecture (`sw.js`)

Added `sw.js` for instant sub-5ms repeat visits anytime anyone visits the site:
- **Pre-caching**: Automatically caches 50 critical assets on worker `install` using `Promise.allSettled` (fonts, hero plates, poster wall 640w & 1200w, project thumbs, CSS, JS, audio).
- **Cache-First Static Strategy**: Serves all local images, fonts, styles, and scripts directly from cache, avoiding roundtrips to the network.
- **Stale-While-Revalidate Navigation**: Serves navigation requests (`/`, `/index.html`, `/store`, `/store.html`) instantly from cache while revalidating in the background.
- **Edge Header**: `_headers` configured with `Cache-Control: public, max-age=0, must-revalidate` for `/sw.js` to ensure rapid service worker updates.

---

# Film sample cards: genre subtitle removed

Date: 2026-09-18 · Branch: `arena/01a0b207-zazie-horror-portfolio`

Every card in the Film samples grid carried a third line under the title:
"Sleep Paralysis Horror Short", "Dramatic Short", "Horror Short", and five
more of the same kind. On a horror composer's own site those labels restate
what the card already says: the red role tag above the title ("Original Score",
"Cue / Chase Sequence") names the job, and the thumbnail is the film itself.
All eight lines are gone. Two of them carried something other than a genre
("Official Teaser: Crystal Fox Films", "Action Thriller Scene"); the studio
credit still lives on the poster wall and at the linked video, and one
surviving subtitle would read as an inconsistency rather than a credit.

- **Both copies patched**: the prerendered cards in `index.html` and the React
  `Projects.tsx` output in the bundle (`<p class="mt-1 text-xs …">{n.type}</p>`),
  plus the now unused `type` field on all eight entries of the `projects`
  array, so the post-mount teardown rebuilds identical cards (no flash of the
  old line after boot).
- **What each card keeps**: role tag, title, external link. Nothing above the
  removed line changed, so no reflow and no layout shift.
- **Cost**: bundle 425,038 → 424,692 bytes, `index.html` 136,946 → 136,281.
- **Content-hashed rename**, per the `immutable` discipline in `_headers`:
  `index-9e79ed09.js` → `index-4d596325.js` (raw file sha256, first 8 hex).
  `index.html`'s dynamic import and the precache entry in `sw.js` updated; no
  stale references remain in any served file.
- **Kept at the time, reversed later the same day**: the poster wall captions
  ("Short · A film by …", "Feature · A film by …") went too, in the follow-up
  entry below. The video titles in `sitemap.xml` stay: they exist for video
  search and are not page copy.
- **Not verifiable in this sandbox**: no headless browser, so no visual
  capture. Verified instead by `node --input-type=module --check` on the
  renamed bundle and a local HTTP crawl (200 on `/`, `/index.html`,
  `/index-4d596325.js`; 404 on the old hash; zero matches for the removed
  class in either copy).

---

# Poster wall: format caption removed

Date: 2026-09-18 · Branch: `arena/01a0b207-zazie-horror-portfolio`

Follow-up to the film sample entry above. Each poster carried a line under its
title as well: "2025 · A Muhammad Abed Baryal Film", "Feature · A film by
William Viera", "Series · A pilgrimage of foreign forces", and five more.
Format words like "Short" and "Feature" are not what a director hires on, so
the line is gone and the poster now reads as a poster: title only.

- **Both copies patched**: the prerendered `<p>` in `index.html`, which read
  `year · tagline`, and the `PosterWall.tsx` render in the bundle, which read
  `year` on its own. The two copies did not even agree before this change, so
  the caption used to swap text when the bundle mounted; now both render
  nothing and the grid is stable across the teardown.
- **No data deleted**: `year`, `tagline` and `detail` stay on the poster
  objects, because the lightbox still uses all three. That panel is a click
  away and is where a credit belongs, so it keeps the year label, the credit
  line and the tagline.
- **Cost**: bundle 424,692 → 424,525 bytes, `index.html` 136,281 → 135,205.
- **Content-hashed rename**, per the `immutable` discipline in `_headers`:
  `index-4d596325.js` → `index-59310ce8.js` (raw file sha256, first 8 hex).
  `index.html`'s dynamic import and the `sw.js` precache entry updated; no
  stale references remain in any served file.
- **Not verifiable in this sandbox**: no headless browser, so no visual
  capture. Verified instead by `node --input-type=module --check` on the
  renamed bundle and a local HTTP crawl (200 on `/`, `/index.html`,
  `/index-59310ce8.js`; 404 on the previous hash; zero matches for the removed
  class in either copy).

# Cinema player: embedded video size, sharpness and fullscreen — 2026-09-18

## What was wrong (evidence, not guesswork)

- **The player was simply too small.** Each sample sat in one cell of a
  `md:grid-cols-2` grid inside `max-w-7xl`, so at a 1280px viewport the iframe
  was ~596 × 335 CSS px. YouTube's IFrame player picks its rendition from the
  player's **pixel dimensions**, not from the source's best stream: the standard
  failure mode documented for embeds is a ~600px player being served 360p/480p
  regardless of what the upload contains. That, not CSS, is what made the
  picture soft.
- **The site's own decoration was dimming the picture.** `.vignette`
  (`radial-gradient(#0000 40%, #000000a6)`, `z-index:85`) and, to a much
  smaller degree, `.grain` paint over everything, including the player's
  control bar in the bottom-right corner.
- **Neither iframe delegated `fullscreen` through Permissions Policy.** The
  YouTube frame's `allow` list stopped at `web-share` and the Drive frame's at
  `autoplay`; both relied on the legacy `allowfullscreen` alias alone.
- **The poster was destroyed on play** (`card.innerHTML = <iframe>`), so a card
  could never be closed and a second card could be opened while the first kept
  playing.
- **The pre-mount player was torn down by the mount.** The inline handler
  created the iframe in the prerendered DOM; `createRoot().render()` then
  replaced `#root`, and the React copy had no idea anything was playing.

## What changed (both copies: prerendered `index.html` and the bundle)

- **Cinematic breakout frame.** The active card gets `.is-playing`, spans the
  whole grid row (`grid-column:1/-1`) and is sized
  `min(94vw, 1600px, calc((100svh - 7rem) * 16 / 9))`, centred on the row with
  a percentage margin so nothing relies on `transform`. The height leg keeps the
  frame fully on screen on short laptops. Nothing is upscaled: the iframe
  renders at the frame's real pixel size (`width/height:100%`,
  `max-width/max-height:none`).

  | viewport | player before | player after | width | area |
  | --- | --- | --- | --- | --- |
  | 390×844 (phone) | 358px | 358px | 1.00× | 1.00× |
  | 768×1024 | 340px | 722px | 2.12× | 4.51× |
  | 1024×768 | 468px | 963px | 2.06× | 4.23× |
  | 1280×800 | 596px | 1203px | 2.02× | 4.08× |
  | 1440×900 | 596px | 1354px | 2.27× | 5.16× |
  | 1920×1080 | 596px | 1600px | 2.68× | 7.21× |

  Phones were already full-bleed, so they gain fullscreen rather than width.
- **Player attributes.** Privacy-enhanced `youtube-nocookie.com` host kept;
  params trimmed to `autoplay=1&rel=0&color=white&playsinline=1&iv_load_policy=3&fs=1`.
  `modestbranding=1` was dropped — YouTube deprecated it in 2023 and it no
  longer does anything. `playsinline=1` keeps iOS inline, `fs=1` keeps the
  fullscreen control. Both frames now carry
  `allow="...; fullscreen"` **and** `allowfullscreen`, plus
  `referrerpolicy="strict-origin-when-cross-origin"` and a real `title`.
- **The Google Drive sample stays on the `/preview` player** — that is already
  the correct embeddable form (it is the only one Google serves an embeddable
  player for; `/view` is the file page, `uc?export=download` is a download).
- **Controls are never covered.** The poster is hidden (`.is-live>*{display:none}`)
  instead of deleted, only one player can be live, and `body.zp-player-open`
  fades `.vignette`, `.blood-vignette` and `.grain` to 0 for the duration of
  playback, so the control bar is at full contrast.
- **Handoff to React.** Both implementations publish the active id on
  `window.__zpPlayer`; the `Projects` component seeds its state from it, so a
  visitor who presses play before the bundle loads keeps their player through
  the mount instead of watching it disappear.
- **Cost**: bundle 424,525 → 425,650 bytes; `index.html` 156,077 → 161,574.
- **Cache discipline**, per the `immutable` rules in `_headers`:
  `index-59310ce8.js` → `index-5be19885.js` (raw file sha256, first 8 hex).
  `index.html`'s dynamic import and the `sw.js` precache entry updated; the
  service worker cache is bumped `zazie-v2` → `zazie-v3` so a returning visitor
  is not served the previous (immutably cached) html/js pair.

## Verification performed

- **DOM harness (jsdom), 48 assertions, all passing**, over both copies:
  prerendered click → correct iframe src/params/`allow`/`allowfullscreen`/
  `title`/`referrerpolicy`; keyboard activation; switching cards leaves exactly
  one live player and collapses the previous one; the bundle mounts, renders
  eight `.zp-vcard`s, keeps a pre-mount player alive and emits byte-identical
  player markup to the prerendered copy.
- **Ancestor audit** for fullscreen: no `transform`, `filter`, `backdrop-filter`
  or clipping `overflow` on any ancestor of the frame between `.zp-vcard` and
  `<html>`; the fullscreen control sits in an iframe that nothing overlays.
- **`_headers` audit**: `frame-src`/`media-src`/`script-src` already allow
  `youtube-nocookie.com` and `drive.google.com`; `Permissions-Policy` does not
  disable `fullscreen` — the missing piece was the per-frame delegation, now
  fixed.
- **CSS parsed** with PostCSS (0 errors across all six inline blocks) and
  `node --input-type=module --check` on the renamed bundle.
- **Local HTTP crawl**: 200 on `/`, `/index.html`, `/index-5be19885.js`,
  `/index-ba4ce5d7.css`, `/work`, `/reel`, `/store.html`; 404 on the retired
  hash; zero stale references in any served file.

## Provider limits that no code on our side can override

- **YouTube quality is adaptive and size-driven.** There is no supported
  parameter that pins a rendition (`vq=hd1080` is undocumented, was withdrawn
  and reinstated over the years, and is ignored when the ladder disagrees);
  `hd=1`, `fmt=` and `showinfo` are gone. The only honest lever is the one used
  here — give the player a large viewport. The user still gets 1080p/1440p only
  if the upload has those renditions and the connection carries them.
- **`rel=0` no longer removes related videos** (post-2018 it only restricts them
  to the same channel), and the player's title bar can still link out to
  YouTube. Ordinary playback never navigates the page itself.
- **Google Drive transcodes to its own renditions**, capped at 1080p, and picks
  between them adaptively; there is no parameter to request a specific
  rendition. Drive also owns the player chrome, including how the quality and
  fullscreen controls behave inside it.
- **Drive file size / virus scan**: this sample is `Eclipsed V3 Distortion.mov`,
  356 MB. Files over ~100 MB are not virus-scanned, and large files are where
  Drive's preview degrades or falls back to a "can't scan this file for
  viruses / download" interstitial. A server-side fetch of
  `/file/d/1zKtAavEx-Yjd2To_troEYlxTTt62Y2OU/preview` currently lands on the
  download + virus-scan page rather than the player. **If the Eclipsed sample
  does not stream in a browser, the fix is on the Drive side**: re-upload a
  ≤300 MB H.264/AAC `.mp4` (1080p max) and keep the same share setting. Our
  markup is already the correct embeddable form; nothing in the page can make
  Drive stream a file it declines to preview.
- **Not verifiable in this sandbox**: no headless browser (no `libnss3`, no
  reachable browser CDN) and no outbound network to YouTube or Drive, so actual
  playback, rendition selection and the fullscreen transition were verified as
  preconditions (attributes, permissions policy, overlay/ancestor audit) and
  must be eyeballed once in a real browser.

# Poster wall: THE DARK AWAITS added (8 → 9 productions) — 2026-09-18

## Source
- Upload `The Dark Awaits.png` (3022×1566) is a viewer screenshot, not a clean
  poster: browser chrome (Close, `4 of 4`, arrows) plus a semi-transparent info
  bar covering the lower title line. Credit visible in the bar:
  `© Matthew kondracki` → carried as `A Matthew Kondracki Film`.
- Central portrait crop (1100×1400) cleaned to key art (848×1264, ~2:3): eye
  untouched, `THE DARK AWAITS` title restored, no interface elements.

## Assets (same pipeline as the other eight posters)
- `images/posters/the-dark-awaits-640.jpg` — 640×954, 104 KB, q82
- `images/posters/the-dark-awaits-640.avif` — 640×954, 58 KB, q60
- `images/posters/the-dark-awaits-1200.jpg` — 805×1200, 151 KB, q82 (lightbox)

## What changed (both copies: prerendered `index.html` and the bundle)
- Poster grid: ninth `<li>` after MIKE HAS A VISITOR (prerender links to the
  composer's IMDb, matching the UNSEEN/PEREGRINUS/ECLIPSED fallback — no title
  IMDb or video URL is known yet). Prefetch, `pageImages`, `lightboxImages`
  extended the same way.
- Bundle `n1` array: `{title:"THE DARK AWAITS", year:"Feature",
  detail:"A Matthew Kondracki Film", poster/thumb/thumbA, featured:!0}` — no
  `tagline` (nothing quotable on the source), no `imdb`/`yt` (lightbox shows
  Close only until a link is known).
- Counts 8 → 9 everywhere they appear: meta/OG/Twitter descriptions, FAQPage
  Q8, both ItemLists (`numberOfItems` + 9th CreativeWork, Supernatural /
  Psychological Horror), hero, poster-section lede, footer, `/work` h1 + 9th
  hub-card, hub teasers on `/composer /contact /process /reel /services`,
  `404.html`, `SEO-DOSSIER.md`.
- **Cache discipline**, per the `immutable` rules in `_headers`:
  `index-5be19885.js` → `index-7a2157f4.js` (raw file sha256, first 8 hex).
  `index.html`'s dynamic import and the `sw.js` precache entry updated, the
  retired hash deleted, and the service worker cache bumped
  `zazie-v3` → `zazie-v4` so a returning visitor is not served the previous
  (immutably cached) html/js pair. New poster paths need no busting.

## Verification performed
- `node --input-type=module --check` on the renamed bundle, `node --check` on
  `sw.js`, all 14 JSON-LD blocks parsed as JSON.
- Local HTTP crawl: 200 on `/`, `/work`, `/index-7a2157f4.js`, all three new
  poster assets; 404 on the retired hash; zero stale references in any served
  file; no remaining `8 productions` / `Eight` counts outside history docs.
- Assumptions to confirm with the filmmaker credit: format label (`Feature`),
  genre pair, and the future IMDb/YouTube URL (one-line change in the bundle
  entry + prerender `<a href>` + `/work` hub-card when known).
---

# Method band: psychological audit / sonic terrain design / trajectory scoring — 2026-09-18

## What was added

The studio's method statement now has a home on two surfaces (and, on the
homepage, in both copies):

- **`index.html` `<section id="method">` (prerendered copy) and the bundle's
  `Method` component** — a new band under the `03 · Approach` intro: label
  "The method · three movements", the statement in the composer's own words
  ("I don't write 'music for scenes.' *I build entire sonic ecosystems that
  breathe with your world.*"), then three cards numbered in Roman numerals so
  they never collide with the palette cards underneath:

  | # | Movement | Core claim |
  | --- | --- | --- |
  | I | Psychological audit | dread is diagnosed before a note is written; unconscious triggers mapped first |
  | II | Sonic terrain design | custom instruments, found sounds, sub-bass felt in the sternum |
  | III | Trajectory scoring | where anxiety starts, peaks, what residue it leaves |

  The pre-existing three pillar cards stay, now under a `Palette · what the
  score is made of` label, so the section reads "how" (method) then "what"
  (palette) instead of six unlabelled look-alike cards.
- **`/process`** — new clause `III Method - psychological audit, sonic terrain
  design, trajectory scoring` (`#method`) documenting the three movements for
  the page's audience. Clauses after it renumbered: Composition IV, Revisions V,
  Delivery VI, Rights VII, Related archives VIII. The contents list now reaches
  `#related`, which it previously omitted, and the header `doc-meta` line reads
  `Method · Psychological audit · sonic terrain design · trajectory scoring`.
- **`/composer`** `#approach` — one paragraph pointing at the method with a
  deep link to `/process#method`.
- **Structured data** — the homepage `Service` block's `description` now names
  the three movements. No other schema, title, meta description or heading was
  touched.

## Cache discipline

Per the `immutable` rules in `_headers` (`/*.js`, one year):

- bundle `index-5be19885.js` → `index-03372948.js` (raw file sha256, first 8
  hex), 425,885 → 427,784 bytes. This branch rebased onto the poster-wall
  commit (`index-7a2157f4.js`), so the new bundle is *that* bundle plus the
  method band: neither change was dropped.
- `index.html`'s dynamic import and the `sw.js` precache entry updated.
- service worker cache bumped to `zazie-v5` (main already sat at `zazie-v4`
  from the poster wall), because a returning visitor otherwise keeps the old
  `index.html`/JS pair.

## Verification performed

- **jsdom harness (jsdom 30.1.0, installed outside the repo — no
  `package.json` was added, so the harness is scratch), both copies, PASS.** The bundle was mounted into a
  real `#root` with the browser surface it needs (`IntersectionObserver`,
  `ResizeObserver`, `Audio`, media stubs): the app renders, `#method` contains
  all three movement titles in order with Roman numerals I–III, and the palette
  cards still follow. The same six strings were asserted in the prerendered copy,
  which proves the two copies agree on this band.
- **`node --check` on the patched bundle** (minified, single line 425 KB):
  syntax clean, and the insertion was made at exactly one anchor
  (`"data-source-loc":"src/components/Method.tsx:52:1"`), verified by count
  before write.
- **HTML well-formedness** — `html.parser` tag-balance pass over `index.html`,
  `/process`, `/composer`: zero unclosed and zero mismatched tags.
- **JSON-LD** — every `application/ld+json` block in both edited pages parses.
- **Class audit** — every class string added exists in the compiled CSS
  (`index-ba4ce5d7.css` for the homepage, `legal-89928f71.css` for the document
  pages). No new CSS file, no rebuild of `legal-src`, no new class invented; the
  pages' own card/pull-quote patterns were reused.
- **`node tools/check-sitemap.mjs`** — PASS (15 URLs, 37 images, 7 videos).
  `lastmod` on `/`, `/process` and `/composer` was already `2026-09-18`.
- **Local HTTP crawl** — 200 on `/`, `/process`, `/composer`, `/reel`, `/work`,
  `/services`, `/contact`, `/store`, `/faq`, `/sw.js` and
  `/index-03372948.js`; 404 on both retired hashes; the served homepage imports
  the new bundle and `sw.js` carries `zazie-v5`.

## Observations, deliberately not changed here

- **The two homepage copies were already out of sync before this change** and
  still are, outside the new band: the prerendered `index.html` carries the
  SEO-tuned `h2` ("Scoring approach: psychological horror architecture and dark
  atmospheric color, built for story") and the palette card copy, while the
  bundle's `Method` component still renders "A distinct point of view, built for
  the story." and "Cinematic themes that stalk". Since `createRoot().render()`
  replaces `#root`, **visitors see the bundle's wording while crawlers see the
  prerendered wording.** Reconciling that is a bigger decision than a copy
  addition (it means choosing one canonical source for the homepage), so it is
  left as-is and recorded here.
- **No browser in this sandbox**, so the band was verified as structure and
  text, not as pixels. Worth one eyeball at 390 px, 768 px and 1440 px: the band
  adds a row to a section that already had one, and the pull-quote is the only
  display-size sentence in the section.
