// Detalle de carrera renderizado en el servidor: todo el contenido importante
// permanece en el HTML para que cada URL sea una pagina real e indexable.

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import type { Carrera, CarreraEnlace } from '@/components/index/types';
import { carreraToSlug, carreraFullName } from '@/components/index/types';
import { getEscuelaIA } from '@/components/index/identidad-argentina';
import IsotipoIA from '@/components/index/ia-isotipo';
import {
  esTeclab,
  getFichaTeclab,
  parseCompetenciasTeclab,
  parseEnfoqueTeclab,
  parsePlanTeclab,
  partirDescripcionTeclab,
} from '@/components/index/teclab';
import CareerInfoButton from './career-info-button';
import {
  getCareerPrefix,
  parseIAMeta,
  parsePlanModulos,
  parseDocente,
  getPortada,
  getPlanSlide,
  periodosTeclabToAnios,
  planSlideToAnios,
  planSlideToExtras,
  contarMaterias,
} from './career-content';

interface Props {
  carrera: Carrera;
  relacionadas: CarreraEnlace[];
}

type CareerStyle = CSSProperties & {
  '--career-accent': string;
  '--career-accent-bright': string;
  '--career-ink': string;
  '--career-soft': string;
  '--career-hero-position': string;
  '--career-hero-position-mobile': string;
  '--career-hero-scale': string;
  '--career-hero-origin': string;
  '--career-hero-origin-mobile': string;
};

const HERO_POSITIONS: Record<string, string> = {
  Abogacía: 'center top',
  'Licenciatura en Administración': 'center top',
  'Licenciatura en Administración Hotelera': 'left top',
  'Licenciatura en Administración Pública': 'center top',
  'Licenciatura en Comercio Internacional': 'center top',
  'Licenciatura en Educación (CCC)': 'center top',
  'Licenciatura en Informática': 'center top',
  'Licenciatura en Psicopedagogía (CCC)': 'center top',
  'Licenciatura en Relaciones Internacionales': 'center top',
  'Licenciatura en Relaciones Públicas e Institucionales': 'center top',
  'Profesorado Universitario para Nivel Secundario y Superior (CCC)': 'center top',
  'Tecnicatura en Administración y Gestión de Políticas Públicas': 'center top',
  'Tecnicatura en Gestión de Empresas Familiares': 'center top',
};

const HERO_SCALES: Record<string, string> = {
  'Licenciatura en Administración Hotelera': '1.35',
  'Tecnicatura en Administración y Gestión Tributaria': '1.15',
};

const HERO_ORIGINS: Record<string, string> = {
  'Licenciatura en Administración Hotelera': 'left top',
  'Tecnicatura en Administración y Gestión Tributaria': 'center center',
};

const MOBILE_HERO_POSITIONS: Record<string, string> = {
  'Tecnicatura en Administración y Gestión Tributaria': 'center top',
};

const MOBILE_HERO_ORIGINS: Record<string, string> = {
  'Tecnicatura en Administración y Gestión Tributaria': 'center top',
};

