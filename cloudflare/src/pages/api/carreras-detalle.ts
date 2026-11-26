import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { responderDetalle } from '../../api/carreras-detalle.ts';
import { bindingDb } from '../../api/runtime.ts';
import { sitioDe } from '../../entrega/sitios.ts';

// Adaptador delgado, como `/api/formularios`: la lectura y el contrato viven en
// `src/api/carreras-detalle.ts`. El handler vigente sólo admite GET; cualquier
// otro método responde 405 en vez del 404 de Astro.
export const prerender = false;

// El mapa se acota a la casa del dominio: en siglo21sur.com no viajan los
// detalles de la Academia.
export const GET: APIRoute = ({ url }) => responderDetalle(
  bindingDb(),
  sitioDe(url.hostname, (env as unknown as { APP_SITIO?: string }).APP_SITIO),
);

export const ALL: APIRoute = () => new Response(
  JSON.stringify({ error: 'Método no permitido' }),
  {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'GET' },
  },
);
