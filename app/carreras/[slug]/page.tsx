import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Carrera } from '@/components/index/types';
import { carreraToSlug, carreraFullName, esCarreraVisible } from '@/components/index/types';
import CareerDetail from '@/components/carreras/career-detail';
import DeferredEnrollmentForm from '@/components/carreras/deferred-enrollment-form';
import ResetScrollDesdeModal from '@/components/carreras/reset-scroll-modal';
import IndexFooter from '@/components/index/footer';
import '../career-detail.css';

export const revalidate = 3600;

async function getCarreras() {
  const { data } = await supabase
    .from('carreras')
    .select('*')
    .eq('activa', true)
    .order('orden', { ascending: true });
  // Solo la oferta vigente: los niveles fuera del catalogo no tienen pagina.
  return ((data || []) as Carrera[]).filter(esCarreraVisible);
}

function findBySlug(carreras: Carrera[], slug: string): Carrera | undefined {
  // Try exact match first
  const exact = carreras.find(c => carreraToSlug(c) === slug);
  if (exact) return exact;
  // Try old format (underscores, mixed case) → normalize and match
  const normalized = slug.toLowerCase().replace(/_/g, '-');
  return carreras.find(c => carreraToSlug(c) === normalized);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const carreras = await getCarreras();
  const carrera = findBySlug(carreras, slug);
  if (!carrera) return { title: 'Carrera no encontrada' };

  // Nombre completo con prefijo ("Licenciatura en Administracion", no solo
  // "Administracion"): es el termino que la gente busca y da mejor CTR.
  const nombreCompleto = carreraFullName(carrera);
  const title = `${nombreCompleto} | Universidad Siglo 21 CAU Villa Lugano`;
  const description = `Estudia ${nombreCompleto} en Universidad Siglo 21 CAU Villa Lugano. ${carrera.nivel} · ${carrera.duracion}. Modalidad virtual, cerca de Zona Sur y Oeste.`;

  const canonicalSlug = carreraToSlug(carrera);

  return {
    title,
    description,
    keywords: [nombreCompleto, carrera.nombre, 'universidad siglo 21', 'villa lugano', carrera.nivel, 'estudiar a distancia', 'CABA'],
    alternates: {
      canonical: `https://www.siglo21sur.com/carreras/${canonicalSlug}`,
    },
    openGraph: { title, description, url: `https://www.siglo21sur.com/carreras/${canonicalSlug}` },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export async function generateStaticParams() {
  const carreras = await getCarreras();
  return carreras.map(c => ({ slug: carreraToSlug(c) }));
}

export default async function CarreraPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const carreras = await getCarreras();

  const carrera = findBySlug(carreras, slug);
  if (!carrera) notFound();

  // Redirect old format URLs to new canonical slug
  const canonicalSlug = carreraToSlug(carrera);
  if (slug !== canonicalSlug) {
    permanentRedirect(`/carreras/${canonicalSlug}`);
  }

  const url = `https://www.siglo21sur.com/carreras/${canonicalSlug}`;

  // Otras carreras del mismo nivel: dan enlaces internos entre paginas de carrera.
  // Solo se manda lo que se pinta; la fila entera arrastra todos los slides.
  const relacionadas = carreras
    .filter(c => c.nivel === carrera.nivel && c.id !== carrera.id)
    .slice(0, 8)
    .map(c => ({ id: c.id, nombre: c.nombre, prefix: c.prefix }));

  // El formulario solo necesita id/nombre/nivel: mandarle la fila entera metia
  // todas las carreras completas en el HTML de cada pagina.
  const opcionesFormulario = carreras.map(c => ({ id: c.id, nombre: c.nombre, nivel: c.nivel }));

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": carreraFullName(carrera),
    "url": url,
    "description": carrera.descripcion || `Estudia ${carrera.nombre} en Universidad Siglo 21 CAU Villa Lugano. ${carrera.enfoque}.`,
    "provider": {
      "@type": "CollegeOrUniversity",
      "name": "Universidad Siglo 21",
      "url": "https://21.edu.ar",
    },
    "educationalLevel": carrera.nivel,
    "timeToComplete": carrera.duracion,
    "educationalCredentialAwarded": carrera.titulo,
    "inLanguage": "es",
    "courseMode": "blended",
    "location": {
      "@type": "Place",
      "name": "CAU Villa Lugano",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Guaminí 4876",
        "addressLocality": "Villa Lugano",
        "addressRegion": "CABA",
        "addressCountry": "AR",
      },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.siglo21sur.com" },
      { "@type": "ListItem", "position": 2, "name": carreraFullName(carrera), "item": url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main className="flex-1">
        <ResetScrollDesdeModal />
        <CareerDetail carrera={carrera} relacionadas={relacionadas} />
        <DeferredEnrollmentForm carreras={opcionesFormulario} />
        <IndexFooter />
      </main>
    </>
  );
}
