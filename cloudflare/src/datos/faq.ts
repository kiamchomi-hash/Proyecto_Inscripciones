import type { FaqPregunta } from '@/lib/types';

// La proyección pública es la de Next: nunca incluye contacto ni moderación.
export async function listarFaqPublicas(db: D1Database): Promise<FaqPregunta[]> {
  const filas = await db.prepare(`SELECT id, titulo, descripcion, respuesta, created_at
    FROM faq_preguntas WHERE estado = 'aprobada' AND destacada = 1
    ORDER BY orden IS NULL, orden ASC, created_at DESC LIMIT 5`).all<FaqPregunta>();
  return filas.results;
}
