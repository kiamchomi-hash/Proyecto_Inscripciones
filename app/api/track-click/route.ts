import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

// Telemetría agregada: sólo suma al contador del día, no guarda nada de quien clickea.
export async function POST(request: NextRequest) {
  try {
    const { carrera } = await request.json() as { carrera?: unknown };
    if (typeof carrera !== 'string' || !carrera.trim() || carrera.length > 200) {
      return NextResponse.json({ error: 'Carrera inválida' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const digest = createHash('sha256').update(ip).digest('hex');

    const supabase = createSupabaseAdmin();
    // Tope alto a propósito: navegar 20 tarjetas es uso normal, no abuso.
    const { data: allowed, error: rateError } = await supabase.rpc('check_form_rate_limit', {
      p_key: `click:${digest}`,
      p_max_requests: 60,
      p_window_seconds: 600,
    });
    if (rateError) throw rateError;
    if (!allowed) return NextResponse.json({ ok: true, skipped: true });

    const { error } = await supabase.rpc('registrar_click_carrera', {
      p_carrera: carrera.trim().slice(0, 200),
    });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    // La telemetría nunca debe romperle la navegación a nadie.
    console.error('[track-click]', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
