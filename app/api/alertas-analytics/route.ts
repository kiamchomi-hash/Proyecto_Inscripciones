import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

const EVENTOS = new Set(['formulario-intento', 'formulario-abandonado']);
const TIMEOUT_MS = 8000;

function textoSeguro(valor: unknown, max = 80): string {
  return typeof valor === 'string' ? valor.replace(/[\r\n]/g, ' ').slice(0, max) : '';
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
    const cuerpo = await request.json() as { evento?: unknown; datos?: Record<string, unknown> };
    const evento = textoSeguro(cuerpo.evento, 40);
    if (!EVENTOS.has(evento) || !cuerpo.datos || typeof cuerpo.datos !== 'object') {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || 'unknown';
    const digest = createHash('sha256').update(ip).digest('hex');
    const supabase = createSupabaseAdmin();
    const { data: permitido, error } = await supabase.rpc('check_form_rate_limit', {
      p_key: `analytics-alert:${evento}:${digest}`,
      p_max_requests: 12,
      p_window_seconds: 600,
    });
    if (error) throw error;
    if (!permitido) return NextResponse.json({ ok: true, skipped: true });

    const datos = cuerpo.datos;
    const lineas = evento === 'formulario-abandonado'
      ? [
        'Abandono de formulario',
        `Origen: ${textoSeguro(datos.origen)}`,
        `Modo: ${textoSeguro(datos.modo)}`,
        `Último campo: ${textoSeguro(datos.ultimo_campo)}`,
        `Motivo: ${textoSeguro(datos.motivo)}`,
        `Campos completados: ${textoSeguro(datos.campos_completados, 10)}`,
      ]
      : [
        'Intento de envío de formulario',
        `Origen: ${textoSeguro(datos.origen)}`,
        `Modo: ${textoSeguro(datos.modo)}`,
        `Resultado: ${textoSeguro(datos.resultado)}`,
      ];
    const enviado = await avisar(lineas.join('\n'));
    return NextResponse.json({ ok: enviado }, { status: enviado ? 200 : 502 });
  } catch (error) {
    console.error('[alertas-analytics]', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
