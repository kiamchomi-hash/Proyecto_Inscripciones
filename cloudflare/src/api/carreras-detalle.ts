import { ErrorDetalleCarrera, listarDetallePublico } from '../datos/detalles.ts';
import type { CarreraDetalle } from '../../../components/index/types.ts';

/**
 * `GET /api/carreras-detalle`: el mismo mapa `{ [id]: CarreraDetalle }` que
 * `app/api/carreras-detalle/route.ts`, con las mismas reglas.
 *
 * - Sólo carreras activas y visibles en la taxonomía compartida.
 * - Una fila con slides inválidos invalida la respuesta entera: 502 sin caché,
 *   nunca un éxito parcial ni un precio de más.
 * - Sin binding D1 el paquete local falla cerrado con 503 (el sitio vigente no
 *   tiene ese estado: ahí la credencial está siempre).
 *
 * La forma del error es la del handler: `{ error: 'no se pudo leer el detalle' }`.
 */

const ERROR_DETALLE = 'no se pudo leer el detalle';

// Un día en el CDN y una semana sirviendo el viejo mientras se rehace, igual
// que el handler vigente. El middleware local pisa `Cache-Control` con
// `no-store` a propósito (ver LEER.md): el paquete no se publica.
const CABECERAS_OK = {
  'Content-Type': 'application/json',
  'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
};

const json = (cuerpo: unknown, status: number, cabeceras?: Record<string, string>) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json', ...cabeceras } });

export async function responderDetalle(db: D1Database | null): Promise<Response> {
  if (!db) return json({ error: 'Servicio temporalmente no disponible' }, 503);

  let detalle: Record<number, CarreraDetalle>;
  try {
    detalle = await listarDetallePublico(db);
  } catch (error) {
    if (!(error instanceof ErrorDetalleCarrera)) {
      // Lectura rota o JSON que el CHECK no dejó pasar: 502 como el handler y
      // sin datos de la fila en el registro.
      console.error('No se pudo leer el detalle de carreras');
      return json({ error: ERROR_DETALLE }, 502);
    }
    console.error('Detalle de carrera inválido:', { id: error.id, ruta: error.ruta });
    return json({ error: ERROR_DETALLE }, 502);
  }

  return new Response(JSON.stringify(detalle), { status: 200, headers: CABECERAS_OK });
}
