import { NextResponse } from 'next/server';

import { createSupabaseServer } from '@/lib/supabase-server';
import { guardarVentasSnapshot, MAX_SNAPSHOT_BYTES } from '@/lib/ventas-snapshot';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function esAdmin() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: perfil } = await supabase
    .from('profesores')
    .select('estado, rol')
    .eq('user_id', user.id)
    .maybeSingle();

  return perfil?.estado === 'aprobado' && perfil.rol === 'admin';
}

export async function PUT(request: Request) {
  if (!await esAdmin()) {
    return NextResponse.json({ error: 'Se requiere rol administrador' }, { status: 403 });
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_SNAPSHOT_BYTES) {
    return NextResponse.json({ error: 'El archivo supera el límite permitido' }, { status: 413 });
  }

  try {
    const html = await request.text();
    const meta = await guardarVentasSnapshot(html);
    return NextResponse.json({ ok: true, meta });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo publicar el buscador';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
