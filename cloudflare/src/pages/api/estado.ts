import { env } from 'cloudflare:workers';

// Proyección explícita de una variable no sensible, no del objeto env completo.
export function GET() {
  if (env.APP_STAGE !== 'local') return Response.json({ ok: false }, { status: 503 });
  return Response.json({ ok: true });
}
