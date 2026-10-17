'use client';

import { useEffect, useState, type RefObject } from 'react';

// Margen para dar por llegado al final: los redondeos de subpíxel dejan
// scrollTop + clientHeight uno o dos píxeles por debajo de scrollHeight.
const HOLGURA = 4;

interface Flecha {
  zona: HTMLElement;
  left: number;
  top: number;
}

function zonasConScroll(raiz: HTMLElement): HTMLElement[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>('*')).filter((el) => {
    const { overflowY } = getComputedStyle(el);
    return !el.closest('[data-sin-flecha]') && (overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight - el.clientHeight > HOLGURA;
  });
}

/**
 * Reemplaza la barra de scroll de un modal por una flecha hacia abajo. Busca
 * dentro de `raiz` las zonas con contenido que no entra, les oculta la barra y
 * pinta una flecha al pie de cada una mientras quede algo por ver. La rueda y
 * el gesto táctil siguen funcionando; la flecha sólo avanza un tramo.
 * Una zona con navegación propia (el plan de estudios) se excluye con
 * `data-sin-flecha` y conserva su barra.
 *
 * `raiz` tiene que ser el contenedor fijo a pantalla completa del modal: las
 * flechas se posicionan con las coordenadas de la ventana.
 */
export default function FlechasDeScroll({ raiz }: { raiz: RefObject<HTMLElement | null> }) {
  const [flechas, setFlechas] = useState<Flecha[]>([]);

  useEffect(() => {
    const contenedor = raiz.current;
    if (!contenedor) return;

    let cuadro = 0;
    const medir = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(() => {
        const marco = contenedor.getBoundingClientRect();
        const nuevas: Flecha[] = [];
        for (const zona of zonasConScroll(contenedor)) {
          zona.dataset.flechaScroll = '';
          if (zona.scrollTop + zona.clientHeight >= zona.scrollHeight - HOLGURA) continue;
          const caja = zona.getBoundingClientRect();
          // Los slides fuera de cuadro del carrusel siguen en el DOM: sólo
          // cuentan las zonas que se ven dentro del modal.
          const centro = caja.left + caja.width / 2;
          if (caja.height === 0 || centro < marco.left || centro > marco.right) continue;
          nuevas.push({ zona, left: centro - marco.left, top: caja.bottom - marco.top });
        }
        setFlechas(nuevas);
      });
    };

    medir();
    // El scroll no burbujea: se escucha en captura para enterarse de todas las zonas.
    contenedor.addEventListener('scroll', medir, { capture: true, passive: true });
    contenedor.addEventListener('transitionend', medir);
    window.addEventListener('resize', medir);
    const mutaciones = new MutationObserver(medir);
    mutaciones.observe(contenedor, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    const tamanos = new ResizeObserver(medir);
    tamanos.observe(contenedor);

    return () => {
      cancelAnimationFrame(cuadro);
      contenedor.removeEventListener('scroll', medir, { capture: true });
      contenedor.removeEventListener('transitionend', medir);
      window.removeEventListener('resize', medir);
      mutaciones.disconnect();
      tamanos.disconnect();
    };
  }, [raiz]);

  return (
    <>
      {flechas.map(({ zona, left, top }, i) => (
        // No es un botón a propósito: quedaría dentro de la trampa de foco del
        // modal. Con teclado se baja como siempre; la flecha es para el mouse y el dedo.
        <div
          key={i}
          aria-hidden="true"
          className="flecha-scroll"
          style={{ left, top }}
          onClick={() => zona.scrollBy({ top: zona.clientHeight * 0.8, behavior: 'smooth' })}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ))}
    </>
  );
}
