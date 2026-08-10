#!/usr/bin/env node
// Informe semanal de SEO: baja los datos de Search Console, los cruza con el
// sitemap y con la oferta real de Supabase, y deja un .md con los hallazgos
// duros. No propone nada — eso es criterio y lo pone el agente `estratega-seo`,
// que lee este informe cuando se lo invoca a mano.
//
//   npm run seo                # 28 dias contra los 28 anteriores
//   npm run seo -- --rapido    # saltea la inspeccion URL por URL (la parte lenta)
//   npm run seo -- --dias=7
//
// La separacion es la misma que en vigilancia.mjs: bajar y contar sale gratis
// porque no llama a ningun modelo; interpretar es lo que cuesta.
//
// Autentica con la service account de ~/.gsc/service_account.json (la misma que
// usa el MCP gsc) firmando un JWT a mano. La API de Search Console es REST
// plana, asi que no hace falta el SDK de Google ni ninguna dependencia nueva.

import { createSign } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const RAIZ = path.resolve(import.meta.dirname, '..');
const LOGS = path.join(RAIZ, 'herramientas', 'vigilancia-logs');
const ESTADO = path.join(LOGS, 'seo-estado.json');
const ULTIMO = path.join(LOGS, 'seo-ultimo.md');
const CREDENCIAL = path.join(os.homedir(), '.gsc', 'service_account.json');

const args = process.argv.slice(2);
const opcion = (nombre, porDefecto) => {
  const encontrado = args.find(a => a.startsWith(`--${nombre}=`));
  return encontrado ? encontrado.slice(nombre.length + 3) : porDefecto;
};
const RAPIDO = args.includes('--rapido');
const DIAS = Number(opcion('dias', '28'));
const SITIO = opcion('sitio', 'sc-domain:siglo21sur.com');
const BASE = opcion('base', 'https://www.siglo21sur.com');

// Search Console consolida con dos o tres dias de atraso. Si la ventana llega
// hasta hoy, los ultimos dias entran a medias y toda comparacion contra el
// periodo anterior exagera la caida.
const RETRASO_DIAS = 3;

const problemas = [];
const sugerencias = [];
const contexto = [];

const problema = (grupo, detalle) => problemas.push({ grupo, detalle });
const sugerencia = (grupo, detalle) => sugerencias.push({ grupo, detalle });

// ── Fechas ──────────────────────────────────────────────────────────────────

const iso = (d) => d.toISOString().slice(0, 10);
const hace = (dias) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - dias);
  return d;
};

const finActual = hace(RETRASO_DIAS);
const inicioActual = hace(RETRASO_DIAS + DIAS - 1);
const finPrevio = hace(RETRASO_DIAS + DIAS);
const inicioPrevio = hace(RETRASO_DIAS + DIAS * 2 - 1);

const PERIODO_ACTUAL = { startDate: iso(inicioActual), endDate: iso(finActual) };
const PERIODO_PREVIO = { startDate: iso(inicioPrevio), endDate: iso(finPrevio) };

// ── Autenticacion ───────────────────────────────────────────────────────────

