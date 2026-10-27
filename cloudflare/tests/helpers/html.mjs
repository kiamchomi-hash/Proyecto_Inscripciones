// Extracción y normalización para comparar HTML de las dos implementaciones.
// No es un parser completo: alcanza para `<title>`, canonical, metas, JSON-LD,
// texto visible dentro de `<main>` y enlaces del documento. Cualquier estructura
// que no pueda aislar hace fallar la prueba en vez de devolver una lista vacía.

const ENTIDADES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', uuml: 'ü',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Uuml: 'Ü',
  ntilde: 'ñ', Ntilde: 'Ñ', iexcl: '¡', iquest: '¿', deg: '°', middot: '·',
  mdash: '—', ndash: '–', laquo: '«', raquo: '»', hellip: '…',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', times: '×', copy: '©',
};

export function decodificar(texto) {
  return texto.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-zA-Z]+);/gi, (original, codigo) => {
    if (codigo[0] === '#') {
      const numero = codigo[1].toLowerCase() === 'x'
        ? Number.parseInt(codigo.slice(2), 16)
        : Number.parseInt(codigo.slice(1), 10);
      return Number.isFinite(numero) ? String.fromCodePoint(numero) : original;
    }
    return Object.hasOwn(ENTIDADES, codigo) ? ENTIDADES[codigo] : original;
  });
}

/** Devuelve el contenido entre la primera apertura que matchee y su cierre. */
function recortar(html, apertura, cierre) {
  const desde = html.search(apertura);
  if (desde === -1) return null;
  const inicio = html.indexOf('>', desde);
  const fin = html.indexOf(cierre, inicio);
  if (inicio === -1 || fin === -1) return null;
  return html.slice(inicio + 1, fin);
}

export function textoPrincipal(html) {
  const region = recortar(html, /<main\b/, '</main>');
  if (region === null) throw new Error('El HTML no tiene un <main> cerrado.');
  return normalizarTexto(region);
}

export function textoDe(html) {
  return normalizarTexto(html);
}

export function normalizarTexto(fragmento) {
  const sinRuido = fragmento
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, ' ')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  return decodificar(sinRuido.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

export function titulo(html) {
  const encontrado = /<title>([\s\S]*?)<\/title>/i.exec(html);
  return encontrado ? decodificar(encontrado[1]).trim() : null;
}

export function canonical(html) {
  const encontrado = /<link[^>]+rel="canonical"[^>]*>/i.exec(html);
  if (!encontrado) return null;
  const href = /href="([^"]*)"/.exec(encontrado[0]);
  return href ? decodificar(href[1]) : null;
}

/** Metas de `name` y `property` como objeto plano. */
export function metas(html) {
  const resultado = {};
  // `>` es válido dentro de atributos entrecomillados. Astro lo conserva y
  // Next lo serializa como entidad: cortar allí falsea los casos XSS de títulos.
  const patron = /<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
  let etiqueta;
  while ((etiqueta = patron.exec(html)) !== null) {
    const clave = /\b(?:name|property)="([^"]+)"/i.exec(etiqueta[0]);
    const contenido = /\bcontent="([^"]*)"/i.exec(etiqueta[0]);
    if (clave && contenido) resultado[clave[1]] = decodificar(contenido[1]);
  }
  return resultado;
}

export function idioma(html) {
  const encontrado = /<html\b[^>]*\blang="([^"]*)"/i.exec(html);
  return encontrado ? encontrado[1] : null;
}

export function jsonLd(html) {
  const bloques = [];
  const patron = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let bloque;
  while ((bloque = patron.exec(html)) !== null) bloques.push(bloque[1]);
  return bloques;
}

export function enlaces(html) {
  const resultado = [];
  const patron = /<a\b[^>]*\bhref="([^"]*)"/gi;
  let enlace;
  while ((enlace = patron.exec(html)) !== null) resultado.push(decodificar(enlace[1]));
  return resultado;
}

/** Enlaces de una región concreta (main, nav o footer). */
export function enlacesDe(html, { apertura, cierre }) {
  const region = recortar(html, apertura, cierre);
  if (region === null) throw new Error(`No se encontró la región ${apertura}.`);
  return enlaces(region);
}

/**
 * Diff legible por campo: las pruebas muestran qué texto o enlace sobra/falta en
 * vez de dos documentos de 100 KB.
 */
export function diferencias(a, b) {
  const salida = [];
  if (a === b) return salida;
  const palabrasA = a.split(' ');
  const palabrasB = b.split(' ');
  let primero = 0;
  while (primero < palabrasA.length && primero < palabrasB.length
    && palabrasA[primero] === palabrasB[primero]) primero++;
  salida.push(`primer tramo distinto en la palabra ${primero}`);
  salida.push(`  astro: …${palabrasA.slice(Math.max(0, primero - 8), primero + 16).join(' ')}…`);
  salida.push(`  next:  …${palabrasB.slice(Math.max(0, primero - 8), primero + 16).join(' ')}…`);
  return salida;
}
