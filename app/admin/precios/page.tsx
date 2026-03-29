'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-auth';

const supabase = createSupabaseBrowser();

interface CarreraRow {
  nombre: string;
  esEspecial: boolean;
  matLista: number;
  tkaLista: number;
  tkbLista: number;
  dtoMat: number;
  dtoTkA: number;
  dtoTkB: number;
  matFinal: number;
  tkaFinal: number;
  tkbFinal: number;
  total: number;
  cuota3: number;
  cuota6: number;
}

type Periodo = '1A' | '1B';

interface PageData {
  sede: number;
  siglo21: number;
  promoDesde: string;
  promoHasta: string;
  recargo3: number;
  recargo6: number;
  especiales: { nombre: string; dtoMat: number; dtoTkA: number; dtoTkB: number }[];
  carreras: CarreraRow[];
  ultimaSync: string;
  promoEspecialMat: number;
  promoEspecialTkA: number;
  promoEspecialTkB: number;
  beneficio1bMat: number;
  beneficio1bTk: number;
  periodoActivo: Periodo;
}

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n: number) => `${Math.round(n * 100)}%`;

async function fetchData(periodo: Periodo): Promise<PageData> {
  const [preciosRes, metaRes, descuentosRes] = await Promise.all([
    supabase.from('precios_carreras').select('*').eq('periodo', periodo).order('nombre_supabase'),
    supabase.from('precios_meta').select('*').eq('id', 1).single(),
    supabase.from('descuentos').select('*').eq('activo', true),
  ]);

  if (preciosRes.error) throw new Error(preciosRes.error.message);
  if (metaRes.error) throw new Error(metaRes.error.message);

  const precios = preciosRes.data;
  const meta = metaRes.data;
  const descuentos = descuentosRes.data || [];

  const sede = descuentos.find((d: { tipo: string }) => d.tipo === 'sede');
  const siglo = descuentos.find((d: { tipo: string }) => d.tipo === 'universidad');

  const recargo3 = Number(meta.recargo_visa_master_3) || 0;
  const recargo6 = Number(meta.recargo_visa_master_6) || 0;

  let promoGlobalMat: number, promoGlobalTkA: number, promoGlobalTkB: number;
  let beneficio1bMat = 0, beneficio1bTk = 0;
  if (periodo === '1B') {
    promoGlobalMat = Number(meta.promo_especial_matricula_1b) || 0;
    promoGlobalTkA = 0;
    promoGlobalTkB = Number(meta.promo_especial_tk_1b) || 0;
    beneficio1bMat = Number(meta.beneficio_1b_mat) || 0;
    beneficio1bTk = Number(meta.beneficio_1b_tk) || 0;
  } else {
    promoGlobalMat = Number(meta.promo_especial_matricula) || 0;
    promoGlobalTkA = Number(meta.promo_especial_tka) || 0;
    promoGlobalTkB = Number(meta.promo_especial_tkb) || 0;
  }

  const sedeVal = (sede?.porcentaje ?? 0) / 100;

  const especiales = precios
    .filter((p: { es_especial: boolean }) => p.es_especial)
    .map((p: { nombre_supabase: string; descuento_matricula: string; descuento_ticket_a: string; descuento_ticket_b: string }) => ({
      nombre: p.nombre_supabase,
      dtoMat: Number(p.descuento_matricula),
      dtoTkA: Number(p.descuento_ticket_a),
      dtoTkB: Number(p.descuento_ticket_b),
    }));

  const carreras: CarreraRow[] = precios.map((p: {
    nombre_supabase: string; es_especial: boolean;
    matricula: string; ticket_a: string; ticket_b: string;
    descuento_matricula: string; descuento_ticket_a: string; descuento_ticket_b: string;
  }) => {
    const matLista = Number(p.matricula);
    const tkaLista = Number(p.ticket_a);
    const tkbLista = Number(p.ticket_b);
    const dtoMat = Number(p.descuento_matricula);
    const dtoTkA = Number(p.descuento_ticket_a);
    const dtoTkB = Number(p.descuento_ticket_b);

    const totalDtoMat = periodo === '1B' ? dtoMat + beneficio1bMat : dtoMat;
    const totalDtoTkB = periodo === '1B' ? dtoTkB + beneficio1bTk : dtoTkB;
    const matFinal = matLista * (1 - totalDtoMat);
    const tkaFinal = tkaLista * (1 - dtoTkA) * (1 - sedeVal);
    const tkbFinal = tkbLista * (1 - totalDtoTkB) * (1 - sedeVal);
    const total = matFinal + tkaFinal + tkbFinal;

    return {
      nombre: p.nombre_supabase,
      esEspecial: p.es_especial,
      matLista, tkaLista, tkbLista,
      dtoMat: totalDtoMat, dtoTkA, dtoTkB: totalDtoTkB,
      matFinal, tkaFinal, tkbFinal,
      total,
      cuota3: total * (1 + recargo3) / 3,
      cuota6: total * (1 + recargo6) / 6,
    };
  });

  const promoDesde = periodo === '1B' ? (meta.promo_desde_1b || '') : (meta.promo_desde || '');
  const promoHasta = periodo === '1B' ? (meta.promo_hasta_1b || '') : (meta.promo_hasta || '');

  return {
    sede: sede?.porcentaje ?? 0,
    siglo21: siglo?.porcentaje ?? 0,
    promoDesde,
    promoHasta,
    recargo3: Math.round(recargo3 * 100),
    recargo6: Math.round(recargo6 * 100),
    especiales,
    carreras,
    ultimaSync: meta.ultima_sync,
    promoEspecialMat: promoGlobalMat,
    promoEspecialTkA: promoGlobalTkA,
    promoEspecialTkB: promoGlobalTkB,
    beneficio1bMat,
    beneficio1bTk,
    periodoActivo: meta.periodo_activo || '1A',
  };
}

