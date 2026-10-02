import 'server-only';
import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

// Se verifica en cada solicitud, junto a la escritura privilegiada. El proxy
// conserva el control de navegación, pero no es la única barrera de estas APIs.
export async function exigirAdmin(): Promise<NextResponse | null> {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: perfil, error: errorPerfil } = await supabase
      .from('profesores')
      .select('estado, rol')
      .eq('user_id', user.id)
      .maybeSingle();

    if (errorPerfil) {
      return NextResponse.json({ error: 'No se pudo verificar la cuenta' }, { status: 503 });
    }
    if (!perfil || perfil.estado !== 'aprobado' || perfil.rol !== 'admin') {
      return NextResponse.json({ error: 'Se requiere una cuenta administradora aprobada' }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ error: 'No se pudo verificar la cuenta' }, { status: 503 });
  }
}
