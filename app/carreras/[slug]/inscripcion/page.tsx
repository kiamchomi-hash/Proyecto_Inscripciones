import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Poppins } from 'next/font/google';
import { notFound, permanentRedirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Carrera } from '@/components/index/types';
import { carreraFullName, carreraToSlug, esCarreraVisible } from '@/components/index/types';
import { esCursoTeclab } from '@/components/index/teclab';
import {
  GuiaInscripcion,
  PreguntasInscripcion,
  SITIO,
  conArticulo,
  descripcionInscripcion,
  ogInscripcion,
  preguntasInscripcion,
  rutaInscripcion,
  tieneInscripcionPropia,
  tituloInscripcion,
} from '@/components/carreras/inscripcion-carrera';
import AvisoInicioTeclab from '@/components/index/aviso-inicio-teclab';
import FormularioLead from '@/components/formularios/formulario-lead';
import SiteFooter from '@/components/footer';
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
    openGraph: { title, description, url, images: [og] },
    twitter: { card: 'summary_large_image', title, description, images: [og] },
  };
}

export async function generateStaticParams() {
  const carreras = await getCarreras();
  return carreras.filter(tieneInscripcionPropia).map(c => ({ slug: carreraToSlug(c) }));
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
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
  const preguntas = preguntasInscripcion(carrera);

  // Las tecnicaturas toman la paleta de Teclab que declara .inscripcion-teclab
  // (inscripcion.css). El curso conserva el ambar con el que se distingue en el
  // catalogo y en su ficha.
  const estilo = curso
    ? ({ '--career-accent': '#f4aa22', '--career-accent-bright': '#ffc95e' } as CSSProperties)
    : undefined;
  const accent = 'var(--career-accent)';

  // Toda la pagina es de Teclab, asi que el formulario va con la casa fija y solo
  // ofrece sus carreras, como en /teclab.
  const opcionesFormulario = carreras
    .filter(c => tieneInscripcionPropia(c))
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

  // Solo las preguntas que se ven en la pagina: un FAQPage con respuestas que no
  // estan a la vista es de lo que Google penaliza.
  const faqSchema = preguntas.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: preguntas.map(p => ({
          '@type': 'Question',
          name: p.pregunta,
          acceptedAnswer: { '@type': 'Answer', text: p.respuesta },
        })),
      }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(faqSchema) }} />
      )}
      <main className="flex-1">
        <article className={`career-page inscripcion-page inscripcion-teclab ${poppins.variable}`} style={estilo}>
          {/* Arriba de todo, el formulario: la pagina existe para preinscribirse.
              Antes del formulario va solo lo minimo: migas en una linea (llevan
              a la ficha, que es el enlace interno que importa), el H1, que es lo
              que Google lee como tema de la pagina, y la fecha de inicio. Sin
              foto ni boton: empujaban el formulario fuera de la primera pantalla
              del celular. */}
          <header className="inscripcion-encabezado">
            <nav aria-label="Migas de pan" className="inscripcion-migas">
              <Link href="/" prefetch={false}>Inicio</Link>
              <span aria-hidden="true">›</span>
              <Link href={fichaUrl} prefetch={false}>{carrera.nombre_corto || carrera.nombre}</Link>
              <span aria-hidden="true">›</span>
              <span aria-current="page">Inscripción</span>
            </nav>
            <h1>Inscripción {conArticulo(carrera)}</h1>
            <AvisoInicioTeclab carrera={carrera} acento={accent} className="inscripcion-aviso" />
          </header>

          <FormularioLead
            carreras={opcionesFormulario}
            modo="preinscripcion"
            casa="teclab"
            origen="teclab"
            carreraInicial={carrera.id}
          />

          <div className="inscripcion-cuerpo">
            <GuiaInscripcion />
            <PreguntasInscripcion preguntas={preguntas} />
            <p className="inscripcion-volver">
              <Link href={fichaUrl} prefetch={false}>
                Ver la carrera completa <ArrowIcon />
              </Link>
              <span>{curso ? 'Qué vas a aprender y cómo se cursa.' : 'Plan de estudios, competencias y título.'}</span>
            </p>
          </div>
        </article>
      </main>
      <SiteFooter casa="teclab" />
    </>
  );
}
