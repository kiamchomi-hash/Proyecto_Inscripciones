'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-auth';

const PUBLIC_PATHS = ['/admin/login', '/admin/auth/callback', '/admin/reset-password', '/admin/pendiente'];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createSupabaseBrowser();

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  useEffect(() => {
    if (isPublic) {
      setReady(true);
      return;
    }

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/admin/login'); return; }

      // Verificar si existe en profesores
      const { data: prof } = await supabase
        .from('profesores')
        .select('estado')
        .eq('user_id', session.user.id)
        .single();

      if (!prof) {
        // Primera vez: crear registro pendiente
        const { user } = session;
        await supabase.from('profesores').insert({
          user_id: user.id,
          nombre: user.user_metadata?.full_name || user.user_metadata?.name || null,
          email: user.email,
          estado: 'pendiente',
        });
        router.replace('/admin/pendiente');
        return;
      }

      if (prof.estado !== 'aprobado') {
        router.replace('/admin/pendiente');
        return;
      }

      setReady(true);
    }

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.replace('/admin/login');
    });
    return () => subscription.unsubscribe();
  }, [pathname, router, supabase, isPublic]);

  if (!ready && !isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-deep-dark-bg)' }}>
        <div className="text-[#7ca19b]">Cargando...</div>
      </div>
    );
  }

  return <>{children}</>;
}
