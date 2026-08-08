import Link from 'next/link';
import { sanitizeContent } from '@/lib/sanitize-content';

// La portada dejó de ser la app con el calendario: es una página normal, con
// contenido propio y una tarjeta por materia. Es server component a propósito
// —no hay nada interactivo— para que no viaje JS y la ruta pueda ser estática.
export interface MateriaCard {
  id: string;
  slug: string;
  label: string;
  en_construccion: boolean;
  descripcion: string[] | null;
}

/* ── Íconos por materia ──
   Se eligen por slug. Una materia nueva sin ícono cae en el genérico en vez de
   romper la grilla, así que agregar una fila en Supabase alcanza para verla. */
const ICONOS: Record<string, React.ReactNode> = {
  matematica: (
    <>
      <path d="M4 7h6M7 4v6" strokeLinecap="round" />
      <path d="M14 6.5h6M14 17.5h6M14 20.5h6" strokeLinecap="round" />
      <path d="M4.5 17.5l5 5M9.5 17.5l-5 5" strokeLinecap="round" />
    </>
  ),
  lengua: (
    <>
      <path d="M4 5.5A1.5 1.5 0 015.5 4H10a2 2 0 012 2v13a1.5 1.5 0 00-1.5-1.5h-5A1.5 1.5 0 014 16z" />
      <path d="M20 5.5A1.5 1.5 0 0018.5 4H14a2 2 0 00-2 2v13a1.5 1.5 0 011.5-1.5h5A1.5 1.5 0 0020 16z" />
    </>
  ),
  computacion: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" strokeLinecap="round" />
    </>
  ),
  'fisico-quimica': (
    <>
      <path d="M9.5 3v6.2L4.6 18a2 2 0 001.7 3h11.4a2 2 0 001.7-3l-4.9-8.8V3" />
      <path d="M8.5 3h7" strokeLinecap="round" />
      <path d="M7.2 14h9.6" strokeLinecap="round" />
    </>
  ),
  ingles: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.2 2.3 3.3 5.3 3.3 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.3-5.3-3.3-8.5S9.8 5.8 12 3.5z" />
    </>
  ),
  arte: (
    <>
      <path d="M12 3.5a8.5 8.5 0 000 17c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6h1.9a4.2 4.2 0 004.2-4.2c0-4.1-3.8-7.4-8.5-7.4z" />
      <circle cx="7.8" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9.9" cy="8.2" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.4" cy="8" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  secundario: (
    <>
      <path d="M12 4L2.5 8.8 12 13.6l9.5-4.8z" />
      <path d="M6.5 11.2v4.6c0 .5.3 1 .8 1.3 1.3.7 3 1.1 4.7 1.1s3.4-.4 4.7-1.1c.5-.3.8-.8.8-1.3v-4.6" />
      <path d="M21.5 8.8v5" strokeLinecap="round" />
    </>
  ),
};

const ICONO_GENERICO = (
  <>
    <path d="M4 5.5A1.5 1.5 0 015.5 4h11A1.5 1.5 0 0118 5.5v15l-4-2.5-4 2.5" />
    <path d="M8 8.5h6" strokeLinecap="round" />
  </>
);

function IconoMateria({ slug }: { slug: string }) {
  return (
    <svg
      className="ca-card-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONOS[slug] ?? ICONO_GENERICO}
    </svg>
  );
}

/* ── Tarjeta ──
   La materia en construcción no es un enlace: su página es el cartel de "vuelva
   pronto" y ya está en noindex, así que mandar gente (y a Google) ahí sólo
   reparte autoridad hacia una página vacía. */
function Tarjeta({ materia }: { materia: MateriaCard }) {
  const blurb = materia.descripcion?.[0];

  if (materia.en_construccion) {
    return (
      <div className="ca-card ca-card-off" aria-label={`${materia.label} — próximamente`}>
        <span className="ca-card-ico">
          <IconoMateria slug={materia.slug} />
        </span>
        <h3 className="ca-card-title">{materia.label}</h3>
        <span className="ca-card-badge">Próximamente</span>
      </div>
    );
  }

  return (
    <Link href={`/clases-apoyo/${materia.slug}`} className="ca-card">
      <span className="ca-card-ico">
        <IconoMateria slug={materia.slug} />
      </span>
      <h3 className="ca-card-title">{materia.label}</h3>
      {blurb && (
        <p className="ca-card-blurb" dangerouslySetInnerHTML={{ __html: sanitizeContent(blurb) }} />
      )}
      <span className="ca-card-cta">
        Ver horarios
        <span className="ca-card-arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
    </Link>
  );
}

export default function ClasesApoyoLanding({ materias }: { materias: MateriaCard[] }) {
  return (
    <div className="ca-landing">
      {/* Encabezado corto a propósito: lo que la persona vino a buscar son las
          materias, así que la primera tarjeta tiene que entrar en pantalla. El
          detalle largo va abajo, después de la grilla. */}
      <header className="ca-landing-hero">
        <h1>
          Clases de apoyo en <span>Villa Lugano</span>
        </h1>
        <p className="ca-landing-lead">
          Individuales y presenciales en Guaminí 4876, de lunes a viernes.
        </p>
        <ul className="ca-landing-datos">
          <li>Un alumno por turno</li>
          <li>Primaria y secundaria</li>
          <li>Descuento por continuidad</li>
        </ul>
      </header>

      <section className="ca-landing-grid-wrap" aria-labelledby="ca-materias-titulo">
        <h2 id="ca-materias-titulo" className="sr-only">Materias</h2>
        <div className="ca-card-grid">
          {materias.map(m => (
            <Tarjeta key={m.id} materia={m} />
          ))}
        </div>
      </section>

      <section className="ca-landing-zona" aria-labelledby="ca-zona-titulo">
        <h2 id="ca-zona-titulo">A quién le queda cerca</h2>
        <p>
          La sede está en <strong>Guaminí 4876</strong>, sobre el límite de Villa Lugano con{' '}
          <strong>Villa Riachuelo</strong>, a pocas cuadras de Avenida Piedra Buena y de General
          Paz. Vienen alumnos de Villa Lugano, Villa Riachuelo, el Barrio Piedrabuena, Lugano I y
          II, Villa Soldati y Mataderos.
        </p>
        <p>
          Hay siete escuelas primarias y secundarias a menos de un kilómetro, y más de cincuenta a
          menos de tres. Se trabaja sobre los temas que estás viendo en tu escuela —del distrito
          escolar que sea— y no sobre un programa cerrado: traés la carpeta y la consigna, y se
          arranca por ahí.
        </p>
      </section>
    </div>
  );
}
