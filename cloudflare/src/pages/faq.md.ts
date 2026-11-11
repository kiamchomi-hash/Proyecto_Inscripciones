import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { listarFaqPublicas } from '../datos/faq';
import { construirMarkdownFaq } from '../entrega/markdown-faq';
import { BASE } from '../entrega/sitemap-xml';

// La versión markdown de las preguntas frecuentes: `/faq.md`.
export const GET: APIRoute = async () => {
  const preguntas = await listarFaqPublicas(env.DB);
  return new Response(construirMarkdownFaq(preguntas, `${BASE}/faq`), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};
