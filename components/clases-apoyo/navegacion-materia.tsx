import Image from 'next/image';
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

export type MateriaOtra = MateriaNav & { foto: string | null; en_construccion: boolean };

// Enlaces reales a las demás materias activas: Google necesita poder seguirlos.
// Llegan ordenadas por `orden` desde la consulta de la página. Es la misma
// sección en todas las materias, así que no toma el diseño propio de ninguna:
// cada tarjeta lleva la primera foto de su materia.
export function OtrasMaterias({ materias, actual }: { materias: MateriaOtra[]; actual: string }) {
  const otras = materias.filter(m => m.slug !== actual);
  if (!otras.length) return null;

  return (
    <nav className="ca-otras" aria-labelledby="otras-materias-titulo">
      <h2 id="otras-materias-titulo">Otras materias</h2>
      <ul>
        {otras.map(m => (
          <li key={m.id}>
            <Link href={`/clases-apoyo/${m.slug}`} className={`ca-otra${m.foto ? '' : ' ca-otra-sin-foto'}`}>
              {m.foto && (
                <Image src={m.foto} alt="" fill sizes="(max-width: 640px) 50vw, 220px" className="ca-otra-foto" />
              )}
              {m.en_construccion && <span className="ca-otra-pronto">Próximamente</span>}
              <span className="ca-otra-pie">
                <span className="ca-otra-nombre">{m.label}</span>
                {!m.en_construccion && (
                  <span className="ca-otra-flecha" aria-hidden="true">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.75" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
