// Service Worker: instant cache & zero-lag offline/repeat visit delivery - v3 includes IA silos /work /reel /composer /process /services /contact and weaponized schema
// v3: cache name bumped with the cinema-player bundle so a returning visitor is not served the
// previous index.html/JS pair from the old cache (they are immutable for a year).
// v5: bumped again after removing trailing markup appended past </html>.
// v6: scope builder starts with project type, intensity, and add-ons unselected.
// v7: technical SEO signal architecture overhaul, new CSS asset hashes, visible breadcrumbs & schema matrix.
// v8: clean header and hero prerender text on load/refresh.
// v9: prerendered #root now matches the React render exactly, so no
// internal/SEO-only copy flashes into view on load or refresh.
// v10: /store joined the network-first set (the catalogue's prices and primary
// nav must never come from cache), and the bump itself drops the cached /store
// document from the previous build - its header nav was missing the Process tab.
// v12: the catalogue adds CRYPTOTYPE-9 as a free tool and refreshes item totals.
// v13: catalogue adds TEA5767 DIY radio kit and HD X60 sound mixer to eBay gear.
// v15: do not download the poster wall, film stills, or lightbox originals during
// service-worker install. They are cached on demand after native lazy loading
// or an explicit poster/video interaction.
// v16: /sitemap (HTML site map) joins the precache and the network-first set; the
// portfolio footer links every archive page (new bundle hash) and the documents
// stylesheet moved hash for the site map layout.
// v17: the homepage (/ and /index.html) joins the network-first set. The page that
// changes most often must never be handed to a returning visitor from the precache
// while the network is reachable - that is what made the boot sequence look like it
// had stopped working for anyone testing against a previously cached build.
// v18: Eclipsed Drive player fix - rm=minimal to hide top bar, bottom controls, custom fullscreen button, data-video-card attributes restored for instant inline player
// v19: showreel grows to 30 cues - Fractured Requiem joins as /audio/track-29.mp3 under the
// Psychological mood. Bundle re-hashed with the new track entry, so the cache name moves with it:
// without the bump a returning visitor would keep the previous index.html/JS pair from the old cache.
// v20: showreel moods consolidated - 28 one-off tags collapse into 6 shared moods (Psychological,
// Stinger, Thriller, Dark Ambient, Body Horror, Cosmic Horror) so every filter chip is a full shelf.
// Bundle re-hashed with the new taxonomy; cache name moves with it.
// v21: Eclipsed uses the standard Drive preview. Fullscreen actions move below
// the picture, phone frames have room for native controls, and the duplicate
// Drive loader is removed. Fresh bundle/CSS hashes prevent stale mobile layouts.
// v23: three commission pages join the site - /hire-a-composer (the commercial
// pillar), /sound-design and /game-scoring - with a new bundle hash, a Hire tab
// in the primary nav, the three pages in every footer, and the home page H1 and
// metadata rewritten around the horror composer phrase.
// v22: the small hint line under the poster wall (and its IMDb profile link) is gone from
// both the prerendered index.html and the bundle. Bundle re-hashed, so the cache name
// moves with it: without the bump a returning visitor would keep the previous index.html/JS
// pair from the old cache (they are immutable for a year).
// v25: the Eclipsed cover frame is now the self hosted /images/eclipsed-cover-1280.jpg
// (from the new root upload Eclipsed.png) instead of the Drive thumbnail, so the
// card no longer contacts drive.google.com on page load. The merge with main also
// removes the hero's pricing link from the bundle, not only the
// prerendered DOM (main's edit landed in one copy; React rebuilt the link on mount).
// Bundle re-hashed twice, so the cache name moves with it.
// v26: remove the Cosmic Horror showreel filter and add Ambient Horror; R'lyeh's
// Xenolith is reclassified into that mood. The homepage bundle is re-hashed.
// v27: showreel grows to 32 cues - The Beautiful Wrongness (Psychological Orchestral) and
// Earthpulse Protocol (Thriller) join. The showreel's first shelf becomes Psychological
// Orchestral, which also absorbs Variations on a Vanishing Body, and #70's Ambient Horror
// filter is preserved. Bundle re-hashed, so the cache name moves with it: without the bump a
// returning visitor would keep the previous index.html/JS pair from the old cache.
// v28: the sub-$250 entry tier is retired across the archive - the rate card, the
// FAQ question, the collaborator review, the inquiry form options and every
// meta/schema/footer mention. The scope builder's lowest tier is now the short
// film score and the floor moves to $250. The bundle re-hashes and the cache
// name moves with it, so a returning visitor never gets the old pair.
// v29: per-item archive pages. Every production, cue and store item now has its
// own route (/work/<slug>, /reel/<slug>, /store/<slug>) served from a flat
// <route>.html file generated by scripts/prerender.mjs, with its own <head> in
// the first byte. The item bundles (item-<hash>.css / item-<hash>.js) are new
// immutable assets, so the cache name moves with them and the hub pages are
// refetched once. Item routes are deliberately NOT in PRECACHE_ASSETS: 65 extra
// documents at install time would cost a visitor far more than they gain, and
// the static-asset path already caches the item bundle on first use.
// v33: editorial pass on the nine hub pages — services layout shell restored,
// licence/factor/step/note blocks styled, long-form detail moved into read-more
// disclosures; legal + estimator stylesheets rebuilt with the editorial layer.
// Pricing unchanged: scene 1–2 min / $250 from; focused 3–5 min / $650 from;
// extended 6–12 min / $1,500 from; substantial feature/experimental scores
// custom quoted with an indicative $2,500 minimum.
// v34: GEO overhaul — rebuilt /hire-a-composer pillar + interactive estimator,
// added /how-to-hire-a-horror-composer hub, /llms.txt + /llms-full.txt,
// <main>-wrapped document headers and spaced numeral headings across all 85 routes,
// clean JSON-LD schema graphs, and re-hashed home bundle index-4d715571.js.
// v36: 2026-10-22 mobile-audit pass — 12px type floor and 44px targets in the
// home/estimator CSS, WCAG AA label colours, styled skip link, poster AVIF
// 400/480/640 ladder, and re-hashed home bundle index-9e03d452.js.
// v37: the archive-boot intro is back in index.html (the gate script that had
// been dropped in the prerender pass is restored, so the overlay actually
// plays again). The document is precached as '/', so the cache name moves with
// it: without the bump a returning visitor could keep the boot-less document.
// v38: adds a prominent high-contrast "Skip intro" button (#zp-boot-skip) in
// the archive-boot deck above the CRT vignette layer, with 160ms fast teardown,
// accessible keyboard Tab/Enter/Space/Escape support, and mobile safe-area sizing.
// v39: native film-play buttons, accessible close control, and focus restoration.
// v40: hero artwork plate — the poster is no longer centre-cropped by a
// 46%-wide panel and no longer stops on a hard vertical edge; it keeps its own
// 896x1152 ratio, is feathered into the UI, and fades into the fold under one
// bottom scrim. The document (precached as '/') and the home bundle
// index-b29b75e2.js both change, so the cache name moves with them.
// v41: seamless hero artwork blend — screen-blended dark-point-aligned <img>,
// wide cosine-eased intersected top/left/bottom masks, and radial void scrim.
// v42: merge the 30-cue showreel with the latest homepage updates. The Beautiful
// Wrongness is the default, The Fatal Overdose follows, and two cues are retired.
// v43: homepage rendering/SEO pass — (1) precache install uses
// cache:'force-cache' instead of the old cache:'reload', which forced a second
// network download of every precached asset (hero image, CSS, JS, fonts) even
// though the page had just fetched them; hashed assets are immutable so the
// HTTP cache is authoritative, and '/' is network-first at fetch time anyway.
// (2) The React bundle no longer mounts for crawlers, and the homepage
// stylesheet carries the AA link-contrast and prose-underline rules under a
// fresh content hash below. The 2026-10-25 blanket type floors were reverted
// on 2026-10-26, so the design's original 8-12px label scale is back and the
// hash plus this cache version (v43 -> v44) move together.
// v45: add a reel-download entry point to the homepage and on-demand ZIP
// preparation on /reel. The homepage bundle and cached document change too;
// the rebuilt legal script also restores Expand all for individual cue links.
// v46: combine the download action with main's simplified navigation in a new
// homepage bundle, clearing the older cached bundle and document.
// v47: the published rate card and cost estimator are removed (2026-10-27).
// Commissions are quoted per project against the budget range and references
// shared in the inquiry; estimator-<hash> assets are succeeded by
// inquiry-<hash> ones, so the cache name moves with them.
// v48: the hero gains its lineage footnote - one desaturated line of marks
// (Black Mountain College, Ars Electronica, Dolby Atmos) directly under the
// call to action, added to both the prerendered document and the home bundle.
// The document is precached as '/', so the cache name moves with it.
// v49: /composer is retired (2026-10-29) and redirects to the homepage
// biography section (/#about); the precached '/' document and bundle change
// with the footer link, so the cache name moves again. This merge also folds
// in main's post-v48 homepage copy passes (simplified contact copy, FAQ
// section removal), which changed the same precached document and bundle.
// v50: move Variations on a Vanishing Body directly after Dissociative Amnesia
// in the showreel queue; the precached '/' document and home bundle move with it.
// v51: overhaul #press into the luxury Press Kit with festival laurels, Lake
// Ivan Film Journal critical spotlight, monograph press cards, and verified
// profile directory across both the prerendered document and home bundle.
// v52: simplify the homepage compilation cards; refresh the cached document and bundle.
// v53: refresh the Press Kit quotes in the cached homepage and bundle.
// v54: the homepage mobile pass moves touch targets and small-screen type in the
// precached document, so the cached bundle and document change with it.
// v55: merge main's mobile pass into the inquiry stylesheet - 16px controls at
// tablet widths and a 44px disclosure row - which re-hashes inquiry-<hash>.css.
// v56: the hero's two CTAs now share one label typeface, so the precached
// document and home bundle change with it.
const CACHE_NAME = 'zazie-v56';

