'use client';

import { useEffect, useRef, type ReactNode } from 'react';

const VELOCIDAD_PX_S = 40;
const PAUSA_INICIO_MS = 1500;
const PAUSA_FINAL_MS = 5000;

/**
 * Un renglón que no se corta: si el texto no entra, se desliza hasta el último
 * carácter, se queda ahí 5 segundos y vuelve al principio de golpe, sin
 * transición. Si entra, queda quieto. Con movimiento reducido, puntos
 * suspensivos (ver `.texto-desplazable` en `test-vocacional.css`).
 */
export default function TextoDesplazable({ children }: { children: ReactNode }) {
  const marcoRef = useRef<HTMLSpanElement>(null);
  const textoRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const marco = marcoRef.current;
    const texto = textoRef.current;
    if (!marco || !texto || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let animacion: Animation | undefined;
    const armar = () => {
      animacion?.cancel();
      const distancia = texto.scrollWidth - marco.clientWidth;
      if (distancia <= 1) return;
      const recorrido = (distancia / VELOCIDAD_PX_S) * 1000;
      const total = PAUSA_INICIO_MS + recorrido + PAUSA_FINAL_MS;
      const final = `translateX(-${distancia}px)`;
      // El último cuadro y el primero no se interpolan: la vuelta es un salto.
      animacion = texto.animate([
        { transform: 'translateX(0)', offset: 0 },
        { transform: 'translateX(0)', offset: PAUSA_INICIO_MS / total },
        { transform: final, offset: (PAUSA_INICIO_MS + recorrido) / total },
        { transform: final, offset: 1 },
      ], { duration: total, iterations: Infinity });
    };

    armar();
    const observador = new ResizeObserver(armar);
    observador.observe(marco);
    return () => {
      observador.disconnect();
      animacion?.cancel();
    };
  }, [children]);

  return (
    <span ref={marcoRef} className="texto-desplazable">
      <span ref={textoRef}>{children}</span>
    </span>
  );
}
