/**
 * Lista todo el texto que se ve en una pieza y marca lo que no debería estar.
 *
 * El problema que resuelve: en un proyecto de Remotion (o en el HTML de un
 * folleto) el copy queda repartido entre el archivo de datos y el JSX, mezclado
 * con nombres de clase, rutas de imagen y props. Al revisar "a ojo" se cuelan
 * notas de trabajo — un `PENDIENTE`, la instrucción del prompt convertida en
 * rótulo — que después se renderizan y las ve el público.
 *
 * Este script separa el grano: extrae sólo las cadenas que terminan en
 * pantalla, las lista para que alguien las lea una por una, y aparte marca las
 * que matchean patrones conocidos de nota interna.
 *
 * Uso:
 *   node verificar-textos.mjs <archivo-o-carpeta> [...]
 *   node verificar-textos.mjs src/          # todo el proyecto
 *   node verificar-textos.mjs --solo-avisos src/
 *
 * Sale con código 1 si encuentra algo marcado.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const args = process.argv.slice(2);
const soloAvisos = args.includes('--solo-avisos');
const objetivos = args.filter((a) => !a.startsWith('--'));

if (objetivos.length === 0) {
  console.error('uso: node verificar-textos.mjs <archivo-o-carpeta> [...] [--solo-avisos]');
  process.exit(2);
}

const EXTENSIONES = new Set(['.jsx', '.tsx', '.js', '.ts', '.html', '.md']);

/* ── Patrones de nota interna ──────────────────────────────
   Cada uno con el motivo, porque el aviso sin explicación se ignora. */
const PATRONES = [
  {
    re: /\b(PENDIENTE|TODO|FIXME|TBD|XXX|placeholder|lorem ipsum|completar|a definir|falta(n)? dato)/i,
    motivo: 'marcador de dato faltante: si no hay dato, se omite la línea entera',
  },
  {
    re: /\b(2A|2B|CCC|APLV|prefix|slug|nivel_?id|curso_id)\b/,
    motivo: 'vocabulario interno: el público no maneja estos códigos',
  },
  {
    re: /\b(destac(a|á|ar)|poné|poner|mostrar|listar|usar|elegir)\s+(las?|los?|el|la)\s/i,
    motivo: 'suena a instrucción de armado, no a copy para quien mira',
  },
  {
    re: /\b(una|uno) (fuerte|principal|destacad[oa]) (de|por) cada\b/i,
    motivo: 'describe el criterio de selección en vez de nombrar la sección',
  },
  {
    re: /\b(Search Console|impresiones|CTR|Supabase|API|endpoint|query)\b/i,
    motivo: 'detalle de cómo se armó la pieza, no contenido de la pieza',
  },
  {
    re: /\b(aprox|approx|estimad[oa]|~\s?\d|más o menos|creo que)\b/i,
    motivo: 'dato tentativo: o se confirma o no se muestra',
  },
];

/** Cadenas que nunca son copy aunque parezcan texto. */
const esRuido = (s) =>
  s.length < 4 ||
  /^[\s\d.,:;%$/\\|_-]+$/.test(s) ||
  /^(images?|video|public|src|assets)\//.test(s) ||
  /\.(png|jpe?g|webp|svg|mp4|mp3|css|js|json)$/i.test(s) ||
  /^#[0-9a-f]{3,8}$/i.test(s) ||
  /^[a-z-]+(\s[a-z-]+)*$/.test(s) === false && false;

function archivosDe(ruta) {
  const st = statSync(ruta);
  if (st.isFile()) return EXTENSIONES.has(extname(ruta)) ? [ruta] : [];
  return readdirSync(ruta).flatMap((n) => {
    if (n === 'node_modules' || n.startsWith('.')) return [];
    return archivosDe(join(ruta, n));
  });
}

/**
 * Saca las cadenas visibles de un archivo.
 * Dos fuentes: los nodos de texto del JSX (`>Hola<`) y los literales de los
 * campos de datos que suelen ser copy (titulo, nombre, detalle, linea…).
 */
function extraer(contenido) {
  const encontrados = [];
  const lineas = contenido.split('\n');

  lineas.forEach((linea, i) => {
    const nro = i + 1;
    const limpia = linea.trim();
    // Los comentarios son para quien programa, no salen en pantalla.
    if (limpia.startsWith('//') || limpia.startsWith('*') || limpia.startsWith('/*')) return;

    // Texto entre etiquetas JSX/HTML.
    for (const m of linea.matchAll(/>([^<>{}\n]{4,})</g)) {
      const s = m[1].trim();
      if (s && !esRuido(s)) encontrados.push({ nro, texto: s, origen: 'jsx' });
    }

    // Campos de datos que terminan en pantalla.
    for (const m of linea.matchAll(
      /\b(titulo|title|nombre|label|detalle|linea|texto|bajada|kicker|que|casa|area|cta)\s*:\s*["'`]([^"'`]{4,})["'`]/gi
    )) {
      const s = m[2].trim();
      if (s && !esRuido(s)) encontrados.push({ nro, texto: s, origen: 'dato' });
    }
  });

  return encontrados;
}

let totalAvisos = 0;
let totalTextos = 0;

for (const objetivo of objetivos) {
  for (const archivo of archivosDe(objetivo)) {
    const contenido = readFileSync(archivo, 'utf8');
    const textos = extraer(contenido);
    if (textos.length === 0) continue;

    const avisos = textos
      .map((t) => {
        const p = PATRONES.find((pat) => pat.re.test(t.texto));
        return p ? { ...t, motivo: p.motivo } : null;
      })
      .filter(Boolean);

    totalTextos += textos.length;
    totalAvisos += avisos.length;

    const rel = relative(process.cwd(), archivo) || archivo;

    if (!soloAvisos) {
      console.log(`\n── ${rel} ──`);
      for (const t of textos) console.log(`  ${String(t.nro).padStart(4)}  ${t.texto}`);
    }

    if (avisos.length) {
      console.log(`\n!! ${rel} — ${avisos.length} para revisar`);
      for (const a of avisos) {
        console.log(`  ${String(a.nro).padStart(4)}  "${a.texto}"`);
        console.log(`        ${a.motivo}`);
      }
    }
  }
}

console.log(
  `\n${totalTextos} textos visibles, ${totalAvisos} marcados.` +
    (totalAvisos === 0 ? ' Nada automático que objetar — leer igual la lista de arriba.' : '')
);
process.exit(totalAvisos > 0 ? 1 : 0);