async function token() {
  if (!existsSync(CREDENCIAL)) {
    console.error(`No esta la credencial de Search Console: ${CREDENCIAL}`);
    console.error('Traerla con: node herramientas/entorno.mjs importar --desde=<paquete>');
    process.exit(2);
  }

  const cred = JSON.parse(readFileSync(CREDENCIAL, 'utf8'));
  const ahora = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');

  const sinFirmar = [
    b64({ alg: 'RS256', typ: 'JWT' }),
    b64({
      iss: cred.client_email,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: ahora,
      exp: ahora + 3600,
    }),
  ].join('.');

  const firma = createSign('RSA-SHA256').update(sinFirmar).sign(cred.private_key, 'base64url');

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${sinFirmar}.${firma}`,
    }),
  });

  if (!r.ok) {
    console.error(`No se pudo autenticar contra Google (${r.status}): ${await r.text()}`);
    process.exit(2);
  }
  return (await r.json()).access_token;
}

// ── API de Search Console ───────────────────────────────────────────────────

let ACCESO = null;

async function consultar(cuerpo) {
  const sitio = encodeURIComponent(SITIO);
  const r = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${sitio}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${ACCESO}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cuerpo, dataState: 'final' }),
    },
  );
  if (!r.ok) throw new Error(`searchAnalytics ${r.status}: ${await r.text()}`);
  return (await r.json()).rows ?? [];
}

async function inspeccionar(url) {
  const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ACCESO}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspectionUrl: url, siteUrl: SITIO, languageCode: 'es-AR' }),
  });
  if (!r.ok) return { url, error: `${r.status}` };
  const idx = (await r.json())?.inspectionResult?.indexStatusResult ?? {};
  return {
    url,
    verdict: idx.verdict ?? 'DESCONOCIDO',
    estado: idx.coverageState ?? '—',
    rastreo: idx.lastCrawlTime ? idx.lastCrawlTime.slice(0, 10) : null,
    robots: idx.robotsTxtState ?? null,
    canonicaGoogle: idx.googleCanonical ?? null,
  };
}

// De a cinco: la cuota son 600 inspecciones por minuto y ~115 URLs entran
// comodas, pero de a una sola el barrido tarda varios minutos.
async function enTanda(items, tamano, fn) {
  const salida = [];
  for (let i = 0; i < items.length; i += tamano) {
    salida.push(...await Promise.all(items.slice(i, i + tamano).map(fn)));
  }
  return salida;
}

// ── Oferta real (para no reportar carreras dadas de baja) ───────────────────

// Las carreras que salieron de la oferta siguen recibiendo trafico y redirigen
// a la home. Eso esta bien y no es un problema, pero si no se filtran copan el
// informe: hoy la pagina con mas clics del sitio es una de esas.
async function slugsDeLaOferta() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    contexto.push('Sin credenciales de Supabase: no se pudo separar la oferta vigente de las carreras dadas de baja.');
    return null;
  }

  const { createClient } = await import('@supabase/supabase-js');
  const { carreraToSlug, esCarreraVisible } = await import('../components/index/types.ts');
  const supabase = createClient(url, anonKey);

  const { data, error } = await supabase
    .from('carreras')
    .select('id, nombre, prefix, nivel, activa, proximamente')
    .eq('activa', true);

  if (error) {
    contexto.push(`No se pudo leer carreras de Supabase: ${error.message}`);
    return null;
  }
  return new Set(data.filter(esCarreraVisible).map(carreraToSlug));
}

async function urlsDelSitemap() {
  const r = await fetch(`${BASE}/sitemap.xml`);
  if (!r.ok) {
    contexto.push(`No se pudo leer el sitemap (${r.status}).`);
    return [];
  }
  const xml = await r.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
}

// ── Criterio numerico ───────────────────────────────────────────────────────

// CTR que se espera por posicion en una busqueda informativa. No es una ley:
// sirve para ordenar cual pagina rinde peor de lo que su posicion permitiria,
// que es distinto de "cual tiene el CTR mas bajo" (las posiciones malas siempre
// tendrian el CTR mas bajo y no habria nada que hacer al respecto).
const CURVA_CTR = [null, 0.28, 0.15, 0.10, 0.07, 0.053, 0.042, 0.034, 0.028, 0.024, 0.021];

function ctrEsperado(pos) {
  if (pos <= 1) return CURVA_CTR[1];
  if (pos <= 10) {
    const bajo = Math.floor(pos);
    const alto = Math.min(10, bajo + 1);
    const t = pos - bajo;
    return CURVA_CTR[bajo] * (1 - t) + CURVA_CTR[alto] * t;
  }
  if (pos <= 20) return Math.max(0.010, 0.021 - (pos - 10) * 0.0011);
  return 0.006;
}

const rutaDe = (url) => { try { return new URL(url).pathname; } catch { return url; } };
const slugCarrera = (ruta) => ruta.startsWith('/carreras/') ? ruta.slice('/carreras/'.length) : null;
const pct = (n) => `${(n * 100).toFixed(1)}%`;

// ── Informe ─────────────────────────────────────────────────────────────────

function bloque(titulo, lista) {
  if (!lista.length) return '';
  const grupos = new Map();
  for (const { grupo, detalle } of lista) {
    if (!grupos.has(grupo)) grupos.set(grupo, []);
    grupos.get(grupo).push(detalle);
  }
  const partes = [`## ${titulo}`, ''];
  for (const [grupo, detalles] of grupos) {
    partes.push(`### ${grupo}`, '');
    for (const d of detalles) partes.push(`- ${d}`);
    partes.push('');
  }
  return partes.join('\n');
}

