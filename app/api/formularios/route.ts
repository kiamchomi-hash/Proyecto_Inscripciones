import { createHash } from 'node:crypto';
import { NextRequest, NextResponse, after } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyTurnstile } from '@/lib/turnstile';
import {
  CAMPOS, CASAS, CAMPOS_PRECIO, CONFLICTO_NEWSLETTER, EMAIL_VALIDO,
  FORMULARIO_AUTOINSCRIPCION, FORMULARIO_PRECIO, TABLA_NEWSLETTER, TABLA_PRECIOS, TELEFONO_VALIDO,
  TIPO_AUTOINSCRIPCION, TIPO_PRECIO,
  camposDe, carreraConAutoinscripcion, carreraConPrecio, carreraIdDe, casaDeCarrera, columnaDe,
  fechaArgentina, filaNewsletter, mailParaNewsletter, resultadoPrecio, validarPayloadAutoinscripcion,
  validarPayloadPrecio,
  CASAS_CON_AUTOINSCRIPCION, TABLA_ENLACES, consultaConEnlace, estadoEnlace, payloadDesdeConsulta,
  validarPayloadEnlace, pedidoLeadSede, TABLA_ROBOT, despachoRobot,
  type CampoId, type CasaId, type FilaEnlace, type FilaPrecio, type Modo, type ResultadoPrecio,
} from '@/components/formularios/casas';
import type { CarreraDelMail } from '@/components/formularios/mail-precio';

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

/** El valor que va a la columna, según cómo esté declarado el campo. */
function valorDe(campo: CampoId, payload: JsonRecord) {
  const definicion = CAMPOS[campo];
  if (definicion.tipo === 'checkbox') return payload[campo] === true;
  if (definicion.opciones) return unaOpcionDe(payload[campo], definicion.opciones);
  if (campo === 'dni') return soloDni(payload[campo]);
  return nullableText(payload[campo], definicion.max);
}

async function insertConsulta(payload: JsonRecord) {
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
  const fila: JsonRecord = {
    carrera: nullableText(payload.carrera, 160),
    tipo: nullableText(payload.tipo, 80),
    casa,
    tipo_formulario: modo,
  };
  const aceptados = camposAceptados(casa, modo);
  for (const campo of aceptados) {
    fila[columnaDe(campo)] = valorDe(campo, payload);
  }

  completarBooleanos(fila, aceptados);

  return createSupabaseAdmin().from('consultas').insert(fila);
}

/**
 * Los booleanos van siempre, valgan o no para este formulario: si la columna es
 * NOT NULL, omitirla rompe el INSERT entero. Un `false` es además lo que
 * corresponde — Teclab no acredita equivalencias, así que no las pidió.
 */
function completarBooleanos(fila: JsonRecord, aceptados: readonly CampoId[]) {
  for (const campo of Object.keys(CAMPOS) as CampoId[]) {
    if (CAMPOS[campo].tipo === 'checkbox' && !aceptados.includes(campo)) {
      fila[columnaDe(campo)] = false;
    }
  }
}

async function insertFaq(payload: JsonRecord) {
  const titulo = text(payload.titulo, 120);
  const contacto = text(payload.contacto, 200);
  const modo = payload.modo === 'privada' ? 'privada' : 'publica';
  if (titulo.length < 5 || !contacto) throw new TypeError('Pregunta inválida');

  return createSupabaseAdmin().from('faq_preguntas').insert({
    titulo,
    descripcion: nullableText(payload.descripcion, 500),
    modo,
    contacto,
    nombre_contacto: modo === 'privada' ? nullableText(payload.nombre_contacto, 80) : null,
  });
}