const PRECACHE_ASSETS = [
  '/',
  '/favicon.svg',
  '/fonts/cormorant-garamond-latin-400-normal.woff2',
  '/fonts/cormorant-garamond-latin-400-italic.woff2',
  '/fonts/inter-latin-wght-normal.woff2',
  '/index-3465aa44.css',
  '/index-8093c395.js',
  '/store-1e13177a.css',
  '/store-3fc01be0.js',
  '/legal-f4e3a5fb.css',
  '/legal-c623083a.js',
  '/inquiry-d8cba1f7.css',
  '/inquiry-f408888b.js',
  // Hero & Atmosphere
  '/images/atmosphere-bg.jpg',
  '/images/hero-portrait.avif'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Use allSettled to ensure installation succeeds even if an asset is temporarily delayed.
      // force-cache on purpose: the old cache:'reload' bypassed the browser HTTP cache and
      // re-downloaded every precached asset on every install/SW update, duplicating the page's
      // own requests for the hero image, stylesheet, bundle and fonts. Content-hashed assets
      // are served immutable (see _headers), so an HTTP-cache hit is byte-identical; the '/'
      // document revalidates per its own Cache-Control and stays network-first at fetch time.
      const fetchPromises = PRECACHE_ASSETS.map(async (url) => {
        try {
          const res = await fetch(url, { cache: 'force-cache' });
          if (res.ok) {
            await cache.put(url, res);
          }
        } catch (_) {}
      });
      await Promise.allSettled(fetchPromises);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Same-origin handling
  if (url.origin === self.location.origin) {
    // Navigation requests (HTML): always network-first, falling back only to
    // the exact cached request URL (never fall back a subpage to /index.html,
    // which would serve the homepage HTML and canonical tag on a subpage URL).
    if (req.mode === 'navigate') {
      event.respondWith(
        fetch(req).then((res) => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return res;
        }).catch(() => caches.match(req))
      );
      return;
    }

    // Static assets (images, fonts, scripts, styles): Cache-First
    const isStatic =
      url.pathname.startsWith('/images/') ||
      url.pathname.startsWith('/fonts/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname === '/favicon.svg';

    if (isStatic) {
      event.respondWith(
        caches.match(req).then((cached) => {
          if (cached) return cached;
          return fetch(req).then((res) => {
            if (res && res.status === 200) {
              const resClone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            }
            return res;
          });
        })
      );
    }
  }
});
