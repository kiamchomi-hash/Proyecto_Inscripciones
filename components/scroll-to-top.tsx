'use client';

import { useState, useEffect } from 'react';

export function ScrollResetOnLoad() {
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
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
      className={`fixed right-4 bottom-4 lg:right-8 lg:bottom-8 z-1000 w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 backdrop-blur-md border border-[#00c7b1]/30 bg-[#011f17] text-[#00c7b1] shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:scale-105 hover:shadow-[0_8px_24px_rgba(0,199,177,0.3)] active:scale-95 ${
        isVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-5 pointer-events-none'
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
