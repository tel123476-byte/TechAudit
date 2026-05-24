// TechAudit Service Worker — offline cache
const CACHE = 'techaudit-v3';
const URLS = [
  './',
  './index.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(URLS).catch(()=>{}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  
  // Cross-origin requesty NECHÁME projít — neměníme je. 
  // Týká se to Firestore, Firebase Storage, Google Fonts, atd.
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  
  // Pro same-origin: network-first s fallback na cache
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        // Cachuj jen úspěšné odpovědi pro index.html a kořen
        if (resp.ok && (e.request.url.endsWith('/') || e.request.url.endsWith('/index.html'))) {
          var copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
