import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import type { Carrera, Descuento } from '@/components/index/types';
import type { PreciosMeta } from '@/lib/types';
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
  const [{ data: carreras, error }, { data: descuentos, error: descError }, { data: meta }] = await Promise.all([
    supabase.from('carreras').select('*').eq('activa', true).order('orden', { ascending: true }),
    supabase.from('descuentos').select('*').eq('activo', true),
    supabase.from('precios_meta').select('promo_especial_matricula, promo_especial_tka, promo_especial_tkb, periodo_activo, promo_especial_matricula_1b, promo_especial_tk_1b, beneficio_1b_mat, beneficio_1b_tk').eq('id', 1).single(),
  ]);

  if (error) {
    console.error('Error fetching carreras:', error.message);
  }
  if (descError) {
    console.error('Error fetching descuentos:', descError.message);
  }

  const carrerasValidadas = (carreras || []) as Carrera[];
  const descuentosData = (descuentos || []) as Descuento[];
  const metaData = meta as PreciosMeta | null;
  const sedeVal = descuentosData.find(d => d.tipo === 'sede')?.porcentaje ?? 0;
  const sigloVal = descuentosData.find(d => d.tipo === 'universidad')?.porcentaje ?? 0;

  const periodoActivo = metaData?.periodo_activo || '1A';
  let promoGlobalMat: number, promoGlobalTkA: number, promoGlobalTkB: number;
  if (periodoActivo === '1B') {
    promoGlobalMat = (Number(metaData?.promo_especial_matricula_1b) || 0) + (Number(metaData?.beneficio_1b_mat) || 0);
    promoGlobalTkA = 0;
    promoGlobalTkB = (Number(metaData?.promo_especial_tk_1b) || 0) + (Number(metaData?.beneficio_1b_tk) || 0);
  } else {
    promoGlobalMat = Number(metaData?.promo_especial_matricula) || 0;
    promoGlobalTkA = Number(metaData?.promo_especial_tka) || 0;
    promoGlobalTkB = Number(metaData?.promo_especial_tkb) || 0;
  }
  const hasPromoGlobal = promoGlobalMat > 0 || promoGlobalTkA > 0 || promoGlobalTkB > 0;

  // Parte pura = total - siglo (- sede para tickets)
  const puraMat = Math.max(promoGlobalMat * 100 - sigloVal, 0);
  const puraTkA = Math.max(promoGlobalTkA * 100 - sigloVal - sedeVal, 0);
  const puraTkB = Math.max(promoGlobalTkB * 100 - sigloVal - sedeVal, 0);

  const carrerasData: Carrera[] = carrerasValidadas.map((c: Carrera) => {
    if (!hasPromoGlobal) return c;
    const esp = c.descuento_especial;
    return {
      ...c,
      descuento_especial: {
        matricula: promoGlobalMat > 0 ? puraMat : (esp?.matricula ?? null),
        ticket_a: promoGlobalTkA > 0 ? puraTkA : (esp?.ticket_a ?? null),
        ticket_b: promoGlobalTkB > 0 ? puraTkB : (esp?.ticket_b ?? null),
      },
    };
  });

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
