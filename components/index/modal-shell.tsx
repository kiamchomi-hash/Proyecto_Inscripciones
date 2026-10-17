'use client';

import type { CSSProperties, ReactNode, RefObject } from 'react';
import FlechasDeScroll from './flechas-de-scroll';

interface Props {
  /** El contenedor fijo del modal: lo usan el hook de foco y las flechas de scroll. */
  dialogRef: RefObject<HTMLDivElement | null>;
  /** Velo visible (abierto y sin estar cerrándose). */
  abierto: boolean;
  /** Clic en el velo. */
  onCerrar: () => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Fondo del velo; cada casa tiene el suyo. */
  colorVelo: string;
  /** Tema del panel (borde, fondo, brillo) y clases propias de cada modal. */
  className?: string;
  style?: CSSProperties;
  /** Atributos `data-*` que alguna hoja busca en el panel. */
  datos?: Record<`data-${string}`, string>;
  children: ReactNode;
}

/**
 * Armazón común de los modales de carrera: el contenedor fijo, el velo y el
 * panel. El tamaño del panel es uno solo y vive en `.modal-panel`
 * (modales.css); lo que cambia por casa llega por `className` y `style`.
 *
 * El contenedor fijo conserva `overflow-y-auto overscroll-contain`: de eso
 * depende que la rueda no mueva la página de atrás. El `role` y el
 * `aria-modal` no se tocan porque globals.css oscurece la barra de la página
 * con `html:has([role="dialog"][aria-modal="true"])`.
 */
export default function ModalShell({
  dialogRef,
  abierto,
  onCerrar,
  colorVelo,
  className = '',
  style,
  datos,
  children,
  ...aria
}: Props) {
  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[5000] flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      {...aria}
    >
      <FlechasDeScroll raiz={dialogRef} />
      <div
        className={`absolute inset-0 backdrop-blur-[3px] transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: colorVelo }}
        onClick={onCerrar}
      />
      <div {...datos} className={`modal-panel ${className}`} style={style}>
        {children}
      </div>
    </div>
  );
}
