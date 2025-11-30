// sw.js
const CACHE_NAME = 'barberia-la-nueva-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/cliente.html',
  '/barberia.html',
  '/style.css',
  '/cliente.js',
  '/barberia.js',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});