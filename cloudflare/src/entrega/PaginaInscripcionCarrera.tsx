import type { CSSProperties } from 'react';
import type { Carrera, CarreraOpcion } from '@/components/index/types';
import { carreraFullName, carreraToSlug } from '@/components/index/types';
import { esCursoTeclab } from '@/components/index/teclab';
import { SITIO, conArticulo, rutaInscripcion } from '@/components/carreras/inscripcion-carrera';
import { casaDeCarrera } from '@/components/formularios/casas';
import FormularioLead from '@/components/formularios/formulario-lead';
import { jsonLdScript } from '@/lib/json-ld';
import { ContextoTurnstile, type ConfigTurnstile } from './turnstile-contexto';

/** Cuerpo vigente de app/carreras/[slug]/inscripcion, sin una segunda escritura. */
export default function PaginaInscripcionCarrera({ carrera, opciones, turnstile }: {
  carrera: Carrera; opciones: CarreraOpcion[]; turnstile: ConfigTurnstile;
}) {
  const casa = casaDeCarrera(carrera) === 'siglo21' ? 'siglo21' : 'teclab';
  const estilo = esCursoTeclab(carrera)
    ? { '--career-accent': '#f4aa22', '--career-accent-bright': '#ffc95e' } as CSSProperties : undefined;
  const breadcrumb = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO },
      { '@type': 'ListItem', position: 2, name: carreraFullName(carrera), item: `${SITIO}/carreras/${carreraToSlug(carrera)}` },
      { '@type': 'ListItem', position: 3, name: 'Inscripción', item: `${SITIO}${rutaInscripcion(carrera)}` },
    ],
  };
  return <ContextoTurnstile.Provider value={turnstile}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }} />
    <main className="flex-1">
      <article className={`career-page inscripcion-page ${casa === 'teclab' ? 'inscripcion-teclab fuente-poppins' : 'inscripcion-siglo21'}`} style={estilo}>
        <h1 className="sr-only">Inscripción {conArticulo(carrera)}</h1>
        <FormularioLead carreras={opciones} alinearAlLlegar modo="preinscripcion" casa={casa}
          origen={casa === 'teclab' ? 'teclab' : 'home'} carreraInicial={carrera.id} />
        <section className="inscripcion-proximos" aria-labelledby="proximos-pasos-titulo">
          <div className="inscripcion-proximos-tarjeta">
            <h2 id="proximos-pasos-titulo">Próximos pasos</h2>
            <div className="inscripcion-proximos-contenido">
              <p>{casa === 'teclab' ? 'Un asesor del CAU se contacta a la brevedad para terminar tu preinscripción. Después Teclab te envía por mail el acceso al portal del alumno, donde elegís el medio de pago y abonás.' : 'Te contactamos para continuar con tu inscripción a Universidad Siglo 21.'}</p>
              <p className="inscripcion-sin-pago">{casa === 'teclab'
                ? 'Completar este formulario no realiza ningún pago: sólo registra tu solicitud. El pago lo hacés después, desde el portal del alumno.'
                : 'Completar este formulario no realiza ningún pago: sólo registra tu preinscripción.'}</p>
            </div>
          </div>
        </section>
      </article>
    </main>
  </ContextoTurnstile.Provider>;
}
