import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import type { Carrera, Descuento } from '@/components/index/types';
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
};

export const revalidate = 3600; // revalidate every hour

export default async function HomePage() {
  const [{ data: carreras, error }, { data: descuentos, error: descError }] = await Promise.all([
    supabase.from('carreras').select('*').eq('activa', true).order('orden', { ascending: true }),
    supabase.from('descuentos').select('*').eq('activo', true),
  ]);

  if (error) {
    console.error('Error fetching carreras:', error.message);
  }
  if (descError) {
    console.error('Error fetching descuentos:', descError.message);
  }

  const carrerasData: Carrera[] = carreras || [];
  const descuentosData: Descuento[] = descuentos || [];

  return (
    <main className="flex-1">
      <Hero />
      <CareersCatalog carreras={carrerasData} descuentos={descuentosData} />
      <EnrollmentForm carreras={carrerasData} />
      <StatsCounter />
      <IndexFooter />
    </main>
  );
}
