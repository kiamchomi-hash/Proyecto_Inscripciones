import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';
import { buildAperturaDirectaMessage } from '@/lib/apertura-directa';

export const dynamic = 'force-dynamic';

const MAX_CARRERA = 200;
const MAX_URL = 500;

export async function POST(request: NextRequest) {
  try {
    const { carrera, url } = await request.json() as { carrera?: unknown; url?: unknown };
    if (
      typeof carrera !== 'string' || !carrera.trim() || carrera.length > MAX_CARRERA ||
      typeof url !== 'string' || !url.startsWith('/carreras/') || url.length > MAX_URL
    ) {
      return NextResponse.json({ error: 'Apertura inválida' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') || 'unknown';
    const digest = createHash('sha256').update(ip).digest('hex');
    const supabase = createSupabaseAdmin();

    const { data: allowed, error: rateError } = await supabase.rpc('check_form_rate_limit', {
      p_key: `direct-open:${digest}`,
      p_max_requests: 20,
      p_window_seconds: 600,
    });
    if (rateError) throw rateError;
    if (!allowed) return NextResponse.json({ ok: true, skipped: true });

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chat) throw new Error('Telegram no configurado');

    const texto = buildAperturaDirectaMessage({ carrera: carrera.trim(), url });
    const telegram = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: texto, parse_mode: 'Markdown', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!telegram.ok) throw new Error(`Telegram HTTP ${telegram.status}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    // El aviso nunca debe convertir una ficha válida en un error de navegación.
    console.error('[track-direct-open]', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
