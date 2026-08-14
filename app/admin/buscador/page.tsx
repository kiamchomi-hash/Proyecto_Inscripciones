import type { Metadata } from 'next';

import BuscadorWorkspace from '@/components/admin/buscador-workspace';
import { leerVentasSnapshot } from '@/lib/ventas-snapshot';
import './buscador.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Carreras y precios',
  description: 'Buscador comercial privado del CAU Villa Lugano.',
  manifest: '/admin/buscador/manifest.webmanifest',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: 'Carreras CAU',
    statusBarStyle: 'black-translucent',
  },
};

export default async function BuscadorPage() {
  const snapshot = await leerVentasSnapshot();

  return (
    <BuscadorWorkspace
      html={snapshot?.html ?? null}
      meta={snapshot?.meta ?? null}
      source={snapshot?.source ?? null}
    />
  );
}
