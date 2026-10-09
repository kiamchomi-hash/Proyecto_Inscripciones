// Cron semanal de Vercel (lunes 9:00 de Argentina): manda por Telegram el
// recordatorio de los seguimientos de fondo de Teclab. Ver `lib/recordatorio-teclab.ts`.

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { enviarTelegram } from '@/lib/telegram';
import { mensajeRecordatorioTeclab, type FichaTeclab } from '@/lib/recordatorio-teclab';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Igual que /api/vigilancia: sin secreto el endpoint quedaría abierto.
  const secreto = process.env.CRON_SECRET;
  if (!secreto) {
    return NextResponse.json({ error: 'CRON_SECRET sin configurar' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: 'no autorizado' }, { status: 401 });
  }

  // Carreras vigentes de Teclab; el curso no lleva intro de carrera.
  const { data, error } = await supabase
    .from('carreras')
    .select('nombre, descripcion')
    .eq('activa', true)
    .ilike('nivel', 'Teclab -%')
    .neq('nivel', 'Teclab - Curso')
    .order('nombre');
  if (error) console.error('[recordatorio-teclab] No se pudieron leer las carreras', { code: error.code });

  const aviso = await enviarTelegram(mensajeRecordatorioTeclab(error ? null : (data as FichaTeclab[])));
  return NextResponse.json({ aviso });
}
