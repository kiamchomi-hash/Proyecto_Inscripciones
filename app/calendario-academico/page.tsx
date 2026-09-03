import type { Metadata } from 'next';
import Link from 'next/link';
import { jsonLdScript } from '@/lib/json-ld';
import ProximoHito from './proximo-hito';
import SiteFooter from '@/components/footer';
import {
  PERIODOS,
  CUATRIMESTRALES,
  FERIADOS,
  PREGUNTAS,
  PDF_OFICIAL,
  formatearFecha,
  formatearCorto,
} from './datos';
import './calendario-academico.css';

// Estatica pura, como /faq y /sobre-nosotros: las fechas del ano ya estan
// publicadas y no cambian. Lo unico relativo a hoy es <ProximoHito>, que corre
// en el cliente.

export const metadata: Metadata = {
  // La consulta que trae las impresiones es "calendario siglo 21 2026" y sus
  // variantes, asi que el ano va en el titulo si o si. Absolute para no
  // arrastrar el template del layout.
  title: { absolute: 'Calendario Académico 2026 Siglo 21 a Distancia | Fechas' },
  description:
    'Fechas del Calendario Académico 2026 de Universidad Siglo 21 a distancia: inicio de cursada, cierre de inscripción a materias, integradores y feriados. CAU Villa Lugano.',
  keywords: [
    'calendario académico 2026',
    'calendario siglo 21 2026',
    'universidad siglo 21',
    'inicio de clases 2026',
    'inscripción a materias',
    'modalidad distancia',
  ],
  alternates: {
    canonical: '/calendario-academico',
  },
  openGraph: {
    title: 'Calendario Académico 2026 — Universidad Siglo 21 a Distancia',
    description:
      'Inicio de cursada, cierre de inscripción a materias, integradores y feriados del ciclo 2026.',
    url: '/calendario-academico',
    type: 'article',
  },
};

const BREADCRUMB = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Inicio',
      item: 'https://www.siglo21sur.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Calendario Académico 2026',
      item: 'https://www.siglo21sur.com/calendario-academico',
    },
  ],
};

// Las mismas preguntas que se pintan mas abajo. El schema no puede declarar
// respuestas que la pagina no muestre: Google lo pide explicitamente y, mas
// alla de la regla, una respuesta que solo existe en el JSON-LD es una promesa
// que la visita no cumple.
const FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PREGUNTAS.map(p => ({
    '@type': 'Question',
    name: p.pregunta,
    acceptedAnswer: { '@type': 'Answer', text: p.respuesta },
  })),
};

