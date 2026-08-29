#!/usr/bin/env node
// De donde vienen los leads, en una sola pantalla: los clics a WhatsApp, las
// consultas que entran por formulario y el trafico que llega desde Google.
//
//   npm run leads                # ultimos 14 dias
//   npm run leads -- --dias=30
//
// Existe porque las tres cosas viven en tres paneles distintos y ninguna sola
// contesta la pregunta que importa, que es "por que no me estan llegando
// mensajes". Un clic a WhatsApp no es un mensaje recibido: en escritorio wa.me
// abre WhatsApp Web y el que no tiene la sesion iniciada se queda en la
// pantalla de descarga, asi que el numero que mas se parece a un lead es el de
// los clics desde el movil. Por eso el desglose por dispositivo esta arriba y
// no como un detalle al final.
//
// Las tres fuentes se leen con credenciales que ya estan en la maquina:
//   - Vercel Analytics  el token de la CLI (npx vercel login)
//   - Supabase          EDITOR_DATABASE_URL, el rol acotado cau_editor
//   - Search Console    ~/.gsc/service_account.json, la misma del informe SEO
//
// Si falta alguna, esa seccion sale como no disponible y el resto se muestra
// igual: media respuesta sirve mas que un error. Sale con codigo 1 solo si no
// se pudo leer ninguna de las tres.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import pg from 'pg';
import { acceso as accesoGsc, consultar as consultarGsc } from './gsc.mjs';

const RAIZ = path.resolve(import.meta.dirname, '..');

const args = process.argv.slice(2);
const opcion = (nombre, porDefecto) => {
  const encontrado = args.find(a => a.startsWith(`--${nombre}=`));
  return encontrado ? encontrado.slice(nombre.length + 3) : porDefecto;
};

// La API de Analytics no deja pedir mas de 62 dias con granularidad diaria.
const TOPE_DIAS = 62;
const DIAS = Math.min(Math.max(Number(opcion('dias', '14')) || 14, 1), TOPE_DIAS);
const SITIO = opcion('sitio', 'sc-domain:siglo21sur.com');

// La medicion de clics a WhatsApp se deployo el 17/08/2026 (commit 3063530).
// Antes de esa fecha no hay ceros: hay ausencia de medicion, que en una tabla
// se lee igual de bien y no es lo mismo.
const DESDE_QUE_SE_MIDE = '2026-08-17';

// Search Console consolida con dos o tres dias de atraso, asi que su ventana
// termina antes que la de las otras dos fuentes. Se avisa en el encabezado en
// vez de recortar todo a la fuente mas lenta: los clics de hoy son justamente
// lo que uno viene a mirar.
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

// ── Vercel Analytics ────────────────────────────────────────────────────────

// El token lo deja la CLI al hacer login. Se lee del disco en vez de invocar
// `vercel api` en un subproceso porque la salida de la CLI no siempre es JSON
// pelado -a veces le antepone avisos- y parsearla es fragil.
function tokenVercel() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN;

  const datos = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
  const candidatos = [
    process.env.APPDATA && path.join(process.env.APPDATA, 'com.vercel.cli', 'Data', 'auth.json'),
    path.join(datos, 'com.vercel.cli', 'auth.json'),
  ].filter(Boolean);

  for (const archivo of candidatos) {
    if (!existsSync(archivo)) continue;
    const { token } = JSON.parse(readFileSync(archivo, 'utf8'));
    if (token) return token;
  }
  return null;
}

function idsDelProyecto() {
  const archivo = path.join(RAIZ, '.vercel', 'project.json');
  if (!existsSync(archivo)) return null;
  const { projectId, orgId } = JSON.parse(readFileSync(archivo, 'utf8'));
  return projectId ? { projectId, teamId: orgId } : null;
}

