'use client';

import { useEffect } from 'react';
import { destinoDesdeCalendario, trackCtaInscripcion, trackSalidaCalendario } from '@/lib/analytics';

/** Mide los CTA de formularios y las salidas del calendario hacia la oferta. */
export default function AnalyticsInteractions() {
  useEffect(() => {
    const alClickear = (evento: MouseEvent) => {
      const objetivo = evento.target;
      if (!(objetivo instanceof Element)) return;
      const enlace = objetivo.closest<HTMLAnchorElement>('a[href]');
      if (!enlace) return;
      const url = new URL(enlace.href, window.location.href);
      const salida = destinoDesdeCalendario(window.location.pathname, url.href, window.location.href);
      if (salida) trackSalidaCalendario(salida);
      if (url.origin !== window.location.origin || !['#formulario', '#preinscripcion'].includes(url.hash)) return;
      trackCtaInscripcion(url.hash.slice(1));
    };
    document.addEventListener('click', alClickear, true);
    return () => document.removeEventListener('click', alClickear, true);
  }, []);

  return null;
}
