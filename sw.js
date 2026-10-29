// Lake Effect Tennis Club: keeps a copy of the site for weak gym Wi-Fi and offline opens.
// Pages always try the network first (so updates show right away); league data never passes through here.
const C = 'lefx-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== C) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url), home = new URL('./', self.registration.scope).pathname;
  if (r.mode === 'navigate' && u.origin === location.origin) {
    e.respondWith((async () => {
      const c = await caches.open(C);
      try {
        const res = await Promise.race([fetch(r), new Promise((_, no) => setTimeout(() => no(new Error('slow')), 4000))]);
        if (res.ok && res.type === 'basic') c.put(u.pathname, res.clone());
        return res;
      } catch (_) {
        return (await c.match(u.pathname)) || (await c.match(home)) || fetch(r);
      }
    })());
    return;
  }
  const fixed = (u.origin === location.origin && /\.(png|webmanifest)$/.test(u.pathname)) || u.host === 'fonts.gstatic.com' || u.host === 'fonts.googleapis.com' || (u.host === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/'));
  if (!fixed) return;
  e.respondWith((async () => {
    const c = await caches.open(C), hit = await c.match(r); if (hit) return hit;
    const res = await fetch(r); if (res.ok || res.type === 'opaque') c.put(r, res.clone()); return res;
  })());
});
