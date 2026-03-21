'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-auth';

interface Materia {
  id: string;
  slug: string;
  label: string;
  nombre_profesor: string;
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
function buildCalendarWeeks() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = today.getDay();
  const anchor = new Date(today);
  if (dow === 0) anchor.setDate(today.getDate() + 1);
  else if (dow === 6) anchor.setDate(today.getDate() + 2);
  else anchor.setDate(today.getDate() + (1 - dow));

  return Array.from({ length: 4 }, (_, w) => {
    const mon = new Date(anchor);
    mon.setDate(anchor.getDate() + w * 7);
    const monthName = mon.toLocaleString('es-AR', { month: 'long' });
    const days = Array.from({ length: 5 }, (_, d) => {
      const cell = new Date(mon);
      cell.setDate(mon.getDate() + d);
      const dateStr = `${cell.getFullYear()}-${String(cell.getMonth() + 1).padStart(2, '0')}-${String(cell.getDate()).padStart(2, '0')}`;
      return { num: cell.getDate(), dateStr, past: cell < today };
    });
    return { label: w === 0 ? 'Actual' : w === 1 ? 'Próxima' : `+${w} sem`, month: monthName, days };
  });
}

function buildHours(modoManana: boolean) {
  const start = modoManana ? 8 : 14;
  return Array.from({ length: 20 - start }, (_, i) => {
    const h = start + i;
    return `${h}:00-${h + 1}:00`;
  });
}

/* ── Section Components ── */

