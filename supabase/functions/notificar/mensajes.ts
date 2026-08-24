// Los textos de los avisos de Telegram, sin nada de Deno adentro para que
// `tests/avisos.test.mjs` los pueda correr con Node.
//
// El aviso de consulta NO lleva una lista fija de campos: recorre lo que trajo
// la fila. Esta función vive en Deno y no puede importar
// `components/formularios/casas.ts`, así que una lista acá sería una copia
// envejeciendo en paralelo — y una columna nueva quedaría fuera del aviso sin
// que nadie se entere.

type Fila = Record<string, unknown>;

const CASAS: Record<string, string> = {
  siglo21: 'Siglo 21',
  teclab: 'Teclab',
  identidad: 'Identidad Argentina',
};

/** Lo que ya sale en la cabecera del aviso, más lo interno de la tabla. */
const EN_CABECERA = new Set([
  'id', 'created_at', 'casa', 'tipo_formulario',
  'nombre', 'apellido', 'carrera', 'tipo', 'email', 'telefono', 'localidad',
  'equivalencias', 'modalidad',
]);

/** Rótulos de los datos del legajo. Una columna sin rótulo igual se muestra. */
const ETIQUETAS: Record<string, string> = {
  tipo_documento: '🪪 *Tipo de doc.:*',
  dni: '🪪 *Documento:*',
  sexo: '⚧ *Sexo:*',
  fecha_nacimiento: '🎂 *Nacimiento:*',
  localidad_nacimiento: '🌎 *Lugar de nacimiento:*',
  nacionalidad: '🏳 *Nacionalidad:*',
  pais_residencia: '🌍 *País de residencia:*',
  estado_civil: '💍 *Estado civil:*',
  tipo_domicilio: '🏠 *Tipo de domicilio:*',
  direccion: '🏠 *Calle:*',
  direccion_numero: '🔢 *Número:*',
  direccion_piso: '🔢 *Piso:*',
  direccion_departamento: '🚪 *Depto:*',
  torre: '🏢 *Torre:*',
  barrio: '📍 *Barrio:*',
  codigo_postal: '📮 *Código postal:*',
  nivel_estudios: '🎓 *Nivel de estudios:*',
  colegio: '🏫 *Colegio:*',
  colegio_localidad: '🏫 *Localidad del colegio:*',
  medio_pago: '💳 *Medio de pago:*',
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/**
 * La cabecera dice de una qué llegó y de qué casa. Las filas anteriores al
 * 23/08/2026 no tienen `casa` ni `tipo_formulario`: ahí se mantiene el título
 * viejo en vez de inventar un origen que no sabemos.
 */
function cabecera(fila: Fila): string {
  const casa = typeof fila.casa === 'string' ? CASAS[fila.casa] : null;
  if (fila.tipo_formulario === 'preinscripcion') {
    return `📝 *PREINSCRIPCIÓN${casa ? ` — ${casa}` : ''}*`;
  }
  if (casa) return `💬 *Consulta — ${casa}*`;
  return '📚 *Nueva consulta de carrera*';
}

export function buildConsultaMessage(fila: Fila): string {
  const fecha = fila.created_at ? formatDate(fila.created_at as string) : '—';
  const nombre = `${fila.nombre || '—'} ${fila.apellido || ''}`.trim();

  // Sólo lo que el lead completó: un contacto suelto llega con casi todo vacío
  // y llenar el aviso de guiones lo vuelve ilegible.
  const legajo = Object.entries(fila)
    .filter(([columna, valor]) =>
      !EN_CABECERA.has(columna) && valor !== null && valor !== undefined && valor !== '')
    .map(([columna, valor]) => `${ETIQUETAS[columna] || `• *${columna}:*`} ${valor}`);

  return [
    cabecera(fila),
    ``,
    `👤 *Nombre:* ${nombre}`,
    `🎓 *Carrera:* ${fila.carrera || 'No especificada'}`,
    `📋 *Tipo:* ${fila.tipo || '—'}`,
    `📧 *Email:* ${fila.email || '—'}`,
    `📱 *Teléfono:* ${fila.telefono || '—'}`,
    `📍 *Localidad:* ${fila.localidad || '—'}`,
    `🔄 *Equivalencias:* ${fila.equivalencias ? 'Sí' : 'No'}`,
    ...(legajo.length ? [``, `📝 *Datos del legajo*`, ...legajo] : []),
    ``,
    `🕐 *Fecha:* ${fecha}`,
  ].join('\n');
}

export function buildSolicitudClaseMessage(fila: Fila): string {
  const fecha = fila.created_at ? formatDate(fila.created_at as string) : '—';
  const dias = Array.isArray(fila.dias) ? (fila.dias as string[]).join(', ') : '—';
  const horarios = Array.isArray(fila.horarios) ? (fila.horarios as string[]).join(', ') : '—';

  return [
    `📖 *Nueva solicitud de clase de apoyo*`,
    ``,
    `👤 *Nombre:* ${fila.nombre || '—'}`,
    `📱 *Teléfono:* ${fila.telefono || '—'}`,
    `📅 *Días:* ${dias}`,
    `⏰ *Horarios:* ${horarios}`,
    `🔁 *Reserva semanal:* ${fila.bloqueo_semanal ? '✅ Sí — Reserva semanal fija' : '❌ No'}`,
    `🕐 *Fecha:* ${fecha}`,
  ].join('\n');
}

export function buildFaqMessage(fila: Fila): string {
  const fecha = fila.created_at ? formatDate(fila.created_at as string) : '—';

  return [
    `❓ *Nueva pregunta en FAQ*`,
    ``,
    `📝 *Título:* ${fila.titulo || '—'}`,
    `💬 *Descripción:* ${fila.descripcion || '—'}`,
    `🔒 *Modo:* ${fila.modo || '—'}`,
    `📧 *Contacto:* ${fila.contacto || '—'}`,
    fila.nombre_contacto ? `👤 *Nombre:* ${fila.nombre_contacto}` : null,
    `🕐 *Fecha:* ${fecha}`,
  ].filter(Boolean).join('\n');
}
