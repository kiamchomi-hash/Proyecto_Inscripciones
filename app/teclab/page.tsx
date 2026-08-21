import type { Metadata } from 'next';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import {
  type Carrera,
  type CarreraCatalogo,
  COLUMNAS_CATALOGO,
  carreraToSlug,
  esCarreraVisible,
} from '@/components/index/types';
import { esCursoTeclab, esTeclab } from '@/components/index/teclab';
import CareersCatalog from '@/components/index/careers-catalog';
import EnrollmentForm from '@/components/index/enrollment-form';
import SiteFooter from '@/components/footer';
import { jsonLdScript } from '@/lib/json-ld';
import '../index.css';
import './teclab.css';

const URL = 'https://www.siglo21sur.com/teclab';
const WHATSAPP = 'https://wa.me/5491166522722?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20las%20carreras%20de%20Teclab';

export const metadata: Metadata = {
  title: { absolute: 'Tecnicaturas Teclab Online | CAU Villa Lugano' },
  description: 'Tecnicaturas y cursos Teclab 100% online en tecnología, gestión y negocios. Conocé la oferta y consultá en el CAU Villa Lugano.',
  keywords: [
    'teclab',
    'tecnicaturas online',
    'carreras cortas',
    'instituto técnico superior teclab',
    'universidad siglo 21',
    'villa lugano',
    'CABA',
  ],
  alternates: { canonical: URL },
  openGraph: {
    type: 'website',
    title: 'Tecnicaturas Teclab Online',
    description: 'Tecnología, gestión y negocios. Explorá la oferta Teclab y recibí asesoramiento del CAU Villa Lugano.',
    url: URL,
    images: [{
      url: '/imagenes/teclab/carreras/marketing-digital.webp',
      width: 1080,
      height: 700,
      alt: 'Estudiante de Teclab',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tecnicaturas Teclab Online',
    description: 'Explorá la oferta Teclab y recibí asesoramiento del CAU Villa Lugano.',
    images: ['/imagenes/teclab/carreras/marketing-digital.webp'],
  },
};

export const revalidate = 3600;

/**
 * Mosaico del hero: la primera pantalla muestra de que se trata la oferta en
 * vez de describirla. La libreria de Teclab (public/imagenes/teclab/carreras/,
 * bajada con scripts/descargar-assets-teclab.mjs) es casi toda retratos de
 * estudio; estas cuatro son las que tienen escena y alternan oscuro y claro.
 */
const MOSAICO = [
  "/imagenes/teclab/carreras/programacion.webp",
  "/imagenes/teclab/carreras/seguros.webp",
  "/imagenes/teclab/carreras/quality-assurance.webp",
  "/imagenes/teclab/carreras/curso-ia.webp",
];

/**
 * Empresas que cocrearon carreras y publican logo en su ficha. La lista y los
 * nombres salen de FICHAS en components/index/teclab.ts (campo `partner`); si
 * ahi cambia un partner, esta tira hay que actualizarla. Las medidas son las
 * intrinsecas de cada archivo: todos vienen a 420 de ancho.
 */
const PARTNERS = [
  { nombre: "AWS Academy", logo: "/imagenes/teclab/partners/aws.webp", alto: 105 },
  { nombre: "Google", logo: "/imagenes/teclab/partners/google.webp", alto: 138 },
  { nombre: "Microsoft", logo: "/imagenes/teclab/partners/microsoft.webp", alto: 90 },
  { nombre: "HubSpot", logo: "/imagenes/teclab/partners/hubspot.webp", alto: 156 },
  { nombre: "Zendesk", logo: "/imagenes/teclab/partners/zendesk.webp", alto: 108 },
  { nombre: "Avenga", logo: "/imagenes/teclab/partners/avenga.webp", alto: 87 },
];

async function getOfertaTeclab(): Promise<CarreraCatalogo[]> {
  const { data, error } = await supabase
    .from('carreras')
    .select(`${COLUMNAS_CATALOGO.join(', ')}, slides`)
    .eq('activa', true)
    .in('nivel', ['Teclab - Tecnología', 'Teclab - Gestión', 'Teclab - Curso'])
    .order('orden', { ascending: true });

  if (error) console.error('Error fetching oferta Teclab:', error.message);

  return ((data || []) as unknown as Carrera[])
    .filter(c => esCarreraVisible(c) && (esTeclab(c) || esCursoTeclab(c)))
    .map(({ slides, ...resto }) => ({
      ...resto,
      tieneSlides: (slides?.length ?? 0) > 0,
    } as CarreraCatalogo));
}

export default async function TeclabPage() {
  const carreras = await getOfertaTeclab();
  const tecnicaturas = carreras.filter(esTeclab).length;
  const cursos = carreras.filter(esCursoTeclab).length;
  const total = carreras.length;

  const jsonLd = jsonLdScript([
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Tecnicaturas y cursos Teclab',
      description: 'Oferta Teclab disponible con asesoramiento del CAU Villa Lugano.',
      url: URL,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: total,
        itemListElement: carreras.map((carrera, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: carrera.nombre,
          url: `https://www.siglo21sur.com/carreras/${carreraToSlug(carrera)}`,
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.siglo21sur.com/' },
        { '@type': 'ListItem', position: 2, name: 'Teclab', item: URL },
      ],
    },
  ]);

  return (
    <>
      <main className="teclab-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

        <section className="teclab-hero" aria-labelledby="teclab-title">
          <div className="teclab-hero-trama" aria-hidden="true" />
          <div className="teclab-hero-lines" aria-hidden="true" />

          <div className="teclab-hero-content">
            <div className="teclab-hero-decir">
              <Image
                className="teclab-hero-logo"
                src="/imagenes/teclab/logo-teclab.webp"
                alt="Teclab, Instituto Técnico Superior"
                width={296}
                height={100}
                preload
              />
              <h1 id="teclab-title">Tecnicaturas de dos años, 100% online.</h1>
              <div className="teclab-hero-actions">
                <a className="teclab-button teclab-button--primary" href="#oferta-teclab">
                  Ver las carreras
                  <span aria-hidden="true">↓</span>
                </a>
                <a className="teclab-text-link" href="#formulario">
                  Quiero asesoramiento <span aria-hidden="true">→</span>
                </a>
              </div>

              <div className="teclab-hero-partners">
                <p>Carreras cocreadas con</p>
                <ul>
                  {PARTNERS.map(({ nombre, logo, alto }) => (
                    <li key={nombre}>
                      <Image src={logo} alt={nombre} width={420} height={alto} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="teclab-hero-mosaico" aria-hidden="true">
              {MOSAICO.map((src, i) => (
                <div key={src}>
                  <Image src={src} alt="" fill sizes="(max-width: 760px) 45vw, 24vw" preload={i === 0} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="teclab-proof" aria-label="Características de la propuesta Teclab">
          <div className="teclab-proof-inner">
            <div>
              <strong>{tecnicaturas}</strong>
              <span>Tecnicaturas activas</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Modalidad online</span>
            </div>
            <div>
              <strong>{cursos > 0 ? `+${cursos}` : 'Online'}</strong>
              <span>{cursos === 1 ? 'Curso de actualización' : 'Cursos de actualización'}</span>
            </div>
          </div>
        </section>

        <section id="oferta-teclab" className="teclab-offer" aria-labelledby="teclab-offer-title">
          <div className="teclab-section-intro">
            <p className="teclab-eyebrow">Oferta académica</p>
            <h2 id="teclab-offer-title">Elegí el camino que querés empezar.</h2>
            <p>
              Explorá tecnología, gestión y negocios. Buscá por área, duración o nombre y abrí cada programa para conocerlo en detalle.
            </p>
          </div>
          <CareersCatalog carreras={carreras} />
        </section>

        <section className="teclab-continuity" aria-labelledby="teclab-continuity-title">
          <div className="teclab-continuity-copy">
            <p className="teclab-eyebrow">Tu recorrido puede continuar</p>
            <h2 id="teclab-continuity-title">Una tecnicatura también puede ser el comienzo de una licenciatura.</h2>
            <p>
              Varias propuestas Teclab articulan con Universidad Siglo 21. Te orientamos para conocer qué continuidad corresponde a cada título.
            </p>
            <a href="#formulario" className="teclab-text-link">
              Consultar por articulación <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="teclab-continuity-brand">
            <Image
              src="/imagenes/teclab/logo-teclab-siglo21.webp"
              alt="Teclab y Universidad Siglo 21"
              width={380}
              height={69}
            />
            <span>Asesoramiento e inscripción en el CAU Villa Lugano</span>
          </div>
        </section>

        <section className="teclab-final-lead" aria-labelledby="teclab-final-title">
          <p className="teclab-eyebrow">Hablemos de tu próxima carrera</p>
          <h2 id="teclab-final-title">Te ayudamos a elegir.</h2>
          <p>Dejanos una consulta o escribinos directamente por WhatsApp.</p>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
            Consultar por WhatsApp <span aria-hidden="true">↗</span>
          </a>
        </section>

        <EnrollmentForm carreras={carreras} origen="teclab" />
      </main>
      <SiteFooter />
    </>
  );
}
