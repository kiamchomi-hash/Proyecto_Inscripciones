import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import type { Carrera } from '@/components/index/types';
import Hero from '@/components/index/hero';
import StatsCounter from '@/components/index/stats-counter';
import CareersCatalog from '@/components/index/careers-catalog';

// Dynamic imports for components below the fold
const EnrollmentForm = dynamic(() => import('@/components/index/enrollment-form'));
const IndexFooter = dynamic(() => import('@/components/index/footer'));
import './index.css';

export const metadata: Metadata = {
  title: `Universidad Siglo 21 CAU Villa Lugano | Oferta académica ${new Date().getFullYear()}`,
  description: 'Oferta académica Universidad Siglo 21 en Villa Lugano. Ideal para Zona Sur y Oeste: Celina, Madero, Tapiales, Soldati, Mataderos, Riachuelo, Budge.',
  alternates: {
    canonical: 'https://www.siglo21sur.com',
  },
};

export const revalidate = 3600; // revalidate every hour

export default async function HomePage() {
  const { data: carreras, error } = await supabase
    .from('carreras')
    .select('*')
    .eq('activa', true)
    .order('orden', { ascending: true });

  if (error) {
    console.error('Error fetching carreras:', error.message);
  }

  const carrerasData = (carreras || []) as Carrera[];

  return (
    <main className="flex-1">
      <h1 className="sr-only">Universidad Siglo 21 en Villa Lugano: carreras e inscripciones</h1>
      <Hero />
      <CareersCatalog carreras={carrerasData} />
      <EnrollmentForm carreras={carrerasData} />
      <StatsCounter />
      <IndexFooter />
    </main>
  );
}
