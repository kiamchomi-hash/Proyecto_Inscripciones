import { Silkscreen } from 'next/font/google';

// Tipografía pixel del diseño de computación, la misma del folleto aprobado.
// Sólo la importa computacion-pixel.tsx, así que la fuente baja únicamente en
// esa página. Va en títulos y rótulos cortos: el texto de lectura sigue en Inter.
export const fuentePixel = Silkscreen({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--fuente-pixel',
  display: 'swap',
});
