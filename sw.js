// Service Worker — cache offline robusto
const CACHE = 'caminho-casa-v2';

// Recursos locais essenciais — cache um por um, falha silenciosa
const LOCAL_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/input.js',
  '/js/tutorial.js',
  '/js/audio.js',
  '/js/network.js',
  '/js/cutscene.js',
  '/js/world.js',
  '/js/player.js',
  '/js/entities.js',
  '/js/game.js',
  '/js/ui.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      // Adicionar cada recurso individualmente — um erro não bloqueia os outros
      Promise.allSettled(
        LOCAL_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('Cache miss:', url, err))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // WebSocket — não interceptar
  if (url.startsWith('ws://') || url.startsWith('wss://')) return;

  // Fontes externas (Google Fonts) — network first, cache fallback
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Recursos locais — cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request)
        .then(response => {
          // Guardar em cache recursos locais válidos
          if (
            response.ok &&
            url.startsWith(self.location.origin) &&
            e.request.method === 'GET'
          ) {
            const clone = response.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline e não está em cache — para navegação, devolver index.html
          if (e.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
    })
  );
});
