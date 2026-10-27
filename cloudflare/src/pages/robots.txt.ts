import { generarRobots } from '../entrega/sitemap-xml.ts';

// Mismas reglas y misma referencia al sitemap que `app/robots.ts`. Next lo
// sirve estático (`public, max-age=0, must-revalidate`); el middleware respeta
// ese Cache-Control en vez de imponer `no-store`.
export function GET() {
  return new Response(generarRobots(), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
