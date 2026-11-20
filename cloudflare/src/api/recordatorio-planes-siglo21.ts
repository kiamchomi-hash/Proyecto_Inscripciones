import { mensajeRecordatorioPlanesSiglo21 } from '../../../lib/recordatorio-planes-siglo21.ts';
import { rechazoBearer } from './auth.ts';

export interface EntornoRecordatorioPlanesSiglo21 {
  secretoCron?: string;
  telegram?: (texto: string) => Promise<string>;
}

const respuesta = (cuerpo: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function manejarRecordatorioPlanesSiglo21(
  request: Request,
  entorno: EntornoRecordatorioPlanesSiglo21,
): Promise<Response> {
  const negado = await rechazoBearer(request, entorno.secretoCron, 'CRON_SECRET');
  if (negado) return negado;

  if (!entorno.telegram) return respuesta({ aviso: 'sin configurar' }, 502);
  const aviso = await entorno.telegram(mensajeRecordatorioPlanesSiglo21());
  if (aviso !== 'enviado') {
    console.error('[recordatorio-planes-siglo21] Telegram no confirmó el envío', { estado: aviso });
    return respuesta({ aviso }, 502);
  }
  return respuesta({ aviso: 'enviado' }, 200);
}
