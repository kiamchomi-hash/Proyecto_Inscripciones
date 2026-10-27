import Image from 'next/image';
import Link from 'next/link';
import {
  type CarreraCatalogo, carreraToSlug,
} from '@/components/index/types';
import { esCursoTeclab, esTeclab } from '@/components/index/teclab';
import CareersCatalog from '@/components/index/careers-catalog';
import FormularioLead from '@/components/formularios/formulario-lead';
import { jsonLdScript } from '@/lib/json-ld';
import { ContextoTurnstile, type ConfigTurnstile } from './turnstile-contexto';

// Cuerpo de `app/teclab/page.tsx`, sin rediseño ni copy nuevo: mismos
// componentes, mismo orden y mismos textos. Lo único que cambia es lo que en
// Next resolvía el runtime del sitio:
//
// - el catálogo llega por props, leído de D1 con la taxonomía compartida;
// - `poppins.variable` (la clase de `next/font`) se reemplaza por la clase
//   `fuente-poppins`, que declara `--font-poppins` con la Poppins autoalojada;
// - el pie queda fuera de la isla: no tiene estado y lo renderiza la página.
//
// Va como una sola isla porque el catálogo y los dos formularios son
// interactivos y comparten el mismo array de carreras.

const URL = 'https://www.siglo21sur.com/teclab';

/**
 * Mosaico del hero: la primera pantalla muestra de que se trata la oferta en
 * vez de describirla. La libreria de Teclab (public/imagenes/teclab/carreras/,
 * bajada con scripts/descargar-assets-teclab.mjs) es casi toda retratos de
 * estudio; estas dos tienen escena y alternan oscuro y claro. Son dos y no
 * cuatro para que el hero no pase de media pantalla y el catalogo asome.
 */
const MOSAICO = [
  '/imagenes/teclab/carreras/programacion.webp',
  '/imagenes/teclab/carreras/quality-assurance.webp',
];

/**
 * Empresas que cocrearon carreras y publican logo en su ficha. La lista y los
 * nombres salen de FICHAS en components/index/teclab.ts (campo `partner`); si
 * ahi cambia un partner, esta tira hay que actualizarla. Las medidas son las
 * intrinsecas de cada archivo: todos vienen a 420 de ancho.
 */
const PARTNERS = [
  { nombre: 'AWS Academy', logo: '/imagenes/teclab/partners/aws.webp', alto: 105 },
  { nombre: 'Google', logo: '/imagenes/teclab/partners/google.webp', alto: 138 },
  { nombre: 'Microsoft', logo: '/imagenes/teclab/partners/microsoft.webp', alto: 90 },
  { nombre: 'HubSpot', logo: '/imagenes/teclab/partners/hubspot.webp', alto: 156 },
  { nombre: 'Zendesk', logo: '/imagenes/teclab/partners/zendesk.webp', alto: 108 },
  { nombre: 'Avenga', logo: '/imagenes/teclab/partners/avenga.webp', alto: 87 },
];

export default function PaginaTeclab(
  { carreras, turnstile }: { carreras: CarreraCatalogo[]; turnstile: ConfigTurnstile },
) {
  const tecnicaturas = carreras.filter(esTeclab).length;
  const cursos = carreras.filter(esCursoTeclab).length;
  const total = carreras.length;

  const jsonLd = jsonLdScript([
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Tecnicaturas y cursos Teclab',
      description: 'Tecnicaturas y cursos Teclab 100% online con asesoramiento personalizado.',
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
    <ContextoTurnstile.Provider value={turnstile}>
      <main className="teclab-page fuente-poppins">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

        <section className="teclab-hero" aria-labelledby="teclab-title">
          <div className="teclab-hero-trama" aria-hidden="true" />
          <div className="teclab-hero-lines" aria-hidden="true" />

          <div className="teclab-hero-content">
            <div className="teclab-hero-decir">
              <Image
                className="teclab-hero-logo"
                src="/imagenes/teclab/logo-teclab-siglo21.webp"
                alt="Teclab, Instituto Técnico Superior, y Universidad Siglo 21"
                width={380}
                height={69}
                preload
              />
              <h1 id="teclab-title">
                {/* El "de" no se ve pero se lee: el titulo visible es mas corto y el
                    H1 sigue diciendo la frase completa. */}
                Tecnicaturas<span className="sr-only"> de </span>
                <br />
                <span className="teclab-resalte teclab-resalte--cian">dos años</span>{' '}
                <span className="teclab-resalte teclab-resalte--azul">100% online</span>
              </h1>
              <div className="teclab-hero-actions">
                <a className="teclab-button teclab-button--primary" href="#oferta-teclab">
                  Ver las carreras
                  <span aria-hidden="true">↓</span>
                </a>
                <a className="teclab-button teclab-button--secundario" href="#preinscripcion">
                  Quiero inscribirme <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>

            {/* Las fotos arriba y las empresas debajo: la prueba de las alianzas
                acompaña a las imagenes en vez de alargar la columna del titulo. */}
            <div className="teclab-hero-visual">
              <div className="teclab-hero-mosaico" aria-hidden="true">
                {MOSAICO.map((src, i) => (
                  <div key={src}>
                    <Image src={src} alt="" fill sizes="(max-width: 760px) 45vw, 24vw" preload={i === 0} />
                  </div>
                ))}
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
          </div>
        </section>

        <section id="oferta-teclab" className="teclab-offer" aria-label="Oferta académica">
          <CareersCatalog carreras={carreras} />
        </section>

        {/* Para quien recorrio el catalogo y no se decide: el test recomienda
            entre estas mismas carreras y termina en la ficha o en WhatsApp. */}
        <section className="teclab-test" aria-labelledby="teclab-test-title">
          <div>
            <h2 id="teclab-test-title">¿Qué carrera elegir?</h2>
            <p>Respondé siete preguntas y conocé las carreras más afines a tus intereses.</p>
          </div>
          <Link className="teclab-button teclab-button--ghost" href="/teclab/test-vocacional">
            Hacer el test vocacional <span aria-hidden="true">→</span>
          </Link>
        </section>

        {/* Toda la oferta de esta página es de una casa, así que acá la casa
            va fija y no hay nada dinámico: los campos son siempre los de Teclab. */}
        <FormularioLead carreras={carreras} modo="contacto" casa="teclab" origen="teclab" />
        <FormularioLead carreras={carreras} modo="preinscripcion" casa="teclab" origen="teclab" />

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

            <a className="teclab-brutal-button" href="#preinscripcion">
              <span className="teclab-brutal-marca" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
              </span>
              <span className="teclab-brutal-texto">
                <span>Consultar por</span>
                <span>Articulación</span>
              </span>
            </a>

            {/* Sin la sede: esta pagina vende una oferta 100% online y nombrar
                una direccion le suma una barrera al lead que esta lejos. */}
            <p className="teclab-ruta-pie">Te asesoramos y hacemos la inscripción con vos, 100% online</p>
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
      </main>
    </ContextoTurnstile.Provider>
  );
}
