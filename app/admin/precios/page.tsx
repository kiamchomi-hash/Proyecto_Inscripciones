'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  type OverrideKey = 'benefMat' | 'benefTkA' | 'benefTkB' | 'promoMat' | 'promoTkA' | 'promoTkB';
  const [overrides, setOverrides] = useState<Record<string, Partial<Record<OverrideKey, number>>>>({});
  const [editing, setEditing] = useState<{ carrera: string; field: OverrideKey } | null>(null);
  const [editValue, setEditValue] = useState('');

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
                <th rowSpan={2} className="text-right px-3 py-3 font-bold text-[var(--color-gold)] align-bottom">6 cuotas</th>
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

                return (
                <tr
                  key={c.nombre + i}
                  className={`border-b border-white/5 transition-colors ${
                    hasOverride ? 'bg-red-500/5' : c.esEspecial ? 'bg-[var(--color-gold)]/[0.03]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-white border-r border-white/5">
                    {c.esEspecial && <span className="text-[var(--color-gold)]">★ </span>}
                    {hasOverride && <span className="text-red-400">✎ </span>}
                    {c.nombre}
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
                  <td className={`text-right px-2 py-3 font-semibold tabular-nums ${hasOverride ? 'text-red-400' : 'text-[var(--color-highlight)]'}`}>{fmt(rc.matFinal)}</td>
                  {!is1B && <td className={`text-right px-2 py-3 font-semibold tabular-nums ${hasOverride ? 'text-red-400' : 'text-[var(--color-highlight)]'}`}>{fmt(rc.tkaFinal)}</td>}
                  <td className={`text-right px-2 py-3 font-semibold tabular-nums border-r border-white/5 ${hasOverride ? 'text-red-400' : 'text-[var(--color-highlight)]'}`}>{fmt(rc.tkbFinal)}</td>
                  <td className={`text-right px-3 py-3 font-bold tabular-nums border-r border-white/5 ${hasOverride ? 'text-red-400' : 'text-white'}`}>{fmt(rc.total)}</td>
                  <td className="text-right px-3 py-3 font-semibold tabular-nums text-[var(--color-gold)] border-r border-white/5">{fmt(rc.cuota3)}</td>
                  <td className="text-right px-3 py-3 font-semibold tabular-nums text-[var(--color-gold)]">{fmt(rc.cuota6)}</td>
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

      </div>
    </div>
  );
}
