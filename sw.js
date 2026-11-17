/* Hub de Fe — service worker. Versión: 2026.11.17-6c59d9 */
const VERSION = "2026.11.17-6c59d9";
const CORE = "hubdefe-core-" + VERSION;
const MEDIA = "hubdefe-audio-v1"; // los audios llevan un nombre por contenido y no cambian
const CORE_FILES = ["./", "index.html", "manifest.webmanifest", "catalog.json", "devociones/aguinaldos/data.json", "devociones/coronilla/data.json", "devociones/diarias/data.json", "devociones/divino-nino/data.json", "devociones/nudos/data.json", "devociones/sangre/data.json", "img/aguinaldos.jpg", "img/coronilla.jpg", "img/d1.jpg", "img/d2.jpg", "img/d3.jpg", "img/d4.jpg", "img/d5.jpg", "img/d6.jpg", "img/d7.jpg", "img/d8.jpg", "img/d9.jpg", "img/diaria-1.jpg", "img/diaria-2.jpg", "img/diaria-3.jpg", "img/diarias.jpg", "img/nudos.jpg", "img/portada.jpg", "img/sangre.jpg", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-32.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(CORE_FILES)));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("hubdefe-core-") && k !== CORE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("message", e => { if (e.data === "skipWaiting") self.skipWaiting(); });
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.includes("/audio/")) { // primero la caché: el audio se guarda al escucharlo
    e.respondWith(caches.open(MEDIA).then(async c => {
      const hit = await c.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      const r = await fetch(e.request);
      if (r.ok && r.status === 200) c.put(e.request, r.clone());
      return r;
    }));
    return;
  }
  // Todo lo demás: la versión instalada (caché de esta versión), con la red de respaldo
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).catch(() => caches.match("index.html"))));
});
