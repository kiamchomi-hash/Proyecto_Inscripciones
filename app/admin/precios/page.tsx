'use client';

import { useState, useEffect } from 'react';
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
}

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n: number) => `${Math.round(n * 100)}%`;

async function fetchData(): Promise<PageData> {
  const [preciosRes, metaRes, descuentosRes] = await Promise.all([
    supabase.from('precios_carreras').select('*').order('nombre_supabase'),
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

  // Promo especial global: solo para mostrar en el banner (los precios ya vienen del Excel)
  const promoGlobalMat = Number(meta.promo_especial_matricula) || 0;
  const promoGlobalTkA = Number(meta.promo_especial_tka) || 0;
  const promoGlobalTkB = Number(meta.promo_especial_tkb) || 0;

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

    // Matrícula: solo promo (del Excel). Tickets: promo + sede (amigo referido)
    const matFinal = matLista * (1 - dtoMat);
    const tkaFinal = tkaLista * (1 - dtoTkA) * (1 - sedeVal);
    const tkbFinal = tkbLista * (1 - dtoTkB) * (1 - sedeVal);
    const total = matFinal + tkaFinal + tkbFinal;

    return {
      nombre: p.nombre_supabase,
      esEspecial: p.es_especial,
      matLista, tkaLista, tkbLista,
      dtoMat, dtoTkA, dtoTkB,
      matFinal, tkaFinal, tkbFinal,
      total,
      cuota3: total * (1 + recargo3) / 3,
      cuota6: total * (1 + recargo6) / 6,
    };
  });

  return {
    sede: sede?.porcentaje ?? 0,
    siglo21: siglo?.porcentaje ?? 0,
    promoDesde: meta.promo_desde || '',
    promoHasta: meta.promo_hasta || '',
    recargo3: Math.round(recargo3 * 100),
    recargo6: Math.round(recargo6 * 100),
    especiales,
    carreras,
    ultimaSync: meta.ultima_sync,
    promoEspecialMat: Number(meta.promo_especial_matricula) || 0,
    promoEspecialTkA: Number(meta.promo_especial_tka) || 0,
    promoEspecialTkB: Number(meta.promo_especial_tkb) || 0,
  };
}

