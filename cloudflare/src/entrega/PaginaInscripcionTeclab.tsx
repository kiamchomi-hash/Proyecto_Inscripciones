import type { CarreraOpcion } from '@/components/index/types';
import { SITIO } from '@/components/carreras/inscripcion-carrera';
import FormularioLead from '@/components/formularios/formulario-lead';
import { jsonLdScript } from '@/lib/json-ld';
import { ContextoTurnstile, type ConfigTurnstile } from './turnstile-contexto';

// Cuerpo de `app/teclab/inscripcion/page.tsx`, sin rediseño ni copy nuevo: el
// mismo formulario, los mismos textos y el mismo JSON-LD. En Next la página no
// renderiza el pie, así que acá tampoco.
//
// `poppins.variable` pasa a ser `fuente-poppins`, la clase que declara
// `--font-poppins` con la Poppins autoalojada.

const RUTA = '/teclab/inscripcion';
const TITULO = 'Inscripción a Teclab';

export default function PaginaInscripcionTeclab(
  { opciones, turnstile }: { opciones: CarreraOpcion[]; turnstile: ConfigTurnstile },
) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO },
      { '@type': 'ListItem', position: 2, name: 'Teclab', item: `${SITIO}/teclab` },
      { '@type': 'ListItem', position: 3, name: 'Inscripción', item: `${SITIO}${RUTA}` },
    ],
  };

  return (
    <ContextoTurnstile.Provider value={turnstile}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbSchema) }} />
      <main className="flex-1">
        {/* Los colores son los de la inscripción de cada tecnicatura: la paleta de
            Teclab que declara .inscripcion-teclab en inscripcion.css. */}
        <article className="career-page inscripcion-page inscripcion-teclab fuente-poppins">
          <h1 className="sr-only">{TITULO}</h1>

          <FormularioLead alinearAlLlegar carreras={opciones} modo="preinscripcion" casa="teclab" origen="teclab" />

          <section className="inscripcion-proximos" aria-labelledby="proximos-pasos-titulo">
            <div className="inscripcion-proximos-tarjeta">
              <h2 id="proximos-pasos-titulo">Próximos pasos</h2>
              <div className="inscripcion-proximos-contenido">
                <p>Un asesor del CAU se contacta a la brevedad para terminar tu preinscripción. Después Teclab te envía por mail el acceso al portal del alumno, donde elegís el medio de pago y abonás.</p>
                {/* Explícito y bien visible: hay quien no completa por miedo a que le cobren. */}
                <p className="inscripcion-sin-pago">Completar este formulario no realiza ningún pago: sólo registra tu solicitud. El pago lo hacés después, desde el portal del alumno.</p>
              </div>
            </div>
          </section>

        </article>
      </main>
    </ContextoTurnstile.Provider>
  );
}
