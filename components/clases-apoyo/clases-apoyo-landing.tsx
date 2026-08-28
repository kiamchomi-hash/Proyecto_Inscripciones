import Image from 'next/image';
import Link from 'next/link';
import { sanitizeContent } from '@/lib/sanitize-content';
import { MAPS_URL } from '@/lib/sede';

// La portada es un Server Component a propósito: toda la interacción es
// navegación nativa y CSS, así que no necesita enviar JavaScript al navegador.
export interface MateriaCard {
  id: string;
  slug: string;
  label: string;
  en_construccion: boolean;
  descripcion: string[] | null;
}

const ICONOS: Record<string, React.ReactNode> = {
  matematica: <><path d="M4 7h6M7 4v6" strokeLinecap="round" /><path d="M14 6.5h6M14 17.5h6M14 20.5h6" strokeLinecap="round" /><path d="M4.5 17.5l5 5M9.5 17.5l-5 5" strokeLinecap="round" /></>,
  lengua: <><path d="M4 5.5A1.5 1.5 0 015.5 4H10a2 2 0 012 2v13a1.5 1.5 0 00-1.5-1.5h-5A1.5 1.5 0 014 16z" /><path d="M20 5.5A1.5 1.5 0 0018.5 4H14a2 2 0 00-2 2v13a1.5 1.5 0 011.5-1.5h5A1.5 1.5 0 0020 16z" /></>,
  computacion: <><rect x="3" y="4" width="18" height="12" rx="1.5" /><path d="M8 20h8M12 16v4" strokeLinecap="round" /></>,
  fisica: <><circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" /><ellipse cx="12" cy="12" rx="9.5" ry="4" /><ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(120 12 12)" /></>,
  ingles: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.2 2.3 3.3 5.3 3.3 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.3-5.3-3.3-8.5S9.8 5.8 12 3.5z" /></>,
  arte: <><path d="M12 3.5a8.5 8.5 0 000 17c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6h1.9a4.2 4.2 0 004.2-4.2c0-4.1-3.8-7.4-8.5-7.4z" /><circle cx="7.8" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="9.9" cy="8.2" r="1.1" fill="currentColor" stroke="none" /><circle cx="14.4" cy="8" r="1.1" fill="currentColor" stroke="none" /></>,
  secundario: <><path d="M12 4L2.5 8.8 12 13.6l9.5-4.8z" /><path d="M6.5 11.2v4.6c0 .5.3 1 .8 1.3 1.3.7 3 1.1 4.7 1.1s3.4-.4 4.7-1.1c.5-.3.8-.8.8-1.3v-4.6" /><path d="M21.5 8.8v5" strokeLinecap="round" /></>,
};

const ICONO_GENERICO = <><path d="M4 5.5A1.5 1.5 0 015.5 4h11A1.5 1.5 0 0118 5.5v15l-4-2.5-4 2.5" /><path d="M8 8.5h6" strokeLinecap="round" /></>;

function IconoMateria({ slug }: { slug: string }) {
  return (
    <svg className="ca-materia-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      {ICONOS[slug] ?? ICONO_GENERICO}
    </svg>
  );
}

function Flecha() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Materia({ materia, numero }: { materia: MateriaCard; numero: number }) {
  const contenido = (
    <>
      <span className="ca-materia-numero" aria-hidden="true">{String(numero).padStart(2, '0')}</span>
      <span className="ca-materia-ico"><IconoMateria slug={materia.slug} /></span>
      <span className="ca-materia-contenido">
        <span className="ca-materia-titulo">{materia.label}</span>
        {!materia.en_construccion && materia.descripcion?.[0] && (
          <span className="ca-materia-descripcion" dangerouslySetInnerHTML={{ __html: sanitizeContent(materia.descripcion[0]) }} />
        )}
      </span>
      {materia.en_construccion ? (
        <span className="ca-materia-estado">Próximamente</span>
      ) : (
        <span className="ca-materia-accion">Ver horarios <Flecha /></span>
      )}
    </>
  );

  if (materia.en_construccion) {
    return <div className="ca-materia ca-materia-off" aria-label={`${materia.label} — próximamente`}>{contenido}</div>;
  }

  return <Link href={`/clases-apoyo/${materia.slug}`} className="ca-materia">{contenido}</Link>;
}

