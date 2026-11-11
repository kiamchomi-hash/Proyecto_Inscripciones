import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { leerMateriaPublica } from '../../datos/materias';
import { construirMarkdownMateria, urlMateria } from '../../entrega/markdown-materia';

// La versión markdown de la clase de apoyo: `/clases-apoyo/<slug>.md`.
export const GET: APIRoute = async ({ params }) => {
  const slug = params.materia ?? '';
  const ficha = await leerMateriaPublica(env.DB, slug);
  if (!ficha) return new Response(null, { status: 404 });
  return new Response(construirMarkdownMateria(ficha, urlMateria(ficha.slug)), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};
