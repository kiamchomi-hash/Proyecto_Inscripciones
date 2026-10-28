#!/usr/bin/env node
// Genera derivados webp de las imágenes del sitio y el manifiesto que usan los
// componentes para armar `srcset`.
//
//   node herramientas/derivar-imagenes.mjs            # escribe lo que falte
//   node herramientas/derivar-imagenes.mjs --verificar # no escribe; falla si el
//                                                     # manifiesto quedó viejo
//
// Por qué existe: las fotos de los modales se servían enteras. La peor pesaba
// 3,7 MB y el navegador la bajaba completa también en un celular, porque no hay
// optimizador en el paquete de Cloudflare (`imageService: 'passthrough'`) y
// `next/image` sólo existía en el sitio anterior. Los derivados se generan una
// vez por cambio de imagen, no por visita.
//
// El nombre de cada derivado lleva el hash del contenido del original
// (`<hash>-<ancho>.webp`). Por eso puede servirse `immutable`: si la foto cambia,
// cambia el nombre y el navegador no puede quedarse con la vieja.
//
// Lo generado:
//   public/derivados/<hash>-<ancho>.webp   → artefactos, fuera de Git
//   lib/imagenes/derivadas.ts              → manifiesto chico, versionado
//
// El manifiesto va en el repo a propósito: el componente necesita saber qué
// anchos existen sin pedir nada a la red, y así una imagen sin derivados se
// sigue sirviendo tal cual en vez de quedar rota.

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const PUBLICO = join(RAIZ, 'public');
const ENTRADA = join(PUBLICO, 'imagenes');
const SALIDA = join(PUBLICO, 'derivados');
const MANIFIESTO = join(RAIZ, 'lib', 'imagenes', 'derivadas.ts');

// Anchos ofrecidos a `srcset`. El modal mide 64rem como máximo y el banner de
// mobile ocupa el ancho completo, así que estos tres cubren 1x y 2x sin subir
// una foto de 3000 px.
const ANCHOS = [480, 960, 1440];
// Debajo de este peso el derivado no ahorra nada que se note y suma un pedido.
const MINIMO_BYTES = 40 * 1024;
// Archivo que igual conviene convertir aunque no haya ancho más chico que ofrecer.
const PESADO_BYTES = 120 * 1024;
// Arriba de este ancho no se ofrece el tamaño natural: ya hay 1440.
const PESADO_ANCHO_MAXIMO = 1440;
// Carpetas que no se sirven como contenido de página (og:image, folletos).
const EXCLUIDAS = [join('imagenes', 'og')];
// Fotos prohibidas por docs/criterios.md: no se publican, así que tampoco se les
// generan derivados ni entran al manifiesto (`tests/imagenes-prohibidas.test.mjs`).
const PROHIBIDAS = [join('imagenes', 'gente', 'Header_1920x450-1.webp')];

const EXTENSIONES = new Set(['.webp', '.jpg', '.jpeg', '.png']);

function* recorrer(dir) {
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const completo = join(dir, entrada.name);
    if (entrada.isDirectory()) yield* recorrer(completo);
    else yield completo;
  }
}

function clavePublica(archivo) {
  return '/' + relative(PUBLICO, archivo).split(sep).join('/');
}

function estaExcluida(archivo) {
  const rel = relative(PUBLICO, archivo).split(sep).join('/');
  if (PROHIBIDAS.some((p) => rel === p.split(sep).join('/'))) return true;
  return EXCLUIDAS.some((e) => rel.startsWith(e.split(sep).join('/') + '/'));
}

async function anchosDe(archivo, extension, bytes) {
  const { width } = await sharp(archivo).metadata();
  if (!width) return [];
  const ofrecidos = ANCHOS.filter((a) => a < width);
  const ultimo = ofrecidos.at(-1) ?? 0;
  // El ancho natural entra cuando aporta resolución (pantallas 2x) o cuando
  // conviene convertir el original: un PNG de captura pesa mucho aunque no sea
  // ancho. Con un 10 % de margen se evitan candidatos casi iguales al anterior.
  if (width <= PESADO_ANCHO_MAXIMO && ultimo < width * 0.9 && (extension !== '.webp' || bytes > PESADO_BYTES)) {
    ofrecidos.push(width);
  }
  return ofrecidos;
}

function hashDe(archivo) {
  return createHash('sha256').update(readFileSync(archivo)).digest('hex').slice(0, 8);
}

