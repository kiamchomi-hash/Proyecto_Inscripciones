'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Lo que dura la salida del velo antes de desmontar el modal.
const DURACION_CIERRE = 300;

interface Opciones {
  onClose: () => void;
  /** Arranca con el velo ya visible, sin el fundido de entrada. */
  initiallyVisible?: boolean;
}

/**
 * Lo que queda por hacer en los cuatro modales de carrera ahora que el panel es
 * un `<dialog>` abierto con `showModal()`: el navegador ya deja inerte el resto
 * de la página, encierra el foco, cierra con Escape y devuelve el foco a quien
 * abrió. Acá sólo queda la animación de salida —`closing` espera que el velo se
 * apague antes de avisarle al padre— y enfocar el botón de cerrar al abrir.
 *
 * Las flechas de los carruseles no viven acá: cada modal sabe cuántos slides
 * tiene y si la tecla viene de un campo editable.
 */
export function useFocoModal({ onClose, initiallyVisible = false }: Opciones) {
  const [visible, setVisible] = useState(initiallyVisible);
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  // Se lee durante el render, antes de que `showModal()` mueva el foco adentro.
  const openerRef = useRef<HTMLElement | null>(
    typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null),
  );

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    closeBtnRef.current?.focus();
  }, []);

  const cerrar = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, DURACION_CIERRE);
  }, [onClose]);

  useEffect(
    () => () => {
      // Si el padre desmonta sin pasar por `cerrar`, el foco igual vuelve.
      openerRef.current?.focus();
    },
    [],
  );

  return { dialogRef, closeBtnRef, abierto: visible && !closing, cerrar };
}
