/**
 * AniGuard Service Worker - Offline Mode & Farm Data Sync
 * Caches core app shell, static assets, and livestock health data
 * to ensure farmers can access and manage their herd without internet access.
 */

const CACHE_NAME = 'aniguard-offline-v3';
const DATA_CACHE_NAME = 'aniguard-data-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/placeholder.svg'
];

// Install event - precache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline app shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== DATA_CACHE_NAME)
          .map((name) => {
            console.log('[Service Worker] Deleting obsolete cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event with offline-first / stale-while-revalidate strategy
self.addEventListener('fetch', (event) => {
  // Only handle GET requests from our origin or trusted CDNs (Google Fonts, Unsplash)
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);

  // 1. Navigation requests (HTML documents) - Network first, fall back to cached shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(async () => {
          console.log('[Service Worker] Serving cached shell for offline navigation:', url.pathname);
          const cached = await caches.match('/index.html') || await caches.match('/');
          if (cached) return cached;
          return new Response(
            `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AniGuard - Offline Mode</title><style>body{font-family:sans-serif;padding:24px;text-align:center;background:#f3f2ed;color:#1a3c2b}</style></head><body><h1>⚡ AniGuard Offline Mode Active</h1><p>Your livestock data and medication schedules are saved on device.</p><button onclick="window.location.reload()">Retry Connection</button></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 2. Static Vite JS/CSS chunks, fonts, and assets - Cache-First with background revalidation
  const isStaticAsset = url.pathname.startsWith('/assets/') ||
                        url.pathname.endsWith('.js') ||
                        url.pathname.endsWith('.css') ||
                        url.pathname.endsWith('.svg') ||
                        url.pathname.endsWith('.png') ||
                        url.hostname.includes('fonts.googleapis.com') ||
                        url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. All other requests - Network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(DATA_CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response(JSON.stringify({ offline: true, message: 'Serving from local offline cache' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      })
  );
});

// Handle Background Sync (when connection is re-established)
self.addEventListener('sync', (event) => {
  if (event.tag === 'aniguard-sync-farm-data') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_OFFLINE_SYNC' });
        });
      })
    );
  }
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'CHECK_CACHE_STATUS') {
    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((keys) => {
        event.source?.postMessage({
          type: 'CACHE_STATUS_RESULT',
          cachedAssetsCount: keys.length,
          cacheName: CACHE_NAME
        });
      });
    });
  }
});

// Push notification event for veterinary vaccination & medication alerts
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Upcoming vaccination reminder for your herd.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    tag: data.tag || 'aniguard-alert',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'AniGuard Veterinary Reminder', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
