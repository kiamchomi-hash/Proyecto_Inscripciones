'use client';

// Ticket del descuento de los bimestres, parado. La forma y el movimiento salen
// de la pieza «ticket-claude-code» de la biblioteca UIverse local (copia de
// referencia del ticket de claude.ai): troquel con bordes festoneados, filete
// interior, inclinación 3D que sigue al puntero (transform .25s ease-out, 10°
// de máximo) y reflejo radial. No lleva nada de Anthropic: ni logo, ni
// mascota, ni textos. En vez de darse vuelta, lleva al formulario.

import { useRef, type PointerEvent } from 'react';
import type { PromoTeclab } from './descuentos-teclab';

const MAX_GRADOS = 10;

/** El botón del ticket: corto, que entre en un renglón aun en el ticket chico. */
const ACCION = 'Usar';

// El troquel original (550 x 300, festón en los lados cortos) girado y acortado a 300 x 400:
// el festón queda arriba y abajo.
const TROQUEL =
  'M 30 0 A 30 30 0 0 1 0 30 L 0 370 A 30 30 0 0 1 30 400 L 39 400 C 39 392 49 392 49 400 L 58 400 C 58 392 68 392 68 400 L 77 400 C 77 392 87 392 87 400 L 97 400 C 97 392 107 392 107 400 L 116 400 C 116 392 126 392 126 400 L 135 400 C 135 392 145 392 145 400 L 155 400 C 155 392 165 392 165 400 L 174 400 C 174 392 184 392 184 400 L 193 400 C 193 392 203 392 203 400 L 212 400 C 212 392 222 392 222 400 L 232 400 C 232 392 242 392 242 400 L 251 400 C 251 392 261 392 261 400 L 270 400 A 30 30 0 0 1 300 370 L 300 30 A 30 30 0 0 1 270 0 L 261 0 C 261 8 251 8 251 0 L 242 0 C 242 8 232 8 232 0 L 222 0 C 222 8 212 8 212 0 L 203 0 C 203 8 193 8 193 0 L 184 0 C 184 8 174 8 174 0 L 165 0 C 165 8 155 8 155 0 L 145 0 C 145 8 135 8 135 0 L 126 0 C 126 8 116 8 116 0 L 107 0 C 107 8 97 8 97 0 L 87 0 C 87 8 77 8 77 0 L 68 0 C 68 8 58 8 58 0 L 49 0 C 49 8 39 8 39 0 Z';
const FILETE =
  'M 44.5 18 A 48 48 0 0 1 18 44.5 L 18 355.5 A 48 48 0 0 1 44.5 382 L 255.5 382 A 48 48 0 0 1 282 355.5 L 282 44.5 A 48 48 0 0 1 255.5 18 Z';

/** `AAAA-MM-DD` -> `DD/MM`, sin pasar por `Date` (se correría un día por UTC). */
function diaMes(fecha: string): string {
  const [, mes, dia] = fecha.split('-');
  return `${dia}/${mes}`;
}

/**
 * Los tickets de una carrera, uno por descuento: matrícula primero, después
 * bimestres. `className` ubica el grupo (portada o antes del formulario).
 */
export default function TicketsDescuento({ promo, className = '' }: { promo: PromoTeclab; className?: string }) {
  const tickets = [
    promo.matricula !== null && { clave: 'matricula', descuento: promo.matricula, rotulo: 'de descuento en la matrícula' },
    promo.bimestres !== null && { clave: 'bimestres', descuento: promo.bimestres, rotulo: 'de descuento en los bimestres' },
  ].filter((t): t is { clave: string; descuento: number; rotulo: string } => Boolean(t));
  if (tickets.length === 0) return null;
  return (
    <div className={`td-grupo td-grupo--${tickets.length} ${className}`}>
      {tickets.map((t) => (
        <TicketDescuento key={t.clave} descuento={t.descuento} rotulo={t.rotulo} vigenteHasta={promo.vigenteHasta} />
      ))}
    </div>
  );
}

function TicketDescuento({ descuento, rotulo, vigenteHasta }: { descuento: number; rotulo: string; vigenteHasta: string }) {
  const ref = useRef<HTMLAnchorElement>(null);

  const mover = (e: PointerEvent<HTMLAnchorElement>) => {
    const ticket = ref.current;
    if (!ticket || e.pointerType !== 'mouse') return;
    const r = ticket.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    ticket.style.setProperty('--td-x', `${(x * 100).toFixed(1)}%`);
    ticket.style.setProperty('--td-y', `${(y * 100).toFixed(1)}%`);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    ticket.style.setProperty('--td-ry', `${((x - 0.5) * 2 * MAX_GRADOS).toFixed(2)}deg`);
    ticket.style.setProperty('--td-rx', `${((0.5 - y) * 2 * MAX_GRADOS).toFixed(2)}deg`);
  };

  const soltar = () => {
    ref.current?.style.setProperty('--td-rx', '0deg');
    ref.current?.style.setProperty('--td-ry', '0deg');
  };

  return (
    <div className="td-escena">
      <a
        ref={ref}
        href="#preinscripcion"
        className="td-ticket"
        onPointerMove={mover}
        onPointerLeave={soltar}
        aria-label={`${descuento}% ${rotulo}, vigente hasta el ${diaMes(vigenteHasta)}. ${ACCION}`}
      >
        <svg className="td-sombra" viewBox="0 0 300 400" aria-hidden="true"><path d={TROQUEL} /></svg>
        <span className="td-cara" aria-hidden="true">
          <svg className="td-fondo" viewBox="0 0 300 400" preserveAspectRatio="none">
            <path d={TROQUEL} className="td-papel" />
            <path d={FILETE} className="td-centro" />
            <path d={FILETE} className="td-filete" />
          </svg>
          <span className="td-banda td-banda--arriba">Teclab</span>
          <span className="td-contenido">
            <span className="td-numero">{descuento}<span>%</span></span>
            <span className="td-rotulo">{rotulo}</span>
            <span className="td-vigencia">Vigente hasta el {diaMes(vigenteHasta)}</span>
            <span className="td-accion">{ACCION}</span>
          </span>
          <span className="td-banda td-banda--abajo">Teclab</span>
          <span className="td-reflejo" />
        </span>
      </a>
    </div>
  );
}
