'use client';

import { useState, useEffect } from 'react';
import { MARCA_MODAL } from '@/components/index/types';

// Gestos que delatan que el scroll lo movio la persona y no el navegador.
const GESTOS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;

export function ScrollResetOnLoad() {
  useEffect(() => {
    if (!('scrollRestoration' in history)) return;

    // Con el modal abierto la URL es /carreras/{slug} pero el scroll que el
    // navegador guarda para esa entrada es el del catalogo, bien abajo. Un F5
    // carga la pagina de carrera de verdad y le restaura ese offset: como es
    // mas corta, aterriza en el formulario del final. La home deja una marca al
    // abrir el modal; si esta puesta, la pagina arranca arriba de todo.
    let marca: string | null = null;
    try {
      marca = sessionStorage.getItem(MARCA_MODAL);
      if (marca) sessionStorage.removeItem(MARCA_MODAL);
    } catch {
      // Navegacion privada sin storage: no hay nada que corregir.
    }
    // Un ancla explicita (#formulario) manda por encima de esto.
    if (marca !== window.location.pathname || window.location.hash) {
      history.scrollRestoration = 'auto';
      return;
    }

    history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    // Pedir 'manual' no siempre alcanza: Chrome reintenta restaurar mientras el
    // layout crece con las imagenes. Se lo devuelve a cero hasta que la persona
    // toque algo, y como mucho por un segundo y medio.
    let vigilando = true;
    const soltar = () => {
      if (!vigilando) return;
      vigilando = false;
      window.removeEventListener('scroll', volverArriba);
      GESTOS.forEach(g => window.removeEventListener(g, soltar));
      history.scrollRestoration = 'auto';
    };
    function volverArriba() {
      if (vigilando && window.scrollY !== 0) window.scrollTo(0, 0);
    }
    window.addEventListener('scroll', volverArriba);
    GESTOS.forEach(g => window.addEventListener(g, soltar, { passive: true }));
    const timer = window.setTimeout(soltar, 1500);

    return () => {
      window.clearTimeout(timer);
      soltar();
    };
  }, []);
  return null;
}

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      // Show when scrolled down 300px
      const scrolled = window.scrollY > 300;
      
      let hideForForm = false;
      // On mobile/tablets (< 1024px), hide it if the form is visible
      if (window.innerWidth < 1024) {
        const formEl = document.getElementById('formulario');
        if (formEl) {
          const rect = formEl.getBoundingClientRect();
          // Form is somewhere in the viewport
          hideForForm = rect.top < window.innerHeight && rect.bottom > 0;
        }
      }

      setIsVisible(scrolled && !hideForForm);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initially
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      title="Ir arriba"
      aria-label="Volver arriba"
      className={`scroll-to-top-button fixed right-4 bottom-4 lg:right-8 lg:bottom-8 z-1000 w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 backdrop-blur-md border border-[#00c7b1]/30 bg-[#011f17] text-[#00c7b1] shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:scale-105 hover:shadow-[0_8px_24px_rgba(0,199,177,0.3)] active:scale-95 ${
        isVisible ? 'opacity-65 hover:opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-5 pointer-events-none'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 lg:h-7 lg:w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}
