import { NextResponse } from 'next/server';

import { createSupabaseServer } from '@/lib/supabase-server';
import { guardarVentasSnapshot, MAX_SNAPSHOT_BYTES } from '@/lib/ventas-snapshot';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Dos maneras de entrar, para el mismo efecto:
 *
 * - **Sesion de admin**, que es la del navegador cuando subis el archivo a mano
 *   desde /admin/buscador.
 * - **`Authorization: Bearer $BUSCADOR_SECRET`**, que es la del actualizador que
 *   corre en la maquina de casa. No puede tener sesion, y bajarle la service
 *   role para que escriba directo en Storage seria darle a un script local la
 *   credencial que hoy vive solamente en Vercel. Mismo patron que
 *   /api/revalidar y /api/vigilancia.
 *
 * `null` = el pedido ni intento autenticarse con secreto, asi que se cae a la
 * sesion. No mezclar los dos casos: si el header viene y no coincide, la
 * respuesta tiene que ser 401 y no un 403 de "te falta rol".
 */
function autenticaPorSecreto(request: Request): boolean | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;

  const secreto = process.env.BUSCADOR_SECRET;
  if (!secreto) return false;

  return header === `Bearer ${secreto}`;
}

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
  const porSecreto = autenticaPorSecreto(request);

  if (porSecreto === false) {
    if (!process.env.BUSCADOR_SECRET) {
      return NextResponse.json({ error: 'BUSCADOR_SECRET sin configurar' }, { status: 503 });
    }
    return NextResponse.json({ error: 'no autorizado' }, { status: 401 });
  }

  if (porSecreto === null && !await esAdmin()) {
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
