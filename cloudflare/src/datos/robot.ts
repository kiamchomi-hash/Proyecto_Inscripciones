import {
  idRobot, validarResultadoRobot, payloadDesdeConsulta, TOPE_PENDIENTES_ROBOT,
  type EstadoRobot,
} from '../../../components/formularios/casas.ts';
import { leerRelojBase } from './reloj.ts';
import { sentenciaAvisoRobot } from '../operativa/outbox.ts';

interface FilaRobot {
  id: number; consulta_id: number; estado: EstadoRobot; intentos: number;
  detalle: string | null; created_at: string; updated_at: string;
}

export async function encolarRobot(db: D1Database, consultaId: number) {
  if (!idRobot(consultaId)) throw new TypeError('ID de consulta inválido.');
  const consulta = await db.prepare('SELECT casa,tipo_formulario FROM consultas WHERE id=?1').bind(consultaId).first();
  if (!consulta || consulta.casa !== 'teclab' || consulta.tipo_formulario !== 'autoinscripcion') throw new TypeError('Consulta sin autoinscripción.');
  const nuevo = await db.prepare(`INSERT INTO robot_autoinscripciones(consulta_id) VALUES (?1)
    ON CONFLICT(consulta_id) DO NOTHING RETURNING id`).bind(consultaId).first<{ id: number }>();
  if (nuevo) return { id: nuevo.id, creado: true };
  const existente = await db.prepare('SELECT id FROM robot_autoinscripciones WHERE consulta_id=?1').bind(consultaId).first<{ id: number }>();
  if (!existente) throw new Error('No se pudo leer el trabajo.');
  // El reintento no cambia estado, intentos ni updated_at, ni despacha un trabajo externo.
  return { id: existente.id, creado: false };
}

export async function listarPendientesRobot(db: D1Database): Promise<number[]> {
  return (await db.prepare("SELECT id FROM robot_autoinscripciones WHERE estado='pendiente' ORDER BY id LIMIT ?1")
    .bind(TOPE_PENDIENTES_ROBOT).all<{ id: number }>()).results.map(f => f.id);
}

/** Lectura, NO claim. Dos consumidores pueden obtener la misma fila abierta. */
export async function obtenerTrabajoRobot(db: D1Database, valor: unknown) {
  const id = idRobot(valor);
  if (!id) throw new TypeError('ID de robot inválido.');
  const fila = await db.prepare("SELECT id,consulta_id,estado,intentos FROM robot_autoinscripciones WHERE id=?1 AND estado IN ('pendiente','error')")
    .bind(id).first<Pick<FilaRobot, 'id' | 'consulta_id' | 'estado' | 'intentos'>>();
  if (!fila) return null;
  const consulta = await db.prepare('SELECT * FROM consultas WHERE id=?1').bind(fila.consulta_id).first<Record<string, unknown>>();
  if (!consulta) return null;
  return {
    id: fila.id, estado: fila.estado, intentos: fila.intentos,
    carrera: typeof consulta.carrera === 'string' ? consulta.carrera : '',
    datos: payloadDesdeConsulta(consulta),
  };
}

export async function registrarResultadoRobot(db: D1Database, cuerpo: unknown) {
  const resultado = validarResultadoRobot(cuerpo);
  if (!resultado) throw new TypeError('Resultado inválido.');
  const actualizacion = db.prepare(`UPDATE robot_autoinscripciones SET
    estado=?2, intentos=intentos + CASE WHEN ?2='error' THEN 1 ELSE 0 END,
    detalle=?3, updated_at=?4 WHERE id=?1 AND estado <> 'cargada'
    RETURNING id,consulta_id,estado,intentos,detalle,created_at,updated_at`)
    .bind(resultado.id, resultado.estado, resultado.detalle || null, await leerRelojBase(db));
  // El aviso del error se encola en la misma transacción que el cambio de estado,
  // y sólo si ese cambio se aplicó (`changes()`): un reintento no duplica el aviso.
  const sentencias = resultado.estado === 'error'
    ? [actualizacion, sentenciaAvisoRobot(db, resultado.id)]
    : [actualizacion];
  const [fila, avisos] = await db.batch(sentencias);
  if (fila.results.length) return {
    resultado: 'aplicado' as const, fila: fila.results[0] as FilaRobot,
    efectos: (avisos?.results ?? []).map(f => Number((f as { id: number }).id)),
  };
  const existente = await db.prepare('SELECT id FROM robot_autoinscripciones WHERE id=?1').bind(resultado.id).first();
  return { resultado: existente ? 'ya-cargada' as const : 'inexistente' as const };
}
