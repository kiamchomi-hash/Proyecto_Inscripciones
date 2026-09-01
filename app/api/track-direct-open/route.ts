import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

const MAX_CARRERA = 200;

export async function POST(request: NextRequest) {
  try {
    const { carrera } = await request.json() as { carrera?: unknown };
    if (
      typeof carrera !== 'string' || !carrera.trim() || carrera.length > MAX_CARRERA
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

    const { error } = await supabase.rpc('registrar_click_carrera', {
      p_carrera: carrera.trim().slice(0, MAX_CARRERA),
      p_origen: 'directa',
    });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    // El aviso nunca debe convertir una ficha válida en un error de navegación.
    console.error('[track-direct-open]', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
