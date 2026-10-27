import {
  CAMPOS, CASAS, EMAIL_VALIDO, TELEFONO_VALIDO,
  camposDe, columnaDe,
  type CampoId, type CasaId, type Modo,
} from '../../../components/formularios/casas.ts';

// Armado de filas de la API: mismas reglas que `app/api/formularios/route.ts`.
// Acá tampoco hay nombres de columna escritos a mano: todos salen de `CAMPOS`.

export type JsonRecord = Record<string, unknown>;

export const esRegistro = (valor: unknown): valor is JsonRecord =>
  valor !== null && typeof valor === 'object' && !Array.isArray(valor);

export const text = (valor: unknown, max: number) =>
  typeof valor === 'string' ? valor.trim().slice(0, max) : '';

export const nullableText = (valor: unknown, max: number) => text(valor, max) || null;

export const EMAIL = EMAIL_VALIDO;
export const PHONE = TELEFONO_VALIDO;
const SLOT = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/;

// Tolerantes a propósito: un DNI corto o una opción rara se guardan en null y la
// consulta entra igual. Rechazar el envío entero sería perder el lead.
const unaOpcionDe = (valor: unknown, opciones: readonly string[]) => {
  const elegida = text(valor, 40);
  return opciones.includes(elegida) ? elegida : null;
};

const soloDni = (valor: unknown) => {
  const digitos = text(valor, 20).replace(/\D/g, '');
  return digitos.length >= 7 && digitos.length <= 9 ? digitos : null;
};

const MODOS: Modo[] = ['contacto', 'preinscripcion'];

export const esCasa = (valor: unknown): valor is CasaId =>
  typeof valor === 'string' && Object.hasOwn(CASAS, valor);

export const esModo = (valor: unknown): valor is Modo => MODOS.includes(valor as Modo);

/** Fila de `consultas` con las columnas declaradas en `casas.ts`. */
export type FilaConsulta = Record<string, string | number | boolean | null>;

/**
 * Con casa y modo conocidos, los campos que esa casa declara; sin ellos —un
 * cliente viejo que manda el sobre plano—, la unión de todo lo declarado.
 */
export function camposAceptados(casa: CasaId | null, modo: Modo | null): CampoId[] {
  if (casa && modo) return camposDe(casa, modo);
  const todos = (Object.keys(CASAS) as CasaId[])
    .flatMap(id => [...CASAS[id].contacto, ...CASAS[id].preinscripcion]);
  return [...new Set(todos)];
}

function asignarCampo(fila: FilaConsulta, campo: CampoId, payload: JsonRecord) {
  const definicion = CAMPOS[campo];
  if (definicion.tipo === 'checkbox') {
    fila[columnaDe(definicion)] = payload[campo] === true;
  } else {
    fila[columnaDe(definicion)] = definicion.opciones
      ? unaOpcionDe(payload[campo], definicion.opciones)
      : campo === 'dni' ? soloDni(payload[campo]) : nullableText(payload[campo], definicion.max);
  }
}

/** Los booleanos van siempre: omitir una columna NOT NULL rompe el INSERT entero. */
export function completarBooleanos(fila: FilaConsulta, aceptados: readonly CampoId[]) {
  for (const campo of Object.keys(CAMPOS) as CampoId[]) {
    const definicion = CAMPOS[campo];
    if (definicion.tipo === 'checkbox' && !aceptados.includes(campo)) {
      fila[columnaDe(definicion)] = false;
    }
  }
}

/** La consulta validada. Un contacto inválido lanza `TypeError` (400). */
export function filaConsulta(payload: JsonRecord): FilaConsulta {
  const email = text(payload.email, 254);
  const telefono = text(payload.telefono, 30);
  if ((!email && !telefono) || (email && !EMAIL.test(email)) || (telefono && !PHONE.test(telefono))) {
    throw new TypeError('Datos de contacto inválidos');
  }
  // Un discriminador mal formado no rebota el envío: se guarda en null.
  const casa = esCasa(payload.casa) ? payload.casa : null;
  const modo = esModo(payload.tipoFormulario) ? payload.tipoFormulario : null;
  const fila: FilaConsulta = {
    carrera: nullableText(payload.carrera, 160),
    tipo: nullableText(payload.tipo, 80),
    casa,
    tipo_formulario: modo,
  };
  const aceptados = camposAceptados(casa, modo);
  for (const campo of aceptados) asignarCampo(fila, campo, payload);
  completarBooleanos(fila, aceptados);
  return fila;
}

/** La pregunta validada; inválida lanza `TypeError`. */
export function filaFaq(payload: JsonRecord) {
  const titulo = text(payload.titulo, 120);
  const contacto = text(payload.contacto, 200);
  const modo = payload.modo === 'privada' ? 'privada' : 'publica';
  if (titulo.length < 5 || !contacto) throw new TypeError('Pregunta inválida');
  return {
    titulo,
    descripcion: nullableText(payload.descripcion, 500),
    modo,
    contacto,
    nombre_contacto: modo === 'privada' ? nullableText(payload.nombre_contacto, 80) : null,
  };
}

