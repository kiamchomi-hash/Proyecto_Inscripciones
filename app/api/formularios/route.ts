import { createHash } from 'node:crypto';
import { NextRequest, NextResponse, after } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyTurnstile } from '@/lib/turnstile';
import {
  CAMPOS, CASAS, CAMPOS_PRECIO, CONFLICTO_NEWSLETTER, EMAIL_VALIDO,
  FORMULARIO_PRECIO, TABLA_NEWSLETTER, TABLA_PRECIOS, TELEFONO_VALIDO,
  TIPO_PRECIO,
  camposDe, carreraConPrecio, carreraIdDe, casaDeCarrera, columnaDe,
  fechaArgentina, filaNewsletter, mailParaNewsletter, resultadoPrecio, validarPayloadPrecio,
  CASAS_CON_PRECIO,
  type CampoId, type CasaId, type FilaPrecio, type Modo, type ResultadoPrecio,
} from '@/components/formularios/casas';
import type { CarreraDelMail } from '@/components/formularios/mail-precio';
import type { TablesInsert } from '@/lib/database.types';

type JsonRecord = Record<string, unknown>;

const esRegistro = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const nullableText = (value: unknown, max: number) => text(value, max) || null;
const EMAIL = EMAIL_VALIDO;
const PHONE = TELEFONO_VALIDO;
const SLOT = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/;

// El DNI y las opciones son tolerantes: si vienen mal formados se guardan en
// null y la consulta entra igual. Rechazar el pedido entero por un DNI con un
// dígito de menos sería perder el lead por un campo que ni siquiera pedimos.
const unaOpcionDe = (value: unknown, opciones: readonly string[]) => {
  const elegida = text(value, 40);
  return opciones.includes(elegida) ? elegida : null;
};

const soloDni = (value: unknown) => {
  const digitos = text(value, 20).replace(/\D/g, '');
  return digitos.length >= 7 && digitos.length <= 9 ? digitos : null;
};

function clientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
}

async function checkRateLimit(kind: string, ip: string) {
  const supabase = createSupabaseAdmin();
  const digest = createHash('sha256').update(ip).digest('hex');
  const { data, error } = await supabase.rpc('check_form_rate_limit', {
    p_key: `${kind}:${digest}`,
    p_max_requests: 5,
    p_window_seconds: 600,
  });
  if (error) throw error;
  return data === true;
}

const MODOS: Modo[] = ['contacto', 'preinscripcion'];

const esCasa = (value: unknown): value is CasaId =>
  typeof value === 'string' && Object.hasOwn(CASAS, value);

const esModo = (value: unknown): value is Modo =>
  MODOS.includes(value as Modo);

/**
 * Qué campos se aceptan para este envío. Con casa y modo conocidos, los que esa
 * casa declara. Sin ellos —un cliente viejo que todavía manda el sobre plano—,
 * la unión de todo lo declarado: se sigue escribiendo sólo en columnas que
 * existen, que es lo que importa.
 */
function camposAceptados(casa: CasaId | null, modo: Modo | null): CampoId[] {
  if (casa && modo) return camposDe(casa, modo);
  const todos = (Object.keys(CASAS) as CasaId[])
    .flatMap(id => [...CASAS[id].contacto, ...CASAS[id].preinscripcion]);
  return [...new Set(todos)];
}

async function insertConsulta(payload: JsonRecord) {
  return createSupabaseAdmin().from('consultas').insert(filaConsulta(payload));
}

/**
 * La fila de la consulta, validada. Un contacto inválido lanza `TypeError`
 * (400). La usa también el modo demo, que valida igual y no escribe.
 */
