// El mail con el resumen del precio de Teclab: lo que la persona acaba de ver
// en «Ver precio» o en la preinscripción, para que le quede guardado. Lo manda
// `/api/formularios` por SMTP2GO, con la respuesta ya enviada. La misma
// plantilla es el newsletter semanal (`tipo: 'newsletter'`, lo manda el cron
// `/api/newsletter`): cambian el asunto y el pie, que lleva la baja.
//
// `armarMailPrecio` es puro: arma asunto, HTML y texto, y no manda nada. Lo
// único que sale a la red es `mandarPorSmtp2go`, que comparten los dos
// envíos. El diseño es el aprobado
// el 02/10/2026 (docs/mails/mail-inicio-teclab.html): si se cambia uno, se
// cambia el otro. Reusa las mismas piezas que la pantalla (inicio de clases,
// qué cubre el pago, enlace de autoinscripción) para que el mail no diga otra
// cosa que el sitio.
//
// Sin guiones largos ni viñetas decorativas: el texto se copia por una consola
// que los convierte en signos de pregunta.

import { coberturaDelPago } from '@/components/formularios/cobertura-pago';
import { PARAMETRO_DESDE, VALOR_DESDE_MAIL } from '@/components/formularios/elegir-carrera';
import { carreraFullName, carreraToSlug } from '@/components/index/types';
import { inicioTeclab } from '@/components/index/inicio-teclab';
import { numeroWhatsAppDe } from '@/lib/whatsapp';
import { BASE_PROD } from '@/lib/vigilancia-esperado';
import type { LineaPrecio } from '@/components/formularios/casas';

export interface CarreraDelMail {
  nombre: string;
  nivel: string;
  prefix?: string | null;
  nombre_corto?: string | null;
  duracion?: string | null;
}

export interface PrecioDelMail {
  conceptos: LineaPrecio[];
  total: string;
  nota: string | null;
  vigenteHasta: string;
}

export interface MailPrecio {
  asunto: string;
  html: string;
  texto: string;
}

/** El logo blanco de Teclab, en PNG: Outlook de escritorio no muestra WebP. */
export const LOGO_TECLAB_MAIL = `${BASE_PROD}/imagenes/teclab/mail/logo-teclab-blanco.png`;

const CIAN = '#4AE2E7';
const AZUL = '#0055F0';
const TARJETA = '#0C1824';
const CAJA = '#0f2236';
const LINEA = '#24405e';
const SUAVE = '#9fb0c2';
const CLARO = '#F0F0F6';
const PIE = 'Te escribimos porque pediste el precio de esta carrera en siglo21sur.com.';
const PIE_NEWSLETTER = 'Te escribimos desde el CAU porque pediste novedades de esta carrera en siglo21sur.com.';
const BAJA = 'Dejar de recibir novedades';

/** El id de una suscripción al newsletter: es lo que identifica la baja. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const esIdSuscripcion = (valor: unknown): valor is string =>
  typeof valor === 'string' && UUID.test(valor);

const escapar = (valor: string) =>
  valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** `AAAA-MM-DD` -> `DD/MM`, sin pasar por `Date` (se correría un día por UTC). */
function diaMes(fecha: string): string {
  const [, mes, dia] = fecha.split('-');
  return dia && mes ? `${dia}/${mes}` : fecha;
}

/**
 * Titular y bajada, con la misma lógica que el aviso de la ficha
 * (`aviso-inicio-teclab.tsx`): antes del inicio, la fecha de inicio; con las
 * clases empezadas, el cierre de inscripción. Sin inscripción abierta, un
 * titular neutro y sin bajada. `fecha` es la parte que no se corta de línea.
 */
function titularDe(carrera: CarreraDelMail, hoy: Date) {
  const inicio = inicioTeclab({ nivel: carrera.nivel }, hoy);
  if (!inicio) return { antes: 'El precio de tu carrera', fecha: '', bajada: null };
  return inicio.empezo
    ? { antes: 'Tenés tiempo hasta el ', fecha: inicio.hastaTexto, bajada: `Las clases empezaron el ${inicio.inicioTexto}.` }
    : { antes: 'Las clases arrancan el ', fecha: inicio.inicioTexto, bajada: 'Todavía estás a tiempo de inscribirte.' };
}

const PILDORA = `display:inline-block;background:${CIAN};color:${TARJETA};font-weight:700;border-radius:999px;`;
const ENCABEZADO = `padding:0 0 10px;font-size:11px;font-weight:600;color:${SUAVE};text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid ${LINEA};`;
const CELDA = `padding:14px 0;border-bottom:1px solid ${LINEA};`;

function filaHtml(linea: LineaPrecio): string {
  const descuento = linea.descuento
    ? `<span style="${PILDORA}font-size:13px;padding:2px 10px;">-${escapar(String(linea.descuento))}%</span>`
    : '';
  return `
                      <tr>
                        <td style="${CELDA}color:#ffffff;">${escapar(linea.concepto)}</td>
                        <td align="right" style="${CELDA}color:#ffffff;white-space:nowrap;">${escapar(linea.monto)}</td>
                        <td align="right" style="${CELDA}">${descuento}</td>
                      </tr>`;
}

