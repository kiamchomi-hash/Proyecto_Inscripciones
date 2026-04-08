'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-auth';

interface Alumno {
  legajo: string;
  nombre: string;
  fecha_ingreso: string | null;
  matricula_paga: boolean;
  tickets_vencidos: number;
  participo: boolean;
  email_primario: string | null;
  email_secundario: string | null;
  documento: string | null;
  fecha_nacimiento: string | null;
  edad: number | null;
  sexo: string | null;
  domicilio_calle: string | null;
  domicilio_numero: string | null;
  domicilio_localidad: string | null;
  domicilio_cp: string | null;
  telefono_principal: string | null;
  telefono_secundario: string | null;
  plan: string | null;
  carrera: string | null;
  promedio_sin_aplazos: number | null;
  promedio_con_aplazos: number | null;
  synced_at: string | null;
}

interface Analitico {
  tipo: string;
  trimestre: number | null;
  materia: string;
  creditos: number | null;
  fecha: string | null;
  calificacion: string | null;
  turno: string | null;
  regularidad: string | null;
}

interface Pago {
  nro_ticket: string | null;
  fecha_vencimiento: string | null;
  fecha_pago: string | null;
}

function formatFecha(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toISO(dateStr: string) {
  return dateStr; // ya viene como YYYY-MM-DD del input type=date
}

export default function AlumnosPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  // Solo accesible en desarrollo local
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      router.replace('/admin');
    }
  }, [router]);

  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Fecha desde: default 14 días atrás
  const defaultDesde = new Date();
  defaultDesde.setDate(defaultDesde.getDate() - 14);
  const [fechaDesde, setFechaDesde] = useState(defaultDesde.toISOString().split('T')[0]);

  // Modal
  const [selected, setSelected] = useState<Alumno | null>(null);
  const [modalTab, setModalTab] = useState<'datos' | 'analitico' | 'pagos'>('datos');
  const [analiticos, setAnaliticos] = useState<Analitico[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  const fetchAlumnos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('alumnos_cau')
      .select('*')
      .gte('fecha_ingreso', toISO(fechaDesde))
      .order('fecha_ingreso', { ascending: false });

    if (error) console.error('Error cargando alumnos:', error.message);
    setAlumnos(data ?? []);
    setLoading(false);
  }, [supabase, fechaDesde]);

  useEffect(() => { fetchAlumnos(); }, [fetchAlumnos]);

  const triggerSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await fetch('/api/admin/sync-alumnos', { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        setSyncMsg('Sincronización disparada. Los datos se actualizarán en unos minutos.');
      } else {
        setSyncMsg(`Error: ${json.error}`);
      }
    } catch {
      setSyncMsg('Error de red al disparar sync');
    }
    setSyncing(false);
  };

  const openModal = async (alumno: Alumno) => {
    setSelected(alumno);
    setModalTab('datos');
    setLoadingModal(true);

    const [{ data: ana }, { data: pag }] = await Promise.all([
      supabase.from('alumnos_analiticos').select('*').eq('legajo', alumno.legajo).order('trimestre'),
      supabase.from('alumnos_pagos').select('*').eq('legajo', alumno.legajo),
    ]);

    setAnaliticos(ana ?? []);
    setPagos(pag ?? []);
    setLoadingModal(false);
  };

  const lastSync = alumnos[0]?.synced_at
    ? new Date(alumnos[0].synced_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="min-h-screen" style={{ background: '#0a1612' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5" style={{ background: 'rgba(10,22,18,0.85)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-white/40 hover:text-white transition cursor-pointer">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">Alumnos CAU</h1>
              <p className="text-[0.6rem] text-white/30 mt-0.5">eCampus — EDHome Villa Lugano</p>
            </div>
          </div>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition cursor-pointer disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #00c7b1, #058c70)' }}
          >
            <svg className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Sync message */}
        {syncMsg && (
          <div className={`text-xs px-3 py-2 rounded-lg ${syncMsg.includes('Error') ? 'bg-red-500/10 text-red-400' : 'bg-[#00c7b1]/10 text-[#00c7b1]'}`}>
            {syncMsg}
          </div>
        )}

        {/* Filtro + info */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
          <div>
            <label className="text-[0.65rem] text-white/30 font-bold uppercase tracking-wider block mb-1">Fecha desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[#0f2825] text-white text-sm border border-white/10 outline-none focus:border-[#00c7b1] transition"
            />
          </div>
          <div className="text-right">
            <p className="text-xs text-white/30">{alumnos.length} alumno{alumnos.length !== 1 ? 's' : ''}</p>
            {lastSync && <p className="text-[0.6rem] text-white/20">Última sync: {lastSync}</p>}
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-[#00c7b1] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : alumnos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/30 text-sm">No hay alumnos en el rango seleccionado.</p>
            <p className="text-white/20 text-xs mt-1">Probá sincronizar o cambiar la fecha.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 overflow-x-auto" style={{ background: 'var(--color-card-bg)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-[0.65rem] text-white/30 font-bold uppercase tracking-wider">Legajo</th>
                  <th className="text-left px-4 py-3 text-[0.65rem] text-white/30 font-bold uppercase tracking-wider">Alumno</th>
                  <th className="text-left px-4 py-3 text-[0.65rem] text-white/30 font-bold uppercase tracking-wider hidden sm:table-cell">Carrera</th>
                  <th className="text-left px-4 py-3 text-[0.65rem] text-white/30 font-bold uppercase tracking-wider">Ingreso</th>
                  <th className="text-center px-4 py-3 text-[0.65rem] text-white/30 font-bold uppercase tracking-wider">Matrícula</th>
                  <th className="text-center px-4 py-3 text-[0.65rem] text-white/30 font-bold uppercase tracking-wider">Tickets</th>
                  <th className="text-center px-4 py-3 text-[0.65rem] text-white/30 font-bold uppercase tracking-wider">Participó</th>
                </tr>
              </thead>
              <tbody>
                {alumnos.map((a, i) => (
                  <tr
                    key={a.legajo}
                    onClick={() => openModal(a)}
                    className={`cursor-pointer hover:bg-white/[0.03] transition ${i > 0 ? 'border-t border-white/5' : ''}`}
                  >
                    <td className="px-4 py-3 text-[#00c7b1] font-mono text-xs">{a.legajo}</td>
                    <td className="px-4 py-3 text-white">{a.nombre}</td>
                    <td className="px-4 py-3 text-white/40 text-xs hidden sm:table-cell max-w-48 truncate">{a.carrera || '—'}</td>
                    <td className="px-4 py-3 text-white/60">{formatFecha(a.fecha_ingreso)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.matricula_paga ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                        {a.matricula_paga ? 'SI' : 'NO'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-white/60">{a.tickets_vencidos}</td>
                    <td className="px-4 py-3 text-center text-white/60">{a.participo ? 'SI' : 'NO'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 p-6"
            style={{ background: '#0f1f1b' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">{selected.nombre}</h2>
                <p className="text-xs text-[#00c7b1] font-mono mt-0.5">{selected.legajo}</p>
                {selected.carrera && <p className="text-xs text-white/40 mt-1">{selected.carrera}</p>}
              </div>
              <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white transition cursor-pointer p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-white/5 rounded-lg p-1">
              {(['datos', 'analitico', 'pagos'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setModalTab(tab)}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-bold transition cursor-pointer ${
                    modalTab === tab ? 'bg-[#00c7b1]/20 text-[#00c7b1]' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {tab === 'datos' ? 'Datos Personales' : tab === 'analitico' ? 'Analítico' : 'Pagos'}
                </button>
              ))}
            </div>

            {loadingModal ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-[#00c7b1] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Tab: Datos Personales */}
                {modalTab === 'datos' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Documento" value={selected.documento} />
                      <Field label="Sexo" value={selected.sexo} />
                      <Field label="Fecha nacimiento" value={formatFecha(selected.fecha_nacimiento)} />
                      <Field label="Edad" value={selected.edad?.toString()} />
                      <Field label="Email primario" value={selected.email_primario} />
                      <Field label="Email secundario" value={selected.email_secundario} />
                      <Field label="Teléfono principal" value={selected.telefono_principal} />
                      <Field label="Teléfono secundario" value={selected.telefono_secundario} />
                    </div>
                    <div className="border-t border-white/5 pt-4">
                      <p className="text-[0.65rem] text-white/30 font-bold uppercase tracking-wider mb-3">Domicilio</p>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Calle" value={selected.domicilio_calle} />
                        <Field label="Número" value={selected.domicilio_numero} />
                        <Field label="Localidad" value={selected.domicilio_localidad} />
                        <Field label="Código Postal" value={selected.domicilio_cp} />
                      </div>
                    </div>
                    <div className="border-t border-white/5 pt-4">
                      <p className="text-[0.65rem] text-white/30 font-bold uppercase tracking-wider mb-3">Académico</p>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Matrícula paga" value={selected.matricula_paga ? 'SI' : 'NO'} />
                        <Field label="Fecha ingreso" value={formatFecha(selected.fecha_ingreso)} />
                        <Field label="Plan" value={selected.plan} />
                        <Field label="Promedio (sin aplazos)" value={selected.promedio_sin_aplazos?.toString()} />
                        <Field label="Promedio (con aplazos)" value={selected.promedio_con_aplazos?.toString()} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Analítico */}
                {modalTab === 'analitico' && (
                  <div className="space-y-6">
                    {/* Info carrera y promedios */}
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-white/[0.03] border border-white/5">
                      <div className="col-span-2">
                        <p className="text-[0.6rem] text-white/30 font-bold uppercase tracking-wider mb-0.5">Carrera</p>
                        <p className="text-sm text-white">{selected.carrera || '—'}</p>
                      </div>
                      <Field label="Plan" value={selected.plan} />
                      <Field label="Promedio sin aplazos" value={selected.promedio_sin_aplazos?.toString() ?? '0'} />
                      <Field label="Promedio con aplazos" value={selected.promedio_con_aplazos?.toString() ?? '0'} />
                    </div>

                    <MateriaSection title="Materias aprobadas" items={analiticos.filter(a => a.tipo === 'aprobada')} />
                    <MateriaSection title="Habilitadas para rendir" items={analiticos.filter(a => a.tipo === 'habilitada')} />
                    <MateriaSection title="Aplazos" items={analiticos.filter(a => a.tipo === 'aplazo')} />
                  </div>
                )}

                {/* Tab: Pagos */}
                {modalTab === 'pagos' && (
                  <div>
                    {pagos.length === 0 ? (
                      <p className="text-white/30 text-sm text-center py-8">Sin movimientos de pago.</p>
                    ) : (
                      <div className="space-y-2">
                        {pagos.map((p, i) => (
                          <div key={i} className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/[0.03] border border-white/5">
                            <div>
                              <p className="text-xs text-white font-mono">{p.nro_ticket || '—'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-white/60">Vence: {formatFecha(p.fecha_vencimiento)}</p>
                              <p className="text-xs text-[#00c7b1]">Pagado: {formatFecha(p.fecha_pago)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[0.6rem] text-white/30 font-bold uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-white">{value || '—'}</p>
    </div>
  );
}

function MateriaSection({ title, items }: { title: string; items: Analitico[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">{title} ({items.length})</h3>
      {items.length === 0 ? (
        <p className="text-xs text-white/20 py-3 px-4 rounded-lg border border-white/5">Sin registros</p>
      ) : (
      <div className="rounded-lg border border-white/5 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="text-left px-3 py-2 text-white/30 font-bold">Trim.</th>
              <th className="text-left px-3 py-2 text-white/30 font-bold">Materia</th>
              <th className="text-center px-3 py-2 text-white/30 font-bold">Fecha</th>
              <th className="text-center px-3 py-2 text-white/30 font-bold">Calif.</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m, i) => (
              <tr key={i} className={i > 0 ? 'border-t border-white/5' : ''}>
                <td className="px-3 py-2 text-white/50">{m.trimestre || '—'}</td>
                <td className="px-3 py-2 text-white">{m.materia}</td>
                <td className="px-3 py-2 text-center text-white/50">{formatFecha(m.fecha)}</td>
                <td className="px-3 py-2 text-center text-white/50">{m.calificacion || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
