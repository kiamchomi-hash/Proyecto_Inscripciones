import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { esCarreraVisible, type Carrera } from '@/components/index/types';
import TestVocacional from '@/components/test-vocacional/test-vocacional';
import './test-vocacional.css';

export const metadata: Metadata = {
  title: 'Test vocacional: descubrí qué carrera va con vos',
  description: 'Respondé un recorrido breve y descubrí las áreas y carreras de Universidad Siglo 21 que más conectan con tus intereses.',
  alternates: { canonical: 'https://www.siglo21sur.com/test-vocacional' },
};

export default async function TestVocacionalPage() {
  const { data } = await supabase.from('carreras').select('id, nombre, nivel, prefix, orden, activa').eq('activa', true).order('orden', { ascending: true }).throwOnError();
  const carreras = ((data ?? []) as Pick<Carrera, 'id' | 'nombre' | 'nivel' | 'prefix' | 'orden'>[])
    .filter(carrera => esCarreraVisible(carrera) && carrera.nivel !== 'Identidad Argentina');
  return (
    <main className="vocacional-page">
      <div className="vocacional-shell"><TestVocacional carreras={carreras} /></div>
    </main>
  );
}
