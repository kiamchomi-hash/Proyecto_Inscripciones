#!/usr/bin/env node
// De donde vienen los leads, en una sola pantalla: los clics a WhatsApp, las
// consultas que entran por formulario y el trafico que llega desde Google.
//
//   npm run leads                # ultimos 14 dias
//   npm run leads -- --dias=30
//
// Existe porque las tres cosas viven en tres lugares distintos y ninguno solo
// contesta la pregunta que importa, que es "por que no me estan llegando
// mensajes". Un clic a WhatsApp no es un mensaje recibido: en escritorio wa.me
// abre WhatsApp Web y el que no tiene la sesion iniciada se queda en la
// pantalla de descarga, asi que el numero que mas se parece a un lead es el de
// los clics desde el movil. Por eso el desglose por dispositivo esta arriba y
// no como un detalle al final.
//
// Desde el corte a Cloudflare (27/10/2026) las fuentes son tres:
//   - Clics a WhatsApp  D1 de produccion, tabla `whatsapp_clicks`
//   - Consultas         D1 de produccion, tabla `consultas`
//   - Search Console    ~/.gsc/service_account.json, la misma del informe SEO
//
// Las visitas del sitio salen de Cloudflare Web Analytics y necesitan un token
// con permiso de lectura de analitica en `.env.local`; sin el, esa linea no se
// muestra y el resto funciona igual. Vercel Analytics se dio de baja con el
// corte: el sitio ya no pasa por Vercel y sus eventos no existen mas.
//
// Si falta alguna fuente, esa seccion sale como no disponible y el resto se
// muestra igual: media respuesta sirve mas que un error. Sale con codigo 1 solo
// si no se pudo leer la base ni Search Console.

import { consultar } from './d1-consulta.mjs';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { acceso as accesoGsc, consultar as consultarGsc } from './gsc.mjs';

const RAIZ = path.resolve(import.meta.dirname, '..');

const args = process.argv.slice(2);
const opcion = (nombre, porDefecto) => {
  const encontrado = args.find(a => a.startsWith(`--${nombre}=`));
  return encontrado ? encontrado.slice(nombre.length + 3) : porDefecto;
};

const TOPE_DIAS = 62;
const DIAS = Math.min(Math.max(Number(opcion('dias', '14')) || 14, 1), TOPE_DIAS);
const SITIO = opcion('sitio', 'sc-domain:siglo21sur.com');

// Los clics se empezaron a guardar en D1 con el corte. Antes de esa fecha no
// hay ceros: hay ausencia de medicion, que en una tabla se lee igual de bien y
// no es lo mismo.
const DESDE_QUE_SE_MIDE = '2026-10-27';

// Search Console consolida con dos o tres dias de atraso, asi que su ventana
// termina antes que la de las otras fuentes. Se avisa en el encabezado en vez
// de recortar todo a la fuente mas lenta: los clics de hoy son justamente lo
// que uno viene a mirar.
const RETRASO_GSC = 3;

const iso = (d) => d.toISOString().slice(0, 10);
const hace = (dias) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - dias);
  return d;
};
const dm = (fechaIso) => `${fechaIso.slice(8, 10)}/${fechaIso.slice(5, 7)}`;

const DESDE = iso(hace(DIAS - 1));
const HASTA = iso(hace(0));
const GSC_HASTA = iso(hace(RETRASO_GSC));
const GSC_DESDE = iso(hace(RETRASO_GSC + DIAS - 1));
const GSC_PREVIO_HASTA = iso(hace(RETRASO_GSC + DIAS));
const GSC_PREVIO_DESDE = iso(hace(RETRASO_GSC + DIAS * 2 - 1));

const num = (n) => Number(n).toLocaleString('es-AR');
const dec = (n, d = 1) =>
  Number(n).toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (parte, total) => (total > 0 ? `${dec((parte / total) * 100, 1)}%` : 'n/d');
const plural = (n, singular, prural) => `${num(n)} ${n === 1 ? singular : prural}`;

const fuentesLeidas = [];
const avisos = [];

// ── D1: los clics a WhatsApp ────────────────────────────────────────────────

async function leerClicksWhatsapp() {
  return consultar(`SELECT fecha, origen, movil, clicks
    FROM whatsapp_clicks
    WHERE fecha BETWEEN '${DESDE}' AND '${HASTA}'
    ORDER BY fecha, clicks DESC`);
}

