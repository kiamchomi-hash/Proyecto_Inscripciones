import type { MetadataRoute } from 'next';

// Identidad para accesos directos. No incluye caché offline ni service worker.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Universidad Siglo 21 — CAU Villa Lugano',
    short_name: 'Siglo 21 CAU',
    description: 'Carreras universitarias a distancia con acompañamiento del CAU Villa Lugano.',
    lang: 'es-AR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: '#096757',
    background_color: '#041211',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