export default function CalendarioAcademicoPage() {
  const primerSemestre = PERIODOS.filter(p => p.semestre === 'Primer semestre');
  const segundoSemestre = PERIODOS.filter(p => p.semestre === 'Segundo semestre');

  return (
    <>
    <main className="max-w-5xl mx-auto px-5 sm:px-8 pb-14">
      <script
        type="application/ld+json"
        // El objeto es literal y no lleva nada de la base, pero pasa por el
        // helper igual: es la regla del proyecto para todo bloque de datos
        // estructurados, y el test la exige.
        dangerouslySetInnerHTML={{ __html: jsonLdScript(BREADCRUMB) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(FAQ) }}
      />

      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="pt-4 sm:pt-8 pb-6 text-center">
        <div className="ca-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5">
          <span className="w-2 h-2 rounded-full" style={{ background: '#00c7b1' }} />
          <span className="text-[11px] sm:text-xs font-semibold tracking-wide uppercase" style={{ color: '#00c7b1' }}>
            Modalidad a distancia
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] mb-4">
          <span className="block text-white">Calendario Académico</span>
          <span className="ca-titulo-degrade block">2026</span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base leading-relaxed" style={{ color: '#c8dedd' }}>
          Todas las fechas del ciclo lectivo de <strong className="font-semibold text-white">Universidad Siglo 21</strong>{' '}
          en modalidad a distancia: cuándo empiezan las clases, hasta cuándo te podés
          anotar a materias y cuándo caen los integradores.
        </p>
      </section>

      <ProximoHito />

      {/* ─── LOS CUATRO TRAMOS ────────────────────────────── */}
      <section className="mb-10">
        <h2 className="ca-h2">Fechas de cursada</h2>
        <p className="text-sm leading-relaxed mb-5" style={{ color: '#c8dedd' }}>
          El año se divide en cuatro tramos de nueve semanas, dos por semestre.
          Cada uno abre su propia inscripción a materias, así que hay{' '}
          <strong className="text-white font-semibold">cuatro momentos al año</strong> para sumar materias.
        </p>

        {[
          { titulo: 'Primer semestre', periodos: primerSemestre },
          { titulo: 'Segundo semestre', periodos: segundoSemestre },
        ].map(bloque => (
          <div key={bloque.titulo} className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#00c7b1' }}>
              {bloque.titulo}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bloque.periodos.map(p => (
                <article key={p.inicio} className="ca-card rounded-2xl p-5 sm:p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#7ca19b' }}>
                    Empiezan las clases
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-4">
                    {formatearFecha(p.inicio)}
                  </p>
                  <dl className="ca-datos">
                    <div>
                      <dt>Inscripción a materias hasta</dt>
                      <dd>{formatearFecha(p.inscripcion)}</dd>
                    </div>
                    <div>
                      <dt>Recuperatorio e integrador</dt>
                      <dd>{formatearCorto(p.integradorDesde)} al {formatearCorto(p.fin)}</dd>
                    </div>
                    <div>
                      <dt>Termina la cursada</dt>
                      <dd>{formatearFecha(p.fin)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ─── CUATRIMESTRALES ──────────────────────────────── */}
      <section className="mb-10">
        <h2 className="ca-h2">Materias cuatrimestrales</h2>
        <p className="text-sm leading-relaxed mb-5" style={{ color: '#c8dedd' }}>
          Algunas materias no entran en un tramo de nueve semanas y se cursan a lo
          largo de todo el semestre. Arrancan junto con el primer tramo y cierran
          con el segundo.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CUATRIMESTRALES.map(c => (
            <article key={c.inicio} className="ca-card rounded-2xl p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#7ca19b' }}>
                {c.semestre}
              </p>
              <p className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
                {formatearFecha(c.inicio)} al {formatearFecha(c.fin)}
              </p>
              <p className="text-sm" style={{ color: '#c8dedd' }}>{c.semanas} semanas de cursada</p>
            </article>
          ))}
        </div>
      </section>

      {/* ─── FERIADOS ─────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="ca-h2">Feriados del ciclo 2026</h2>
        <p className="text-sm leading-relaxed mb-5" style={{ color: '#c8dedd' }}>
          Los que caen sobre semanas de cursada según el calendario oficial.
        </p>
        <ul className="ca-feriados">
          {FERIADOS.map((f, i) => (
            <li key={`${f.fecha}-${i}`}>
              <span className="ca-feriado-fecha">{formatearCorto(f.fecha)}</span>
              <span className="ca-feriado-nombre">{f.nombre}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── PREGUNTAS ────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="ca-h2">Preguntas frecuentes</h2>
        <div className="grid grid-cols-1 gap-4">
          {PREGUNTAS.map(p => (
            <article key={p.pregunta} className="ca-card rounded-2xl p-5 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mb-2">
                {p.pregunta}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#c8dedd' }}>
                {p.respuesta}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ─── FUENTE + CTA ─────────────────────────────────── */}
      <section className="ca-cierre rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-3">
          ¿Necesitás ayuda para anotarte?
        </h2>
        <p className="text-sm leading-relaxed mb-5" style={{ color: '#c8dedd' }}>
          En el <strong className="text-white font-semibold">CAU Villa Lugano</strong> te acompañamos con la
          inscripción, el legajo y la elección de materias. Estamos en Guaminí 4876,
          de lunes a viernes de 8:00 a 20:00.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://wa.me/5491132973801?text=Hola%2C%20quiero%20consultar%20por%20la%20inscripci%C3%B3n"
            target="_blank"
            rel="noopener nofollow"
            className="ca-cta inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-white text-sm"
          >
            Escribinos por WhatsApp
          </a>
          <Link
            href="/contacto"
            className="ca-cta-secundario inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-sm"
          >
            Dejanos tus datos
          </Link>
        </div>

        <p className="text-xs mt-6 leading-relaxed" style={{ color: '#7ca19b' }}>
          Fechas tomadas del calendario académico oficial de Universidad Siglo 21
          para modalidad distancia (ED + EDH).{' '}
          <a href={PDF_OFICIAL} target="_blank" rel="noopener nofollow" className="ca-link">
            Ver el PDF de la universidad
          </a>
          . Teclab maneja un calendario propio.
        </p>
      </section>
    </main>
    <SiteFooter />
    </>
  );
}
