import { mensajeRecordatorioTeclab, type FichaTeclab } from '../../../lib/recordatorio-teclab.ts';
import { rechazoBearer } from './auth.ts';

/**
 * Cron semanal del recordatorio de Teclab. Mismo contrato que
 * `app/api/recordatorio-teclab/route.ts`: `Bearer CRON_SECRET`, sin secreto 503,
 * secreto distinto 401. La lectura replica el filtro vigente (Teclab, activas,
 * sin el curso) y, si falla, el aviso sale igual avisando que no se pudo leer.
 *
 * El envío es un puerto inyectado: las pruebas no tocan Telegram y el runtime
 * sólo le pasa configuración y `fetch` desde el servidor.
 */
export interface EntornoRecordatorio {
  secretoCron?: string;
  telegram?: (texto: string) => Promise<string>;
}

const respuesta = (cuerpo: Record<string, unknown>) =>
  new Response(JSON.stringify(cuerpo), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function manejarRecordatorio(
  request: Request, db: D1Database | null, entorno: EntornoRecordatorio,
): Promise<Response> {
  const negado = await rechazoBearer(request, entorno.secretoCron, 'CRON_SECRET');
  if (negado) return negado;

  let fichas: FichaTeclab[] | null = null;
  if (db) {
    try {
      const filas = await db.prepare(`SELECT nombre, descripcion FROM carreras
        WHERE activa = 1 AND nivel LIKE 'Teclab -%' AND nivel <> 'Teclab - Curso'
        ORDER BY nombre`).all<FichaTeclab>();
      fichas = filas.results;
    } catch (error) {
      console.error('[recordatorio-teclab] No se pudieron leer las carreras', {
        code: error instanceof Error ? error.name : 'desconocido',
      });
    }
  } else {
    console.error('[recordatorio-teclab] No se pudieron leer las carreras', { code: 'sin-base' });
  }

  // Sin puerto de Telegram, el contrato vigente responde «sin configurar» 200.
  const aviso = entorno.telegram
    ? await entorno.telegram(mensajeRecordatorioTeclab(fichas))
    : 'sin configurar';
  return respuesta({ aviso });
}
