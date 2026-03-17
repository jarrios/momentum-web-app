// Momentum Training — Service Worker v3
const CACHE = 'momentum-v3';

// config.js NUNCA se cachea — siempre se lee de la red
const ALWAYS_NETWORK = ['config.js'];

const ASSETS = [
  './', './index.html', './style.css',
  './storage.js', './sheets.js', './app.js',
  './manifest.json', './icon-192.png', './icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  const isExternal = url.includes('sheets.googleapis.com') ||
                     url.includes('script.google.com') ||
                     url.includes('youtube.com');
  const isNoCache = ALWAYS_NETWORK.some(f => url.includes(f));

  if (isExternal || isNoCache) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response('{}', { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
