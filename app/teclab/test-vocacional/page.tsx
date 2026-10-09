import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { supabase } from '@/lib/supabase';
import { esCarreraVisible } from '@/components/index/types';
import { esTeclab } from '@/components/index/teclab';
import TestVocacionalTeclab, { type CarreraTestTeclab } from '@/components/test-vocacional-teclab/test-vocacional-teclab';
import './test-vocacional-teclab.css';

const URL = 'https://www.siglo21sur.com/teclab/test-vocacional';

// Poppins es la fuente de marca de Teclab, igual que en /teclab.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { absolute: 'Test vocacional Teclab: qué tecnicatura va con vos' },
  description: 'Seis preguntas de un toque y te mostramos las tecnicaturas Teclab que más van con vos. Sin registrarte, con asesoramiento por WhatsApp.',
  alternates: { canonical: URL },
};

// Las carreras se leen de Supabase. /api/revalidar rehace esta ruta cuando cambia
// una carrera; la hora es la red de abajo, igual que en /teclab.
export const revalidate = 3600;

async function getCarrerasTeclab(): Promise<CarreraTestTeclab[]> {
  const { data } = await supabase
    .from('carreras')
    .select('id, nombre, nombre_corto, prefix, nivel, orden, proximamente')
    .eq('activa', true)
    .in('nivel', ['Teclab - Tecnología', 'Teclab - Gestión'])
    .order('orden', { ascending: true })
    .throwOnError();

  // Sólo tecnicaturas: el curso de IA quedó fuera del test a pedido (09/10/2026).
  // Una fila sin `orden` va al final: el desempate del test lo usa.
  return (data ?? [])
    .filter(c => esCarreraVisible(c) && esTeclab(c))
    .map(c => ({ ...c, orden: c.orden ?? Number.MAX_SAFE_INTEGER }));
}

export default async function TestVocacionalTeclabPage() {
  const carreras = await getCarrerasTeclab();
  return (
    <main className={`tvt-page ${poppins.variable}`}>
      <div className="tvt-shell">
        <header className="tvt-header">
          <p className="tvt-eyebrow">Test vocacional Teclab</p>
          <h1>¿Qué carrera de Teclab va con vos?</h1>
          <p className="tvt-lead">Seis preguntas, un toque cada una. Al final te mostramos las tres carreras que más se parecen a vos.</p>
        </header>
        <TestVocacionalTeclab carreras={carreras} />
      </div>
    </main>
  );
}
