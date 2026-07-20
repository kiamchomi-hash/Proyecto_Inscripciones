import type { NextConfig } from 'next';

const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://localhost').host;

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['jspdf', 'jspdf-autotable', '@supabase/supabase-js'],
  },
  images: {
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
      // Redirect non-www to www
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'siglo21sur.com' }],
        destination: 'https://www.siglo21sur.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
