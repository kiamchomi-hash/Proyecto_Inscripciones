import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

// Aviso de que alguien abrio una ficha sin contenido cargado. Va por Telegram,
// el unico canal de avisos desde el 01/08/2026.
//
// No es la unica red: `npm run auditar` lista las mismas carreras leyendo la
// base, sin depender de que un visitante entre. Este aviso agrega el cuando.
const TELEGRAM_API = 'https://api.telegram.org';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const key = `notificar:${createHash('sha256').update(ip).digest('hex')}`;
    const { data: allowed, error: rateError } = await createSupabaseAdmin().rpc('check_form_rate_limit', {
      p_key: key,
      p_max_requests: 5,
      p_window_seconds: 600,
    });
    if (rateError) throw rateError;
    if (!allowed) {
      return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
    }

    const { nombre } = await req.json();
    if (!nombre || typeof nombre !== 'string' || nombre.length > 200) {
      return NextResponse.json({ error: 'Falta nombre' }, { status: 400 });
    }

    // Sin credenciales no hay a donde avisar, pero esto es telemetria interna:
    // no tiene por que romperle la ficha a quien la esta mirando.
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      console.error('Faltan TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID: aviso no enviado');
      return NextResponse.json({ ok: false, enviado: false });
    }

    const ahora = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
    // Sin parse_mode: el nombre sale de la base y un guion bajo o un asterisco
    // sueltos alcanzan para que Telegram rechace el mensaje con un 400.
    const texto = [
      '⚠️ Carrera sin contenido cargado',
      '',
      `Carrera: ${nombre}`,
      `Fecha: ${ahora}`,
      '',
      'Alguien abrió la ficha y no hay slides que mostrar.',
    ].join('\n');

    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: texto }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`Telegram ${res.status}: ${await res.text()}`);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Error enviando el aviso:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
