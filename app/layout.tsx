import type { Metadata } from 'next';
import { Inter, Unbounded } from 'next/font/google';
import Navbar from '@/components/navbar';
import ScrollToTop, { ScrollResetOnLoad } from '@/components/scroll-to-top';
import PublicGoogleAnalytics from '@/components/google-analytics';
import { GEO, POSTAL_ADDRESS } from '@/lib/sede';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import './navbar.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const unbounded = Unbounded({ subsets: ['latin'], variable: '--font-unbounded', weight: ['400', '600', '700', '800', '900'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.siglo21sur.com'),
  title: { default: 'Universidad Siglo 21 | CAU Villa Lugano', template: '%s | Siglo 21' },
  description: 'Centro de Aprendizaje Universitario Villa Lugano. Carreras universitarias a distancia de Universidad Siglo 21. Inscribite hoy en la red de educación más grande de Argentina.',
  keywords: ['universidad', 'siglo 21', 'villa lugano', 'carreras a distancia', 'educación superior', 'estudiar online', 'CAU', 'CABA', 'zona sur'],
  authors: [{ name: 'CAU Villa Lugano' }],
  creator: 'Universidad Siglo 21',
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://www.siglo21sur.com',
    siteName: 'Universidad Siglo 21 | CAU Villa Lugano',
    title: 'Universidad Siglo 21 | CAU Villa Lugano',
    description: 'Carreras universitarias a distancia en Villa Lugano. ¡Inscribite hoy!',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Universidad Siglo 21 | CAU Villa Lugano',
    description: 'Carreras universitarias a distancia en Villa Lugano. ¡Inscribite hoy!',
  },
  verification: {
    google: 'google2ba266d8a709b848',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon.png', sizes: '48x48', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/imagenes/imagenes_cau/logo_cau.png',
  },
};



// Datos fijos: se serializa una sola vez por proceso y no en cada render del
// layout, que es el componente por el que pasa todas las paginas del sitio.
const jsonLd = JSON.stringify([
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Universidad Siglo 21 | CAU Villa Lugano",
    "url": "https://www.siglo21sur.com/"
  },
  {
    "@context": "https://schema.org",
    "@type": ["EducationalOrganization", "LocalBusiness"],
    "name": "CAU Villa Lugano - Universidad Siglo 21",
    "url": "https://www.siglo21sur.com",
    "description": "Centro de Aprendizaje Universitario Villa Lugano. Carreras universitarias a distancia de Universidad Siglo 21.",
    "address": POSTAL_ADDRESS,
    "geo": { "@type": "GeoCoordinates", ...GEO },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "08:00",
      "closes": "20:00"
    },
    // Zonas que la sede atiende. Es la via legitima de declarar alcance
    // geografico: una pagina por barrio serian doorway pages.
    "areaServed": [
      "Villa Lugano", "Villa Soldati", "Mataderos", "Villa Riachuelo",
      "Villa Celina", "Ciudad Madero", "Tapiales", "Ingeniero Budge",
      "Comuna 8", "CABA"
    ].map(name => ({ "@type": "Place", name })),
    "telephone": "+5491166522722",
    "sameAs": [
      "https://www.facebook.com/ceducativovillalugano/",
      "https://www.instagram.com/centroeducativovillalugano/"
    ],
    "parentOrganization": {
      "@type": "CollegeOrUniversity",
      "name": "Universidad Siglo 21",
      "url": "https://21.edu.ar"
    }
  }
]);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${unbounded.variable}`} suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://wa.me" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      </head>
      <body className={inter.className}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#00c7b1] focus:text-black focus:rounded focus:font-bold">
          Saltar al contenido principal
        </a>
        <Navbar />
        <div id="main-content">
        {children}
        </div>
        <ScrollResetOnLoad />
        <ScrollToTop />

        <PublicGoogleAnalytics />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
