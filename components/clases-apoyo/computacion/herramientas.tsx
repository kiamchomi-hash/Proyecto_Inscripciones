import type { CSSProperties } from 'react';
import Image from 'next/image';

/* Herramientas que se enseñan en computación, con las marcas y mascotas del
   dorso del folleto (copiadas de dorso.html, no redibujadas; ver
   public/imagenes/clases-apoyo/computacion/herramientas/). Del dorso se toma
   el lenguaje de tarjeta —esquina apenas redondeada, contorno oscuro y sombra
   de bloque— y cada tarjeta tiene su gracia animada: las mascotas en reposo,
   la cinta de logos de IA, las ventanas de Office que saltan, los íconos de
   Google en ola y el cabezal que recorre la línea de tiempo de video. Todo se
   apaga con prefers-reduced-motion. */

const DIR = '/imagenes/clases-apoyo/computacion/herramientas';

function Marca({ nombre, ancho, alto, className, style }: { nombre: string; ancho: number; alto: number; className?: string; style?: CSSProperties }) {
  return (
    <Image src={`${DIR}/${nombre}.svg`} alt="" width={ancho} height={alto} unoptimized className={className} style={style} />
  );
}

const IA = ['ia-claude', 'ia-chatgpt', 'ia-gemini', 'ia-copilot', 'ia-notebooklm', 'ia-elevenlabs'];

const OFFICE = [
  { nombre: 'excel', rotulo: 'Excel', color: '#217346' },
  { nombre: 'word', rotulo: 'Word', color: '#2b579a' },
  { nombre: 'powerpoint', rotulo: 'PowerPoint', color: '#c43e1c' },
];

const GOOGLE = [
  { nombre: 'gmail', ancho: 256, alto: 204 },
  { nombre: 'drive', ancho: 256, alto: 238 },
  { nombre: 'forms', ancho: 192, alto: 192 },
];

const CREATIVAS = [
  { nombre: 'canva', rotulo: 'Canva', uso: 'Placas y folletos', campo: 'linear-gradient(135deg, #00c4cc, #7d2ae7)' },
  { nombre: 'affinity', rotulo: 'Affinity', uso: 'Imágenes y retoque', campo: '#a7f175' },
  { nombre: 'capcut', rotulo: 'CapCut', uso: 'Edición de video', campo: '#062420', claro: true },
];

export default function Herramientas() {
  return (
    <section className="hr" aria-labelledby="hr-titulo">
      <header className="hr-encabezado">
        <span className="hr-ceja">Aprendé a usar</span>
        <h2 id="hr-titulo" className="hr-titulo">Las herramientas que vas a usar</h2>
      </header>

      <div className="hr-grilla">
        {/* ── IA: las dos mascotas a los lados y la cinta de logos ── */}
        <article className="hr-tarjeta hr-ia">
          <Marca nombre="pet-codex" ancho={414} alto={426} className="hr-mascota hr-codex" />
          <div className="hr-ia-centro">
            <h3 className="hr-ia-titulo">Dominá la IA</h3>
            <p className="hr-ia-bajada">ChatGPT, Claude, Gemini y las herramientas que ya se usan en el trabajo</p>
            <div className="hr-cinta" aria-hidden="true">
              {/* La lista va dos veces para que la cinta dé la vuelta sin corte. */}
              <div className="hr-cinta-pista">
                {[...IA, ...IA].map((nombre, i) => (
                  <Marca key={i} nombre={nombre} ancho={24} alto={24} className="hr-cinta-logo" />
                ))}
              </div>
            </div>
          </div>
          <Marca nombre="clawd" ancho={276} alto={138} className="hr-mascota hr-clawd" />
        </article>

        {/* ── Office: tres ventanas que saltan en orden ── */}
        <article className="hr-tarjeta hr-office">
          <div className="hr-texto">
            <span className="hr-rotulo">Trabajo y organización</span>
            <h3 className="hr-nombre">Excel, Word y PowerPoint</h3>
            <p className="hr-uso">Planillas, documentos y presentaciones</p>
          </div>
          <ul className="hr-office-paneles">
            {OFFICE.map((o, i) => (
              <li key={o.nombre} className="hr-office-panel" style={{ '--hr-color': o.color, '--hr-i': i } as CSSProperties}>
                <Marca nombre={o.nombre} ancho={32} alto={32} className="hr-office-logo" />
                <span className="hr-office-rotulo">{o.rotulo}</span>
              </li>
            ))}
          </ul>
        </article>

        {/* ── Google: la raya de cuatro colores se llena y los íconos hacen ola ── */}
        <article className="hr-tarjeta hr-google">
          <span className="hr-google-raya" aria-hidden="true" />
          <div className="hr-google-iconos">
            {GOOGLE.map((g, i) => (
              <Marca key={g.nombre} nombre={g.nombre} ancho={g.ancho} alto={g.alto} className="hr-google-icono" style={{ '--hr-i': i } as CSSProperties} />
            ))}
          </div>
          <div className="hr-texto">
            <h3 className="hr-nombre">Gmail, Drive y Forms</h3>
            <p className="hr-uso">Correo, archivos en la nube y formularios</p>
          </div>
        </article>

        {/* ── Diseño y video: una línea de tiempo con cabezal ── */}
        <article className="hr-tarjeta hr-creativas">
          <div className="hr-creativas-fichas">
            {CREATIVAS.map(c => (
              <div key={c.nombre} className="hr-ficha">
                <strong>{c.rotulo}</strong>
                <span>{c.uso}</span>
              </div>
            ))}
          </div>
          <div className="hr-pista" aria-hidden="true">
            {CREATIVAS.map(c => (
              <span key={c.nombre} className={`hr-clip${c.claro ? ' hr-clip-oscuro' : ''}`} style={{ '--hr-campo': c.campo } as CSSProperties}>
                <Marca nombre={c.nombre} ancho={28} alto={28} className="hr-clip-logo" />
              </span>
            ))}
            <span className="hr-cabezal" />
          </div>
        </article>
      </div>
    </section>
  );
}
