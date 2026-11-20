/* SCIE/CALC — funcionamento offline.
 * Página (index.html): rede primeiro (há sempre a versão mais recente quando há ligação); sem rede, a cópia guardada.
 * Ficheiros com hash em /assets: guardados na instalação (lista em asset-manifest.json) e servidos da cache.
 * Pedidos a outros domínios (Firebase, Google) não passam por aqui: o Firestore tem a sua própria cache offline.
 */
const CACHE = 'scie-calc-app';
const BASE = new URL('./', self.location).href;

async function precache() {
  const cache = await caches.open(CACHE);
  const essenciais = ['./', './index.html', './manifest.webmanifest', './favicon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
  let ficheiros = [];
  try {
    const m = await (await fetch('./asset-manifest.json', { cache: 'no-cache' })).json();
    const set = new Set();
    for (const e of Object.values(m)) {
      if (e.file) set.add(e.file);
      (e.css || []).forEach((x) => set.add(x));
      (e.assets || []).forEach((x) => set.add(x));
    }
    // letras: só os subconjuntos latinos (os outros são pedidos apenas se usados)
    ficheiros = [...set].filter((f) => !/\.woff2?$/.test(f) || (f.endsWith('.woff2') && /-latin-\d/.test(f))).map((f) => './' + f);
  } catch { /* sem manifesto: fica o essencial; o resto entra na cache à medida que é usado */ }
  await Promise.allSettled([...essenciais, ...ficheiros].map((u) => cache.add(new Request(u, { cache: 'no-cache' }))));
  // remove ficheiros de versões anteriores
  const manter = new Set([...essenciais, ...ficheiros].map((u) => new URL(u, BASE).href));
  for (const req of await cache.keys()) {
    if (req.url.includes('/assets/') && !manter.has(req.url)) await cache.delete(req);
  }
}

self.addEventListener('install', (e) => { e.waitUntil(precache().then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // página: rede primeiro, cópia guardada sem rede
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const r = await fetch(req, { cache: 'no-cache' });
        if (r.ok) cache.put('./index.html', r.clone());
        return r;
      } catch {
        return (await cache.match('./index.html', { ignoreVary: true })) || (await cache.match('./', { ignoreVary: true })) || Response.error();
      }
    })());
    return;
  }

  // ficheiros com hash: cache primeiro (nunca mudam); restantes: cache e atualização em segundo plano
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreVary: true });
    const net = fetch(req).then((r) => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => undefined);
    if (hit) {
      if (!url.pathname.includes('/assets/')) e.waitUntil(net);
      return hit;
    }
    return (await net) || Response.error();
  })());
});
