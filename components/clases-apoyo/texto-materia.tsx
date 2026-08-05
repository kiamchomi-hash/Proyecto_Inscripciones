import { sanitizeContent } from '@/lib/sanitize-content';

// El texto propio de cada materia, renderizado en el servidor debajo de la app.
// Es lo único que distingue de verdad una URL de otra: sin esto las seis
// páginas son la misma pantalla con otra pestaña activa. Va aparte del
// componente cliente para que no viaje en el payload de React.
export default function TextoMateria({ label, parrafos }: { label: string; parrafos: string[] | null }) {
  if (!parrafos?.length) return null;

  return (
    <section className="ca-seo" aria-labelledby="ca-seo-titulo">
      <div className="ca-seo-inner">
        <h2 id="ca-seo-titulo">Clases de apoyo de {label} en Villa Lugano</h2>
        {parrafos.map((p, i) => (
          <p key={i} dangerouslySetInnerHTML={{ __html: sanitizeContent(p) }} />
        ))}
      </div>
    </section>
  );
}
