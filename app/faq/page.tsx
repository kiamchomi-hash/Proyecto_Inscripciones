import type { Metadata } from 'next';
import ConstructionPage from '@/components/construction-page';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes',
  description: 'Respuestas a las preguntas mas frecuentes sobre CAU Villa Lugano y Universidad Siglo 21.',
};

export default function FaqPage() {
  return <ConstructionPage title="Preguntas Frecuentes" />;
}
