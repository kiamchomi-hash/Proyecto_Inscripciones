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
const FormularioLead = dynamic(() => import('@/components/formularios/formulario-lead'));
const SiteFooter = dynamic(() => import('@/components/footer'));
import './index.css';

export const metadata: Metadata = {
  title: { absolute: `Universidad Siglo 21 | CAU Online | Oferta académica ${new Date().getFullYear()}` },
  description: 'Oferta académica online de Universidad Siglo 21, con acompañamiento para estudiantes de CABA, GBA y otras zonas. Consultá carreras e inscripciones.',
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
    <>
      <main className="flex-1">
        <h1 className="sr-only">Universidad Siglo 21 online: carreras e inscripciones</h1>
        <Hero />
        <CareersCatalog carreras={carrerasData} teclabLandingHref="/teclab" />
        {/* Dos formularios y no uno: el contacto es la puerta general y ofrece
            toda la oferta; la preinscripción arma el legajo y sus campos los
            define la casa de la carrera que el lead elija. */}
        <FormularioLead carreras={carrerasData} modo="contacto" origen="home" />
        <FormularioLead carreras={carrerasData} modo="preinscripcion" origen="home" />
        <StatsCounter />
      </main>
      <SiteFooter />
    </>
  );
}
