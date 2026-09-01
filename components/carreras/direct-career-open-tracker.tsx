'use client';

import { useEffect } from 'react';

/** Registra sólo la carga de una ficha real; abrir el modal no monta este componente. */
export default function DirectCareerOpenTracker({ carrera }: { carrera: string }) {
  useEffect(() => {
    fetch('/api/track-direct-open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carrera }),
      keepalive: true,
    }).catch(() => {});
  }, [carrera]);

  return null;
}
