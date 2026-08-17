'use client';

import { useEffect } from 'react';
import { trackWhatsapp } from '@/lib/analytics';
import { ASESORES, NUMERO_CAU } from '@/lib/whatsapp';

/**
 * Escucha los clics a WhatsApp: los mide siempre y, si hay más de un asesor,
 * los reparte entre ellos.
 *
 * Las dos cosas se hacen desde un solo listener delegado en `document` porque
 * los botones se pintan en 21 lugares —varios adentro de modales que se montan
 * y desmontan— y React vuelve a poner el `href` original en cada render: tocar
 * el DOM botón por botón era pelear contra el framework en cada cambio de
 * estado.
 *
 * **Medir** es el trabajo que corre siempre. WhatsApp se abre en otra pestaña,
 * así que sin esto la visita que termina en un lead queda registrada igual que
 * la que se fue sin hacer nada.
 *
 * **Repartir** es condicional: hoy hay un solo asesor (ver `lib/whatsapp.ts`),
 * el sorteo devuelve el número que ya está escrito en el HTML y no hay nada que
 * reescribir. El código queda porque volver a repartir es descomentar una línea
 * allá, no rehacer esto.
 *
 * El sorteo se hace **una vez por visitante**, no por clic, y queda guardado en
 * el navegador: alguien que escribe, cierra y vuelve tiene que caer en el mismo
 * asesor. Sorteando en cada clic, un solo lead terminaba hablando con los dos.
 */

const CLAVE = 'cau-asesor';

function asesorDelVisitante(): number {
  try {
    const guardado = window.localStorage.getItem(CLAVE);
    const indice = Number(guardado);
    if (guardado !== null && Number.isInteger(indice) && indice >= 0 && indice < ASESORES.length) {
      return indice;
    }
    const sorteado = Math.floor(Math.random() * ASESORES.length);
    window.localStorage.setItem(CLAVE, String(sorteado));
    return sorteado;
  } catch {
    // Navegación privada o almacenamiento bloqueado: no se guarda nada y el
    // enlace queda como está escrito, que es un asesor real igual.
    return 0;
  }
}

export default function WhatsappReparto() {
  useEffect(() => {
    const asesor = ASESORES[asesorDelVisitante()];
    const reparte = asesor.numero !== NUMERO_CAU;

    const alHacerClic = (evento: MouseEvent) => {
      // Algo más arriba ya canceló el clic: WhatsApp no se va a abrir, así que
      // no es un lead ni hay a dónde redirigir.
      if (evento.defaultPrevented) return;

      const enlace = (evento.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!enlace) return;

      // Sólo el número del CAU. El de "compartir por WhatsApp" de las novedades
      // no lleva número, y el de clases de apoyo lleva el del profesor.
      const href = enlace.getAttribute('href') ?? '';
      if (!href.includes(`wa.me/${NUMERO_CAU}`)) return;

      trackWhatsapp(window.location.pathname);

      // Ctrl/Cmd/rueda abren en otra pestaña por su cuenta: interceptarlos
      // rompería lo que el visitante pidió. Medirlos sí, que arriba ya pasó:
      // abrir WhatsApp en otra pestaña es tan lead como abrirlo en ésta.
      if (!reparte || evento.button !== 0 || evento.metaKey || evento.ctrlKey
        || evento.shiftKey || evento.altKey) return;

      evento.preventDefault();
      const destino = href.replace(`wa.me/${NUMERO_CAU}`, `wa.me/${asesor.numero}`);
      if (enlace.target === '_blank') {
        window.open(destino, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = destino;
      }
    };

    // En captura, no en burbuja: es la única fase que ve todos los clics. El
    // botón de WhatsApp del encabezado de cada pregunta de la FAQ llama a
    // `stopPropagation()` para no abrir la tarjeta, así que en burbuja su clic
    // nunca llega a `document` y sería el único lead que no se mide. Cancelar
    // en captura no le quita el clic a nadie: `preventDefault()` anula la
    // navegación por defecto, no la propagación, y el reparto vuelve a abrir el
    // enlace él mismo.
    document.addEventListener('click', alHacerClic, true);
    return () => document.removeEventListener('click', alHacerClic, true);
  }, []);

  return null;
}
