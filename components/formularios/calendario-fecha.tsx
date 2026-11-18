'use client';

import { useEffect, useRef, useState } from 'react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

const ANIOS = Array.from(
  { length: 76 },
  (_, indice) => String(new Date().getFullYear() - 15 - indice),
);

function diasDelMes(anio: number, mes: number) {
  if (mes === 2) {
    const bisiesto = (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
    return bisiesto ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(mes) ? 30 : 31;
}

/**
 * Calendario visual para elegir una fecha. Se conserva separado del campo de
 * nacimiento y no se monta actualmente en los formularios.
 */
export function CalendarioFecha({ valor, onChange }: {
  valor: string;
  onChange: (valor: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const cajaRef = useRef<HTMLDivElement>(null);
  const [anioValor = '', mesValor = '', diaValor = ''] = valor ? valor.split('-') : [];
  const [vista, setVista] = useState(() => ({
    anio: Number(anioValor) || Number(ANIOS[3]),
    mes: Number(mesValor) || 1,
  }));

  useEffect(() => {
    if (!abierto) return;
    const afuera = (evento: MouseEvent) => {
      if (cajaRef.current && !cajaRef.current.contains(evento.target as Node)) setAbierto(false);
    };
    const escape = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', afuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', afuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto]);

  const alternar = () => {
    if (!abierto && anioValor && mesValor) {
      setVista({ anio: Number(anioValor), mes: Number(mesValor) });
    }
    setAbierto(!abierto);
  };

  const elegir = (dia: number) => {
    onChange(`${vista.anio}-${String(vista.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`);
    setAbierto(false);
  };

  const total = diasDelMes(vista.anio, vista.mes);
  // getDay() da 0 para domingo; acá la semana empieza el lunes.
  const arranque = (new Date(vista.anio, vista.mes - 1, 1).getDay() + 6) % 7;

  return (
    <div className="relative" ref={cajaRef}>
      <button
        type="button"
        onClick={alternar}
        aria-label="Elegir fecha en el calendario"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        className="flex h-7 w-8 min-h-[24px] min-w-[24px] items-center justify-center rounded-md border border-[var(--catalogo-acento)]/25 bg-[var(--catalogo-acento)]/10"
      >
        <svg className="h-3.5 w-3.5 text-[var(--catalogo-acento)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path strokeLinecap="round" d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Elegir la fecha"
          className="absolute top-full z-30 mt-1 w-full min-w-[17rem] rounded-lg border border-[var(--catalogo-acento)]/25 bg-[var(--catalogo-form-campo)] p-2 shadow-xl"
        >
          <div className="mb-2 grid grid-cols-2 gap-1.5">
            <select
              aria-label="Mes"
              value={vista.mes}
              onChange={evento => setVista(actual => ({ ...actual, mes: Number(evento.target.value) }))}
              className="rounded-md bg-[var(--catalogo-form-campo)] px-2 py-1 text-sm text-white"
            >
              {MESES.map((mes, indice) => <option key={mes} value={indice + 1}>{mes}</option>)}
            </select>
            <select
              aria-label="Año"
              value={vista.anio}
              onChange={evento => setVista(actual => ({ ...actual, anio: Number(evento.target.value) }))}
              className="rounded-md bg-[var(--catalogo-form-campo)] px-2 py-1 text-sm text-white"
            >
              {ANIOS.map(anio => <option key={anio} value={anio}>{anio}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((letra, indice) => (
              <span key={indice} className="py-1 text-[10px] font-bold uppercase text-[var(--catalogo-etiqueta)]">{letra}</span>
            ))}
            {Array.from({ length: arranque }, (_, indice) => <span key={`hueco-${indice}`} />)}
            {Array.from({ length: total }, (_, indice) => indice + 1).map(dia => {
              const elegido = Number(diaValor) === dia
                && Number(mesValor) === vista.mes && Number(anioValor) === vista.anio;
              return (
                <button
                  key={dia}
                  type="button"
                  onClick={() => elegir(dia)}
                  className={`rounded py-1 text-sm transition-colors ${elegido
                    ? 'bg-[var(--catalogo-acento)] font-bold text-[var(--catalogo-acento-tinta)]'
                    : 'text-white hover:bg-[var(--catalogo-acento)]/20'}`}
                >
                  {dia}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
