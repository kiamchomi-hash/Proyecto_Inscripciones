// Sólo la familia /carreras/[slug] de next.config.ts, antes de consultar D1.
// Los redirects globales y de novedades siguen fuera de este lote.
const BAJAS_301 = [
  'curso-de-actualizacion-profesional-en-inteligencia-artificial',
  'curso-en-actualizacion-profesional-en-inteligencia-artificial',
  'licenciatura-en-agroinformatica', 'licenciatura-en-nutricion', 'licenciatura-en-sociologia',
  'tecnicatura-superior-en-venta-directa',
  // Energías Renovables de Teclab se dio de baja de la oferta (27/10/2026). El
  // renombre a «Gestión de Energías Renovales» quedó apuntando a una ficha que
  // ya no existe: la URL vieja hacía 308 y el destino respondía 404. Ahora las
  // dos van a la home, como el resto de las bajas, en un solo salto.
  'tecnicatura-superior-en-energias-renovables',
  'tecnicatura-superior-en-gestion-de-energias-renovables',
];
// Fichas de Teclab fuera de la oferta que seguían recibiendo búsquedas y
// respondían 404 (Search Console, 22/11/2026: Gestión de Alimentos en posición
// 5,8 con 16 clics al mes). Van a la landing de Teclab y no a la home: quien
// buscaba una tecnicatura de Teclab encuentra ahí la oferta vigente.
// Ninguna figura en el sitemap oficial de carreras de Teclab
// (teclab.edu.ar/carrera-sitemap.xml, 19/11/2026) ni en la D1 de producción.
// Cinco son de las altas de los bloques 2 y 3 del 16/10/2026; Agile Coaching
// era además destino de un renombre, y el salto terminaba en 404.
const BAJAS_TECLAB = [
  'tecnicatura-superior-en-gestion-de-alimentos',
  'tecnicatura-superior-en-comercio-exterior',
  'tecnicatura-superior-en-recursos-humanos',
  'tecnicatura-superior-en-diseno-de-experiencia-de-usuario-user-experience',
  'tecnicatura-superior-en-administracion-de-riesgos-empresariales',
  'tecnicatura-superior-en-agile-coaching',
  'tecnicatura-superior-en-gestion-de-equipos-agiles-agile-coaching',
];
const BAJAS_308 = ['tecnicatura-superior-en-fintech', 'tecnicatura-superior-en-acompanamiento-terapeutico', 'tecnicatura-superior-en-producto-digital'];
const BAJAS_302 = ['diplomatura-en-bienestar-integral-herramientas-para-transformar-te',
  'diplomatura-en-inteligencia-artificial', 'diplomatura-en-marketing-para-emprendedores-y-duenos-de-negocios',
  'diplomatura-en-management-hotelero'];
const RENOMBRES: Record<string, [string, 301 | 308]> = {
  // La ficha de Videojuegos de Siglo 21 se publicó con URLs nuevas el 30/08 y el
  // 29/10/2026 sin redirección. La anterior `/inscripcion` sí quedó indexada
  // (rastreada el 15/10/2026) y desde el rename da 404: es la página en blanco
  // que aparecía en Google. Va a la ficha vigente, que es la que hay que
  // indexar; la de inscripción es noindex a propósito.
  'tecnicatura-en-videojuegos': ['siglo-21-video-juegos', 301],
  'diplomatura-en-fraude-financiero-y-digital': ['diplomatura-en-prevencion-de-fraude-financiero-y-digital', 301],
  'tecnicatura-superior-en-customer-experience': ['tecnicatura-superior-en-experiencia-del-cliente', 301],
  'curso-de-mindfulness-y-tecnicas-de-gestion-del-estres': ['diplomatura-en-mindfulness-liderazgo-personal-y-gestion-de-vinculos', 301],
};
export function redirectCarrera(slug: string): { destino: string; status: 301 | 302 | 308 } | null {
  slug = slug.toLowerCase();
  if (BAJAS_301.includes(slug)) return { destino: '/', status: 301 };
  if (BAJAS_TECLAB.includes(slug)) return { destino: '/teclab', status: 301 };
  if (BAJAS_302.includes(slug)) return { destino: '/', status: 302 };
  if (BAJAS_308.includes(slug)) return { destino: '/', status: 308 };
  const renombre = RENOMBRES[slug];
  return renombre ? { destino: `/carreras/${renombre[0]}`, status: renombre[1] } : null;
}
