// Revalidacion on-demand: la base avisa y la pagina se rehace en el momento.
//
// Antes de esto el contenido publicado tardaba en verse lo que dijera el
// revalidate de cada pagina —una hora la home, veinticuatro las fichas de
// carrera y las novedades— y /faq y /clases-apoyo/<materia>, que no declaran
// ninguno, quedaban congeladas hasta el proximo deploy. Cargar una carrera y
// tener que pushear cualquier cosa para verla era el sintoma.
//
// Lo dispara un trigger de Postgres por cada tabla de contenido (el SQL esta en
// sql/2026-08-07_revalidar_on_demand.sql). No tiene nada que ver con
// notify_edge_function(): aquel avisa por Telegram cuando entra un formulario,
// este rehace paginas cuando cambia el contenido. Son triggers distintos sobre
// tablas distintas y no hay que mezclarlos.
//
// Igual que aquel, net.http_post encola sin bloquear: si esto falla, el UPDATE
// en Supabase responde ok lo mismo y la pagina se queda vieja hasta que venza
// su revalidate. Por eso los revalidate de cada pagina siguen puestos — son la
// red abajo, no algo que este de mas.

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { carreraToSlug, esCarreraVisible } from '@/components/index/types';

export const dynamic = 'force-dynamic';

/** Lo que manda el trigger. Todo opcional: la tabla decide que se usa. */
interface Aviso {
  tabla?: string;
  accion?: string;
  slug?: string | null;
  nombre?: string | null;
  prefix?: string | null;
  nivel?: string | null;
  anterior?: {
    slug?: string | null;
    nombre?: string | null;
    prefix?: string | null;
  } | null;
}

/** Slug canonico de una carrera, el mismo que arma la URL de su ficha. */
function slugDeCarrera(nombre?: string | null, prefix?: string | null) {
  if (!nombre) return null;
  return carreraToSlug({ nombre, prefix: prefix ?? null });
}

/**
 * Que rutas toca rehacer. Devuelve pares [ruta, tipo]: 'page' sobre un patron
 * con corchetes rehace todas las paginas de esa ruta dinamica, que es lo que
 * hace falta cuando cambia el conjunto y no una fila (las fichas se enlazan
 * entre si, y la paginacion de novedades se corre entera al publicar una).
 */
function rutasA(aviso: Aviso): Array<[string, 'page' | 'layout']> {
  const rutas: Array<[string, 'page' | 'layout']> = [];
  const esAltaOBaja = aviso.accion !== 'UPDATE';

  switch (aviso.tabla) {
    case 'carreras': {
      rutas.push(['/', 'page'], ['/sitemap.xml', 'page']);

      const slug = slugDeCarrera(aviso.nombre, aviso.prefix);
      // Las carreras de un nivel fuera de la oferta no tienen pagina: no hay
      // nada que rehacer mas alla de la home y el sitemap.
      if (slug && esCarreraVisible({ nivel: aviso.nivel ?? '' })) {
        rutas.push([`/carreras/${slug}`, 'page']);
      }

      // Si le cambiaron el nombre, la URL vieja ahora tiene que redirigir a la
      // nueva; sin rehacerla sigue sirviendo la ficha con el nombre anterior.
      const anterior = slugDeCarrera(aviso.anterior?.nombre, aviso.anterior?.prefix);
      if (anterior && anterior !== slug) rutas.push([`/carreras/${anterior}`, 'page']);

      if (esAltaOBaja) {
        rutas.push(['/carreras/[slug]', 'page'], ['/imagenes', 'page']);
      }
      break;
    }

    case 'novedades': {
      rutas.push(['/novedades/[page]', 'page'], ['/sitemap.xml', 'page']);
      if (aviso.slug) rutas.push([`/novedades/articulo/${aviso.slug}`, 'page']);
      if (aviso.anterior?.slug && aviso.anterior.slug !== aviso.slug) {
        rutas.push([`/novedades/articulo/${aviso.anterior.slug}`, 'page']);
      }
      break;
    }

    case 'materias': {
      // /clases-apoyo es force-dynamic (calendario relativo a hoy): no cachea,
      // asi que no hay nada que revalidarle. La ficha por materia si.
      if (aviso.slug) rutas.push([`/clases-apoyo/${aviso.slug}`, 'page']);
      if (aviso.anterior?.slug && aviso.anterior.slug !== aviso.slug) {
        rutas.push([`/clases-apoyo/${aviso.anterior.slug}`, 'page']);
      }
      // El sitemap lista las materias por slug: solo cambia si aparece o
      // desaparece una, no cada vez que se bloquea un horario desde el panel.
      if (esAltaOBaja || aviso.anterior?.slug !== aviso.slug) {
        rutas.push(['/sitemap.xml', 'page']);
      }
      break;
    }

    case 'faq_preguntas':
      rutas.push(['/faq', 'page']);
      break;

    // Escotilla para rehacer el sitio entero a mano, sin deploy.
    case 'todo':
      rutas.push(['/', 'layout']);
      break;
  }

  return rutas;
}

export async function POST(request: NextRequest) {
  const secreto = process.env.REVALIDATE_SECRET;
  if (!secreto) {
    return NextResponse.json({ error: 'REVALIDATE_SECRET sin configurar' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: 'no autorizado' }, { status: 401 });
  }

  let aviso: Aviso;
  try {
    aviso = await request.json();
  } catch {
    return NextResponse.json({ error: 'body invalido' }, { status: 400 });
  }

  const rutas = rutasA(aviso);
  if (rutas.length === 0) {
    // Que una tabla sin mapear devuelva 200 esconderia el error: el trigger
    // seguiria disparando contra la nada y nadie lo notaria.
    return NextResponse.json(
      { error: `tabla sin rutas asociadas: ${aviso.tabla ?? '(ninguna)'}` },
      { status: 400 },
    );
  }

  for (const [ruta, tipo] of rutas) revalidatePath(ruta, tipo);

  // La lista vuelve en la respuesta para poder leerla desde net._http_response,
  // que es donde se ve si el trigger hizo lo que se esperaba.
  return NextResponse.json({ ok: true, rutas: rutas.map(([r]) => r) });
}
