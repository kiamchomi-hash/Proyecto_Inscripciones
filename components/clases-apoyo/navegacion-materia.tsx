import Link from 'next/link';
import type { MateriaNav } from '@/components/clases-apoyo/tipos';

// Navegación de las páginas de materia. Cada materia es una página propia, así
// que se navega como en cualquier otra: apila historial y sube al tope.

export function VolverAClases() {
  return (
    <Link href="/clases-apoyo" className="ca-volver">
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
      </svg>
      Volver a clases de apoyo
    </Link>
  );
}

// Enlaces reales a las demás materias activas: Google necesita poder seguirlos.
// Llegan ordenadas por `orden` desde la consulta de la página.
export function OtrasMaterias({ materias, actual }: { materias: MateriaNav[]; actual: string }) {
  const otras = materias.filter(m => m.slug !== actual);
  if (!otras.length) return null;

  return (
    <nav className="ca-otras" aria-labelledby="otras-materias-titulo">
      <h2 id="otras-materias-titulo">Otras materias</h2>
      <ul>
        {otras.map(m => (
          <li key={m.id}>
            <Link href={`/clases-apoyo/${m.slug}`}>
              {m.label}
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
