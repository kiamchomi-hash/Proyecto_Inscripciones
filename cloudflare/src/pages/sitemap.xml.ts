import { env } from 'cloudflare:workers';
import { datosSitemap } from '../datos/sitemap.ts';
import { construirSitemap } from '../entrega/sitemap.ts';
import { generarSitemap } from '../entrega/sitemap-xml.ts';

// Se genera en cada pedido, como `dynamic = 'force-dynamic'` de Next: el
// sitemap tiene que reflejar altas y bajas sin esperar un deploy.
export async function GET() {
  const xml = generarSitemap(construirSitemap(await datosSitemap(env.DB)));
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'no-store',
    },
  });
}
