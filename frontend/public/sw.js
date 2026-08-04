const CACHE_NAME = 'nova-homologacao-v4-stethoscope';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/stethoscope.svg?v=2.0.1',
  '/icons/icon-192x192.png?v=2.0.1',
  '/icons/icon-512x512.png?v=2.0.1',
  '/icons/maskable-icon-512x512.png?v=2.0.1',
  '/icons/apple-touch-icon.png?v=2.0.1',
  '/favicon.ico?v=2.0.1'
];

// Install event - Forçar ativação imediata sem esperar o usuário fechar abas
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PWA SW] Atualizando silenciosamente os ativos e o novo ícone do Estetoscópio');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event - Limpar caches antigos imediatamente e assumir controle dos clientes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[PWA SW] Limpando cache legado para atualizar ícone:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Network-First strategy para garantir que arquivos atualizados sejam servidos
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
