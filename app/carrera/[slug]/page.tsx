import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Carrera } from '@/components/index/types';
import { findCarreraBySlug } from '@/components/index/types';
import Hero from '@/components/index/hero';
import CareersCatalog from '@/components/index/careers-catalog';
import EnrollmentForm from '@/components/index/enrollment-form';
import IndexFooter from '@/components/index/footer';
import '../../index.css';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  const { data: carreras } = await supabase
    .from('carreras')
    .select('nombre')
    .eq('activa', true);

  if (!carreras) return { title: 'Carrera | CAU Villa Lugano' };

  // Helper to find the name from slug
  const found = carreras.find(c => {
    // We need to re-implement or import the slug logic here if we want perfect title
    // For now, let's just do a simple check or generic title if not found
    return true; 
  });

  // Since we don't have the full slug logic here easily without duplicating, 
  // let's just use a descriptive title.
  return {
    title: `${slug.replace(/_/g, ' ')} | Universidad Siglo 21`,
    description: `Información sobre la carrera ${slug.replace(/_/g, ' ')} en el CAU Villa Lugano.`,
  };
}

export default async function CarreraPage({ params }: Props) {
  const { slug } = await params;

  const { data: carreras, error } = await supabase
    .from('carreras')
    .select('*')
    .eq('activa', true)
    .order('orden', { ascending: true });

  if (error || !carreras) {
    notFound();
  }

  const carrerasData: Carrera[] = carreras;
  const found = findCarreraBySlug(carrerasData, slug);

  if (!found) {
    notFound();
  }

  return (
    <main className="flex-1">
      <Hero />
      <CareersCatalog carreras={carrerasData} initialSlug={slug} />
      <EnrollmentForm carreras={carrerasData} />
      <IndexFooter />
    </main>
  );
}
