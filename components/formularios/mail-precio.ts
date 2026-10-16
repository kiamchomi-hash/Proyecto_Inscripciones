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

import { coberturaDelPago, coberturaSiglo21 } from '@/components/formularios/cobertura-pago';
import { carreraFullName, carreraToSlug } from '@/components/index/types';
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
const BAJA = 'Anular suscripción';
// Botón de baja: contorno sutil, para que se vea sin competir con la inscripción.
const BOTON_BAJA = `display:inline-block;border:1px solid ${SUAVE};color:${CLARO};font-size:13px;padding:8px 18px;border-radius:999px;text-decoration:none;`;

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


const PILDORA = `display:inline-block;background:${CIAN};color:${TARJETA};font-weight:700;border-radius:999px;`;
const ENCABEZADO = `padding:0 0 10px;font-size:11px;font-weight:600;color:${SUAVE};text-transform:uppercase;letter-spacing:1.5px;border-bottom:1px solid ${LINEA};`;
const CELDA = `padding:14px 0;border-bottom:1px solid ${LINEA};`;

/**
 * Numera los bimestres en el orden del precio, como en Siglo 21: «Bimestre 1
 * (octubre-noviembre)», «Bimestre 2». Una «cuota» es un bimestre: la
 * matrícula y dos bimestres es el cuatrimestre completo. Sólo cambia el rótulo
 * que se muestra; la cobertura sigue usando los conceptos originales.
 */
function numerarBimestres(conceptos: LineaPrecio[]): LineaPrecio[] {
  let numero = 0;
  return conceptos.map(linea => {
    const texto = linea.concepto.trim();
    const m = texto.match(/^(bimestre|cuota)\b\s*(\(.*\))?/i);
    if (!m) return linea;
    numero += 1;
    // Si ya viene numerado («Bimestre 2 2027»), se deja como está.
    if (/^bimestre\s+\d/i.test(texto)) return linea;
    const resto = m[2] ? ` ${m[2]}` : '';
    return { ...linea, concepto: `Bimestre ${numero}${resto}` };
  });
}

function filaHtml(linea: LineaPrecio): string {
  return `
                      <tr>
                        <td style="${CELDA}padding-right:12px;color:#ffffff;">${escapar(linea.concepto)}</td>
                        <td align="right" style="${CELDA}color:#ffffff;white-space:nowrap;">${escapar(linea.monto)}</td>
                      </tr>`;
}

