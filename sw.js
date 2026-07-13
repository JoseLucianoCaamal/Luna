const CACHE_NAME = 'luna-core-v3.3';
const urlsToCache = [
    './index.html',
    './style.css',
    './script.js',
    './manifest.json'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', event => {
    if (event.request.url.includes('trycloudflare.com')) { return; }
    event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => Promise.all(
            cacheNames.map(cache => { if (cache !== CACHE_NAME) return caches.delete(cache); })
        ))
    );
    event.waitUntil(clients.claim());
});