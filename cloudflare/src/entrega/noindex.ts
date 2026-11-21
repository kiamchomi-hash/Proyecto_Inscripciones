export const CARRERAS_NO_INDEXADAS = new Set([
  '/carreras/tecnicatura-en-marketing-y-publicidad-digital',
  '/carreras/tecnicatura-en-relaciones-laborales',
  '/carreras/tecnicatura-en-gestion-contable-e-impositiva',
  '/carreras/tecnicatura-en-redes-informaticas-y-telecomunicaciones',
]);

export function robotsCarrera(ruta: string): string | undefined {
  return CARRERAS_NO_INDEXADAS.has(ruta) ? 'noindex, follow' : undefined;
}
