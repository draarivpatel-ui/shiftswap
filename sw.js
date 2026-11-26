const CACHE = 'shiftswap-static-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './js/app.js',
  './js/core.js',
  './assets/icon.svg',
  './assets/fonts/ibm-plex-sans-400.woff2',
  './assets/fonts/ibm-plex-sans-600.woff2',
  './assets/fonts/ibm-plex-sans-700.woff2',
  './assets/fonts/ibm-plex-mono-500.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      return response;
    }))
  );
});
