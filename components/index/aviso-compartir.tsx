'use client';

import type { EstadoCompartir } from './use-compartir';

/**
 * Anuncio de `useCompartir` para lectores de pantalla.
 *
 * Va fuera del boton a proposito: el contenido de un boton es presentacional y
 * una region viva adentro no se anuncia de forma confiable. El texto del boton
 * sigue cambiando a la vista, pero el aviso que se lee es este.
 */
export default function AvisoCompartir({ estado }: { estado: EstadoCompartir }) {
  return (
    <span role="status" aria-atomic="true" className="sr-only">
      {estado === 'copiado'
        ? 'Enlace copiado'
        : estado === 'error'
          ? 'No se pudo copiar el enlace'
          : ''}
    </span>
  );
}
