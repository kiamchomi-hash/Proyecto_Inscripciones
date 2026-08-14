export const dynamic = 'force-static';

export function GET() {
  return Response.json({
    id: '/admin/buscador',
    name: 'Carreras y precios — CAU Villa Lugano',
    short_name: 'Carreras CAU',
    description: 'Buscador comercial privado de carreras, precios y respuestas.',
    lang: 'es-AR',
    start_url: '/admin/buscador',
    scope: '/admin/buscador',
    display: 'standalone',
    orientation: 'any',
    background_color: '#050f0d',
    theme_color: '#071c17',
    icons: [
      { src: '/buscador-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
      { src: '/icon.png', sizes: '48x48', type: 'image/png', purpose: 'any' },
    ],
  }, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
