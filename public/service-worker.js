// Minimal service worker for PWA - caches static assets and app shell
// Version number - increment to force update
const CACHE_VERSION = 'v1';
const CACHE_NAME = `wannagonna-cache-${CACHE_VERSION}`;

// Assets to cache on install (critical static assets only)
const STATIC_ASSETS = [
  '/favicon/favicon.ico',
  '/favicon/apple-touch-icon.png',
  '/favicon/web-app-manifest-192x192.png',
  '/favicon/web-app-manifest-512x512.png',
  '/manifest.webmanifest',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // If some assets fail to cache, continue anyway
        console.warn('Service worker: Some assets failed to cache', err);
      });
    })
  );
  // Activate new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version
        return cachedResponse;
      }

      // Fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response for caching
          const responseToCache = response.clone();

          // Cache successful responses (static assets only)
          if (
            event.request.url.includes('/favicon/') ||
            event.request.url.includes('/manifest.webmanifest') ||
            event.request.url.includes('/_next/static/')
          ) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }

          return response;
        })
        .catch(() => {
          // Network failed - return a basic offline response for navigation requests
          if (event.request.mode === 'navigate') {
            // For navigation requests, you could return a cached offline page here
            // For now, let the browser handle it
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
            });
          }
        });
    })
  );
});
