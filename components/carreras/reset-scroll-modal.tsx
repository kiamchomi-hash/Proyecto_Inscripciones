'use client';

import { useEffect } from 'react';

// Marca que la URL /carreras/{slug} la puso el modal de la home, no una visita
// real a la pagina de carrera.
export const MARCA_MODAL = 'carrera-modal-url';

/**
 * Con el modal abierto la URL es la de la carrera, pero el scroll que el
 * navegador guarda para esa entrada es el del catalogo (bien abajo). Un F5
 * carga la pagina de carrera de verdad y le restaura ese offset: como es mas
 * corta, aterriza en el formulario del final en vez de arrancar arriba.
 * La home deja la marca al abrir el modal; si esta puesta, la pagina se planta
 * arriba de todo.
 */
export default function ResetScrollDesdeModal() {
  useEffect(() => {
    let marca: string | null = null;
    try {
      marca = sessionStorage.getItem(MARCA_MODAL);
      if (marca) sessionStorage.removeItem(MARCA_MODAL);
    } catch {
      // Navegacion privada sin storage: no hay nada que corregir.
    }
    // Un ancla explicita (#formulario) manda por encima de esto.
    if (marca !== window.location.pathname || window.location.hash) return;

    // Chrome restaura el scroll despues del primer layout, y el
    // ScrollResetOnLoad del layout devuelve la restauracion a 'auto', asi que
    // no alcanza con pedirla en manual: hay que insistir unos cuadros.
    const arriba = () => window.scrollTo(0, 0);
    arriba();
    const raf = requestAnimationFrame(() => {
      arriba();
      requestAnimationFrame(arriba);
    });
    const timer = setTimeout(arriba, 300);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  return null;
}
