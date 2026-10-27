import { consumirCupoAlerta } from '../datos/control.ts';
import { registrarClickWhatsapp } from '../datos/whatsapp.ts';
import { ipConfiable } from './ip.ts';

/**
 * Alertas del embudo por Telegram. Copia la allowlist del handler vigente
 * (`app/api/alertas-analytics/route.ts`): por evento y por campo, con valores
 * cerrados y textos recortados. Ningún dato fuera de la lista llega al aviso.
 *
 * El envío es un puerto: sin configuración responde 502 `{ ok: false }`, un
 * rechazo del proveedor también, y una excepción de red la absorbe el `catch`
 * externo como en Next (200 `{ ok: false }`). La cuota es la misma RPC, con la
 * IP de confianza del borde.
 */

const ORIGENES_FORMULARIO = new Set(['home', 'teclab', 'contacto']);
const MODOS_FORMULARIO = new Set(['contacto', 'preinscripcion']);

const esRegistro = (valor: unknown): valor is Record<string, unknown> =>
  valor !== null && typeof valor === 'object' && !Array.isArray(valor);

function textoSeguro(valor: unknown, max = 80): string {
  return typeof valor === 'string'
    ? valor.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max)
    : '';
}

function enteroSeguro(valor: unknown, max = 99): number | null {
  return typeof valor === 'number' && Number.isInteger(valor) && valor >= 0
    ? Math.min(valor, max)
    : null;
}

export type AlertaPreparada = { texto: string; maximo: number };

/** Devuelve `null` para cualquier combinación que no esté en la allowlist. */
export function prepararAlerta(evento: string, datos: Record<string, unknown>): AlertaPreparada | null {
  const origen = textoSeguro(datos.origen);
  const modo = textoSeguro(datos.modo);

  if (evento === 'whatsapp') {
    if (!origen.startsWith('/')) return null;
    return { texto: ['Clic móvil a WhatsApp', `Página: ${origen}`].join('\n'), maximo: 5 };
  }
  if (evento === 'clase-whatsapp') {
    const materia = textoSeguro(datos.materia);
    if (!materia) return null;
    return { texto: ['Clic a WhatsApp de clases', `Materia: ${materia}`].join('\n'), maximo: 5 };
  }
  if (evento === 'formulario-fallo') {
    const motivo = textoSeguro(datos.motivo);
    if (!ORIGENES_FORMULARIO.has(origen) || !['red', 'servidor'].includes(motivo)) return null;
    return {
      texto: ['Fallo técnico del formulario de contacto', `Origen: ${origen}`, `Tipo: ${motivo}`].join('\n'),
      maximo: 5,
    };
  }
  if (evento === 'formulario-intento') {
    const resultado = textoSeguro(datos.resultado);
    if (!ORIGENES_FORMULARIO.has(origen) || !MODOS_FORMULARIO.has(modo)
      || !['captcha', 'validacion'].includes(resultado)) return null;
    return {
      texto: [
        'Intento de envío de formulario', `Origen: ${origen}`, `Modo: ${modo}`, `Resultado: ${resultado}`,
      ].join('\n'),
      maximo: 12,
    };
  }
  if (evento === 'formulario-abandonado') {
    const ultimoCampo = textoSeguro(datos.ultimo_campo);
    const motivo = textoSeguro(datos.motivo);
    const completados = enteroSeguro(datos.campos_completados);
    if (!ORIGENES_FORMULARIO.has(origen) || !MODOS_FORMULARIO.has(modo)
      || !ultimoCampo || !['envio-en-curso', 'error-envio', 'captcha', 'validacion', 'abandono'].includes(motivo)
      || completados === null) return null;
    return {
      texto: [
        'Abandono de formulario', `Origen: ${origen}`, `Modo: ${modo}`,
        `Último campo: ${ultimoCampo}`, `Motivo: ${motivo}`, `Campos completados: ${completados}`,
      ].join('\n'),
      maximo: 12,
    };
  }
  return null;
}

export interface EntornoAlerta {
  /** Puede lanzar en error de red: el handler lo trata como el `catch` vigente. */
  telegram?: (texto: string) => Promise<boolean>;
}

const respuesta = (cuerpo: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function manejarAlertaAnalytics(
  request: Request, db: D1Database | null, entorno: EntornoAlerta,
): Promise<Response> {
  try {
    let cuerpo: unknown;
    try {
      cuerpo = await request.json();
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      return respuesta({ ok: false }, 400);
    }
    if (!esRegistro(cuerpo)) return respuesta({ ok: false }, 400);
    const evento = textoSeguro(cuerpo.evento, 40);
    if (!esRegistro(cuerpo.datos)) return respuesta({ ok: false }, 400);
    const alerta = prepararAlerta(evento, cuerpo.datos);
    if (!alerta) return respuesta({ ok: false }, 400);

    // Sin base no se puede consumir la cuota: el handler vigente también falla
    // dentro del catch y no inventa un envío.
    if (!db) return respuesta({ ok: false });

    const ip = ipConfiable(request);
    const movil = cuerpo.datos.movil === 1 || cuerpo.datos.movil === true;

    // El clic a WhatsApp se cuenta siempre, desde móvil y desde escritorio, y
    // antes de mirar el cupo de los avisos: si el aviso de Telegram se saltea
    // —porque ya se mandaron cinco en diez minutos—, el dato igual queda.
    if (evento === 'whatsapp') {
      const contado = await registrarClickWhatsapp(db, cuerpo.datos.origen, movil, ip);
      // El aviso por Telegram sigue siendo sólo del móvil. En escritorio wa.me
      // abre WhatsApp Web y quien no tiene la sesión iniciada se queda en la
      // pantalla de descarga: avisar por cada clic de escritorio es ruido.
      // Tampoco se avisa de un clic que no entró al contador (cupo agotado):
      // alertar de algo que el informe no va a mostrar descuadra las dos cosas.
      if (!contado || !movil) return respuesta({ ok: true });
    }

    const permitido = await consumirCupoAlerta(db, evento, ip);
    if (!permitido) return respuesta({ ok: true, skipped: true });

    if (!entorno.telegram) return respuesta({ ok: false }, 502);
    const enviado = await entorno.telegram(alerta.texto);
    return respuesta({ ok: enviado }, enviado ? 200 : 502);
  } catch (error) {
    console.error('[alertas-analytics]', {
      code: error instanceof Error ? error.name : 'desconocido',
    });
    return respuesta({ ok: false });
  }
}
