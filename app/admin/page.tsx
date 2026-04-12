'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-auth';

interface Profesor {
  rol: 'admin' | 'profesor';
}

interface Solicitud {
  id: string;
  user_id: string;
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const loadSolicitudes = useCallback(async () => {
    const [{ data: sols }, { data: mats }] = await Promise.all([
      supabase.from('profesores').select('id, user_id, nombre, email, estado, rol, materia_id, created_at').order('created_at', { ascending: false }),
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
      setCurrentUserId(user.id);
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

  const eliminar = async (id: string, email: string | null) => {
    if (!confirm(`¿Eliminar a ${email || 'este profesor'}? Se perderá su acceso.`)) return;
    setSaving(id);
    await supabase.from('profesores').delete().eq('id', id);
    await loadSolicitudes();
    setSaving(null);
  };

  const updateField = (id: string, field: string, value: string | null) => {
    setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--admin-bg)' }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin" />
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
    {
      title: 'Alumnos CAU',
      description: 'Listado de alumnos, datos personales, analíticos y pagos',
      href: '/admin/alumnos',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2 2 0 013 17.16V15.87a4.5 4.5 0 018.243-2.664M12.75 7.5a3 3 0 11-6 0 3 3 0 016 0zm8.25 2.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
    },
  ];

  const getMateriaLabel = (id: string | null) => materias.find(m => m.id === id)?.label ?? '—';

  return (
    <div className="min-h-screen" style={{ background: 'var(--admin-bg)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* Navegación */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6 text-center">¿Qué querés administrar?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map((card) => (
              <button
                key={card.href}
                onClick={() => router.push(card.href)}
                className="group p-6 rounded-2xl border text-left transition hover:bg-white/[0.03] cursor-pointer"
                style={{ background: 'var(--admin-card)', borderColor: 'var(--admin-border)' }}
              >
                <div className="mb-4 group-hover:scale-110 transition-transform" style={{ color: 'var(--admin-accent)' }}>
                  {card.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{card.title}</h3>
                <p className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>{card.description}</p>
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
                <div key={s.id} className="p-4 rounded-xl border border-orange-500/20" style={{ background: 'var(--admin-card)' }}>
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
                        className="w-full p-2 rounded-lg bg-[var(--admin-input)] text-white text-xs border border-white/10 outline-none focus:border-[var(--admin-accent)] transition cursor-pointer"
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
                        className="w-full p-2 rounded-lg bg-[var(--admin-input)] text-white text-xs border border-white/10 outline-none focus:border-[var(--admin-accent)] transition cursor-pointer"
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
                        style={{ background: 'var(--admin-accent)' }}
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
            <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--admin-card)', borderColor: 'var(--admin-border)' }}>
              {aprobados.map((s, i) => (
                <div key={s.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-white/5' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{s.nombre || s.email || 'Sin nombre'}</p>
                    <p className="text-xs text-white/30 truncate">{s.email}</p>
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--admin-accent)' }}>
                    {s.rol === 'admin' ? 'Admin' : getMateriaLabel(s.materia_id)}
                  </span>
                  {s.user_id !== currentUserId && (
                    <button
                      onClick={() => eliminar(s.id, s.email)}
                      disabled={saving === s.id}
                      className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer disabled:opacity-30"
                      title="Eliminar profesor"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
