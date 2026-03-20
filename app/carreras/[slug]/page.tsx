import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
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
  return carreras.find(c => carreraToSlug(c.nombre) === slug);
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
    openGraph: { title, description },
  };
}

export async function generateStaticParams() {
  const carreras = await getCarreras();
  return carreras.map(c => ({ slug: carreraToSlug(c.nombre) }));
}

export default async function CarreraPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const carreras = await getCarreras();
  const carrera = findBySlug(carreras, slug);
  if (!carrera) notFound();

  return (
    <main className="flex-1">
      <Hero />
      <CareersCatalog carreras={carreras} initialCarreraSlug={slug} />
      <EnrollmentForm carreras={carreras} />
      <IndexFooter />
    </main>
  );
}
