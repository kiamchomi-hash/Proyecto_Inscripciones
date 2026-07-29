'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type EstadoCompartir = 'idle' | 'copiado' | 'error';

/**
 * Compartir un enlace desde un boton.
 *
 * En tactil abre el menu nativo del sistema (`navigator.share`), que es lo que la
 * gente espera del celular: deja mandarlo por WhatsApp sin salir de la pagina. En
 * escritorio no hay menu que valga la pena, asi que copia al portapapeles.
 *
 * Siempre devuelve un estado para que el boton avise que paso: antes se llamaba a
 * `navigator.clipboard?.writeText()` suelto, que copia en silencio — y si el
 * navegador no expone `clipboard`, el `?.` se lo come y no hacia nada de nada.
 */
export function useCompartir(url: string, titulo?: string) {
  const [estado, setEstado] = useState<EstadoCompartir>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sin esto, volver al estado inicial despues de cerrar el modal avisa a un
  // componente desmontado.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const avisar = useCallback((e: EstadoCompartir) => {
    setEstado(e);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setEstado('idle'), 2200);
  }, []);

  const compartir = useCallback(async () => {
    // `pointer: coarse` distingue el dedo del mouse. Chrome de escritorio tambien
    // expone navigator.share y abriria el panel de Windows, que no es lo buscado.
    const esTactil = typeof window !== 'undefined'
      && window.matchMedia?.('(pointer: coarse)').matches;

    if (esTactil && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(titulo ? { title: titulo, url } : { url });
        return; // El menu nativo ya es el feedback.
      } catch (e) {
        // Cerrar la hoja de compartir tira AbortError: es una decision del usuario,
        // no un fallo, y copiar por las dudas seria justo lo que acaba de rechazar.
        if ((e as Error)?.name === 'AbortError') return;
        // Cualquier otro error: seguimos al portapapeles.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      avisar('copiado');
      return;
    } catch {
      // Safari viejo y contextos sin permiso de portapapeles.
    }

    try {
      const input = document.createElement('input');
      input.value = url;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(input);
      avisar(ok ? 'copiado' : 'error');
    } catch {
      avisar('error');
    }
  }, [url, titulo, avisar]);

  return { compartir, estado };
}

/** Texto del boton segun el estado. El ancho es fijo, asi que no salta al cambiar. */
export function textoCompartir(estado: EstadoCompartir): string {
  if (estado === 'copiado') return '¡Copiado!';
  if (estado === 'error') return 'Copiá el link';
  return 'Compartir';
}