async function main() {
  mkdirSync(LOGS, { recursive: true });
  ACCESO = await token();

  // ── Totales y tendencia ───────────────────────────────────────────────────

  const [totalAhora] = await consultar({ ...PERIODO_ACTUAL, dimensions: [] });
  const [totalAntes] = await consultar({ ...PERIODO_PREVIO, dimensions: [] });

  const clicsAhora = totalAhora?.clicks ?? 0;
  const clicsAntes = totalAntes?.clicks ?? 0;
  const imprAhora = totalAhora?.impressions ?? 0;
  const imprAntes = totalAntes?.impressions ?? 0;
  const variacion = clicsAntes ? (clicsAhora - clicsAntes) / clicsAntes : null;

  contexto.push(
    `Periodo ${PERIODO_ACTUAL.startDate} → ${PERIODO_ACTUAL.endDate} contra ${PERIODO_PREVIO.startDate} → ${PERIODO_PREVIO.endDate}.`,
    `Clics ${clicsAhora} (antes ${clicsAntes}${variacion === null ? '' : `, ${variacion >= 0 ? '+' : ''}${pct(variacion)}`}) · ` +
    `impresiones ${imprAhora} (antes ${imprAntes}) · ` +
    `CTR ${pct(totalAhora?.ctr ?? 0)} · posicion ${(totalAhora?.position ?? 0).toFixed(1)}.`,
  );

  // Una caida fuerte de clics con el trafico ya asentado es de las pocas cosas
  // que ameritan mirar el sitio hoy y no la semana que viene.
  if (variacion !== null && clicsAntes >= 50 && variacion <= -0.4) {
    problema('Caida de trafico', `los clics bajaron ${pct(Math.abs(variacion))} contra el periodo anterior (${clicsAntes} → ${clicsAhora}).`);
  }

  // ── Paginas ───────────────────────────────────────────────────────────────

  const oferta = await slugsDeLaOferta();
  const paginasAhora = await consultar({ ...PERIODO_ACTUAL, dimensions: ['page'], rowLimit: 500 });
  const paginasAntes = await consultar({ ...PERIODO_PREVIO, dimensions: ['page'], rowLimit: 500 });
  const antesPorRuta = new Map(paginasAntes.map(r => [rutaDe(r.keys[0]), r]));

  const vigentes = [];
  const fueraDeOferta = [];
  for (const fila of paginasAhora) {
    const ruta = rutaDe(fila.keys[0]);
    const slug = slugCarrera(ruta);
    const esBaja = oferta && slug !== null && !oferta.has(slug);
    (esBaja ? fueraDeOferta : vigentes).push({ ...fila, ruta });
  }

  if (fueraDeOferta.length) {
    const clics = fueraDeOferta.reduce((a, f) => a + f.clicks, 0);
    const top = [...fueraDeOferta].sort((a, b) => b.clicks - a.clicks).slice(0, 5);
    contexto.push(
      `${fueraDeOferta.length} paginas de carreras fuera de la oferta juntaron ${clics} clics y redirigen a la home. ` +
      `Quedan afuera del informe a proposito. Las de mas trafico: ${top.map(f => `${f.ruta} (${f.clicks})`).join(', ')}.`,
    );
  }

  // Rinde por debajo de lo que su posicion permitiria: son las que ya estan
  // arriba y no se hacen clic, o sea titulo y descripcion, no contenido.
  const flojas = vigentes
    .filter(f => f.impressions >= 150 && f.ctr < ctrEsperado(f.position) * 0.5)
    .sort((a, b) => (ctrEsperado(b.position) - b.ctr) * b.impressions - (ctrEsperado(a.position) - a.ctr) * a.impressions)
    .slice(0, 10);

  for (const f of flojas) {
    const perdidos = Math.round((ctrEsperado(f.position) - f.ctr) * f.impressions);
    sugerencia(
      'CTR por debajo de lo esperado para su posicion (titulo y descripcion)',
      `\`${f.ruta}\` — ${f.impressions} impresiones, ${f.clicks} clics (${pct(f.ctr)}) en posicion ${f.position.toFixed(1)}; ` +
      `lo esperable seria ~${pct(ctrEsperado(f.position))}, o sea unos ${perdidos} clics mas.`,
    );
  }

  // Perdio posicion contra el periodo anterior.
  const caidas = vigentes
    .map(f => {
      const antes = antesPorRuta.get(f.ruta);
      if (!antes || antes.impressions < 50) return null;
      return { ...f, antes: antes.position, delta: f.position - antes.position };
    })
    .filter(f => f && f.delta >= 2)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 10);

  for (const f of caidas) {
    const detalle = `\`${f.ruta}\` — posicion ${f.antes.toFixed(1)} → ${f.position.toFixed(1)} (${f.delta.toFixed(1)} peor), ${f.impressions} impresiones.`;
    (f.delta >= 5 && f.impressions >= 100 ? problema : sugerencia)('Paginas que perdieron posicion', detalle);
  }

  // ── Consultas al borde ────────────────────────────────────────────────────

  // Se piden con la pagina al lado, no sueltas: saber que consulta cae en que
  // pagina es lo que hace accionable el dato, y ademas permite descartar las
  // que caen en carreras dadas de baja.
  const consultas = await consultar({ ...PERIODO_ACTUAL, dimensions: ['query', 'page'], rowLimit: 500 });

  // Entre la 4 y la 15 esta lo unico que se mueve con trabajo de pagina: mas
  // arriba ya se gano y mas abajo hace falta otra cosa (enlaces, tiempo).
  const alBorde = consultas
    .map(q => ({ ...q, consulta: q.keys[0], ruta: rutaDe(q.keys[1]) }))
    .filter(q => {
      const slug = slugCarrera(q.ruta);
      if (oferta && slug !== null && !oferta.has(slug)) return false;
      return q.position >= 4 && q.position <= 15 && q.impressions >= 25;
    })
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);

  for (const q of alBorde) {
    sugerencia(
      'Consultas cerca de los primeros lugares',
      `"${q.consulta}" — posicion ${q.position.toFixed(1)}, ${q.impressions} impresiones, ${q.clicks} clics → \`${q.ruta}\``,
    );
  }

  // ── Indexacion ────────────────────────────────────────────────────────────

  const estadoPrevio = existsSync(ESTADO) ? JSON.parse(readFileSync(ESTADO, 'utf8')) : {};
  let estadoNuevo = estadoPrevio;

  if (RAPIDO) {
    contexto.push('Inspeccion de indexacion salteada (--rapido).');
  } else {
    const urls = await urlsDelSitemap();
    if (urls.length) {
      const inspecciones = await enTanda(urls, 5, inspeccionar);
      estadoNuevo = {};
      let indexadas = 0;

      for (const i of inspecciones) {
        if (i.error) {
          contexto.push(`No se pudo inspeccionar ${i.url} (${i.error}).`);
          estadoNuevo[i.url] = estadoPrevio[i.url];
          continue;
        }
        const ok = i.verdict === 'PASS';
        if (ok) indexadas++;
        estadoNuevo[i.url] = { verdict: i.verdict, estado: i.estado, rastreo: i.rastreo };

        const ruta = rutaDe(i.url);
        // Que una pagina nueva no este indexada todavia es normal; que una que
        // ya lo estaba se caiga del indice, no.
        if (!ok && estadoPrevio[i.url]?.verdict === 'PASS') {
          problema('Paginas que salieron del indice', `\`${ruta}\` — ahora "${i.estado}".`);
        } else if (!ok) {
          sugerencia('Sin indexar', `\`${ruta}\` — "${i.estado}".`);
        }
        if (i.robots === 'DISALLOWED') {
          problema('Bloqueadas por robots.txt', `\`${ruta}\``);
        }
        if (i.canonicaGoogle && i.canonicaGoogle !== i.url) {
          problema('Google eligio otra canonica', `\`${ruta}\` → ${i.canonicaGoogle}`);
        }
      }

      contexto.push(`Indexacion: ${indexadas} de ${urls.length} URLs del sitemap (${pct(indexadas / urls.length)}).`);
      writeFileSync(ESTADO, JSON.stringify(estadoNuevo, null, 2), 'utf8');
    }
  }

  // ── Salida ────────────────────────────────────────────────────────────────

  const fecha = new Date().toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const informe = [
    `# SEO — ${fecha}`,
    '',
    ...contexto.map(c => `${c}\n`),
    bloque('Problemas', problemas),
    bloque('Para mirar', sugerencias),
    problemas.length || sugerencias.length ? '' : 'Sin hallazgos.',
    '',
    '---',
    '',
    'Generado por `herramientas/seo-semanal.mjs`. Los numeros son medidos; las',
    'sugerencias de que hacer con ellos las arma el agente `estratega-seo`.',
    '',
  ].join('\n');

  const sello = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  writeFileSync(ULTIMO, informe, 'utf8');
  writeFileSync(path.join(LOGS, `seo-${sello}.md`), informe, 'utf8');

  for (const c of contexto) console.log(c);
  console.log(`\n${problemas.length} problema(s), ${sugerencias.length} cosa(s) para mirar.`);
  console.log(`Informe: ${ULTIMO}`);

  process.exit(problemas.length ? 1 : 0);
}

main().catch(err => {
  console.error(err.message);
  process.exit(2);
});
