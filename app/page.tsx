import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inicio - Carreras Universitarias',
  description: 'Explora mas de 60 carreras universitarias a distancia en CAU Villa Lugano, Universidad Siglo 21.',
};

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-center">
        <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">
          Carreras Universitarias
        </h1>
        <p className="text-xl font-bold mb-2" style={{ color: 'var(--color-highlight)' }}>
          Catalogo de carreras
        </p>
        <p className="text-[#7ca19b] max-w-md mb-8">
          La pagina principal con el catalogo completo de carreras se esta migrando a React.
          Mientras tanto, el contenido completo sigue disponible en la version estatica.
        </p>
      </div>
    </div>
  );
}
