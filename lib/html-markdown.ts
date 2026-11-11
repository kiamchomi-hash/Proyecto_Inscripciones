/**
 * Convierte el HTML de los artículos a markdown.
 *
 * El contenido de las novedades es HTML guardado en la base: lo que el sitio
 * pinta con `sanitizeContent`. Un agente que lee la versión markdown de un
 * artículo quiere el texto, no las etiquetas, así que esta es la traducción.
 *
 * El HTML es acotado —lo escriben redactores del centro, no usuarios—, así que
 * el conversor conoce las etiquetas que aparecen y deja pasar el resto como
 * texto. Las que no son texto (script, style) se borran con su contenido.
 *
 * No es un parser general: si algún día el contenido trae tablas anidadas o
 * HTML de otra biblioteca, hay que ampliar la lista.
 */

/** Contenido que no es texto: se borra entero, con lo que tiene adentro. */
const SIN_TEXTO = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;

const ENTIDADES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', uuml: 'ü',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Uuml: 'Ü',
  ntilde: 'ñ', Ntilde: 'Ñ', iexcl: '¡', iquest: '¿', deg: '°', middot: '·',
  mdash: '—', ndash: '–', laquo: '«', raquo: '»', hellip: '…',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', times: '×', copy: '©',
};

function desentidades(texto: string): string {
  return texto.replace(/&(#x?[0-9a-fA-F]+|\w+);/g, (original, codigo: string) => {
    if (codigo.startsWith('#x') || codigo.startsWith('#X')) {
      const numero = Number.parseInt(codigo.slice(2), 16);
      return Number.isFinite(numero) ? String.fromCodePoint(numero) : original;
    }
    if (codigo.startsWith('#')) {
      const numero = Number.parseInt(codigo.slice(1), 10);
      return Number.isFinite(numero) ? String.fromCodePoint(numero) : original;
    }
    return ENTIDADES[codigo] ?? original;
  });
}

function atributo(etiqueta: string, nombre: string): string {
  const regex = new RegExp(`${nombre}\\s*=\\s*"([^"]*)"`, 'i');
  return regex.exec(etiqueta)?.[1] ?? '';
}

/** Una fila de tabla: las celdas en una línea con pipes, como las de GFM. */
function filaAMarkdown(fila: string): string {
  const celdas = [...fila.matchAll(/<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi)]
    .map(([, , interior]) => interior.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
  return celdas.length ? `| ${celdas.join(' | ')} |` : '';
}

export function htmlAMarkdown(html: string): string {
  let texto = html;

  // Lo que no es texto, se va con lo que tiene adentro.
  texto = texto.replace(SIN_TEXTO, '');

  // Tablas: la primera fila es la cabecera y las siguientes son datos.
  texto = texto.replace(/<table\b[^>]*>([\s\S]*?)<\/table>/gi, (_, interior: string) => {
    const filas = [...interior.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
      .map(([, fila]) => filaAMarkdown(fila))
      .filter(Boolean);
    if (!filas.length) return '';
    const [cabecera, ...datos] = filas;
    const separador = `| ${cabecera.slice(2, -2).split(' | ').map(() => '---').join(' | ')} |`;
    return `\n\n${[cabecera, separador, ...datos].join('\n')}\n\n`;
  });

  // Imágenes: en su propia línea, con su texto alternativo.
  texto = texto.replace(/<img\b[^>]*>/gi, (etiqueta: string) => {
    const src = atributo(etiqueta, 'src');
    if (!src) return '';
    const alt = atributo(etiqueta, 'alt');
    return `\n\n![${alt}](${src})\n\n`;
  });

  // Enlaces: el texto de adentro es el que se ve.
  texto = texto.replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, interior: string) => {
    // Las etiquetas de adentro se cambian por un espacio: si no, dos textos
    // seguidos en el enlace quedan pegados ("WhatsApp" + "11 3297-3801").
    const visible = interior.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return visible ? `[${visible}](${href})` : '';
  });

  // Negrita y cursiva.
  texto = texto.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');
  texto = texto.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*');

  // Encabezados.
  for (const [nivel, marca] of [[1, '#'], [2, '##'], [3, '###'], [4, '####']] as const) {
    texto = texto.replace(new RegExp(`<h${nivel}\\b[^>]*>([\\s\\S]*?)</h${nivel}>`, 'gi'),
      `\n\n${marca} $1\n\n`);
  }

  // Listas: cada ítem en su línea.
  texto = texto.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1');
  // Al cerrarse la lista va una línea en blanco: si no, el markdown sigue
  // contando lo que viene como parte del último ítem.
  texto = texto.replace(/<\/(ul|ol)>/gi, '\n\n');

  // Párrafos, bloques, saltos de línea y citas.
  texto = texto.replace(/<\/p>/gi, '\n\n');
  texto = texto.replace(/<\/div>/gi, '\n\n');
  texto = texto.replace(/<\/span>/gi, ' ');
  texto = texto.replace(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n\n> $1\n\n');
  texto = texto.replace(/<br\s*\/?>/gi, '\n');

  // Lo que quede de etiqueta se va: el contenido se conserva.
  texto = texto.replace(/<[^>]*>/g, '');

  texto = desentidades(texto);

  // Limpieza de espacios: una línea por idea, sin líneas en blanco de más.
  texto = texto.replace(/[ \t]+\n/g, '\n');
  texto = texto.replace(/\n{3,}/g, '\n\n');
  texto = texto.replace(/^[ \t]+/gm, '');
  return texto.trim();
}
