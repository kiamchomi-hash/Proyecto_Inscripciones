import { sanitizeContent } from '@/lib/sanitize-content';

// El texto propio de cada materia, renderizado en el servidor debajo de la app.
// Es lo único que distingue de verdad una URL de otra: sin esto las seis
// páginas son la misma pantalla con otra pestaña activa. Va aparte del
// componente cliente para que no viaje en el payload de React.
// Los inline (<strong>, <em>, <a>) siguen siendo parrafo: lo que manda es que
// la entrada empiece con una etiqueta de bloque.
const BLOQUE = /^\s*<(h3|h4|ul|ol|table|figure|blockquote)[\s>]/i;

function esBloque(html: string) {
  return BLOQUE.test(html);
}

export default function TextoMateria({ label, parrafos }: { label: string; parrafos: string[] | null }) {
  if (!parrafos?.length) return null;

  return (
    <section className="ca-seo" aria-labelledby="ca-seo-titulo">
      <div className="ca-seo-inner">
        {/* El h1 de la pagina ya dice "Clases de apoyo de X en Villa Lugano":
            repetirlo aca daba dos titulos identicos en la misma URL. */}
        <h2 id="ca-seo-titulo">Sobre las clases de {label}</h2>
        {parrafos.map((p, i) =>
          // Una entrada que arranca con una etiqueta ya trae su propio bloque
          // (un subtitulo con su lista de temas, por ejemplo). Envolverla en un
          // <p> seria HTML invalido: el parser cierra el parrafo al ver el <h3>
          // y la maqueta queda partida. Va en un <div> y se estila aparte.
          esBloque(p) ? (
            <div key={i} className="ca-seo-bloque" dangerouslySetInnerHTML={{ __html: sanitizeContent(p) }} />
          ) : (
            <p key={i} dangerouslySetInnerHTML={{ __html: sanitizeContent(p) }} />
          )
        )}
      </div>
    </section>
  );
}
