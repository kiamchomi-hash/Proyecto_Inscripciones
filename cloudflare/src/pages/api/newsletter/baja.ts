import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { manejarBaja } from '../../../api/newsletter-baja';

export const POST: APIRoute = ({ request }) => manejarBaja(request, env.APP_STAGE === 'local' ? env.DB ?? null : null);
export const ALL: APIRoute = () => new Response(null, { status: 405, headers: { Allow: 'POST' } });