async function analytics(token, ids, recurso, params) {
  const url = new URL(`https://api.vercel.com/v1/query/web-analytics/${recurso}`);
  url.searchParams.set('projectId', ids.projectId);
  if (ids.teamId) url.searchParams.set('teamId', ids.teamId);
  for (const [clave, valor] of Object.entries(params)) url.searchParams.set(clave, valor);

  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`web-analytics ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return (await r.json()).data;
}

async function leerVercel() {
  const token = tokenVercel();
  if (!token) throw new Error('no hay token de la CLI de Vercel. Correr: npx vercel login');

  const ids = idsDelProyecto();
  if (!ids) throw new Error('falta .vercel/project.json. Correr: npx vercel link');

  const ventana = { since: DESDE, until: HASTA };
  const soloWhatsapp = { ...ventana, filter: `eventName eq 'whatsapp'` };

  // El total de personas se pide aparte y no se suma del desglose por
  // dispositivo: quien toca desde el telefono y despues desde la computadora
  // aparece en las dos filas, y sumarlas lo cuenta dos veces.
  const [porDia, porDispositivo, porOrigen, porEvento, visitas, total] = await Promise.all([
    analytics(token, ids, 'events/aggregate', { ...soloWhatsapp, by: 'day', limit: 100 }),
    analytics(token, ids, 'events/aggregate', { ...soloWhatsapp, by: 'deviceType', limit: 10 }),
    analytics(token, ids, 'events/aggregate', { ...soloWhatsapp, by: 'eventData/origen', limit: 8 }),
    analytics(token, ids, 'events/aggregate', { ...ventana, by: 'eventName', limit: 20 }),
    analytics(token, ids, 'visits/count', ventana),
    analytics(token, ids, 'events/count', soloWhatsapp),
  ]);

  return { porDia, porDispositivo, porOrigen, porEvento, visitas, total };
}

// ── Supabase: las consultas que entraron de verdad ──────────────────────────

async function leerConsultas() {
  const cadena = process.env.EDITOR_DATABASE_URL;
  if (!cadena) throw new Error('falta EDITOR_DATABASE_URL en .env.local');

  // Mismo pinchado de CA que db.mjs: el certificado lo firma la PKI propia de
  // Supabase, que no esta en el almacen de Node.
  const CA = new URL('supabase-ca.crt', import.meta.url);
  const ca = existsSync(CA) ? readFileSync(CA, 'utf8') : null;
  if (!ca) avisos.push('TLS sin verificar contra Supabase: falta herramientas/supabase-ca.crt');

  const cliente = new pg.Client({
    connectionString: cadena,
    ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
  });

  await cliente.connect();
  try {
    const { rows } = await cliente.query(
      `select to_char(created_at at time zone 'America/Argentina/Buenos_Aires', 'DD/MM HH24:MI') as cuando,
              coalesce(casa, '-') as casa,
              coalesce(tipo_formulario, '-') as tipo,
              coalesce(carrera, '-') as carrera
         from consultas
        where created_at >= now() - ($1 || ' days')::interval
        order by created_at desc`,
      [String(DIAS)],
    );
    return rows;
  } finally {
    await cliente.end();
  }
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

// Las tres en paralelo: son tres servicios distintos y ninguna depende de otra.
// El error se guarda como valor en vez de cortar, para que la caida de una no
// se lleve puestas las otras dos.
const [vercel, consultas, google] = await Promise.all([
  leerVercel().then(d => (fuentesLeidas.push('vercel'), d), e => e),
  leerConsultas().then(d => (fuentesLeidas.push('supabase'), d), e => e),
  leerGoogle().then(d => (fuentesLeidas.push('gsc'), d), e => e),
]);

// ── 1. Clics a WhatsApp ─────────────────────────────────────────────────────

titulo('Clics a WhatsApp', 'Vercel Analytics, en vivo');

let personasWhatsapp = null;
let personasMovil = null;

if (vercel instanceof Error) {
  noDisponible(vercel);
} else {
  if (DESDE < DESDE_QUE_SE_MIDE) {
    console.log(`  Ojo: los clics se miden desde el ${dm(DESDE_QUE_SE_MIDE)}. Los dias anteriores`);
    console.log('  figuran en cero porque no habia medicion, no porque nadie haya tocado.\n');
  }

  const dias = vercel.porDia.map(d => ({
    dia: iso(new Date(d.timestamp)),
    clics: d.count,
    personas: d.visitors,
  }));
  const pico = Math.max(1, ...dias.map(d => d.clics));

  console.log('   dia    clics  personas');
  for (const d of dias) {
    const barra = '#'.repeat(Math.round((d.clics / pico) * 20));
    console.log(
      `  ${dm(d.dia)}  ${String(d.clics).padStart(5)}  ${String(d.personas).padStart(8)}  ${barra}`.trimEnd(),
    );
  }

  personasWhatsapp = vercel.total.visitors;
  console.log(`  Total  ${plural(vercel.total.count, 'clic', 'clics')} de ${plural(personasWhatsapp, 'persona', 'personas')}`);

  console.log('\n  Por dispositivo');
  for (const d of vercel.porDispositivo) {
    const etiqueta = { mobile: 'movil', desktop: 'escritorio', tablet: 'tablet' }[d.deviceType] ?? d.deviceType;
    console.log(`    ${etiqueta.padEnd(12)}${String(d.count).padStart(3)} clics de ${plural(d.visitors, 'persona', 'personas')}`);
    if (d.deviceType === 'mobile') personasMovil = d.visitors;
  }
  console.log('    El escritorio abre WhatsApp Web y el que no tiene la sesion iniciada se');
  console.log('    queda ahi: el numero que predice mensajes recibidos es el del movil.');

  if (vercel.porOrigen.length) {
    console.log('\n  Desde que paginas');
    // La API agrupa en "Others" todo lo que no entra en el limite y lo devuelve
    // mezclado con el resto. Ordenar de mayor a menor y mandarlo al final, con
    // nombre en castellano, para que no parezca una pagina mas.
    const ordenadas = [...vercel.porOrigen].sort((a, b) => {
      const otras = (o) => (o['eventData/origen'] === 'Others' ? 1 : 0);
      return otras(a) - otras(b) || b.count - a.count;
    });
    for (const o of ordenadas) {
      const origen = o['eventData/origen'];
      const nombre = origen === 'Others' ? 'el resto de las paginas, sueltas' : origen;
      console.log(`    ${String(o.count).padStart(3)}  ${nombre}`);
    }
  }
}

// ── 2. Consultas del formulario ─────────────────────────────────────────────

titulo('Consultas del formulario', 'Supabase, en vivo');

if (consultas instanceof Error) {
  noDisponible(consultas);
} else if (consultas.length === 0) {
  console.log('  Ninguna en la ventana.');
} else {
  for (const c of consultas) {
    console.log(`  ${c.cuando}  ${c.casa.padEnd(10)}${c.tipo.padEnd(16)}${c.carrera}`);
  }
  console.log(`  Total  ${plural(consultas.length, 'consulta', 'consultas')}`);
}

// El evento `consulta` se dispara recien cuando el POST respondio ok, asi que
// deberia haber uno por fila. Sobrar eventos es la senal de que hubo envios que
// el visitante dio por buenos y no llegaron a la tabla.
//
// No es prueba de nada por si solo, y por eso el aviso enumera las otras dos
// explicaciones: las filas de prueba se borran a mano (para eso cau_editor tiene
// DELETE sobre consultas) y los dos lados no cortan la ventana igual -Vercel
// agrupa por dia UTC y la tabla por timestamp-, asi que un envio de la nochecita
// puede caer de distinto lado del borde.
if (!(vercel instanceof Error) && !(consultas instanceof Error)) {
  const medidos = vercel.porEvento.find(e => e.eventName === 'consulta')?.count ?? 0;
  if (medidos !== consultas.length) {
    avisos.push(
      `Vercel midio ${medidos} envio(s) del formulario y en la tabla hay ${consultas.length}. `
      + 'Puede ser una fila de prueba borrada, o un envio en el borde de la ventana. '
      + 'Si no es ninguna de las dos, hubo envios que no se guardaron.',
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

if (!(vercel instanceof Error)) {
  titulo('Embudo', `${dm(DESDE)} al ${dm(HASTA)}`);
  const visitantes = vercel.visitas?.visitors ?? 0;
  const fila = (n, texto) => console.log(`  ${String(num(n)).padStart(6)}  ${texto}`);

  fila(visitantes, 'personas entraron al sitio');
  if (personasWhatsapp !== null) {
    fila(personasWhatsapp, `tocaron el boton de WhatsApp  (${pct(personasWhatsapp, visitantes)})`);
  }
  if (personasMovil !== null) fila(personasMovil, 'de esas, desde el movil');
  if (!(consultas instanceof Error)) {
    fila(consultas.length, `dejaron el formulario  (${pct(consultas.length, visitantes)})`);
  }
}

// ── Cierre ──────────────────────────────────────────────────────────────────

for (const aviso of avisos) console.log(`\nAviso: ${aviso}`);

if (fuentesLeidas.length === 0) {
  console.log('\nNo se pudo leer ninguna de las tres fuentes.');
  process.exit(1);
}
