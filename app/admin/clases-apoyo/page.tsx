'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-auth';

interface Materia {
  id: string;
  slug: string;
  label: string;
  nombre_profesor: string;
  whatsapp: string;
  telefono_display: string;
  descripcion: string[];
  imagenes: string[];
  dias_bloqueados: string[];
  horarios_bloqueados: string[];
  en_construccion: boolean;
  modo_manana: boolean;
}

interface Profesor {
  rol: 'admin' | 'profesor';
  materia_id: string | null;
}

const supabase = createSupabaseBrowser();

/* ── Helpers ── */
function buildMonthWeeks(year: number, month: number) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const weeks: { num: number; dateStr: string; past: boolean; empty: boolean }[][] = [];
  let currentWeek: typeof weeks[0] = [];

  const firstDow = firstDay.getDay();
  const moStart = firstDow === 0 ? -1 : firstDow - 1;
  if (moStart > 0 && moStart <= 4) {
    for (let i = 0; i < moStart; i++) currentWeek.push({ num: 0, dateStr: '', past: true, empty: true });
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const past = dateStr < todayStr;
    currentWeek.push({ num: d, dateStr, past, empty: false });
    if (dow === 5) { weeks.push(currentWeek); currentWeek = []; }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 5) currentWeek.push({ num: 0, dateStr: '', past: true, empty: true });
    weeks.push(currentWeek);
  }
  return weeks;
}

function buildHours(modoManana: boolean) {
  const start = modoManana ? 8 : 14;
  return Array.from({ length: 20 - start }, (_, i) => {
    const h = start + i;
    return `${h}:00-${h + 1}:00`;
  });
}

/* ── Toast ── */
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg animate-[fadeInUp_0.3s_ease]"
      style={{ background: 'linear-gradient(135deg, #00c7b1, #058c70)' }}>
      {message}
    </div>
  );
}

