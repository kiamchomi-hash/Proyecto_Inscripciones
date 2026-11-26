import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { carreraToSlug } from '@/components/index/types';
import { carrerasPublicas, carreraPorSlug } from '../../datos/carreras';
import { construirMarkdownCarrera } from '../../entrega/markdown-carrera';
import { baseDeSitio, esCarreraIdentidadRetirada, sitioDe } from '../../entrega/sitios';

// La versión markdown de la ficha: `/carreras/<slug>.md`. La convención
// llmstxt.org la pide para que un agente no tenga que leer el HTML.
//
// Se genera en cada pedido, como el sitemap: un alta o una baja se ven sin
// deploy.
//
// Misma regla que la ficha HTML: cada casa publica sus carreras en su dominio.
// Esta ruta no la cubría el corte del middleware y servía la ficha de Identidad
// con su institución desde siglo21sur.com; Siglo 21 no permite comercializar la
// Academia en su sitio, así que ahí responde 410.
export const GET: APIRoute = async ({ params, url }) => {
  const slug = params.slug ?? '';
  const carreras = await carrerasPublicas(env.DB);
  const sitio = sitioDe(url.hostname, (env as unknown as { APP_SITIO?: string }).APP_SITIO);
  const carrera = carreraPorSlug(carreras, slug);

  if (!carrera) {
    if (esCarreraIdentidadRetirada(slug)) {
      return sitio === 'identidad'
        ? new Response(null, { status: 301, headers: { Location: '/' } })
        : new Response(null, { status: 410 });
    }
    return new Response(null, { status: 404 });
  }

  const esIdentidad = carrera.nivel === 'Identidad Argentina';
  if ((sitio === 'identidad') !== esIdentidad) {
    if (esIdentidad) return new Response(null, { status: 410 });
    return new Response(null, {
      status: 301,
      headers: { Location: `${baseDeSitio('principal')}/carreras/${carreraToSlug(carrera)}.md` },
    });
  }

  const ruta = `/carreras/${carreraToSlug(carrera)}`;
  // La URL del documento es la del sitio que lo sirve: el markdown de topykly
  // decía `www.siglo21sur.com` y mandaba a la ficha equivocada.
  const destino = `${baseDeSitio(sitio)}${ruta}`;
  return new Response(construirMarkdownCarrera(carrera, destino), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};
