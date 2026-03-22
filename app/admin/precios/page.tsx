'use client';

import { useState, useEffect } from 'react';

interface CarreraPrecios {
  nombre: string;
  esEspecial: boolean;
  lista: { matricula: number; ticketA: number; ticketB: number };
  final: { matricula: number; ticketA: number; ticketB: number };
  cuotas3: { ticketA: number; ticketB: number };
  cuotas6: { ticketA: number; ticketB: number };
  descuento: { matricula: number; ticketA: number; ticketB: number };
}

interface Especial {
  carrera: string;
  nombre: string;
  matricula: number;
  ticketA: number;
  ticketB: number;
}

interface PreciosData {
  descuentos: {
    sede: number;
    siglo21: number;
    promoGeneral: { matricula: number; ticketA: number; ticketB: number; desde: string; hasta: string };
    especiales: Especial[];
  };
  financiacion: { tarjeta: string; recargo3: number; recargo6: number };
  carreras: CarreraPrecios[];
}

const fmt = (n: number) => `$${n.toLocaleString('es-AR')}`;
const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function PreciosAdminPage() {
  const [data, setData] = useState<PreciosData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showLista, setShowLista] = useState(false);

  useEffect(() => {
    fetch('/api/admin/precios')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#013729' }}><p className="text-[#7ca19b]">Cargando precios...</p></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#013729' }}><p className="text-red-400">{error}</p></div>;
  if (!data) return null;

  const { descuentos, financiacion, carreras } = data;
  const filtered = carreras.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen" style={{ background: '#013729', color: '#e0e0e0' }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Precios y Descuentos</h1>
            <p className="text-sm" style={{ color: '#7ca19b' }}>CAU Villa Lugano — Datos del Excel</p>
          </div>
          <a href="/admin/clases-apoyo" className="text-sm px-4 py-2 rounded-lg" style={{ background: '#1c2f31', color: '#00c7b1' }}>
            ← Clases de apoyo
          </a>
        </div>

        {/* Descuentos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl p-4" style={{ background: '#1c2f31', border: '1px solid rgba(0,199,177,0.2)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#7ca19b' }}>Sede Local (Amigo referido)</p>
            <p className="text-3xl font-black" style={{ color: '#00c7b1' }}>{descuentos.sede}%</p>
            <p className="text-xs mt-1" style={{ color: '#7ca19b' }}>Solo en cuotas (Ticket A y B)</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: '#1c2f31', border: '1px solid rgba(0,199,177,0.2)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#7ca19b' }}>Siglo 21 (Promoción general)</p>
            <p className="text-3xl font-black" style={{ color: '#00c7b1' }}>{descuentos.siglo21}%</p>
            <p className="text-xs mt-1" style={{ color: '#7ca19b' }}>
              Mat={pct(descuentos.promoGeneral.matricula)} TkA={pct(descuentos.promoGeneral.ticketA)} TkB={pct(descuentos.promoGeneral.ticketB)}
            </p>
            {descuentos.promoGeneral.desde && (
              <p className="text-xs mt-0.5" style={{ color: '#7ca19b' }}>{descuentos.promoGeneral.desde} → {descuentos.promoGeneral.hasta}</p>
            )}
          </div>
          <div className="rounded-xl p-4" style={{ background: '#1c2f31', border: '1px solid rgba(230,155,5,0.3)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#e69b05' }}>Financiación Visa/Master</p>
            <p className="text-sm font-bold text-white">{financiacion.tarjeta}</p>
            <div className="flex gap-4 mt-2">
              <div>
                <p className="text-xs" style={{ color: '#7ca19b' }}>3 cuotas</p>
                <p className="text-xl font-black" style={{ color: financiacion.recargo3 > 0 ? '#e69b05' : '#00c7b1' }}>
                  {financiacion.recargo3 > 0 ? `+${financiacion.recargo3}%` : 'Sin interés'}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: '#7ca19b' }}>6 cuotas</p>
                <p className="text-xl font-black" style={{ color: financiacion.recargo6 > 0 ? '#e69b05' : '#00c7b1' }}>
                  {financiacion.recargo6 > 0 ? `+${financiacion.recargo6}%` : 'Sin interés'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Especiales */}
        {descuentos.especiales.length > 0 && (
          <div className="rounded-xl p-4 mb-6" style={{ background: '#1c2f31', border: '1px solid rgba(230,155,5,0.3)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#e69b05' }}>
              ★ Descuentos especiales ({descuentos.especiales.length} carreras)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {descuentos.especiales.map(e => (
                <div key={e.carrera} className="flex justify-between items-center px-3 py-2 rounded-lg" style={{ background: 'rgba(230,155,5,0.08)' }}>
                  <span className="text-sm font-semibold text-white truncate mr-2">{e.nombre}</span>
                  <span className="text-xs whitespace-nowrap" style={{ color: '#e69b05' }}>
                    Mat={pct(e.matricula)} A={pct(e.ticketA)} B={pct(e.ticketB)}
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
        <div className="overflow-x-auto rounded-xl" style={{ background: '#1c2f31' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,199,177,0.15)' }}>
                <th className="text-left px-3 py-3 font-bold text-white">Carrera</th>
                {showLista && <>
                  <th className="text-right px-2 py-3 font-semibold" style={{ color: '#7ca19b' }}>Mat. Lista</th>
                  <th className="text-right px-2 py-3 font-semibold" style={{ color: '#7ca19b' }}>TkA Lista</th>
                  <th className="text-right px-2 py-3 font-semibold" style={{ color: '#7ca19b' }}>TkB Lista</th>
                </>}
                <th className="text-right px-2 py-3 font-bold" style={{ color: '#00c7b1' }}>Matrícula</th>
                <th className="text-right px-2 py-3 font-bold" style={{ color: '#00c7b1' }}>Cuota A</th>
                <th className="text-right px-2 py-3 font-bold" style={{ color: '#00c7b1' }}>Cuota B</th>
                <th className="text-right px-2 py-3 font-bold" style={{ color: '#e69b05' }}>A 3 cuotas</th>
                <th className="text-right px-2 py-3 font-bold" style={{ color: '#e69b05' }}>B 3 cuotas</th>
                <th className="text-right px-2 py-3 font-bold" style={{ color: '#e69b05' }}>A 6 cuotas</th>
                <th className="text-right px-2 py-3 font-bold" style={{ color: '#e69b05' }}>B 6 cuotas</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.nombre + i}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: c.esEspecial ? 'rgba(230,155,5,0.05)' : undefined,
                  }}
                >
                  <td className="px-3 py-2.5 font-semibold text-white">
                    {c.esEspecial && <span style={{ color: '#e69b05' }}>★ </span>}
                    {c.nombre}
                  </td>
                  {showLista && <>
                    <td className="text-right px-2 py-2.5 tabular-nums" style={{ color: '#7ca19b' }}>{fmt(c.lista.matricula)}</td>
                    <td className="text-right px-2 py-2.5 tabular-nums" style={{ color: '#7ca19b' }}>{fmt(c.lista.ticketA)}</td>
                    <td className="text-right px-2 py-2.5 tabular-nums" style={{ color: '#7ca19b' }}>{fmt(c.lista.ticketB)}</td>
                  </>}
                  <td className="text-right px-2 py-2.5 font-semibold tabular-nums" style={{ color: '#00c7b1' }}>{fmt(c.final.matricula)}</td>
                  <td className="text-right px-2 py-2.5 font-semibold tabular-nums" style={{ color: '#00c7b1' }}>{fmt(c.final.ticketA)}</td>
                  <td className="text-right px-2 py-2.5 font-semibold tabular-nums" style={{ color: '#00c7b1' }}>{fmt(c.final.ticketB)}</td>
                  <td className="text-right px-2 py-2.5 tabular-nums" style={{ color: '#e69b05' }}>{fmt(c.cuotas3.ticketA)}</td>
                  <td className="text-right px-2 py-2.5 tabular-nums" style={{ color: '#e69b05' }}>{fmt(c.cuotas3.ticketB)}</td>
                  <td className="text-right px-2 py-2.5 tabular-nums" style={{ color: '#e69b05' }}>{fmt(c.cuotas6.ticketA)}</td>
                  <td className="text-right px-2 py-2.5 tabular-nums" style={{ color: '#e69b05' }}>{fmt(c.cuotas6.ticketB)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
