import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { PAGINAS } from '@/lib/paginas';
import { datosLlmsTxt } from '../datos/llms-txt';
import { construirMarkdownCatalogo } from '../entrega/markdown-catalogos';
import { lineaDeCarrera } from '../entrega/llms-txt';
import { BASE } from '../entrega/sitemap-xml';

// La versión markdown de la landing de Teclab: `/teclab.md`. Las tecnicaturas
// son las mismas que muestra la página y las que publica el llms.txt.
export const GET: APIRoute = async () => {
  const datos = await datosLlmsTxt(env.DB);
  const items = datos.carreras
    .filter(carrera => carrera.nivel.startsWith('Teclab'))
    .map(lineaDeCarrera);
  return new Response(construirMarkdownCatalogo({
    titulo: PAGINAS.teclab.titulo,
    descripcion: PAGINAS.teclab.descripcion,
    url: `${BASE}/teclab`,
    secciones: [{ titulo: 'Tecnicaturas y cursos de Teclab', items }],
  }), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};
