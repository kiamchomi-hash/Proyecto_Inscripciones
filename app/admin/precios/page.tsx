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
  dtoMatTotal: number;
  dtoTkATotal: number;
  dtoTkBTotal: number;
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

    // Matrícula: solo promo. Tickets: promo + sede (amigo referido)
    const sedeVal = (sede?.porcentaje ?? 0) / 100;
    const matFinal = matLista * (1 - dtoMat);
    const tkaFinal = tkaLista * (1 - dtoTkA) * (1 - sedeVal);
    const tkbFinal = tkbLista * (1 - dtoTkB) * (1 - sedeVal);
    const total = matFinal + tkaFinal + tkbFinal;

    // % total = beneficio + promoción (como lo muestra el Excel)
    const dtoMatTotal = dtoMat;
    const dtoTkATotal = dtoTkA + sedeVal;
    const dtoTkBTotal = dtoTkB + sedeVal;

    return {
      nombre: p.nombre_supabase,
      esEspecial: p.es_especial,
      matLista, tkaLista, tkbLista,
      dtoMat, dtoTkA, dtoTkB,
      dtoMatTotal, dtoTkATotal, dtoTkBTotal,
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

  useEffect(() => {
    fetchData()
      .then(d => { setData(d); localStorage.setItem(CACHE_KEY, JSON.stringify(d)); setError(''); })
      .catch(e => { if (!data) setError(e.message); })
      .finally(() => setRefreshing(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data && refreshing) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#013729' }}><p className="text-[#7ca19b]">Cargando precios...</p></div>;
  if (!data && error) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#013729' }}><p className="text-red-400">{error}</p></div>;
  if (!data) return null;

  const filtered = data.carreras.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase()));
  const syncDate = data.ultimaSync ? new Date(data.ultimaSync).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="min-h-screen" style={{ background: '#013729', color: '#e0e0e0' }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Precios y Descuentos</h1>
            <p className="text-sm" style={{ color: '#7ca19b' }}>
              CAU Villa Lugano
              {syncDate && <span className="ml-2">({syncDate})</span>}
              {refreshing && <span className="ml-2 text-[#e69b05]">Actualizando...</span>}
              {!refreshing && error && <span className="ml-2 text-red-400">({error})</span>}
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
                const bdr = { borderRight: '1px solid rgba(255,255,255,0.1)' };
                return (
                <tr
                  key={c.nombre + i}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    background: c.esEspecial ? 'rgba(230,155,5,0.05)' : undefined,
                  }}
                >
                  <td className="px-3 py-2.5 font-semibold text-white" style={bdr}>
                    {c.esEspecial && <span style={{ color: '#e69b05' }}>★ </span>}
                    {c.nombre}
                  </td>
                  {/* Dto. Beneficio: Mat=0, TkA=sede, TkB=sede */}
                  <td className="text-center px-1 py-2.5 text-xs tabular-nums" style={{ color: '#7ca19b' }}>0%</td>
                  <td className="text-center px-1 py-2.5 text-xs tabular-nums" style={{ color: '#00c7b1' }}>{pct(sedeVal)}</td>
                  <td className="text-center px-1 py-2.5 text-xs tabular-nums" style={{ color: '#00c7b1', ...bdr }}>{pct(sedeVal)}</td>
                  {/* Dto. Promoción */}
                  <td className="text-center px-1 py-2.5 text-xs tabular-nums" style={{ color: c.esEspecial && c.dtoMat !== c.dtoTkA ? '#e69b05' : '#7ca19b' }}>{pct(c.dtoMat)}</td>
                  <td className="text-center px-1 py-2.5 text-xs tabular-nums" style={{ color: c.esEspecial ? '#e69b05' : '#7ca19b' }}>{pct(c.dtoTkA)}</td>
                  <td className="text-center px-1 py-2.5 text-xs tabular-nums" style={{ color: c.esEspecial ? '#e69b05' : '#7ca19b', ...bdr }}>{pct(c.dtoTkB)}</td>
                  {showLista && <>
                    <td className="text-right px-2 py-2.5 tabular-nums" style={{ color: '#7ca19b' }}>{fmt(c.matLista)}</td>
                    <td className="text-right px-2 py-2.5 tabular-nums" style={{ color: '#7ca19b' }}>{fmt(c.tkaLista)}</td>
                    <td className="text-right px-2 py-2.5 tabular-nums" style={{ color: '#7ca19b', ...bdr }}>{fmt(c.tkbLista)}</td>
                  </>}
                  <td className="text-right px-2 py-2.5 font-semibold tabular-nums" style={{ color: '#00c7b1' }}>{fmt(c.matFinal)}</td>
                  <td className="text-right px-2 py-2.5 font-semibold tabular-nums" style={{ color: '#00c7b1' }}>{fmt(c.tkaFinal)}</td>
                  <td className="text-right px-2 py-2.5 font-semibold tabular-nums" style={{ color: '#00c7b1', ...bdr }}>{fmt(c.tkbFinal)}</td>
                  <td className="text-right px-2 py-2.5 font-bold tabular-nums text-white" style={bdr}>{fmt(c.total)}</td>
                  <td className="text-right px-2 py-2.5 font-semibold tabular-nums" style={{ color: '#e69b05', ...bdr }}>{fmt(c.cuota3)}</td>
                  <td className="text-right px-2 py-2.5 font-semibold tabular-nums" style={{ color: '#e69b05' }}>{fmt(c.cuota6)}</td>
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