function SectionHeading({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="career-section-heading">
      <span>{eyebrow}</span>
      <h2>{children}</h2>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default function CareerDetail({ carrera, relacionadas }: Props) {
  const isIA = carrera.nivel === 'Identidad Argentina';
  // Las carreras de Teclab traen su material de la ficha oficial del instituto:
  // foto de portada, competencias, plan por periodo y el enlace a teclab.edu.ar.
  const isTeclab = esTeclab(carrera);
  const ficha = isTeclab ? getFichaTeclab(carrera) : null;
  const accent = isIA ? '#25a9db' : '#00c7b1';
  const accentBright = isIA ? '#f1cf1c' : '#70f0dc';
  const ink = isIA ? '#101820' : '#071d1b';
  const soft = isIA ? '#b9d9e8' : '#b7d1cd';
  const { prefix, cleanName } = getCareerPrefix(carrera);
  const nombreCompleto = carreraFullName(carrera);
  const portada = getPortada(carrera);
  const heroImage =
    ficha?.imagen ||
    portada?.imagen_desktop ||
    portada?.imagen_mobile ||
    '/imagenes/gente/Header_1920x450-1.webp';
  const heroPosition =
    HERO_POSITIONS[nombreCompleto] ||
    portada?.imagen_desktop_position ||
    'center';
  const mobileHeroPosition =
    MOBILE_HERO_POSITIONS[nombreCompleto] ||
    HERO_POSITIONS[nombreCompleto] ||
    heroPosition;
  const titleLengthClass =
    cleanName.length > 45
      ? ' career-page--title-xl'
      : cleanName.length > 28
        ? ' career-page--title-long'
        : '';
  const careerStyle: CareerStyle = {
    '--career-accent': accent,
    '--career-accent-bright': accentBright,
    '--career-ink': ink,
    '--career-soft': soft,
    '--career-hero-position': heroPosition,
    '--career-hero-position-mobile': mobileHeroPosition,
    '--career-hero-scale': HERO_SCALES[nombreCompleto] || '1',
    '--career-hero-origin': HERO_ORIGINS[nombreCompleto] || 'center top',
    '--career-hero-origin-mobile':
      MOBILE_HERO_ORIGINS[nombreCompleto] ||
      HERO_ORIGINS[nombreCompleto] ||
      'center top',
  };

  const iaMeta = isIA ? parseIAMeta(carrera.enfoque || '') : null;
  const teclabMeta = isTeclab ? parseEnfoqueTeclab(carrera.enfoque) : null;
  const metaItems = isIA
    ? [
        { label: 'Escuela', value: getEscuelaIA(carrera) || carrera.prefix || 'Diplomatura' },
        { label: 'Duración', value: carrera.duracion },
        { label: 'Modalidad', value: iaMeta!.modalidad },
        { label: 'Certificación', value: iaMeta!.certificacion },
      ]
    : isTeclab
      ? [
          { label: 'Institución', value: 'Teclab · Instituto Técnico Superior' },
          { label: 'Duración', value: carrera.duracion },
          { label: 'Título', value: carrera.titulo },
          { label: 'Certificado intermedio', value: teclabMeta!.certificado || 'Al finalizar el primer año' },
        ]
      : [
          { label: 'Nivel', value: carrera.nivel },
          { label: 'Duración', value: carrera.duracion },
          { label: 'Título', value: carrera.titulo },
          { label: 'Modalidad', value: carrera.modalidad || 'Educación distribuida' },
        ];

  const planSlide = getPlanSlide(carrera);
  const teclabCompetencias = isTeclab ? parseCompetenciasTeclab(carrera.seccion_modalidad) : [];
  const teclabSalida = isTeclab ? partirDescripcionTeclab(carrera.descripcion).salida : '';
  const teclabIntro = isTeclab ? partirDescripcionTeclab(carrera.descripcion).perfil : '';
  const anios = isTeclab
    ? periodosTeclabToAnios(parsePlanTeclab(carrera.plan_estudios))
    : planSlide && contarMaterias(planSlide) > 0
      ? planSlideToAnios(planSlide)
      : [];
  const extras = planSlide ? planSlideToExtras(planSlide) : [];
  const iaDocente = isIA && carrera.seccion_modalidad ? parseDocente(carrera.seccion_modalidad) : null;
  const iaModulos = isIA && carrera.plan_estudios ? parsePlanModulos(carrera.plan_estudios) : null;
  const hasPlan = Boolean(
    (iaModulos && iaModulos.length > 0) ||
    anios.length > 0 ||
    (!isIA && !isTeclab && carrera.plan_estudios),
  );

  const waMsg = `Hola, me gustaría recibir más información sobre ${carrera.nombre}`;
  const waHref = `https://wa.me/5491166522722?text=${encodeURIComponent(waMsg)}`;

  return (
    <article
      className={`career-page${isIA ? ' career-page--ia career-page--no-image' : ''}${titleLengthClass}`}
      style={careerStyle}
    >
      <header className="career-hero">
        {!isIA && (
          <>
            <div className="career-hero-media" aria-hidden="true">
              <Image
                className="career-hero-image"
                src={heroImage}
                alt=""
                fill
                priority
                quality={90}
                sizes="100vw"
                style={{
                  filter: portada?.imagen_brightness
                    ? `brightness(${portada.imagen_brightness})`
                    : undefined,
                }}
              />
            </div>
            <div className="career-hero-shade" />
          </>
        )}

        <div className="career-hero-inner">
          <div className="career-hero-nav-row">
            {/* El payload RSC de la home pesa ~75 KB (el catalogo entero con sus
                slides). Precargarlo desde cada carrera roba ancho de banda justo
                cuando se esta pintando el hero. */}
            <Link href="/#carreras" className="career-all-careers" prefetch={false}>
              <ArrowIcon />
              Ver todas las carreras
            </Link>
            <nav aria-label="Migas de pan" className="career-breadcrumb">
              <Link href="/" prefetch={false}>Inicio</Link>
              <span className="career-breadcrumb-separator" aria-hidden="true">›</span>
              <Link href="/#carreras" prefetch={false}>Carreras</Link>
              <span className="career-breadcrumb-separator" aria-hidden="true">›</span>
              <span className="career-breadcrumb-current" aria-current="page">{cleanName}</span>
            </nav>
          </div>

          <div className="career-hero-copy">
            <p className="career-kicker">{prefix || carrera.nivel}</p>
            <h1>{cleanName}</h1>
            {!isIA && (
              <p className="career-hero-intro">
                {teclabIntro ||
                  carrera.descripcion ||
                  `Formate en ${nombreCompleto} con el acompañamiento del CAU Villa Lugano.`}
              </p>
            )}
            <div className="career-hero-actions">
              <a href="#formulario" className="career-button career-button--primary">
                Quiero inscribirme <ArrowIcon />
              </a>
              <a
                href={waHref}
                target="_blank"
                rel="noopener nofollow"
                className="career-button career-button--ghost"
              >
                Hacer una consulta
              </a>
              <CareerInfoButton carrera={carrera} />
            </div>
          </div>
        </div>
      </header>

      <dl className="career-facts" aria-label="Información principal de la carrera">
        {metaItems.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="career-layout">
        <div className="career-content">
          {(portada?.bullets.length ?? 0) > 0 && (
            <section id="perfil" className="career-section career-reveal">
              <SectionHeading eyebrow="Tu futuro profesional">
                Lo que vas a aprender
              </SectionHeading>
              <ul className="career-learning-list">
                {portada!.bullets.map((bullet, index) => (
                  <li key={index}>
                    <span><CheckIcon /></span>
                    <p>{bullet}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {teclabCompetencias.length > 0 && (
            <section id="perfil" className="career-section career-reveal">
              <SectionHeading eyebrow="Competencias profesionales">
                Qué vas a saber hacer
              </SectionHeading>
              <ul className="career-learning-list">
                {teclabCompetencias.map((competencia, index) => (
                  <li key={index}>
                    <span><CheckIcon /></span>
                    <p>{competencia}</p>
                  </li>
                ))}
              </ul>
              {teclabSalida && (
                <div className="career-salida">
                  <h3>Dónde vas a trabajar</h3>
                  <p>{teclabSalida}</p>
                </div>
              )}
            </section>
          )}

          {iaDocente?.nombre && (
            <section className="career-section career-reveal">
              <SectionHeading eyebrow="Acompañamiento">Conocé a tu docente</SectionHeading>
              <div className="career-teacher">
                <div aria-hidden="true">{iaDocente.nombre.charAt(0)}</div>
                <div>
                  <h3>{iaDocente.nombre}</h3>
                  {iaDocente.bio.map((line, index) => <p key={index}>{line}</p>)}
                </div>
              </div>
            </section>
          )}

          {hasPlan && (
            <section id="plan" className="career-section career-plan career-reveal">
              <SectionHeading eyebrow="Tu recorrido académico">
                Plan de estudios
              </SectionHeading>

              {iaModulos && iaModulos.length > 0 && (
                <div className="career-modules">
                  {iaModulos.map((module, index) => (
                    <div key={index}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        {module.titulo && <h3>{module.titulo}</h3>}
                        {module.contenido && <p>{module.contenido}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isIA && anios.length > 0 && (
                <div className="career-years">
                  {anios.map((year, index) => (
                    <section key={index}>
                      <div className="career-year-title">
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <h3>{year.anio}</h3>
                      </div>
                      {year.cuatrimestres.map((term, termIndex) => (
                        <div className="career-term" key={termIndex}>
                          <h4>{term.label}</h4>
                          <ul>
                            {term.materias.map((subject, subjectIndex) => (
                              <li key={subjectIndex}>{subject}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </section>
                  ))}
                </div>
              )}

              {extras.length > 0 && (
                <div className="career-extras">
                  {extras.map((extra, index) => (
                    <div key={index}>
                      <h3>{extra.titulo}</h3>
                      <ul>
                        {extra.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                      </ul>
                      {extra.nota && <p>{extra.nota}</p>}
                    </div>
                  ))}
                </div>
              )}

              {!isIA && anios.length === 0 && carrera.plan_estudios && (
                <p className="career-plain-plan">{carrera.plan_estudios}</p>
              )}
            </section>
          )}

          {/* Franja de marca del convenio: la diplomatura la dicta la Academia */}
          {isIA && (
            <section className="career-oficial career-oficial--ia career-reveal">
              <IsotipoIA className="career-oficial-isotipo" />
              <p>
                Diplomatura de convenio entre el CAU Villa Lugano y la Academia Identidad
                Argentina. Se cursa por la plataforma Innova Virtual, con certificación nacional e
                internacional.
              </p>
              <a href="https://identidadargentina.com.ar/" target="_blank" rel="noopener">
                Conocé la Academia Identidad Argentina
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4" />
                </svg>
              </a>
            </section>
          )}

          {/* Franja de marca: el titulo lo emite Teclab y el CAU es el centro
              que acompaña la cursada. Sin enlace al sitio del instituto: el
              contacto se hace por WhatsApp o por el formulario de esta pagina. */}
          {ficha && (
            <section className="career-oficial career-reveal">
              <Image
                src="/imagenes/teclab/logo-teclab-siglo21.webp"
                alt="Teclab, Instituto Técnico Superior — Universidad Siglo 21"
                width={380}
                height={69}
              />
              <p>
                Carrera oficial de Teclab
                {ficha.partner ? `, cocreada con ${ficha.partner.nombre}` : ''}. Desde el CAU Villa
                Lugano te acompañamos en la inscripción y durante toda la cursada.
              </p>
              <a href="#formulario">
                Solicitar información
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </section>
          )}
        </div>

        <aside className="career-aside" aria-label="Navegación y contacto">
          <div className="career-aside-inner">
            <nav>
              {((portada?.bullets.length ?? 0) > 0 || teclabCompetencias.length > 0) && (
                <a href="#perfil">Perfil profesional</a>
              )}
              {hasPlan && <a href="#plan">Plan de estudios</a>}
            </nav>
            <div className="career-aside-cta">
              <span>¿Querés dar el próximo paso?</span>
              <strong>Te acompañamos desde Villa Lugano.</strong>
              <a href="#formulario">Solicitar información <ArrowIcon /></a>
              <a
                className="career-aside-whatsapp"
                href={waHref}
                target="_blank"
                rel="noopener nofollow"
              >
                Escribir por WhatsApp
              </a>
            </div>
          </div>
        </aside>
      </div>

      {relacionadas.length > 0 && (
        <section className="career-related career-reveal">
          <div className="career-related-heading">
            <div>
              <span>Seguí explorando</span>
              <h2>Otras carreras de {carrera.nivel}</h2>
            </div>
            <Link href="/#carreras" prefetch={false}>Ver todas <ArrowIcon /></Link>
          </div>
          <ul>
            {/* Con inlineCss cada precarga arrastra los 123 KB de CSS de la ruta:
                al llegar scrolleando hasta aca se pedian hasta 8 paginas de golpe. */}
            {relacionadas.map((related) => (
              <li key={related.id}>
                <Link href={`/carreras/${carreraToSlug(related)}`} prefetch={false}>
                  <span>{carreraFullName(related)}</span>
                  <ArrowIcon />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
