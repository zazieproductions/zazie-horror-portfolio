// Service Worker: instant cache & zero-lag offline/repeat visit delivery
const CACHE_NAME = 'zazie-v1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/store',
  '/store.html',
  '/store/index.html',
  '/favicon.svg',
  '/fonts/cormorant-garamond-latin-400-normal.woff2',
  '/fonts/cormorant-garamond-latin-400-italic.woff2',
  '/fonts/inter-latin-wght-normal.woff2',
  '/index-ba4ce5d7.css',
  '/index-b9d7912d.js',
  '/store-8af6034d.css',
  '/store-2b4680d0.js',
  // Hero & Atmosphere
  '/images/atmosphere-bg.jpg',
  '/images/hero-portrait.avif',
  '/images/hero-portrait.jpg',
  // Poster Wall (640w grid & 1200w lightbox)
  '/images/posters/expire-red-check-640.avif',
  '/images/posters/expire-red-check-640.jpg',
  '/images/posters/expire-red-check-1200.jpg',
  '/images/posters/unseen-640.avif',
  '/images/posters/unseen-640.jpg',
  '/images/posters/unseen-1200.jpg',
  '/images/posters/peregrinus-640.avif',
  '/images/posters/peregrinus-640.jpg',
  '/images/posters/peregrinus-1200.jpg',
  '/images/posters/phantom-requiem-640.avif',
  '/images/posters/phantom-requiem-640.jpg',
  '/images/posters/phantom-requiem-1200.jpg',
  '/images/posters/eclipsed-640.avif',
  '/images/posters/eclipsed-640.jpg',
  '/images/posters/eclipsed-1200.jpg',
  '/images/posters/the-haunted-640.avif',
  '/images/posters/the-haunted-640.jpg',
  '/images/posters/the-haunted-1200.jpg',
  '/images/posters/choleric-640.avif',
  '/images/posters/choleric-640.jpg',
  '/images/posters/choleric-1200.jpg',
  '/images/posters/mike-has-a-visitor-640.avif',
  '/images/posters/mike-has-a-visitor-640.jpg',
  '/images/posters/mike-has-a-visitor-1200.jpg',
  // Film Sample Video Thumbnails
  '/images/project-HaVJP08j77U.jpg',
  '/images/project-eclipsed-drive.jpg',
  '/images/project-ItrrcilS0ro.jpg',
  '/images/project-riCvy2abhlc.jpg',
  '/images/project-Ty8tPp59mDc.jpg',
  '/images/project-rvCGO0BJ_2E.jpg',
  '/images/project-6qa3Uwj47fc.jpg',
  '/images/project-UX2kv3G89Jw.jpg',
  // Bio & Press
  '/images/headshot.avif',
  '/images/headshot.jpg',
  '/images/press-photo.jpg'
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

  // Legal and operating documents: network first, cache only as a fallback.
  // A terms or privacy page must never be served stale while a network is
  // reachable, even though the rest of the site is stale-while-revalidate.
  const LEGAL_PATHS = ['/legal', '/faq', '/terms', '/privacy', '/licensing', '/purchases', '/accessibility'];
  if (url.origin === self.location.origin && req.mode === 'navigate' && LEGAL_PATHS.includes(url.pathname.replace(/\/$/, ''))) {
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
