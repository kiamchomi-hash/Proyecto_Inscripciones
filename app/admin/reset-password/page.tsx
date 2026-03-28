'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-auth';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  // Supabase envía el token en el hash de la URL, el cliente lo procesa automáticamente
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // El usuario llegó desde el email de reset, está listo para cambiar
      }
    });
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError('Error al cambiar la contraseña. El enlace puede haber expirado.');
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/admin'), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-deep-dark-bg)' }}>
      <div className="w-full max-w-sm p-8 rounded-2xl border border-[#00c7b1]/15" style={{ background: 'var(--color-card-bg)' }}>
        <h1 className="text-2xl font-bold text-white mb-1 text-center">Nueva contraseña</h1>
        <p className="text-xs text-[#7ca19b] text-center mb-6">CAU Villa Lugano</p>

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        {success ? (
          <div className="text-center">
            <p className="text-[#00c7b1] text-sm mb-2">Contraseña cambiada correctamente.</p>
            <p className="text-xs text-[#7ca19b]">Redirigiendo al panel...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="relative mb-3">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Nueva contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 pr-11 rounded-lg bg-[#0f2825] text-white border border-[#00c7b1]/20 outline-none focus:border-[#00c7b1] transition placeholder:text-[#7ca19b]/50"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7ca19b] hover:text-[#00c7b1] transition cursor-pointer"
                tabIndex={-1}
              >
                {showPw ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Repetir contraseña"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full p-3 rounded-lg bg-[#0f2825] text-white border border-[#00c7b1]/20 mb-5 outline-none focus:border-[#00c7b1] transition placeholder:text-[#7ca19b]/50"
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-white bg-[#00c7b1] hover:bg-[#00b3a0] disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? 'Cambiando...' : 'Cambiar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
