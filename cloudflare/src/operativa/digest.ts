/**
 * Resumen diario de clics de tarjetas, equivalente al `digest-clicks` de Supabase.
 *
 * El texto es el mismo contrato: encabezado con la fecha, total, top 10 con
 * medallas y escape de Markdown; y un segundo mensaje sólo si hubo aperturas
 * directas. La fecha por defecto es **ayer** en hora argentina, no el día en
 * curso: el cron corre a las 09:00 y con el día en curso se perdía la noche.
 *
 * «Usuarios activos» venía de Vercel Analytics y no se reimplementó: al dejar
 * Vercel esa fuente desaparece. Queda como dato opcional que se agrega sólo si
 * hay un lector configurado.
 */

export const TOP_N = 10;

export interface FilaClick {
  carrera: string;
  clicks: number;
}

/** `YYYY-MM-DD` de hoy en Buenos Aires, con desplazamiento en días. */
export function fechaArgentina(desplazamiento = 0, ahora: Date = new Date()): string {
  const hoy = ahora.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  if (desplazamiento === 0) return hoy;
  const [anio, mes, dia] = hoy.split('-').map(Number);
  const base = new Date(Date.UTC(anio, mes - 1, dia));
  base.setUTCDate(base.getUTCDate() + desplazamiento);
  return base.toISOString().slice(0, 10);
}

/** Markdown de Telegram: los nombres de carrera traen paréntesis y guiones. */
const escapar = (texto: string): string => texto.replace(/([_*\[\]`])/g, '\\$1');

const largo = (fecha: string): string => {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
};

export function construirDigest(fecha: string, filas: FilaClick[]): string {
  const total = filas.reduce((suma, fila) => suma + fila.clicks, 0);
  const encabezado = `📊 *Resumen del ${largo(fecha)}*`;
  if (!total) return `${encabezado}\n\nSin aperturas de tarjetas ese día.`;

  const apertura = total === 1 ? 'apertura' : 'aperturas';
  const carrera = filas.length === 1 ? 'carrera' : 'carreras';
  const top = filas.slice(0, TOP_N).map((fila, i) => {
    const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
    return `${medalla} ${escapar(fila.carrera)} — *${fila.clicks}*`;
  }).join('\n');
  const resto = filas.length > TOP_N ? `\n\n_y ${filas.length - TOP_N} carreras más_` : '';
  return `${encabezado}\n\n👆 *${total}* ${apertura} desde tarjetas en *${filas.length}* ${carrera}\n\n${top}${resto}`;
}

export function construirDigestDirectas(fecha: string, filas: FilaClick[]): string {
  const total = filas.reduce((suma, fila) => suma + fila.clicks, 0);
  const apertura = total === 1 ? 'apertura directa' : 'aperturas directas';
  const carrera = filas.length === 1 ? 'carrera' : 'carreras';
  const encabezado = `📊 *Aperturas directas del ${largo(fecha)}*`;
  const lista = filas.map((fila, i) => `${i + 1}. ${escapar(fila.carrera)} — *${fila.clicks}*`).join('\n');
  return `${encabezado}\n\n🔗 *${total}* ${apertura} en *${filas.length}* ${carrera}\n\n${lista}`;
}

export interface ResultadoDigest {
  fecha: string;
  carreras: number;
  directas: number;
  enviados: number;
  usuariosActivos: number | null;
}

export interface DependenciasDigest {
  db: D1Database;
  telegram: (texto: string) => Promise<string>;
  /** Opcional: sin lector, la línea de usuarios activos no se envía. */
  usuariosActivos?: (fecha: string) => Promise<number>;
  /** Sólo para reenviar un día puntual o probar la frontera. */
  fecha?: string;
}

async function leerClicks(db: D1Database, fecha: string, origen: 'modal' | 'directa'): Promise<FilaClick[]> {
  const filas = await db.prepare(
    'SELECT carrera, clicks FROM career_clicks WHERE fecha = ?1 AND origen = ?2 ORDER BY clicks DESC',
  ).bind(fecha, origen).all<FilaClick>();
  return filas.results;
}

export async function enviarDigest({ db, telegram, usuariosActivos, fecha }: DependenciasDigest): Promise<ResultadoDigest> {
  const dia = fecha ?? fechaArgentina(-1);
  const [modales, directas] = await Promise.all([
    leerClicks(db, dia, 'modal'),
    leerClicks(db, dia, 'directa'),
  ]);

  let enviados = 0;
  if (await telegram(construirDigest(dia, modales)) === 'enviado') enviados += 1;
  if (directas.length > 0 && await telegram(construirDigestDirectas(dia, directas)) === 'enviado') enviados += 1;

  let activos: number | null = null;
  if (usuariosActivos) {
    try { activos = await usuariosActivos(dia); } catch { activos = null; }
    if (activos !== null && await telegram(`Usuarios activos del ${dia}: ${activos}.`) === 'enviado') enviados += 1;
  }

  return { fecha: dia, carreras: modales.length, directas: directas.length, enviados, usuariosActivos: activos };
}
