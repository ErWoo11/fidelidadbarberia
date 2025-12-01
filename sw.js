const CACHE_NAME = 'barberia-la-nueva-v2';
const urlsToCache = [
  '/fidelidadbarberia/',
  '/fidelidadbarberia/index.html',
  '/fidelidadbarberia/style.css',
  '/fidelidadbarberia/logo.png'
  // ❌ No caches cliente.html ni barberia.html (son dinámicos)
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Estrategia: red primero, caché solo para recursos estáticos
self.addEventListener('fetch', (event) => {
  // Nunca caches peticiones a Firebase (APIs)
  if (event.request.url.includes('firestore')) {
    return;
  }

  // Para HTML, siempre intenta red primero
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Para CSS, imágenes, etc., usa caché con red fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});