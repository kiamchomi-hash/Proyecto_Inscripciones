import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

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

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { nombre } = await req.json();
    if (!nombre || typeof nombre !== 'string' || nombre.length > 200) {
      return NextResponse.json({ error: 'Falta nombre' }, { status: 400 });
    }

    // Sanitize HTML to prevent XSS in email
    const safe = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeNombre = safe(nombre);
    const ahora = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

    const sendPromise = resend.emails.send({
      from: 'CAU Villa Lugano <onboarding@resend.dev>',
      to: 'kiamchomi@gmail.com',
      subject: `Carrera sin slides: ${safeNombre}`,
      html: `
        <h2>Alguien hizo click en una carrera sin slides</h2>
        <p><strong>Carrera:</strong> ${safeNombre}</p>
        <p><strong>Fecha:</strong> ${ahora}</p>
        <p>Cargá los slides desde la herramienta o con <code>/cargar_carrera</code>.</p>
      `,
    });
    const result = await Promise.race([
      sendPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Resend timeout')), 8_000),
      ),
    ]);
    if (result.error) throw result.error;

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Error enviando email:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
