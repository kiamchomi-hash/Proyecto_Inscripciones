'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-auth';
import AdminSidebar from '@/components/admin/sidebar';
import './admin.css';

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/admin/login'); return; }

      // Verificar si existe en profesores
      const { data: prof, error } = await supabase
        .from('profesores')
        .select('estado')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error consultando profesores:', JSON.stringify(error), 'user_id:', user.id);
        router.replace('/admin/login');
        return;
      }

      if (!prof) {
        // Primera vez: crear registro pendiente
        const { error: insertError } = await supabase.from('profesores').insert({
          user_id: user.id,
          nombre: user.user_metadata?.full_name || user.user_metadata?.name || null,
          email: user.email,
          estado: 'pendiente',
          rol: 'profesor',
        });
        if (insertError) {
          // Si falla por unique constraint, el registro existe pero RLS no lo deja leer
          console.error('Error creando registro pendiente:', insertError);
          if (insertError.code === '23505') {
            // El registro ya existe — probable problema de RLS, ir a pendiente
            // (el admin deberá verificar en Supabase)
          }
        }
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

  if (isPublic) return <>{children}</>;

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--admin-bg)' }}>
      <AdminSidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
