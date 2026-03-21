'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    if (pathname === '/admin/login') {
      setReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/admin/login');
      else setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.replace('/admin/login');
    });
    return () => subscription.unsubscribe();
  }, [pathname, router, supabase.auth]);

  if (!ready && pathname !== '/admin/login') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-deep-dark-bg)' }}>
        <div className="text-[#7ca19b]">Cargando...</div>
      </div>
    );
  }

  return <>{children}</>;
}
