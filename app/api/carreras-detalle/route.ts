// El texto largo de las carreras: slides, plan de estudios y las secciones de la
// ficha. Es lo que abre cada modal del catálogo.
//
// Vive fuera del HTML de la home a propósito. Son 325 de los 348 KB que ocupan
// las 88 carreras visibles y, al viajar dentro del payload RSC, retrasaban el
// primer pintado 2,3 s en 4G lenta aunque el visitante no abriera ningún modal.
// El catálogo lo pide solo, después de pintar, y para cuando alguien hace clic
// ya lo tiene.
//
// Se sirve como ruta propia y no como archivo estático porque el contenido
// cambia sin deploy: la revalida el mismo trigger de `carreras` que rehace la
// home (ver `rutasA()` en /api/revalidar).
import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase';
import {
  type Carrera, type CarreraDetalle, COLUMNAS_DETALLE, esCarreraVisible,
} from '@/components/index/types';

// Igual que la home: la red de abajo es un día, lo que publica de verdad es la
// revalidación on-demand.
export const revalidate = 86400;

export async function GET() {
  const { data, error } = await supabase
    .from('carreras')
    .select(`id, nivel, ${COLUMNAS_DETALLE.join(', ')}`)
    .eq('activa', true);

  if (error) {
    console.error('Error fetching detalle de carreras:', error.message);
    return NextResponse.json({ error: 'no se pudo leer el detalle' }, { status: 502 });
  }

  // Mismo filtro de taxonomía que la home: una carrera que no se lista tampoco
  // necesita que le mandemos la ficha.
  const detalle: Record<number, CarreraDetalle> = {};
  for (const fila of (data ?? []) as unknown as Carrera[]) {
    if (!esCarreraVisible(fila)) continue;
    detalle[fila.id] = {
      slides: fila.slides,
      plan_estudios: fila.plan_estudios,
      seccion_modalidad: fila.seccion_modalidad,
      seccion_duracion: fila.seccion_duracion,
      descripcion: fila.descripcion,
      enfoque: fila.enfoque,
    };
  }

  return NextResponse.json(detalle, {
    headers: {
      // Un día en el CDN y una semana sirviendo el viejo mientras se rehace: si
      // este pedido falla, el modal abre con lo anterior en vez de vacío.
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
