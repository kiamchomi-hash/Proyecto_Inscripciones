import { NextResponse } from 'next/server';

// Rate limiting en memoria: máximo 5 emails por IP cada 10 minutos
const rateMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_REQUESTS;
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
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

    await resend.emails.send({
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

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Error enviando email:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