/** El resumen es transaccional y no lleva baja; el newsletter la lleva siempre. */
export type OpcionesMail = { carrera: CarreraDelMail; precio: PrecioDelMail; hoy: Date } & (
  | { tipo?: 'resumen'; bajaUrl?: undefined }
  | { tipo: 'newsletter'; bajaUrl: string }
);

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
  const siglo21 = !carrera.nivel.startsWith('Teclab');
  if (siglo21) return armarMailSiglo21({ carrera, precio, hoy, tipo, bajaUrl });
  const corto = carrera.nombre_corto?.trim() || carrera.nombre;
  const esNewsletter = tipo === 'newsletter';
  // Mismo asunto para el resumen y el newsletter: la carrera y la casa, sin la fecha.
  const asunto = `Precios - ${corto} - Teclab`;
  const pie = esNewsletter ? PIE_NEWSLETTER : PIE;
  const promo = `Precio vigente hasta el ${diaMes(precio.vigenteHasta)}`;
  const cobertura = coberturaDelPago(precio.conceptos, carrera.duracion) ?? precio.nota;
  // A la página dedicada de inscripción: quien llega desde el mail ya viene a
  // inscribirse y no tiene que volver a buscar el formulario en la ficha.
  const inscripcion = `${BASE_PROD}/carreras/${carreraToSlug({ nombre: carrera.nombre, prefix: carrera.prefix ?? null })}/inscripcion`;
  const whatsapp = `https://wa.me/${numeroWhatsAppDe('teclab')}?text=${encodeURIComponent(`Hola, quiero consultar por la ${nombre}`)}`;

  const texto = [
    nombre,
    '',
    promo,
    ...numerarBimestres(precio.conceptos).map(l => `${l.concepto}: ${l.monto}`),
    `Total: ${precio.total}`,
    ...(cobertura ? [cobertura] : []),
    '',
    `Quiero inscribirme: ${inscripcion}`,
    `Consultar por WhatsApp: ${whatsapp}`,
    '',
    pie,
    ...(esNewsletter ? [`${BAJA}: ${bajaUrl}`] : []),
  ].join('\n');

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

          <!-- Carrera, fecha y aviso -->
          <tr>
            <td align="center" style="padding:32px 28px 0;text-align:center;">
              <span style="${PILDORA}font-size:14px;padding:6px 16px;">${escapar(nombre)}</span>
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
                        <td align="center"><span style="display:inline-block;background:#5D4594;color:#F2F0F7;font-weight:700;border-radius:999px;font-size:12px;padding:5px 12px;white-space:nowrap;">${escapar(promo)}</span></td>
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
                      </tr>${numerarBimestres(precio.conceptos).map(filaHtml).join('')}
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
                </tr>
                <tr><td style="padding:0 0 14px;"></td></tr>
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

          <!-- Logo, al pie de la tarjeta -->
          <tr>
            <td align="center" style="padding:28px 28px 28px;">
              <img src="${LOGO_TECLAB_MAIL}" width="140" height="47" alt="Teclab, Instituto Técnico Superior" style="display:block;width:140px;height:47px;border:0;margin:0 auto;">
            </td>
          </tr>
        </table>

        <!-- Pie -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding:18px 8px;font-size:12px;line-height:1.6;color:#7f90a2;text-align:center;">${escapar(pie)}${cobertura ? `<p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#7f90a2;">${escapar(cobertura)}</p>` : ''}${esNewsletter
    ? `<div style="padding-top:14px;"><a href="${escapar(bajaUrl)}" style="${BOTON_BAJA}">${BAJA}</a></div>`
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


// Paleta medida sobre las piezas aprobadas de Siglo 21 (carpeta
// contenidos/siglo21/aprobados, cuentagotas): fondo verde muy oscuro, tarjetas
// un tono más claras, cian como acento y como acción principal con texto
// oscuro, y el logo blanco directo sobre el fondo, sin placa.
const SIGLO_FONDO = '#0D2119';
const SIGLO_TARJETA = '#192C24';
const SIGLO_CELDA = '#0F2D27';
const SIGLO_CIAN = '#00C7B1';
const SIGLO_TEXTO = '#F2F0F7';
const SIGLO_SUAVE = '#9FB9B2';
const SIGLO_LINEA = '#24453A';
/** Logo blanco de Siglo 21 en PNG transparente: el SVG de public/ no llega a todos los clientes de correo. */
const SIGLO_LOGO_BLANCO_MAIL = `${BASE_PROD}/imagenes/imagenes_cau/siglo21-marca-blanco-mail.png`;

