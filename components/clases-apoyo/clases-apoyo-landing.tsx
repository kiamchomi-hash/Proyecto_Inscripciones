import Link from 'next/link';
import { sanitizeContent } from '@/lib/sanitize-content';
import { NUMERO_CAU } from '@/lib/whatsapp';

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

/* El botón de WhatsApp del hero. Lleva el número escrito del CAU: el reparto
   entre asesores lo hace `whatsapp-reparto.tsx` al hacer clic, en el navegador
   (la página es estática, elegir al renderizar le daría el mismo a todos). */
const WA_HREF = `https://wa.me/${NUMERO_CAU}?text=${encodeURIComponent(
  'Hola, quiero consultar por las clases de apoyo',
)}`;

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
  fisica: (
    <>
      <circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" />
      <ellipse cx="12" cy="12" rx="9.5" ry="4" />
      <ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(120 12 12)" />
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

/* ── Baldosa de materia ──
   La materia en construcción no es un enlace: su página es el cartel de "vuelva
   pronto" y ya está en noindex, así que mandar gente (y a Google) ahí sólo
   reparte autoridad hacia una página vacía. */
function Tarjeta({ materia }: { materia: MateriaCard }) {
  const blurb = materia.descripcion?.[0];

  if (materia.en_construccion) {
    return (
      <div className="ca-tile ca-card ca-card-off" aria-label={`${materia.label} — próximamente`}>
        <span className="ca-card-ico">
          <IconoMateria slug={materia.slug} />
        </span>
        <h3 className="ca-card-title">{materia.label}</h3>
        <span className="ca-card-badge">Próximamente</span>
      </div>
    );
  }

  return (
    <Link href={`/clases-apoyo/${materia.slug}`} className="ca-tile ca-card">
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

/* ── Ícono de WhatsApp ── */
function IconoWhatsapp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.8 11.8 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.82 11.82 0 0 0 20.465 3.49" />
    </svg>
  );
}

/* Los datos duros. Es lo que la persona pregunta antes que cualquier otra cosa,
   así que van arriba y no enterrados en un párrafo. */
const DATOS = [
  { k: 'Modalidad', v: 'Individual y presencial' },
  { k: 'Niveles', v: 'Primaria y secundaria' },
  { k: 'Días', v: 'Lunes a viernes, a elección' },
  { k: 'Dónde', v: 'Guaminí 4876, Villa Lugano' },
];

const PASOS = [
  {
    t: 'Elegís la materia',
    d: 'Entrás a la materia que necesitás y ves los días y horarios que tiene libres.',
  },
  {
    t: 'Marcás tu horario',
    d: 'Tocás el día y la hora que te queden cómodos y dejás tu nombre y tu teléfono.',
  },
  {
    t: 'Te escribe el profesor',
    d: 'Te confirma por WhatsApp y venís con la carpeta y los temas que estés viendo.',
  },
];

const BARRIOS = [
  'Villa Lugano',
  'Villa Riachuelo',
  'Barrio Piedrabuena',
  'Lugano I y II',
  'Villa Soldati',
  'Mataderos',
];

export default function ClasesApoyoLanding({ materias }: { materias: MateriaCard[] }) {
  return (
    <div className="ca-pagina">
      {/* ── Titular, datos y descuento ──
          Tres baldosas de la misma grilla: el titular ocupa las dos filas de la
          columna ancha y las otras dos se apilan al costado. */}
      <section className="ca-bento ca-bento-hero">
        <header className="ca-tile ca-tile-titular">
          <p className="ca-eyebrow">
            <span className="ca-eyebrow-dot" aria-hidden="true" />
            Guaminí 4876 — Villa Lugano
          </p>
          <h1>
            Clases de apoyo en <span>Villa Lugano</span>
          </h1>
          <p className="ca-deck">
            Traés los temas que estás viendo en la escuela y se trabaja sobre eso, al ritmo que te
            haga falta. Sin programa cerrado y sin cursos armados.
          </p>
          <div className="ca-acciones">
            <a className="ca-btn ca-btn-wa" href={WA_HREF} target="_blank" rel="noopener nofollow">
              <IconoWhatsapp />
              Consultar por WhatsApp
            </a>
            <a className="ca-btn ca-btn-ghost" href="#ca-materias">
              Ver las materias
            </a>
          </div>
        </header>

        <div className="ca-bento-col">
          <div className="ca-tile" aria-label="Datos de las clases">
            <dl className="ca-datos">
              {DATOS.map(d => (
                <div key={d.k}>
                  <dt>{d.k}</dt>
                  <dd>{d.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="ca-tile ca-tile-oro ca-tile-nota">
            <h3>Descuento por continuidad</h3>
            <p>
              Quienes vienen <strong>todas las semanas</strong> pagan menos. Si necesitás una sola
              clase antes de una prueba, también se puede.
            </p>
          </div>
        </div>
      </section>

      {/* ── Materias ──
          Ocho casillas: las siete materias y el WhatsApp. Con tres columnas la
          última fila quedaba con una sola baldosa colgada. */}
      <h2 className="ca-grupo-label" id="ca-materias">Materias</h2>
      <section className="ca-bento ca-bento-materias" aria-labelledby="ca-materias">
        {materias.map(m => (
          <Tarjeta key={m.id} materia={m} />
        ))}
        <a className="ca-tile ca-card ca-card-wa" href={WA_HREF} target="_blank" rel="noopener nofollow">
          <span className="ca-card-ico">
            <IconoWhatsapp />
          </span>
          <h3 className="ca-card-title">¿No sabés cuál?</h3>
          <p className="ca-card-blurb">Escribinos y te decimos qué materia y qué horario te convienen.</p>
          <span className="ca-card-cta">
            Escribinos
            <span className="ca-card-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </span>
        </a>
      </section>

      {/* ── Los tres pasos ──
          El camino hasta la clase no estaba escrito en ningún lado: quien
          entraba tenía que deducirlo del botón "Ver horarios". */}
      <h2 className="ca-grupo-label" id="ca-pasos">Cómo se pide una clase</h2>
      <ol className="ca-bento ca-bento-pasos" aria-labelledby="ca-pasos">
        {PASOS.map((p, i) => (
          <li key={p.t} className="ca-tile ca-paso">
            <span className="ca-paso-n" aria-hidden="true">
              {i + 1}
            </span>
            <h3>{p.t}</h3>
            <p>{p.d}</p>
          </li>
        ))}
      </ol>

      {/* ── Texto largo ── */}
      <section className="ca-bento ca-bento-texto">
        <article className="ca-tile ca-tile-texto">
          <h2>Cómo son las clases</h2>
          <p>
            <strong>Individuales y presenciales</strong>, en Guaminí 4876, de lunes a viernes. No
            hay un programa cerrado: se trabaja con la carpeta y las consignas de tu propia
            escuela, sea del distrito que sea.
          </p>
          <p>
            Para tomar una clase entrás a la materia, elegís el día y el horario que te queden
            cómodos, dejás tus datos y te responde el profesor por WhatsApp.
          </p>
        </article>

        <article className="ca-tile ca-tile-texto">
          <h2>A quién le queda cerca</h2>
          <p>
            La sede está sobre el límite de Villa Lugano con Villa Riachuelo, a pocas cuadras de
            Avenida Piedra Buena y de General Paz. Hay siete escuelas a menos de un kilómetro y más
            de cincuenta a menos de tres.
          </p>
          <ul className="ca-barrios">
            {BARRIOS.map(b => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
