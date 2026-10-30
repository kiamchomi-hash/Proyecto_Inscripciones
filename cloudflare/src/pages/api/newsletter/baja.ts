import type { APIRoute } from 'astro';
import { bindingDb } from '../../../api/runtime';
import { manejarBaja } from '../../../api/newsletter-baja';

// La base se resuelve como en el resto de los adaptadores: `bindingDb()` habilita
// local y producción y deja staging cerrado. Gatear sólo a `local` dejaba la baja
// en 503 en el sitio publicado.
export const POST: APIRoute = ({ request }) => manejarBaja(request, bindingDb());
export const ALL: APIRoute = () => new Response(null, { status: 405, headers: { Allow: 'POST' } });
