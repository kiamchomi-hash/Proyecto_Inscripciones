export const CARRERAS_NO_INDEXADAS = new Set([
  '/carreras/tecnicatura-en-marketing-y-publicidad-digital',
]);

export function robotsCarrera(ruta: string): string | undefined {
  return CARRERAS_NO_INDEXADAS.has(ruta) ? 'noindex, follow' : undefined;
}