export async function generar({ verificar = false } = {}) {
  if (!existsSync(ENTRADA)) {
    console.error(`No existe ${ENTRADA}`);
    process.exit(1);
  }

  const manifiesto = {};
  let generados = 0;
  let reusados = 0;
  let bytesFuente = 0;
  let bytesDerivados = 0;

  for (const archivo of recorrer(ENTRADA)) {
    const extension = archivo.slice(archivo.lastIndexOf('.')).toLowerCase();
    if (!EXTENSIONES.has(extension) || estaExcluida(archivo)) continue;
    const bytes = statSync(archivo).size;
    if (bytes < MINIMO_BYTES) continue;

    const anchos = await anchosDe(archivo, extension, bytes);
    if (anchos.length === 0) continue;

    const hash = hashDe(archivo);
    manifiesto[clavePublica(archivo)] = { hash, anchos };

    for (const ancho of anchos) {
      const destino = join(SALIDA, `${hash}-${ancho}.webp`);
      if (existsSync(destino)) {
        reusados++;
        bytesDerivados += statSync(destino).size;
        continue;
      }
      if (verificar) continue;
      mkdirSync(SALIDA, { recursive: true });
      const info = await sharp(archivo)
        .resize({ width: ancho, withoutEnlargement: true })
        .webp({ quality: 78, effort: 4 })
        .toFile(destino);
      generados++;
      bytesDerivados += info.size;
    }
    bytesFuente += statSync(archivo).size;
  }

  const ordenado = Object.fromEntries(Object.entries(manifiesto).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  // Una entrada por línea: el archivo se revisa en un diff y se comprime igual.
  const lineas = Object.entries(ordenado).map(
    ([ruta, { hash, anchos }]) => `  ${JSON.stringify(ruta)}: { hash: '${hash}', anchos: [${anchos.join(', ')}] },`,
  );
  const contenido = `// GENERADO por herramientas/derivar-imagenes.mjs. No editar a mano:
// se rehace con \`node herramientas/derivar-imagenes.mjs\` y un test falla si
// quedó desactualizado.
//
// Cada entrada dice el hash del original y los anchos que tienen derivado webp
// en /derivados/<hash>-<ancho>.webp. Las rutas son las mismas que guarda la base.

export type Derivadas = { hash: string; anchos: number[] };

export const DERIVADAS: Record<string, Derivadas> = {
${lineas.join('\n')}
};
`;

  if (verificar) {
    const actual = existsSync(MANIFIESTO) ? readFileSync(MANIFIESTO, 'utf8') : '';
    if (actual !== contenido) {
      console.error('El manifiesto de derivadas está desactualizado: correr node herramientas/derivar-imagenes.mjs');
      process.exit(1);
    }
    for (const [ruta, { hash, anchos }] of Object.entries(ordenado)) {
      for (const ancho of anchos) {
        if (!existsSync(join(SALIDA, `${hash}-${ancho}.webp`))) {
          console.error(`Falta el derivado de ${ruta} a ${ancho}px: correr node herramientas/derivar-imagenes.mjs`);
          process.exit(1);
        }
      }
    }
    console.log(`Derivadas al día: ${Object.keys(ordenado).length} imágenes.`);
    return;
  }

  mkdirSync(join(RAIZ, 'lib', 'imagenes'), { recursive: true });
  writeFileSync(MANIFIESTO, contenido, 'utf8');
  // Limpia derivados que ya no corresponden a ninguna foto (original cambiado o
  // imagen retirada): si no, se acumulan en `public/derivados/` para siempre.
  const esperados = new Set(
    Object.values(ordenado).flatMap(({ hash, anchos }) => anchos.map((ancho) => `${hash}-${ancho}.webp`)),
  );
  const sobrantes = existsSync(SALIDA) ? readdirSync(SALIDA).filter((n) => !esperados.has(n)) : [];
  for (const nombre of sobrantes) rmSync(join(SALIDA, nombre), { force: true });
  console.log(
    `Derivadas: ${Object.keys(ordenado).length} imágenes, ${generados} archivos nuevos, ${reusados} ya existían` +
      `${sobrantes.length ? `, ${sobrantes.length} sobrantes borrados` : ''}. ` +
      `Originales ${(bytesFuente / 1048576).toFixed(1)} MB, derivados ${(bytesDerivados / 1048576).toFixed(1)} MB.`,
  );
}

// Se ejecuta sólo como script: `astro.config.mjs` lo importa y lo llama desde el
// build y el dev, y ahí no tiene que correr dos veces ni leer los argumentos.
if (process.argv[1] && process.argv[1].endsWith('derivar-imagenes.mjs')) {
  await generar({ verificar: process.argv.includes('--verificar') });
}
