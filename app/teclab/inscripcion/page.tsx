import type { Metadata } from 'next';
import Link from 'next/link';
import { Poppins } from 'next/font/google';
import { supabase } from '@/lib/supabase';
import type { Carrera } from '@/components/index/types';
import { GuiaInscripcion, SITIO, tieneInscripcionPropia } from '@/components/carreras/inscripcion-carrera';
import FormularioLead from '@/components/formularios/formulario-lead';
import SiteFooter from '@/components/footer';
import { jsonLdScript } from '@/lib/json-ld';
import '../../carreras/career-detail.css';
import '../../carreras/[slug]/inscripcion/inscripcion.css';

// La inscripción a Teclab sin carrera elegida: el mismo formulario que la página
// de inscripción de cada carrera (`/carreras/<slug>/inscripcion`), con el
// selector de todas las de Teclab. Sigue el mismo proceso: preinscripción,
// precio, «Inscribirme» y confirmación. Sirve para difundir una sola dirección.
const RUTA = '/teclab/inscripcion';
const TITULO = 'Inscripción a Teclab';
const DESCRIPCION = 'Preinscribite en una tecnicatura o curso de Teclab, 100% online: elegí la carrera, completá tus datos, mirá el precio y confirmá tu inscripción.';
const IMAGEN_OG = '/imagenes/og/default-teclab-inscripcion.jpg';

// Poppins es la fuente de marca de Teclab. Se carga sólo en sus páginas (no en
// el layout) y llega a la hoja de estilos como --font-poppins.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { absolute: `${TITULO} | Tecnicaturas online` },
  description: DESCRIPCION,
  alternates: { canonical: `${SITIO}${RUTA}` },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'CAU Online',
    url: `${SITIO}${RUTA}`,
    title: TITULO,
    description: DESCRIPCION,
    images: [{ url: IMAGEN_OG, width: 1200, height: 630, alt: 'Tu inscripción en Teclab' }],
  },
  twitter: { card: 'summary_large_image', title: TITULO, description: DESCRIPCION, images: [IMAGEN_OG] },
};

// Como /teclab: la oferta cambia poco y publicar contenido la revalida el
// trigger de `carreras`.
export const revalidate = 3600;

async function getOpciones() {
  const { data } = await supabase
    .from('carreras')
    .select('id, nombre, nivel, duracion, proximamente')
    .eq('activa', true)
    .order('orden', { ascending: true })
    .throwOnError();
  // Sólo las que tienen inscripción propia: Teclab, visibles y ya abiertas. El
  // formulario recibe nada más que lo que muestra, como en la ficha.
  return ((data ?? []) as Pick<Carrera, 'id' | 'nombre' | 'nivel' | 'duracion' | 'proximamente'>[])
    .filter(c => tieneInscripcionPropia(c))
    .map(c => ({ id: c.id, nombre: c.nombre, nivel: c.nivel, duracion: c.duracion }));
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default async function InscripcionTeclabPage() {
  const opciones = await getOpciones();

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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbSchema) }} />
      <main className="flex-1">
        {/* Los colores son los de la inscripción de cada tecnicatura: la paleta de
            Teclab que declara .inscripcion-teclab en inscripcion.css. */}
        <article className={`career-page inscripcion-page inscripcion-teclab ${poppins.variable}`}>
          {/* Como en la inscripción de cada carrera: arriba sólo migas y el H1,
              así el formulario entra en la primera pantalla del celular. */}
          <header className="inscripcion-encabezado">
            <nav aria-label="Migas de pan" className="inscripcion-migas">
              <Link href="/" prefetch={false}>Inicio</Link>
              <span aria-hidden="true">›</span>
              <Link href="/teclab" prefetch={false}>Teclab</Link>
              <span aria-hidden="true">›</span>
              <span aria-current="page">Inscripción</span>
            </nav>
            <h1>{TITULO}</h1>
          </header>

          <FormularioLead carreras={opciones} modo="preinscripcion" casa="teclab" origen="teclab" />

          <div className="inscripcion-cuerpo">
            <GuiaInscripcion />
            <p className="inscripcion-volver">
              <Link href="/teclab" prefetch={false}>
                Ver todas las carreras de Teclab <ArrowIcon />
              </Link>
              <span>Tecnicaturas y cursos, con su plan de estudios.</span>
            </p>
          </div>
        </article>
      </main>
      <SiteFooter casa="teclab" />
    </>
  );
}
