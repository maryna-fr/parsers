const CACHE = 'dm-parsers-v1';
const FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logic/index.html',
  '/logic/css/style.css',
  '/logic/js/shunting-yard.js',
  '/logic/js/evaluator.js',
  '/logic/js/main.js',
  '/sets/index.html',
  '/sets/css/style.css',
  '/sets/js/shunting-yard.js',
  '/sets/js/evaluator.js',
  '/sets/js/main.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
});
