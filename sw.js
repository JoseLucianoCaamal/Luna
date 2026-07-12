self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('luna-cache-v2').then((cache) => {
      // Rutas relativas corregidas y nombre de imagen actualizado a akko.png
      return cache.addAll([
        './',
        './index.html', 
        './style.css', 
        './script.js', 
        './akko.png',
        './manifest.json'
      ]);
    }).catch(err => console.log('Error en caché:', err))
  );
  self.skipWaiting(); // Fuerza la actualización inmediata
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim()); // Toma el control de la página al instante
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});