// ── D1: las consultas que entraron de verdad ────────────────────────────────

async function leerConsultas() {
  return consultar(`SELECT strftime('%d/%m %H:%M', created_at, '-3 hours') AS cuando,
      date(created_at, '-3 hours') AS dia_utc,
      coalesce(casa, '-') AS casa,
      coalesce(tipo_formulario, '-') AS tipo,
      coalesce(carrera, '-') AS carrera
    FROM consultas
    WHERE date(created_at, '-3 hours') BETWEEN '${DESDE}' AND '${HASTA}'
    ORDER BY created_at DESC`);
}

/**
 * Una consulta guardada tiene que dejar un aviso en el outbox. Es el reemplazo
 * de la conciliacion contra Analytics: si hay mas filas que avisos, hubo
 * envios que se guardaron sin notificar (o el barrido los salteo).
 */
async function leerAvisos() {
  const [fila] = consultar(`SELECT count(*) AS n FROM outbox
    WHERE tipo = 'aviso-lead'
      AND date(created_at, '-3 hours') BETWEEN '${DESDE}' AND '${HASTA}'`);
  return fila?.n ?? 0;
}

// ── Cloudflare Web Analytics: las visitas del sitio ─────────────────────────

const CONFIG_PRODUCCION = path.join(RAIZ, 'cloudflare', 'produccion', 'wrangler.json');
const URL_GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql';

function configAnalytics() {
  if (!existsSync(CONFIG_PRODUCCION)) return null;
  const config = JSON.parse(readFileSync(CONFIG_PRODUCCION, 'utf8'));
  const cuenta = config.vars?.CF_ACCOUNT_TAG;
  const sitio = config.vars?.CF_RUM_SITE_TAG;
  return cuenta && sitio ? { cuenta, sitio } : null;
}

