// Newsletter de Teclab: cron de Vercel, una vez por día (vercel.json).
//
// A cada suscripción activa a una carrera de Teclab le manda, cada 7 días, el
// mail de la plantilla aprobada (`armarMailPrecio` con `tipo: 'newsletter'`)
// con el precio vigente de su carrera. Los 7 días cuentan desde el último
// envío o, si nunca se le mandó, desde el consentimiento. Siglo 21, Identidad
// y las suscripciones generales quedan afuera: la plantilla es de Teclab.
//
// `ultimo_envio_at` se escribe recién cuando SMTP2GO confirma el envío: un
// mail rechazado vuelve a salir en la corrida siguiente. Los registros llevan
// sólo cantidades y códigos de error, nunca mails, ids (el id es la baja) ni
// la clave.
//
// Detalle y procedimiento: docs/formularios-por-casa.md, «Newsletter de Teclab».

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';
import {
  CASAS, TABLA_NEWSLETTER, TABLA_PRECIOS,
  carreraConPrecio, fechaArgentina, resultadoPrecio, type FilaPrecio,
} from '@/components/formularios/casas';
import {
  armarMailPrecio, mandarPorSmtp2go, type CarreraDelMail, type PrecioDelMail,
} from '@/components/formularios/mail-precio';
import { BASE_PROD } from '@/lib/vigilancia-esperado';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Tope por corrida: lo que no entra sale mañana, el cron es diario. */
const POR_CORRIDA = 50;
const DIAS_ENTRE_ENVIOS = 7;
const DIA_MS = 24 * 60 * 60 * 1000;
/** Margen antes de `maxDuration`: no se arranca un envío que no llegue a cerrar. */
const PLAZO_MS = 240_000;

interface Resumen {
  candidatas: number;
  enviados: number;
  salteados: number;
  fallidos: number;
}

type CarreraNewsletter = CarreraDelMail & { id: number; activa: boolean };

/**
 * Las carreras de Teclab que hoy pueden salir: activas y con precio vigente.
 * Se leen una vez por corrida. Filtrar las suscripciones por estas carreras en
 * la consulta, y no después, evita que las que no pueden salir ocupen el tope
 * todos los días.
 */
async function carrerasConPrecioVigente(supabase: ReturnType<typeof createSupabaseAdmin>, hoy: Date) {
  const carreras = await supabase
    .from('carreras')
    .select('id, nombre, nivel, activa, prefix, nombre_corto, duracion')
    .in('nivel', CASAS.teclab.niveles)
    .eq('activa', true);
  if (carreras.error) return { error: carreras.error, vigentes: null };
  const conPrecio = (carreras.data as CarreraNewsletter[]).filter(c => carreraConPrecio(c));
  if (!conPrecio.length) return { error: null, vigentes: new Map() };

  const precios = await supabase
    .from(TABLA_PRECIOS)
    .select('carrera_id, conceptos, total, nota, vigente_hasta')
    .in('carrera_id', conPrecio.map(c => c.id));
  if (precios.error) return { error: precios.error, vigentes: null };

  const fecha = fechaArgentina(hoy);
  const vigentes = new Map<number, { carrera: CarreraNewsletter; precio: PrecioDelMail }>();
  for (const fila of precios.data as (FilaPrecio & { carrera_id: number })[]) {
    const carrera = conPrecio.find(c => c.id === fila.carrera_id);
    const resultado = resultadoPrecio(fila, fecha);
    if (carrera && resultado.estado === 'vigente') vigentes.set(carrera.id, { carrera, precio: resultado.precio });
  }
  return { error: null, vigentes };
}

/** Baja de un clic (RFC 8058): Gmail hace POST a esta URL, sin abrir nada. */
const encabezadosBaja = (id: string) => [
  { header: 'List-Unsubscribe', value: `<${BASE_PROD}/api/newsletter/baja?id=${encodeURIComponent(id)}>` },
  { header: 'List-Unsubscribe-Post', value: 'List-Unsubscribe=One-Click' },
];

