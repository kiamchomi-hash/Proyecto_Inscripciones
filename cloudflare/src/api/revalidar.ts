import { carreraToSlug, esCarreraVisible } from '../../../components/index/types.ts';
import { rechazoBearer } from './auth.ts';

/**
 * `POST /api/revalidar`: mismo contrato externo que
 * `app/api/revalidar/route.ts` (autenticación, mapeo tabla → rutas, 400 para una
 * tabla sin mapear y `{ ok: true, rutas }`).
 *
 * **Lo que ya no aplica y no se simula:** este paquete Astro no tiene ISR ni
 * caché de HTML mutable. Las páginas leen D1 al servir la respuesta, así que no
 * hay `revalidatePath` que ejecutar; devolver `ok` no afirma una invalidación
 * inexistente. La lista de rutas se conserva porque es lo que el trigger mira en
 * `net._http_response` y porque documenta el mapeo vigente.
 *
 * Tampoco se conserva el aviso posterior a IndexNow: dependía de
 * `VERCEL_ENV=production`, de la red externa y de la publicación en Vercel. Su
 * reemplazo es una decisión del bloque 6, no una llamada silenciosa desde un
 * paquete local.
 */

interface Aviso {
  tabla?: string;
  accion?: string;
  slug?: string | null;
  nombre?: string | null;
  prefix?: string | null;
  nivel?: string | null;
  anterior?: {
    slug?: string | null;
    nombre?: string | null;
    prefix?: string | null;
  } | null;
}

type Ruta = [string, ('page' | 'layout')?];

function slugDeCarrera(nombre?: string | null, prefix?: string | null) {
  if (!nombre) return null;
  return carreraToSlug({ nombre, prefix: prefix ?? null });
}

/** La misma tabla de rutas del handler vigente, sin cambios de criterio. */
export function rutasA(aviso: Aviso): Ruta[] {
  const rutas: Ruta[] = [];
  const esAltaOBaja = aviso.accion !== 'UPDATE';

  switch (aviso.tabla) {
    case 'carreras': {
      rutas.push(['/', 'page'], ['/teclab', 'page'], ['/teclab/test-vocacional', 'page'], ['/api/carreras-detalle']);

      const slug = slugDeCarrera(aviso.nombre, aviso.prefix);
      if (slug && esCarreraVisible({ nivel: aviso.nivel ?? '' })) {
        rutas.push([`/carreras/${slug}`]);
      }

      const anterior = slugDeCarrera(aviso.anterior?.nombre, aviso.anterior?.prefix);
      if (anterior && anterior !== slug) rutas.push([`/carreras/${anterior}`]);

      if (esAltaOBaja) {
        rutas.push(['/carreras/[slug]', 'page'], ['/imagenes', 'page']);
      }
      break;
    }

    case 'novedades': {
      rutas.push(['/novedades/[page]', 'page']);
      if (aviso.slug) rutas.push([`/novedades/articulo/${aviso.slug}`]);
      if (aviso.anterior?.slug && aviso.anterior.slug !== aviso.slug) {
        rutas.push([`/novedades/articulo/${aviso.anterior.slug}`]);
      }
      break;
    }

    case 'materias': {
      rutas.push(['/clases-apoyo', 'page']);
      if (aviso.slug) rutas.push([`/clases-apoyo/${aviso.slug}`]);
      if (aviso.anterior?.slug && aviso.anterior.slug !== aviso.slug) {
        rutas.push([`/clases-apoyo/${aviso.anterior.slug}`]);
      }
      break;
    }

    case 'faq_preguntas':
      rutas.push(['/faq', 'page']);
      break;

    case 'todo':
      rutas.push(['/', 'layout']);
      break;
  }

  return rutas;
}

const respuesta = (cuerpo: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function manejarRevalidar(
  request: Request, secreto: string | undefined,
): Promise<Response> {
  const negado = await rechazoBearer(request, secreto, 'REVALIDATE_SECRET');
  if (negado) return negado;

  let aviso: Aviso;
  try {
    aviso = await request.json() as Aviso;
  } catch {
    return respuesta({ error: 'body invalido' }, 400);
  }

  // El handler vigente accede a `aviso.accion` sin comprobar el nulo: eso es un
  // 500. Se conserva el código sin exponer el error del runtime.
  if (aviso === null) return respuesta({ error: 'Error interno' }, 500);

  const rutas = rutasA(aviso);
  if (rutas.length === 0) {
    return respuesta({ error: `tabla sin rutas asociadas: ${aviso.tabla ?? '(ninguna)'}` }, 400);
  }

  // No hay invalidación que ejecutar: el contenido se lee en cada pedido.
  return respuesta({ ok: true, rutas: rutas.map(([ruta]) => ruta) });
}