/** El resumen es transaccional y no lleva baja; el newsletter la lleva siempre. */
export type OpcionesMail = { carrera: CarreraDelMail; precio: PrecioDelMail; hoy: Date } & (
  | { tipo?: 'resumen'; bajaUrl?: undefined }
  | { tipo: 'newsletter'; bajaUrl: string }
);

/**
 * El asunto del newsletter: la carrera, la casa y el titular del mail. Con la
 * inscripción cerrada el titular neutro («El precio de tu carrera») no dice
 * nada en la bandeja, así que se nombra la semana.
 */
function asuntoNewsletter(corto: string, titular: { antes: string; fecha: string }) {
  const frase = titular.fecha ? `${titular.antes}${titular.fecha}` : 'El precio de esta semana';
  return `${corto} en Teclab: ${frase.charAt(0).toLowerCase()}${frase.slice(1)}`;
}

export function armarMailPrecio({ carrera, precio, hoy, tipo, bajaUrl }: OpcionesMail): MailPrecio {
  // El nombre como lo muestra la ficha: el prefijo de la base ya trae la
  // preposición («Tecnicatura Superior en», «Curso de»). `carreraFullName`
  // arma el slug y simplifica el prefijo: dejaba «Tecnicatura en Programación».
  const prefijo = carrera.prefix?.trim() ?? '';
  const yaTienePrefijo = prefijo !== '' &&
    carrera.nombre.toLowerCase().startsWith(`${prefijo.toLowerCase()} `);
  const nombre = /\s(en|de)$/i.test(prefijo) && !yaTienePrefijo
    ? `${prefijo} ${carrera.nombre}`
    : carreraFullName({ nombre: carrera.nombre, prefix: carrera.prefix ?? null });
  const corto = carrera.nombre_corto?.trim() || carrera.nombre;
  const titular = titularDe(carrera, hoy);
  const esNewsletter = tipo === 'newsletter';
  const asunto = esNewsletter ? asuntoNewsletter(corto, titular) : `Precio de ${corto} en Teclab`;
  const pie = esNewsletter ? PIE_NEWSLETTER : PIE;
  const promo = `Promo hasta el ${diaMes(precio.vigenteHasta)}`;
  const cobertura = coberturaDelPago(precio.conceptos, carrera.duracion) ?? precio.nota;
  // A la ficha y no al formulario: con `desde=mail` el botón «Quiero
  // inscribirme» de la ficha titila (components/carreras/resaltar-inscripcion.tsx).
  const inscripcion = `${BASE_PROD}/carreras/${carreraToSlug({ nombre: carrera.nombre, prefix: carrera.prefix ?? null })}?${PARAMETRO_DESDE}=${VALOR_DESDE_MAIL}`;
  const whatsapp = `https://wa.me/${numeroWhatsAppDe('teclab')}?text=${encodeURIComponent(`Hola, quiero consultar por la ${nombre}`)}`;

  const texto = [
    nombre,
    // Sin titular grande en el cuerpo: ocupaba demasiado alto. La fecha queda
    // en el asunto del newsletter y en esta línea.
    ...(titular.bajada ? [titular.bajada] : []),
    '',
    `Precio (${promo})`,
    ...precio.conceptos.map(l => `${l.concepto}: ${l.monto}${l.descuento ? ` (-${l.descuento}%)` : ''}`),
    `Total: ${precio.total}`,
    ...(cobertura ? [cobertura] : []),
    '',
    `Quiero inscribirme: ${inscripcion}`,
    `Consultar por WhatsApp: ${whatsapp}`,
    '',
    'Para lo que viene sos imprescindible',
    '',
    pie,
    ...(esNewsletter ? [`${BAJA}: ${bajaUrl}`] : []),
  ].join('\n');

  const bajadaHtml = titular.bajada
    ? `\n              <div style="font-size:15px;line-height:1.45;color:${CLARO};margin-top:12px;">${escapar(titular.bajada)}</div>`
    : '';
  const coberturaHtml = cobertura
    ? `
                <tr>
                  <td style="padding:6px 20px 20px;font-size:13px;line-height:1.5;color:${SUAVE};">${escapar(cobertura)}</td>
                </tr>`
    : `
                <tr><td style="padding:0 0 14px;"></td></tr>`;

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapar(asunto)}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;0,700;1,600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#070f17;font-family:Poppins,Arial,Helvetica,sans-serif;color:${CLARO};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070f17;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${TARJETA};border:1.5px solid ${AZUL};border-radius:24px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:28px 28px 0;">
              <img src="${LOGO_TECLAB_MAIL}" width="140" alt="Teclab, Instituto Técnico Superior" style="display:block;width:140px;height:auto;border:0;margin:0 auto;">
            </td>
          </tr>

          <!-- Carrera, fecha y aviso -->
          <tr>
            <td align="center" style="padding:24px 28px 0;text-align:center;">
              <span style="${PILDORA}font-size:14px;padding:6px 16px;">${escapar(nombre)}</span>${bajadaHtml}
            </td>
          </tr>

          <!-- Precio -->
          <tr>
            <td style="padding:26px 20px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CAJA};border:2px solid ${AZUL};border-radius:18px;">
                <tr>
                  <td style="padding:20px 20px 6px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:18px;font-weight:700;color:#ffffff;">Precio</td>
                        <td align="right"><span style="${PILDORA}font-size:12px;padding:5px 12px;white-space:nowrap;">${escapar(promo)}</span></td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 20px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
                      <tr>
                        <th align="left" style="${ENCABEZADO}">Concepto</th>
                        <th align="right" style="${ENCABEZADO}">Precio</th>
                        <th align="right" style="${ENCABEZADO}">Descuento</th>
                      </tr>${precio.conceptos.map(filaHtml).join('')}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:18px 0 4px;color:#ffffff;font-weight:700;font-size:16px;">Total</td>
                        <td align="right" style="padding:18px 0 4px;color:${CIAN};font-weight:700;font-size:28px;white-space:nowrap;letter-spacing:-0.5px;">${escapar(precio.total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>${coberturaHtml}
              </table>
            </td>
          </tr>

          <!-- Acciones -->
          <tr>
            <td align="center" style="padding:26px 28px 0;">
              <a href="${escapar(inscripcion)}" style="display:block;background:${AZUL};color:#ffffff;font-weight:700;font-size:16px;text-decoration:none;padding:15px 20px;border-radius:999px;">Quiero inscribirme</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 28px 0;">
              <a href="${escapar(whatsapp)}" style="display:block;border:1.5px solid #25D366;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;padding:13px 20px;border-radius:999px;">Consultar por WhatsApp</a>
            </td>
          </tr>

          <!-- Remate -->
          <tr>
            <td align="center" style="padding:28px 28px 28px;text-align:center;">
              <div style="font-size:16px;font-weight:600;color:#ffffff;">Para lo que viene sos <em style="font-style:italic;">imprescindible</em></div>
            </td>
          </tr>
        </table>

        <!-- Pie -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding:18px 8px;font-size:12px;line-height:1.6;color:#7f90a2;text-align:center;">${escapar(pie)}${esNewsletter
    ? `<br>
              <a href="${escapar(bajaUrl)}" style="color:#9fb0c2;">${BAJA}</a>`
    : ''}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { asunto, html, texto };
}

