'use client';

import { useEffect, type CSSProperties, type ReactNode, type RefObject } from 'react';
import FlechasDeScroll from './flechas-de-scroll';

interface Props {
  /** El `<dialog>`: lo abren `showModal()` y lo usan las flechas de scroll. */
  dialogRef: RefObject<HTMLDialogElement | null>;
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
 * Armazón común de los modales de carrera: el velo y el panel, dentro de un
 * `<dialog>` nativo.
 *
 * El `<dialog>` abierto con `showModal()` aporta lo que antes se armaba a mano:
 * página inerte detrás, foco encerrado, capa superior (`::backdrop`, sin pelear
 * z-index) y cierre con Escape o gesto de volver. Por eso acá no hay
 * `role="dialog"` ni `aria-modal`: el elemento ya los implica, y duplicarlos
 * confunde a los lectores de pantalla.
 *
 * Escape llega como `cancel`; se cancela el cierre del navegador para que el
 * velo se apague con la animación y el padre decida cuándo desmontar.
 *
 * El tamaño del panel es uno solo y vive en `.modal-panel` (modales.css); lo que
 * cambia por casa llega por `className` y `style`.
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
  useEffect(() => {
    const dialogo = dialogRef.current;
    if (!dialogo) return;
    if (!dialogo.open) dialogo.showModal();
    // Al desmontar se cierra: saca el elemento de la capa superior y devuelve
    // el foco a quien abrió.
    return () => {
      if (dialogo.open) dialogo.close();
    };
  }, [dialogRef]);

  return (
    <dialog
      ref={dialogRef}
      className="modal-raiz"
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      {...aria}
    >
      <div
        className={`absolute inset-0 backdrop-blur-[3px] transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: colorVelo }}
        onClick={onCerrar}
        aria-hidden="true"
      />
      <div {...datos} className={`modal-panel ${className}`} style={style}>
        {children}
        <FlechasDeScroll raiz={dialogRef} />
      </div>
    </dialog>
  );
}
