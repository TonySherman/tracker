/* Ember service worker.

   Strategy is split by what the file IS, because the two kinds have opposite
   needs on a static host:

   - Code (html / css / js) is NETWORK-FIRST, with the cache as the offline
     fallback. A deploy is then live on the very next load. The older
     stale-while-revalidate approach served the cached copy and refreshed in the
     background, which meant every change took *two* reloads to appear — enough
     to make a shipped fix look like it never landed.
   - Everything else (icons, manifest) is CACHE-FIRST and refreshed in the
     background. These change about once a year; paying a round trip for them
     on every launch buys nothing.

   Network fetches use `cache: 'no-cache'`, which does not mean "don't cache" —
   it forces revalidation against the server (If-None-Match), so an unchanged
   file still costs only a 304. Without it, GitHub Pages' `max-age=600` lets the
   browser's own HTTP cache answer from up to ten minutes ago, and the service
   worker never sees the new bytes at all.
*/
const VERSION = 'ember-v3';
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

const fresh = url => fetch(url, { cache: 'no-cache', credentials: 'same-origin' });

const isCode = pathname =>
  pathname.endsWith('/') || /\.(html|css|js|webmanifest)$/.test(pathname);

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await Promise.allSettled(ASSETS.map(async a => {
      const res = await fresh(a);
      if (res.ok) await cache.put(a, res);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (isCode(url.pathname)){
    e.respondWith((async () => {
      try{
        const res = await fresh(req.url);
        if (res.ok) (await caches.open(VERSION)).put(req, res.clone());
        return res;
      }catch{
        return (await caches.match(req)) || (await caches.match('./index.html'));
      }
    })());
    return;
  }

  e.respondWith((async () => {
    const hit = await caches.match(req);
    const net = fetch(req).then(async res => {
      if (res.ok) (await caches.open(VERSION)).put(req, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  })());
});

/* Let the page force a full refresh (Settings -> Check for updates). */
self.addEventListener('message', e => {
  if (e.data === 'purge'){
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
  }
});
