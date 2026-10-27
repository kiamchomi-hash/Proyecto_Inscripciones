import {
  CASAS, CASAS_CON_AUTOINSCRIPCION, consultaConEnlace, esCodigoEnlace,
  estadoEnlace, carreraConAutoinscripcion, payloadDesdeConsulta, validarPayloadAutoinscripcion,
  type FilaEnlace,
} from '../../../components/formularios/casas.ts';
import { nuevoCodigo } from '../../../supabase/functions/notificar/enlace.ts';
import { leerRelojBase } from './reloj.ts';

type Enlace = FilaEnlace & { creado_at: string };
type CarreraEnlace = { id: number; nombre: string; nivel: string; proximamente: number };

export async function leerEnlace(db: D1Database, codigo: unknown): Promise<Enlace | null> {
  if (!esCodigoEnlace(codigo)) return null;
  return db.prepare('SELECT codigo, consulta_id, creado_at, vence_at, usado_at FROM enlaces_inscripcion WHERE codigo=?1')
    .bind(codigo).first<Enlace>();
}

export async function crearEnlace(db: D1Database, consultaId: number, codigo = nuevoCodigo()): Promise<Enlace> {
  if (!esCodigoEnlace(codigo)) throw new TypeError('Código inválido.');
  if (!Number.isSafeInteger(consultaId) || consultaId < 1) throw new TypeError('Consulta inválida.');
  const consulta = await db.prepare('SELECT casa, tipo_formulario FROM consultas WHERE id=?1').bind(consultaId).first();
  if (!consultaConEnlace(consulta)) throw new TypeError('Consulta sin enlace.');
  const fila = await db.prepare(`INSERT INTO enlaces_inscripcion(codigo, consulta_id) VALUES (?1,?2)
    RETURNING codigo, consulta_id, creado_at, vence_at, usado_at`).bind(codigo, consultaId).first<Enlace>();
  if (!fila) throw new Error('No se pudo crear el enlace.');
  return fila;
}

// Sin estado de lease nuevo: usado_at es el indicador de consumo del contrato actual.
export const SQL_RESERVAR_ENLACE = `UPDATE enlaces_inscripcion SET usado_at=?2
  WHERE codigo=?1 AND usado_at IS NULL AND vence_at > ?2
  RETURNING codigo, consulta_id, vence_at, usado_at`;

/**
 * Lectura y validación previas al consumo: enlace vigente, consulta con enlace,
 * carrera de una casa con autoinscripción y legajo completo. No escribe nada, así
 * el bloque 3 puede envolver el consumo y el alta en una sola transacción.
 */
export async function prepararEnlace(db: D1Database, codigo: unknown) {
  const fila = await leerEnlace(db, codigo);
  if (!fila || estadoEnlace(fila, new Date(await leerRelojBase(db))) !== 'valido') return null;
  const consulta = await db.prepare('SELECT * FROM consultas WHERE id=?1').bind(fila.consulta_id).first<Record<string, unknown>>();
  if (!consultaConEnlace(consulta) || !consulta || typeof consulta.carrera !== 'string') return null;
  const niveles = CASAS_CON_AUTOINSCRIPCION.flatMap(casa => CASAS[casa].niveles);
  const carrera = await db.prepare(`SELECT id,nombre,nivel,proximamente FROM carreras
    WHERE nombre=?1 AND nivel IN (${niveles.map((_, i) => `?${i + 2}`).join(',')}) LIMIT 1`)
    .bind(consulta.carrera, ...niveles).first<CarreraEnlace>();
  if (!carrera || !carreraConAutoinscripcion({ ...carrera, proximamente: carrera.proximamente === 1 })) return null;
  const legajo = { ...payloadDesdeConsulta(consulta), carreraId: carrera.id };
  const datos = validarPayloadAutoinscripcion(legajo);
  if (!datos) return null;
  return { enlace: fila, consulta, carrera, datos, legajo };
}

/** Devuelve contexto privado sólo al ganador; no crea una autoinscripción ni despacha nada. */
export async function reservarEnlace(db: D1Database, codigo: unknown) {
  const preparado = await prepararEnlace(db, codigo);
  if (!preparado) return null;
  // Volver a comprobar vencimiento junto al CAS, no sólo antes de leer el legajo.
  const enlace = await db.prepare(SQL_RESERVAR_ENLACE)
    .bind(preparado.enlace.codigo, await leerRelojBase(db)).first<FilaEnlace>();
  return enlace ? { enlace, datos: preparado.datos, legajo: preparado.legajo } : null;
}

/** Compensación explícita como el handler actual, sólo tras fallo local confirmado.
 * Con el alta transaccional del bloque 3 no hace falta: si el batch falla no queda
 * nada escrito. Sigue existiendo para el camino de reintento manual y no protege
 * de una compensación tardía; nunca liberar por un envío externo ambiguo.
 */
export async function liberarEnlace(db: D1Database, codigo: unknown): Promise<boolean> {
  if (!esCodigoEnlace(codigo)) throw new TypeError('Código inválido.');
  return await db.prepare('UPDATE enlaces_inscripcion SET usado_at=NULL WHERE codigo=?1 AND usado_at IS NOT NULL RETURNING codigo')
    .bind(codigo).first() !== null;
}
