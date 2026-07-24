// Detalle de una carrera renderizado en el servidor.
// Es el contenido propio de /carreras/[slug]: antes vivia solo dentro del modal
// client-side, asi que el HTML servido era una copia del home y Google lo trataba
// como duplicado. Aca va como texto real, indexable.

import Link from 'next/link';
import type { Carrera, CarreraEnlace } from '@/components/index/types';
import { carreraToSlug, carreraFullName } from '@/components/index/types';
import { getEscuelaIA } from '@/components/index/identidad-argentina';
import {
  getCareerPrefix,
  parseIAMeta,
  parsePlanModulos,
  parseDocente,
  getPortada,
  getPlanSlide,
  planSlideToAnios,
  planSlideToExtras,
  contarMaterias,
} from './career-content';

interface Props {
  carrera: Carrera;
  relacionadas: CarreraEnlace[];
}

/** Titulo de seccion con la linea de acento arriba. */
function SectionTitle({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <h2
      className="text-sm font-bold uppercase tracking-widest mb-3"
      style={{ color: accent }}
    >
      {children}
    </h2>
  );
}

export default function CareerDetail({ carrera, relacionadas }: Props) {
  const isIA = carrera.nivel === 'Identidad Argentina';
  const accent = isIA ? '#0090c1' : '#00c7b1';
  const accentLight = isIA ? '#f1cf1c' : '#00ffe1';
  const panelBg = isIA ? '#101820' : '#1c2f31';
  const cardBg = isIA ? 'rgba(255,255,255,0.05)' : 'rgba(1,55,41,0.5)';
  const cardBorder = isIA ? 'rgba(255,255,255,0.12)' : 'rgba(0,199,177,0.15)';
  const bodyText = isIA ? '#b4cce0' : '#b4d3ce';
  const mutedText = isIA ? '#8ab4d0' : '#7ca19b';

  const { prefix, cleanName } = getCareerPrefix(carrera);
  const nombreCompleto = carreraFullName(carrera);

  // Badges de cabecera: el convenio muestra escuela/certificacion, el resto nivel/titulo.
  const iaMeta = isIA ? parseIAMeta(carrera.enfoque || '') : null;
  const metaItems = isIA
    ? [
        { label: 'Escuela', value: getEscuelaIA(carrera) || carrera.prefix || 'Diplomatura' },
        { label: 'Duración', value: carrera.duracion },
        { label: 'Modalidad', value: iaMeta!.modalidad },
        { label: 'Certificación', value: iaMeta!.certificacion },
      ]
    : [
        { label: 'Nivel', value: carrera.nivel },
        { label: 'Duración', value: carrera.duracion },
        { label: 'Título', value: carrera.titulo },
        { label: 'Enfoque', value: carrera.enfoque },
      ];

  const portada = getPortada(carrera);
  const planSlide = getPlanSlide(carrera);
  const anios = planSlide && contarMaterias(planSlide) > 0 ? planSlideToAnios(planSlide) : [];
  const extras = planSlide ? planSlideToExtras(planSlide) : [];
  const iaDocente = isIA && carrera.seccion_modalidad ? parseDocente(carrera.seccion_modalidad) : null;
  const iaModulos = isIA && carrera.plan_estudios ? parsePlanModulos(carrera.plan_estudios) : null;

  const waMsg = `Hola, me gustaría recibir más información sobre ${carrera.nombre}`;
  const waHref = `https://wa.me/5491166522722?text=${encodeURIComponent(waMsg)}`;

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12">
      {/* Migas: enlaces reales para que el rastreo llegue y vuelva */}
      <nav aria-label="Migas de pan" className="mb-5 text-xs sm:text-sm" style={{ color: mutedText }}>
        <Link href="/" className="hover:underline">Inicio</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <Link href="/#carreras" className="hover:underline">Carreras</Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span style={{ color: accent }}>{nombreCompleto}</span>
      </nav>

      {/* Cabecera */}
      <header
        className="rounded-2xl p-5 sm:p-7 mb-6"
        style={{ background: panelBg, boxShadow: `inset 0 0 0 1px ${cardBorder}` }}
      >
        {prefix && (
          <p
            className="text-[11px] sm:text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: accentLight }}
          >
            {prefix}
          </p>
        )}
        <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter leading-tight">
          {cleanName}
        </h1>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-5">
          {metaItems.map(item => (
            <div
              key={item.label}
              className="rounded-lg px-3 py-2"
              style={{ background: cardBg, boxShadow: `inset 0 0 0 1px ${cardBorder}` }}
            >
              <dt
                className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest"
                style={{ color: accent }}
              >
                {item.label}
              </dt>
              <dd className="text-[0.8rem] sm:text-sm font-semibold mt-0.5 leading-tight text-white">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      {/* Descripcion */}
      {carrera.descripcion && (
        <section className="mb-6">
          <SectionTitle accent={accent}>Sobre la carrera</SectionTitle>
          <p className="text-[0.95rem] sm:text-lg leading-relaxed" style={{ color: bodyText }}>
            {carrera.descripcion}
          </p>
        </section>
      )}

      {/* Que vas a poder hacer (bullets de la portada) */}
      {portada && portada.bullets.length > 0 && (
        <section className="mb-6">
          <SectionTitle accent={accent}>Lo que vas a aprender</SectionTitle>
          <ul className="space-y-2">
            {portada.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm sm:text-base leading-relaxed" style={{ color: bodyText }}>
                <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accent }} />
                {b}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Docente (convenio Identidad Argentina) */}
      {iaDocente?.nombre && (
        <section
          className="mb-6 rounded-xl p-4 sm:p-5"
          style={{ background: cardBg, boxShadow: `inset 0 0 0 1px ${cardBorder}` }}
        >
          <SectionTitle accent={accent}>Docente</SectionTitle>
          <p className="text-white font-bold text-base sm:text-lg">{iaDocente.nombre}</p>
          {iaDocente.bio.length > 0 && (
            <ul className="mt-2 space-y-1">
              {iaDocente.bio.map((line, i) => (
                <li key={i} className="text-sm flex items-start gap-2" style={{ color: mutedText }}>
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accent }} />
                  {line}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Duracion en detalle */}
      {carrera.seccion_duracion && (
        <section
          className="mb-6 rounded-xl p-4 sm:p-5"
          style={{ background: cardBg, boxShadow: `inset 0 0 0 1px ${cardBorder}` }}
        >
          <SectionTitle accent={accent}>Duración</SectionTitle>
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap" style={{ color: bodyText }}>
            {carrera.seccion_duracion}
          </p>
        </section>
      )}

      {/* Modalidad (para el convenio ya se uso como docente) */}
      {!isIA && carrera.seccion_modalidad && (
        <section
          className="mb-6 rounded-xl p-4 sm:p-5"
          style={{ background: cardBg, boxShadow: `inset 0 0 0 1px ${cardBorder}` }}
        >
          <SectionTitle accent={accent}>Modalidad de cursado</SectionTitle>
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap" style={{ color: bodyText }}>
            {carrera.seccion_modalidad}
          </p>
        </section>
      )}

      {/* Plan de estudios ── 1) modulos del convenio */}
      {iaModulos && iaModulos.length > 0 && (
        <section className="mb-6">
          <SectionTitle accent={accent}>Plan de estudios</SectionTitle>
          <div className="space-y-3">
            {iaModulos.map((mod, i) => {
              const esMasterclass = mod.titulo.startsWith('Masterclass');
              return (
                <div
                  key={i}
                  className="rounded-lg p-3 sm:p-4"
                  style={{
                    background: cardBg,
                    boxShadow: `inset 0 0 0 1px ${cardBorder}`,
                    borderLeft: `3px solid ${esMasterclass ? accentLight : accent}`,
                  }}
                >
                  {mod.titulo && (
                    <h3 className="font-bold text-sm sm:text-[0.95rem] mb-1.5" style={{ color: esMasterclass ? accentLight : '#fff' }}>
                      {mod.titulo}
                    </h3>
                  )}
                  {mod.contenido && (
                    <p className="text-[0.82rem] sm:text-sm leading-relaxed whitespace-pre-wrap" style={{ color: mutedText }}>
                      {mod.contenido}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Plan de estudios ── 2) grilla estructurada por año */}
      {!isIA && anios.length > 0 && (
        <section className="mb-6">
          <SectionTitle accent={accent}>Plan de estudios</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-3">
            {anios.map((a, i) => (
              <div
                key={i}
                className="rounded-xl p-4"
                style={{ background: cardBg, boxShadow: `inset 0 0 0 1px ${cardBorder}` }}
              >
                <h3 className="font-black text-white uppercase tracking-tight text-base mb-2">{a.anio}</h3>
                {a.cuatrimestres.map((c, j) => (
                  <div key={j} className="mb-3 last:mb-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>
                      {c.label}
                    </p>
                    <ul className="space-y-1">
                      {c.materias.map((m, k) => (
                        <li key={k} className="text-[0.82rem] sm:text-sm leading-snug flex items-start gap-2" style={{ color: bodyText }}>
                          <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: accent }} />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {extras.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              {extras.map((e, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{ background: cardBg, boxShadow: `inset 0 0 0 1px ${cardBorder}` }}
                >
                  <h3 className="font-bold text-sm mb-2" style={{ color: accentLight }}>{e.titulo}</h3>
                  <ul className="space-y-1">
                    {e.items.map((it, j) => (
                      <li key={j} className="text-[0.82rem] sm:text-sm leading-snug flex items-start gap-2" style={{ color: bodyText }}>
                        <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: accent }} />
                        {it}
                      </li>
                    ))}
                  </ul>
                  {e.nota && <p className="text-xs mt-2 italic" style={{ color: mutedText }}>{e.nota}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Plan de estudios ── 3) texto plano, cuando no hay grilla */}
      {!isIA && anios.length === 0 && carrera.plan_estudios && (
        <section
          className="mb-6 rounded-xl p-4 sm:p-5"
          style={{ background: cardBg, boxShadow: `inset 0 0 0 1px ${cardBorder}` }}
        >
          <SectionTitle accent={accent}>Plan de estudios</SectionTitle>
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap" style={{ color: bodyText }}>
            {carrera.plan_estudios}
          </p>
        </section>
      )}

      {/* El slide de cierre no se renderiza: 58 de 59 carreras comparten los mismos
          beneficios palabra por palabra, y repetir ese texto en cada pagina vuelve a
          meter el problema de contenido duplicado que esta pagina viene a resolver. */}

      {/* Llamados a la accion */}
      <div className="flex flex-wrap gap-2.5 mb-10">
        <a
          href="#formulario"
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-white font-bold rounded-lg text-sm hover:brightness-110 transition"
          style={{ background: isIA ? accent : '#6c2381' }}
        >
          Inscribite ya
        </a>
        <a
          href={waHref}
          target="_blank"
          rel="noopener nofollow"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366] text-white font-bold rounded-lg text-sm hover:brightness-110 transition"
        >
          Consultar por WhatsApp
        </a>
      </div>

      {/* Otras carreras: enlaces internos rastreables entre paginas de carrera */}
      {relacionadas.length > 0 && (
        <section className="pt-6" style={{ borderTop: `1px solid ${cardBorder}` }}>
          <SectionTitle accent={accent}>Otras carreras de {carrera.nivel}</SectionTitle>
          <ul className="flex flex-wrap gap-2">
            {relacionadas.map(c => (
              <li key={c.id}>
                <Link
                  href={`/carreras/${carreraToSlug(c)}`}
                  className="inline-block rounded-lg px-3 py-1.5 text-[0.82rem] hover:brightness-125 transition"
                  style={{ background: cardBg, boxShadow: `inset 0 0 0 1px ${cardBorder}`, color: bodyText }}
                >
                  {carreraFullName(c)}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/"
            className="inline-block mt-4 text-sm font-semibold hover:underline"
            style={{ color: accent }}
          >
            Ver todas las carreras →
          </Link>
        </section>
      )}
    </article>
  );
}
