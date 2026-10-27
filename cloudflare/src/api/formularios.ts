import {
  CASAS_CON_PRECIO, CAMPOS_PRECIO, FORMULARIO_PRECIO,
  TIPO_PRECIO, carreraConPrecio,
  carreraIdDe, casaDeCarrera, columnaDe, mailParaNewsletter,
  resultadoPrecio, validarPayloadPrecio,
  type FilaPrecio, type ResultadoPrecio,
} from '../../../components/formularios/casas.ts';
import { comprobarEntradaFormulario } from '../datos/control.ts';
import { leerRelojBase } from '../datos/reloj.ts';
import { leerPrecioPrivado } from '../datos/repositorio.ts';
import {
  EMAIL, completarBooleanos, diaArgentino, esRegistro, filaConsulta,
  filaFaq, filasClase, sentenciaInsertClases, sentenciaInsertConsulta, sentenciaInsertFaq, text,
  type FilaConsulta, type JsonRecord,
} from './filas.ts';
import {
  sentenciaEfectos, sentenciaEfectosClase, sentenciaEfectosFaq, type Efecto,
} from '../operativa/outbox.ts';
import { publicarEfectos, type ProductorCola } from '../operativa/colas.ts';
import { respuestaDemo } from './demo.ts';

/**
 * API de formularios: el sobre, la autenticación y los códigos de estado son los
 * del handler vigente (`app/api/formularios/route.ts`). Cambia la escritura: la
 * fila y sus efectos externos entran en un único batch D1 (una transacción) y
 * ningún efecto se ejecuta acá.
 */

const KINDS = ['consulta', 'faq', 'clase', 'precio'] as const;
type Kind = (typeof KINDS)[number];

/** Fallo de lectura o escritura de la base: 500, como el `result.error` vigente. */
class ErrorBaseDatos extends Error {}

export interface EntornoFormularios {
  /** Equivale a `Boolean(TURNSTILE_SECRET_KEY)`; la clave nunca entra acá. */
  captchaConfigurado: boolean;
  /** Equivale a `NEXT_PUBLIC_FORMULARIOS_PRUEBA_LOCAL`, sólo en desarrollo. */
  pruebaLocal: boolean;
  verificarCaptcha(token: string, ip: string): Promise<boolean>;
  /** Modo demo local: nunca puede estar activo en producción (lo decide el adaptador). */
  demo?: boolean;
  /** Cola de efectos. Sin binding la fila queda pendiente y la toma el barrido. */
  cola?: ProductorCola;
}