function filaConsulta(payload: JsonRecord): TablesInsert<'consultas'> {
  const email = text(payload.email, 254);
  const telefono = text(payload.telefono, 30);
  if ((!email && !telefono) || (email && !EMAIL.test(email)) || (telefono && !PHONE.test(telefono))) {
    throw new TypeError('Datos de contacto inválidos');
  }

  // Un discriminador mal formado no rebota el envío: se guarda en null y la
  // consulta entra igual. Perder un lead por no saber de qué casa vino sería
  // peor que no saberlo.
  const casa = esCasa(payload.casa) ? payload.casa : null;
  const modo = esModo(payload.tipoFormulario) ? payload.tipoFormulario : null;

  // La fila se arma desde la declaración de casas.ts: acá no hay ni un nombre
  // de columna escrito a mano. Es la regla que faltaba el 23/08, cuando el
  // INSERT apuntó a nueve columnas inexistentes y tumbó todos los formularios.
  const fila: TablesInsert<'consultas'> = {
    carrera: nullableText(payload.carrera, 160),
    tipo: nullableText(payload.tipo, 80),
    casa,
    tipo_formulario: modo,
  };
  const aceptados = camposAceptados(casa, modo);
  for (const campo of aceptados) {
    asignarCampo(fila, campo, payload);
  }

  completarBooleanos(fila, aceptados);
  return fila;
}

/** Mantiene unidos control, columna y conversión antes de escribir en la fila. */
function asignarCampo(fila: TablesInsert<'consultas'>, campo: CampoId, payload: JsonRecord) {
  const definicion = CAMPOS[campo];
  if (definicion.tipo === 'checkbox') {
    fila[columnaDe(definicion)] = payload[campo] === true;
  } else {
    fila[columnaDe(definicion)] = definicion.opciones
      ? unaOpcionDe(payload[campo], definicion.opciones)
      : campo === 'dni' ? soloDni(payload[campo]) : nullableText(payload[campo], definicion.max);
  }
}

/**
 * Los booleanos van siempre, valgan o no para este formulario: si la columna es
 * NOT NULL, omitirla rompe el INSERT entero. Un `false` es además lo que
 * corresponde — Teclab no acredita equivalencias, así que no las pidió.
 */
function completarBooleanos(fila: TablesInsert<'consultas'>, aceptados: readonly CampoId[]) {
  for (const campo of Object.keys(CAMPOS) as CampoId[]) {
    const definicion = CAMPOS[campo];
    if (definicion.tipo === 'checkbox' && !aceptados.includes(campo)) {
      fila[columnaDe(definicion)] = false;
    }
  }
}

async function insertFaq(payload: JsonRecord) {
  return createSupabaseAdmin().from('faq_preguntas').insert(filaFaq(payload));
}