export default function PreciosAdminPage() {
  const CACHE_KEY = 'admin_precios_v2';
  const [data, setData] = useState<PageData | null>(() => {
    if (typeof window === 'undefined') return null;
    try { const c = localStorage.getItem(CACHE_KEY); return c ? JSON.parse(c) : null; } catch { return null; }
  });
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(true);
  const [search, setSearch] = useState('');
  const [showLista, setShowLista] = useState(false);

  // Overrides manuales: { "Abogacía": { benefMat: 0.05, benefTkA: 0.10, ... } }
  type OverrideKey = 'benefMat' | 'benefTkA' | 'benefTkB' | 'promoMat' | 'promoTkA' | 'promoTkB';
  const [overrides, setOverrides] = useState<Record<string, Partial<Record<OverrideKey, number>>>>({});
  const [editing, setEditing] = useState<{ carrera: string; field: OverrideKey } | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchData()
      .then(d => { setData(d); localStorage.setItem(CACHE_KEY, JSON.stringify(d)); setError(''); })
      .catch(e => { if (!data) setError(e.message); })
      .finally(() => setRefreshing(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restaurar scroll al recargar
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

  if (!data && refreshing) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#013729' }}><p className="text-[#7ca19b]">Cargando precios...</p></div>;
  if (!data && error) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#013729' }}><p className="text-red-400">{error}</p></div>;
  if (!data) return null;

  const filtered = data.carreras.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase()));
  const syncDate = data.ultimaSync ? new Date(data.ultimaSync).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sin datos';

  const promoVencida = data.promoHasta && data.promoHasta < new Date().toISOString().split('T')[0];
  const diasRestantes = data.promoHasta
    ? Math.ceil((new Date(data.promoHasta + 'T00:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen" style={{ background: '#013729', color: '#e0e0e0' }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Precios y Descuentos</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm">
              <span style={{ color: '#7ca19b' }}>
                Última sync: <span className="font-semibold text-white">{syncDate}</span>
              </span>
              {data.promoHasta && (
                <span style={{ color: promoVencida ? '#ef4444' : diasRestantes !== null && diasRestantes <= 3 ? '#e69b05' : '#7ca19b' }}>
                  {promoVencida
                    ? <>Promo vencida ({data.promoHasta}) <span className="font-bold">— verificar GitHub Actions</span></>
                    : <>Vence: <span className="font-semibold text-white">{data.promoHasta}</span> ({diasRestantes} {diasRestantes === 1 ? 'día' : 'días'})</>
                  }
                </span>
              )}
              {refreshing && <span className="text-[#e69b05]">Actualizando...</span>}
              {!refreshing && error && <span className="text-red-400">({error})</span>}
            </div>
            <p className="text-sm" style={{ color: '#7ca19b' }}>
              CAU Villa Lugano
            </p>
          </div>
          <a href="/admin/clases-apoyo" className="text-sm px-4 py-2 rounded-lg" style={{ background: '#1c2f31', color: '#00c7b1' }}>
            ← Clases de apoyo
          </a>
        </div>

        {/* Cards de descuentos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl p-4" style={{ background: '#1c2f31', border: '1px solid rgba(0,199,177,0.2)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#7ca19b' }}>Sede Local (Amigo referido)</p>
            <p className="text-3xl font-black" style={{ color: '#00c7b1' }}>{data.sede}%</p>
            <p className="text-xs mt-1" style={{ color: '#7ca19b' }}>Descuento adicional en cuotas (Ticket A y B)</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: '#1c2f31', border: '1px solid rgba(0,199,177,0.2)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#7ca19b' }}>Siglo 21 (Promoción general)</p>
            <p className="text-3xl font-black" style={{ color: '#00c7b1' }}>{data.siglo21}%</p>
            {data.promoDesde && (
              <p className="text-xs mt-1" style={{ color: '#7ca19b' }}>{data.promoDesde} → {data.promoHasta}</p>
            )}
          </div>
          <div className="rounded-xl p-4" style={{ background: '#1c2f31', border: '1px solid rgba(230,155,5,0.3)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#e69b05' }}>Financiación Visa/Master</p>
            <p className="text-sm font-bold text-white">Visa y Mastercard - Otros Bancos</p>
            <div className="flex gap-4 mt-2">
              <div>
                <p className="text-xs" style={{ color: '#7ca19b' }}>3 cuotas</p>
                <p className="text-xl font-black" style={{ color: data.recargo3 > 0 ? '#e69b05' : '#00c7b1' }}>
                  {data.recargo3 > 0 ? `+${data.recargo3}%` : 'Sin interés'}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: '#7ca19b' }}>6 cuotas</p>
                <p className="text-xl font-black" style={{ color: data.recargo6 > 0 ? '#e69b05' : '#00c7b1' }}>
                  {data.recargo6 > 0 ? `+${data.recargo6}%` : 'Sin interés'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Promo especial global */}
        {(data.promoEspecialMat > 0 || data.promoEspecialTkA > 0 || data.promoEspecialTkB > 0) && (
          <div className="rounded-xl p-4 mb-6 flex items-center gap-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)' }}>
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-sm font-bold text-red-400 uppercase tracking-wider">Promo especial global activa</p>
              <div className="flex gap-4 mt-2">
                {data.promoEspecialMat > 0 && (() => {
                  const total = Math.round(data.promoEspecialMat * 100);
                  const pura = total - data.siglo21;
                  return (
                    <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)' }}>
                      <p className="text-xs" style={{ color: '#7ca19b' }}>Matrícula</p>
                      <p className="text-lg font-black text-red-400">{total}%</p>
                      <p className="text-[0.65rem]" style={{ color: '#7ca19b' }}>{data.siglo21}% Siglo + {pura}% Promo</p>
                    </div>
                  );
                })()}
                {data.promoEspecialTkA > 0 && (() => {
                  const total = Math.round(data.promoEspecialTkA * 100);
                  const pura = total - data.siglo21 - data.sede;
                  return (
                    <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)' }}>
                      <p className="text-xs" style={{ color: '#7ca19b' }}>Ticket A</p>
                      <p className="text-lg font-black text-red-400">{total}%</p>
                      <p className="text-[0.65rem]" style={{ color: '#7ca19b' }}>{data.siglo21}% Siglo + {data.sede}% Sede + {pura}% Promo</p>
                    </div>
                  );
                })()}
                {data.promoEspecialTkB > 0 && (() => {
                  const total = Math.round(data.promoEspecialTkB * 100);
                  const pura = total - data.siglo21 - data.sede;
                  return (
                    <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)' }}>
                      <p className="text-xs" style={{ color: '#7ca19b' }}>Ticket B</p>
                      <p className="text-lg font-black text-red-400">{total}%</p>
                      <p className="text-[0.65rem]" style={{ color: '#7ca19b' }}>{data.siglo21}% Siglo + {data.sede}% Sede + {pura}% Promo</p>
                    </div>
                  );
                })()}
              </div>
              <p className="text-xs mt-2" style={{ color: '#7ca19b' }}>Editar desde Supabase → precios_meta (% total, ej: 0.60 = 60% incluye sede+siglo+promo)</p>
            </div>
          </div>
        )}

        {/* Especiales */}
        {data.especiales.length > 0 && (
          <div className="rounded-xl p-4 mb-6" style={{ background: '#1c2f31', border: '1px solid rgba(230,155,5,0.3)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#e69b05' }}>
              ★ Descuentos especiales ({data.especiales.length} carreras)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.especiales.map(e => (
                <div key={e.nombre} className="flex justify-between items-center px-3 py-2 rounded-lg" style={{ background: 'rgba(230,155,5,0.08)' }}>
                  <span className="text-sm font-semibold text-white truncate mr-2">{e.nombre}</span>
                  <span className="text-xs whitespace-nowrap" style={{ color: '#e69b05' }}>
                    Mat={pct(e.dtoMat)} A={pct(e.dtoTkA)} B={pct(e.dtoTkB)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar carrera..."
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm focus:outline-none"
            style={{ background: '#0e1918', border: '1px solid rgba(0,199,177,0.2)', color: '#e0e0e0' }}
          />
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none" style={{ color: '#7ca19b' }}>
            <input type="checkbox" checked={showLista} onChange={e => setShowLista(e.target.checked)} className="accent-[#00c7b1]" />
            Mostrar precios de lista
          </label>
          <span className="text-xs" style={{ color: '#7ca19b' }}>{filtered.length} carreras</span>
          {Object.keys(overrides).length > 0 && (
            <button
              onClick={() => setOverrides({})}
              className="px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              Quitar ediciones ({Object.keys(overrides).length})
            </button>
          )}
        </div>

        {/* Override global por columna */}
        <div className="flex flex-wrap gap-3 mb-4">
          {([
            { label: 'Benef. Mat', field: 'benefMat' as OverrideKey, color: '#00c7b1' },
            { label: 'Benef. TkA', field: 'benefTkA' as OverrideKey, color: '#00c7b1' },
            { label: 'Benef. TkB', field: 'benefTkB' as OverrideKey, color: '#00c7b1' },
            { label: 'Promo Mat', field: 'promoMat' as OverrideKey, color: '#e69b05' },
            { label: 'Promo TkA', field: 'promoTkA' as OverrideKey, color: '#e69b05' },
            { label: 'Promo TkB', field: 'promoTkB' as OverrideKey, color: '#e69b05' },
          ]).map(({ label, field, color }) => (
            <div key={field} className="flex items-center gap-1.5">
              <span className="text-[0.65rem] font-bold uppercase" style={{ color }}>{label}</span>
              <input
                type="text"
                placeholder="%"
                className="w-12 text-center text-xs px-1 py-1 rounded"
                style={{ background: '#0e1918', border: `1px solid ${color}40`, color: '#fff', outline: 'none' }}
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

        {/* Tabla */}
        <div className="overflow-x-auto rounded-xl" style={{ background: '#1c2f31', border: '1px solid rgba(0,199,177,0.15)' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th rowSpan={2} className="text-left px-3 py-2 font-bold text-white align-bottom" style={{ borderBottom: '2px solid rgba(0,199,177,0.3)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Carrera</th>
                <th colSpan={3} className="text-center px-1 py-1.5 font-bold text-xs uppercase tracking-wider" style={{ color: '#00c7b1', borderBottom: '1px solid rgba(0,199,177,0.2)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Dto. Beneficio</th>
                <th colSpan={3} className="text-center px-1 py-1.5 font-bold text-xs uppercase tracking-wider" style={{ color: '#e69b05', borderBottom: '1px solid rgba(230,155,5,0.25)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Dto. Promoción</th>
                {showLista && <th colSpan={3} className="text-center px-1 py-1.5 font-bold text-xs uppercase tracking-wider" style={{ color: '#7ca19b', borderBottom: '1px solid rgba(124,161,155,0.25)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Precios de Lista</th>}
                <th colSpan={3} className="text-center px-1 py-1.5 font-bold text-xs uppercase tracking-wider" style={{ color: '#00c7b1', borderBottom: '1px solid rgba(0,199,177,0.2)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Precios Finales</th>
                <th rowSpan={2} className="text-right px-2 py-2 font-bold text-white align-bottom" style={{ borderBottom: '2px solid rgba(0,199,177,0.3)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>Total</th>
                <th rowSpan={2} className="text-right px-2 py-2 font-bold align-bottom" style={{ color: '#e69b05', borderBottom: '2px solid rgba(0,199,177,0.3)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>3 cuotas</th>
                <th rowSpan={2} className="text-right px-2 py-2 font-bold align-bottom" style={{ color: '#e69b05', borderBottom: '2px solid rgba(0,199,177,0.3)' }}>6 cuotas</th>
              </tr>
              <tr>
                <th className="text-center px-1 py-1.5 text-xs" style={{ color: '#00c7b1', borderBottom: '2px solid rgba(0,199,177,0.3)' }}>Mat</th>
                <th className="text-center px-1 py-1.5 text-xs" style={{ color: '#00c7b1', borderBottom: '2px solid rgba(0,199,177,0.3)' }}>TkA</th>
                <th className="text-center px-1 py-1.5 text-xs" style={{ color: '#00c7b1', borderBottom: '2px solid rgba(0,199,177,0.3)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>TkB</th>
                <th className="text-center px-1 py-1.5 text-xs" style={{ color: '#e69b05', borderBottom: '2px solid rgba(0,199,177,0.3)' }}>Mat</th>
                <th className="text-center px-1 py-1.5 text-xs" style={{ color: '#e69b05', borderBottom: '2px solid rgba(0,199,177,0.3)' }}>TkA</th>
                <th className="text-center px-1 py-1.5 text-xs" style={{ color: '#e69b05', borderBottom: '2px solid rgba(0,199,177,0.3)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>TkB</th>
                {showLista && <>
                  <th className="text-right px-2 py-1.5 text-xs" style={{ color: '#7ca19b', borderBottom: '2px solid rgba(0,199,177,0.3)' }}>Mat</th>
                  <th className="text-right px-2 py-1.5 text-xs" style={{ color: '#7ca19b', borderBottom: '2px solid rgba(0,199,177,0.3)' }}>TkA</th>
                  <th className="text-right px-2 py-1.5 text-xs" style={{ color: '#7ca19b', borderBottom: '2px solid rgba(0,199,177,0.3)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>TkB</th>
                </>}
                <th className="text-right px-2 py-1.5 text-xs" style={{ color: '#00c7b1', borderBottom: '2px solid rgba(0,199,177,0.3)' }}>Mat</th>
                <th className="text-right px-2 py-1.5 text-xs" style={{ color: '#00c7b1', borderBottom: '2px solid rgba(0,199,177,0.3)' }}>TkA</th>
                <th className="text-right px-2 py-1.5 text-xs" style={{ color: '#00c7b1', borderBottom: '2px solid rgba(0,199,177,0.3)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>TkB</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const sedeVal = data.sede / 100;
                const ov = overrides[c.nombre] || {};
                const rc = recalc(c);
                const bdr = { borderRight: '1px solid rgba(255,255,255,0.1)' };
                const hasOverride = !!overrides[c.nombre];

                const benefMat = ov.benefMat ?? 0;
                const benefTkA = ov.benefTkA ?? sedeVal;
                const benefTkB = ov.benefTkB ?? sedeVal;

                const EditableCell = ({ field, value, defaultColor, extraStyle }: { field: OverrideKey; value: number; defaultColor: string; extraStyle?: React.CSSProperties }) => {
                  const isEditing = editing?.carrera === c.nombre && editing?.field === field;
                  const isOverridden = ov[field] !== undefined;

                  if (isEditing) {
                    return (
                      <td className="text-center px-0.5 py-1" style={extraStyle}>
                        <input
                          autoFocus
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') setEditing(null); }}
                          onBlur={confirmEdit}
                          className="w-12 text-center text-xs px-1 py-0.5 rounded"
                          style={{ background: '#0e1918', border: '1px solid #00c7b1', color: '#fff', outline: 'none' }}
                        />
                      </td>
                    );
                  }

                  return (
                    <td
                      className="text-center px-1 py-2.5 text-xs tabular-nums cursor-pointer hover:brightness-150"
                      style={{ color: isOverridden ? '#ef4444' : defaultColor, ...extraStyle }}
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
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    background: hasOverride ? 'rgba(239,68,68,0.06)' : c.esEspecial ? 'rgba(230,155,5,0.05)' : undefined,
                  }}
                >
                  <td className="px-3 py-2.5 font-semibold text-white" style={bdr}>
                    {c.esEspecial && <span style={{ color: '#e69b05' }}>★ </span>}
                    {hasOverride && <span style={{ color: '#ef4444' }}>✎ </span>}
                    {c.nombre}
                  </td>
                  {/* Dto. Beneficio: editables */}
                  <EditableCell field="benefMat" value={benefMat} defaultColor="#7ca19b" />
                  <EditableCell field="benefTkA" value={benefTkA} defaultColor="#00c7b1" />
                  <EditableCell field="benefTkB" value={benefTkB} defaultColor="#00c7b1" extraStyle={bdr} />
                  {/* Dto. Promoción: editables */}
                  <EditableCell field="promoMat" value={rc.dtoMat} defaultColor={c.esEspecial && c.dtoMat !== c.dtoTkA ? '#e69b05' : '#7ca19b'} />
                  <EditableCell field="promoTkA" value={rc.dtoTkA} defaultColor={c.esEspecial ? '#e69b05' : '#7ca19b'} />
                  <EditableCell field="promoTkB" value={rc.dtoTkB} defaultColor={c.esEspecial ? '#e69b05' : '#7ca19b'} extraStyle={bdr} />
                  {showLista && <>
                    <td className="text-right px-2 py-2.5 tabular-nums" style={{ color: '#7ca19b' }}>{fmt(c.matLista)}</td>
                    <td className="text-right px-2 py-2.5 tabular-nums" style={{ color: '#7ca19b' }}>{fmt(c.tkaLista)}</td>
                    <td className="text-right px-2 py-2.5 tabular-nums" style={{ color: '#7ca19b', ...bdr }}>{fmt(c.tkbLista)}</td>
                  </>}
                  <td className="text-right px-2 py-2.5 font-semibold tabular-nums" style={{ color: hasOverride ? '#ef4444' : '#00c7b1' }}>{fmt(rc.matFinal)}</td>
                  <td className="text-right px-2 py-2.5 font-semibold tabular-nums" style={{ color: hasOverride ? '#ef4444' : '#00c7b1' }}>{fmt(rc.tkaFinal)}</td>
                  <td className="text-right px-2 py-2.5 font-semibold tabular-nums" style={{ color: hasOverride ? '#ef4444' : '#00c7b1', ...bdr }}>{fmt(rc.tkbFinal)}</td>
                  <td className="text-right px-2 py-2.5 font-bold tabular-nums" style={{ color: hasOverride ? '#ef4444' : '#fff', ...bdr }}>{fmt(rc.total)}</td>
                  <td className="text-right px-2 py-2.5 font-semibold tabular-nums" style={{ color: '#e69b05', ...bdr }}>{fmt(rc.cuota3)}</td>
                  <td className="text-right px-2 py-2.5 font-semibold tabular-nums" style={{ color: '#e69b05' }}>{fmt(rc.cuota6)}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
