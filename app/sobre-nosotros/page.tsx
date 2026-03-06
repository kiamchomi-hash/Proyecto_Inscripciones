import type { Metadata } from 'next';
import ConstructionPage from '@/components/construction-page';

export const metadata: Metadata = {
  title: 'Sobre Nosotros',
  description: 'Somos el Centro de Aprendizaje Universitario lider en Villa Lugano.',
};

export default function SobreNosotrosPage() {
  return <ConstructionPage title="Sobre Nosotros" />;
}
