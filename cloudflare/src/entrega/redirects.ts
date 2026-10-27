import { redirectCarrera } from './redirects-carreras.ts';

// Redirecciones de `next.config.ts`, con el código exacto: `permanent: true`
// (y el apex/alias de dominio) es 308; los `statusCode` explícitos conservan
// 301 o 302. Las fichas renombradas o dadas de baja siguen en
// `redirects-carreras.ts` y se aplican acá antes de resolver la página.
export type Redireccion = {
  readonly origen: string;
  readonly destino: string;
  readonly estado: 301 | 302 | 308;
};

/** El dominio propio canónico. El apex y el alias viejo se redirigen acá. */
export const SITIO_CANONICO = 'https://www.siglo21sur.com';

/**
 * Hosts que `next.config.ts` manda al dominio propio. En producción el apex
 * puede resolverse antes, en el borde (histórico: el borde respondía 307 aunque
 * el config dijera 308); en Cloudflare el equivalente depende de la zona y del
 * DNS, que este paquete no configura. La lista queda fijada para que el
 * comportamiento sea el mismo si la regla llega al Worker.
 */
const HOSTS_REDIRIGIDOS = new Set([
  'siglo21sur.com',
]);

export const REDIRECCIONES: readonly Redireccion[] = [
  { origen: '/index.html', destino: '/', estado: 308 },
  { origen: '/contactos', destino: '/contacto', estado: 308 },
  { origen: '/novedades', destino: '/novedades/1', estado: 308 },
  // El catálogo está en la home; `/carreras` no es una página.
  { origen: '/carreras', destino: '/', estado: 308 },
  // La materia dejó de ser "Físico-Química" y pasó a "Física" (11/08/2026).
  { origen: '/clases-apoyo/fisico-quimica', destino: '/clases-apoyo/fisica', estado: 301 },
  // La novedad perdió la fecha del slug (08/08/2026); es el mismo tema.
  {
    origen: '/novedades/articulo/segundo-semestre-2026-inicio-3-de-agosto',
    destino: '/novedades/articulo/inicio-de-clases',
    estado: 301,
  },
  // El artículo de Teclab se unificó con la landing que cubre el mismo tema.
  {
    origen: '/novedades/articulo/teclab-tecnicaturas-online',
    destino: '/teclab',
    estado: 301,
  },
];

const CARRERA_VIEJA = /^\/carrera\/([^/]+)$/;
const FICHA = /^\/carreras\/([^/]+)$/;

/**
 * Busca una redirección para la ruta pedida. La barra final se ignora porque
 * Next normaliza primero. `:slug` equivale a un solo segmento, como en el
 * matcher de Next: no toca `/carreras/<slug>/inscripcion`.
 */
export function buscarRedireccion(ruta: string): Redireccion | null {
  const normalizada = ruta.length > 1 && ruta.endsWith('/') ? ruta.slice(0, -1) : ruta;
  const exacta = REDIRECCIONES.find(redireccion => redireccion.origen === normalizada);
  if (exacta) return exacta;

  const vieja = CARRERA_VIEJA.exec(normalizada);
  if (vieja) {
    return { origen: normalizada, destino: `/carreras/${vieja[1]}`, estado: 308 };
  }

  const ficha = FICHA.exec(normalizada);
  if (ficha) {
    const renombre = redirectCarrera(ficha[1]);
    if (renombre) return { origen: normalizada, destino: renombre.destino, estado: renombre.status };
  }
  return null;
}

/**
 * Redirect de host de `next.config.ts`: el apex va al dominio propio con 308,
 * conservando ruta y query. No matchea el dominio canónico (sería un bucle) ni
 * localhost/previews.
 */
export function redireccionDeHost(
  host: string, ruta: string, canonico = SITIO_CANONICO,
): Omit<Redireccion, 'origen'> | null {
  const nombre = host.toLowerCase().replace(/:\d+$/, '');
  if (!HOSTS_REDIRIGIDOS.has(nombre)) return null;
  return { destino: `${canonico}${ruta}`, estado: 308 };
}

/** Conserva la query original, como hace Next al redirigir. */
export function ubicacionRedireccion(redireccion: Omit<Redireccion, 'origen'>, query: string): string {
  return query === '' ? redireccion.destino : `${redireccion.destino}${query}`;
}
