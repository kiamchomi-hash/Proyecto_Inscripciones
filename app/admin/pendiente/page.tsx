'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-auth';

export default function PendientePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/admin/login');
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
        <button
          onClick={logout}
          className="text-xs text-[#7ca19b] hover:text-[#00c7b1] transition cursor-pointer"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
