'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

// Sólo tolera redondeos de subpíxel; no decide cuánto contenido importa.
const HOLGURA = 1;

interface Flecha {
  zona: HTMLElement;
  /** Esquina inferior derecha visible de la zona, en coordenadas de la capa. */
  izquierda: number;
  arriba: number;
}

type Limites = Pick<DOMRect, 'left' | 'right' | 'bottom'>;

function zonasConScroll(raiz: HTMLElement): HTMLElement[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>('[data-scroll-lectura]')).filter((el) => {
    const { overflowY } = getComputedStyle(el);
    return (overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight - el.clientHeight > HOLGURA;
  });
}

// Medimos líneas y elementos útiles, no las cajas de los bloques: esas cajas
// incluyen padding y pueden desbordar aunque ya se haya leído todo.
function contenidoPendiente(zona: HTMLElement, limites: Limites): boolean {
  const debajo = (rect: DOMRect) => rect.width > 0 && rect.height > 0
    && rect.right > limites.left && rect.left < limites.right
    && rect.bottom > limites.bottom + HOLGURA;
  const documento = zona.ownerDocument;
  const textos = documento.createTreeWalker(zona, NodeFilter.SHOW_TEXT);
  const rango = documento.createRange();
  for (let nodo = textos.nextNode(); nodo; nodo = textos.nextNode()) {
    if (!nodo.textContent?.trim() || nodo.parentElement?.closest('[aria-hidden="true"], [hidden], svg')) continue;
    rango.selectNodeContents(nodo);
    if (Array.from(rango.getClientRects()).some(debajo)) return true;
  }
  return Array.from(zona.querySelectorAll<HTMLElement>('img[alt]:not([alt=""]), button, a, input, select, textarea'))
    .some(el => !el.closest('[aria-hidden="true"], [hidden]') && debajo(el.getBoundingClientRect()));
}

/**
 * Indicador para regiones de lectura declaradas con `data-scroll-lectura`.
 * Los planes e índices conservan su navegación y su barra nativa. No se
 * modifican atributos del DOM ni se ocultan barras de desplazamiento.
 *
 * La flecha flota sobre la esquina inferior derecha de la zona, dentro de una
 * capa transparente: no reserva ancho ni alto y por eso no corre el texto ni
 * empuja las acciones. Como se ancla a la zona y no al panel, nunca queda
 * encima del pie de botones ni de la navegación del carrusel.
 * `raiz` es el contenedor fijo del modal, referencia de las coordenadas.
 */
export default function FlechasDeScroll({ raiz }: { raiz: RefObject<HTMLElement | null> }) {
  const [flechas, setFlechas] = useState<Flecha[]>([]);
  // La capa es el sistema de coordenadas: es el propio panel del modal, que
  // no scrollea. Así la posición no depende de dónde esté la ventana.
  const capa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const contenedor = raiz.current;
    if (!contenedor) return;

    let cuadro = 0;
    const medir = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(() => {
        const marco = contenedor.getBoundingClientRect();
        const ancla = capa.current?.getBoundingClientRect();
        const nuevas: Flecha[] = [];
        if (!ancla) return;
        for (const zona of zonasConScroll(contenedor)) {
          const caja = zona.getBoundingClientRect();
          let izquierda = Math.max(caja.left, marco.left);
          let derecha = Math.min(caja.right, marco.right);
          let abajo = Math.min(caja.top + zona.clientTop + zona.clientHeight, marco.bottom);
          let arriba = Math.max(caja.top, marco.top);
          // Un slide puede estar fuera de cuadro o cortado por su propio
          // viewport, aunque siga dentro del overlay de pantalla completa.
          for (let padre = zona.parentElement; padre && padre !== contenedor; padre = padre.parentElement) {
            const estilo = getComputedStyle(padre);
            const rect = padre.getBoundingClientRect();
            const contiene = /paint|strict|content/.test(estilo.contain);
            if (estilo.overflowX !== 'visible' || contiene) {
              izquierda = Math.max(izquierda, rect.left);
              derecha = Math.min(derecha, rect.right);
            }
            if (estilo.overflowY !== 'visible' || contiene) {
              arriba = Math.max(arriba, rect.top);
              abajo = Math.min(abajo, rect.bottom);
            }
          }
          if (abajo <= arriba || derecha - izquierda < caja.width - HOLGURA) continue;
          const pendiente = contenidoPendiente(zona, { left: izquierda, right: derecha, bottom: abajo });
          if (!pendiente) continue;
          nuevas.push({ zona, izquierda: derecha - ancla.left, arriba: abajo - ancla.top });
        }
        setFlechas(nuevas);
      });
    };

    const tamanos = new ResizeObserver(medir);
    const observar = () => {
      tamanos.disconnect();
      tamanos.observe(contenedor);
      for (const zona of contenedor.querySelectorAll<HTMLElement>('[data-scroll-lectura]')) {
        tamanos.observe(zona);
        for (const hijo of zona.children) tamanos.observe(hijo);
      }
      medir();
    };
    observar();
    // El scroll no burbujea: se escucha en captura para enterarse de todas las zonas.
    contenedor.addEventListener('scroll', medir, { capture: true, passive: true });
    contenedor.addEventListener('transitionend', medir);
    window.addEventListener('resize', medir);
    contenedor.addEventListener('load', medir, true);
    document.fonts.addEventListener('loadingdone', medir);
    const mutaciones = new MutationObserver(observar);
    mutaciones.observe(contenedor, { childList: true, subtree: true, attributes: true, characterData: true, attributeFilter: ['class', 'style', 'hidden', 'data-scroll-lectura'] });

    return () => {
      cancelAnimationFrame(cuadro);
      contenedor.removeEventListener('scroll', medir, { capture: true });
      contenedor.removeEventListener('transitionend', medir);
      window.removeEventListener('resize', medir);
      contenedor.removeEventListener('load', medir, true);
      document.fonts.removeEventListener('loadingdone', medir);
      mutaciones.disconnect();
      tamanos.disconnect();
    };
  }, [raiz]);

  return (
    <div ref={capa} className="flechas-scroll">
      {flechas.map(({ zona, izquierda, arriba }, i) => (
        <button
          key={i}
          type="button"
          aria-label="Seguir leyendo"
          className="flecha-scroll"
          style={{ left: izquierda, top: arriba }}
          onClick={() => zona.scrollBy({ top: zona.clientHeight * 0.8, behavior: 'smooth' })}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ))}
    </div>
  );
}
