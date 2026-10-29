'use client';

import { useEffect, useState } from 'react';

interface Props {
  destino: '#formulario' | '#preinscripcion';
  texto: string;
}

/**
 * Mantiene la accion principal al alcance en movil solamente durante el tramo
 * en que ya quedó atrás el CTA del hero y el formulario no está visible.
 */
export default function StickyEnrollmentCta({ destino, texto }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;

    const medir = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const ctaDelHero = document.querySelector<HTMLElement>('[data-career-primary-cta]');
        const formulario = document.querySelector<HTMLElement>(destino);
        if (!ctaDelHero || !formulario) {
          setVisible(false);
          return;
        }

        const heroQuedoAtras = ctaDelHero.getBoundingClientRect().bottom <= 0;
        const rect = formulario.getBoundingClientRect();
        const formularioFueraDeVista = rect.top >= window.innerHeight || rect.bottom <= 0;
        setVisible(heroQuedoAtras && formularioFueraDeVista);
      });
    };

    // El formulario se carga de manera diferida y reemplaza su placeholder. El
    // observador de cambios asegura que siempre se mida el nodo que esta vivo.
    const observer = new MutationObserver(medir);
    observer.observe(document.getElementById('main-content') ?? document.body, {
      childList: true,
      subtree: true,
    });
    window.addEventListener('scroll', medir, { passive: true });
    window.addEventListener('resize', medir);
    medir();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', medir);
      window.removeEventListener('resize', medir);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [destino]);

  return (
    <div
      className={`career-mobile-cta${visible ? ' career-mobile-cta--visible' : ''}`}
      aria-hidden={!visible}
    >
      <a href={destino} tabIndex={visible ? undefined : -1}>
        {texto}
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </a>
    </div>
  );
}
