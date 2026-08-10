import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import {
  type Carrera, type CarreraCatalogo, COLUMNAS_CATALOGO, esCarreraVisible,
} from '@/components/index/types';
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
  // Sólo lo liviano: el texto largo (slides, plan de estudios, secciones) lo
  // baja el catálogo por su cuenta después del primer pintado. `slides` se pide
  // igual, pero para saber si hay y no para mandarla — ver COLUMNAS_DETALLE.
  const { data: carreras, error } = await supabase
    .from('carreras')
    .select(`${COLUMNAS_CATALOGO.join(', ')}, slides`)
    .eq('activa', true)
    .order('orden', { ascending: true });

  if (error) {
    console.error('Error fetching carreras:', error.message);
  }

  const carrerasData: CarreraCatalogo[] = ((carreras || []) as unknown as Carrera[])
    .filter(esCarreraVisible)
    .map(({ slides, ...resto }) => ({ ...resto, tieneSlides: (slides?.length ?? 0) > 0 } as CarreraCatalogo));

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