/** La pregunta validada; inválida lanza `TypeError`. La usa también el modo demo. */
function filaFaq(payload: JsonRecord): TablesInsert<'faq_preguntas'> {
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

async function insertClase(payload: JsonRecord) {
  return createSupabaseAdmin().from('solicitudes_clase').insert(filasClase(payload));
}

/** Las filas de la solicitud, validadas; inválidas lanzan `TypeError`. La usa también el modo demo. */
function filasClase(payload: JsonRecord): TablesInsert<'solicitudes_clase'>[] {
  if (!Array.isArray(payload.rows) || payload.rows.length < 1 || payload.rows.length > 7) {
    throw new TypeError('Solicitud inválida');
  }

  return payload.rows.map((raw) => {
    if (!esRegistro(raw)) throw new TypeError('Solicitud inválida');
    const row = raw;
    const materiaId = text(row.materia_id, 36);
    const telefono = text(row.telefono, 30);
    const dias = Array.isArray(row.dias)
      ? row.dias.map((day) => text(day, 30)).filter(Boolean).slice(0, 7)
      : [];
    const horarios = Array.isArray(row.horarios)
      ? row.horarios.map((slot) => text(slot, 20)).filter((slot) => SLOT.test(slot)).slice(0, 14)
      : [];

    if (!/^[0-9a-f-]{36}$/i.test(materiaId) || !PHONE.test(telefono) || !dias.length || !horarios.length) {
      throw new TypeError('Solicitud inválida');
    }

    return {
      materia_id: materiaId,
      dias,
      horarios,
      nombre: nullableText(row.nombre, 100),
      telefono,
      bloqueo_semanal: row.bloqueo_semanal === true,
    };
  });
}

type ClienteAdmin = ReturnType<typeof createSupabaseAdmin>;

/**
 * Upsert en el newsletter. Nunca tumba el envío: el lead ya está guardado
 * cuando se llega acá, así que un fallo se registra y se sigue.
 */
async function suscribirNewsletter(supabase: ClienteAdmin, fila: ReturnType<typeof filaNewsletter>) {
  try {
    const { error } = await supabase.from(TABLA_NEWSLETTER).upsert(fila, { onConflict: CONFLICTO_NEWSLETTER });
    if (error) console.error('[formularios] No se pudo guardar la suscripción', { code: error.code });
  } catch (error) {
    console.error('[formularios] No se pudo guardar la suscripción', error);
  }
}

/**
 * El checkbox de novedades de la consulta y de la FAQ. Corre recién con el
 * lead guardado. La carrera se busca en la base por `carreraId`: el nombre que
 * manda el navegador es texto libre. Si no hay carrera, no existe o falla la
 * lectura, la suscripción entra igual, como general.
 */
async function suscribirDesdeFormulario(kind: string, payload: JsonRecord) {
  const email = mailParaNewsletter(payload, kind === 'faq' ? 'contacto' : 'email');
  if (!email) return;
  try {
    const supabase = createSupabaseAdmin();
    const carreraId = kind === 'consulta' ? carreraIdDe(payload) : null;
    let carrera: { id: number; nombre: string } | null = null;
    if (carreraId) {
      const { data, error } = await supabase
        .from('carreras')
        .select('id, nombre')
        .eq('id', carreraId)
        .maybeSingle();
      if (error) console.error('[formularios] No se pudo leer la carrera del newsletter', { code: error.code });
      carrera = error ? null : data;
    }
    await suscribirNewsletter(supabase, filaNewsletter(email, carrera, new Date()));
  } catch (error) {
    console.error('[formularios] No se pudo guardar la suscripción', error);
  }
}

/**
 * La carrera, si su casa publica precio. La casa se valida contra el `nivel`
 * de la base, no contra lo que diga el navegador: publican Teclab y
 * Siglo 21. `carrera: null` es una carrera inexistente, inactiva,
 * anunciada (`proximamente`) o de otra casa. Trae además lo que usa el mail
 * del precio: prefijo, nombre corto y duración.
 */
async function buscarCarreraConPrecio(supabase: ClienteAdmin, carreraId: number) {
  const { data, error } = await supabase
    .from('carreras')
    .select('id, nombre, nivel, activa, proximamente, prefix, nombre_corto, duracion')
    .eq('id', carreraId)
    .maybeSingle();
  if (error) return { carrera: null, error };
  return { carrera: data && carreraConPrecio(data) ? data : null, error: null };
}

/**
 * El precio que acompaña a la preinscripción de Teclab y de Siglo 21, para
 * mostrarlo como un paso del formulario (en Teclab, después de confirmar el
 * envío, con «Ver precio»).
 * Corre con el lead ya guardado, así que nunca lo tumba: si la carrera no se
 * puede verificar, la respuesta es sólo el ok. La casa del payload tiene que
 * coincidir con la de la base. El resto de las consultas no lee precios, y
 * tampoco la preinscripción de una anunciada (`proximamente`):
 * `buscarCarreraConPrecio` la descarta, así que no hay precio ni mail, sólo la
 * fila y el aviso de Telegram.
 */
async function precioDePreinscripcion(payload: JsonRecord) {
  const carreraId = carreraIdDe(payload);
  if (payload.tipoFormulario !== 'preinscripcion' || !carreraId) return null;
  if (!CASAS_CON_PRECIO.includes(payload.casa as CasaId)) return null;
  try {
    const supabase = createSupabaseAdmin();
    const { carrera, error } = await buscarCarreraConPrecio(supabase, carreraId);
    if (error) console.error('[formularios] No se pudo verificar la carrera del precio', { code: error.code });
    if (!carrera || casaDeCarrera(carrera) !== payload.casa) return null;
    const resultado = await leerPrecio(supabase, carrera.id);
    // El mail es opcional en la preinscripción (alcanza con el teléfono):
    // sin uno válido no hay a quién mandarle el resumen.
    const email = text(payload.email, 254);
    if (EMAIL.test(email)) enviarMailPrecio(email, carrera, resultado);
    return resultado;
  } catch (error) {
    console.error('[formularios] No se pudo leer el precio de la preinscripción', error);
    return null;
  }
}

/**
 * El helper del modo demo se importa sólo con la bandera puesta: los tests de
 * los otros envíos cargan el endpoint sin él. Si la bandera vale o no (sólo en
 * desarrollo) lo decide el helper, no este atajo.
 */
const modDemo = () =>
  process.env.NEXT_PUBLIC_FORMULARIOS_DEMO === '1' ? import('@/lib/formularios-demo') : null;

/**
 * «Ver precio»: registra el lead y devuelve el precio si está vigente.
 *
 * El orden importa. El lead entra primero en `consultas` (y dispara el aviso de
 * Telegram por el trigger que ya existe); si eso falla, no hay precio. Después
 * van la suscripción y la lectura del precio, que no pueden tumbar un lead ya
 * guardado: si fallan, se registra el error y se sigue.
 */
async function registrarPrecio(payload: JsonRecord) {
  const datos = validarPayloadPrecio(payload);
  if (!datos) throw new TypeError('Datos inválidos');

  const supabase = createSupabaseAdmin();
  const { carrera, error: errorCarrera } = await buscarCarreraConPrecio(supabase, datos.carreraId);
  if (errorCarrera) return { error: errorCarrera };
  if (!carrera) throw new TypeError('Carrera inválida');

  // Las columnas salen de casas.ts, igual que en la consulta. Hoy es sólo el
  // mail: `nombre` no viaja y queda en null.
  const fila: TablesInsert<'consultas'> = {
    carrera: carrera.nombre,
    tipo: TIPO_PRECIO,
    casa: casaDeCarrera(carrera),
    tipo_formulario: FORMULARIO_PRECIO,
  };
  for (const campo of CAMPOS_PRECIO) {
    fila[columnaDe(campo)] = datos[campo];
  }
  completarBooleanos(fila, CAMPOS_PRECIO);

  const lead = await supabase.from('consultas').insert(fila);
  if (lead.error) return { error: lead.error };

  if (datos.newsletter) {
    // Repetir la suscripción no es un error: la renueva.
    await suscribirNewsletter(supabase, filaNewsletter(datos.email.toLowerCase(), carrera, new Date()));
  }

  const resultado = await leerPrecio(supabase, carrera.id);
  enviarMailPrecio(datos.email, carrera, resultado, true);
  return { error: null, resultado };
}

/**
 * El mail con el resumen del precio, por la API de SMTP2GO. Sólo con precio
 * vigente: vencido o sin precio no hay nada que resumir. Corre con `after()`,
 * con la respuesta ya enviada, y nunca la cambia ni tumba el lead, que ya está
 * guardado. Sin `SMTP2GO_API_KEY` no manda. Los registros llevan sólo el
 * estado o el código de error: ni el mail de la persona ni la clave.
 *
 * El armado y el envío (`mandarPorSmtp2go`, el mismo que usa el newsletter)
 * se importan recién adentro de la tarea: sólo los necesita este camino, y los
 * tests de los otros envíos cargan el endpoint sin ellos.
 */
/**
 * El resumen ya le dio el precio: si además se suscribió a esta carrera, cuenta
 * como envío del newsletter y el cron no lo repite hasta dentro de 7 días. Sin
 * suscripción no toca nada. Un fallo sólo se registra: lo peor es un mail de
 * más al día siguiente.
 */
async function marcarEnvioNewsletter(email: string, carreraId: number) {
  try {
    const { error } = await createSupabaseAdmin()
      .from(TABLA_NEWSLETTER)
      .update({ ultimo_envio_at: new Date().toISOString() })
      .eq('email', email.toLowerCase())
      .eq('carrera_id', carreraId);
    if (error) console.error('[formularios] No se pudo marcar el envío del newsletter', { code: error.code });
  } catch (error) {
    console.error('[formularios] No se pudo marcar el envío del newsletter', {
      code: error instanceof Error ? error.name : 'desconocido',
    });
  }
}

/** Reserva persistente antes de SMTP: ante incertidumbre se prioriza no duplicar. */
async function reservarMailPrecio(email: string, carreraId: number): Promise<boolean> {
  const { data, error } = await createSupabaseAdmin().rpc('reservar_mail_precio', {
    p_email: email.trim().toLowerCase(),
    p_carrera_id: carreraId,
  });
  if (error) {
    console.error('[formularios] Mail del precio omitido: falló la reserva', { code: error.code });
    return false;
  }
  return data === true;
}

function enviarMailPrecio(email: string, carrera: CarreraDelMail & { id: number }, resultado: ResultadoPrecio, limitar = false) {
  if (resultado.estado !== 'vigente') return;
  const clave = process.env.SMTP2GO_API_KEY;
  if (!clave) {
    console.warn('[formularios] Mail del precio omitido: falta SMTP2GO_API_KEY');
    return;
  }
  const { precio } = resultado;
  try {
    after(async () => {
      try {
        // Sólo «Ver precio»: preinscripción y newsletter mantienen su política.
        if (limitar && !await reservarMailPrecio(email, carrera.id)) return;
        const { armarMailPrecio, mandarPorSmtp2go } = await import('@/components/formularios/mail-precio');
        const mail = armarMailPrecio({ carrera, precio, hoy: new Date() });
        const envio = await mandarPorSmtp2go({ clave, para: email, mail });
        if (envio.enviado) {
          await marcarEnvioNewsletter(email, carrera.id);
          return;
        }
        if (envio.status === null) {
          console.error('[formularios] No se pudo mandar el mail del precio por SMTP2GO', { code: envio.codigo });
        } else {
          console.error('[formularios] SMTP2GO rechazó el mail del precio', {
            status: envio.status,
            error_code: envio.codigo,
          });
        }
      } catch (error) {
        console.error('[formularios] No se pudo mandar el mail del precio por SMTP2GO', {
          code: error instanceof Error ? error.name : 'desconocido',
        });
      }
    });
  } catch (error) {
    console.error('[formularios] No se pudo programar el mail del precio', {
      code: error instanceof Error ? error.name : 'desconocido',
    });
  }
}

/**
 * El precio de la carrera, de la tabla privada, con su vigencia resuelta. Si
 * la lectura falla se trata como sin precio: quien la llama ya guardó el lead.
 */
async function leerPrecio(supabase: ClienteAdmin, carreraId: number) {
  const precio = await supabase
    .from(TABLA_PRECIOS)
    .select('conceptos, total, nota, vigente_hasta')
    .eq('carrera_id', carreraId)
    .maybeSingle();
  if (precio.error) {
    console.error('[formularios] No se pudo leer el precio', { code: precio.error.code });
  }
  const filaPrecio = precio.error ? null : (precio.data as FilaPrecio | null);
  return resultadoPrecio(filaPrecio, fechaArgentina(new Date()));
}

type PrecioDemo = Extract<ResultadoPrecio, { estado: 'vigente' }>;

/**
 * El precio del modo demo: ficticio, fijo y rotulado como de demo, para que
 * nadie lo confunda con uno real. No lee `precios_privados`. Lleva un
 * bimestre para que se vea la misma aclaración de cobertura que en Teclab, y
 * vence dentro de 30 días para que siempre esté vigente.
 */
function precioDemo(): PrecioDemo {
  const vence = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return {
    estado: 'vigente',
    precio: {
      conceptos: [
        { concepto: 'Matrícula (demo)', monto: '$ 10.000,00', descuento: 50 },
        { concepto: 'Primer bimestre (demo)', monto: '$ 20.000,00', descuento: 20 },
      ],
      total: '$ 30.000,00',
      nota: 'Precio de demostración: no es un precio real.',
      vigenteHasta: fechaArgentina(vence),
    },
  };
}

/**
 * Modo demo (sólo desarrollo, ver `lib/formularios-demo.ts`): valida el
 * payload con los mismos validadores que el envío real, así un payload
 * inválido sigue dando 400, y responde con la misma forma, sin tocar la base,
 * la cuota, Turnstile, SMTP2GO, HubSpot ni los efectos externos. La casa se toma de lo que
 * manda el navegador: en real se verifica contra la base, que acá no se lee.
 */
function respuestaDemo(kind: string, payload: JsonRecord): JsonRecord {
  switch (kind) {
    case 'consulta': {
      filaConsulta(payload);
      // Como en real: precio en la preinscripción de Teclab y Siglo 21.
      if (!CASAS_CON_PRECIO.includes(payload.casa as CasaId) || payload.tipoFormulario !== 'preinscripcion' || !carreraIdDe(payload)) {
        return { ok: true };
      }
      return { ok: true, ...precioDemo() };
    }
    case 'faq':
      filaFaq(payload);
      return { ok: true };
    case 'clase':
      filasClase(payload);
      return { ok: true };
    default:
      if (!validarPayloadPrecio(payload)) throw new TypeError('Datos inválidos');
      return { ok: true, ...precioDemo() };
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
    }
    if (!esRegistro(body)) {
      return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
    }
    const kind = text(body.kind, 20);
    const token = text(body.token, 4096);
    const payload = body.payload;
    const ip = clientIp(request);

    if (!['consulta', 'faq', 'clase', 'precio'].includes(kind) || !token || !esRegistro(payload)) {
      return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
    }

    // Modo demo: antes del captcha y de la cuota, y nunca fuera de desarrollo.
    // Un payload inválido lanza `TypeError` y sale por el 400 de abajo.
    const demo = await modDemo();
    if (demo?.formulariosDemoActivo()) {
      const respuesta = respuestaDemo(kind, payload);
      console.info(`[formularios] Envío de demo (${kind}): no se guardó ni se avisó nada`);
      return NextResponse.json(respuesta, { status: 201 });
    }

    const captchaConfigured = Boolean(process.env.TURNSTILE_SECRET_KEY);
    const pruebaLocal = process.env.NODE_ENV === 'development' &&
      process.env.NEXT_PUBLIC_FORMULARIOS_PRUEBA_LOCAL === '1';
    if (!captchaConfigured && !pruebaLocal) {
      return NextResponse.json({ error: 'Servicio temporalmente no disponible' }, { status: 503 });
    }
    const [captchaOk, allowed] = await Promise.all([
      captchaConfigured
        ? verifyTurnstile(token, ip)
        : Promise.resolve(token === 'rate-limit-only'),
      checkRateLimit(kind, ip),
    ]);
    if (!captchaOk) return NextResponse.json({ error: 'CAPTCHA inválido' }, { status: 403 });
    if (!allowed) return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });

    const result = kind === 'consulta'
      ? await insertConsulta(payload)
      : kind === 'faq'
        ? await insertFaq(payload)
        : kind === 'clase'
          ? await insertClase(payload)
          : await registrarPrecio(payload);

    if (result.error) {
      console.error('[formularios] Error de base de datos', {
        kind,
        code: result.error.code,
      });
      return NextResponse.json({ error: 'No se pudo guardar la solicitud' }, { status: 500 });
    }

    // «Ver precio» ya suscribió adentro, con su carrera.
    if (kind === 'consulta' || kind === 'faq') await suscribirDesdeFormulario(kind, payload);

    // «Ver precio» y la preinscripción de Teclab y Siglo 21 devuelven además el
    // estado y el precio. El resto, sólo el ok.
    const resultado = 'resultado' in result && result.resultado
      ? result.resultado
      : kind === 'consulta' ? await precioDePreinscripcion(payload) : null;
    const extra = resultado ?? {};
    return NextResponse.json({ ok: true, ...extra }, { status: 201 });
  } catch (error) {
    if (error instanceof TypeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[formularios] Error interno', error);
    return NextResponse.json({ error: 'Servicio temporalmente no disponible' }, { status: 503 });
  }
}
