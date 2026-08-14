'use client';

import { useEffect } from 'react';
import { ASESORES, NUMERO_CAU } from '@/lib/whatsapp';

/**
 * Reparte entre los asesores los clics a WhatsApp, mitad y mitad.
 *
 * No toca el DOM ni reescribe ningún `href`: escucha el clic y, si a ese
 * visitante le tocó el segundo asesor, abre el enlace con el otro número. Los
 * botones se pintan en 21 lugares —varios adentro de modales que se montan y
 * desmontan— y React vuelve a poner el `href` original en cada render, así que
 * reescribirlos era pelear contra el framework en cada cambio de estado.
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
    if (asesor.numero === NUMERO_CAU) return;

    const alHacerClic = (evento: MouseEvent) => {
      // Ctrl/Cmd/rueda abren en otra pestaña por su cuenta: interceptarlos
      // rompería lo que el visitante pidió.
      if (evento.defaultPrevented || evento.button !== 0 || evento.metaKey
        || evento.ctrlKey || evento.shiftKey || evento.altKey) return;

      const enlace = (evento.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!enlace) return;

      // Sólo el número del CAU. El de "compartir por WhatsApp" de las novedades
      // no lleva número, y el de clases de apoyo lleva el del profesor.
      const href = enlace.getAttribute('href') ?? '';
      if (!href.includes(`wa.me/${NUMERO_CAU}`)) return;

      evento.preventDefault();
      const destino = href.replace(`wa.me/${NUMERO_CAU}`, `wa.me/${asesor.numero}`);
      if (enlace.target === '_blank') {
        window.open(destino, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = destino;
      }
    };

    // En burbuja y no en captura, para que los handlers de analítica de cada
    // botón corran antes: si esto cancelara el evento en captura, el clic
    // dejaría de medirse.
    document.addEventListener('click', alHacerClic);
    return () => document.removeEventListener('click', alHacerClic);
  }, []);

  return null;
}
