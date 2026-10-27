const CACHE_NAME = 'koff-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/shop.html',
  '/css/styles.css',
  '/js/supabase-client.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request);
      })
  );
});