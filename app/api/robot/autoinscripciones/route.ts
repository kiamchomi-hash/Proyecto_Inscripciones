// El robot de Teclab pide acá el legajo de cada autoinscripción y avisa cómo le
// fue al cargarla en el Portal Administrativo.
//
// El robot vive en GitHub Actions (repo privado `cau-robot-teclab`) y lo
// despierta `POST /api/formularios` con un `repository_dispatch` que lleva sólo
// el id de `robot_autoinscripciones`. Los datos personales salen de acá, con
// `ROBOT_SECRET`, y nunca quedan en GitHub. La tabla es privada
// (`sql/2026-10-03_robot_autoinscripciones.sql`): se lee con la service role.
//
// Contrato, detalle en docs/formularios-por-casa.md:
//   GET  ?id=<id>   → { id, estado, intentos, carrera, datos } de una fila
//                     pendiente o con error (un error se reintenta); 404 si no.
//   GET             → { ids } de hasta 20 filas pendientes, para el barrido.
//   POST { id, estado: 'cargada' | 'error', detalle } → { ok, id, estado,
//                     intentos, aviso? }. Un error avisa por Telegram con lo
//                     necesario para cargarla a mano.

import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';
import { enviarTelegram } from '@/lib/telegram';
import {
  ESTADOS_ROBOT_ABIERTOS, TABLA_ROBOT, TOPE_PENDIENTES_ROBOT,
  avisoErrorRobot, idRobot, payloadDesdeConsulta, validarResultadoRobot,
} from '@/components/formularios/casas';

export const dynamic = 'force-dynamic';

const SIN_CACHE = { 'Cache-Control': 'no-store' };

const responder = (cuerpo: Record<string, unknown>, status = 200) =>
  NextResponse.json(cuerpo, { status, headers: SIN_CACHE });

/**
 * `null` si el pedido trae `Authorization: Bearer $ROBOT_SECRET`; si no, la
 * respuesta de rechazo. Compara los hashes en tiempo constante: la
 * comparación directa de textos corta en el primer carácter distinto.
 */
function rechazo(request: Request) {
  const secreto = process.env.ROBOT_SECRET;
  if (!secreto) return responder({ error: 'ROBOT_SECRET sin configurar' }, 503);
  const hash = (texto: string) => createHash('sha256').update(texto).digest();
  const recibido = hash(request.headers.get('authorization') ?? '');
  if (!timingSafeEqual(recibido, hash(`Bearer ${secreto}`))) {
    return responder({ error: 'no autorizado' }, 401);
  }
  return null;
}

type FilaRobot = { id: number; consulta_id: number; estado: string; intentos: number };

async function leerFila(supabase: ReturnType<typeof createSupabaseAdmin>, id: number) {
  return supabase
    .from(TABLA_ROBOT)
    .select('id, consulta_id, estado, intentos')
    .eq('id', id)
    .maybeSingle();
}

export async function GET(request: Request) {
  const negado = rechazo(request);
  if (negado) return negado;

  try {
    const supabase = createSupabaseAdmin();
    const parametro = new URL(request.url).searchParams.get('id');

    // Sin id, el barrido: lo que quedó pendiente porque el despacho no salió.
    if (parametro === null) {
      const { data, error } = await supabase
        .from(TABLA_ROBOT)
        .select('id')
        .eq('estado', 'pendiente')
        .order('id', { ascending: true })
        .limit(TOPE_PENDIENTES_ROBOT);
      if (error) throw error;
      return responder({ ids: (data ?? []).map(fila => fila.id) });
    }

    const id = idRobot(parametro);
    if (!id) return responder({ error: 'id inválido' }, 400);

    const cola = await leerFila(supabase, id);
    if (cola.error) throw cola.error;
    const fila = cola.data as FilaRobot | null;
    if (!fila || !(ESTADOS_ROBOT_ABIERTOS as string[]).includes(fila.estado)) {
      return responder({ error: 'no encontrada' }, 404);
    }

    const lectura = await supabase.from('consultas').select('*').eq('id', fila.consulta_id).maybeSingle();
    if (lectura.error) throw lectura.error;
    const consulta = lectura.data as Record<string, unknown> | null;
    if (!consulta) return responder({ error: 'no encontrada' }, 404);

    // El legajo sale con la misma declaración que la preinscripción de Teclab
    // (`CAMPOS` de casas.ts): acá no hay nombres de columna escritos a mano.
    return responder({
      id: fila.id,
      estado: fila.estado,
      intentos: fila.intentos,
      carrera: typeof consulta.carrera === 'string' ? consulta.carrera : '',
      datos: payloadDesdeConsulta(consulta),
    });
  } catch (error) {
    console.error('[robot] Error al leer la cola', { code: (error as { code?: string })?.code ?? 'desconocido' });
    return responder({ error: 'Servicio temporalmente no disponible' }, 503);
  }
}

export async function POST(request: Request) {
  const negado = rechazo(request);
  if (negado) return negado;

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return responder({ error: 'Solicitud inválida' }, 400);
  }
  const resultado = validarResultadoRobot(cuerpo);
  if (!resultado) return responder({ error: 'Solicitud inválida' }, 400);

  try {
    const supabase = createSupabaseAdmin();
    const cola = await leerFila(supabase, resultado.id);
    if (cola.error) throw cola.error;
    const fila = cola.data as FilaRobot | null;
    if (!fila) return responder({ error: 'no encontrada' }, 404);
    // Una cargada no se pisa: si el robot la informa dos veces, la segunda
    // no la vuelve a error ni dispara otro aviso.
    if (fila.estado === 'cargada') return responder({ error: 'ya estaba cargada' }, 409);

    const intentos = fila.intentos + (resultado.estado === 'error' ? 1 : 0);
    const { error } = await supabase
      .from(TABLA_ROBOT)
      .update({
        estado: resultado.estado,
        intentos,
        detalle: resultado.detalle || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fila.id);
    if (error) throw error;

    if (resultado.estado === 'cargada') {
      return responder({ ok: true, id: fila.id, estado: resultado.estado, intentos });
    }

    // El aviso no tumba la respuesta: la fila ya quedó en error y el robot no
    // tiene nada que reintentar por un Telegram caído.
    const lectura = await supabase.from('consultas').select('*').eq('id', fila.consulta_id).maybeSingle();
    if (lectura.error) console.error('[robot] No se pudo leer la consulta del aviso', { code: lectura.error.code });
    const consulta = lectura.error ? null : (lectura.data as Record<string, unknown> | null);
    const aviso = await enviarTelegram(avisoErrorRobot({ id: fila.id, intentos }, consulta, resultado.detalle), 5000);
    if (aviso !== 'enviado') console.error('[robot] No se pudo avisar el error por Telegram', { aviso, id: fila.id });
    return responder({ ok: true, id: fila.id, estado: resultado.estado, intentos, aviso });
  } catch (error) {
    console.error('[robot] Error al registrar el resultado', { code: (error as { code?: string })?.code ?? 'desconocido' });
    return responder({ error: 'Servicio temporalmente no disponible' }, 503);
  }
}
