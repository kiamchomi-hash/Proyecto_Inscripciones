import type { Metadata } from 'next';
import FaqPageContent from '@/components/faq-page';
import { supabase } from '@/lib/supabase';
import './faq.css';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes',
  description: 'Resolvé tus dudas sobre cursada, exámenes y aranceles en CAU Villa Lugano. La universidad cerca de Celina y todo Zona Sur/Oeste.',
};

export default async function FaqPage() {
  const { data } = await supabase
    .from('faq_preguntas')
    .select('id, titulo, descripcion, respuesta, created_at')
    .eq('estado', 'aprobada')
    .eq('destacada', true)
    .order('orden', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(5);

  return <FaqPageContent initialQuestions={data ?? []} />;
}
