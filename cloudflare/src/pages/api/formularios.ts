import type { APIRoute } from 'astro';
import { manejarFormulario } from '../../api/formularios.ts';
import { bindingDb, entornoFormularios } from '../../api/runtime.ts';

// Adaptador delgado: el sobre, la cuota y el outbox viven en `src/api/formularios.ts`.
export const prerender = false;

/** Igual que el sitio anterior: el resto de los métodos responde 405, no 404. */
const noPermitido = () => new Response(JSON.stringify({ error: 'Método no permitido' }), {
  status: 405,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Allow: 'POST' },
});

export const POST: APIRoute = ({ request }) =>
  manejarFormulario(request, bindingDb(), entornoFormularios());

export const GET: APIRoute = noPermitido;
export const PUT: APIRoute = noPermitido;
export const DELETE: APIRoute = noPermitido;
export const PATCH: APIRoute = noPermitido;

