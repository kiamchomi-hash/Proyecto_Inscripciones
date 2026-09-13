'use client';

import { useEffect } from 'react';
import { trackMateriaClase } from '@/lib/analytics';

/** Mide los enlaces de materia sin convertir la portada completa en cliente. */
export default function LandingAnalytics() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>('[data-clase-materia]');
      const materia = link?.dataset.claseMateria;
      if (materia) trackMateriaClase(materia);
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return null;
}
