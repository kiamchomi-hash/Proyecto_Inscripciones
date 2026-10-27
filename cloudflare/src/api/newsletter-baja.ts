import { esIdSuscripcion } from '@/components/formularios/mail-precio';
import { darDeBaja } from '../datos/newsletter.ts';

// Paridad del POST Next: el UUID es una capacidad opaca, no se consulta email.
// GET jamás escribe. Query prevalece sobre cuerpo, incluso si está vacía.
export async function manejarBaja(request: Request, db: D1Database | null): Promise<Response> {
  const enQuery = new URL(request.url).searchParams.get('id');
  const desdeFormulario = !enQuery;
  let id: unknown = enQuery;
  if (enQuery === null) {
    try { id = (await request.formData()).get('id'); } catch { id = null; }
  }
  if (!esIdSuscripcion(id)) return Response.json({ error: 'Solicitud inválida' }, { status: 400 });
  if (!db) return Response.json({ error: 'No se pudo procesar la baja' }, { status: 503 });
  try {
    // Inexistente y repetida son indistinguibles de una baja aplicada.
    await darDeBaja(db, id);
  } catch {
    // Ni el token ni el mensaje del driver (que puede incluir SQL/datos) salen.
    console.error('[newsletter] No se pudo dar de baja', { code: 'error-base' });
    return Response.json({ error: 'No se pudo procesar la baja' }, { status: 500 });
  }
  return desdeFormulario
    ? new Response(null, { status: 303, headers: { Location: new URL('/newsletter/baja?listo=1', request.url).href } })
    : Response.json({ ok: true });
}
