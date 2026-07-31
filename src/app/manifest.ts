import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fondation Météo Assistance',
    short_name: 'FMA',
    description: 'Plateforme de gestion pour associations de la diaspora africaine',
    start_url: '/',
    display: 'standalone',
    background_color: '#001a4d',
    theme_color: '#001a4d',
    lang: 'fr',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
