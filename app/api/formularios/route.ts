import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';
import { verifyTurnstile } from '@/lib/turnstile';
import {
  CAMPOS, CASAS, camposDe, columnaDe,
  type CampoId, type CasaId, type Modo,
} from '@/components/formularios/casas';

type JsonRecord = Record<string, unknown>;

const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const nullableText = (value: unknown, max: number) => text(value, max) || null;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[\d\s()+-]{8,30}$/;
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
  typeof value === 'string' && value in CASAS;

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

  // Los booleanos van siempre, valgan o no para esta casa: si la columna es
  // NOT NULL, omitirla rompe el INSERT entero. Un `false` es además lo que
  // corresponde — Teclab no acredita equivalencias, así que no las pidió.
  for (const campo of Object.keys(CAMPOS) as CampoId[]) {
    if (CAMPOS[campo].tipo === 'checkbox' && !aceptados.includes(campo)) {
      fila[columnaDe(campo)] = false;
    }
  }

  return createSupabaseAdmin().from('consultas').insert(fila);
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
    const row = raw as JsonRecord;
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as JsonRecord;
    const kind = text(body.kind, 20);
    const token = text(body.token, 4096);
    const payload = body.payload as JsonRecord;
    const ip = clientIp(request);

    if (!['consulta', 'faq', 'clase'].includes(kind) || !token || !payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
    }

    const captchaConfigured = Boolean(process.env.TURNSTILE_SECRET_KEY);
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
        : await insertClase(payload);

    if (result.error) {
      console.error('[formularios] Error de base de datos', {
        kind,
        code: result.error.code,
      });
      return NextResponse.json({ error: 'No se pudo guardar la solicitud' }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof TypeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[formularios] Error interno', error);
    return NextResponse.json({ error: 'Servicio temporalmente no disponible' }, { status: 503 });
  }
}
