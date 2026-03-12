import type { Metadata } from 'next';
import Image from 'next/image';
import './sobre-nosotros.css';

export const metadata: Metadata = {
  title: 'Sobre Nosotros',
  description: 'Conocé el Centro de Aprendizaje Universitario Villa Lugano. Capacitaciones, carreras universitarias con Siglo 21, talleres y más.',
};

/* ── Data ────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
    title: 'Formación universitaria',
    description: 'Carreras de grado y diplomaturas con Universidad Siglo 21. Modalidad a distancia con acompañamiento presencial.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
    title: 'Comunidad cercana',
    description: 'Un espacio donde cada persona importa. Atención personalizada y seguimiento real de tu proceso educativo.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
      </svg>
    ),
    title: 'Crecimiento profesional',
    description: 'Capacitaciones, talleres y herramientas para crecer en tu carrera laboral o emprender tu propio proyecto.',
  },
];

const STATS = [
  { value: '+1000', label: 'Egresados en nuestra sede' },
  { value: '+88', label: 'Carreras, cursos y capacitaciones' },
  { value: '100%', label: 'Modalidad a distancia' },
  { value: '30', label: 'Años en el barrio' },
];

const CHECKLIST = [
  'Capacitaciones y cursos online',
  'Carreras y diplomaturas con Universidad Siglo 21',
  'Talleres culturales y comunitarios',
  'Coworking, consultorios y salas de reunión',
  'Capacitaciones para empresas y PYMES',
];

/* ── Page ────────────────────────────────────────────────── */

