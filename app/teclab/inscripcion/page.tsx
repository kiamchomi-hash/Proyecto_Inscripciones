import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { supabase } from '@/lib/supabase';
import type { Carrera } from '@/components/index/types';
import { SITIO, tieneInscripcionPropia } from '@/components/carreras/inscripcion-carrera';
import FormularioLead from '@/components/formularios/formulario-lead';
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
          <h1 className="sr-only">{TITULO}</h1>

          <FormularioLead alinearAlLlegar carreras={opciones} modo="preinscripcion" casa="teclab" origen="teclab" />

          <section className="inscripcion-proximos" aria-labelledby="proximos-pasos-titulo">
            <div className="inscripcion-proximos-tarjeta">
              <h2 id="proximos-pasos-titulo">Próximos pasos</h2>
              <div className="inscripcion-proximos-contenido">
                <p>Teclab te envía por mail el acceso al portal del alumno una vez gestionada la inscripción. Desde allí elegís el medio de pago y abonás.</p>
              </div>
            </div>
          </section>

        </article>
      </main>
    </>
  );
}
