// Service Worker for PWA capabilities
const CACHE_NAME = 'backyard-adventures-v1';
const urlsToCache = [
  '/',
  '/dashboard.html',
  '/login.html',
  '/admin.html',
  '/css/styles.css',
  '/css/dashboard.css',
  '/css/mobile.css',
  '/js/api.js',
  '/js/auth.js',
  '/js/dashboard.js'
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
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});