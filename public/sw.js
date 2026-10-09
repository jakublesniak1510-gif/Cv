// Aplikacja na telefon (PWA): najpierw sieć, a bez internetu ostatnia zapisana wersja strony.
// Zamówień, płatności i plików (/api) nigdy nie zapisujemy w pamięci telefonu.
const CACHE = 'cvpo-v1';
const SHELL = ['/', '/style.css', '/app.js', '/i18n.js', '/i18n/en.json', '/i18n/uk.json', '/i18n/de.json', '/manifest.webmanifest', '/icons/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request, url = new URL(r.url);
  if (r.method !== 'GET' || url.origin !== location.origin || /^\/(api|admin|p24)/.test(url.pathname)) return;
  const nav = r.mode === 'navigate';
  e.respondWith(
    fetch(r).then((res) => {
      if (res.ok && (nav ? url.search === '' || url.search === '?app=1' : true)) {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(nav ? url.pathname : r, copy));
      }
      return res;
    }).catch(() => caches.match(nav ? url.pathname : r).then((hit) => hit || (nav ? caches.match('/') : Response.error())))
  );
});
