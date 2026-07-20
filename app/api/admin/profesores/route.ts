import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

const ROLES = new Set(['admin', 'profesor']);

export async function PATCH(request: NextRequest) {
  const body = await request.json() as {
    id?: unknown;
    estado?: unknown;
    rol?: unknown;
    materia_id?: unknown;
  };
  if (typeof body.id !== 'string' || body.estado !== 'aprobado' || typeof body.rol !== 'string' || !ROLES.has(body.rol)) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const materiaId = typeof body.materia_id === 'string' ? body.materia_id : null;
  if (body.rol === 'profesor' && !materiaId) {
    return NextResponse.json({ error: 'El profesor requiere una materia' }, { status: 400 });
  }

  const { error } = await createSupabaseAdmin()
    .from('profesores')
    .update({ estado: 'aprobado', materia_id: materiaId, rol: body.rol })
    .eq('id', body.id);

  if (error) return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

  const { error } = await createSupabaseAdmin().from('profesores').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
