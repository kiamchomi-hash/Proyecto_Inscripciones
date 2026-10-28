import { DERIVADAS } from './derivadas';

// Carpeta de los derivados en `public/`. El nombre de cada archivo lleva el hash
// del original (`<hash>-<ancho>.webp`), así que puede servirse inmutable.
const CARPETA = '/derivados';

/**
 * `srcset` con los derivados webp de una imagen, o `undefined` si esa imagen no
 * tiene derivados (pesa poco o quedó fuera de la generación). Sin entrada no se
 * inventa nada: el componente sigue sirviendo el original como hasta ahora.
 */
export function srcSetDe(ruta: string): string | undefined {
  const entrada = DERIVADAS[ruta];
  if (!entrada || entrada.anchos.length === 0) return undefined;
  return entrada.anchos.map((ancho) => `${CARPETA}/${entrada.hash}-${ancho}.webp ${ancho}w`).join(', ');
}

/**
 * URL del derivado más cercano a `ancho`, o `undefined` si la imagen no tiene.
 * Lo usa el prefetch: antes bajaba la foto entera al pasar el mouse por una
 * tarjeta, que es justo lo que este trabajo vino a evitar.
 */
export function derivadaDe(ruta: string, ancho: number): string | undefined {
  const entrada = DERIVADAS[ruta];
  if (!entrada || entrada.anchos.length === 0) return undefined;
  const elegido = entrada.anchos.reduce((mejor, actual) =>
    Math.abs(actual - ancho) < Math.abs(mejor - ancho) ? actual : mejor,
  );
  return `${CARPETA}/${entrada.hash}-${elegido}.webp`;
}
