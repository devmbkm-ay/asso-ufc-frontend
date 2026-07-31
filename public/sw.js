// Service worker minimal — sert uniquement à satisfaire les critères
// d'installabilité PWA (et de futur support des notifications push).
// Ne met rien en cache et n'intercepte aucune requête réseau pour l'instant :
// le mode hors-ligne est un chantier à part entière, pas encore construit.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