function DescripcionEditor({ materia, onSave }: { materia: Materia; onSave: (desc: string[]) => void }) {
  const [bullets, setBullets] = useState<string[]>(materia.descripcion);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setBullets(materia.descripcion); }, [materia.descripcion]);

  const update = (i: number, val: string) => {
    const next = [...bullets];
    next[i] = val;
    setBullets(next);
  };
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
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-[#00c7b1] uppercase tracking-wider">Descripción</h3>
      {bullets.map((b, i) => (
        <div key={i} className="flex gap-2">
          <textarea
            value={b}
            onChange={e => update(i, e.target.value)}
            rows={2}
            className="flex-1 p-2.5 rounded-lg bg-[#0f2825] text-white text-sm border border-[#00c7b1]/20 outline-none focus:border-[#00c7b1] resize-none transition"
            placeholder={`Bullet ${i + 1}`}
          />
          <button onClick={() => remove(i)} className="text-red-400/60 hover:text-red-400 text-lg px-1 transition cursor-pointer" title="Eliminar">&times;</button>
        </div>
      ))}
      <div className="flex gap-2">
        {bullets.length < 5 && (
          <button onClick={add} className="text-xs text-[#00c7b1] hover:text-white border border-[#00c7b1]/30 rounded-lg px-3 py-1.5 transition cursor-pointer">
            + Agregar bullet
          </button>
        )}
        <button onClick={save} disabled={saving}
          className="text-xs text-white bg-[#00c7b1] hover:bg-[#00b3a0] rounded-lg px-4 py-1.5 font-bold disabled:opacity-50 transition cursor-pointer ml-auto">
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

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
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-[#00c7b1] uppercase tracking-wider">Imágenes</h3>
      <div className="flex gap-3 flex-wrap">
        {imagenes.map((img, i) => (
          <div key={i} className="relative group">
            <img src={img} alt={`Imagen ${i + 1}`} className="w-28 h-20 object-cover rounded-lg border border-[#00c7b1]/20" />
            <button onClick={() => remove(i)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
              &times;
            </button>
          </div>
        ))}
        {imagenes.length < 3 && (
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-28 h-20 rounded-lg border-2 border-dashed border-[#00c7b1]/30 flex items-center justify-center text-[#00c7b1]/50 hover:border-[#00c7b1] hover:text-[#00c7b1] transition cursor-pointer disabled:opacity-50">
            {uploading ? '...' : '+'}
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) upload(e.target.files[0]); e.target.value = ''; }} />
    </div>
  );
}

function DiasBloqueadosEditor({ materia, onSave }: { materia: Materia; onSave: (dias: string[]) => void }) {
  const [bloqueados, setBloqueados] = useState<Set<string>>(new Set(materia.dias_bloqueados));
  const [saving, setSaving] = useState(false);
  const weeks = buildCalendarWeeks();

  useEffect(() => { setBloqueados(new Set(materia.dias_bloqueados)); }, [materia.dias_bloqueados]);

  const toggle = (dateStr: string) => {
    const next = new Set(bloqueados);
    if (next.has(dateStr)) next.delete(dateStr);
    else next.add(dateStr);
    setBloqueados(next);
  };

  const save = async () => {
    setSaving(true);
    const arr = Array.from(bloqueados).sort();
    const { error } = await supabase.from('materias').update({ dias_bloqueados: arr }).eq('id', materia.id);
    if (!error) onSave(arr);
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-[#00c7b1] uppercase tracking-wider">Días bloqueados</h3>
      <p className="text-xs text-[#7ca19b]">Hacé click en un día para bloquearlo. Los alumnos no podrán reservar ese día.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {weeks.map((week, wi) => (
          <div key={wi} className="rounded-lg border border-[#00c7b1]/10 p-2">
            <div className="text-[0.6rem] text-[#7ca19b] uppercase tracking-wider mb-1.5 text-center">{week.label} — {week.month}</div>
            <div className="grid grid-cols-5 gap-1">
              {['L', 'M', 'X', 'J', 'V'].map(d => (
                <div key={d} className="text-[0.55rem] text-[#7ca19b]/50 text-center">{d}</div>
              ))}
              {week.days.map(day => {
                const blocked = bloqueados.has(day.dateStr);
                return (
                  <button
                    key={day.dateStr}
                    onClick={() => !day.past && toggle(day.dateStr)}
                    disabled={day.past}
                    className={`text-xs rounded py-1 transition cursor-pointer disabled:cursor-default ${
                      day.past ? 'text-[#7ca19b]/30' :
                      blocked ? 'bg-red-500/80 text-white font-bold' :
                      'text-white hover:bg-[#00c7b1]/20'
                    }`}
                  >
                    {day.num}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button onClick={save} disabled={saving}
        className="text-xs text-white bg-[#00c7b1] hover:bg-[#00b3a0] rounded-lg px-4 py-1.5 font-bold disabled:opacity-50 transition cursor-pointer">
        {saving ? 'Guardando...' : 'Guardar días'}
      </button>
    </div>
  );
}

function HorariosBloqueadosEditor({ materia, onSave }: { materia: Materia; onSave: (h: string[]) => void }) {
  const [bloqueados, setBloqueados] = useState<Set<string>>(new Set(materia.horarios_bloqueados));
  const [saving, setSaving] = useState(false);
  const hours = buildHours(materia.modo_manana);

  useEffect(() => { setBloqueados(new Set(materia.horarios_bloqueados)); }, [materia.horarios_bloqueados]);

  const toggle = (h: string) => {
    const next = new Set(bloqueados);
    if (next.has(h)) next.delete(h);
    else next.add(h);
    setBloqueados(next);
  };

  const save = async () => {
    setSaving(true);
    const arr = Array.from(bloqueados).sort();
    const { error } = await supabase.from('materias').update({ horarios_bloqueados: arr }).eq('id', materia.id);
    if (!error) onSave(arr);
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-[#00c7b1] uppercase tracking-wider">Horarios bloqueados</h3>
      <p className="text-xs text-[#7ca19b]">Hacé click en un horario para bloquearlo globalmente (todos los días).</p>
      <div className="flex flex-wrap gap-2">
        {hours.map(h => {
          const blocked = bloqueados.has(h);
          return (
            <button
              key={h}
              onClick={() => toggle(h)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                blocked
                  ? 'bg-red-500/80 border-red-500/50 text-white font-bold'
                  : 'border-[#00c7b1]/20 text-[#7ca19b] hover:border-[#00c7b1] hover:text-white'
              }`}
            >
              {h.split('-')[0]}
            </button>
          );
        })}
      </div>
      <button onClick={save} disabled={saving}
        className="text-xs text-white bg-[#00c7b1] hover:bg-[#00b3a0] rounded-lg px-4 py-1.5 font-bold disabled:opacity-50 transition cursor-pointer">
        {saving ? 'Guardando...' : 'Guardar horarios'}
      </button>
    </div>
  );
}

/* ── Main Page ── */
export default function AdminClasesApoyo() {
  const [profesor, setProfesor] = useState<Profesor | null>(null);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/admin/login'); return; }

    const { data: prof } = await supabase.from('profesores').select('rol, materia_id').eq('user_id', user.id).single();
    if (!prof) { router.replace('/admin/login'); return; }
    setProfesor(prof);

    let query = supabase.from('materias')
      .select('id, slug, label, nombre_profesor, descripcion, imagenes, dias_bloqueados, horarios_bloqueados, en_construccion, modo_manana')
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
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-deep-dark-bg)' }}>
        <div className="text-[#7ca19b]">Cargando panel...</div>
      </div>
    );
  }

  const mat = materias[activeTab];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-deep-dark-bg)' }}>
      {/* Header */}
      <header className="border-b border-[#00c7b1]/15 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Panel de Clases de Apoyo</h1>
            <p className="text-xs text-[#7ca19b]">
              {profesor?.rol === 'admin' ? 'Administrador' : `Profesor/a — ${mat?.label}`}
            </p>
          </div>
          <button onClick={logout} className="text-xs text-[#7ca19b] hover:text-red-400 border border-[#7ca19b]/30 rounded-lg px-3 py-1.5 transition cursor-pointer">
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs (admin ve todas) */}
        {materias.length > 1 && (
          <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
            {materias.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setActiveTab(i)}
                className={`text-sm px-4 py-2 rounded-lg whitespace-nowrap transition cursor-pointer ${
                  i === activeTab
                    ? 'bg-[#00c7b1] text-white font-bold'
                    : 'text-[#7ca19b] hover:bg-[#00c7b1]/10 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {mat && (
          <div className="space-y-8">
            <DescripcionEditor materia={mat} onSave={desc => updateMateria(mat.id, { descripcion: desc })} />
            <div className="border-t border-[#00c7b1]/10" />
            <ImagenesEditor materia={mat} onSave={imgs => updateMateria(mat.id, { imagenes: imgs })} />
            <div className="border-t border-[#00c7b1]/10" />
            <DiasBloqueadosEditor materia={mat} onSave={dias => updateMateria(mat.id, { dias_bloqueados: dias })} />
            <div className="border-t border-[#00c7b1]/10" />
            <HorariosBloqueadosEditor materia={mat} onSave={h => updateMateria(mat.id, { horarios_bloqueados: h })} />
          </div>
        )}
      </div>
    </div>
  );
}
