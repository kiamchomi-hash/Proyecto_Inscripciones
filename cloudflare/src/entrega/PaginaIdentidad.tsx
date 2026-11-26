import CareersCatalog from '@/components/index/careers-catalog';
import FormularioLead from '@/components/formularios/formulario-lead';
import IsotipoIA from '@/components/index/ia-isotipo';
import { WhatsAppIcon } from '@/components/icons';
import { numeroWhatsAppDe } from '@/lib/whatsapp';
import type { CarreraCatalogo } from '@/components/index/types';
import { ContextoTurnstile, type ConfigTurnstile } from './turnstile-contexto';

/**
 * Portada de topykly: la Academia Identidad Argentina como sitio propio.
 *
 * La página está armada como un embudo de una sola acción: el héroe lleva a la
 * preinscripción o a WhatsApp, la banda amarilla resume los datos que
 * sostienen la decisión, las tarjetas abren el programa y el pie vuelve a
 * ofrecer las dos acciones. No hay buscador ni filtros: con ocho programas,
 * sólo agregan fricción.
 *
 * Los datos de la banda y el testimonio salen de la web oficial de la Academia
 * (26/11/2026); no se agregan precios, descuentos ni cifras que no estén
 * publicadas. El copy de los botones es funcional.
 */

const WA = `https://wa.me/${numeroWhatsAppDe('identidad')}?text=${encodeURIComponent(
  'Hola, quiero información sobre las diplomaturas de la Academia Identidad Argentina',
)}`;

function IconoCertificado() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="9" r="5" />
      <path d="m9 13-2 8 5-2 5 2-2-8" />
      <path d="m10.5 9 1.2 1.2L14 7.5" />
    </svg>
  );
}

function IconoEnVivo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M8 21h8M12 17v4" />
      <path d="m10 9 3 2-3 2V9Z" />
    </svg>
  );
}

function IconoEmpleo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" />
      <path d="M10 12v2h4v-2" />
    </svg>
  );
}

function IconoDocente() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21a7 7 0 0 1 14 0" />
      <path d="M4 5h4M6 3v4" />
    </svg>
  );
}

export default function PaginaIdentidad(
  { carreras, turnstile }: { carreras: CarreraCatalogo[]; turnstile: ConfigTurnstile },
) {
  return (
    <ContextoTurnstile.Provider value={turnstile}>
      <main className="flex-1 identidad-pagina">
        <header className="identidad-hero">
          {/* Halos: mecánica de
              ~/Documentos/uiverse/biblioteca/mias/hero-isometrico-halo-violeta-evervault,
              recoloreados a azul/amarillo. Sin grilla ni piso en perspectiva. */}
          <div className="identidad-hero__contenido">
            <div className="identidad-hero__texto">
              <p className="identidad-hero__ceja">Academia Identidad Argentina</p>
              <h1 className="identidad-hero__titulo">
                Diplomaturas y cursos <span>100% online</span>
              </h1>
              <p className="identidad-hero__bajada">
                Certificación nacional e internacional y clases en vivo, desde todo el país.
              </p>
              <div className="identidad-hero__acciones">
                <a className="ia-cta ia-cta--primario" href="#preinscripcion">
                  Quiero preinscribirme
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </a>
                <a className="ia-cta ia-cta--whatsapp" href={WA} target="_blank" rel="noopener">
                  <WhatsAppIcon className="h-5 w-5" />
                  Hablar por WhatsApp
                </a>
              </div>
              <ul className="identidad-hero__pruebas">
                <li>Certificación nacional e internacional</li>
                <li>Clases en vivo</li>
              </ul>
            </div>
            <div className="identidad-hero__visual" aria-hidden="true">
              <IsotipoIA className="identidad-hero__isotipo" />
            </div>
          </div>
        </header>

        <section id="como-se-cursa" className="identidad-banda" aria-label="Datos de la Academia">
          <ul>
            <li>
              <IconoCertificado />
              <span><strong>Certificación</strong>Nacional e internacional</span>
            </li>
            <li>
              <IconoEnVivo />
              <span><strong>Modalidad</strong>100% online con clases en vivo, desde todo el país</span>
            </li>
            <li>
              <IconoEmpleo />
              <span><strong>Empleo</strong>Portal de empleo para alumnos</span>
            </li>
            <li>
              <IconoDocente />
              <span><strong>Docentes</strong>Expertos en actividad</span>
            </li>
          </ul>
        </section>

        <div id="carreras" className="identidad-programas">
          <div className="identidad-programas__rotulo">
            <p className="identidad-programas__3d">Oferta académica</p>
          </div>
          <CareersCatalog carreras={carreras} compacto textoDetalle="Ver programa" />
        </div>

        <section id="testimonios" className="identidad-testimonio" aria-labelledby="testimonio-titulo">
          <div className="identidad-testimonio__card">
            <span className="identidad-testimonio__comilla" aria-hidden="true">“</span>
            <h2 id="testimonio-titulo" className="identidad-testimonio__titulo">Lo que dicen los alumnos</h2>
            <blockquote>
              Cursar en Academia Identidad Argentina fue una experiencia muy grata. Tiene una
              llegada muy amena e interactiva todo el tiempo, el sector administrativo, siempre
              predispuestos para solventar dudas. Excelente calidad de atención de parte de los
              profesionales, viéndose el interés y preocupación por sus estudiantes. 100%
              recomendado por mi parte.
            </blockquote>
            <footer>Mariano · Alumno de Ciberseguridad · Mendoza, Argentina</footer>
          </div>
        </section>

        <section id="preinscripcion" className="identidad-formulario">
          <p className="identidad-formulario__intro">
            Completá tus datos y un asesor te contacta para continuar.
          </p>
          <FormularioLead carreras={carreras} modo="preinscripcion" origen="home" casa="identidad" />
          <p className="identidad-formulario__wa">
            ¿Preferís hablar?{' '}
            <a href={WA} target="_blank" rel="noopener">Escribinos por WhatsApp</a>
          </p>
        </section>

        <section id="contacto" className="identidad-formulario identidad-formulario--contacto">
          <FormularioLead carreras={carreras} modo="contacto" origen="home" casa="identidad" />
        </section>

        <div className="identidad-sticky" role="region" aria-label="Acciones rápidas">
          <a className="identidad-sticky__primario" href="#preinscripcion">Preinscribirme</a>
          <a className="identidad-sticky__wa" href={WA} target="_blank" rel="noopener">
            <WhatsAppIcon className="h-5 w-5" />
            WhatsApp
          </a>
        </div>

        <a className="identidad-wa-flotante" href={WA} target="_blank" rel="noopener"
          aria-label="Escribinos por WhatsApp">
          <WhatsAppIcon className="h-6 w-6" />
        </a>
      </main>
    </ContextoTurnstile.Provider>
  );
}
