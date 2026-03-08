import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Novedades',
  description: 'Ultimas novedades del CAU Villa Lugano - Universidad Siglo 21.',
};

// TODO: conectar a Supabase tabla `novedades`
export default function NovedadesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-4">Novedades</h1>
      <p style={{ color: 'var(--color-text-light)' }}>Sección en desarrollo. Próximamente conectada a la base de datos.</p>
    </div>
  );
}
