'use client';

// El texto largo de las carreras — slides, plan de estudios, secciones — no
// viaja en el HTML de la home: son 325 de los 348 KB que ocupan las 88 carreras
// visibles y retrasaban el primer pintado 2,3 s en 4G lenta, aunque la mayoría
// de los visitantes no abra ningún modal. Se baja de /api/carreras-detalle
// apenas la página terminó de pintar, así para cuando alguien hace clic ya está.
//
// Ver COLUMNAS_DETALLE en `types.ts` para el reparto de columnas.

import { useEffect, useState } from 'react';

import type { Carrera, CarreraCatalogo, CarreraDetalle } from './types';

export type MapaDetalle = Record<number, CarreraDetalle>;

// Un solo pedido para toda la página, compartido entre el precargado al pasar
// por una tarjeta y la apertura del modal.
let pedido: Promise<MapaDetalle> | null = null;

export function bajarDetalle(): Promise<MapaDetalle> {
  // `priority: 'low'` para que el navegador lo ponga detrás de todo lo que
  // necesita para pintar. Sin esto se lleva ancho de banda del camino crítico y
  // el primer pintado no mejora aunque el HTML haya adelgazado.
  pedido ??= fetch('/api/carreras-detalle', { priority: 'low' })
    .then(respuesta => (respuesta.ok ? respuesta.json() : {}))
    // Si esto falla, el modal abre igual con lo que ya tiene la tarjeta: mejor
    // una ficha sin temario que un modal que no abre.
    .catch(() => ({}));
  return pedido;
}

// Los campos que el catálogo no recibe, en su forma vacía. Sin esto, un modal
// abierto antes de que baje el detalle recibiría `undefined` donde el tipo
// promete `string`.
const SIN_DETALLE: CarreraDetalle = {
  slides: null,
  plan_estudios: null,
  seccion_modalidad: null,
  seccion_duracion: null,
  descripcion: '',
  enfoque: '',
};

/** Junta la fila liviana del catálogo con su detalle, si ya bajó. */
export function completar(carrera: CarreraCatalogo, detalle: MapaDetalle | null): Carrera {
  const { tieneSlides: _tieneSlides, ...resto } = carrera;
  return { ...SIN_DETALLE, ...resto, ...(detalle?.[carrera.id] ?? {}) };
}

/**
 * Arranca la descarga cuando el navegador queda libre. `requestIdleCallback`
 * espera a que termine el trabajo del primer pintado; el `timeout` es para
 * Safari, que hasta hace poco no lo implementaba.
 */
export function useDetalleCarreras(): MapaDetalle | null {
  const [detalle, setDetalle] = useState<MapaDetalle | null>(null);

  useEffect(() => {
    let vivo = true;
    let idOcioso = 0;
    const arrancar = () => { bajarDetalle().then(mapa => { if (vivo) setDetalle(mapa); }); };

    // Primero `load` —ahí ya bajó todo lo que la página necesita para pintar— y
    // recién después la primera ventana de ocio. `requestIdleCallback` solo no
    // alcanza: encuentra huecos durante la carga y sale a competir por la red.
    // Los tipos del DOM dan `requestIdleCallback` por seguro, pero Safari lo
    // agregó recién en la 16.4 y el proyecto declara soportar la 15.4: en
    // tiempo de ejecución puede no estar.
    const ocio = window as Partial<Pick<Window, 'requestIdleCallback' | 'cancelIdleCallback'>>;

    const alOcio = () => {
      if (!vivo) return;
      idOcioso = ocio.requestIdleCallback
        ? ocio.requestIdleCallback(arrancar, { timeout: 3000 })
        : window.setTimeout(arrancar, 300);
    };

    if (document.readyState === 'complete') alOcio();
    else window.addEventListener('load', alOcio, { once: true });

    return () => {
      vivo = false;
      window.removeEventListener('load', alOcio);
      if (!idOcioso) return;
      if (ocio.cancelIdleCallback) ocio.cancelIdleCallback(idOcioso);
      else clearTimeout(idOcioso);
    };
  }, []);

  return detalle;
}
