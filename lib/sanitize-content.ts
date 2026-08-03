import sanitizeHtml from 'sanitize-html';

// Las novedades se maquetan desde la base con estas clases (ver
// app/novedades/articulo.css). El comodin las deja pasar sin tener que tocar
// este archivo cada vez que se agrega una variante, y sin abrir la puerta a
// clases arbitrarias: nada fuera del prefijo `art-` sobrevive.
const CLASES_ARTICULO = ['art-*'];

export function sanitizeContent(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'small', 'code',
      'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'hr',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
      'dl', 'dt', 'dd', 'div', 'figure', 'figcaption',
      'a', 'img', 'span',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      span: ['class'],
      div: ['class'],
      p: ['class'],
      ul: ['class'],
      ol: ['class'],
      li: ['class'],
      dl: ['class'],
      table: ['class'],
      thead: ['class'],
      tbody: ['class'],
      tr: ['class'],
      th: ['class', 'scope', 'colspan'],
      td: ['class', 'colspan'],
      figure: ['class'],
      blockquote: ['class'],
    },
    allowedClasses: {
      // `span` queda fuera a proposito: el carrusel de carreras le pasa
      // utilidades de Tailwind (`text-[#00c7b1]`) desde la base.
      div: CLASES_ARTICULO,
      p: CLASES_ARTICULO,
      ul: CLASES_ARTICULO,
      ol: CLASES_ARTICULO,
      li: CLASES_ARTICULO,
      dl: CLASES_ARTICULO,
      table: CLASES_ARTICULO,
      thead: CLASES_ARTICULO,
      tbody: CLASES_ARTICULO,
      tr: CLASES_ARTICULO,
      th: CLASES_ARTICULO,
      td: CLASES_ARTICULO,
      figure: CLASES_ARTICULO,
      blockquote: CLASES_ARTICULO,
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          ...attribs,
          rel: 'noopener noreferrer',
          ...(attribs.target === '_blank' ? { target: '_blank' } : {}),
        },
      }),
    },
  });
}
