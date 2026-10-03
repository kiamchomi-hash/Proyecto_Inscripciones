'use client';

// Fecha de inicio y aviso de inscripcion abierta de una carrera de Teclab.
// Se calcula recien despues de montar: en el servidor y en el primer render
// del cliente no pinta nada. Asi no hay desfasaje de hidratacion y el HTML
// cacheado por ISR (la ficha revalida una vez por dia) nunca muestra una
// inscripcion que ya cerro.

import { useEffect, useState, type CSSProperties } from 'react';
import type { Carrera } from './types';
import { inicioTeclab, type InicioTeclab } from './inicio-teclab';

export default function AvisoInicioTeclab({
  carrera,
  acento,
  className = '',
}: {
  carrera: Pick<Carrera, 'nivel'>;
  acento: string;
  className?: string;
}) {
  const [inicio, setInicio] = useState<InicioTeclab | null>(null);
  const { nivel } = carrera;

  useEffect(() => {
    setInicio(inicioTeclab({ nivel }, new Date()));
  }, [nivel]);

  if (!inicio) return null;

  return (
    <p
      className={`aviso-inicio-teclab ${className}`}
      style={{ '--aviso-acento': acento } as CSSProperties}
    >
      {/* Con las clases ya empezadas la fecha que importa es el cierre: el
          inicio pasa a ser el dato secundario. */}
      {inicio.empezo ? (
        <>
          <span className="aviso-inicio-teclab-fecha">
            Las clases empezaron el <time dateTime={inicio.inicio}>{inicio.inicioTexto}</time>
          </span>
          <strong className="aviso-inicio-teclab-cta">
            Tenés tiempo hasta el <time dateTime={inicio.hasta}>{inicio.hastaTexto}</time>
          </strong>
        </>
      ) : (
        <>
          <span className="aviso-inicio-teclab-fecha">
            Inicio de clases: <time dateTime={inicio.inicio}>{inicio.inicioTexto}</time>
          </span>
          <strong className="aviso-inicio-teclab-cta">Todavía estás a tiempo de inscribirte</strong>
        </>
      )}
    </p>
  );
}
