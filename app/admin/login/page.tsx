'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-auth';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Email o contraseña incorrectos');
      setLoading(false);
      return;
    }
    router.push('/admin/clases-apoyo');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-deep-dark-bg)' }}>
      <form onSubmit={handleLogin} className="w-full max-w-sm p-8 rounded-2xl border border-[#00c7b1]/15" style={{ background: 'var(--color-card-bg)' }}>
        <h1 className="text-2xl font-bold text-white mb-1 text-center">Panel Profesores</h1>
        <p className="text-xs text-[#7ca19b] text-center mb-6">CAU Villa Lugano</p>
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-3 rounded-lg bg-[#0f2825] text-white border border-[#00c7b1]/20 mb-3 outline-none focus:border-[#00c7b1] transition placeholder:text-[#7ca19b]/50"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-3 rounded-lg bg-[#0f2825] text-white border border-[#00c7b1]/20 mb-5 outline-none focus:border-[#00c7b1] transition placeholder:text-[#7ca19b]/50"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg font-bold text-white bg-[#00c7b1] hover:bg-[#00b3a0] disabled:opacity-50 transition cursor-pointer"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
