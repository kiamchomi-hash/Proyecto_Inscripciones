'use client';

import { useEffect, useState } from 'react';
import { PERIODOS, formatearFecha } from './datos';

/**
 * El cartel de "que es lo proximo que me vence".
 *
 * Va en el cliente a proposito: la pagina es estatica (sin `revalidate`), asi
 * que cualquier cuenta contra "hoy" hecha en el servidor queda congelada en el
 * momento del build y a la semana miente. `/clases-apoyo` ya paso por esto.
 *
 * Antes de hidratar no dibuja nada: lo que Google indexa es la tabla completa
 * de abajo, que no depende de la fecha.
 */

type Hito =
  | { tipo: 'inscripcion'; fecha: string }
  | { tipo: 'inicio'; fecha: string }
  | { tipo: 'cerrado' };

function calcularHito(hoy: string): Hito {
  // Inscripcion abierta: la cursada ya arranco pero todavia se puede anotar.
  const enCurso = PERIODOS.find(p => hoy >= p.inicio && hoy <= p.inscripcion);
  if (enCurso) return { tipo: 'inscripcion', fecha: enCurso.inscripcion };

  const proximo = PERIODOS.find(p => p.inicio > hoy);
  if (proximo) return { tipo: 'inicio', fecha: proximo.inicio };

  return { tipo: 'cerrado' };
}

export default function ProximoHito() {
  const [hito, setHito] = useState<Hito | null>(null);

  useEffect(() => {
    // Fecha local en ISO, sin pasar por UTC: toISOString() adelanta un dia a
    // quien mira despues de las 21 hs en Argentina.
    const d = new Date();
    const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setHito(calcularHito(hoy));
  }, []);

  if (!hito || hito.tipo === 'cerrado') return null;

  const esInscripcion = hito.tipo === 'inscripcion';

  return (
    <div
      className="ca-destacado rounded-2xl px-5 py-4 sm:px-7 sm:py-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5"
      role="status"
    >
      <span className="ca-destacado-pulso" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#00c7b1' }}>
          {esInscripcion ? 'Inscripción abierta' : 'Próximo inicio de cursada'}
        </p>
        <p className="text-lg sm:text-2xl font-black text-white tracking-tight">
          {esInscripcion
            ? `Podés anotarte a materias hasta el ${formatearFecha(hito.fecha)}`
            : `Las clases empiezan el ${formatearFecha(hito.fecha)}`}
        </p>
      </div>
      <a
        href="https://wa.me/5491132973801?text=Hola%2C%20quiero%20consultar%20por%20las%20fechas%20de%20inscripci%C3%B3n"
        target="_blank"
        rel="noopener nofollow"
        className="ca-cta inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-bold text-white text-sm flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 0 0 .917.918l4.458-1.495A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 0 1-5.39-1.586l-.386-.238-2.65.889.889-2.65-.238-.386A9.94 9.94 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
        </svg>
        Consultar por WhatsApp
      </a>
    </div>
  );
}
