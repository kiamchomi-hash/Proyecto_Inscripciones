import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { notFound, redirect } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Carrera } from '@/components/index/types';
import { carreraToSlug } from '@/components/index/types';
import Hero from '@/components/index/hero';
import '@/app/index.css';

const CareersCatalog = dynamic(() => import('@/components/index/careers-catalog'));
const EnrollmentForm = dynamic(() => import('@/components/index/enrollment-form'));
const IndexFooter = dynamic(() => import('@/components/index/footer'));

export const revalidate = 3600;

async function getCarreras() {
  const { data } = await supabase
    .from('carreras')
    .select('*')
    .eq('activa', true)
    .order('orden', { ascending: true });
  return (data || []) as Carrera[];
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

  const title = `${carrera.nombre} | Universidad Siglo 21 CAU Villa Lugano`;
  const description = `Estudia ${carrera.nombre} en Universidad Siglo 21 CAU Villa Lugano. ${carrera.nivel} · ${carrera.duracion}. Modalidad virtual, cerca de Zona Sur y Oeste.`;

  return {
    title,
    description,
    keywords: [carrera.nombre, 'universidad siglo 21', 'villa lugano', carrera.nivel, 'estudiar a distancia', 'CABA'],
    openGraph: { title, description },
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
    redirect(`/carreras/${canonicalSlug}`);
  }

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": carrera.titulo || carrera.nombre,
    "description": `Estudia ${carrera.nombre} en Universidad Siglo 21 CAU Villa Lugano. ${carrera.enfoque}.`,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <main className="flex-1">
        <Hero />
        <CareersCatalog carreras={carreras} initialCarreraSlug={slug} />
        <EnrollmentForm carreras={carreras} />
        <IndexFooter />
      </main>
    </>
  );
}