/** El token nunca se imprime: solo se informa si esta o no. */
function tokenAnalytics() {
  for (const clave of ['CF_ANALYTICS_TOKEN', 'CLOUDFLARE_API_TOKEN']) {
    if (process.env[clave]) return process.env[clave];
  }
  const archivo = path.join(RAIZ, '.env.local');
  if (!existsSync(archivo)) return null;
  const linea = readFileSync(archivo, 'utf8').split(/\r?\n/)
    .find(fila => /^\s*(?:export\s+)?(?:CF_ANALYTICS_TOKEN|CLOUDFLARE_API_TOKEN)\s*=/.test(fila));
  if (!linea) return null;
  const valor = linea.slice(linea.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
  return valor || null;
}

const CONSULTA_VISITAS = `query Visitas($cuenta: String!, $sitio: String!, $desde: Date!, $hasta: Date!) {
  viewer { accounts(filter: { accountTag: $cuenta }) {
    rumPageloadEventsAdaptiveGroups(limit: 200, filter: { siteTag: $sitio, date_geq: $desde, date_leq: $hasta },
      orderBy: [date_ASC]) {
      count
      sum { visits }
      dimensions { date }
    }
  } }
}`;

async function leerVisitas() {
  const config = configAnalytics();
  if (!config) throw new Error('falta cloudflare/produccion/wrangler.json con CF_ACCOUNT_TAG y CF_RUM_SITE_TAG');
  const token = tokenAnalytics();
  if (!token) throw new Error('sin CF_ANALYTICS_TOKEN en .env.local (lectura de analitica de Cloudflare)');

  const respuesta = await fetch(URL_GRAPHQL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: CONSULTA_VISITAS,
      variables: { cuenta: config.cuenta, sitio: config.sitio, desde: DESDE, hasta: HASTA },
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!respuesta.ok) throw new Error(`graphql ${respuesta.status}`);

  const cuerpo = await respuesta.json();
  const grupos = cuerpo?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups;
  if (!Array.isArray(grupos)) {
    const detalle = cuerpo?.errors?.[0]?.message ?? 'respuesta sin datos';
    throw new Error(detalle.slice(0, 120));
  }
  const porDia = grupos.map(g => ({ dia: g.dimensions.date, visitas: g.sum?.visits ?? 0 }));
  return { porDia, total: porDia.reduce((a, d) => a + d.visitas, 0) };
}

// ── Search Console ──────────────────────────────────────────────────────────

async function leerGoogle() {
  const token = await accesoGsc();
  const [actual, previo, paginas] = await Promise.all([
    consultarGsc(token, SITIO, { startDate: GSC_DESDE, endDate: GSC_HASTA }),
    consultarGsc(token, SITIO, { startDate: GSC_PREVIO_DESDE, endDate: GSC_PREVIO_HASTA }),
    consultarGsc(token, SITIO, {
      startDate: GSC_DESDE, endDate: GSC_HASTA, dimensions: ['page'], rowLimit: 5,
    }),
  ]);
  return { actual: actual[0] ?? null, previo: previo[0] ?? null, paginas };
}

// ── Informe ─────────────────────────────────────────────────────────────────

const titulo = (texto, nota) => {
  console.log(`\n${texto}`);
  if (nota) console.log(`  [${nota}]`);
};

const noDisponible = (error) => console.log(`  no disponible: ${error.message}`);

console.log(`LEADS - ultimos ${DIAS} dias (${dm(DESDE)} al ${dm(HASTA)})`);

// Cada fuente se lee aparte: son tres servicios distintos y ninguno depende de
// otro. El error se guarda como valor en vez de cortar, para que la caida de
// uno no se lleve puestos los otros.
const [clicks, avisosLeidos, consultas, visitas, google] = await Promise.all([
  leerClicksWhatsapp().then(d => (fuentesLeidas.push('d1'), d), e => e),
  leerAvisos().catch(e => e),
  leerConsultas().catch(e => e),
  leerVisitas().then(d => (fuentesLeidas.push('cloudflare'), d), e => e),
  leerGoogle().then(d => (fuentesLeidas.push('gsc'), d), e => e),
]);

// ── 1. Clics a WhatsApp ─────────────────────────────────────────────────────

titulo('Clics a WhatsApp', 'D1, en vivo');

let clicksTotal = null;
let clicksMovil = null;

if (clicks instanceof Error) {
  noDisponible(clicks);
} else if (clicks.length === 0) {
  console.log('  Ninguno en la ventana.');
  if (DESDE < DESDE_QUE_SE_MIDE) {
    console.log(`  Ojo: los clics se guardan desde el ${dm(DESDE_QUE_SE_MIDE)}, el dia del corte.`);
    console.log('  Los dias anteriores figuran vacios porque no habia medicion.');
  }
} else {
  if (DESDE < DESDE_QUE_SE_MIDE) {
    console.log(`  Ojo: los clics se guardan desde el ${dm(DESDE_QUE_SE_MIDE)}, el dia del corte.`);
    console.log('  Los dias anteriores figuran en cero porque no habia medicion, no porque nadie haya tocado.\n');
  }

  const porDia = new Map();
  for (const fila of clicks) {
    const dia = porDia.get(fila.fecha) ?? { movil: 0, escritorio: 0 };
    if (fila.movil === 1) dia.movil += fila.clicks;
    else dia.escritorio += fila.clicks;
    porDia.set(fila.fecha, dia);
  }
  const dias = [...porDia.entries()]
    .map(([dia, d]) => ({ dia, clics: d.movil + d.escritorio, movil: d.movil, escritorio: d.escritorio }))
    .sort((a, b) => a.dia.localeCompare(b.dia));

  const pico = Math.max(1, ...dias.map(d => d.clics));
  console.log('   dia    clics  movil  escritorio');
  for (const d of dias) {
    const barra = '#'.repeat(Math.round((d.clics / pico) * 20));
    console.log(`  ${dm(d.dia)}  ${String(d.clics).padStart(5)}  ${String(d.movil).padStart(5)}  ${String(d.escritorio).padStart(10)}  ${barra}`.trimEnd());
  }

  clicksTotal = dias.reduce((a, d) => a + d.clics, 0);
  clicksMovil = dias.reduce((a, d) => a + d.movil, 0);
  console.log(`  Total  ${plural(clicksTotal, 'clic', 'clics')}, ${plural(clicksMovil, 'desde el movil', 'desde el movil')}`);

  const porOrigen = new Map();
  for (const fila of clicks) porOrigen.set(fila.origen, (porOrigen.get(fila.origen) ?? 0) + fila.clicks);
  console.log('\n  Desde que paginas');
  for (const [origen, n] of [...porOrigen].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
    console.log(`    ${String(n).padStart(3)}  ${origen}`);
  }
  console.log('  El escritorio abre WhatsApp Web y el que no tiene la sesion iniciada se');
  console.log('  queda ahi: el numero que predice mensajes recibidos es el del movil.');
}

// ── 2. Consultas del formulario ─────────────────────────────────────────────

titulo('Consultas del formulario', 'D1, en vivo');

if (consultas instanceof Error) {
  noDisponible(consultas);
} else if (consultas.length === 0) {
  console.log('  Ninguna en la ventana.');
} else {
  for (const c of consultas) {
    console.log(`  ${c.cuando}  ${c.casa.padEnd(10)}${c.tipo.padEnd(16)}${c.carrera}`);
  }
  console.log(`  Total  ${plural(consultas.length, 'consulta', 'consultas')}`);

  // Cada consulta guardada deja un aviso en el outbox. Si sobran filas, hubo
  // envios que entraron sin notificar: se guardaron pero nadie se entero.
  if (!(avisosLeidos instanceof Error) && avisosLeidos !== consultas.length) {
    console.log(`  Avisos generados: ${avisosLeidos}. La diferencia es un envio que no notifico.`);
    avisos.push(
      `Hay ${consultas.length} consulta(s) guardada(s) y ${avisosLeidos} aviso(s) en el outbox. `
      + 'Una fila sin aviso se guardo pero no se notifico; revisar el barrido del outbox.',
    );
  }
}

// ── 3. Trafico desde Google ─────────────────────────────────────────────────

titulo(
  'Trafico desde Google',
  `Search Console, ${dm(GSC_DESDE)} al ${dm(GSC_HASTA)}: consolida con ${RETRASO_GSC} dias de atraso`,
);

if (google instanceof Error) {
  noDisponible(google);
} else if (!google.actual) {
  console.log('  Sin datos en la ventana.');
} else {
  const { actual: a, previo: p } = google;
  const variacion = (ahora, antes) => {
    if (!antes) return '';
    const cambio = ((ahora - antes) / antes) * 100;
    return `  (antes ${num(Math.round(antes))}, ${cambio >= 0 ? '+' : ''}${dec(cambio, 0)}%)`;
  };

  console.log(`  clics          ${String(num(a.clicks)).padStart(7)}${variacion(a.clicks, p?.clicks)}`);
  console.log(`  impresiones    ${String(num(a.impressions)).padStart(7)}${variacion(a.impressions, p?.impressions)}`);
  console.log(`  posicion media ${String(dec(a.position, 1)).padStart(7)}${p ? `  (antes ${dec(p.position, 1)})` : ''}`);

  if (google.paginas.length) {
    console.log('\n  Paginas que mas clics traen');
    for (const fila of google.paginas) {
      console.log(`    ${String(fila.clicks).padStart(3)}  ${new URL(fila.keys[0]).pathname}`);
    }
  }
}

// ── 4. El embudo ────────────────────────────────────────────────────────────

titulo('Embudo', `${dm(DESDE)} al ${dm(HASTA)}`);

const visitantes = visitas instanceof Error ? null : visitas.total;
const fila = (n, texto) => console.log(`  ${String(num(n)).padStart(6)}  ${texto}`);

if (visitantes !== null) fila(visitantes, 'personas entraron al sitio');
else console.log('        -  visitas del sitio: no disponible (falta el token de Cloudflare)');
if (clicksTotal !== null) {
  fila(clicksTotal, `tocaron el boton de WhatsApp${visitantes ? `  (${pct(clicksTotal, visitantes)})` : ''}`);
}
if (clicksMovil !== null) fila(clicksMovil, 'de esos clics, desde el movil');
if (!(consultas instanceof Error)) {
  fila(consultas.length, `dejaron el formulario${visitantes ? `  (${pct(consultas.length, visitantes)})` : ''}`);
}

// ── Cierre ──────────────────────────────────────────────────────────────────

for (const aviso of avisos) console.log(`\nAviso: ${aviso}`);

if (!(clicks instanceof Error) && visitas instanceof Error) {
  console.log(`\nNota: las visitas salen de Cloudflare Web Analytics; ${visitas.message}.`);
  console.log('Se cargan una vez: CF_ANALYTICS_TOKEN=... en .env.local (permiso de lectura de analitica).');
}

if (fuentesLeidas.length === 0) {
  console.log('\nNo se pudo leer ninguna fuente.');
  process.exit(1);
}
// En una auditoria la falta de una fuente o una discrepancia no puede dar verde.
if (args.includes('--estricto')) {
  const base = fuentesLeidas.includes('d1') && fuentesLeidas.includes('gsc');
  if (!base) process.exitCode = 2;
  else if (avisos.length > 0) process.exitCode = 1;
}
