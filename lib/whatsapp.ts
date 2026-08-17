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
 * Entre quiénes se reparten las consultas que entran por WhatsApp. El primero
 * es el mismo `NUMERO_CAU`: así, si el sorteo no llega a correr —JavaScript
 * apagado, un clic antes de que hidrate—, el enlace lleva a un asesor real
 * igual.
 *
 * **Hoy queda un solo asesor, así que no se reparte nada**: el sorteo siempre
 * devuelve el número que ya está escrito en el HTML y todas las consultas van a
 * Matías. Para volver a repartir alcanza con descomentar la línea de abajo (o
 * agregar otra): el reparto vuelve solo, no hay nada más que tocar.
 *
 * Ojo con el `localStorage` al reactivarlo: el sorteo se guarda por visitante
 * bajo la clave `cau-asesor`, así que quien ya tenga guardado un índice de
 * cuando eran dos vuelve a caer en el mismo asesor que le tocó entonces.
 */
export const ASESORES = [
  { nombre: 'Matías', numero: NUMERO_CAU },
  // { nombre: 'Viviana', numero: '5491137863510' },
] as const;
