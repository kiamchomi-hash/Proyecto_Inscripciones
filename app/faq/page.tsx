import type { Metadata } from 'next';
import FaqPageContent from '@/components/faq-page';
import { supabase } from '@/lib/supabase';
import './faq.css';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes',
  description: 'Resolvé tus dudas sobre cursada, exámenes y aranceles en CAU Villa Lugano. La universidad cerca de Celina y todo Zona Sur/Oeste.',
  keywords: ['preguntas frecuentes', 'siglo 21', 'villa lugano', 'cursada', 'exámenes', 'aranceles', 'inscripción'],
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'Preguntas Frecuentes — CAU Villa Lugano',
    description: 'Resolvé tus dudas sobre cursada, exámenes y aranceles en CAU Villa Lugano. La universidad cerca de Celina y todo Zona Sur/Oeste.',
    url: '/faq',
    siteName: 'CAU Villa Lugano — Universidad Siglo 21',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Preguntas Frecuentes — CAU Villa Lugano',
    description: 'Resolvé tus dudas sobre cursada, exámenes y aranceles en CAU Villa Lugano.',
  },
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

  const faqs = data ?? [];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(q => ({
      "@type": "Question",
      "name": q.titulo,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.respuesta,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FaqPageContent initialQuestions={faqs} />
    </>
  );
}
