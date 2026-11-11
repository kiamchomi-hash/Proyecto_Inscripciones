import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { carreraToSlug } from '@/components/index/types';
import { carrerasPublicas, carreraPorSlug } from '../../datos/carreras';
import { construirMarkdownCarrera } from '../../entrega/markdown-carrera';
import { BASE } from '../../entrega/sitemap-xml';

// La versión markdown de la ficha: `/carreras/<slug>.md`. La convención
// llmstxt.org la pide para que un agente no tenga que leer el HTML.
//
// Se genera en cada pedido, como el sitemap: un alta o una baja se ven sin
// deploy.
export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug ?? '';
  const carreras = await carrerasPublicas(env.DB);
  const carrera = carreraPorSlug(carreras, slug);
  if (!carrera) return new Response(null, { status: 404 });
  const url = `${BASE}/carreras/${carreraToSlug(carrera)}`;
  return new Response(construirMarkdownCarrera(carrera, url), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};