const SMTP2GO_URL = 'https://api.smtp2go.com/v3/email/send';
const REMITENTE_MAIL = 'CAU Online <inscripciones@siglo21sur.com>';
const TIMEOUT_MAIL_MS = 8000;

export interface EnvioSmtp2go {
  /** `true` sólo si SMTP2GO confirmó al menos un destinatario sin fallos. */
  enviado: boolean;
  /** El HTTP de la respuesta; `null` si no hubo respuesta (red, timeout). */
  status: number | null;
  /** El `error_code` de SMTP2GO o el nombre del error de red. Nunca el mensaje. */
  codigo?: string;
}

const registro = (valor: unknown): Record<string, unknown> | null =>
  valor !== null && typeof valor === 'object' && !Array.isArray(valor) ? valor as Record<string, unknown> : null;

/**
 * Manda un mail por la API de SMTP2GO, desde `inscripciones@siglo21sur.com`.
 * No lanza: devuelve si quedó confirmado, para que cada envío decida qué
 * registra. `encabezados` va como `custom_headers` (el newsletter manda ahí la
 * baja de un clic). Lo que devuelve no lleva ni el mail ni la clave.
 */
export async function mandarPorSmtp2go({ clave, para, mail, encabezados }: {
  clave: string;
  para: string;
  mail: MailPrecio;
  encabezados?: { header: string; value: string }[];
}): Promise<EnvioSmtp2go> {
  try {
    const respuesta = await fetch(SMTP2GO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Smtp2go-Api-Key': clave },
      body: JSON.stringify({
        sender: REMITENTE_MAIL,
        to: [para],
        subject: mail.asunto,
        html_body: mail.html,
        text_body: mail.texto,
        ...(encabezados?.length ? { custom_headers: encabezados } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MAIL_MS),
    });
    const data = registro(registro(await respuesta.json().catch(() => null))?.data);
    const codigo = typeof data?.error_code === 'string' ? data.error_code : undefined;
    const enviados = typeof data?.succeeded === 'number' ? data.succeeded : 0;
    const fallidos = typeof data?.failed === 'number' ? data.failed : 0;
    return { enviado: respuesta.ok && enviados >= 1 && fallidos === 0, status: respuesta.status, codigo };
  } catch (error) {
    return { enviado: false, status: null, codigo: error instanceof Error ? error.name : 'desconocido' };
  }
}
