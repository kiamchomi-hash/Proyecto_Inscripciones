import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { Poppins } from 'next/font/google';
import { notFound, permanentRedirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Carrera } from '@/components/index/types';
import { carreraFullName, carreraToSlug, esCarreraVisible } from '@/components/index/types';
import { esCursoTeclab } from '@/components/index/teclab';
import {
  SITIO,
  conArticulo,
  descripcionInscripcion,
  ogInscripcion,
  rutaInscripcion,
  tieneInscripcionPropia,
  tituloInscripcion,
} from '@/components/carreras/inscripcion-carrera';
import { casaDeCarrera } from '@/components/formularios/casas';
import FormularioLead from '@/components/formularios/formulario-lead';
import { jsonLdScript } from '@/lib/json-ld';
import '../../career-detail.css';
import './inscripcion.css';

// Igual que la ficha: los datos de carreras cambian una vez por mes y cada
// regeneracion es un ISR Write. Publicar un cambio lo revalida el trigger de
// `carreras` (ver app/api/revalidar).
export const revalidate = 86400;

// Poppins es la fuente de marca de Teclab. Se carga sólo en sus páginas (no en
// el layout) y llega a la hoja de estilos como --font-poppins.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

async function getCarreras(): Promise<Carrera[]> {
  const { data } = await supabase
    .from('carreras')
    .select('*')
    .eq('activa', true)
    .order('orden', { ascending: true })
    .throwOnError();
  // Igual que la ficha: sólo la oferta vigente tiene página.
  return ((data || []) as Carrera[]).filter(esCarreraVisible);
}

/** Misma busqueda que la ficha: primero el slug exacto, despues el formato viejo. */
function findBySlug(carreras: Carrera[], slug: string): Carrera | undefined {
  const exacta = carreras.find(c => carreraToSlug(c) === slug);
  if (exacta) return exacta;
  const normalizado = slug.toLowerCase().replace(/_/g, '-');
  return carreras.find(c => carreraToSlug(c) === normalizado);
}

async function getCarreraConInscripcion(slug: string) {
  const carreras = await getCarreras();
  const carrera = findBySlug(carreras, slug);
  return { carreras, carrera: carrera && tieneInscripcionPropia(carrera) ? carrera : undefined };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { carrera } = await getCarreraConInscripcion(slug);
  if (!carrera) return { title: 'Carrera no encontrada' };

  const title = tituloInscripcion(carrera);
  const description = descripcionInscripcion(carrera);
  const url = `${SITIO}${rutaInscripcion(carrera)}`;
  const og = ogInscripcion(carrera);

  return {
    // absolute: sin esto el layout le agrega su marca y queda duplicada.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    // No se indexa (20/10/2026): no sirve como entrada desde Google. La
    // cabecera X-Robots-Tag de next.config.ts dice lo mismo; esto cubre a los
    // buscadores que solo leen la meta.
    robots: { index: false, follow: true },
    openGraph: { title, description, url, images: [og] },
    twitter: { card: 'summary_large_image', title, description, images: [og] },
  };
}

export async function generateStaticParams() {
  const carreras = await getCarreras();
  return carreras.filter(tieneInscripcionPropia).map(c => ({ slug: carreraToSlug(c) }));
}

export default async function InscripcionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { carreras, carrera } = await getCarreraConInscripcion(slug);
  if (!carrera) notFound();

  const ruta = rutaInscripcion(carrera);
  if (`/carreras/${slug}/inscripcion` !== ruta) permanentRedirect(ruta);

  const nombreCompleto = carreraFullName(carrera);
  const fichaUrl = `/carreras/${carreraToSlug(carrera)}`;
  const curso = esCursoTeclab(carrera);
  const casa = casaDeCarrera(carrera) === 'siglo21' ? 'siglo21' : 'teclab';

  // Las tecnicaturas toman la paleta de Teclab que declara .inscripcion-teclab
  // (inscripcion.css). El curso conserva el ambar con el que se distingue en el
  // catalogo y en su ficha.
  const estilo = curso
    ? ({ '--career-accent': '#f4aa22', '--career-accent-bright': '#ffc95e' } as CSSProperties)
    : undefined;

  // Toda la pagina es de Teclab, asi que el formulario va con la casa fija y solo
  // ofrece sus carreras, como en /teclab.
  const opcionesFormulario = carreras
    .filter(c => tieneInscripcionPropia(c) && casaDeCarrera(c) === casa)
    .map(c => ({ id: c.id, nombre: c.nombre, nivel: c.nivel, duracion: c.duracion }));

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITIO },
      { '@type': 'ListItem', position: 2, name: nombreCompleto, item: `${SITIO}${fichaUrl}` },
      { '@type': 'ListItem', position: 3, name: 'Inscripción', item: `${SITIO}${ruta}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbSchema) }} />
      <main className="flex-1">
        <article className={`career-page inscripcion-page ${casa === 'teclab' ? `inscripcion-teclab ${poppins.variable}` : 'inscripcion-siglo21'}`} style={estilo}>
          <h1 className="sr-only">Inscripción {conArticulo(carrera)}</h1>

          <FormularioLead
            carreras={opcionesFormulario}
            alinearAlLlegar
            modo="preinscripcion"
            casa={casa}
            origen={casa === 'teclab' ? 'teclab' : 'home'}
            carreraInicial={carrera.id}
          />

          <section className="inscripcion-proximos" aria-labelledby="proximos-pasos-titulo">
            <div className="inscripcion-proximos-tarjeta">
              <h2 id="proximos-pasos-titulo">Próximos pasos</h2>
              <div className="inscripcion-proximos-contenido">
                <p>{casa === 'teclab' ? 'Un asesor del CAU se contacta a la brevedad para terminar tu preinscripción. Después Teclab te envía por mail el acceso al portal del alumno, donde elegís el medio de pago y abonás.' : 'Te contactamos para continuar con tu inscripción a Universidad Siglo 21.'}</p>
                {/* Explícito y bien visible: hay quien no completa por miedo a que le cobren. */}
                <p className="inscripcion-sin-pago">{casa === 'teclab'
                  ? 'Completar este formulario no realiza ningún pago: sólo registra tu solicitud. El pago lo hacés después, desde el portal del alumno.'
                  : 'Completar este formulario no realiza ningún pago: sólo registra tu preinscripción.'}</p>
              </div>
            </div>
          </section>

        </article>
      </main>
    </>
  );
}