const respuesta = (cuerpo: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * IP de confianza del borde de Cloudflare. `cf-connecting-ip` la pone el borde y
 * no el cliente; por eso manda sobre `x-forwarded-for`, que sí es falsificable.
 */
export function ipDeCliente(request: Request): string {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

type Carrera = {
  id: number; nombre: string; nivel: string; activa: boolean; proximamente: boolean;
  duracion: string | null; nombre_corto: string | null;
};

/** Lectura y escritura de base con el 500 del handler vigente. */
async function conBase<T>(operacion: () => Promise<T>): Promise<T> {
  try {
    return await operacion();
  } catch (error) {
    if (error instanceof TypeError) throw error;
    console.error('[formularios] Error de base de datos', {
      code: error instanceof Error ? error.name : 'desconocido',
    });
    throw new ErrorBaseDatos('base de datos');
  }
}

async function leerCarrera(db: D1Database, id: number): Promise<Carrera | null> {
  const fila = await db.prepare(`SELECT id,nombre,nivel,activa,proximamente,duracion,nombre_corto
    FROM carreras WHERE id = ?1`).bind(id).first<{
      id: number; nombre: string; nivel: string; activa: number; proximamente: number;
      duracion: string | null; nombre_corto: string | null;
    }>();
  return fila ? { ...fila, activa: fila.activa === 1, proximamente: fila.proximamente === 1 } : null;
}

/**
 * El precio de la carrera. Igual que el handler vigente, una lectura fallida se
 * trata como «sin precio» y nunca tumba el alta, que ya está decidida.
 */
/**
 * El precio de la carrera. Igual que el handler vigente, una lectura fallida se
 * trata como «sin precio» y nunca tumba el alta, que ya está decidida.
 */
async function leerPrecio(db: D1Database, carreraId: number): Promise<ResultadoPrecio> {
  try {
    const fila = await leerPrecioPrivado(db, carreraId);
    return resultadoPrecio(fila ? fila as unknown as FilaPrecio : null, diaArgentino(await leerRelojBase(db)));
  } catch {
    console.error('[formularios] No se pudo leer el precio');
    return { estado: 'sin-precio' };
  }
}

/** Las lecturas previas nunca tumban el alta: si fallan, se responde sólo el ok. */
async function intentarLectura<T>(lectura: () => Promise<T>): Promise<T | null> {
  try {
    return await lectura();
  } catch {
    console.error('[formularios] Lectura previa fallida');
    return null;
  }
}

/** Los ids que devolvió un INSERT del outbox con `RETURNING id`. */
function idsDeEfectos(resultado: D1Result | undefined): number[] {
  return (resultado?.results ?? [])
    .map(fila => Number((fila as { id?: unknown }).id))
    .filter(id => Number.isSafeInteger(id) && id > 0);
}

/** La fila y sus efectos, en un batch: o quedan todos o no queda ninguno. */
async function guardarConEfectos(db: D1Database, fila: FilaConsulta, efectos: Efecto[]) {
  const sentencias = [sentenciaInsertConsulta(db, fila, false)];
  const outbox = sentenciaEfectos(db, efectos);
  if (outbox) sentencias.push(outbox);
  // Marca de agua previa: si el lote no devuelve los `id` del outbox, sirve para
  // encontrar exactamente las filas que creó este pedido.
  let marca: number | null = null;
  try {
    const previo = await db.prepare('SELECT COALESCE(MAX(id), 0) AS m FROM outbox').first<{ m: number }>();
    marca = Number(previo?.m ?? 0);
  } catch {
    marca = null;
  }
  // El `RETURNING id` del outbox permite publicar sólo estas referencias en la
  // cola; si el envío falla, las filas siguen pendientes para el barrido.
  const resultados = await conBase(() => db.batch(sentencias));
  const directos = idsDeEfectos(resultados[1]);
  if (directos.length > 0 || marca === null) return directos;
  // Sin identificadores del lote, se leen los pendientes posteriores a la marca.
  // Publicar un efecto ajeno de más no duplica nada: el consumidor reclama y
  // respeta el estado de cada fila.
  try {
    const nuevos = await db
      .prepare("SELECT id FROM outbox WHERE id > ?1 AND estado = 'pendiente' ORDER BY id")
      .bind(marca)
      .all<{ id: number }>();
    return (nuevos.results ?? [])
      .map(filaNueva => Number(filaNueva.id))
      .filter(id => Number.isSafeInteger(id) && id > 0);
  } catch {
    return [];
  }
}

const efectoNewsletter = (payload: JsonRecord, campo: 'email' | 'contacto'): Efecto[] =>
  mailParaNewsletter(payload, campo)
    ? [{ tipo: 'newsletter-alta', detalle: { carreraId: carreraIdDe(payload) } }]
    : [];

/** `kind: 'consulta'`: el alta tolerante de siempre. */
async function registrarConsulta(db: D1Database, payload: JsonRecord, entorno: EntornoFormularios) {
  const fila = filaConsulta(payload);
  const carreraId = carreraIdDe(payload);
  const conPrecio = payload.tipoFormulario === 'preinscripcion' && !!carreraId
    && CASAS_CON_PRECIO.includes(payload.casa as never);

  let carrera: Carrera | null = null;
  let precio: ResultadoPrecio | null = null;
  if (conPrecio) {
    const leida = await intentarLectura(() => leerCarrera(db, carreraId!));
    // La casa se verifica contra el nivel de la base, no contra lo que mandó el navegador.
    if (leida && carreraConPrecio(leida) && casaDeCarrera(leida) === payload.casa) {
      carrera = leida;
      precio = await intentarLectura(() => leerPrecio(db, carreraId!));
    }
  }

  const efectos: Efecto[] = [{ tipo: 'aviso-lead' }, ...efectoNewsletter(payload, 'email')];
  const email = text(payload.email, 254);
  if (precio?.estado === 'vigente' && carrera && EMAIL.test(email)) {
    efectos.push({ tipo: 'mail-precio', detalle: { carreraId: carrera.id, limitar: false } });
  }
  const encolados = await guardarConEfectos(db, fila, efectos);
  return { resultado: precio, efectos: encolados };
}

/** `kind: 'precio'`: el mail es obligatorio y la carrera tiene que publicar precio. */
async function registrarPrecio(db: D1Database, payload: JsonRecord) {
  const datos = validarPayloadPrecio(payload);
  if (!datos) throw new TypeError('Datos inválidos');

  const carrera = await conBase(() => leerCarrera(db, datos.carreraId));
  if (!carrera || !carreraConPrecio(carrera)) throw new TypeError('Carrera inválida');

  const fila: FilaConsulta = {
    carrera: carrera.nombre,
    tipo: TIPO_PRECIO,
    casa: casaDeCarrera(carrera),
    tipo_formulario: FORMULARIO_PRECIO,
  };
  for (const campo of CAMPOS_PRECIO) fila[columnaDe(campo)] = datos.email;
  // Los booleanos van siempre: omitir uno NOT NULL rompe el INSERT entero.
  completarBooleanos(fila, CAMPOS_PRECIO);

  const resultado = await leerPrecio(db, carrera.id);
  const efectos: Efecto[] = [{ tipo: 'aviso-lead' }];
  if (datos.newsletter) efectos.push({ tipo: 'newsletter-alta' });
  if (resultado.estado === 'vigente') {
    efectos.push({ tipo: 'mail-precio', detalle: { carreraId: carrera.id, limitar: true } });
  }
  const encolados = await guardarConEfectos(db, fila, efectos);
  return { resultado, efectos: encolados };
}

/** `kind: 'faq'`: la pregunta y sus efectos, en un batch. */
async function registrarFaq(db: D1Database, payload: JsonRecord) {
  const fila = filaFaq(payload);
  const efectos: Efecto[] = [{ tipo: 'aviso-lead' }, ...efectoNewsletter(payload, 'contacto')];
  const sentencias = [sentenciaInsertFaq(db, fila)];
  const outbox = sentenciaEfectosFaq(db, efectos);
  if (outbox) sentencias.push(outbox);
  const resultados = await conBase(() => db.batch(sentencias));
  return { resultado: null, efectos: idsDeEfectos(resultados[1]) };
}

/**
 * `kind: 'clase'`: una fila por materia y hora pedidas, con el id que después
 * usa la baja del aviso. El formulario pide teléfono, no mail: no hay newsletter.
 */
async function registrarClase(db: D1Database, payload: JsonRecord) {
  const filas = filasClase(payload);
  const ids = filas.map(() => crypto.randomUUID());
  const sentencias = [sentenciaInsertClases(db, filas, ids)];
  const outbox = sentenciaEfectosClase(db, ids, [{ tipo: 'aviso-lead' }]);
  if (outbox) sentencias.push(outbox);
  const resultados = await conBase(() => db.batch(sentencias));
  return { resultado: null, efectos: idsDeEfectos(resultados[1]) };
}

export async function manejarFormulario(
  request: Request, db: D1Database | null, entorno: EntornoFormularios,
): Promise<Response> {
  try {
    let cuerpo: unknown;
    try {
      cuerpo = await request.json();
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      return respuesta({ error: 'Solicitud inválida' }, 400);
    }
    if (!esRegistro(cuerpo)) return respuesta({ error: 'Solicitud inválida' }, 400);

    const kind = text(cuerpo.kind, 20) as Kind;
    const token = text(cuerpo.token, 4096);
    const payload = cuerpo.payload;
    if (!KINDS.includes(kind) || !token || !esRegistro(payload)) {
      return respuesta({ error: 'Solicitud inválida' }, 400);
    }

    // Modo demo: antes del captcha, de la cuota y de la base, y nunca fuera de local.
    if (entorno.demo) {
      const demo = respuestaDemo(kind, payload);
      console.info(`[formularios] Envío de demo (${kind}): no se guardó ni se avisó nada`);
      return respuesta(demo, 201);
    }

    if (!db) return respuesta({ error: 'Servicio temporalmente no disponible' }, 503);

    if (!entorno.captchaConfigurado && !entorno.pruebaLocal) {
      return respuesta({ error: 'Servicio temporalmente no disponible' }, 503);
    }
    const ip = ipDeCliente(request);

    // Captcha y cuota en paralelo; el intento concedido persiste aunque el captcha falle.
    const { captchaOk, permitido } = await comprobarEntradaFormulario(db, kind, ip, () =>
      entorno.captchaConfigurado
        ? entorno.verificarCaptcha(token, ip)
        : Promise.resolve(token === 'rate-limit-only'));
    if (!captchaOk) return respuesta({ error: 'CAPTCHA inválido' }, 403);
    if (!permitido) return respuesta({ error: 'Demasiadas solicitudes' }, 429);

    const resultado = kind === 'consulta'
      ? await registrarConsulta(db, payload, entorno)
      : kind === 'faq'
        ? await registrarFaq(db, payload)
        : kind === 'clase'
          ? await registrarClase(db, payload)
          : await registrarPrecio(db, payload);

    // El alta ya está confirmada en D1. Publicar es best-effort: si la cola
    // falla, la fila queda `pendiente` y la recupera el barrido.
    await publicarEfectos(entorno.cola, resultado.efectos);
    return respuesta({ ok: true, ...(resultado.resultado ?? {}) }, 201);
  } catch (error) {
    if (error instanceof TypeError) return respuesta({ error: error.message }, 400);
    if (error instanceof ErrorBaseDatos) return respuesta({ error: 'No se pudo guardar la solicitud' }, 500);
    console.error('[formularios] Error interno', { code: error instanceof Error ? error.name : 'desconocido' });
    return respuesta({ error: 'Servicio temporalmente no disponible' }, 503);
  }
}
