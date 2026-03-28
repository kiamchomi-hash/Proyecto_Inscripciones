'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-auth';

export default function PendientePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from('profesores')
        .select('estado')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prof?.estado === 'aprobado') {
        window.location.href = '/admin';
      }
    }

    checkStatus();
  }, [supabase, router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  const recheckNow = async () => {
    setChecking(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setChecking(false); return; }

    const { data: prof } = await supabase
      .from('profesores')
      .select('estado')
      .eq('user_id', user.id)
      .maybeSingle();

    if (prof?.estado === 'aprobado') {
      window.location.href = '/admin';
    } else {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-deep-dark-bg)' }}>
      <div className="w-full max-w-sm p-8 rounded-2xl border border-[#00c7b1]/15 text-center" style={{ background: 'var(--color-card-bg)' }}>
        <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,199,177,0.1)' }}>
          <svg className="w-8 h-8 text-[#00c7b1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Solicitud enviada</h1>
        <p className="text-sm text-[#7ca19b] mb-6">
          Tu solicitud de acceso fue registrada. El administrador del CAU te habilitará el acceso a la brevedad.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={recheckNow}
            disabled={checking}
            className="text-xs text-[#00c7b1] hover:text-white transition cursor-pointer disabled:opacity-50"
          >
            {checking ? 'Verificando...' : 'Verificar acceso'}
          </button>
          <span className="text-white/10">|</span>
          <button
            onClick={logout}
            className="text-xs text-[#7ca19b] hover:text-red-400 transition cursor-pointer"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