/** Lista de Siglo 21: no reutiliza promociones, financiación ni calendario de Teclab. */
function armarMailSiglo21({ carrera, precio, tipo, bajaUrl }: { carrera: CarreraDelMail; precio: PrecioDelMail; hoy: Date; tipo?: 'resumen' | 'newsletter'; bajaUrl?: string }): MailPrecio {
  const nombre = carreraFullName({ nombre: carrera.nombre, prefix: carrera.prefix ?? null });
  const corto = carrera.nombre_corto?.trim() || carrera.nombre;
  const asunto = `${tipo === 'newsletter' ? 'Precios y novedades' : 'Precios'} de ${corto} en Universidad Siglo 21`;
  const inscripcion = `${BASE_PROD}/carreras/${carreraToSlug({ nombre: carrera.nombre, prefix: carrera.prefix ?? null })}/inscripcion`;
  const whatsapp = `https://wa.me/${numeroWhatsAppDe('siglo21')}?text=${encodeURIComponent(`Hola, quiero consultar por ${nombre}`)}`;
  const pie = tipo === 'newsletter' ? 'Te escribimos porque pediste novedades de esta carrera en siglo21sur.com.' : PIE;
  const cobertura = coberturaSiglo21(carrera.duracion);
  const texto = [nombre, '', ...numerarBimestres(precio.conceptos).map(l => `${l.concepto}: ${l.monto}`),
    `Total: ${precio.total}`, `Precio vigente hasta el ${diaMes(precio.vigenteHasta)}`,
    cobertura, '', `Preinscribirme: ${inscripcion}`,
    `Consultar por WhatsApp: ${whatsapp}`, '', pie,
    ...(tipo === 'newsletter' ? [`${BAJA}: ${bajaUrl}`] : [])].join('\n');

  const filasPrecio = numerarBimestres(precio.conceptos).map(l => `
                  <tr>
                    <td style="padding:12px 16px 12px 0;border-bottom:1px solid ${SIGLO_LINEA};color:${SIGLO_TEXTO};font-size:15px;">${escapar(l.concepto)}</td>
                    <td align="right" style="padding:12px 0;border-bottom:1px solid ${SIGLO_LINEA};color:${SIGLO_TEXTO};font-size:15px;font-weight:700;white-space:nowrap;">${escapar(l.monto)}</td>
                  </tr>`).join('');
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapar(asunto)}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${SIGLO_FONDO};font-family:'DM Sans',Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SIGLO_FONDO};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border-collapse:separate;">

          <!-- Cabecera: rótulo y carrera centrados, sin caja -->
          <tr>
            <td align="center" style="padding:8px 28px 14px;background:${SIGLO_FONDO};">
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="background:${SIGLO_TARJETA};border-radius:999px;padding:12px 24px;">
                    <h1 style="margin:0;font-size:20px;line-height:1.25;font-weight:700;color:#FFFFFF;">${escapar(nombre)}</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:12px;line-height:12px;font-size:0;">&nbsp;</td></tr>

          <!-- Tarjeta de precios -->
          <tr>
            <td style="padding:22px 28px 28px;background:${SIGLO_TARJETA};border-radius:28px;">
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto 14px;">
                <tr>
                  <td align="center" style="background:#5D4594;border-radius:999px;padding:10px 18px;color:${SIGLO_TEXTO};font-size:14px;font-weight:700;">Precio vigente hasta el ${escapar(diaMes(precio.vigenteHasta))}</td>
                </tr>
              </table>

              <!-- Bloque de conceptos y total -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SIGLO_CELDA};border:1px solid ${SIGLO_LINEA};border-radius:22px;margin-top:14px;">
                <tr>
                  <td style="padding:6px 20px 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${filasPrecio}
                      <tr>
                        <td style="padding:16px 16px 4px 0;color:${SIGLO_TEXTO};font-size:16px;font-weight:700;">Total</td>
                        <td align="right" style="padding:16px 0 4px;color:${SIGLO_TEXTO};font-size:24px;font-weight:700;white-space:nowrap;">${escapar(precio.total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Acciones: cian como acción principal, como en las piezas aprobadas -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                <tr>
                  <td>
                    <a href="${escapar(inscripcion)}" style="display:block;text-align:center;background:${SIGLO_CIAN};color:${SIGLO_FONDO};font-weight:700;font-size:16px;text-decoration:none;padding:15px 20px;border-radius:999px;">Preinscribirme</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;">
                    <a href="${escapar(whatsapp)}" style="display:block;text-align:center;background:#25D366;color:${SIGLO_FONDO};font-weight:700;font-size:16px;text-decoration:none;padding:15px 20px;border-radius:999px;">Consultar por WhatsApp</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:12px;line-height:12px;font-size:0;">&nbsp;</td></tr>

          <!-- Pie: logo blanco centrado, sin placa -->
          <tr>
            <td align="center" style="padding:24px 28px 8px;background:${SIGLO_FONDO};">
              <img src="${SIGLO_LOGO_BLANCO_MAIL}" width="130" height="47" alt="Universidad Siglo 21" style="display:block;width:130px;height:47px;border:0;margin:0 auto;">
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:14px 28px 22px;background:${SIGLO_FONDO};">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${SIGLO_SUAVE};">${escapar(cobertura)}</p>
              <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:${SIGLO_SUAVE};">${escapar(pie)}</p>
              ${tipo === 'newsletter' ? `<div style="padding-top:14px;"><a href="${escapar(bajaUrl ?? '')}" style="${BOTON_BAJA}">${BAJA}</a></div>` : ''}
            </td>
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
