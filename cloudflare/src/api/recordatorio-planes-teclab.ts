import { mensajeRecordatorioPlanesTeclab } from '../../../lib/recordatorio-planes-teclab.ts';
import { rechazoBearer } from './auth.ts';

export interface EntornoRecordatorioPlanesTeclab {
  secretoCron?: string;
  telegram?: (texto: string) => Promise<string>;
}

const respuesta = (cuerpo: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function manejarRecordatorioPlanesTeclab(
  request: Request,
  entorno: EntornoRecordatorioPlanesTeclab,
): Promise<Response> {
  const negado = await rechazoBearer(request, entorno.secretoCron, 'CRON_SECRET');
  if (negado) return negado;

  if (!entorno.telegram) return respuesta({ aviso: 'sin configurar' }, 502);
  const aviso = await entorno.telegram(mensajeRecordatorioPlanesTeclab());
  if (aviso !== 'enviado') {
    console.error('[recordatorio-planes-teclab] Telegram no confirmó el envío', { estado: aviso });
    return respuesta({ aviso }, 502);
  }
  return respuesta({ aviso }, 200);
}
