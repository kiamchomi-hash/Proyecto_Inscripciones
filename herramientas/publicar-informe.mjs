#!/usr/bin/env node
// Sube los informes a un repo privado, para poder leerlos desde el celular.
//
// El problema que resuelve: el informe SEO necesita Search Console, y Search
// Console necesita la service account de ~/.gsc, que solo esta en esta maquina.
// Peor todavia, las sesiones de Claude en la nube tienen la salida de red
// filtrada: googleapis.com no esta en la lista, asi que el informe no se puede
// generar desde el celular ni aunque uno se lleve la credencial. GitHub si esta
// permitido. De ahi la division: la PC baja los datos cuando esta prendida, y
// deja el .md en un repo que el celular si puede leer.
//
// El repo tiene que ser PRIVADO y este script se niega a escribir en uno
// publico. No es paranoia: el informe lleva las consultas que traen trafico y
// que paginas rinden, o sea la estrategia. Por eso mismo vigilancia-logs/ esta
// gitignoreado en este repo, que es publico.
//
//   node herramientas/publicar-informe.mjs
//   node herramientas/publicar-informe.mjs herramientas/vigilancia-logs/seo-ultimo.md
//   node herramientas/publicar-informe.mjs --carpeta=leads .agents/reports/release.json
//
// Configuracion, en .env.local (las dos, o no hace nada):
//   INFORMES_REPO=usuario/mis-informes
//   INFORMES_TOKEN=github_pat_...   (fine-grained, permiso Contents: read/write
//                                    SOLO sobre ese repo)
//
// Sin configurar sale con codigo 0 y un aviso: asi el .bat del informe puede
// llamarlo siempre, sin que la falta de configuracion parezca un error.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const API = 'https://api.github.com';
const POR_DEFECTO = 'herramientas/vigilancia-logs/seo-ultimo.md';

const args = process.argv.slice(2);
const carpeta = (args.find((a) => a.startsWith('--carpeta=')) ?? '--carpeta=informes').slice(10);
const archivos = args.filter((a) => !a.startsWith('--'));
if (archivos.length === 0) archivos.push(POR_DEFECTO);

const REPO = process.env.INFORMES_REPO?.trim();
const TOKEN = process.env.INFORMES_TOKEN?.trim();

if (!REPO || !TOKEN) {
  console.log(
    'Publicacion de informes no configurada: faltan INFORMES_REPO o INFORMES_TOKEN\n'
    + 'en .env.local. El informe quedo igual en herramientas/vigilancia-logs/.',
  );
  process.exit(0);
}

if (!/^[\w.-]+\/[\w.-]+$/.test(REPO)) {
  console.error(`INFORMES_REPO tiene que ser "usuario/repo", y dice: ${REPO}`);
  process.exit(1);
}

/** Toda llamada a la API lleva los mismos encabezados; el User-Agent es obligatorio. */
async function api(ruta, opciones = {}) {
  return fetch(`${API}${ruta}`, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'publicar-informe (pagina_siglo21)',
      ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
}

// ── Guarda: el repo destino tiene que ser privado ──────────────────────────
const meta = await api(`/repos/${REPO}`);
if (meta.status === 404) {
  console.error(
    `No existe ${REPO}, o el token no lo alcanza.\n`
    + 'Si es un token fine-grained, revisa que el repo este entre los seleccionados.',
  );
  process.exit(1);
}
if (!meta.ok) {
  console.error(`GitHub respondio ${meta.status} al mirar ${REPO}: ${await meta.text()}`);
  process.exit(1);
}
const { private: privado, default_branch: rama } = await meta.json();
if (!privado) {
  console.error(
    `${REPO} es PUBLICO y los informes no van ahi: llevan las consultas que\n`
    + 'traen trafico y que paginas rinden. Crea un repo privado y apunta\n'
    + 'INFORMES_REPO a ese.',
  );
  process.exit(1);
}

// ── Subida ────────────────────────────────────────────────────────────────
const sello = new Date().toISOString().slice(0, 16).replace('T', ' ');
let fallos = 0;

for (const archivo of archivos) {
  const local = path.resolve(archivo);
  if (!existsSync(local)) {
    console.error(`  falta ${archivo}: no se genero todavia`);
    fallos++;
    continue;
  }

  const destino = `${carpeta}/${path.basename(archivo)}`;
  const contenido = readFileSync(local).toString('base64');

  // Actualizar un archivo existente exige mandar su sha; crearlo, no mandarlo.
  const actual = await api(`/repos/${REPO}/contents/${encodeURI(destino)}?ref=${rama}`);
  const sha = actual.ok ? (await actual.json()).sha : undefined;

  const r = await api(`/repos/${REPO}/contents/${encodeURI(destino)}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `informe: ${path.basename(archivo)} (${sello})`,
      content: contenido,
      branch: rama,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!r.ok) {
    console.error(`  ${destino}: GitHub respondio ${r.status} - ${await r.text()}`);
    fallos++;
    continue;
  }
  console.log(`  ${destino} publicado en ${REPO}`);
}

if (fallos > 0) process.exit(1);
console.log(`\nListo. Desde el celular: pedile a Claude que lea ${REPO}, carpeta ${carpeta}/.`);