/* ── Section: Descripción ── */
function DescripcionEditor({ materia, onSave }: { materia: Materia; onSave: (desc: string[]) => void }) {
  const [bullets, setBullets] = useState<string[]>(materia.descripcion);
  const [saving, setSaving] = useState(false);
  const refs = useRef<(HTMLTextAreaElement | null)[]>([]);

  useEffect(() => { setBullets(materia.descripcion); }, [materia.descripcion]);

  const update = (i: number, val: string) => { const next = [...bullets]; next[i] = val; setBullets(next); };
  const remove = (i: number) => setBullets(bullets.filter((_, j) => j !== i));
  const add = () => { if (bullets.length < 5) setBullets([...bullets, '']); };

  const toggleBold = (i: number) => {
    const ta = refs.current[i];
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = bullets[i];
    if (start === end) return;
    const selected = text.slice(start, end);
    const isBold = selected.startsWith('<strong>') && selected.endsWith('</strong>');
    let newText: string;
    if (isBold) {
      newText = text.slice(0, start) + selected.slice(8, -9) + text.slice(end);
    } else {
      newText = text.slice(0, start) + `<strong>${selected}</strong>` + text.slice(end);
    }
    update(i, newText);
  };

  const save = async () => {
    setSaving(true);
    const clean = bullets.filter(b => b.trim());
    const { error } = await supabase.from('materias').update({ descripcion: clean }).eq('id', materia.id);
    if (!error) onSave(clean);
    setSaving(false);
  };

  return (
    <div className="admin-section">
      <h3 className="admin-section-title">Descripción</h3>
      <div className="space-y-2.5">
        {bullets.map((b, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 space-y-1">
              <textarea
                ref={el => { refs.current[i] = el; }}
                value={b}
                onChange={e => update(i, e.target.value)}
                rows={2}
                className="admin-input w-full resize-none"
                placeholder={`Punto ${i + 1}...`}
              />
              <button onClick={() => toggleBold(i)} className="admin-btn-small" title="Seleccioná texto y hacé click para negrita">
                <strong>B</strong>
              </button>
            </div>
            <button onClick={() => remove(i)} className="mt-2 text-red-400/40 hover:text-red-400 text-lg transition cursor-pointer">&times;</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        {bullets.length < 5 && <button onClick={add} className="admin-btn-outline">+ Agregar</button>}
        <button onClick={save} disabled={saving} className="admin-btn-primary ml-auto">{saving ? 'Guardando...' : 'Guardar'}</button>
      </div>
    </div>
  );
}

/* ── Section: Imágenes ── */
function ImagenesEditor({ materia, onSave }: { materia: Materia; onSave: (imgs: string[]) => void }) {
  const [imagenes, setImagenes] = useState<string[]>(materia.imagenes);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setImagenes(materia.imagenes); }, [materia.imagenes]);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${materia.slug}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('clases-apoyo').upload(path, file, { upsert: true });
    if (error) { alert('Error al subir: ' + error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('clases-apoyo').getPublicUrl(path);
    const next = [...imagenes, publicUrl];
    const { error: dbError } = await supabase.from('materias').update({ imagenes: next }).eq('id', materia.id);
    if (!dbError) { setImagenes(next); onSave(next); }
    setUploading(false);
  };

  const remove = async (i: number) => {
    const next = imagenes.filter((_, j) => j !== i);
    const { error } = await supabase.from('materias').update({ imagenes: next }).eq('id', materia.id);
    if (!error) { setImagenes(next); onSave(next); }
  };

  return (
    <div className="admin-section">
      <h3 className="admin-section-title">Imágenes</h3>
      <div className="flex gap-3 flex-wrap">
        {imagenes.map((img, i) => (
          <div key={i} className="relative group">
            <img src={img} alt={`Imagen ${i + 1}`} className="w-32 h-24 object-cover rounded-xl border border-white/10" />
            <button onClick={() => remove(i)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer shadow-lg">
              &times;
            </button>
          </div>
        ))}
        {imagenes.length < 3 && (
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-32 h-24 rounded-xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center text-white/30 hover:border-[#00c7b1]/50 hover:text-[#00c7b1] transition cursor-pointer disabled:opacity-50 gap-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            <span className="text-[0.6rem] font-medium">{uploading ? 'Subiendo...' : 'Subir'}</span>
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) upload(e.target.files[0]); e.target.value = ''; }} />
    </div>
  );
}

/* ── Section: Calendario bloqueado ── */
function DiasBloqueadosEditor({ materia, onSave }: { materia: Materia; onSave: (dias: string[]) => void }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [bloqueados, setBloqueados] = useState<Set<string>>(new Set(materia.dias_bloqueados));
  const [saving, setSaving] = useState(false);

  useEffect(() => { setBloqueados(new Set(materia.dias_bloqueados)); }, [materia.dias_bloqueados]);

  const weeks = useMemo(() => buildMonthWeeks(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthName = new Date(viewYear, viewMonth).toLocaleString('es-AR', { month: 'long' });

  const canGoPrev = viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth > now.getMonth());
  const goNext = () => { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1); };
  const goPrev = () => { if (!canGoPrev) return; if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1); };

  const toggle = (dateStr: string) => {
    const next = new Set(bloqueados);
    if (next.has(dateStr)) next.delete(dateStr); else next.add(dateStr);
    setBloqueados(next);
  };

  const save = async () => {
    setSaving(true);
    const arr = Array.from(bloqueados).sort();
    const { error } = await supabase.from('materias').update({ dias_bloqueados: arr }).eq('id', materia.id);
    if (!error) onSave(arr);
    setSaving(false);
  };

  const blockedCount = Array.from(bloqueados).filter(d => d >= `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`).length;

  return (
    <div className="admin-section">
      <h3 className="admin-section-title">Días bloqueados <span className="text-white/30 font-normal">({blockedCount} activos)</span></h3>
      <p className="text-xs text-white/40 mb-3">Click en un día para bloquearlo/desbloquearlo.</p>

      <div className="rounded-xl border border-white/10 p-4 max-w-xs" style={{ background: 'rgba(0,0,0,0.2)' }}>
        {/* Nav */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={goPrev} disabled={!canGoPrev}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 disabled:opacity-20 transition cursor-pointer">
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm font-bold text-white capitalize">{monthName} {viewYear}</span>
          <button onClick={goNext}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition cursor-pointer">
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        {/* Headers */}
        <div className="grid grid-cols-5 gap-1 mb-1">
          {['Lu', 'Ma', 'Mi', 'Ju', 'Vi'].map(d => (
            <div key={d} className="text-[0.6rem] text-white/30 text-center font-bold uppercase">{d}</div>
          ))}
        </div>
        {/* Days */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-5 gap-1">
            {week.map((day, di) => {
              if (day.empty) return <div key={di} />;
              const blocked = bloqueados.has(day.dateStr);
              return (
                <button
                  key={di}
                  onClick={() => !day.past && toggle(day.dateStr)}
                  disabled={day.past}
                  className={`text-xs rounded-lg py-1.5 transition cursor-pointer disabled:cursor-default font-medium ${
                    day.past ? 'text-white/10' :
                    blocked ? 'bg-red-500/70 text-white' :
                    'text-white/70 hover:bg-[#00c7b1]/20 hover:text-white'
                  }`}
                >
                  {day.num}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <button onClick={save} disabled={saving} className="admin-btn-primary mt-3">{saving ? 'Guardando...' : 'Guardar días'}</button>
    </div>
  );
}

/* ── Section: Horarios bloqueados ── */
function HorariosBloqueadosEditor({ materia, onSave, onToggleModoManana }: { materia: Materia; onSave: (h: string[]) => void; onToggleModoManana: (v: boolean) => void }) {
  const [bloqueados, setBloqueados] = useState<Set<string>>(new Set(materia.horarios_bloqueados));
  const [saving, setSaving] = useState(false);
  const hours = buildHours(materia.modo_manana);

  useEffect(() => { setBloqueados(new Set(materia.horarios_bloqueados)); }, [materia.horarios_bloqueados]);

  const toggle = (h: string) => {
    const next = new Set(bloqueados);
    if (next.has(h)) next.delete(h); else next.add(h);
    setBloqueados(next);
  };

  const save = async () => {
    setSaving(true);
    const arr = Array.from(bloqueados).sort();
    const { error } = await supabase.from('materias').update({ horarios_bloqueados: arr }).eq('id', materia.id);
    if (!error) onSave(arr);
    setSaving(false);
  };

  const handleModoManana = async (checked: boolean) => {
    const { error } = await supabase.from('materias').update({ modo_manana: checked }).eq('id', materia.id);
    if (!error) onToggleModoManana(checked);
  };

  return (
    <div className="admin-section">
      <h3 className="admin-section-title">Horarios</h3>

      {/* Toggle modo mañana */}
      <label className="flex items-center gap-3 mb-4 cursor-pointer group">
        <div className={`relative w-10 h-5 rounded-full transition ${materia.modo_manana ? 'bg-[#00c7b1]' : 'bg-white/15'}`}
          onClick={() => handleModoManana(!materia.modo_manana)}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${materia.modo_manana ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
        <span className="text-sm text-white/70 group-hover:text-white transition">
          Horarios de mañana {materia.modo_manana ? <span className="text-[#00c7b1] font-semibold">(8:00 — 20:00)</span> : <span className="text-white/40">(14:00 — 20:00)</span>}
        </span>
      </label>

      <p className="text-xs text-white/40 mb-3">Click en un horario para bloquearlo/desbloquearlo globalmente.</p>
      <div className="flex flex-wrap gap-2">
        {hours.map(h => {
          const blocked = bloqueados.has(h);
          const label = h.split('-')[0];
          return (
            <button
              key={h}
              onClick={() => toggle(h)}
              className={`text-xs px-3.5 py-2 rounded-lg border font-medium transition cursor-pointer ${
                blocked
                  ? 'bg-red-500/70 border-red-500/30 text-white'
                  : 'border-white/10 text-white/50 hover:border-[#00c7b1]/50 hover:text-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <button onClick={save} disabled={saving} className="admin-btn-primary mt-3">{saving ? 'Guardando...' : 'Guardar horarios'}</button>
    </div>
  );
}

/* ── Section: Preview ── */
function PreviewSection({ materia }: { materia: Materia }) {
  return (
    <div className="admin-section">
      <h3 className="admin-section-title">Preview</h3>
      <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
        {/* Images */}
        {materia.imagenes.length > 0 && (
          <div className="flex gap-0 overflow-hidden h-36">
            {materia.imagenes.map((img, i) => (
              <img key={i} src={img} alt="" className="h-full flex-1 object-cover" />
            ))}
          </div>
        )}
        {/* Content */}
        <div className="p-5">
          <h4 className="text-lg font-bold text-white mb-3">{materia.label}</h4>
          <ul className="space-y-2">
            {materia.descripcion.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00c7b1] shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: d }} />
              </li>
            ))}
          </ul>
          {/* Blocked info */}
          {(materia.dias_bloqueados.length > 0 || materia.horarios_bloqueados.length > 0) && (
            <div className="mt-4 pt-3 border-t border-white/10 text-xs text-white/30 space-y-1">
              {materia.dias_bloqueados.length > 0 && <p>{materia.dias_bloqueados.length} día(s) bloqueado(s)</p>}
              {materia.horarios_bloqueados.length > 0 && <p>{materia.horarios_bloqueados.length} horario(s) bloqueado(s)</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function AdminClasesApoyo() {
  const [profesor, setProfesor] = useState<Profesor | null>(null);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const router = useRouter();

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/admin/login'); return; }

    const { data: prof } = await supabase.from('profesores').select('rol, materia_id').eq('user_id', user.id).single();
    if (!prof) { router.replace('/admin/login'); return; }
    setProfesor(prof);

    let query = supabase.from('materias')
      .select('id, slug, label, nombre_profesor, whatsapp, telefono_display, descripcion, imagenes, dias_bloqueados, horarios_bloqueados, en_construccion, modo_manana')
      .eq('activa', true)
      .order('orden', { ascending: true });

    if (prof.rol === 'profesor' && prof.materia_id) {
      query = query.eq('id', prof.materia_id);
    }

    const { data: mats } = await query;
    setMaterias((mats ?? []) as Materia[]);
    setLoading(false);
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateMateria = (id: string, partial: Partial<Materia>) => {
    setMaterias(prev => prev.map(m => m.id === id ? { ...m, ...partial } : m));
    setToast('Guardado');
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
          <span className="text-white/50 text-sm">Cargando panel...</span>
        </div>
      </div>
    );
  }

  const mat = materias[activeTab];

  return (
    <>
      <style>{`
        .admin-section { margin-bottom: 2rem; }
        .admin-section-title { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.35); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
        .admin-input { padding: 0.6rem 0.75rem; border-radius: 0.5rem; background: rgba(255,255,255,0.05); color: white; font-size: 0.8rem; border: 1px solid rgba(255,255,255,0.08); outline: none; transition: border-color 0.2s; }
        .admin-input:focus { border-color: rgba(0,199,177,0.5); }
        .admin-btn-primary { font-size: 0.75rem; font-weight: 700; color: white; background: linear-gradient(135deg, #00c7b1, #058c70); padding: 0.45rem 1.1rem; border-radius: 0.5rem; cursor: pointer; transition: opacity 0.2s; border: none; }
        .admin-btn-primary:disabled { opacity: 0.5; cursor: default; }
        .admin-btn-primary:hover:not(:disabled) { opacity: 0.85; }
        .admin-btn-outline { font-size: 0.7rem; font-weight: 600; color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.12); padding: 0.4rem 0.9rem; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; background: transparent; }
        .admin-btn-outline:hover { border-color: rgba(0,199,177,0.4); color: #00c7b1; }
        .admin-btn-small { font-size: 0.65rem; font-weight: 700; color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.1); padding: 0.2rem 0.6rem; border-radius: 0.35rem; cursor: pointer; transition: all 0.2s; background: transparent; }
        .admin-btn-small:hover { border-color: rgba(0,199,177,0.4); color: #00c7b1; }
        @keyframes fadeInUp { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      <div className="min-h-screen" style={{ background: '#0a1612' }}>
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5" style={{ background: 'rgba(10,22,18,0.85)' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: 'linear-gradient(135deg, #00c7b1, #058c70)' }}>
                C
              </div>
              <div>
                <h1 className="text-sm font-bold text-white leading-none">Clases de Apoyo</h1>
                <p className="text-[0.6rem] text-white/30 mt-0.5">
                  {profesor?.rol === 'admin' ? 'Administrador' : mat?.label}
                </p>
              </div>
            </div>
            <button onClick={logout} className="text-[0.65rem] text-white/30 hover:text-red-400 transition cursor-pointer">
              Salir
            </button>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {/* Tabs */}
          {materias.length > 1 && (
            <div className="flex gap-1 mb-8 overflow-x-auto pb-1 -mx-1 px-1">
              {materias.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setActiveTab(i)}
                  className={`text-xs px-4 py-2 rounded-lg whitespace-nowrap transition cursor-pointer font-semibold ${
                    i === activeTab
                      ? 'bg-white/10 text-white'
                      : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {mat && (
            <div>
              <DescripcionEditor materia={mat} onSave={desc => updateMateria(mat.id, { descripcion: desc })} />
              <ImagenesEditor materia={mat} onSave={imgs => updateMateria(mat.id, { imagenes: imgs })} />
              <DiasBloqueadosEditor materia={mat} onSave={dias => updateMateria(mat.id, { dias_bloqueados: dias })} />
              <HorariosBloqueadosEditor
                materia={mat}
                onSave={h => updateMateria(mat.id, { horarios_bloqueados: h })}
                onToggleModoManana={v => updateMateria(mat.id, { modo_manana: v })}
              />
              <PreviewSection materia={mat} />
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  );
}
