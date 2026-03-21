import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { nombre } = await req.json();
    if (!nombre || typeof nombre !== 'string') {
      return NextResponse.json({ error: 'Falta nombre' }, { status: 400 });
    }

    const ahora = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });

    await resend.emails.send({
      from: 'CAU Villa Lugano <onboarding@resend.dev>',
      to: 'kiamchomi@gmail.com',
      subject: `Carrera sin slides: ${nombre}`,
      html: `
        <h2>Alguien hizo click en una carrera sin slides</h2>
        <p><strong>Carrera:</strong> ${nombre}</p>
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
