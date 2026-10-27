// Sólo la familia /carreras/[slug] de next.config.ts, antes de consultar D1.
// Los redirects globales y de novedades siguen fuera de este lote.
const BAJAS_301 = [
  'curso-de-actualizacion-profesional-en-inteligencia-artificial',
  'curso-en-actualizacion-profesional-en-inteligencia-artificial',
  'licenciatura-en-agroinformatica', 'licenciatura-en-nutricion', 'licenciatura-en-sociologia',
  'tecnicatura-superior-en-venta-directa',
];
const BAJAS_308 = ['tecnicatura-superior-en-fintech', 'tecnicatura-superior-en-acompanamiento-terapeutico', 'tecnicatura-superior-en-producto-digital'];
const BAJAS_302 = ['diplomatura-en-bienestar-integral-herramientas-para-transformar-te',
  'diplomatura-en-inteligencia-artificial', 'diplomatura-en-marketing-para-emprendedores-y-duenos-de-negocios',
  'diplomatura-en-management-hotelero'];
const RENOMBRES: Record<string, [string, 301 | 308]> = {
  'tecnicatura-superior-en-energias-renovables': ['tecnicatura-superior-en-gestion-de-energias-renovables', 308],
  'tecnicatura-superior-en-gestion-de-equipos-agiles-agile-coaching': ['tecnicatura-superior-en-agile-coaching', 308],
  'diplomatura-en-fraude-financiero-y-digital': ['diplomatura-en-prevencion-de-fraude-financiero-y-digital', 301],
  'tecnicatura-en-diseno-y-desarrollo-de-videojuegos': ['tecnicatura-en-videojuegos', 301],
  'tecnicatura-superior-en-customer-experience': ['tecnicatura-superior-en-experiencia-del-cliente', 301],
  'curso-de-mindfulness-y-tecnicas-de-gestion-del-estres': ['diplomatura-en-mindfulness-liderazgo-personal-y-gestion-de-vinculos', 301],
};
export function redirectCarrera(slug: string): { destino: string; status: 301 | 302 | 308 } | null {
  slug = slug.toLowerCase();
  if (BAJAS_301.includes(slug)) return { destino: '/', status: 301 };
  if (BAJAS_302.includes(slug)) return { destino: '/', status: 302 };
  if (BAJAS_308.includes(slug)) return { destino: '/', status: 308 };
  const renombre = RENOMBRES[slug];
  return renombre ? { destino: `/carreras/${renombre[0]}`, status: renombre[1] } : null;
}
