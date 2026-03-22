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
  const [{ data: carreras, error }, { data: descuentos, error: descError }, { data: meta }] = await Promise.all([
    supabase.from('carreras').select('*').eq('activa', true).order('orden', { ascending: true }),
    supabase.from('descuentos').select('*').eq('activo', true),
    supabase.from('precios_meta').select('promo_especial_matricula, promo_especial_tka, promo_especial_tkb').eq('id', 1).single(),
  ]);

  if (error) {
    console.error('Error fetching carreras:', error.message);
  }
  if (descError) {
    console.error('Error fetching descuentos:', descError.message);
  }

  // Promo especial global: promo_especial_* guarda el % TOTAL (ej: 0.60 = 60%).
  // El slide espera la parte PURA (sin sede/siglo), así que restamos.
  const descuentosData: Descuento[] = descuentos || [];
  const sedeVal = descuentosData.find(d => d.tipo === 'sede')?.porcentaje ?? 0;
  const sigloVal = descuentosData.find(d => d.tipo === 'universidad')?.porcentaje ?? 0;

  const promoGlobalMat = Number(meta?.promo_especial_matricula) || 0;
  const promoGlobalTkA = Number(meta?.promo_especial_tka) || 0;
  const promoGlobalTkB = Number(meta?.promo_especial_tkb) || 0;
  const hasPromoGlobal = promoGlobalMat > 0 || promoGlobalTkA > 0 || promoGlobalTkB > 0;

  // Parte pura = total - siglo (- sede para tickets)
  const puraMat = Math.max(promoGlobalMat * 100 - sigloVal, 0);
  const puraTkA = Math.max(promoGlobalTkA * 100 - sigloVal - sedeVal, 0);
  const puraTkB = Math.max(promoGlobalTkB * 100 - sigloVal - sedeVal, 0);

  const carrerasData: Carrera[] = (carreras || []).map((c: Carrera) => {
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
