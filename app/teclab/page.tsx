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

        <section id="oferta-teclab" className="teclab-offer" aria-label="Oferta académica">
          <CareersCatalog carreras={carreras} />
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

        <section className="teclab-continuity" aria-labelledby="teclab-continuity-title">
          <div className="teclab-continuity-copy">
            <p className="teclab-eyebrow">Tu recorrido puede continuar</p>
            <h2 id="teclab-continuity-title">Una tecnicatura también puede ser el comienzo de una licenciatura.</h2>
            <p>
              Varias propuestas Teclab articulan con Universidad Siglo 21. Te orientamos para conocer qué continuidad corresponde a cada título.
            </p>
          </div>

          {/* La ruta reemplaza al logo suelto que antes colgaba a la derecha: el
              convenio se entiende viendo los dos pasos, no leyendo una firma. */}
          <div className="teclab-ruta">
            <Image
              className="teclab-ruta-marca"
              src="/imagenes/teclab/logo-teclab-siglo21.webp"
              alt="Teclab y Universidad Siglo 21"
              width={380}
              height={69}
            />

            <ol className="teclab-ruta-pasos">
              <li className="teclab-ruta-paso">
                <span className="teclab-ruta-paso-orden">Empezás</span>
                <strong>Tecnicatura Teclab</strong>
                <span className="teclab-ruta-paso-dato">2 años, 100% online</span>
              </li>
              <li className="teclab-ruta-flecha" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 4v14M6 13l6 6 6-6" /></svg>
              </li>
              <li className="teclab-ruta-paso teclab-ruta-paso--siglo">
                <span className="teclab-ruta-paso-orden">Podés seguir</span>
                <strong>Licenciatura Siglo 21</strong>
                <span className="teclab-ruta-paso-dato">Según el título que tengas</span>
              </li>
            </ol>

            <a className="teclab-brutal-button" href="#formulario">
              <span className="teclab-brutal-marca" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
              </span>
              <span className="teclab-brutal-texto">
                <span>Consultar por</span>
                <span>Articulación</span>
              </span>
            </a>

            <p className="teclab-ruta-pie">Asesoramiento e inscripción en el CAU Villa Lugano</p>
          </div>
        </section>

        <section className="teclab-whatsapp" aria-labelledby="teclab-whatsapp-title">
          <div className="teclab-whatsapp-trama" aria-hidden="true" />
          <div className="teclab-tarjeta-wpp">
            <p className="teclab-eyebrow" id="teclab-whatsapp-title">Escribinos</p>
            <a className="teclab-tarjeta-wpp-numero" href="tel:+5491166522722">11 6652-2722</a>
            <a className="teclab-neon-button" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39a9.86 9.86 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.22-8.24 8.22Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.71-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.49-.4-.42-.55-.43h-.47c-.16 0-.43.06-.65.31-.22.24-.85.83-.85 2.03s.87 2.35.99 2.51c.12.17 1.71 2.62 4.15 3.67.58.25 1.03.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
              </svg>
              Abrir WhatsApp
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        <EnrollmentForm carreras={carreras} origen="teclab" />
      </main>
      <SiteFooter />
    </>
  );
}
