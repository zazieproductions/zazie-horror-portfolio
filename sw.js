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
const CACHE_NAME = 'zazie-v18';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/work',
  '/work/index.html',
  '/reel',
  '/reel/index.html',
  '/composer',
  '/composer/index.html',
  '/process',
  '/process/index.html',
  '/services',
  '/services/index.html',
  '/contact',
  '/contact/index.html',
  '/store',
  '/store.html',
  '/store/index.html',
  '/legal',
  '/faq',
  '/terms',
  '/privacy',
  '/licensing',
  '/purchases',
  '/accessibility',
  '/sitemap',
  '/404.html',
  '/sitemap.xml',
  '/robots.txt',
  '/favicon.svg',
  '/fonts/cormorant-garamond-latin-400-normal.woff2',
  '/fonts/cormorant-garamond-latin-400-italic.woff2',
  '/fonts/inter-latin-wght-normal.woff2',
  '/index-2c12e5bc.css',
  '/index-4a247d5c.js',
  '/store-94c90049.css',
  '/store-3fc01be0.js',
  '/legal-24ac8394.css',
  '/legal-ea8a33ec.js',
  // Hero & Atmosphere
  '/images/atmosphere-bg.jpg',
  '/images/hero-portrait.avif',
  '/images/hero-portrait.jpg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Use allSettled to ensure installation succeeds even if an asset is temporarily delayed
      const fetchPromises = PRECACHE_ASSETS.map(async (url) => {
        try {
          const res = await fetch(url, { cache: 'reload' });
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

  // Legal and operating documents, the catalogue, the IA silos and the homepage:
  // network first, cache only as a fallback. A terms or privacy page must never be
  // served stale while a network is reachable, and the same goes for /store, where
  // the prices, the stock notes and the primary nav are the page - and for the
  // homepage itself, which carries the boot sequence, hero and schema and is the
  // page a returning visitor (or the studio checking a fresh deploy) hits first.
  // Everything else stays stale-while-revalidate for the 0ms repeat render.
  const NETWORK_FIRST = ['/', '/index.html', '/legal', '/faq', '/terms', '/privacy', '/licensing', '/purchases', '/accessibility', '/sitemap', '/store', '/work', '/reel', '/composer', '/process', '/services', '/contact'];
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (url.origin === self.location.origin && req.mode === 'navigate' && NETWORK_FIRST.includes(path)) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      }).catch(() => caches.match(req).then((c) => c || caches.match('/index.html')))
    );
    return;
  }

  // Same-origin handling
  if (url.origin === self.location.origin) {
    // Navigation requests (HTML): Stale-While-Revalidate for 0ms render
    if (req.mode === 'navigate') {
      event.respondWith(
        caches.match(req).then((cached) => {
          const networkFetch = fetch(req).then((res) => {
            if (res && res.status === 200) {
              const resClone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            }
            return res;
          }).catch(() => cached);
          return cached || networkFetch;
        })
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
