import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
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
