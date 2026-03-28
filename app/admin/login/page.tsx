'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-auth';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [mode, setMode] = useState<'login' | 'reset'>('login');
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
    // Full page navigation para que middleware sincronice cookies de sesión
    window.location.href = '/admin';
  };

  const handleGoogleLogin = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin/auth/callback`,
      },
    });
    if (error) setError('Error al conectar con Google');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Ingresá tu email'); return; }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    if (error) {
      setError('Error al enviar el email. Intentá de nuevo.');
    } else {
      setSuccess('Te enviamos un email con instrucciones para cambiar tu contraseña.');
    }
    setLoading(false);
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl text-white text-sm border border-[#3d4148] outline-none focus:border-[#6b7280] transition-all duration-200 placeholder:text-white/25 bg-black';

  return (
    <div className="min-h-screen flex items-start justify-center px-4 pt-6">
      <div className="w-full max-w-[380px]">
        <div className="rounded-2xl border-3 border-[#3d4148] bg-[#1e2024] overflow-hidden">
          <div className="px-7 py-4 border-b border-[#3d4148] bg-[#15171a]">
            <h1 className="text-lg font-bold text-white text-center">
              {mode === 'login' ? 'Iniciar sesión' : 'Recuperar contraseña'}
            </h1>
          </div>
          <div className="p-7">

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/15">
              <p className="text-red-400 text-xs text-center">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-[#6b7280]/10 border border-[#6b7280]/20">
              <p className="text-[#9ca3af] text-xs text-center">{success}</p>
            </div>
          )}

          {mode === 'login' ? (
            <>
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="text-[0.65rem] text-white font-semibold uppercase tracking-wider block mb-1.5 ml-1">Email</label>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className="text-[0.65rem] text-white font-semibold uppercase tracking-wider block mb-1.5 ml-1">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={`${inputClass} pr-11`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPw ? (
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setMode('reset'); setError(''); setSuccess(''); }}
                    className="text-[0.65rem] text-[#9ca3af] hover:text-white transition cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-[#4b5563] hover:bg-[#6b7280] disabled:opacity-40 transition-all duration-200 cursor-pointer mt-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Ingresando...
                    </span>
                  ) : 'Ingresar'}
                </button>
              </form>

              {/* Separador */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-[#3d4148]" />
                <span className="text-[0.65rem] text-[#6b7280] uppercase tracking-widest font-medium">o</span>
                <div className="flex-1 h-px bg-[#3d4148]" />
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 rounded-xl font-medium text-sm text-white/70 bg-black border border-[#3d4148] hover:border-[#6b7280] hover:text-white transition-all duration-200 cursor-pointer flex items-center justify-center gap-3"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continuar con Google
              </button>
            </>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-[#9ca3af] text-center leading-relaxed">
                Ingresá tu email y te enviamos un enlace para cambiar tu contraseña.
              </p>
              <div>
                <label className="text-[0.65rem] text-white font-semibold uppercase tracking-wider block mb-1.5 ml-1">Email</label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-[#4b5563] hover:bg-[#6b7280] disabled:opacity-40 transition-all duration-200 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </span>
                ) : 'Enviar enlace'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className="w-full text-xs text-[#6b7280] hover:text-[#9ca3af] transition cursor-pointer text-center py-1"
              >
                Volver al inicio de sesión
              </button>
            </form>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
