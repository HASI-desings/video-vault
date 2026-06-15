const CACHE_VERSION = 'v1';
const SHELL_CACHE = `vault-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `vault-runtime-${CACHE_VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache cross-origin media downloads — those go straight to IndexedDB.
  if (url.origin !== self.location.origin) return;

  // Network-first for API routes.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first for static assets (Next.js build output, icons, fonts).
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:js|css|woff2?|png|svg|ico)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // App shell / navigation requests: cache-first with network fallback,
  // refreshing the cache in the background.
  event.respondWith(cacheFirst(request, true));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request, revalidate = false) {
  const cached = await caches.match(request);
  if (cached) {
    if (revalidate) {
      fetch(request)
        .then((response) => {
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, response));
        })
        .catch(() => {});
    }
    return cached;
  }

  try {
    const response = await fetch(request);
    const cache = await caches.open(SHELL_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    const fallback = await caches.match('/');
    if (fallback) return fallback;
    throw err;
  }
}