export default function SobreNosotrosPage() {
  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8">

      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="pt-4 sm:pt-10 pb-8 sm:pb-14 text-center">
        <div className="sn-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 sm:mb-8">
          <span className="w-2 h-2 rounded-full" style={{ background: '#00c7b1' }} />
          <span className="text-[11px] sm:text-xs font-semibold tracking-wide uppercase" style={{ color: '#00c7b1' }}>
            Centro de Aprendizaje Universitario
          </span>
        </div>

        <h1 className="text-3xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-4 sm:mb-6">
          <span className="block text-white">Educación que</span>
          <span
            className="block"
            style={{
              background: 'linear-gradient(135deg, #00c7b1 0%, #00ffe1 60%, #48b3a4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            transforma vidas
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-lg leading-relaxed mb-7 sm:mb-10" style={{ color: '#8fada7' }}>
          En el Centro de Capacitación Villa Lugano creemos que{' '}
          <strong className="font-semibold" style={{ color: '#c8dedd' }}>aprender, crecer y emprender</strong>{' '}
          deben ser experiencias accesibles, humanas y transformadoras.
          Acompañamos a cada persona en su camino educativo y profesional.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <a
            href="https://wa.me/5491166522722?text=Hola%2C%20me%20gustar%C3%ADa%20realizar%20una%20consulta"
            target="_blank"
            rel="noopener"
            className="sn-whatsapp-btn inline-flex items-center gap-3 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full font-bold text-white text-sm transition-all hover:brightness-110 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 0 0 .917.918l4.458-1.495A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 0 1-5.39-1.586l-.386-.238-2.65.889.889-2.65-.238-.386A9.94 9.94 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
            </svg>
            Escribinos por WhatsApp
          </a>
          <a
            href="/faq"
            className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full font-semibold text-sm transition-all hover:brightness-110"
            style={{ color: '#00c7b1', border: '1px solid rgba(0,199,177,0.3)', background: 'rgba(0,199,177,0.06)' }}
          >
            Preguntas frecuentes
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </section>

      {/* ─── NUESTRA SEDE ─────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-stretch gap-4 md:gap-5">
          {/* Image — desktop: large side panel */}
          <div
            className="hidden md:block sn-img-container rounded-2xl md:w-[40%] flex-shrink-0"
            style={{ border: '1px solid rgba(0,199,177,0.12)' }}
          >
            <div className="absolute inset-0 z-[1] pointer-events-none rounded-2xl" style={{ background: 'linear-gradient(to top, rgba(6,23,22,0.4) 0%, transparent 30%)' }} />
            <Image
              src="/imagenes/imagenes_cau/Foto-entrada.webp"
              alt="Entrada del Centro de Capacitación Villa Lugano"
              width={358}
              height={483}
              className="w-full h-full object-cover object-top rounded-2xl"
              priority
            />
          </div>
          {/* Info card */}
          <div
            className="rounded-2xl flex flex-col justify-between md:flex-1 relative overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, rgba(28,47,49,0.95) 0%, rgba(22,47,46,0.8) 60%, rgba(20,44,43,0.9) 100%)',
              border: '1px solid rgba(0,199,177,0.1)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* Subtle accent glow */}
            <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(0,199,177,0.06) 0%, transparent 70%)' }} />
            {/* Top */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#00c7b1' }}>Nuestra sede</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Villa Lugano, CABA</h2>
                </div>
                <Image
                  src="/imagenes/imagenes_cau/logo_cau.png"
                  alt="Logo CAU"
                  width={64}
                  height={64}
                  className="brightness-0 invert flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16"
                />
              </div>
              <div className="mb-5" style={{ height: '1px', background: 'linear-gradient(90deg, rgba(0,199,177,0.25), transparent 80%)' }} />
              <div className="flex gap-3 items-stretch">
                <div className="md:hidden flex-shrink-0 rounded-xl overflow-hidden relative" style={{ width: '130px', border: '1px solid rgba(0,199,177,0.12)' }}>
                  <div className="absolute inset-0 z-[1] pointer-events-none rounded-xl" style={{ background: 'linear-gradient(to top, rgba(6,23,22,0.4) 0%, transparent 30%)' }} />
                  <Image
                    src="/imagenes/imagenes_cau/Foto-entrada.webp"
                    alt="Entrada del Centro de Capacitación Villa Lugano"
                    width={130}
                    height={200}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center 70%' }}
                  />
                </div>
                <p className="text-sm leading-relaxed flex-1" style={{ color: '#8fada7' }}>
                  Un espacio pensado para que puedas <strong className="text-white font-semibold">estudiar, capacitarte y crecer profesionalmente</strong> en el corazón de <strong className="text-white font-semibold">Villa Lugano</strong>.
                  Nuestro centro reúne todo lo que necesitás: <strong className="text-white font-semibold">aulas equipadas</strong>, <strong className="text-white font-semibold">atención personalizada</strong> y un equipo que te acompaña en cada paso.
                </p>
              </div>

              <p className="text-sm leading-relaxed mt-5" style={{ color: '#8fada7' }}>
                En el <strong className="text-white font-semibold">Centro Educativo Villa Lugano</strong>, trabajamos con el compromiso de acercar <strong className="text-white font-semibold">oportunidades reales</strong> a quienes viven en Villa Lugano y alrededores.
                Somos <strong className="text-white font-semibold">sede oficial de la Universidad Siglo 21</strong> y además ofrecemos <strong className="text-white font-semibold">talleres culturales</strong>, <strong className="text-white font-semibold">clases de apoyo escolar</strong>,
                <strong className="text-white font-semibold"> capacitaciones laborales</strong> y un espacio de <strong className="text-white font-semibold">coworking para emprendedores</strong>. Creemos en la educación como motor de cambio
                y en brindar herramientas concretas para el <strong className="text-white font-semibold">crecimiento personal y profesional</strong>.
              </p>
            </div>

            {/* Bottom */}
            <div className="px-6 sm:px-8" style={{ paddingTop: 0 }}>
              <div className="mb-5" style={{ height: '1px', background: 'linear-gradient(90deg, rgba(0,199,177,0.25), transparent 80%)' }} />
            </div>
            <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex items-center justify-center gap-2 sm:gap-3">
              <a
                href="https://wa.me/5491166522722"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 px-3 sm:px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm text-white transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 0 0 .917.918l4.458-1.495A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 0 1-5.39-1.586l-.386-.238-2.65.889.889-2.65-.238-.386A9.94 9.94 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                </svg>
                Consultanos
              </a>
              <span
                className="inline-flex items-center gap-1.5 px-3 sm:px-5 py-2.5 rounded-full font-semibold text-xs sm:text-sm"
                style={{ color: '#00c7b1', border: '1px solid rgba(0,199,177,0.25)', background: 'rgba(0,199,177,0.06)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Lunes a viernes, de 8:00 a 20:00 hs
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="sn-stat rounded-xl p-5 sm:p-6 text-center"
            style={{ background: 'linear-gradient(160deg, rgba(28,47,49,0.8) 0%, rgba(22,47,46,0.5) 100%)', border: '1px solid rgba(0,199,177,0.08)' }}
          >
            <p className="text-3xl sm:text-4xl font-black mb-1" style={{ color: '#00c7b1' }}>{s.value}</p>
            <p className="text-xs sm:text-sm font-medium" style={{ color: '#8fada7' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ─── SEDE CENTRAL SIGLO 21 (Córdoba) ──────────────── */}
      <section
        className="rounded-2xl p-5 sm:p-7 mb-10"
        style={{ background: 'linear-gradient(160deg, rgba(28,47,49,0.7) 0%, rgba(22,47,46,0.5) 100%)', border: '1px solid rgba(0,199,177,0.1)' }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0,199,177,0.12)', border: '1px solid rgba(0,199,177,0.2)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ color: '#00c7b1' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#00c7b1' }}>Sede central</p>
            <p className="text-lg font-bold text-white">Universidad Siglo 21 — Córdoba</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { src: '/imagenes/imagenes_cau/edificio_siglo21_campus.jpg', alt: 'Campus Universidad Siglo 21 - Vista aérea', label: 'Campus Siglo 21' },
            { src: '/imagenes/imagenes_cau/edificio_siglo21_campus2.webp', alt: 'Estudiantes en el campus de Universidad Siglo 21', label: 'Comunidad universitaria' },
            { src: '/imagenes/imagenes_cau/Edificio_siglo21_campus3.jpg', alt: 'Edificio Universidad Siglo 21', label: 'Universidad Siglo 21' },
          ].map((img) => (
            <div key={img.src} className="sn-img-container rounded-xl" style={{ border: '1px solid rgba(0,199,177,0.08)', height: '200px' }}>
              <div className="absolute inset-0 z-[1] pointer-events-none rounded-xl" style={{ background: 'linear-gradient(to top, rgba(6,23,22,0.5) 0%, transparent 40%)' }} />
              <Image
                src={img.src}
                alt={img.alt}
                width={500}
                height={300}
                className="w-full h-full object-cover"
              />
              <p className="absolute bottom-3 left-3 z-10 text-xs font-semibold text-white/80">{img.label}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-5">
          <a
            href="https://21.edu.ar/carreras-y-programas"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white transition-all hover:brightness-110 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #006c5b 0%, #00c7b1 100%)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21" />
            </svg>
            Visita la página de la sede central
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      </section>


      {/* ─── GLOW DIVIDER ─────────────────────────────────── */}
      <div className="sn-glow-line mb-10" />

      {/* ─── FEATURE CARDS ────────────────────────────────── */}
      <section className="mb-14">
        <p className="text-xs font-semibold tracking-widest uppercase mb-3 text-center" style={{ color: '#00c7b1' }}>
          Nuestros pilares
        </p>
        <h2
          className="text-2xl sm:text-4xl font-black tracking-tight text-center text-white mb-10"
          style={{ fontFamily: 'var(--font-unbounded)' }}
        >
          ¿Por qué elegirnos?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="sn-feature-card rounded-2xl p-7 cursor-default"
              style={{ background: 'linear-gradient(160deg, rgba(28,47,49,0.8) 0%, rgba(22,47,46,0.5) 100%)', border: '1px solid rgba(0,199,177,0.08)' }}
            >
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="sn-icon-ring w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                  style={{ background: 'rgba(0,199,177,0.1)', color: '#00c7b1' }}
                  aria-hidden="true"
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-white">{f.title}</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#8fada7' }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SERVICES: CHECKLIST ─────────────────────────── */}
      <section
        className="rounded-2xl overflow-hidden mb-10"
        style={{ background: 'linear-gradient(to bottom, rgba(6,23,22,0.8) 0%, rgba(22,47,46,0.5) 50%, rgba(1,55,41,0.6) 100%)', border: '1px solid rgba(0,199,177,0.12)' }}
      >
        <div className="p-7 sm:p-10 md:p-14">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            {/* Left: logo + checklist */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <Image
                  src="/imagenes/imagenes_cau/logo_cau.png"
                  alt="Logo Centro Educativo Villa Lugano"
                  width={64}
                  height={64}
                  className="rounded-xl brightness-0 invert"
                />
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#00ffe1' }}>
                    Servicios
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    Todo en un solo lugar
                  </h2>
                </div>
              </div>

              <p className="text-sm leading-relaxed mb-8" style={{ color: '#b0cec8' }}>
                Ofrecemos una propuesta integral para que puedas formarte,
                capacitarte y conectar con otros profesionales sin salir del barrio.
              </p>

              <ul className="space-y-2.5">
                {CHECKLIST.map((item) => (
                  <li key={item} className="sn-check-item flex items-center gap-3 px-3 py-2.5 rounded-lg">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(0,255,225,0.15)', border: '1px solid rgba(0,255,225,0.2)' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true" style={{ color: '#00ffe1' }}>
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span className="text-[15px] font-semibold text-white">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: CTA card */}
            <div
              className="flex flex-col items-center text-center p-8 rounded-2xl w-full md:w-[320px] flex-shrink-0"
              style={{ background: 'rgba(0,199,177,0.08)', border: '1px solid rgba(0,199,177,0.2)', backdropFilter: 'blur(8px)' }}
            >
              <Image
                src="/imagenes/imagenes_cau/logo_cau.png"
                alt="Logo Centro Educativo Villa Lugano"
                width={72}
                height={72}
                className="rounded-xl mb-4 brightness-0 invert"
              />
              <p className="text-lg font-bold text-white mb-2">¿Tenés dudas?</p>
              <p className="text-sm mb-5" style={{ color: '#b0cec8' }}>
                Escribinos y te asesoramos sin compromiso sobre la carrera que más se adapte a vos.
              </p>
              <div className="flex flex-col gap-2.5 w-full">
                <a
                  href="https://wa.me/5491166522722?text=Hola%2C%20me%20gustar%C3%ADa%20realizar%20una%20consulta"
                  target="_blank"
                  rel="noopener"
                  className="sn-whatsapp-btn inline-flex items-center justify-center gap-3 w-full py-3 rounded-full font-bold text-white text-sm transition-all hover:brightness-110 hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 0 0 .917.918l4.458-1.495A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 0 1-5.39-1.586l-.386-.238-2.65.889.889-2.65-.238-.386A9.94 9.94 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                  </svg>
                  Contactanos
                </a>
                <a
                  href="/clases-apoyo/art"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-full font-semibold text-sm transition-all hover:brightness-110"
                  style={{ color: '#00c7b1', border: '1px solid rgba(0,199,177,0.3)', background: 'rgba(0,199,177,0.06)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
                  </svg>
                  Taller de arte
                </a>
                <a
                  href="/clases-apoyo/len"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-full font-semibold text-sm transition-all hover:brightness-110"
                  style={{ color: '#00c7b1', border: '1px solid rgba(0,199,177,0.3)', background: 'rgba(0,199,177,0.06)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
                  Taller de lectura
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── GLOW DIVIDER ─────────────────────────────────── */}
      <div className="sn-glow-line mb-10" />

      {/* ─── MAP ──────────────────────────────────────────── */}
      <section className="sn-map-card sn-glass rounded-2xl p-6 sm:p-10 mb-10">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0,199,177,0.12)', border: '1px solid rgba(0,199,177,0.2)' }}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#00c7b1' }} aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#00c7b1' }}>
                  Ubicación
                </p>
                <h2
                  className="text-2xl sm:text-3xl font-black tracking-tight text-white"
                >
                  Visitanos
                </h2>
              </div>
          </div>

          {/* Separator */}
          <div className="sn-glow-line" />

          {/* Content: text + map */}
          <div className="flex flex-col md:flex-row gap-8 md:items-stretch">
            <div className="flex-1 flex flex-col md:justify-between">
              <div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#8fada7' }}>
                  Nuestro centro está en <strong className="text-white">Villa Lugano</strong>, con fácil acceso desde <strong className="text-white">Mataderos</strong>, <strong className="text-white">Liniers</strong>, <strong className="text-white">Villa Celina</strong> y <strong className="text-white">Zona Sur del GBA</strong>.
                  Atendemos <strong className="text-white">de lunes a viernes</strong> en turnos mañana y tarde.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['Villa Lugano', 'Mataderos', 'Liniers', 'Villa Celina', 'Zona Sur'].map((z) => (
                    <span
                      key={z}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                      style={{ color: '#00c7b1', background: 'rgba(0,199,177,0.08)', border: '1px solid rgba(0,199,177,0.2)' }}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                      </svg>
                      {z}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div
                  className="flex items-center gap-3 px-5 py-4 rounded-xl mb-4 md:mb-0"
                  style={{ background: 'linear-gradient(135deg, rgba(0,199,177,0.08) 0%, rgba(0,255,225,0.04) 100%)', border: '1px solid rgba(0,199,177,0.18)' }}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#00c7b1' }} aria-hidden="true">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                  </svg>
                  <p className="text-lg sm:text-xl font-black text-white tracking-tight">
                    Guaminí 4876, Villa Lugano, CABA
                  </p>
                </div>

                {/* Mobile: button before map */}
                <a
                  href="https://maps.app.goo.gl/Bxfhe5BpQYUg1dxv7"
                  target="_blank"
                  rel="noopener"
                  className="md:hidden flex items-center justify-center gap-2 w-full py-3 rounded-lg font-bold text-sm text-white transition-all hover:brightness-110 mb-0"
                  style={{ background: 'linear-gradient(135deg, var(--cau-brand-blue) 0%, var(--cau-brand-green) 100%)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7" />
                  </svg>
                  Cómo llegar
                </a>
              </div>
            </div>
            <div className="w-full md:w-[55%] flex flex-col gap-3 flex-shrink-0">
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,199,177,0.1)' }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d287.30386866002505!2d-58.478021869563335!3d-34.68692280959655!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcceb304e92bc7%3A0x2c1bd7e026f4751a!2sCentro%20de%20Capacitacion%20Lugano!5e0!3m2!1ses-419!2sus!4v1772370527929!5m2!1ses-419!2sus"
                width="100%"
                height="320"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación del CAU Villa Lugano en Google Maps"
              />
            </div>
            {/* Desktop: button below map */}
            <a
              href="https://maps.app.goo.gl/Bxfhe5BpQYUg1dxv7"
              target="_blank"
              rel="noopener"
              className="hidden md:flex items-center justify-center gap-2 w-full py-3 rounded-lg font-bold text-sm text-white transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, var(--cau-brand-blue) 0%, var(--cau-brand-green) 100%)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7" />
              </svg>
              Cómo llegar
            </a>
          </div>
          </div>
        </div>
      </section>

    </main>
  );
}
