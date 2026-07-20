'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-auth';
import { sanitizeContent } from '@/lib/sanitize-content';

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

/** Parse horarios_bloqueados: "14:00-15:00" = global, "2026-03-25|14:00-15:00" = per-day */
function parseHorariosBloqueados(arr: string[]) {
  const global = new Set<string>();
  const perDay = new Map<string, Set<string>>();
  for (const entry of arr) {
    const pipe = entry.indexOf('|');
    if (pipe === -1) {
      global.add(entry);
    } else {
      const date = entry.slice(0, pipe);
      const hour = entry.slice(pipe + 1);
      if (!perDay.has(date)) perDay.set(date, new Set());
      perDay.get(date)!.add(hour);
    }
  }
  return { global, perDay };
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

/* ── Rich Text Bullet Editor ── */
function RichBulletEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const internalRef = useRef(value);

  useEffect(() => {
    if (ref.current && internalRef.current !== value) {
      ref.current.innerHTML = value;
      internalRef.current = value;
    }
  }, [value]);

  const handleInput = () => {
    if (ref.current) {
      const html = ref.current.innerHTML
        .replace(/<b>/gi, '<strong>').replace(/<\/b>/gi, '</strong>')
        .replace(/<div>/gi, '').replace(/<\/div>/gi, '')
        .replace(/<br\s*\/?>/gi, '');
      internalRef.current = html;
      onChange(html);
    }
  };

  const applyBold = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    document.execCommand('bold', false);
    handleInput();
  };

  return (
    <div className="space-y-1">
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="admin-input w-full min-h-[2.5rem] whitespace-pre-wrap [&_strong]:font-bold [&_strong]:text-[#00c7b1]"
        style={{ lineHeight: '1.5' }}
        dangerouslySetInnerHTML={{ __html: sanitizeContent(value) }}
      />
      <button type="button" onClick={applyBold} className="admin-btn-small" title="Seleccioná texto y hacé click para negrita">
        <strong>B</strong>
      </button>
    </div>
  );
}

/* ── Section: Descripción ── */
function DescripcionEditor({ materia, onSave }: { materia: Materia; onSave: (desc: string[]) => void }) {
  const [bullets, setBullets] = useState<string[]>(materia.descripcion);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setBullets(materia.descripcion); }, [materia.descripcion]);

  const update = (i: number, val: string) => { const next = [...bullets]; next[i] = val; setBullets(next); };
  const remove = (i: number) => setBullets(bullets.filter((_, j) => j !== i));
  const add = () => { if (bullets.length < 5) setBullets([...bullets, '']); };

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
            <div className="flex-1">
              <RichBulletEditor value={b} onChange={val => update(i, val)} />
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