export default function PreciosAdminPage() {
  const router = useRouter();
  const [accessChecked, setAccessChecked] = useState(false);
  const [periodo, setPeriodo] = useState<Periodo>('1B');
  const [periodoActivo, setPeriodoActivo] = useState<Periodo>('1A');
  const is1B = periodo === '1B';

  const CACHE_KEY = `admin_precios_v3_${periodo}`;
  const [data, setData] = useState<PageData | null>(() => {
    if (typeof window === 'undefined') return null;
    try { const c = localStorage.getItem(CACHE_KEY); return c ? JSON.parse(c) : null; } catch { return null; }
  });
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [search, setSearch] = useState('');
  const [showLista, setShowLista] = useState(false);
  const [showDescuentos, setShowDescuentos] = useState(false);

  // ── Plantillas de mensajes ──
  interface Plantilla { id: number; titulo: string; cuerpo: string; }
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [plantillasLoaded, setPlantillasLoaded] = useState(false);
  const [showPlantillas, setShowPlantillas] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState<Plantilla | null>(null);
  const [newPlantilla, setNewPlantilla] = useState(false);
  const [plantillaForm, setPlantillaForm] = useState({ titulo: '', cuerpo: '' });
  const [savingPlantilla, setSavingPlantilla] = useState(false);
  const [selectedCarrera, setSelectedCarrera] = useState('');
  const [varNombre, setVarNombre] = useState('');

  type OverrideKey = 'benefMat' | 'benefTkA' | 'benefTkB' | 'promoMat' | 'promoTkA' | 'promoTkB';
  const [overrides, setOverrides] = useState<Record<string, Partial<Record<OverrideKey, number>>>>({});
  const [editing, setEditing] = useState<{ carrera: string; field: OverrideKey } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(prev => prev === id ? null : prev), 1200);
  };

  // Verificar que sea admin
  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/admin/login'); return; }
      const { data: prof } = await supabase.from('profesores').select('rol').eq('user_id', user.id).single();
      if (!prof || prof.rol !== 'admin') {
        router.replace('/admin/clases-apoyo');
        return;
      }
      setAccessChecked(true);
    }
    checkAdmin();
  }, [router]);

  useEffect(() => {
    if (!accessChecked) return;
    setRefreshing(true);
    try { const c = localStorage.getItem(CACHE_KEY); if (c) setData(JSON.parse(c)); } catch { /* ignore */ }
    fetchData(periodo)
      .then(d => {
        setData(d);
        setPeriodoActivo(d.periodoActivo);
        localStorage.setItem(CACHE_KEY, JSON.stringify(d));
        setError('');
      })
      .catch(e => { if (!data) setError(e.message); })
      .finally(() => setRefreshing(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, accessChecked]);

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_precios_scroll');
    if (saved) { window.scrollTo(0, parseInt(saved)); sessionStorage.removeItem('admin_precios_scroll'); }
    const onBeforeUnload = () => sessionStorage.setItem('admin_precios_scroll', String(window.scrollY));
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Cargar plantillas
  useEffect(() => {
    if (!accessChecked) return;
    supabase.from('plantillas_mensajes').select('*').order('created_at')
      .then(({ data: rows }) => { if (rows) setPlantillas(rows); setPlantillasLoaded(true); });
  }, [accessChecked]);

  const savePlantilla = async (p: { id?: number; titulo: string; cuerpo: string }) => {
    setSavingPlantilla(true);
    if (p.id) {
      const { data: updated } = await supabase.from('plantillas_mensajes')
        .update({ titulo: p.titulo, cuerpo: p.cuerpo, updated_at: new Date().toISOString() })
        .eq('id', p.id).select().single();
      if (updated) setPlantillas(prev => prev.map(x => x.id === p.id ? updated : x));
    } else {
      const { data: created } = await supabase.from('plantillas_mensajes')
        .insert({ titulo: p.titulo, cuerpo: p.cuerpo }).select().single();
      if (created) setPlantillas(prev => [...prev, created]);
    }
    setSavingPlantilla(false);
    setEditingPlantilla(null);
    setNewPlantilla(false);
    setPlantillaForm({ titulo: '', cuerpo: '' });
  };

  const deletePlantilla = async (id: number) => {
    await supabase.from('plantillas_mensajes').delete().eq('id', id);
    setPlantillas(prev => prev.filter(x => x.id !== id));
  };

  const resolveVars = (cuerpo: string, carrera?: CarreraRow) => {
    let text = cuerpo;
    text = text.replace(/\*nombre/g, varNombre || '*nombre');
    if (carrera) {
      const rc = recalc(carrera);
      text = text.replace(/\*carrera/g, carrera.nombre);
      text = text.replace(/\*matricula/g, fmt(rc.matFinal));
      text = text.replace(/\*ticketA/g, fmt(rc.tkaFinal));
      text = text.replace(/\*cuota6/g, fmt(rc.cuota6));
      text = text.replace(/\*cuota3/g, fmt(rc.cuota3));
      text = text.replace(/\*cuota/g, fmt(rc.tkbFinal));
      text = text.replace(/\*total/g, fmt(rc.total));
    }
    return text;
  };

  const confirmEdit = () => {
    if (!editing) return;
    const val = parseFloat(editValue.replace(',', '.'));
    if (isNaN(val) || val < 0 || val > 100) { setEditing(null); return; }
    setOverrides(prev => ({
      ...prev,
      [editing.carrera]: { ...prev[editing.carrera], [editing.field]: val / 100 },
    }));
    setEditing(null);
  };

  const clearOverride = (carrera: string, field: OverrideKey) => {
    setOverrides(prev => {
      const copy = { ...prev };
      if (copy[carrera]) {
        delete copy[carrera][field];
        if (Object.keys(copy[carrera]).length === 0) delete copy[carrera];
      }
      return copy;
    });
  };

  const recalc = (c: CarreraRow): CarreraRow => {
    const ov = overrides[c.nombre];
    if (!ov) return c;
    const sedeVal = data!.sede / 100;
    const benefMat = ov.benefMat ?? 0;
    const benefTkA = ov.benefTkA ?? sedeVal;
    const benefTkB = ov.benefTkB ?? sedeVal;
    const dtoMat = ov.promoMat ?? c.dtoMat;
    const dtoTkA = ov.promoTkA ?? c.dtoTkA;
    const dtoTkB = ov.promoTkB ?? c.dtoTkB;
    const matFinal = c.matLista * (1 - dtoMat) * (1 - benefMat);
    const tkaFinal = c.tkaLista * (1 - dtoTkA) * (1 - benefTkA);
    const tkbFinal = c.tkbLista * (1 - dtoTkB) * (1 - benefTkB);
    const total = matFinal + tkaFinal + tkbFinal;
    const recargo3 = data!.recargo3 / 100;
    const recargo6 = data!.recargo6 / 100;
    return { ...c, dtoMat, dtoTkA, dtoTkB, matFinal, tkaFinal, tkbFinal, total, cuota3: total * (1 + recargo3) / 3, cuota6: total * (1 + recargo6) / 6 };
  };

  if (!data && refreshing) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[var(--color-highlight)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--color-text-light)]">Cargando precios...</p>
      </div>
    </div>
  );
  if (!data && error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 px-6 py-4">
        <p className="text-red-400">{error}</p>
      </div>
    </div>
  );
  if (!data) return null;

  const filtered = data.carreras.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase()));
  const syncDate = data.ultimaSync ? new Date(data.ultimaSync).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sin datos';

  // La promo vence el día POSTERIOR a promoHasta (si dice 27, el 27 sigue válida)
  const now = new Date();
  const hoy = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (!accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1612' }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#00c7b1] border-t-transparent rounded-full animate-spin" />
          <span className="text-white/50 text-sm">Verificando acceso...</span>
        </div>
      </div>
    );
  }

  const promoVencida = data.promoHasta && data.promoHasta < hoy;
  const diasRestantes = data.promoHasta
    ? Math.ceil((new Date(data.promoHasta + 'T00:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen text-[var(--color-text-normal)]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight">Precios y Descuentos</h1>
              <span className="text-xs px-3 py-1 rounded-lg bg-[var(--color-card-bg)] text-[var(--color-text-light)] border border-white/10">
                Slide: <span className="font-bold text-white">{periodoActivo}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-text-light)]">
              <span>
                Sync: <span className="font-semibold text-white">{syncDate}</span>
              </span>
              {data.promoHasta && (
                <span className={promoVencida ? 'text-red-400' : diasRestantes !== null && diasRestantes <= 3 ? 'text-[var(--color-gold)]' : ''}>
                  {promoVencida
                    ? <>Promo vencida ({data.promoHasta}) <span className="font-bold">— verificar</span></>
                    : <>Vence: <span className="font-semibold text-white">{data.promoHasta}</span> ({diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'})</>
                  }
                </span>
              )}
              {refreshing && <span className="text-[var(--color-gold)] animate-pulse">Actualizando...</span>}
              {!refreshing && error && <span className="text-red-400">({error})</span>}
            </div>

            {/* Periodo toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              {(['1A', '1B'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                    periodo === p
                      ? 'bg-[var(--color-highlight)]/15 text-[var(--color-highlight)] border border-[var(--color-highlight)]/40 shadow-[0_0_12px_rgba(0,199,177,0.15)]'
                      : 'text-[var(--color-text-light)] border border-white/5 hover:text-white hover:border-white/15'
                  }`}
                >
                  {p}{p === '1B' ? ' (Mat+Cuota)' : ' (Mat+TkA+TkB)'}
                </button>
              ))}
              {periodoActivo !== periodo && (
                <button
                  onClick={async () => {
                    await supabase.from('precios_meta').update({ periodo_activo: periodo }).eq('id', 1);
                    setPeriodoActivo(periodo);
                  }}
                  className="text-xs text-[var(--color-gold)] hover:text-white underline underline-offset-2 decoration-[var(--color-gold)]/30 hover:decoration-white/50 transition-colors ml-2"
                >
                  Mostrar {periodo} en slide publico
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={async () => {
                setSyncing(true);
                setSyncMsg('');
                try {
                  const res = await fetch('/api/admin/sync-precios', { method: 'POST' });
                  if (res.ok) {
                    setSyncMsg('Sync disparado — espera ~2 min y recarga');
                  } else {
                    const d = await res.json();
                    setSyncMsg(d.error || 'Error al disparar sync');
                  }
                } catch { setSyncMsg('Error de red'); }
                finally { setSyncing(false); }
              }}
              disabled={syncing}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/25 hover:bg-[var(--color-gold)]/20 disabled:opacity-50"
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar Excel'}
            </button>
            {syncMsg && <span className={`text-xs ${syncMsg.includes('Error') ? 'text-red-400' : 'text-[var(--color-highlight)]'}`}>{syncMsg}</span>}
            <a href="/admin/clases-apoyo" className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-card-bg)] text-[var(--color-highlight)] border border-[var(--color-highlight)]/15 hover:border-[var(--color-highlight)]/30 transition-all duration-200">
              Clases de apoyo
            </a>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar carrera..."
            className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl text-sm bg-[#0a1a19] border border-[var(--color-highlight)]/30 text-[#ffffff] placeholder:text-white/40 focus:outline-none focus:border-[var(--color-highlight)] focus:shadow-[0_0_12px_rgba(0,199,177,0.15)] transition-all caret-white"
          />
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none text-[var(--color-text-light)]">
            <input type="checkbox" checked={showLista} onChange={e => setShowLista(e.target.checked)} className="accent-[var(--color-highlight)]" />
            Precios de lista
          </label>
          <span className="text-xs text-[var(--color-text-light)]">{filtered.length} carreras</span>
          {Object.keys(overrides).length > 0 && (
            <button
              onClick={() => setOverrides({})}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              Quitar ediciones ({Object.keys(overrides).length})
            </button>
          )}
        </div>

        {/* ── Override global por columna ── */}
        <div className="flex flex-wrap gap-3 mb-5">
          {([
            { label: 'Benef. Mat', field: 'benefMat' as OverrideKey, color: 'var(--color-highlight)' },
            ...(!is1B ? [{ label: 'Benef. TkA', field: 'benefTkA' as OverrideKey, color: 'var(--color-highlight)' }] : []),
            { label: is1B ? 'Benef. Cuota' : 'Benef. TkB', field: 'benefTkB' as OverrideKey, color: 'var(--color-highlight)' },
            { label: 'Promo Mat', field: 'promoMat' as OverrideKey, color: 'var(--color-gold)' },
            ...(!is1B ? [{ label: 'Promo TkA', field: 'promoTkA' as OverrideKey, color: 'var(--color-gold)' }] : []),
            { label: is1B ? 'Promo Cuota' : 'Promo TkB', field: 'promoTkB' as OverrideKey, color: 'var(--color-gold)' },
          ]).map(({ label, field, color }) => (
            <div key={field} className="flex items-center gap-1.5">
              <span className="text-[0.65rem] font-bold uppercase" style={{ color }}>{label}</span>
              <input
                type="text"
                placeholder="%"
                className="w-12 text-center text-xs px-1 py-1.5 rounded-lg bg-[#0a1a19] text-white outline-none transition-colors"
                style={{ border: `1px solid color-mix(in srgb, ${color} 25%, transparent)` }}
                onFocus={e => e.target.style.borderColor = `color-mix(in srgb, ${color} 50%, transparent)`}
                onBlur={e => e.target.style.borderColor = `color-mix(in srgb, ${color} 25%, transparent)`}
                onKeyDown={e => {
                  if (e.key !== 'Enter') return;
                  const val = parseFloat((e.target as HTMLInputElement).value.replace(',', '.'));
                  if (isNaN(val) || val < 0 || val > 100) return;
                  const decimal = val / 100;
                  setOverrides(prev => {
                    const next = { ...prev };
                    for (const c of data.carreras) {
                      next[c.nombre] = { ...next[c.nombre], [field]: decimal };
                    }
                    return next;
                  });
                  (e.target as HTMLInputElement).value = '';
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Tabla ── */}
        <div className="overflow-x-auto rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-highlight)]/10">
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="border-b-2 border-[var(--color-highlight)]/20">
                <th rowSpan={2} className="text-left px-4 py-3 font-bold text-white align-bottom border-r border-white/5">Carrera</th>
                <th colSpan={is1B ? 2 : 3} className="text-center px-1 py-2 font-bold text-[0.65rem] uppercase tracking-widest text-[var(--color-highlight)] border-b border-[var(--color-highlight)]/15 border-r border-white/5">Dto. Beneficio</th>
                <th colSpan={is1B ? 2 : 3} className="text-center px-1 py-2 font-bold text-[0.65rem] uppercase tracking-widest text-[var(--color-gold)] border-b border-[var(--color-gold)]/15 border-r border-white/5">Dto. Promocion</th>
                {showLista && <th colSpan={is1B ? 2 : 3} className="text-center px-1 py-2 font-bold text-[0.65rem] uppercase tracking-widest text-[var(--color-text-light)] border-b border-white/10 border-r border-white/5">Lista</th>}
                <th colSpan={is1B ? 2 : 3} className="text-center px-1 py-2 font-bold text-[0.65rem] uppercase tracking-widest text-[var(--color-highlight)] border-b border-[var(--color-highlight)]/15 border-r border-white/5">Finales</th>
                <th rowSpan={2} className="text-right px-3 py-3 font-bold text-white align-bottom border-r border-white/5">Total</th>
                <th rowSpan={2} className="text-right px-3 py-3 font-bold text-[var(--color-gold)] align-bottom border-r border-white/5">3 cuotas</th>
                <th rowSpan={2} className="text-right px-3 py-3 font-bold text-[var(--color-gold)] align-bottom border-r border-white/5">6 cuotas</th>
                <th rowSpan={2} className="px-2 py-3 align-bottom w-8"></th>
              </tr>
              <tr className="border-b-2 border-[var(--color-highlight)]/20">
                <th className="text-center px-1 py-2 text-xs text-[var(--color-highlight)]">Mat</th>
                {!is1B && <th className="text-center px-1 py-2 text-xs text-[var(--color-highlight)]">TkA</th>}
                <th className="text-center px-1 py-2 text-xs text-[var(--color-highlight)] border-r border-white/5">{is1B ? 'Cuota' : 'TkB'}</th>
                <th className="text-center px-1 py-2 text-xs text-[var(--color-gold)]">Mat</th>
                {!is1B && <th className="text-center px-1 py-2 text-xs text-[var(--color-gold)]">TkA</th>}
                <th className="text-center px-1 py-2 text-xs text-[var(--color-gold)] border-r border-white/5">{is1B ? 'Cuota' : 'TkB'}</th>
                {showLista && <>
                  <th className="text-right px-2 py-2 text-xs text-[var(--color-text-light)]">Mat</th>
                  {!is1B && <th className="text-right px-2 py-2 text-xs text-[var(--color-text-light)]">TkA</th>}
                  <th className="text-right px-2 py-2 text-xs text-[var(--color-text-light)] border-r border-white/5">{is1B ? 'Cuota' : 'TkB'}</th>
                </>}
                <th className="text-right px-2 py-2 text-xs text-[var(--color-highlight)]">Mat</th>
                {!is1B && <th className="text-right px-2 py-2 text-xs text-[var(--color-highlight)]">TkA</th>}
                <th className="text-right px-2 py-2 text-xs text-[var(--color-highlight)] border-r border-white/5">{is1B ? 'Cuota' : 'TkB'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const sedeVal = data.sede / 100;
                const ov = overrides[c.nombre] || {};
                const rc = recalc(c);
                const hasOverride = !!overrides[c.nombre];

                const benefMat = ov.benefMat ?? 0;
                const benefTkA = ov.benefTkA ?? sedeVal;
                const benefTkB = ov.benefTkB ?? sedeVal;

                const EditableCell = ({ field, value, defaultColor, borderR }: { field: OverrideKey; value: number; defaultColor: string; borderR?: boolean }) => {
                  const isEditing = editing?.carrera === c.nombre && editing?.field === field;
                  const isOverridden = ov[field] !== undefined;

                  if (isEditing) {
                    return (
                      <td className={`text-center px-0.5 py-1 ${borderR ? 'border-r border-white/5' : ''}`}>
                        <input
                          autoFocus
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') setEditing(null); }}
                          onBlur={confirmEdit}
                          className="w-12 text-center text-xs px-1 py-0.5 rounded-lg bg-[#0a1a19] border border-[var(--color-highlight)] text-white outline-none"
                        />
                      </td>
                    );
                  }

                  return (
                    <td
                      className={`text-center px-1 py-3 text-xs tabular-nums cursor-pointer transition-colors hover:brightness-150 ${borderR ? 'border-r border-white/5' : ''}`}
                      style={{ color: isOverridden ? '#ef4444' : defaultColor }}
                      onClick={() => { setEditing({ carrera: c.nombre, field }); setEditValue(Math.round(value * 100).toString()); }}
                      title={isOverridden ? 'Click para editar (doble-click para resetear)' : 'Click para editar'}
                      onDoubleClick={() => isOverridden && clearOverride(c.nombre, field)}
                    >
                      {pct(value)}
                    </td>
                  );
                };

                const CopyCell = ({ value, id, colorClass, bold, borderR, px }: { value: string; id: string; colorClass: string; bold?: boolean; borderR?: boolean; px?: string }) => (
                  <td className={`${px ?? 'px-2'} py-3 ${borderR ? 'border-r border-white/5' : ''}`}>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`${bold ? 'font-bold' : 'font-semibold'} tabular-nums ${colorClass}`}>{value}</span>
                      <button
                        onClick={() => copyText(value, id)}
                        className="p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                        title="Copiar"
                      >
                        {copiedId === id
                          ? <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          : <svg className="w-3.5 h-3.5 text-white/30 hover:text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                        }
                      </button>
                    </div>
                  </td>
                );

                return (
                <tr
                  key={c.nombre + i}
                  className={`border-b border-white/5 transition-colors ${
                    hasOverride ? 'bg-red-500/5' : c.esEspecial ? 'bg-[var(--color-gold)]/[0.03]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-white border-r border-white/5">
                    <span className="flex items-center gap-1.5">
                      {c.esEspecial && <span className="text-[var(--color-gold)]">★</span>}
                      {hasOverride && <span className="text-red-400">✎</span>}
                      {(() => {
                        const isPregrado = c.nombre.startsWith('Tec.') || ['Procurador','Martillero'].some(p => c.nombre.includes(p));
                        return (
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[0.6rem] font-black flex-shrink-0 ${
                            isPregrado ? 'bg-[var(--color-gold)]/15 text-[var(--color-gold)] border border-[var(--color-gold)]/30' : 'bg-[var(--color-highlight)]/15 text-[var(--color-highlight)] border border-[var(--color-highlight)]/30'
                          }`}>{isPregrado ? 'P' : 'G'}</span>
                        );
                      })()}
                      {c.nombre}
                    </span>
                  </td>
                  <EditableCell field="benefMat" value={benefMat} defaultColor="var(--color-text-light)" />
                  {!is1B && <EditableCell field="benefTkA" value={benefTkA} defaultColor="var(--color-highlight)" />}
                  <EditableCell field="benefTkB" value={benefTkB} defaultColor="var(--color-highlight)" borderR />
                  <EditableCell field="promoMat" value={rc.dtoMat} defaultColor={c.esEspecial && c.dtoMat !== c.dtoTkA ? 'var(--color-gold)' : 'var(--color-text-light)'} />
                  {!is1B && <EditableCell field="promoTkA" value={rc.dtoTkA} defaultColor={c.esEspecial ? 'var(--color-gold)' : 'var(--color-text-light)'} />}
                  <EditableCell field="promoTkB" value={rc.dtoTkB} defaultColor={c.esEspecial ? 'var(--color-gold)' : 'var(--color-text-light)'} borderR />
                  {showLista && <>
                    <td className="text-right px-2 py-3 tabular-nums text-[var(--color-text-light)]">{fmt(c.matLista)}</td>
                    {!is1B && <td className="text-right px-2 py-3 tabular-nums text-[var(--color-text-light)]">{fmt(c.tkaLista)}</td>}
                    <td className="text-right px-2 py-3 tabular-nums text-[var(--color-text-light)] border-r border-white/5">{fmt(c.tkbLista)}</td>
                  </>}
                  <CopyCell value={fmt(rc.matFinal)} id={`${c.nombre}-matF`} colorClass={hasOverride ? 'text-red-400' : 'text-[var(--color-highlight)]'} />
                  {!is1B && <CopyCell value={fmt(rc.tkaFinal)} id={`${c.nombre}-tkaF`} colorClass={hasOverride ? 'text-red-400' : 'text-[var(--color-highlight)]'} />}
                  <CopyCell value={fmt(rc.tkbFinal)} id={`${c.nombre}-tkbF`} colorClass={hasOverride ? 'text-red-400' : 'text-[var(--color-highlight)]'} borderR />
                  <CopyCell value={fmt(rc.total)} id={`${c.nombre}-total`} colorClass={hasOverride ? 'text-red-400' : 'text-white'} bold borderR px="px-3" />
                  <CopyCell value={fmt(rc.cuota3)} id={`${c.nombre}-c3`} colorClass="text-[var(--color-gold)]" borderR px="px-3" />
                  <CopyCell value={fmt(rc.cuota6)} id={`${c.nombre}-c6`} colorClass="text-[var(--color-gold)]" borderR px="px-3" />
                  <td className="px-1 py-3 text-center">
                    <button
                      title="Copiar resumen de precios"
                      onClick={() => {
                        const parts: string[] = [];
                        parts.push(`Matrícula ${fmt(rc.matFinal)} (${pct(rc.dtoMat)} dto)`);
                        if (!is1B) {
                          parts.push(`Ticket A ${fmt(rc.tkaFinal)} (${pct(rc.dtoTkA)} dto)`);
                          parts.push(`Ticket B ${fmt(rc.tkbFinal)} (${pct(rc.dtoTkB)} dto)`);
                        } else {
                          parts.push(`Cuota ${fmt(rc.tkbFinal)} (${pct(rc.dtoTkB)} dto)`);
                        }
                        if (data.promoDesde || data.promoHasta) {
                          const desde = data.promoDesde ? new Date(data.promoDesde + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '?';
                          const hasta = data.promoHasta ? new Date(data.promoHasta + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '?';
                          parts.push(`Promo del ${desde} al ${hasta}`);
                        }
                        copyText(parts.join(' | '), `${c.nombre}-resumen`);
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors group"
                    >
                      {copiedId === `${c.nombre}-resumen`
                        ? <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        : <svg className="w-4 h-4 text-white/30 group-hover:text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                      }
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Descuentos (colapsable) ── */}
        <div className="mt-8">
          <button
            onClick={() => setShowDescuentos(v => !v)}
            className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-light)] hover:text-white transition-colors"
          >
            <span className={`transition-transform duration-200 ${showDescuentos ? 'rotate-90' : ''}`}>▶</span>
            Descuentos y promociones
            {(data.promoEspecialMat > 0 || data.promoEspecialTkA > 0 || data.promoEspecialTkB > 0) && (
              <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold">PROMO ACTIVA</span>
            )}
          </button>

          {showDescuentos && (
            <div className="mt-4 space-y-4">
              {/* Cards */}
              <div className={`grid grid-cols-1 ${is1B ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
                <div className="rounded-2xl p-5 bg-[var(--color-card-bg)] border border-[var(--color-highlight)]/10">
                  <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--color-text-light)] mb-2">Sede Local (Amigo referido)</p>
                  <p className="text-4xl font-black text-[var(--color-highlight)]">{data.sede}%</p>
                  <p className="text-xs mt-2 text-[var(--color-text-light)]">{is1B ? 'Descuento en cuota' : 'Descuento en cuotas (TkA y TkB)'}</p>
                </div>

                <div className="rounded-2xl p-5 bg-[var(--color-card-bg)] border border-[var(--color-highlight)]/10">
                  <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--color-text-light)] mb-2">{is1B ? 'Promo base (Siglo 21)' : 'Siglo 21 (Promocion general)'}</p>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-4xl font-black text-[var(--color-highlight)]">{Math.round(data.promoEspecialMat * 100)}%</p>
                      <p className="text-[0.65rem] text-[var(--color-text-light)] mt-1">Matricula</p>
                    </div>
                    {is1B ? (
                      <div>
                        <p className="text-4xl font-black text-[var(--color-highlight)]">{Math.round(data.promoEspecialTkB * 100)}%</p>
                        <p className="text-[0.65rem] text-[var(--color-text-light)] mt-1">Cuota</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-4xl font-black text-[var(--color-highlight)]">{data.siglo21}%</p>
                        <p className="text-[0.65rem] text-[var(--color-text-light)] mt-1">Totalidad</p>
                      </div>
                    )}
                  </div>
                  {data.promoDesde && (
                    <p className="text-xs mt-3 text-[var(--color-text-light)]">{data.promoDesde} → {data.promoHasta}</p>
                  )}
                </div>

                {is1B && (
                  <div className="rounded-2xl p-5 bg-[var(--color-card-bg)] border border-[var(--color-secondary-highlight)]/15">
                    <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--color-secondary-highlight)] mb-2">Beneficio Provincial (BSAS/CABA)</p>
                    <div className="flex gap-6">
                      <div>
                        <p className={`text-4xl font-black ${data.beneficio1bMat > 0 ? 'text-[var(--color-secondary-highlight)]' : 'text-[var(--color-text-light)]'}`}>{Math.round(data.beneficio1bMat * 100)}%</p>
                        <p className="text-[0.65rem] text-[var(--color-text-light)] mt-1">Matricula</p>
                      </div>
                      <div>
                        <p className={`text-4xl font-black ${data.beneficio1bTk > 0 ? 'text-[var(--color-secondary-highlight)]' : 'text-[var(--color-text-light)]'}`}>{Math.round(data.beneficio1bTk * 100)}%</p>
                        <p className="text-[0.65rem] text-[var(--color-text-light)] mt-1">Cuota</p>
                      </div>
                    </div>
                    <p className="text-xs mt-3 text-[var(--color-text-light)]">
                      Total Mat: {Math.round((data.promoEspecialMat + data.beneficio1bMat) * 100)}% | Cuota: {Math.round((data.promoEspecialTkB + data.beneficio1bTk) * 100)}%
                    </p>
                  </div>
                )}

                <div className="rounded-2xl p-5 bg-[var(--color-card-bg)] border border-[var(--color-gold)]/15">
                  <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--color-gold)] mb-1">Financiacion Visa/Master</p>
                  <p className="text-sm font-bold text-white mb-3">Visa y Mastercard - Otros Bancos</p>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xs text-[var(--color-text-light)]">3 cuotas</p>
                      <p className={`text-2xl font-black ${data.recargo3 > 0 ? 'text-[var(--color-gold)]' : 'text-[var(--color-highlight)]'}`}>
                        {data.recargo3 > 0 ? `+${data.recargo3}%` : 'Sin interes'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-light)]">6 cuotas</p>
                      <p className={`text-2xl font-black ${data.recargo6 > 0 ? 'text-[var(--color-gold)]' : 'text-[var(--color-highlight)]'}`}>
                        {data.recargo6 > 0 ? `+${data.recargo6}%` : 'Sin interes'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promo especial global */}
              {(data.promoEspecialMat > 0 || data.promoEspecialTkA > 0 || data.promoEspecialTkB > 0) && (
                <div className="rounded-2xl p-5 flex items-start gap-4 bg-red-500/5 border border-red-500/20">
                  <span className="text-2xl mt-0.5">🔥</span>
                  <div>
                    <p className="text-sm font-bold text-red-400 uppercase tracking-wider">Promo especial global activa</p>
                    <div className="flex gap-3 mt-3">
                      {data.promoEspecialMat > 0 && (() => {
                        const total = Math.round(data.promoEspecialMat * 100);
                        const pura = total - data.siglo21;
                        return (
                          <div className="px-4 py-3 rounded-xl bg-red-500/10">
                            <p className="text-xs text-[var(--color-text-light)]">Matricula</p>
                            <p className="text-xl font-black text-red-400">{total}%</p>
                            <p className="text-[0.65rem] text-[var(--color-text-light)]">{data.siglo21}% Siglo + {pura}% Promo</p>
                          </div>
                        );
                      })()}
                      {data.promoEspecialTkA > 0 && (() => {
                        const total = Math.round(data.promoEspecialTkA * 100);
                        const pura = total - data.siglo21 - data.sede;
                        return (
                          <div className="px-4 py-3 rounded-xl bg-red-500/10">
                            <p className="text-xs text-[var(--color-text-light)]">Ticket A</p>
                            <p className="text-xl font-black text-red-400">{total}%</p>
                            <p className="text-[0.65rem] text-[var(--color-text-light)]">{data.siglo21}% Siglo + {data.sede}% Sede + {pura}% Promo</p>
                          </div>
                        );
                      })()}
                      {data.promoEspecialTkB > 0 && (() => {
                        const total = Math.round(data.promoEspecialTkB * 100);
                        const pura = total - data.siglo21 - data.sede;
                        return (
                          <div className="px-4 py-3 rounded-xl bg-red-500/10">
                            <p className="text-xs text-[var(--color-text-light)]">Ticket B</p>
                            <p className="text-xl font-black text-red-400">{total}%</p>
                            <p className="text-[0.65rem] text-[var(--color-text-light)]">{data.siglo21}% Siglo + {data.sede}% Sede + {pura}% Promo</p>
                          </div>
                        );
                      })()}
                    </div>
                    <p className="text-xs mt-3 text-[var(--color-text-light)]">Editar desde Supabase → precios_meta</p>
                  </div>
                </div>
              )}

              {/* Especiales */}
              {data.especiales.length > 0 && (
                <div className="rounded-2xl p-5 bg-[var(--color-card-bg)] border border-[var(--color-gold)]/15">
                  <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--color-gold)] mb-4">
                    Descuentos especiales ({data.especiales.length} carreras)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {data.especiales.map(e => (
                      <div key={e.nombre} className="flex justify-between items-center px-4 py-2.5 rounded-xl bg-[var(--color-gold)]/5">
                        <span className="text-sm font-semibold text-white truncate mr-3">{e.nombre}</span>
                        <span className="text-xs whitespace-nowrap text-[var(--color-gold)]">
                          Mat={pct(e.dtoMat)} A={pct(e.dtoTkA)} B={pct(e.dtoTkB)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Plantillas de mensajes ── */}
        <div className="mt-8">
          <button
            onClick={() => setShowPlantillas(v => !v)}
            className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-light)] hover:text-white transition-colors"
          >
            <span className={`transition-transform duration-200 ${showPlantillas ? 'rotate-90' : ''}`}>▶</span>
            Plantillas de mensajes
            {plantillas.length > 0 && (
              <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-[var(--color-highlight)]/10 text-[var(--color-highlight)] font-bold">{plantillas.length}</span>
            )}
          </button>

          {showPlantillas && (
            <div className="mt-4 space-y-4">
              {/* Variables globales */}
              <div className="flex flex-wrap items-end gap-4 rounded-2xl p-4 bg-[var(--color-card-bg)] border border-white/10">
                <div className="flex-1 min-w-[180px]">
                  <label className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--color-text-light)] mb-1 block">*nombre</label>
                  <input
                    type="text"
                    value={varNombre}
                    onChange={e => setVarNombre(e.target.value)}
                    placeholder="Nombre del destinatario"
                    className="w-full px-3 py-2 rounded-lg text-sm bg-[#0a1a19] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-highlight)]/50 transition-colors"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--color-text-light)] mb-1 block">Carrera (precios)</label>
                  <select
                    value={selectedCarrera}
                    onChange={e => setSelectedCarrera(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-[#0a1a19] border border-white/10 text-white focus:outline-none focus:border-[var(--color-highlight)]/50 transition-colors"
                  >
                    <option value="">Seleccionar carrera...</option>
                    {data.carreras.map((c, i) => (
                      <option key={`${c.nombre}-${i}`} value={c.nombre}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--color-text-light)] mb-1.5">Variables disponibles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['*nombre', '*carrera', '*matricula', '*cuota', '*ticketA', '*total', '*cuota3', '*cuota6'].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(v);
                          setCopiedId(`var-${v}`);
                          setTimeout(() => setCopiedId(prev => prev === `var-${v}` ? null : prev), 1200);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                          copiedId === `var-${v}`
                            ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                            : 'bg-[var(--color-highlight)]/10 text-[var(--color-highlight)] border border-[var(--color-highlight)]/20 hover:bg-[var(--color-highlight)]/20'
                        }`}
                      >
                        {copiedId === `var-${v}` ? 'Copiado' : v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lista de plantillas */}
              {plantillas.map(p => {
                const carrera = data.carreras.find(c => c.nombre === selectedCarrera);
                const preview = resolveVars(p.cuerpo, carrera);
                const isEditing = editingPlantilla?.id === p.id;

                return (
                  <div key={p.id} className="rounded-2xl bg-[var(--color-card-bg)] border border-white/10 overflow-hidden">
                    {isEditing ? (
                      <div className="p-4 space-y-3">
                        <input
                          type="text"
                          value={plantillaForm.titulo}
                          onChange={e => setPlantillaForm(f => ({ ...f, titulo: e.target.value }))}
                          placeholder="Título"
                          className="w-full px-3 py-2 rounded-lg text-sm font-bold bg-[#0a1a19] border border-white/10 text-white focus:outline-none focus:border-[var(--color-highlight)]/50 transition-colors"
                        />
                        <textarea
                          value={plantillaForm.cuerpo}
                          onChange={e => setPlantillaForm(f => ({ ...f, cuerpo: e.target.value }))}
                          placeholder="Cuerpo del mensaje (usá *nombre, *carrera, *matricula, *cuota, *total, *cuota3, *cuota6)"
                          rows={6}
                          className="w-full px-3 py-2 rounded-lg text-sm bg-[#0a1a19] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-highlight)]/50 transition-colors resize-y"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => savePlantilla({ id: p.id, ...plantillaForm })}
                            disabled={savingPlantilla || !plantillaForm.titulo.trim() || !plantillaForm.cuerpo.trim()}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-highlight)]/15 text-[var(--color-highlight)] border border-[var(--color-highlight)]/30 hover:bg-[var(--color-highlight)]/25 disabled:opacity-40 transition-colors"
                          >
                            {savingPlantilla ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button
                            onClick={() => { setEditingPlantilla(null); setPlantillaForm({ titulo: '', cuerpo: '' }); }}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--color-text-light)] border border-white/10 hover:text-white hover:border-white/20 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <h3 className="font-bold text-white">{p.titulo}</h3>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => { setEditingPlantilla(p); setPlantillaForm({ titulo: p.titulo, cuerpo: p.cuerpo }); }}
                              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                              title="Editar plantilla"
                            >
                              <svg className="w-4 h-4 text-white/40 hover:text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                            </button>
                            <button
                              onClick={() => { if (confirm('¿Eliminar esta plantilla?')) deletePlantilla(p.id); }}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                              title="Eliminar plantilla"
                            >
                              <svg className="w-4 h-4 text-white/40 hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                          </div>
                        </div>
                        <div className="rounded-xl bg-[#0a1a19] border border-white/5 p-4 mb-3">
                          <pre className="text-sm text-white/80 whitespace-pre-wrap font-sans leading-relaxed">{preview}</pre>
                        </div>
                        <button
                          onClick={() => copyText(preview, `plantilla-${p.id}`)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-highlight)]/10 text-[var(--color-highlight)] border border-[var(--color-highlight)]/25 hover:bg-[var(--color-highlight)]/20 transition-colors"
                        >
                          {copiedId === `plantilla-${p.id}` ? (
                            <>
                              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              <span className="text-green-400">Copiado</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                              Copiar mensaje
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Nueva plantilla */}
              {newPlantilla ? (
                <div className="rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-highlight)]/20 p-4 space-y-3">
                  <input
                    type="text"
                    value={plantillaForm.titulo}
                    onChange={e => setPlantillaForm(f => ({ ...f, titulo: e.target.value }))}
                    placeholder="Título de la plantilla"
                    className="w-full px-3 py-2 rounded-lg text-sm font-bold bg-[#0a1a19] border border-white/10 text-white focus:outline-none focus:border-[var(--color-highlight)]/50 transition-colors"
                  />
                  <textarea
                    value={plantillaForm.cuerpo}
                    onChange={e => setPlantillaForm(f => ({ ...f, cuerpo: e.target.value }))}
                    placeholder="Cuerpo del mensaje (usá *nombre, *carrera, *matricula, *cuota, *total, *cuota3, *cuota6)"
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-[#0a1a19] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--color-highlight)]/50 transition-colors resize-y"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => savePlantilla(plantillaForm)}
                      disabled={savingPlantilla || !plantillaForm.titulo.trim() || !plantillaForm.cuerpo.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-highlight)]/15 text-[var(--color-highlight)] border border-[var(--color-highlight)]/30 hover:bg-[var(--color-highlight)]/25 disabled:opacity-40 transition-colors"
                    >
                      {savingPlantilla ? 'Guardando...' : 'Crear plantilla'}
                    </button>
                    <button
                      onClick={() => { setNewPlantilla(false); setPlantillaForm({ titulo: '', cuerpo: '' }); }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--color-text-light)] border border-white/10 hover:text-white hover:border-white/20 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setNewPlantilla(true); setPlantillaForm({ titulo: '', cuerpo: '' }); }}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-[var(--color-text-light)] border border-dashed border-white/15 hover:text-white hover:border-white/30 transition-colors w-full justify-center"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Nueva plantilla
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
