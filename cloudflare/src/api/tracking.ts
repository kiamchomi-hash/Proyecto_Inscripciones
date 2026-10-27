import { registrarApertura } from '../datos/control.ts';
import { ipConfiable } from './ip.ts';

/**
 * Telemetría agregada de aperturas. Mismos códigos y cuerpos que
 * `app/api/track-click/route.ts` y `app/api/track-direct-open/route.ts`:
 *
 * - JSON inválido, cuerpo nulo o fallo de base terminan en 200 `{ ok: false }`,
 *   porque la telemetría no puede romper la navegación;
 * - una carrera inválida responde 400 con el mensaje del handler vigente;
 * - superar el cupo responde 200 `{ ok: true, skipped: true }` y no escribe.
 *
 * La única diferencia deliberada es la IP: sale de `cf-connecting-ip`, que pone
 * el borde, y no de `x-forwarded-for`, que el cliente puede falsificar.
 */

export type OrigenApertura = 'modal' | 'directa';

const MENSAJES: Record<OrigenApertura, string> = {
  modal: 'Carrera inválida',
  directa: 'Apertura inválida',
};

const respuesta = (cuerpo: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function manejarApertura(
  request: Request, db: D1Database | null, origen: OrigenApertura,
): Promise<Response> {
  try {
    const cuerpo: unknown = await request.json();
    // `null` no se puede desestructurar: en el handler vigente cae en el catch.
    if (cuerpo === null) throw new TypeError('cuerpo nulo');
    const carrera = (cuerpo as { carrera?: unknown }).carrera;
    if (typeof carrera !== 'string' || !carrera.trim() || carrera.length > 200) {
      return respuesta({ error: MENSAJES[origen] }, 400);
    }

    // Sin base, la telemetría falla cerrada y sin ruido para el visitante.
    if (!db) return respuesta({ ok: false });

    const permitido = await registrarApertura(db, carrera, origen, ipConfiable(request));
    return permitido ? respuesta({ ok: true }) : respuesta({ ok: true, skipped: true });
  } catch (error) {
    // Sólo el tipo: nunca el cuerpo, la carrera ni la IP.
    console.error(`[track-${origen === 'modal' ? 'click' : 'direct-open'}]`, {
      code: error instanceof Error ? error.name : 'desconocido',
    });
    return respuesta({ ok: false });
  }
}
