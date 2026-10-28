const CACHE_NAME = 'great-addesam-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/shop.html',
  '/product.html',
  '/cart.html',
  '/checkout.html',
  '/about.html',
  '/contact.html',
  '/track-order.html',
  '/css/styles.css',
  '/js/supabase-client.js',
  '/js/cart.js',
  '/js/whatsapp.js',
  '/js/header.js',
  '/js/footer.js',
  '/js/home.js'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch (Network first, fallback to cache)
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Do NOT cache Supabase API calls
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If successful, update the cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // If offline, try the cache
        return caches.match(event.request);
      })
  );
});

// Cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});