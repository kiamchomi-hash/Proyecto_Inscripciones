import type { Metadata } from 'next';
import ConstructionPage from '@/components/construction-page';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Ubicacion y contacto CAU Villa Lugano. Tu sede Siglo 21 cerca de Celina, Madero y Soldati.',
};

export default function ContactosPage() {
  return <ConstructionPage title="Contacto" />;
}
