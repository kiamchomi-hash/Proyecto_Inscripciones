'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Lo que entra en el recorrido con Tab dentro del modal.
const ENFOCABLES = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Lo que dura la salida del velo antes de desmontar el modal.
const DURACION_CIERRE = 300;

interface Opciones {
  onClose: () => void;
  /** Arranca con el velo ya visible, sin el fundido de entrada. */
  initiallyVisible?: boolean;
}

/**
 * Lo que comparten los cuatro modales de carrera fuera de lo visual: deja
 * `inert` todo lo que está fuera del modal, enfoca el botón de cerrar al abrir
 * y devuelve el foco a quien lo abrió al desmontarse, cierra con Escape y
 * encierra el Tab dentro del modal. El cierre espera la salida del velo
 * (`closing`) antes de avisarle al padre.
 *
 * Las flechas de los carruseles no viven acá: cada modal sabe cuántos slides
 * tiene y si la tecla viene de un campo editable.
 */
export function useFocoModal({ onClose, initiallyVisible = false }: Opciones) {
  const [visible, setVisible] = useState(initiallyVisible);
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    const inerted: Element[] = [];
    let current: Element | null = dialogRef.current;
    while (current?.parentElement) {
      for (const sibling of Array.from(current.parentElement.children)) {
        if (sibling !== current && !sibling.hasAttribute('inert')) {
          sibling.setAttribute('inert', '');
          inerted.push(sibling);
        }
      }
      current = current.parentElement;
    }
    requestAnimationFrame(() => setVisible(true));
    closeBtnRef.current?.focus();
    return () => {
      inerted.forEach((element) => element.removeAttribute('inert'));
      openerRef.current?.focus();
    };
  }, []);

  const cerrar = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, DURACION_CIERRE);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cerrar();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(ENFOCABLES) ?? []);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cerrar]);

  return { dialogRef, closeBtnRef, abierto: visible && !closing, cerrar };
}
