import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ReservaClase from '@/components/clases-apoyo/reserva/reserva-clase';
import MateriaGenerica from '@/components/clases-apoyo/materia-generica';
import ComputacionPixel from '@/components/clases-apoyo/computacion/computacion-pixel';
import { OtrasMaterias, VolverAClases } from '@/components/clases-apoyo/navegacion-materia';
import type { MateriaDB, MateriaNav } from '@/components/clases-apoyo/tipos';
import TextoMateria from '@/components/clases-apoyo/texto-materia';
import SiteFooter from '@/components/footer';
import { jsonLdScript } from '@/lib/json-ld';
import { supabase } from '@/lib/supabase';
import '../clases-apoyo.css';
import '../reserva-clase.css';
import '../computacion.css';

const BASE_URL = 'https://www.siglo21sur.com';

// Sólo las columnas que la ficha activa realmente usa. La navegación pide
// aparte id/slug/label de todas: ver el comentario de MateriaNav.
const CAMPOS_FICHA =
  'id, slug, label, nombre_profesor, whatsapp, telefono_display, descripcion, imagenes, en_construccion, orden, modo_manana, dias_bloqueados, horarios_bloqueados, texto_seo';

type Ficha = MateriaDB & { texto_seo: string[] | null };

async function getMateria(slug: string): Promise<Ficha | null> {
  const pedir = (campos: string) =>
    supabase
      .from('materias')
      .select(campos)
      .eq('activa', true)
      .eq('slug', slug)
      .maybeSingle();

  const { data, error } = await pedir(CAMPOS_FICHA);
  if (!error) return (data as unknown as Ficha) ?? null;

  // texto_seo lo agrega sql/2026-08-04_texto_seo_materias.sql, que se corre a
  // mano. Si el deploy llega antes que el SQL, PostgREST rechaza la consulta
  // entera por la columna que falta y las seis páginas darían 404. Se reintenta
  // sin ella: la ficha se sirve igual, sólo sin el texto de abajo.
  const { data: basica } = await pedir(CAMPOS_FICHA.replace(', texto_seo', ''));
  return basica ? ({ ...(basica as unknown as MateriaDB), texto_seo: null }) : null;
}

export async function generateStaticParams() {
  const { data } = await supabase
    .from('materias')
    .select('slug')
    .eq('activa', true);
  return (data ?? []).map(m => ({ materia: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ materia: string }> }): Promise<Metadata> {
  const { materia } = await params;
  const ficha = await getMateria(materia);
  if (!ficha) return { title: 'Materia no encontrada' };

  // El label viene de la base con los acentos puestos; derivarlo del slug daba
  // "Computacion" y "Ingles".
  const label = ficha.label;

  return {
    title: { absolute: `Clases particulares de ${label} en Villa Lugano | CAU Siglo 21` },
    description: `Clases particulares y apoyo escolar de ${label} en Villa Lugano: presenciales, individuales o en grupo reducido, con horario a convenir. Guaminí 4876.`,
    alternates: { canonical: `${BASE_URL}/clases-apoyo/${ficha.slug}` },
    // Una materia en construcción no tiene contenido propio que indexar: es el
    // cartel de "vuelva pronto". Se deja fuera del índice hasta que lo tenga
    // (el sitemap la omite por lo mismo).
    ...(ficha.en_construccion ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function Page({ params }: { params: Promise<{ materia: string }> }) {
  const { materia } = await params;

  const [ficha, { data: nav }] = await Promise.all([
    getMateria(materia),
    supabase
      .from('materias')
      .select('id, slug, label')
      .eq('activa', true)
      .order('orden', { ascending: true }),
  ]);

  if (!ficha) notFound();

  const url = `${BASE_URL}/clases-apoyo/${ficha.slug}`;

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Clases particulares de ${ficha.label}`,
    serviceType: 'Clases de apoyo escolar',
    description: `Clases particulares de ${ficha.label} en Villa Lugano, presenciales.`,
    url,
    areaServed: { '@type': 'Place', name: 'Villa Lugano, Ciudad Autónoma de Buenos Aires' },
    provider: {
      '@type': 'EducationalOrganization',
      name: 'CAU Villa Lugano — Universidad Siglo 21',
      url: BASE_URL,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Guaminí 4876',
        addressLocality: 'Villa Lugano',
        addressRegion: 'Ciudad Autónoma de Buenos Aires',
        addressCountry: 'AR',
      },
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Clases de apoyo', item: `${BASE_URL}/clases-apoyo` },
      { '@type': 'ListItem', position: 3, name: ficha.label, item: url },
    ],
  };

  return (
    <>
      <div className="ca-materia-pagina">
        <VolverAClases />
        {/* Cada materia puede tener su diseño propio; la que no, usa la ficha
            genérica. En construcción siempre va la genérica, con su cartel. */}
        {ficha.slug === 'computacion' && !ficha.en_construccion
          ? <ComputacionPixel materia={ficha} />
          : <MateriaGenerica materia={ficha} />}
        {/* Al cliente viaja sólo lo que la reserva usa, no la ficha entera. */}
        {!ficha.en_construccion && (
          <ReservaClase
            materia={{
              id: ficha.id,
              slug: ficha.slug,
              modo_manana: ficha.modo_manana,
              dias_bloqueados: ficha.dias_bloqueados,
              horarios_bloqueados: ficha.horarios_bloqueados,
            }}
          />
        )}
        <OtrasMaterias materias={(nav ?? []) as MateriaNav[]} actual={ficha.slug} />
      </div>
      <TextoMateria label={ficha.label} parrafos={ficha.texto_seo} />
      <SiteFooter />
      {!ficha.en_construccion && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(serviceSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbSchema) }}
      />
    </>
  );
}
