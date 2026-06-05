
const CACHE_NAME = 'crimson-carriage-v3';
const APP_SHELL = ['./','./index.html?v=3','./styles.css?v=3','./app.js?v=3','./data/case-crimson-carriage.json?v=3','./manifest.webmanifest?v=3','./icon.svg'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));
