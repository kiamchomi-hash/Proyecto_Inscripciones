import { env } from 'cloudflare:workers';
import { generarRobots } from '../entrega/sitemap-xml.ts';
import { baseDeSitio, sitioDe } from '../entrega/sitios.ts';

// Mismas reglas y misma referencia al sitemap que `app/robots.ts`. Next lo
// sirve estático (`public, max-age=0, must-revalidate`); el middleware respeta
// ese Cache-Control en vez de imponer `no-store`. Cada sitio anuncia el sitemap
// que le corresponde.
export function GET({ url }: { url: URL }) {
  const sitio = sitioDe(url.hostname, (env as unknown as { APP_SITIO?: string }).APP_SITIO);
  return new Response(generarRobots(baseDeSitio(sitio)), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