/* ── Section: Calendario unificado (días + horarios) ── */
function CalendarioEditor({ materia, onSaveDias, onSaveHorarios, onToggleModoManana }: {
  materia: Materia;
  onSaveDias: (dias: string[]) => void;
  onSaveHorarios: (h: string[]) => void;
  onToggleModoManana: (v: boolean) => void;
}) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [diasBloqueados, setDiasBloqueados] = useState<Set<string>>(new Set(materia.dias_bloqueados));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDiasBloqueados(new Set(materia.dias_bloqueados)); }, [materia.dias_bloqueados]);

  const { global: globalBlocked, perDay: perDayBlocked } = useMemo(() => parseHorariosBloqueados(materia.horarios_bloqueados), [materia.horarios_bloqueados]);
  const hours = buildHours(materia.modo_manana);
  const weeks = useMemo(() => buildMonthWeeks(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthName = new Date(viewYear, viewMonth).toLocaleString('es-AR', { month: 'long' });

  const canGoPrev = viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth > now.getMonth());
  const goNext = () => { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1); };
  const goPrev = () => { if (!canGoPrev) return; if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1); };

  const blockedDayCount = Array.from(diasBloqueados).filter(d => d >= todayStr).length;

  // Días bloqueados
  const toggleDia = (dateStr: string) => {
    const next = new Set(diasBloqueados);
    if (next.has(dateStr)) next.delete(dateStr); else next.add(dateStr);
    setDiasBloqueados(next);
  };

  const saveDias = async () => {
    setSaving(true);
    const arr = Array.from(diasBloqueados).sort();
    const { error } = await supabase.from('materias').update({ dias_bloqueados: arr }).eq('id', materia.id);
    if (!error) onSaveDias(arr);
    setSaving(false);
  };

  // Horarios
  const rebuildArray = (g: Set<string>, pd: Map<string, Set<string>>) => {
    const arr: string[] = [];
    for (const h of g) arr.push(h);
    for (const [date, hrs] of pd) { for (const h of hrs) arr.push(`${date}|${h}`); }
    return arr.sort();
  };

  const toggleGlobal = (h: string) => {
    const next = new Set(globalBlocked);
    if (next.has(h)) next.delete(h); else next.add(h);
    onSaveHorarios(rebuildArray(next, perDayBlocked));
  };

  const togglePerDay = (date: string, h: string) => {
    const nextPD = new Map(perDayBlocked);
    const daySet = new Set(nextPD.get(date) || []);
    if (daySet.has(h)) daySet.delete(h); else daySet.add(h);
    if (daySet.size === 0) nextPD.delete(date); else nextPD.set(date, daySet);
    onSaveHorarios(rebuildArray(globalBlocked, nextPD));
  };

  const saveHorarios = async () => {
    setSaving(true);
    await supabase.from('materias').update({ horarios_bloqueados: materia.horarios_bloqueados }).eq('id', materia.id);
    setSaving(false);
  };

  const handleModoManana = async (checked: boolean) => {
    const { error } = await supabase.from('materias').update({ modo_manana: checked }).eq('id', materia.id);
    if (!error) onToggleModoManana(checked);
  };

  const selectedDayHours = selectedDate ? (perDayBlocked.get(selectedDate) || new Set<string>()) : null;
  const selectedDateLabel = selectedDate ? (() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  })() : '';
  const isDiaCompleto = selectedDate ? diasBloqueados.has(selectedDate) : false;

  return (
    <div className="admin-section">
      <h3 className="admin-section-title">Calendario y horarios</h3>

      {/* Toggle modo mañana */}
      <label className="flex items-center gap-3 mb-4 cursor-pointer group">
        <div className={`relative w-10 h-5 rounded-full transition ${materia.modo_manana ? 'bg-[#00c7b1]' : 'bg-white/15'}`}
          onClick={() => handleModoManana(!materia.modo_manana)}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${materia.modo_manana ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
        <span className="text-sm text-white">
          Horarios de mañana {materia.modo_manana ? <span className="text-[#00c7b1] font-semibold">(8:00 — 20:00)</span> : <span className="text-white">(14:00 — 20:00)</span>}
        </span>
      </label>

      {/* Bloqueo global de horarios */}
      <div className="mb-5">
        <p className="text-xs text-white mb-2">Horarios bloqueados siempre:</p>
        <div className="flex flex-wrap gap-2">
          {hours.map(h => {
            const blocked = globalBlocked.has(h);
            return (
              <button key={h} onClick={() => toggleGlobal(h)}
                className={`text-xs px-3.5 py-2 rounded-lg border font-medium transition cursor-pointer ${
                  blocked ? 'bg-red-500/70 border-red-500/30 text-white' : 'border-white/10 text-white hover:border-[#00c7b1]/50'
                }`}>{h.split('-')[0]}</button>
            );
          })}
        </div>
      </div>

      {/* Calendario + panel lateral */}
      <p className="text-xs text-white mb-2">Seleccioná un día para bloquear el día completo o horarios puntuales:</p>
      <div className="flex gap-4 flex-col sm:flex-row">
        {/* Calendario */}
        <div className="rounded-xl border border-white/10 p-4 w-full sm:w-auto sm:min-w-[260px]" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <button onClick={goPrev} disabled={!canGoPrev}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 disabled:opacity-20 transition cursor-pointer">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-bold text-white capitalize">{monthName} {viewYear}</span>
            <button onClick={goNext}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition cursor-pointer">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-5 gap-1 mb-1">
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi'].map(d => (
              <div key={d} className="text-[0.6rem] text-white text-center font-bold uppercase">{d}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-5 gap-1">
              {week.map((day, di) => {
                if (day.empty) return <div key={di} />;
                const isSelected = selectedDate === day.dateStr;
                const isDiaBlock = diasBloqueados.has(day.dateStr);
                const hasHorarios = perDayBlocked.has(day.dateStr);
                return (
                  <button key={di} onClick={() => !day.past && setSelectedDate(isSelected ? null : day.dateStr)} disabled={day.past}
                    className={`text-xs rounded-lg py-1.5 transition cursor-pointer disabled:cursor-default font-medium relative ${
                      day.past ? 'text-white/30' :
                      isSelected ? 'bg-[#00c7b1] text-white' :
                      isDiaBlock ? 'bg-red-500/70 text-white' :
                      'text-white hover:bg-white/10'
                    }`}>
                    {day.num}
                    {hasHorarios && !isDiaBlock && !isSelected && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-400" />}
                  </button>
                );
              })}
            </div>
          ))}
          {blockedDayCount > 0 && (
            <p className="text-[0.65rem] text-white mt-3">{blockedDayCount} día(s) bloqueado(s)</p>
          )}
        </div>

        {/* Panel del día seleccionado */}
        {selectedDate ? (
          <div className="flex-1 rounded-xl border border-white/10 p-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <p className="text-sm font-bold text-white mb-3 capitalize">{selectedDateLabel}</p>

            {/* Bloquear día completo */}
            <button onClick={() => toggleDia(selectedDate)}
              className={`w-full text-xs px-4 py-2.5 rounded-lg border font-bold transition cursor-pointer mb-4 ${
                isDiaCompleto
                  ? 'bg-red-500/70 border-red-500/30 text-white'
                  : 'border-white/20 text-white hover:border-red-400/50 hover:bg-red-500/10'
              }`}>
              {isDiaCompleto ? 'Día completo bloqueado (click para desbloquear)' : 'Bloquear día completo'}
            </button>

            {/* Horarios del día */}
            {!isDiaCompleto && (
              <>
                <p className="text-xs text-white mb-2">Bloquear horarios puntuales:</p>
                <div className="flex flex-wrap gap-2">
                  {hours.map(h => {
                    const isGlobalBlocked = globalBlocked.has(h);
                    const isDayBlocked = selectedDayHours?.has(h);
                    return (
                      <button key={h} onClick={() => !isGlobalBlocked && togglePerDay(selectedDate, h)} disabled={isGlobalBlocked}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
                          isDayBlocked ? 'bg-orange-500/70 border-orange-500/30 text-white' :
                          'border-white/10 text-white hover:border-orange-400/50'
                        }`}>
                        {h.split('-')[0]}
                      </button>
                    );
                  })}
                </div>
                {selectedDayHours && selectedDayHours.size > 0 && (
                  <p className="text-[0.65rem] text-orange-400 mt-2">{selectedDayHours.size} horario(s) bloqueado(s) este día</p>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center rounded-xl border border-white/10 text-sm text-white py-12" style={{ background: 'rgba(0,0,0,0.1)' }}>
            Seleccioná un día del calendario
          </div>
        )}
      </div>

      {/* Botones guardar */}
      <div className="flex gap-3 mt-4">
        <button onClick={saveDias} disabled={saving} className="admin-btn-primary">{saving ? 'Guardando...' : 'Guardar días'}</button>
        <button onClick={saveHorarios} disabled={saving} className="admin-btn-primary">{saving ? 'Guardando...' : 'Guardar horarios'}</button>
      </div>
    </div>
  );
}

/* ── Section: Preview ── */
function PreviewSection({ materia }: { materia: Materia }) {
  return (
    <div className="admin-section">
      <h3 className="admin-section-title">Preview</h3>
      <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
        {materia.imagenes.length > 0 && (
          <div className="flex gap-0 overflow-hidden h-36">
            {materia.imagenes.map((img, i) => (
              <img key={i} src={img} alt="" className="h-full flex-1 object-cover" />
            ))}
          </div>
        )}
        <div className="p-5">
          <h4 className="text-lg font-bold text-white mb-3">{materia.label}</h4>
          <ul className="space-y-2">
            {materia.descripcion.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00c7b1] shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: sanitizeContent(d) }} />
              </li>
            ))}
          </ul>
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
        <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/5" style={{ background: 'rgba(10,22,18,0.85)' }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: 'linear-gradient(135deg, #00c7b1, #058c70)' }}>C</div>
              <div>
                <h1 className="text-sm font-bold text-white leading-none">Clases de Apoyo</h1>
                <p className="text-[0.6rem] text-white/30 mt-0.5">{profesor?.rol === 'admin' ? 'Administrador' : mat?.label}</p>
              </div>
            </div>
            <button onClick={logout} className="text-[0.65rem] text-white/30 hover:text-red-400 transition cursor-pointer">Salir</button>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {materias.length > 1 && (
            <div className="flex gap-1 mb-8 overflow-x-auto pb-1 -mx-1 px-1">
              {materias.map((m, i) => (
                <button key={m.id} onClick={() => setActiveTab(i)}
                  className={`text-xs px-4 py-2 rounded-lg whitespace-nowrap transition cursor-pointer font-semibold ${
                    i === activeTab ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                  }`}>{m.label}</button>
              ))}
            </div>
          )}

          {mat && (
            <div>
              <CalendarioEditor
                materia={mat}
                onSaveDias={dias => updateMateria(mat.id, { dias_bloqueados: dias })}
                onSaveHorarios={h => updateMateria(mat.id, { horarios_bloqueados: h })}
                onToggleModoManana={v => updateMateria(mat.id, { modo_manana: v })}
              />
              <DescripcionEditor materia={mat} onSave={desc => updateMateria(mat.id, { descripcion: desc })} />
              <ImagenesEditor materia={mat} onSave={imgs => updateMateria(mat.id, { imagenes: imgs })} />
              <PreviewSection materia={mat} />
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast('')} />}
    </>
  );
}
