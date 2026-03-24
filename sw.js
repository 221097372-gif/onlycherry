const CACHE_NAME = 'onlycherry-v2';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './config.js',
  './manifest.json',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
