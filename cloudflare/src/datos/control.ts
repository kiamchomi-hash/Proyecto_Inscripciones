import { leerRelojBase } from './reloj.ts';

// Misma condición estricta que la RPC PostgreSQL; a igualdad la ventana sigue viva.
const EXPIRADA = "form_rate_limits.window_started_at < strftime('%Y-%m-%dT%H:%M:%fZ', ?4, (-?3) || ' seconds')";
export const SQL_CUPO = `
  INSERT INTO form_rate_limits(key, window_started_at, request_count) VALUES (?1, ?4, 1)
  ON CONFLICT (key) DO UPDATE SET
    window_started_at = CASE WHEN ${EXPIRADA} THEN excluded.window_started_at ELSE form_rate_limits.window_started_at END,
    request_count = CASE WHEN ${EXPIRADA} THEN 1 ELSE form_rate_limits.request_count + 1 END
  WHERE ${EXPIRADA} OR form_rate_limits.request_count < ?2 OR ?2 IS NULL
  RETURNING 1 AS permitido`;

function validarInteger(valor: number | null) {
  if (valor !== null && (!Number.isInteger(valor) || valor < -2147483648 || valor > 2147483647)) {
    throw new TypeError('Parámetro integer inválido.');
  }
}

export async function comprobarCupo(db: D1Database, clave: string, maximo: number | null, ventanaSegundos: number | null): Promise<boolean> {
  if (typeof clave !== 'string') throw new TypeError('Clave inválida.');
  validarInteger(maximo);
  validarInteger(ventanaSegundos);
  // Sin SELECT del contador ni bloqueo en memoria. El UPSERT decide y escribe junto.
  const ahora = await leerRelojBase(db);
  return await db.prepare(SQL_CUPO).bind(clave, maximo, ventanaSegundos, ahora).first() !== null;
}

const FORMULARIOS = ['consulta', 'faq', 'clase', 'precio', 'autoinscripcion', 'enlace'];
const MAXIMOS_ALERTA = {
  whatsapp: 5, 'clase-whatsapp': 5, 'formulario-fallo': 5,
  'formulario-intento': 12, 'formulario-abandonado': 12,
} as const;

async function claveHash(prefijo: string, ip: string) {
  if (typeof ip !== 'string') throw new TypeError('IP inválida.');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return `${prefijo}:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

export async function consumirCupoFormulario(db: D1Database, kind: string, ip: string) {
  if (!FORMULARIOS.includes(kind)) throw new TypeError('Formulario desconocido.');
  return comprobarCupo(db, await claveHash(kind, ip), 5, 600);
}

export async function consumirCupoAlerta(db: D1Database, evento: string, ip: string) {
  if (!Object.hasOwn(MAXIMOS_ALERTA, evento)) throw new TypeError('Evento desconocido.');
  return comprobarCupo(db, await claveHash(`analytics-alert:${evento}`, ip), MAXIMOS_ALERTA[evento as keyof typeof MAXIMOS_ALERTA], 600);
}

// Puerto interno, sin Turnstile real ni API. El sobre/config/demo se validarán antes
// al migrar el handler; payload después. Ningún fallo posterior devuelve el intento.
export async function comprobarEntradaFormulario(db: D1Database, kind: string, ip: string, verificarCaptcha: () => Promise<boolean>) {
  const [captcha, cupo] = await Promise.allSettled([
    Promise.resolve().then(verificarCaptcha), consumirCupoFormulario(db, kind, ip),
  ]);
  // Esperar las dos ramas conserva la cuota incluso si captcha lanza una excepción.
  if (captcha.status === 'rejected') throw captcha.reason;
  if (cupo.status === 'rejected') throw cupo.reason;
  return { captchaOk: captcha.value, permitido: cupo.value };
}

type Origen = 'modal' | 'directa';
function validarOrigen(origen: Origen) {
  if (origen !== 'modal' && origen !== 'directa') throw new TypeError('Origen inválido.');
}

const FECHA_ARGENTINA = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit',
});
export function fechaClicksDesdeUTC(ahora: string): string {
  return FECHA_ARGENTINA.format(new Date(ahora));
}

export const SQL_CLICK = `
  INSERT INTO career_clicks(fecha, carrera, clicks, origen) VALUES (?3, ?1, 1, ?2)
  ON CONFLICT (fecha, carrera, origen) DO UPDATE SET clicks = career_clicks.clicks + 1`;

export async function registrarClickCarrera(db: D1Database, carrera: string, origen: Origen = 'modal'): Promise<void> {
  if (typeof carrera !== 'string') throw new TypeError('Carrera inválida.');
  validarOrigen(origen);
  const dia = fechaClicksDesdeUTC(await leerRelojBase(db));
  await db.prepare(SQL_CLICK).bind(carrera, origen, dia).run();
}

// Adaptación de los consumidores actuales: validación antes de cuota; dos escrituras
// independientes, como las dos RPC actuales (un contador fallido no reembolsa cupo).
export async function registrarApertura(db: D1Database, carrera: string, origen: Origen, ip: string): Promise<boolean> {
  if (typeof carrera !== 'string' || !carrera.trim() || carrera.length > 200) throw new TypeError('Carrera inválida.');
  validarOrigen(origen);
  const prefijo = origen === 'modal' ? 'click' : 'direct-open';
  const maximo = origen === 'modal' ? 60 : 20;
  if (!await comprobarCupo(db, await claveHash(prefijo, ip), maximo, 600)) return false;
  await registrarClickCarrera(db, carrera.trim().slice(0, 200), origen);
  return true;
}

export async function leerClicks(db: D1Database, fecha: string, origen: Origen = 'modal') {
  validarOrigen(origen);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha.startsWith('0000') ||
    !Number.isFinite(Date.parse(`${fecha}T00:00:00Z`)) ||
    new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) !== fecha) throw new TypeError('Fecha inválida.');
  return (await db.prepare('SELECT carrera, clicks FROM career_clicks WHERE fecha = ?1 AND origen = ?2 ORDER BY clicks DESC')
    .bind(fecha, origen).all<{ carrera: string; clicks: number }>()).results;
}
