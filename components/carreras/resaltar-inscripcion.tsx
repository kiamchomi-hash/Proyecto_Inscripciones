'use client';

import { useEffect } from 'react';
import { PARAMETRO_DESDE, VALOR_DESDE_MAIL } from '@/components/formularios/elegir-carrera';

/**
 * Quien llega desde «Quiero inscribirme» del mail (`?desde=mail`) ve titilar el
 * botón de inscripción de la ficha, que es por donde sigue. En el teléfono es el
 * mismo botón: está arriba de todo, a la vista al entrar.
 *
 * Se lee en el navegador para que la ficha siga siendo estática. La marca se
 * saca de la dirección: recargar o compartir la página no vuelve a titilar.
 * La animación tiene vueltas contadas, así que la clase puede quedar puesta.
 */
export default function ResaltarInscripcion() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get(PARAMETRO_DESDE) !== VALOR_DESDE_MAIL) return;
    url.searchParams.delete(PARAMETRO_DESDE);
    history.replaceState(history.state, '', url);
    document.querySelector<HTMLElement>('[data-career-primary-cta]')?.classList.add('career-cta-titila');
  }, []);
  return null;
}