/** Las filas de la solicitud de clase, validadas; inválidas lanzan `TypeError`. */
export function filasClase(payload: JsonRecord) {
  if (!Array.isArray(payload.rows) || payload.rows.length < 1 || payload.rows.length > 7) {
    throw new TypeError('Solicitud inválida');
  }
  return payload.rows.map(raw => {
    if (!esRegistro(raw)) throw new TypeError('Solicitud inválida');
    const materiaId = text(raw.materia_id, 36);
    const telefono = text(raw.telefono, 30);
    const dias = Array.isArray(raw.dias)
      ? raw.dias.map(dia => text(dia, 30)).filter(Boolean).slice(0, 7)
      : [];
    const horarios = Array.isArray(raw.horarios)
      ? raw.horarios.map(hora => text(hora, 20)).filter(hora => SLOT.test(hora)).slice(0, 14)
      : [];
    if (!/^[0-9a-f-]{36}$/i.test(materiaId) || !PHONE.test(telefono) || !dias.length || !horarios.length) {
      throw new TypeError('Solicitud inválida');
    }
    return {
      materia_id: materiaId,
      dias,
      horarios,
      nombre: nullableText(raw.nombre, 100),
      telefono,
      bloqueo_semanal: raw.bloqueo_semanal === true,
    };
  });
}

/** La fila de una preinscripción completa, con la casa verificada en la base. */
export function filaAutoinscripcion(casa: CasaId, payload: JsonRecord, encabezado: FilaConsulta) {
  const fila: FilaConsulta = { ...encabezado };
  const campos = camposDe(casa, 'preinscripcion');
  for (const campo of campos) asignarCampo(fila, campo, payload);
  completarBooleanos(fila, campos);
  return fila;
}

/** La consulta guardada vuelta payload completo (todas las columnas declaradas). */
export function payloadCompletoDesdeConsulta(consulta: JsonRecord): JsonRecord {
  const payload: JsonRecord = {};
  for (const campo of Object.keys(CAMPOS) as CampoId[]) {
    const valor = consulta[columnaDe(campo)];
    payload[campo] = CAMPOS[campo].tipo === 'checkbox' ? valor === 1 || valor === true : (valor ?? '');
  }
  return payload;
}

/** INSERT parametrizado de `consultas`, con las columnas tomadas de la fila. */
export function sentenciaInsertConsulta(db: D1Database, fila: FilaConsulta, devolverId = true) {
  const columnas = Object.keys(fila);
  if (columnas.length === 0) throw new TypeError('Fila vacía.');
  return db.prepare(`INSERT INTO consultas(${columnas.join(',')})
    VALUES (${columnas.map((_, i) => `?${i + 1}`).join(',')})${devolverId ? ' RETURNING id' : ''}`)
    .bind(...columnas.map(columna => fila[columna] ?? null));
}

/** La pregunta, con las columnas de la tabla; `estado` y `destacada` quedan en su default. */
export function sentenciaInsertFaq(db: D1Database, fila: Record<string, string | null>) {
  const columnas = Object.keys(fila);
  if (columnas.length === 0) throw new TypeError('Fila vacía.');
  return db.prepare(`INSERT INTO faq_preguntas(${columnas.join(',')})
    VALUES (${columnas.map((_, i) => `?${i + 1}`).join(',')}) RETURNING id`)
    .bind(...columnas.map(columna => fila[columna]));
}

/**
 * Una sola sentencia para todas las filas de una solicitud de clases: o entran
 * las N o no entra ninguna, y el outbox se ancla en los ids ya generados.
 * En Postgres `dias` y `horarios` son `text[]`; acá van como JSON, con la misma
 * forma y validados por el CHECK de la tabla.
 */
export function sentenciaInsertClases(
  db: D1Database,
  filas: readonly Record<string, string | boolean | string[] | null>[],
  ids: readonly string[],
) {
  if (filas.length === 0) throw new TypeError('Solicitud vacía.');
  if (filas.length !== ids.length) throw new TypeError('Ids desalineados.');
  const columnas = ['id', ...Object.keys(filas[0]!)];
  const grupos: string[] = [];
  const valores: unknown[] = [];
  for (const [indice, fila] of filas.entries()) {
    grupos.push(`(${columnas.map(() => '?').join(',')})`);
    valores.push(ids[indice], ...Object.keys(filas[0]!).map(columna => {
      const valor = fila[columna];
      if (Array.isArray(valor)) return JSON.stringify(valor);
      if (typeof valor === 'boolean') return valor ? 1 : 0;
      return valor ?? null;
    }));
  }
  return db.prepare(`INSERT INTO solicitudes_clase(${columnas.join(',')}) VALUES ${grupos.join(',')}`)
    .bind(...valores);
}

/** Día argentino de un instante UTC: la vigencia de precios es una fecha civil. */
export function diaArgentino(ahora: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(ahora));
}