async function insertClase(payload: JsonRecord) {
  if (!Array.isArray(payload.rows) || payload.rows.length < 1 || payload.rows.length > 7) {
    throw new TypeError('Solicitud inválida');
  }

  const rows = payload.rows.map((raw) => {
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

  return createSupabaseAdmin().from('solicitudes_clase').insert(rows);
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
 * de la base, no contra lo que diga el navegador: por ahora sólo Teclab
 * publica precio. `carrera: null` es una carrera inexistente, inactiva o de
 * otra casa. Trae además lo que usa el mail del precio: prefijo, nombre corto
 * y duración.
 */
async function buscarCarreraConPrecio(supabase: ClienteAdmin, carreraId: number) {
  const { data, error } = await supabase
    .from('carreras')
    .select('id, nombre, nivel, activa, prefix, nombre_corto, duracion')
    .eq('id', carreraId)
    .maybeSingle();
  if (error) return { carrera: null, error };
  return { carrera: data && carreraConPrecio(data) ? data : null, error: null };
}

/**
 * El precio que acompaña a la preinscripción de Teclab, para mostrarlo antes
 * de «Inscribirme». Corre con el lead ya guardado, así que nunca lo tumba: si
 * la carrera no se puede verificar, la respuesta es sólo el ok. El resto de las
 * consultas no lee precios.
 */
async function precioDePreinscripcion(payload: JsonRecord) {
  const carreraId = carreraIdDe(payload);
  if (payload.casa !== 'teclab' || payload.tipoFormulario !== 'preinscripcion' || !carreraId) return null;
  try {
    const supabase = createSupabaseAdmin();
    const { carrera, error } = await buscarCarreraConPrecio(supabase, carreraId);
    if (error) console.error('[formularios] No se pudo verificar la carrera del precio', { code: error.code });
    if (!carrera) return null;
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
  const fila: JsonRecord = {
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
  enviarMailPrecio(datos.email, carrera, resultado);
  return { error: null, resultado };
}

const SMTP2GO_URL = 'https://api.smtp2go.com/v3/email/send';
const REMITENTE_MAIL = 'CAU Villa Lugano <inscripciones@siglo21sur.com>';
const TIMEOUT_MAIL_MS = 8000;

/** El `error_code` de una respuesta de SMTP2GO, si lo trae. Nunca el mensaje. */
function codigoSmtp2go(cuerpo: unknown) {
  const data = esRegistro(cuerpo) && esRegistro(cuerpo.data) ? cuerpo.data : null;
  return typeof data?.error_code === 'string' ? data.error_code : undefined;
}

/**
 * El mail con el resumen del precio, por la API de SMTP2GO. Sólo con precio
 * vigente: vencido o sin precio no hay nada que resumir. Corre con `after()`,
 * con la respuesta ya enviada, y nunca la cambia ni tumba el lead, que ya está
 * guardado. Sin `SMTP2GO_API_KEY` no manda. Los registros llevan sólo el
 * estado o el código de error: ni el mail de la persona ni la clave.
 *
 * El armado se importa recién adentro de la tarea: sólo lo necesita este
 * camino, y los tests de los otros envíos cargan el endpoint sin él.
 */
function enviarMailPrecio(email: string, carrera: CarreraDelMail, resultado: ResultadoPrecio) {
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
        const { armarMailPrecio } = await import('@/components/formularios/mail-precio');
        const mail = armarMailPrecio({ carrera, precio, hoy: new Date() });
        const respuesta = await fetch(SMTP2GO_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Smtp2go-Api-Key': clave },
          body: JSON.stringify({
            sender: REMITENTE_MAIL,
            to: [email],
            subject: mail.asunto,
            html_body: mail.html,
            text_body: mail.texto,
          }),
          signal: AbortSignal.timeout(TIMEOUT_MAIL_MS),
        });
        const cuerpo: unknown = await respuesta.json().catch(() => null);
        const fallidos = esRegistro(cuerpo) && esRegistro(cuerpo.data) ? cuerpo.data.failed : undefined;
        if (!respuesta.ok || (typeof fallidos === 'number' && fallidos > 0)) {
          console.error('[formularios] SMTP2GO rechazó el mail del precio', {
            status: respuesta.status,
            error_code: codigoSmtp2go(cuerpo),
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

/**
 * Autoinscripción de Teclab: la preinscripción completa. El medio de pago no
 * viaja: lo elige la persona en el portal del alumno.
 *
 * Entra en `consultas` como una fila más (el aviso de Telegram sale por el
 * trigger de siempre), marcada con `tipo_formulario: 'autoinscripcion'`. La
 * casa se valida contra el `nivel` de la base, no contra lo que diga el
 * navegador, y el legajo se arma con la misma declaración que la
 * preinscripción: acá tampoco hay nombres de columna escritos a mano.
 */
async function registrarAutoinscripcion(payload: JsonRecord) {
  const datos = validarPayloadAutoinscripcion(payload);
  if (!datos) throw new TypeError('Datos inválidos');

  const supabase = createSupabaseAdmin();
  const { data: carrera, error: errorCarrera } = await supabase
    .from('carreras')
    .select('id, nombre, nivel')
    .eq('id', datos.carreraId)
    .maybeSingle();
  if (errorCarrera) return { error: errorCarrera };
  if (!carrera || !carreraConAutoinscripcion(carrera)) throw new TypeError('Carrera inválida');

  return insertarAutoinscripcion(supabase, carrera, datos, payload);
}

type CarreraAutoinscripcion = { id: number; nombre: string; nivel: string };

/**
 * El armado y la escritura de la autoinscripción, compartidos por el
 * formulario (`kind: 'autoinscripcion'`) y el enlace (`kind: 'enlace'`). El
 * legajo sale del payload con la declaración de `casas.ts`: acá no hay nombres
 * de columna escritos a mano.
 */
async function insertarAutoinscripcion(
  supabase: ClienteAdmin,
  carrera: CarreraAutoinscripcion,
  datos: { email: string; newsletter: boolean },
  payload: JsonRecord,
) {
  const casa = casaDeCarrera(carrera) as CasaId;
  const fila: JsonRecord = {
    carrera: carrera.nombre,
    tipo: TIPO_AUTOINSCRIPCION,
    casa,
    tipo_formulario: FORMULARIO_AUTOINSCRIPCION,
  };
  const campos = camposDe(casa, 'preinscripcion');
  for (const campo of campos) {
    fila[columnaDe(campo)] = valorDe(campo, payload);
  }
  completarBooleanos(fila, campos);

  // El id vuelve para la cola del robot.
  const lead = await supabase.from('consultas').insert(fila).select('id').single();
  if (lead.error) return { error: lead.error };

  // Pasan por acá las dos entradas, el formulario y el enlace de inscripción:
  // las dos dan de alta el lead en la sede y le pasan la autoinscripción al
  // robot que la carga en el portal de Teclab.
  altaLeadSede(carrera.nombre, payload);
  if (lead.data) despacharRobot(lead.data.id);

  if (datos.newsletter) {
    await suscribirNewsletter(supabase, filaNewsletter(datos.email.toLowerCase(), carrera, new Date()));
  }
  return { error: null };
}

const TIMEOUT_LEAD_SEDE_MS = 5000;

/**
 * Alta del lead en la landing de HubSpot de la sede, para que Teclab lo cree y
 * lo asigne al CAU. Corre con `after()`, con la respuesta ya enviada, y nunca
 * tumba la autoinscripción: la fila ya está guardada. Los registros llevan
 * sólo el estado o el tipo de error, nunca datos personales.
 */
function altaLeadSede(carrera: string, payload: JsonRecord) {
  const pedido = pedidoLeadSede({ ...payload, email: payload.email, carrera });
  if (!pedido) {
    console.warn('[formularios] Alta en la landing de la sede omitida: carrera sin opción o mail inválido');
    return;
  }
  try {
    after(async () => {
      try {
        const respuesta = await fetch(pedido.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pedido.body),
          signal: AbortSignal.timeout(TIMEOUT_LEAD_SEDE_MS),
        });
        if (!respuesta.ok) {
          console.error('[formularios] La landing de la sede rechazó el alta', { status: respuesta.status });
        }
      } catch (error) {
        console.error('[formularios] No se pudo dar de alta el lead en la landing de la sede', {
          code: error instanceof Error ? error.name : 'desconocido',
        });
      }
    });
  } catch (error) {
    console.error('[formularios] No se pudo programar el alta en la landing de la sede', {
      code: error instanceof Error ? error.name : 'desconocido',
    });
  }
}

const TIMEOUT_ROBOT_MS = 5000;

/**
 * Le pasa la autoinscripción al robot de Teclab: crea su fila en la cola
 * (`pendiente`) y lo despierta con un `repository_dispatch` de GitHub que
 * lleva sólo el id de esa fila; el robot pide el legajo a
 * `/api/robot/autoinscripciones`. Corre con `after()` y nunca tumba la
 * autoinscripción. Sin `ROBOT_GITHUB_REPO` o `ROBOT_GITHUB_TOKEN` no despacha:
 * la fila queda pendiente y la levanta el barrido del robot. Los registros
 * llevan sólo el estado o el tipo de error, nunca datos personales.
 */
function despacharRobot(consultaId: number) {
  try {
    after(async () => {
      try {
        const cola = await createSupabaseAdmin()
          .from(TABLA_ROBOT)
          .insert({ consulta_id: consultaId })
          .select('id')
          .single();
        if (cola.error || !cola.data) {
          console.error('[formularios] No se pudo encolar la autoinscripción para el robot', { code: cola.error?.code });
          return;
        }
        const pedido = despachoRobot(process.env.ROBOT_GITHUB_REPO, process.env.ROBOT_GITHUB_TOKEN, cola.data.id);
        if (!pedido) {
          console.warn('[formularios] Robot sin configurar: la autoinscripción queda pendiente', { id: cola.data.id });
          return;
        }
        const respuesta = await fetch(pedido.url, { ...pedido.init, signal: AbortSignal.timeout(TIMEOUT_ROBOT_MS) });
        if (!respuesta.ok) {
          console.error('[formularios] GitHub rechazó el despacho del robot', { status: respuesta.status });
        }
      } catch (error) {
        console.error('[formularios] No se pudo despachar el robot', {
          code: error instanceof Error ? error.name : 'desconocido',
        });
      }
    });
  } catch (error) {
    console.error('[formularios] No se pudo programar el despacho del robot', {
      code: error instanceof Error ? error.name : 'desconocido',
    });
  }
}

const ENLACE_INVALIDO = 'El enlace ya no es válido';

/**
 * Autoinscripción desde el enlace que trae el aviso de Telegram
 * (`/inscripcion/<codigo>`). El navegador manda sólo el código: el legajo
 * sale de la preinscripción guardada, con la service role, y
 * pasa por la misma validación estricta que la del formulario.
 *
 * El enlace se marca usado ANTES de escribir, con un UPDATE condicionado a
 * `usado_at IS NULL`: dos envíos simultáneos no pueden crear dos
 * autoinscripciones. Si la escritura falla, se libera para reintentar.
 */
async function registrarPorEnlace(payload: JsonRecord) {
  const pedido = validarPayloadEnlace(payload);
  if (!pedido) throw new TypeError('Datos inválidos');

  const supabase = createSupabaseAdmin();
  const enlace = await supabase
    .from(TABLA_ENLACES)
    .select('codigo, consulta_id, vence_at, usado_at')
    .eq('codigo', pedido.codigo)
    .maybeSingle();
  if (enlace.error) return { error: enlace.error };
  const fila = enlace.data as FilaEnlace | null;
  if (estadoEnlace(fila, new Date()) !== 'valido' || !fila) throw new TypeError(ENLACE_INVALIDO);

  const original = await supabase.from('consultas').select('*').eq('id', fila.consulta_id).maybeSingle();
  if (original.error) return { error: original.error };
  const consulta = original.data as JsonRecord | null;
  if (!consulta || !consultaConEnlace(consulta) || typeof consulta.carrera !== 'string') {
    throw new TypeError(ENLACE_INVALIDO);
  }

  // La consulta guarda el nombre de la carrera, no su id: se busca entre las
  // de las casas con autoinscripción, que es lo que vuelve a validar la casa.
  const niveles = CASAS_CON_AUTOINSCRIPCION.flatMap(casa => CASAS[casa].niveles);
  const busqueda = await supabase
    .from('carreras')
    .select('id, nombre, nivel')
    .eq('nombre', consulta.carrera)
    .in('nivel', niveles)
    .limit(1)
    .maybeSingle();
  if (busqueda.error) return { error: busqueda.error };
  const carrera = busqueda.data as CarreraAutoinscripcion | null;
  if (!carrera || !carreraConAutoinscripcion(carrera)) throw new TypeError(ENLACE_INVALIDO);

  const legajo = { ...payloadDesdeConsulta(consulta), carreraId: carrera.id };
  const datos = validarPayloadAutoinscripcion(legajo);
  if (!datos) throw new TypeError(ENLACE_INVALIDO);

  const reserva = await supabase
    .from(TABLA_ENLACES)
    .update({ usado_at: new Date().toISOString() })
    .eq('codigo', pedido.codigo)
    .is('usado_at', null)
    .select('codigo');
  if (reserva.error) return { error: reserva.error };
  if (!reserva.data?.length) throw new TypeError(ENLACE_INVALIDO);

  const resultado = await insertarAutoinscripcion(
    supabase, carrera, { ...datos, newsletter: pedido.newsletter }, legajo,
  );
  if (resultado.error) {
    const liberar = await supabase.from(TABLA_ENLACES).update({ usado_at: null }).eq('codigo', pedido.codigo);
    if (liberar.error) console.error('[formularios] No se pudo liberar el enlace', { code: liberar.error.code });
  }
  return resultado;
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

    if (!['consulta', 'faq', 'clase', 'precio', 'autoinscripcion', 'enlace'].includes(kind) || !token || !esRegistro(payload)) {
      return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
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
          : kind === 'autoinscripcion'
            ? await registrarAutoinscripcion(payload)
            : kind === 'enlace'
              ? await registrarPorEnlace(payload)
              : await registrarPrecio(payload);

    if (result.error) {
      console.error('[formularios] Error de base de datos', {
        kind,
        code: result.error.code,
      });
      return NextResponse.json({ error: 'No se pudo guardar la solicitud' }, { status: 500 });
    }

    // «Ver precio», la autoinscripción y el enlace ya suscribieron adentro, con su carrera.
    if (kind === 'consulta' || kind === 'faq') await suscribirDesdeFormulario(kind, payload);

    // «Ver precio» y la preinscripción de Teclab devuelven además el estado y,
    // si está vigente, el precio. El resto, sólo el ok.
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
