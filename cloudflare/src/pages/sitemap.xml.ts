import { env } from 'cloudflare:workers';
import { datosSitemap } from '../datos/sitemap.ts';
import { construirSitemap } from '../entrega/sitemap.ts';
import { generarSitemap } from '../entrega/sitemap-xml.ts';
import { sitioDe } from '../entrega/sitios.ts';

// Se genera en cada pedido, como `dynamic = 'force-dynamic'` de Next: el
// sitemap tiene que reflejar altas y bajas sin esperar un deploy. El sitio de
// Identidad tiene el suyo, con sólo sus fichas.
export async function GET({ url }: { url: URL }) {
  const sitio = sitioDe(url.hostname, (env as unknown as { APP_SITIO?: string }).APP_SITIO);
  const xml = generarSitemap(construirSitemap(await datosSitemap(env.DB), { sitio }));
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'no-store',
    },
  });
}
