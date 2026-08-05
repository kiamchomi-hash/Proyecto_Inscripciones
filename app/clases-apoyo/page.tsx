import type { Metadata } from 'next';
import ClasesApoyoPage from '@/components/clases-apoyo/clases-apoyo-page';
import type { MateriaNav } from '@/components/clases-apoyo/clases-apoyo-page';
import { supabase } from '@/lib/supabase';
import './clases-apoyo.css';

export const metadata: Metadata = {
  title: 'Clases de Apoyo',
  description: 'Apoyo pedagógico y académico en Villa Lugano. Clases de Matemática, Lengua, Inglés y más.',
  keywords: ['clases de apoyo', 'villa lugano', 'matemática', 'lengua', 'inglés', 'apoyo escolar', 'clases particulares'],
  alternates: {
    canonical: '/clases-apoyo',
  },
};

export const dynamic = 'force-dynamic';

// La portada no muestra ninguna ficha: sólo necesita los nombres para enlazar
// a las páginas de cada materia.
export default async function Page() {
  const { data: nav } = await supabase
    .from('materias')
    .select('id, slug, label')
    .eq('activa', true)
    .order('orden', { ascending: true });

  return <ClasesApoyoPage materiasNav={(nav ?? []) as MateriaNav[]} />;
}
