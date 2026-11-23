// Prueba A/B del ticket de descuento en la ficha de Teclab (23/11/2026).
//
//   control          50 %  la ficha sin ticket, como estaba
//   bimestres        25 %  el ticket del descuento de los bimestres en la
//                          portada, con borde blanco
//   bimestres-azul   25 %  el mismo, con borde azul
//
// En tablet (901 a 1199 px) el ticket va antes del formulario. En celular no
// hay ticket: todos los grupos ven lo mismo, así que la comparación se hace
// sólo con las visitas de computadora (`movil = 0`).
//
// El grupo se sortea en el servidor la primera vez y queda en una cookie por
// 30 días: la misma persona ve siempre lo mismo y la página no parpadea.
// `?ticket=<grupo>` fuerza uno para revisar a mano, sin tocar la cookie; esas
// visitas se miden como `revision`.

import type { PromoTeclab } from '../components/carreras/descuentos-teclab';

export const COOKIE_AB_TICKET = 'ab_ticket_teclab';
export const DURACION_AB_TICKET_S = 30 * 24 * 60 * 60;

export const VARIANTES_TICKET = ['control', 'bimestres', 'bimestres-azul'] as const;
export type VarianteTicket = (typeof VARIANTES_TICKET)[number];

/** El color del borde del ticket. */
export type BordeTicket = 'blanco' | 'azul';

export interface TicketsVisibles {
  /** Sólo el descuento de los bimestres: la matrícula queda en null. */
  promo: PromoTeclab;
  borde: BordeTicket;
}

export function esVarianteTicket(valor: unknown): valor is VarianteTicket {
  return typeof valor === 'string' && (VARIANTES_TICKET as readonly string[]).includes(valor);
}

/** El sorteo: 50 % sin ticket, 25 % borde blanco, 25 % borde azul. */
export function sortearVarianteTicket(azar: number = Math.random()): VarianteTicket {
  if (azar < 0.5) return 'control';
  if (azar < 0.75) return 'bimestres';
  return 'bimestres-azul';
}

/** Lo que ve cada grupo. Sin descuento de bimestres, `null`. */
export function ticketsSegunVariante(promo: PromoTeclab | null, variante: VarianteTicket): TicketsVisibles | null {
  if (!promo || variante === 'control' || promo.bimestres === null) return null;
  return {
    promo: { ...promo, matricula: null },
    borde: variante === 'bimestres-azul' ? 'azul' : 'blanco',
  };
}
