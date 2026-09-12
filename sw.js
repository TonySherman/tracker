/* Ember service worker — cache-first shell so the app opens offline. */
const VERSION = 'ember-v2';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/store.js',
  './js/stats.js',
  './js/ui.js',
  './js/icons.js',
  './js/views/today.js',
  './js/views/habits.js',
  './js/views/statsview.js',
  './js/views/settings.js',
  './js/views/detail.js',
  './js/views/form.js',
  './js/views/charts.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req)
        .then(res => {
          if (res.ok) caches.open(VERSION).then(c => c.put(req, res.clone()));
          return res;
        })
        .catch(() => hit || caches.match('./index.html'));
      return hit || net;
    })
  );
});
