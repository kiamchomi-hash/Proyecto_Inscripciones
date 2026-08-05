import type { NextConfig } from 'next';

const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://localhost').host;

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['jspdf', 'jspdf-autotable', '@supabase/supabase-js'],
    // El CSS viajaba en dos <link> que bloqueaban el render (~450 ms segun PSI en
    // mobile). Inlineado en el HTML desaparece esa ida y vuelta de la ruta critica:
    // el navegador pinta con lo que ya recibio. Requiere style-src 'unsafe-inline',
    // que la CSP de abajo ya permite.
    inlineCss: true,
  },
  images: {
    // 90 para las fotos grandes (hero de carrera y modales de Teclab): con el
    // 75 por defecto las caras quedaban con artefactos visibles.
    qualities: [75, 90],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: supabaseHost },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' data: blob: https://${supabaseHost} https://images.unsplash.com`,
              "font-src 'self'",
              `connect-src 'self' https://${supabaseHost} https://*.google-analytics.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://challenges.cloudflare.com`,
              "frame-src https://challenges.cloudflare.com https://www.google.com",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              'upgrade-insecure-requests',
            ].join('; '),
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
      {
        // Biblioteca de imagenes: herramienta interna, sin enlaces desde el
        // sitio y fuera del sitemap. A proposito NO va al disallow de
        // robots.ts: si se bloquea el rastreo, Google no llega a leer el
        // noindex y la URL puede listarse igual, sin descripcion.
        source: '/imagenes',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
      {
        source: '/contactos',
        destination: '/contacto',
        permanent: true,
      },
      {
        source: '/novedades',
        destination: '/novedades/1',
        permanent: true,
      },
      // Ruta vieja en singular (marzo 2026), puede seguir indexada
      {
        source: '/carrera/:slug',
        destination: '/carreras/:slug',
        permanent: true,
      },
      // /carreras sin slug no existe como página; el catálogo está en la home
      {
        source: '/carreras',
        destination: '/',
        permanent: true,
      },
      // El curso de Teclab estuvo dos días con el slug que salía de "Curso en"
      // (30/07 al 01/08/2026). Se corrigió a "Curso de", que es como se dice y
      // como viene el prefijo en la base; el slug viejo pudo entrar al sitemap.
      {
        source: '/carreras/curso-en-actualizacion-profesional-en-inteligencia-artificial',
        destination: '/carreras/curso-de-actualizacion-profesional-en-inteligencia-artificial',
        permanent: true,
      },
      // Agroinformática se sacó de la oferta el 03/08/2026 (`activa = false` en
      // Supabase): el CAU no la dicta. La ficha estaba indexada y traía ~10
      // clics cada 90 días, todos de búsquedas navegacionales por el nombre de
      // la carrera, así que no se manda a otra ficha —sería otra cosa de la que
      // buscaron— sino al catálogo de la home.
      {
        source: '/carreras/licenciatura-en-agroinformatica',
        destination: '/',
        permanent: true,
      },
      // Mismo caso que Agroinformática: salieron del catálogo teniendo la ficha
      // indexada, y quedaron devolviendo 404 —que tira a la basura la autoridad
      // de una URL que Google ya tenía—. Administración Hotelera venía con
      // tráfico (32 impresiones, 2 clics, posición 14,2). Van a la home por lo
      // mismo: quien buscó la carrera por su nombre no quiere otra ficha.
      {
        source: '/carreras/licenciatura-en-administracion-hotelera',
        destination: '/',
        permanent: true,
      },
      {
        source: '/carreras/licenciatura-en-nutricion',
        destination: '/',
        permanent: true,
      },
      {
        source: '/carreras/licenciatura-en-sociologia',
        destination: '/',
        permanent: true,
      },
      {
        source: '/carreras/tecnicatura-en-responsabilidad-y-gestion-social',
        destination: '/',
        permanent: true,
      },
      // Redirect non-www to www
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'siglo21sur.com' }],
        destination: 'https://www.siglo21sur.com/:path*',
        permanent: true,
      },
      // El alias .vercel.app de produccion servia el sitio entero con 200 y sin
      // noindex: contenido duplicado compitiendo con el dominio propio. Los otros
      // aliases (los de deployment y el de rama) ya estan detras del SSO de Vercel
      // y con X-Robots-Tag: noindex, asi que este era el unico abierto. El canonical
      // apunta bien, pero es una sugerencia; el 308 no. Matchea ese host exacto:
      // ni localhost ni los previews entran.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'proyecto-inscripciones.vercel.app' }],
        destination: 'https://www.siglo21sur.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
