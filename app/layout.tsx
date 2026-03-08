import type { Metadata } from 'next';
import { Inter, Unbounded } from 'next/font/google';
import Navbar from '@/components/navbar';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import './navbar.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const unbounded = Unbounded({ subsets: ['latin'], variable: '--font-unbounded', weight: ['400', '600', '700', '800', '900'] });

export const metadata: Metadata = {
  title: { default: 'CAU Villa Lugano - Universidad Siglo 21', template: '%s | CAU Villa Lugano' },
  description: 'Centro de Aprendizaje Universitario Villa Lugano. Carreras universitarias a distancia de Universidad Siglo 21.',
  verification: {
    google: 'google2ba266d8a709b848',
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${unbounded.variable}`}>
      <body className={inter.className}>
        <Navbar />
        {children}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        <Analytics />
        <SpeedInsights />
      </body>



    </html>
  );
}
