const CACHE_NAME = 'luna-core-v1';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './akko.jpeg' // Si tu imagen es .jpeg, cámbialo a akko.jpeg
];

self.addEventListener('install', event => {
    // skipWaiting fuerza a que la nueva versión se instale de inmediato
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    // CORRECCIÓN CRÍTICA: Ignorar cualquier petición al cerebro de Luna (Cloudflare)
    // Esto asegura que la IA siempre responda en vivo y sin retrasos
    if (event.request.url.includes('trycloudflare.com')) {
        return; 
    }

    // Solo usar caché para archivos locales visuales (html, css, imágenes)
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('activate', event => {
    // Limpia versiones antiguas de la caché para no saturar el celular
    event.waitUntil(
        caches.keys().then(cacheNames => Promise.all(
            cacheNames.map(cache => { 
                if (cache !== CACHE_NAME) {
                    console.log('Borrando caché antigua:', cache);
                    return caches.delete(cache); 
                }
            })
        ))
    );
    // clients.claim hace que el Service Worker tome el control de la página de inmediato
    event.waitUntil(clients.claim());
});