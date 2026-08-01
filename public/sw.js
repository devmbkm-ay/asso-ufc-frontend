// Service worker — installabilité PWA + notifications push.
// Ne met rien en cache et n'intercepte aucune requête réseau : le mode
// hors-ligne est un chantier à part entière, pas encore construit.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = { title: 'Fondation Météo Assistance', body: '', link: '/mon-espace/notifications' }
  try {
    payload = { ...payload, ...event.data.json() }
  } catch {
    // Payload absent/non-JSON — on garde les valeurs par défaut.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { link: payload.link },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = event.notification.data?.link || '/mon-espace/notifications'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if ('focus' in client) {
          client.navigate(link)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(link)
      }
    })
  )
})
