import type { Metadata } from 'next';
import Link from 'next/link';
import { jsonLdScript } from '@/lib/json-ld';
import SiteFooter from '@/components/footer';
import {
  PREGUNTAS,
  APERTURAS,
  REGLAMENTO,
  SEMANAS_DEL_TRAMO,
  SEMANAS_POR_TRAMO,
  TRAMOS_POR_SEMESTRE,
  MATERIAS_CUATRIMESTRALES,
  ENTREGAS,
} from './datos';
import '@/estilos/calendario-academico/calendario-academico.css';

// Estática pura, como /faq y /sobre-nosotros. Desde el 30/10/2026 la página es
// del ciclo 2027: la universidad todavía no publicó ese calendario, así que acá
// no hay fechas de 2027 y sí la estructura del año, que sale del reglamento y no
// cambia de un ciclo a otro.

export const metadata: Metadata = {
  // La consulta estacional es "calendario siglo 21 2027" y sus variantes. El año
  // va en el título si o si, y sin prometer fechas que todavía no existen.
  title: { absolute: 'Calendario Académico 2027 Siglo 21 a Distancia | Cursada' },
  description:
    'Cómo se organiza el ciclo 2027 de Universidad Siglo 21 a distancia: dos semestres, cuatro tramos de nueve semanas, parciales, entregas de trabajos prácticos y materias cuatrimestrales. Inscripción 2027 abierta en el CAU Villa Lugano.',
  keywords: [
    'calendario académico 2027',
    'calendario siglo 21 2027',
    'inscripción 2027 siglo 21',
    'inicio de clases 2027',
    'parciales siglo 21',
    'modalidad distancia',
  ],
  alternates: {
    canonical: '/calendario-academico',
  },
  openGraph: {
    title: 'Calendario Académico 2027 — Universidad Siglo 21 a Distancia',
    description:
      'Semestres, tramos de nueve semanas, parciales, entregas y materias cuatrimestrales del ciclo 2027, con la inscripción abierta.',
    url: '/calendario-academico',
    type: 'article',
    images: [{ url: '/imagenes/og/default.jpg', width: 1200, height: 630, alt: 'Universidad Siglo 21 — CAU Online' }],
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
      name: 'Calendario Académico 2027',
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

/** "1 a 4", "9" o "10 a 17": la ventana de semanas de cada instancia. */
const semanas = (desde: string, hasta: string) => (desde === hasta ? `semana ${desde}` : `semanas ${desde} a ${hasta}`);

export default function CalendarioAcademicoPage() {
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
          <span className="ca-titulo-degrade block">2027</span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base leading-relaxed" style={{ color: '#c8dedd' }}>
          Cómo se organiza el ciclo lectivo de <strong className="font-semibold text-white">Universidad
          Siglo 21</strong> en modalidad a distancia: los semestres, los tramos de nueve semanas y
          cuándo cae cada parcial y cada entrega.
        </p>
      </section>

      {/* ─── INSCRIPCIÓN 2027 ─────────────────────────────── */}
      {/* Sin caja, sin borde de acento y sin degradé: el bloque es texto y un
          botón sobre el fondo de la página. El usuario descartó las tarjetas
          translúcidas y las barras laterales como señal de vibecoding
          (docs/criterios.md). Tampoco hay fechas del ciclo: el calendario 2027
          lo publica la universidad y no se extrapola el de 2026. */}
      <section className="ca-franja">
        <p className="ca-franja-etiqueta">
          <span className="ca-franja-punto" aria-hidden="true" />
          Inscripción 2027 abierta
        </p>
        <p className="ca-franja-detalle">
          Ya podés anotarte para cursar en 2027. La universidad abre la cursada en{' '}
          <strong>{APERTURAS.slice(0, -1).join(', ')} y {APERTURAS[APERTURAS.length - 1]}</strong>.
        </p>
        <Link href="/?casa=siglo21#filtros-categoria" className="ca-carreras ca-franja-cta">
          Ver las carreras
        </Link>
      </section>

      {/* ─── CÓMO SE ORGANIZA EL AÑO ──────────────────────── */}
      <section className="mb-10">
        <h2 className="ca-h2">Cómo se organiza el año</h2>
        <p className="text-sm leading-relaxed mb-5" style={{ color: '#c8dedd' }}>
          El año se divide en dos semestres y cada uno en {TRAMOS_POR_SEMESTRE} tramos de{' '}
          {SEMANAS_POR_TRAMO} semanas. Cada tramo abre su propia inscripción a materias, así que hay{' '}
          <strong className="text-white font-semibold">cuatro momentos al año</strong> para sumar
          materias.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {['Primer semestre', 'Segundo semestre'].map(semestre => (
            <article key={semestre} className="ca-card rounded-2xl p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#7ca19b' }}>
                {semestre}
              </p>
              <p className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-4">
                {TRAMOS_POR_SEMESTRE} tramos
              </p>
              <dl className="ca-datos">
                <div>
                  <dt>Duración de cada tramo</dt>
                  <dd>{SEMANAS_POR_TRAMO} semanas</dd>
                </div>
                <div>
                  <dt>Cursado</dt>
                  <dd>Semanas 1 a 8</dd>
                </div>
                <div>
                  <dt>Recuperatorio e integrador</dt>
                  <dd>Semana {SEMANAS_POR_TRAMO}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      {/* ─── PARCIALES DENTRO DEL TRAMO ───────────────────── */}
      <section className="mb-10">
        <h2 className="ca-h2">Parciales dentro del tramo</h2>
        <p className="text-sm leading-relaxed mb-5" style={{ color: '#c8dedd' }}>
          Los parciales no tienen una fecha única: se rinden dentro de una ventana de semanas y
          elegís día y horario cuando te inscribís al examen.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SEMANAS_DEL_TRAMO.map(p => (
            <article key={p.instancia} className="ca-card rounded-2xl p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#7ca19b' }}>
                {semanas(p.desde, p.hasta)}
              </p>
              <p className="text-lg sm:text-xl font-black text-white tracking-tight">{p.instancia}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ─── CUATRIMESTRALES ──────────────────────────────── */}
      <section className="mb-10">
        <h2 className="ca-h2">Materias cuatrimestrales</h2>
        <p className="text-sm leading-relaxed mb-5" style={{ color: '#c8dedd' }}>
          Las materias de Intervención Profesional no entran en un tramo de nueve semanas: se cursan
          a lo largo de todo el semestre, {MATERIAS_CUATRIMESTRALES.semanas} semanas, con sus propias
          ventanas de parcial.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MATERIAS_CUATRIMESTRALES.instancias.map(p => (
            <article key={p.instancia} className="ca-card rounded-2xl p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#7ca19b' }}>
                {semanas(p.desde, p.hasta)}
              </p>
              <p className="text-lg sm:text-xl font-black text-white tracking-tight">{p.instancia}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ─── ENTREGAS ─────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="ca-h2">Entregas de trabajos prácticos</h2>
        <p className="text-sm leading-relaxed mb-5" style={{ color: '#c8dedd' }}>
          Cada tipología de materia tiene su calendario de entregas, contado por semana de cursada.
          Entregar después de la fecha descuenta 5% de la nota del trabajo por día, con un tope de
          50 puntos.
        </p>
        <div className="ca-entregas">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th className="ca-entregas-detalle">Materia</th>
                <th>TP1</th>
                <th>TP2</th>
                <th>TP3</th>
                <th>TP4</th>
              </tr>
            </thead>
            <tbody>
              {ENTREGAS.map(e => (
                <tr key={e.tipo}>
                  <td className="ca-entregas-tipo">{e.tipo}</td>
                  <td className="ca-entregas-detalle">{e.detalle}</td>
                  {e.semanas.map((semana, i) => (
                    <td key={i} className="ca-entregas-semana">S.{semana}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs mt-3 leading-relaxed" style={{ color: '#7ca19b' }}>
          MIA: entregas únicas. MEC: se pueden rehacer hasta la semana 9.
        </p>
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
              {p.enlace && (
                <Link href={p.enlace.href} className="ca-link mt-2 inline-block text-sm font-semibold">
                  {p.enlace.texto}
                </Link>
              )}
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
          <Link
            href="/?casa=siglo21#filtros-categoria"
            className="ca-cta-secundario inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-sm"
          >
            Ver las carreras
          </Link>
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
          Estructura tomada del reglamento de Universidad Siglo 21 para modalidad distancia (ED +
          EDH).{' '}
          <a href={REGLAMENTO} target="_blank" rel="noopener nofollow" className="ca-link">
            Ver el reglamento de la universidad
          </a>
          . Las fechas del ciclo 2027 se publican en el calendario académico oficial antes del
          inicio de clases. Teclab maneja un calendario propio.
        </p>
      </section>
    </main>
    <SiteFooter />
    </>
  );
}
