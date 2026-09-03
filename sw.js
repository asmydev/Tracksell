/* TrackSell — Service Worker
   Stratégie :
   - Navigation (HTML) : network-first. La page fraîche est toujours servie si
     le réseau répond ; le cache ne sert que de secours hors ligne.
   - Autres ressources (icônes, manifest) : stale-while-revalidate. Affichage
     immédiat depuis le cache, mise à jour silencieuse en arrière-plan.
*/
const CACHE_NAME = 'tracksell-v8-network-first';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const NET_TIMEOUT = 4000; // ms avant de basculer sur le cache

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Permet à la page de forcer l'activation immédiate d'une nouvelle version.
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isNavigation(request) {
  return request.mode === 'navigate' ||
         (request.headers.get('accept') || '').includes('text/html');
}

// Réseau d'abord, avec délai maximum, puis repli sur le cache.
function networkFirst(request) {
  return new Promise(resolve => {
    let settled = false;
    const fallback = () => {
      if (settled) return;
      settled = true;
      caches.match(request)
        .then(cached => cached || caches.match('./index.html'))
        .then(res => resolve(res || Response.error()));
    };
    const timer = setTimeout(fallback, NET_TIMEOUT);

    fetch(request).then(response => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
      }
      resolve(response);
    }).catch(() => {
      clearTimeout(timer);
      fallback();
    });
  });
}

// Cache immédiat + rafraîchissement en arrière-plan.
function staleWhileRevalidate(request) {
  return caches.match(request).then(cached => {
    const network = fetch(request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
      }
      return response;
    }).catch(() => cached);
    return cached || network;
  });
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;   // on ne gère que le même domaine
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(isNavigation(request) ? networkFirst(request) : staleWhileRevalidate(request));
});
