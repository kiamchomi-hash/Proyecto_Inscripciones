import type { Metadata } from 'next';
import ContactoPageContent from '@/components/contacto/contacto-page';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Contactá al CAU Villa Lugano, sede de Universidad Siglo 21. WhatsApp, Facebook, Instagram. Guaminí 4876, Villa Lugano, Comuna 8, CABA.',
  keywords: ['contacto', 'CAU villa lugano', 'siglo 21', 'whatsapp', 'Guaminí 4876', 'comuna 8'],
  alternates: {
    canonical: '/contacto',
  },
};

export default function ContactoPage() {
  return <ContactoPageContent />;
}
