// Ultra-light service worker for Zazie horror portfolio
// - App shell cached on install
// - Navigation: stale-while-revalidate with network fallback, then offline shell
// - Images/audio: cache-first, long-lived
// - Strategy chosen to never break immersion on flaky mobile networks

const VERSION = 'v2026-09-16-perf1';
const STATIC_CACHE = `static-${VERSION}`;
const IMAGE_CACHE = `images-${VERSION}`;
const AUDIO_CACHE = `audio-${VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/index-BloO9D4b.css',
  '/index-daKuu3pI.js',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(SHELL_ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, IMAGE_CACHE, AUDIO_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

function cacheFirst(cacheName, request) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((resp) => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          cache.put(request, resp.clone()).catch(() => {});
        }
        return resp;
      }).catch(() => cached);
    })
  );
}

function staleWhileRevalidate(cacheName, request) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      const networkFetch = fetch(request).then((resp) => {
        if (resp && resp.status === 200) {
          cache.put(request, resp.clone()).catch(() => {});
        }
        return resp;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first with fallback to cached shell (for offline resilience)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return resp;
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  const path = url.pathname;
  if (path.startsWith('/images/')) {
    event.respondWith(cacheFirst(IMAGE_CACHE, request));
    return;
  }
  if (path.startsWith('/audio/')) {
    event.respondWith(cacheFirst(AUDIO_CACHE, request));
    return;
  }
  // Static assets: stale-while-revalidate for instant loads
  if (path.endsWith('.js') || path.endsWith('.css') || path === '/favicon.svg') {
    event.respondWith(staleWhileRevalidate(STATIC_CACHE, request));
    return;
  }
});
