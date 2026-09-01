'use client';

import { useEffect } from 'react';

/** Registra sólo la carga de una ficha real; abrir el modal no monta este componente. */
export default function DirectCareerOpenTracker({ carrera, url }: { carrera: string; url: string }) {
  useEffect(() => {
    fetch('/api/track-direct-open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carrera, url }),
      keepalive: true,
    }).catch(() => {});
  }, [carrera, url]);

  return null;
}
