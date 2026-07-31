'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Installation impossible (navigateur non supporté, contexte non
        // sécurisé) — l'appli reste pleinement utilisable en site web classique.
      })
    }
  }, [])

  return null
}
