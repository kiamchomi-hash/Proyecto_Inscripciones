'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-auth';

interface Profesor {
  rol: 'admin' | 'profesor';
}

interface Solicitud {
  id: string;
  nombre: string | null;
  email: string | null;
  estado: string;
  rol: string;
  materia_id: string | null;
  created_at: string;
}

interface Materia {
  id: string;
  label: string;
}

export default function AdminDashboard() {
  const [profesor, setProfesor] = useState<Profesor | null>(null);
  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const loadSolicitudes = useCallback(async () => {
    const [{ data: sols }, { data: mats }] = await Promise.all([
      supabase.from('profesores').select('id, nombre, email, estado, rol, materia_id, created_at').order('created_at', { ascending: false }),
      supabase.from('materias').select('id, label').eq('activa', true).order('orden', { ascending: true }),
    ]);
    setSolicitudes(sols ?? []);
    setMaterias(mats ?? []);
  }, [supabase]);

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/admin/login'); return; }

      const { data: prof } = await supabase
        .from('profesores')
        .select('rol')
        .eq('user_id', user.id)
        .single();

      if (!prof) { router.replace('/admin/login'); return; }

      if (prof.rol !== 'admin') {
        router.replace('/admin/clases-apoyo');
        return;
      }

      setProfesor(prof);
      await loadSolicitudes();
      setLoading(false);
    }
    checkRole();
  }, [router, supabase, loadSolicitudes]);

  const aprobar = async (id: string, materiaId: string | null, rol: string) => {
    if (!materiaId && rol === 'profesor') return;
    setSaving(id);
    await supabase.from('profesores').update({ estado: 'aprobado', materia_id: materiaId, rol }).eq('id', id);
    await loadSolicitudes();
    setSaving(null);
  };

  const rechazar = async (id: string) => {
    setSaving(id);
    await supabase.from('profesores').delete().eq('id', id);
    await loadSolicitudes();
    setSaving(null);
  };

  const updateField = (id: string, field: string, value: string | null) => {
    setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1612' }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#00c7b1] border-t-transparent rounded-full animate-spin" />
          <span className="text-white/50 text-sm">Cargando...</span>
        </div>
      </div>
    );
  }

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente');
  const aprobados = solicitudes.filter(s => s.estado === 'aprobado');

  const cards = [
    {
      title: 'Precios',
      description: 'Gestionar precios de carreras, descuentos y promociones',
      href: '/admin/precios',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Clases de Apoyo',
      description: 'Administrar materias, horarios y disponibilidad',
      href: '/admin/clases-apoyo',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
        </svg>
      ),
    },
  ];

  const getMateriaLabel = (id: string | null) => materias.find(m => m.id === id)?.label ?? '—';

  return (
    <div className="min-h-screen" style={{ background: '#0a1612' }}>
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5" style={{ background: 'rgba(10,22,18,0.85)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: 'linear-gradient(135deg, #00c7b1, #058c70)' }}>A</div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">Panel Admin</h1>
              <p className="text-[0.6rem] text-white/30 mt-0.5">CAU Villa Lugano</p>
            </div>
          </div>
          <button onClick={logout} className="text-[0.65rem] text-white/30 hover:text-red-400 transition cursor-pointer">Salir</button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* Navegación */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6 text-center">¿Qué querés administrar?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map((card) => (
              <button
                key={card.href}
                onClick={() => router.push(card.href)}
                className="group p-6 rounded-2xl border border-white/10 text-left transition hover:border-[#00c7b1]/40 hover:bg-white/[0.03] cursor-pointer"
                style={{ background: 'var(--color-card-bg)' }}
              >
                <div className="text-[#00c7b1] mb-4 group-hover:scale-110 transition-transform">
                  {card.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{card.title}</h3>
                <p className="text-sm text-white/40">{card.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Solicitudes pendientes */}
        {pendientes.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              Solicitudes pendientes
              <span className="text-xs font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">{pendientes.length}</span>
            </h2>
            <div className="space-y-3">
              {pendientes.map(s => (
                <div key={s.id} className="p-4 rounded-xl border border-orange-500/20" style={{ background: 'var(--color-card-bg)' }}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{s.nombre || 'Sin nombre'}</p>
                      <p className="text-xs text-[#7ca19b] truncate">{s.email || 'Sin email'}</p>
                      <p className="text-[0.6rem] text-white/20 mt-1">
                        {new Date(s.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
                    <div className="flex-1">
                      <label className="text-[0.6rem] text-white/30 font-bold uppercase tracking-wider block mb-1">Materia</label>
                      <select
                        value={s.materia_id ?? ''}
                        onChange={e => updateField(s.id, 'materia_id', e.target.value || null)}
                        className="w-full p-2 rounded-lg bg-[#0f2825] text-white text-xs border border-white/10 outline-none focus:border-[#00c7b1] transition cursor-pointer"
                      >
                        <option value="">Seleccionar materia...</option>
                        {materias.map(m => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full sm:w-32">
                      <label className="text-[0.6rem] text-white/30 font-bold uppercase tracking-wider block mb-1">Rol</label>
                      <select
                        value={s.rol}
                        onChange={e => updateField(s.id, 'rol', e.target.value)}
                        className="w-full p-2 rounded-lg bg-[#0f2825] text-white text-xs border border-white/10 outline-none focus:border-[#00c7b1] transition cursor-pointer"
                      >
                        <option value="profesor">Profesor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex gap-2 sm:ml-2">
                      <button
                        onClick={() => aprobar(s.id, s.materia_id, s.rol)}
                        disabled={saving === s.id || (!s.materia_id && s.rol === 'profesor')}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold text-white transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #00c7b1, #058c70)' }}
                      >
                        {saving === s.id ? '...' : 'Aprobar'}
                      </button>
                      <button
                        onClick={() => rechazar(s.id)}
                        disabled={saving === s.id}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold text-red-400 border border-red-400/20 hover:bg-red-500/10 transition cursor-pointer disabled:opacity-30"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                  {!s.materia_id && s.rol === 'profesor' && (
                    <p className="text-[0.6rem] text-orange-400 mt-2">Seleccioná una materia para poder aprobar</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profesores aprobados */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Profesores activos</h2>
          {aprobados.length === 0 ? (
            <p className="text-sm text-white/30">No hay profesores aprobados.</p>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: 'var(--color-card-bg)' }}>
              {aprobados.map((s, i) => (
                <div key={s.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-white/5' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{s.nombre || s.email || 'Sin nombre'}</p>
                    <p className="text-xs text-white/30 truncate">{s.email}</p>
                  </div>
                  <span className="text-xs text-[#00c7b1] font-medium whitespace-nowrap">
                    {s.rol === 'admin' ? 'Admin' : getMateriaLabel(s.materia_id)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
