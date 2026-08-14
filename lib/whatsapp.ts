/**
 * Los WhatsApp del CAU y cómo se reparten los leads entre los asesores.
 *
 * `NUMERO_CAU` es el número institucional: es el que sale escrito en el HTML de
 * los 21 botones, en el `telephone` del JSON-LD y en la ficha de Google. No se
 * sortea nada de eso — el dato estructurado tiene que ser estable, y el número
 * de la ficha es el del centro, no el del asesor que esté de turno.
 *
 * El reparto ocurre recién al hacer clic, en el navegador (ver
 * `components/whatsapp-reparto.tsx`). Tiene que ser ahí: las páginas son
 * estáticas con ISR, así que si el número se eligiera al renderizar, todos los
 * visitantes de esa página cacheada verían el mismo hasta la próxima
 * revalidación.
 */

/** Villa Lugano, el que va escrito en el HTML. Formato de `wa.me`, sin `+`. */
export const NUMERO_CAU = '5491166522722';

/**
 * Entre quiénes se reparten las consultas que entran por WhatsApp, mitad y
 * mitad. El primero es el mismo `NUMERO_CAU`: así, si el sorteo no llega a
 * correr —JavaScript apagado, un clic antes de que hidrate—, el enlace lleva a
 * un asesor real igual.
 */
export const ASESORES = [
  { nombre: 'Matías', numero: NUMERO_CAU },
  { nombre: 'Viviana', numero: '5491137863510' },
] as const;
