import { idRobot, validarResultadoRobot } from '../../../components/formularios/casas.ts';
import { igualdadTiempoConstante } from './seguro.ts';
import { publicarEfectos, type ProductorCola } from '../operativa/colas.ts';
import {
  listarPendientesRobot, obtenerTrabajoRobot, registrarResultadoRobot,
} from '../datos/robot.ts';

/**
 * API del robot de Teclab: mismos códigos, cabeceras y forma de respuesta que
 * `app/api/robot/autoinscripciones/route.ts`. No cambia el secreto ni su
 * comparación: `Authorization: Bearer $ROBOT_SECRET`, con los hashes comparados
 * en tiempo constante. Acá tampoco se envía nada: el aviso del error queda en el
 * outbox y lo entrega un consumidor.
 */

const CABECERAS = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };

const responder = (cuerpo: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: CABECERAS });

async function huella(texto: string) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)));
}

/** `null` si el pedido está autorizado; si no, la respuesta de rechazo. */
async function rechazo(request: Request, secreto: string | undefined) {
  if (!secreto) return responder({ error: 'ROBOT_SECRET sin configurar' }, 503);
  const recibido = await huella(request.headers.get('authorization') ?? '');
  if (!igualdadTiempoConstante(recibido, await huella(`Bearer ${secreto}`))) {
    return responder({ error: 'no autorizado' }, 401);
  }
  return null;
}

export async function manejarRobotGet(
  request: Request, db: D1Database | null, secreto: string | undefined,
): Promise<Response> {
  const negado = await rechazo(request, secreto);
  if (negado) return negado;
  if (!db) return responder({ error: 'Servicio temporalmente no disponible' }, 503);

  try {
    const parametro = new URL(request.url).searchParams.get('id');
    // Sin id, el barrido de lo que quedó pendiente porque el despacho no salió.
    if (parametro === null) {
      return responder({ ids: await listarPendientesRobot(db) });
    }
    const id = idRobot(parametro);
    if (!id) return responder({ error: 'id inválido' }, 400);

    // Sin claim: una fila abierta se puede pedir más de una vez.
    const trabajo = await obtenerTrabajoRobot(db, id);
    if (!trabajo) return responder({ error: 'no encontrada' }, 404);
    return responder(trabajo);
  } catch (error) {
    console.error('[robot] Error al leer la cola', { code: error instanceof Error ? error.name : 'desconocido' });
    return responder({ error: 'Servicio temporalmente no disponible' }, 503);
  }
}

export async function manejarRobotPost(
  request: Request, db: D1Database | null, secreto: string | undefined, cola?: ProductorCola,
): Promise<Response> {
  const negado = await rechazo(request, secreto);
  if (negado) return negado;
  if (!db) return responder({ error: 'Servicio temporalmente no disponible' }, 503);

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return responder({ error: 'Solicitud inválida' }, 400);
  }
  const validado = validarResultadoRobot(cuerpo);
  if (!validado) return responder({ error: 'Solicitud inválida' }, 400);

  try {
    const registrado = await registrarResultadoRobot(db, cuerpo);
    if (registrado.resultado === 'inexistente') return responder({ error: 'no encontrada' }, 404);
    // Una cargada no se pisa: la segunda notificación no la vuelve a error ni avisa.
    if (registrado.resultado === 'ya-cargada') return responder({ error: 'ya estaba cargada' }, 409);

    const fila = 'fila' in registrado ? registrado.fila : null;
    if (!fila) return responder({ error: 'Servicio temporalmente no disponible' }, 503);
    await publicarEfectos(cola, registrado.efectos ?? []);
    // El aviso de error ya quedó encolado; el campo `aviso` del contrato vigente
    // era el resultado del envío síncrono y no se inventa un valor nuevo.
    return responder({ ok: true, id: fila.id, estado: fila.estado, intentos: fila.intentos });
  } catch (error) {
    console.error('[robot] Error al registrar el resultado', {
      code: error instanceof Error ? error.name : 'desconocido',
    });
    return responder({ error: 'Servicio temporalmente no disponible' }, 503);
  }
}
