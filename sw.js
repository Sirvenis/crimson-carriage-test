
const CACHE_NAME = 'crimson-carriage-v2';
const APP_SHELL = ['./','./index.html?v=2','./styles.css?v=2','./app.js?v=2','./data/case-crimson-carriage.json?v=2','./manifest.webmanifest?v=2','./icon.svg'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));
