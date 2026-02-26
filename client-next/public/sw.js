// TinyNotie Service Worker
const CACHE_NAME = 'tinynotie-v1';
const OFFLINE_URL = '/';

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/maskable_icon_x48.png',
  '/icons/maskable_icon_x72.png',
  '/icons/maskable_icon_x96.png',
  '/icons/maskable_icon_x128.png',
  '/icons/maskable_icon_x192.png',
  '/icons/maskable_icon_x384.png',
  '/icons/maskable_icon_x512.png',
  '/icons/maskable_icon.png',
];

// ── Install: pre-cache key assets ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  // Take control immediately without waiting for old SW to die
  self.skipWaiting();
});

// ── Activate: clear old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for static ───────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and Chrome extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // Network-first for API calls
  if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for static assets (images, fonts, icons)
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) => cached || fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
      )
    );
    return;
  }

  // Network-first with offline fallback for navigation
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((cached) => cached || fetch(OFFLINE_URL))
      )
    );
    return;
  }
});

// ── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      const raw = event.data.json();
      data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      data = { title: 'Tiny Notie', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || 'You have a new notification!',
    icon: '/icons/maskable_icon_x192.png',
    badge: '/icons/maskable_icon_x72.png',
    data: data.url ? { url: data.url } : {},
    vibrate: [100, 50, 100],
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Tiny Notie', options)
  );
});

// ── Notification Click ─────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Otherwise open a new window
        return clients.openWindow(targetUrl);
      })
  );
});
