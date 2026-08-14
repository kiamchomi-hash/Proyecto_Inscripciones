import type { Metadata } from 'next';
import ClasesApoyoLanding from '@/components/clases-apoyo/clases-apoyo-landing';
import SiteFooter from '@/components/footer';
import type { MateriaCard } from '@/components/clases-apoyo/clases-apoyo-landing';
import { jsonLdScript } from '@/lib/json-ld';
import { GEO, POSTAL_ADDRESS } from '@/lib/sede';
import { supabase } from '@/lib/supabase';
import './clases-apoyo.css';

const BASE_URL = 'https://www.siglo21sur.com';

export const metadata: Metadata = {
  title: 'Clases de apoyo en Villa Lugano',
  description:
    'Clases de apoyo individuales y presenciales en Villa Lugano y Villa Riachuelo: Matemática, Lengua, Física, Computación y Arte. Guaminí 4876, de lunes a viernes.',
  keywords: [
    'clases de apoyo villa lugano',
    'apoyo escolar villa lugano',
    'clases particulares villa lugano',
    'profesor particular villa riachuelo',
    'apoyo escolar barrio piedrabuena',
    'clases de apoyo mataderos',
  ],
  alternates: {
    canonical: '/clases-apoyo',
  },
};

// Ya no muestra el calendario: dejó de necesitar `force-dynamic` y es estática
// como el resto. La revalida el trigger de `materias` (ver /api/revalidar).
export default async function Page() {
  const { data } = await supabase
    .from('materias')
    .select('id, slug, label, en_construccion, descripcion')
    .eq('activa', true)
    .order('orden', { ascending: true });

  const materias = (data ?? []) as MateriaCard[];

  const servicioSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Clases de apoyo escolar en Villa Lugano',
    serviceType: 'Clases de apoyo escolar',
    description:
      'Clases de apoyo individuales y presenciales de primaria y secundaria en Villa Lugano, de lunes a viernes.',
    url: `${BASE_URL}/clases-apoyo`,
    // Los barrios de los que efectivamente vienen alumnos: la sede está sobre
    // el límite de Lugano con Villa Riachuelo, no en el centro del barrio.
    areaServed: [
      'Villa Lugano',
      'Villa Riachuelo',
      'Villa Soldati',
      'Mataderos',
      'Barrio Piedrabuena',
    ].map(name => ({ '@type': 'Place', name: `${name}, Ciudad Autónoma de Buenos Aires` })),
    provider: {
      '@type': 'EducationalOrganization',
      name: 'CAU Villa Lugano — Universidad Siglo 21',
      url: BASE_URL,
      address: POSTAL_ADDRESS,
      geo: { '@type': 'GeoCoordinates', ...GEO },
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Materias',
      itemListElement: materias
        .filter(m => !m.en_construccion)
        .map(m => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: `Clases de apoyo de ${m.label}`,
            url: `${BASE_URL}/clases-apoyo/${m.slug}`,
          },
        })),
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Clases de apoyo', item: `${BASE_URL}/clases-apoyo` },
    ],
  };

  return (
    <>
      <ClasesApoyoLanding materias={materias} />
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(servicioSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbSchema) }}
      />
    </>
  );
}