const BARRIOS = ['Villa Lugano', 'Villa Riachuelo', 'Barrio Piedrabuena', 'Lugano I y II', 'Villa Soldati', 'Mataderos', 'Villa Celina'];

export default function ClasesApoyoLanding({ materias }: { materias: MateriaCard[] }) {
  return (
    <main className="ca-landing">
      <section className="ca-hero" aria-labelledby="ca-hero-titulo">
        <Image src="/imagenes/clases-apoyo/hero-mesa-estudio.webp" alt="" fill preload quality={90} sizes="100vw" className="ca-hero-imagen" />
        <div className="ca-hero-velo" />
        <div className="ca-hero-contenido">
          <h1 id="ca-hero-titulo">Clases de apoyo<span>en Villa Lugano</span></h1>
          <a className="ca-hero-cta" href="#materias">Elegí una materia <Flecha /></a>
        </div>
        <span className="ca-hero-marca" aria-hidden="true">CAU Villa Lugano</span>
      </section>

      <section className="ca-seccion ca-materias-seccion" id="materias" aria-labelledby="ca-materias-titulo">
        <div className="ca-encabezado">
          <span className="ca-eyebrow">Materias</span>
          <h2 id="ca-materias-titulo">Elegí lo que necesitás preparar</h2>
          <p>Entrá a la materia para ver los días y horarios disponibles.</p>
        </div>
        <div className="ca-materias-lista">
          {materias.map((materia, index) => <Materia key={materia.id} materia={materia} numero={index + 1} />)}
        </div>
      </section>

      <section className="ca-metodo" aria-labelledby="ca-metodo-titulo">
        <div className="ca-metodo-titulo">
          <span className="ca-eyebrow">La clase se adapta a vos</span>
          <h2 id="ca-metodo-titulo">Traé lo que estás viendo en la escuela</h2>
        </div>
        <div className="ca-metodo-texto">
          <p>Trabajamos con tu carpeta y las consignas de tu propia escuela. Podés venir para preparar una prueba, resolver un tema puntual o sostener el aprendizaje durante el año.</p>
          <dl className="ca-metodo-datos">
            <div><dt>Modalidad</dt><dd>Individual o en grupo reducido</dd></div>
            <div><dt>Frecuencia</dt><dd>Una clase o acompañamiento regular</dd></div>
          </dl>
        </div>
      </section>

      <section className="ca-seccion ca-reserva" aria-labelledby="ca-reserva-titulo">
        <div className="ca-encabezado">
          <span className="ca-eyebrow">Reserva</span>
          <h2 id="ca-reserva-titulo">Tres pasos y listo</h2>
        </div>
        <ol className="ca-pasos">
          <li><span>01</span><h3>Elegí la materia</h3><p>Abrí la materia que necesitás preparar.</p></li>
          <li><span>02</span><h3>Buscá tu horario</h3><p>Elegí entre los turnos disponibles.</p></li>
          <li><span>03</span><h3>Enviá la reserva</h3><p>El profesor te responde por WhatsApp.</p></li>
        </ol>
        <a className="ca-link-materias" href="#materias">Ver materias</a>
      </section>

      <section className="ca-ubicacion" aria-labelledby="ca-ubicacion-titulo">
        <div className="ca-ubicacion-imagen">
          <Image src="/imagenes/imagenes_cau/Foto-entrada.webp" alt="Entrada del CAU Villa Lugano en Guaminí 4876" fill sizes="(max-width: 760px) 100vw, 44vw" />
        </div>
        <div className="ca-ubicacion-contenido">
          <span className="ca-eyebrow">Estamos cerca</span>
          <h2 id="ca-ubicacion-titulo">Guaminí 4876, Villa Lugano</h2>
          <p>La sede queda cerca de estos barrios:</p>
          <ul className="ca-barrios">{BARRIOS.map(barrio => <li key={barrio}>{barrio}</li>)}</ul>
          <a className="ca-ubicacion-link" href={MAPS_URL} target="_blank" rel="noopener noreferrer">Cómo llegar <Flecha /></a>
        </div>
      </section>
    </main>
  );
}
