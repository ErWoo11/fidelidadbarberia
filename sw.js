const CACHE_NAME = 'barberia-la-nueva-v1';
const urlsToCache = [
  '/fidelidadbarberia/',
  '/fidelidadbarberia/index.html',
  '/fidelidadbarberia/cliente.html',
  '/fidelidadbarberia/barberia.html',
  '/fidelidadbarberia/style.css',
  '/fidelidadbarberia/cliente.js',
  '/fidelidadbarberia/barberia.js',
  '/fidelidadbarberia/logo.png'
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