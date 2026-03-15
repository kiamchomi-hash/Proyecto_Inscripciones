import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import type { Carrera } from '@/components/index/types';
import Hero from '@/components/index/hero';
import CareersCatalog from '@/components/index/careers-catalog';
import EnrollmentForm from '@/components/index/enrollment-form';
import IndexFooter from '@/components/index/footer';
import './index.css';

export const metadata: Metadata = {
  title: 'Universidad Siglo 21 - CAU Villa Lugano: Oferta académica 2026',
  description: 'Oferta académica Universidad Siglo 21 en Villa Lugano. Ideal para Zona Sur y Oeste: Celina, Madero, Tapiales, Soldati, Mataderos, Riachuelo, Budge.',
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

  const carrerasData: Carrera[] = carreras || [];

  return (
    <main className="flex-1">
      <Hero />
      <CareersCatalog carreras={carrerasData} />
      <EnrollmentForm carreras={carrerasData} />
      <IndexFooter />
    </main>
  );
}
