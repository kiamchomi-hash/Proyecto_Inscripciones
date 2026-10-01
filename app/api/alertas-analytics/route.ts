import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

const TIMEOUT_MS = 8000;
const ORIGENES_FORMULARIO = new Set(['home', 'teclab', 'contacto']);
const MODOS_FORMULARIO = new Set(['contacto', 'preinscripcion']);

const esRegistro = (valor: unknown): valor is Record<string, unknown> =>
  valor !== null && typeof valor === 'object' && !Array.isArray(valor);

function textoSeguro(valor: unknown, max = 80): string {
  return typeof valor === 'string'
    ? valor.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max)
    : '';
}

function enteroSeguro(valor: unknown, max = 99): number | null {
  return typeof valor === 'number' && Number.isInteger(valor) && valor >= 0
    ? Math.min(valor, max)
    : null;
}

type AlertaPreparada = { texto: string; maximo: number };

/**
 * La allowlist es por evento y por campo: cualquier dato extra se descarta y
 * nunca llega a Telegram. Los valores cerrados también se validan para que el
 * endpoint no pueda usarse como relay de texto arbitrario.
 */
function prepararAlerta(evento: string, datos: Record<string, unknown>): AlertaPreparada | null {
  const origen = textoSeguro(datos.origen);
  const modo = textoSeguro(datos.modo);

  if (evento === 'whatsapp') {
    if (!origen.startsWith('/')) return null;
    return { texto: ['Clic móvil a WhatsApp', `Página: ${origen}`].join('\n'), maximo: 5 };
  }
  if (evento === 'clase-whatsapp') {
    const materia = textoSeguro(datos.materia);
    if (!materia) return null;
    return { texto: ['Clic a WhatsApp de clases', `Materia: ${materia}`].join('\n'), maximo: 5 };
  }
  if (evento === 'formulario-fallo') {
    const motivo = textoSeguro(datos.motivo);
    if (!ORIGENES_FORMULARIO.has(origen) || !['red', 'servidor'].includes(motivo)) return null;
    return {
      texto: [
        'Fallo técnico del formulario de contacto',
        `Origen: ${origen}`,
        `Tipo: ${motivo}`,
      ].join('\n'),
      maximo: 5,
    };
  }
  if (evento === 'formulario-intento') {
    const resultado = textoSeguro(datos.resultado);
    if (!ORIGENES_FORMULARIO.has(origen) || !MODOS_FORMULARIO.has(modo)
      || !['captcha', 'validacion'].includes(resultado)) return null;
    return {
      texto: [
        'Intento de envío de formulario',
        `Origen: ${origen}`,
        `Modo: ${modo}`,
        `Resultado: ${resultado}`,
      ].join('\n'),
      maximo: 12,
    };
  }
  if (evento === 'formulario-abandonado') {
    const ultimoCampo = textoSeguro(datos.ultimo_campo);
    const motivo = textoSeguro(datos.motivo);
    const completados = enteroSeguro(datos.campos_completados);
    if (!ORIGENES_FORMULARIO.has(origen) || !MODOS_FORMULARIO.has(modo)
      || !ultimoCampo || !['envio-en-curso', 'error-envio', 'captcha', 'validacion', 'abandono'].includes(motivo)
      || completados === null) return null;
    return {
      texto: [
        'Abandono de formulario',
        `Origen: ${origen}`,
        `Modo: ${modo}`,
        `Último campo: ${ultimoCampo}`,
        `Motivo: ${motivo}`,
        `Campos completados: ${completados}`,
      ].join('\n'),
      maximo: 12,
    };
  }
  return null;
}

async function avisar(texto: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return false;
  const respuesta = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text: texto, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return respuesta.ok;
}

export async function POST(request: NextRequest) {
  try {
    let cuerpo: unknown;
    try {
      cuerpo = await request.json();
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    if (!esRegistro(cuerpo)) return NextResponse.json({ ok: false }, { status: 400 });
    const evento = textoSeguro(cuerpo.evento, 40);
    if (!esRegistro(cuerpo.datos)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const alerta = prepararAlerta(evento, cuerpo.datos);
    if (!alerta) return NextResponse.json({ ok: false }, { status: 400 });

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || 'unknown';
    const digest = createHash('sha256').update(ip).digest('hex');
    const supabase = createSupabaseAdmin();
    const { data: permitido, error } = await supabase.rpc('check_form_rate_limit', {
      p_key: `analytics-alert:${evento}:${digest}`,
      p_max_requests: alerta.maximo,
      p_window_seconds: 600,
    });
    if (error) throw error;
    if (!permitido) return NextResponse.json({ ok: true, skipped: true });

    const enviado = await avisar(alerta.texto);
    return NextResponse.json({ ok: enviado }, { status: enviado ? 200 : 502 });
  } catch (error) {
    console.error('[alertas-analytics]', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
