const CACHE = 'micole-v1'
const EXTERNAL = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
]

self.addEventListener('install', e => {
  // Solo cachea recursos externos (Leaflet CDN) al instalar
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(EXTERNAL).catch(() => {})))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // Llamadas a la API propia o a visionblo → red siempre
  if (url.pathname.startsWith('/api/') || url.hostname === 'owa.visionblo.com') return

  // Recursos externos (Leaflet CDN) → cache primero
  if (url.origin !== self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    )
    return
  }

  // Archivos propios (HTML/CSS/JS) → red primero, cache como fallback offline
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone()
        caches.open(CACHE).then(c => c.put(e.request, clone))
        return res
      })
      .catch(() => caches.match(e.request))
  )
})