export async function GET(request: NextRequest) {
  // Igual que /api/vigilancia: sin secreto el endpoint quedaría abierto.
  const secreto = process.env.CRON_SECRET;
  if (!secreto) {
    return NextResponse.json({ error: 'CRON_SECRET sin configurar' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: 'no autorizado' }, { status: 401 });
  }

  const resumen: Resumen = { candidatas: 0, enviados: 0, salteados: 0, fallidos: 0 };
  const clave = process.env.SMTP2GO_API_KEY;
  if (!clave) {
    console.warn('[newsletter] Corrida omitida: falta SMTP2GO_API_KEY');
    return NextResponse.json({ error: 'SMTP2GO_API_KEY sin configurar', ...resumen }, { status: 503 });
  }

  const inicio = Date.now();
  const ahora = new Date(inicio);
  const supabase = createSupabaseAdmin();
  const { error: errorCarreras, vigentes } = await carrerasConPrecioVigente(supabase, ahora);
  if (errorCarreras || !vigentes) {
    console.error('[newsletter] No se pudieron leer las carreras o los precios', { code: errorCarreras?.code });
    return NextResponse.json({ error: 'No se pudo leer la base', ...resumen }, { status: 500 });
  }
  if (!vigentes.size) return NextResponse.json(resumen);

  // Los 7 días van en la consulta: nunca se le mandó y consintió hace 7 días
  // o más, o el último envío tiene 7 días o más.
  const limite = new Date(inicio - DIAS_ENTRE_ENVIOS * DIA_MS).toISOString();
  const suscripciones = await supabase
    .from(TABLA_NEWSLETTER)
    .select('id, email, carrera_id')
    .eq('activo', true)
    .in('carrera_id', [...vigentes.keys()])
    .or(`and(ultimo_envio_at.is.null,consentimiento_at.lte.${limite}),ultimo_envio_at.lte.${limite}`)
    .order('ultimo_envio_at', { ascending: true, nullsFirst: true })
    .limit(POR_CORRIDA);
  if (suscripciones.error) {
    console.error('[newsletter] No se pudieron leer las suscripciones', { code: suscripciones.error.code });
    return NextResponse.json({ error: 'No se pudo leer la base', ...resumen }, { status: 500 });
  }

  resumen.candidatas = suscripciones.data.length;
  // De a uno: SMTP2GO limita la tasa y un fallo no frena al resto.
  for (const suscripcion of suscripciones.data) {
    const datos = suscripcion.carrera_id === null ? undefined : vigentes.get(suscripcion.carrera_id);
    if (!datos || Date.now() - inicio > PLAZO_MS) {
      resumen.salteados++;
      continue;
    }
    const mail = armarMailPrecio({
      carrera: datos.carrera,
      precio: datos.precio,
      hoy: ahora,
      tipo: 'newsletter',
      bajaUrl: `${BASE_PROD}/newsletter/baja?id=${encodeURIComponent(suscripcion.id)}`,
    });
    const envio = await mandarPorSmtp2go({
      clave, para: suscripcion.email, mail, encabezados: encabezadosBaja(suscripcion.id),
    });
    if (!envio.enviado) {
      resumen.fallidos++;
      console.error('[newsletter] SMTP2GO no confirmó un envío', { status: envio.status, error_code: envio.codigo });
      continue;
    }
    resumen.enviados++;
    const marca = await supabase
      .from(TABLA_NEWSLETTER)
      .update({ ultimo_envio_at: new Date().toISOString() })
      .eq('id', suscripcion.id);
    // El mail ya salió: si no se pudo marcar, mañana se repite. Se registra.
    if (marca.error) console.error('[newsletter] No se pudo marcar el envío', { code: marca.error.code });
  }

  console.info('[newsletter] Corrida terminada', resumen);
  return NextResponse.json(resumen);
}
