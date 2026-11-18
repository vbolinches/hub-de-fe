/* Hub de Fe — service worker. Versión: 2026.11.18-2322f2 */
const VERSION = "2026.11.18-2322f2";
const CORE = "hubdefe-core-" + VERSION;
const MEDIA = "hubdefe-audio-v2"; // v2: audios regenerados con tiempos por palabra
const CORE_FILES = ["./", "index.html", "manifest.webmanifest", "catalog.json", "devociones/aguinaldos/data.json", "devociones/coronilla/data.json", "devociones/diarias/data.json", "devociones/divino-nino/data.json", "devociones/nudos/data.json", "devociones/rosario/data.json", "devociones/sangre/data.json", "img/aguinaldos.jpg", "img/coronilla.jpg", "img/d1.jpg", "img/d2.jpg", "img/d3.jpg", "img/d4.jpg", "img/d5.jpg", "img/d6.jpg", "img/d7.jpg", "img/d8.jpg", "img/d9.jpg", "img/diaria-1.jpg", "img/diaria-2.jpg", "img/diaria-3.jpg", "img/diarias.jpg", "img/divino-nino-cuadro.jpg", "img/divino-nino.jpg", "img/nudos.jpg", "img/portada.jpg", "img/rosario.jpg", "img/sangre.jpg", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-32.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(CORE_FILES)));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => (k.startsWith("hubdefe-core-") && k !== CORE) || (k.startsWith("hubdefe-audio-") && k !== MEDIA)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("message", e => { if (e.data === "skipWaiting") self.skipWaiting(); });

// Respuesta parcial (206) para peticiones de rango: Safari la exige para reproducir y saltar dentro del audio.
async function conRango(req, resp) {
  const range = req.headers.get("range");
  if (!range) return resp;
  const buf = await resp.arrayBuffer(), size = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) return new Response(buf, { status: 200, headers: { "Content-Type": "audio/mpeg", "Accept-Ranges": "bytes", "Content-Length": String(size) } });
  let start = m[1] ? parseInt(m[1], 10) : NaN, end = m[2] ? parseInt(m[2], 10) : NaN;
  if (isNaN(start)) { start = Math.max(0, size - end); end = size - 1; }
  if (isNaN(end) || end >= size) end = size - 1;
  if (start >= size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  return new Response(buf.slice(start, end + 1), { status: 206, headers: {
    "Content-Type": "audio/mpeg", "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) } });
}

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.includes("/audio/")) { // primero la caché: el audio completo se guarda al escucharlo
    const key = url.origin + url.pathname;
    e.respondWith(caches.open(MEDIA).then(async c => {
      let hit = await c.match(key);
      if (!hit) {
        const r = await fetch(key); // siempre el archivo completo, sin rango, para poder guardarlo
        if (!r.ok) return r;
        await c.put(key, r.clone());
        hit = r;
      }
      return conRango(e.request, hit);
    }));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).catch(() => caches.match("index.html"))));
});
