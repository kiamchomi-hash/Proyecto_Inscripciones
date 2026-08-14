import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Carrera } from '@/components/index/types';
import { carreraToSlug, carreraFullName, esCarreraVisible } from '@/components/index/types';
import { esCursoTeclab, getFamiliaTeclab, esTeclab, getFichaTeclab, parseEnfoqueTeclab } from '@/components/index/teclab';
import { parseIAMeta, tienePlanDeEstudios } from '@/components/carreras/career-content';
import CareerDetail from '@/components/carreras/career-detail';
import DeferredEnrollmentForm from '@/components/carreras/deferred-enrollment-form';
import SiteFooter from '@/components/footer';
import { jsonLdScript } from '@/lib/json-ld';
import { POSTAL_ADDRESS } from '@/lib/sede';
import '../career-detail.css';

// 24 h, no 1 h: son ~96 paginas y cada regeneracion es un ISR Write de Vercel.
// A 3600 el techo era ~69.000 writes/mes solo por reloj, sobre 200.000 de cuota
// gratuita. Los datos de carreras cambian una vez por mes; si hace falta que un
// cambio de Supabase se vea antes, un redeploy fuerza la regeneracion.
export const revalidate = 86400;

async function getCarreras() {
  const { data } = await supabase
    .from('carreras')
    .select('*')
    .eq('activa', true)
    .order('orden', { ascending: true });
  // Solo la oferta vigente: los niveles fuera del catalogo no tienen pagina.
  return ((data || []) as Carrera[]).filter(esCarreraVisible);
}

// Miniatura para compartir, una por familia. Ni Teclab ni las diplomaturas de
// convenio son Siglo 21: cada marca lleva su portada, con sus colores y su logo, y
// ninguna de las dos menciona a la universidad. Las genera `herramientas/generar-og.mjs`.
function ogCarrera(carrera: Carrera): string {
  if (carrera.nivel === 'Identidad Argentina') return '/imagenes/og/default-identidad-argentina.jpg';
  const familia = getFamiliaTeclab(carrera);
  if (familia) return `/imagenes/og/default-teclab-${familia}.jpg`;
  return '/imagenes/og/default.jpg';
}

// Google corta el <title> alrededor de los 60 caracteres.
const MAX_TITULO = 60;

// Pero el corte real se mide en pixeles, no en caracteres, asi que hay unos
// pocos de margen. Se usan solo para los nombres que no entran de ninguna
// forma: ahi vale mas un titulo que se pasa por poco y llega a mostrar la marca
// que uno cortito que se queda sin ella. Mas alla de esto la marca sale cortada
// a mitad de palabra, que es peor que no ponerla.
const TOLERANCIA_TITULO = 66;

// Y la description alrededor de los 160, tambien por pixeles. El presupuesto va
// un poco por encima a proposito: pasarse hace que Google corte la ultima frase,
// que es la que menos importa, mientras que quedarse corto la borra entera. Con
// 158 habia fichas que perdian "Plan de estudios e inscripcion en el CAU Villa
// Lugano" -- lo unico que invita a hacer algo -- por un solo caracter.
const MAX_DESCRIPCION = 165;

/**
 * Titulo que entra entero en el resultado de Google.
 *
 * Se prueba el nombre completo con el sufijo mas informativo que entre y, si
 * ninguno entra, se baja a `nombre_corto` -- el mismo nombre sin el prefijo,
 * que ya viene cargado en Supabase para 94 de las 96 carreras.
 *
 * Antes el `??` del final pegaba " | Siglo 21" aunque no entrara, asi que 36 de
 * las 96 fichas pasaban de 60 caracteres y Google cortaba justo la marca. Es la
 * peor mitad para perder: las consultas que traen impresiones son casi todas
 * "<carrera> siglo 21" o "siglo 21 <carrera>", o sea que la marca es la mitad
 * de lo que la persona escribio y lo que espera ver en negrita.
 */
function tituloSEO(carrera: Carrera): string {
  const nombreCompleto = carreraFullName(carrera);

  // Las diplomaturas son de convenio con la Academia Identidad Argentina, no de
  // la universidad: su titulo no la nombra. Las de Teclab si articulan con la
  // Siglo 21, pero el titulo lo emite el instituto: nombrar solo a la
  // universidad hacia que el resultado de Google se leyera como una carrera de
  // Siglo 21 y la persona se enterara recien despues de entrar.
  const conTeclab = esTeclab(carrera) || esCursoTeclab(carrera);
  const sufijos = carrera.nivel === 'Identidad Argentina'
    ? [' | Academia Identidad Argentina', ' | Identidad Argentina']
    : conTeclab
      // Las dos marcas siempre juntas: el titulo lo emite el instituto, pero la
      // carrera articula para seguir en la universidad, asi que Siglo 21 no es
      // relleno de marca sino parte de lo que se ofrece -- y ademas es la mitad
      // de lo que la gente escribe en el buscador. No hay variante con la sede
      // sola ("Teclab · CAU Villa Lugano") ni con el instituto solo: cualquiera
      // de las dos entra en los nombres largos y les gana a esta, que es la
      // unica que nombra a las dos.
      ? [' | Teclab · Siglo 21 Villa Lugano', ' | Teclab · Siglo 21']
      : [' a Distancia | Siglo 21 Villa Lugano', ' | Siglo 21 Villa Lugano', ' | Siglo 21'];

  // Con que quedarse cuando ni el nombre mas corto entra con el sufijo mas
  // corto. Solo ahi vale " | Teclab" pelado: el curso tiene el nombre mas largo
  // de las 96 fichas y la alternativa era dejarlo sin ninguna marca.
  const sufijoMinimo = conTeclab ? ' | Teclab' : sufijos[sufijos.length - 1];

  // Del nombre mas informativo al mas corto, sin repetir: en las carreras de una
  // sola palabra ("Abogacia") los dos son iguales.
  const nombres = [nombreCompleto, carrera.nombre_corto]
    .filter((n): n is string => Boolean(n))
    .filter((n, i, arr) => arr.indexOf(n) === i);

  for (const nombre of nombres) {
    for (const sufijo of sufijos) {
      if (nombre.length + sufijo.length <= MAX_TITULO) return `${nombre}${sufijo}`;
    }
  }

  // Ninguno entra limpio. Se prueba el par mas corto que exista, aunque se pase:
  // "Martillero, Corredor Publico y Corredor Inmobiliario | Siglo 21" son 63
  // caracteres y la consulta que le trae impresiones es "siglo 21 martillero
  // publico", o sea que soltar la marca seria soltar media consulta.
  const masCorto = `${nombres[nombres.length - 1]}${sufijoMinimo}`;
  if (masCorto.length <= TOLERANCIA_TITULO) return masCorto;

  // Ni asi: mejor el nombre entero sin marca que el nombre entero con la marca
  // cortada a mitad de palabra.
  return nombreCompleto;
}

/**
 * Junta las partes de una description y suelta las de atras hasta entrar en el
 * presupuesto. Por eso el orden importa: adelante va lo que distingue a esta
 * carrera de las otras 95, atras lo que se repite en todas y no se extraña.
 */
function armarDescripcion(partes: (string | false | null | undefined)[]): string {
  const vivas = partes.filter((p): p is string => Boolean(p));
  while (vivas.length > 1 && vivas.join(' ').length > MAX_DESCRIPCION) vivas.pop();
  return vivas.join(' ');
}

/**
 * Description con contenido propio de la carrera.
 *
 * La anterior era la misma plantilla para las 96 fichas y gastaba media linea en
 * "atencion cerca de Zona Sur y Oeste", que no es lo que se busca cuando se
 * escribe "plan de estudio comercio internacional siglo 21". Ahora arranca por
 * el dato que ninguna otra ficha repite: el enfoque en las de Siglo 21, el
 * titulo tecnico en Teclab, la certificacion en las de convenio.
 */
function descripcionSEO(carrera: Carrera): string {
  const nombreCompleto = carreraFullName(carrera);
  const conPlan = tienePlanDeEstudios(carrera);

  // Las `proximamente` estan anunciadas pero sin inscripcion abierta: la ficha
  // capta la busqueda igual, y prometer inscripcion seria mentir.
  const cierre = carrera.proximamente
    ? 'Todavía no abrió la inscripción: dejanos tus datos y te avisamos.'
    : conPlan
      ? 'Plan de estudios e inscripción en el CAU Villa Lugano.'
      : 'Inscripción y consultas en el CAU Villa Lugano.';

  if (carrera.nivel === 'Identidad Argentina') {
    const { modalidad } = parseIAMeta(carrera.enfoque || '');
    // Nombre corto y no el completo: el largo se comia el cierre, que es la
    // unica parte que invita a hacer algo. Pero algun nombre tiene que ir, y no
    // por repetir el <title>: sin el, las diplomaturas que comparten duracion y
    // modalidad quedaban con la description identica caracter por caracter, que
    // es de las pocas cosas que Google penaliza de verdad.
    const nombre = carrera.nombre_corto || nombreCompleto;
    return armarDescripcion([
      `${nombre} con la Academia Identidad Argentina: ${carrera.duracion}, ${(modalidad || 'a distancia').toLowerCase()}.`,
      cierre,
      'Certificación nacional e internacional.',
    ]);
  }

  if (esCursoTeclab(carrera)) {
    const { modalidad } = parseEnfoqueTeclab(carrera.enfoque);
    return armarDescripcion([
      `${carrera.nombre_corto || nombreCompleto}: curso de Teclab de ${carrera.duracion}, ${(modalidad || 'a distancia').toLowerCase()}.`,
      'Certificado oficial. Inscripción y consultas en el CAU Villa Lugano.',
    ]);
  }

  if (esTeclab(carrera)) {
    const { titulo, modalidad } = parseEnfoqueTeclab(carrera.enfoque);
    // El titulo de Teclab viene con el nombre en ingles entre parentesis y a
    // veces con punto final ("... en la Nube (Cloud Administration)."). El
    // parentesis se saca: son 20 caracteres que el <title> ya cubre.
    const grado = (titulo || nombreCompleto).replace(/\s*\([^)]*\)/g, '').replace(/\.$/, '');
    // El partner sale de la ficha oficial y no del campo "Cocreación" de
    // Supabase, donde quedaron valores genericos que no son empresas.
    const partner = getFichaTeclab(carrera)?.partner?.nombre;
    return armarDescripcion([
      // "Carrera de Teclab" adelante y no al final: es lo primero que hay que
      // saber, y las partes de atras son justo las que Google corta.
      `Carrera de Teclab. Recibite de ${grado} en ${carrera.duracion}, ${(modalidad || 'a distancia').toLowerCase()}.`,
      // El partner va antes del cierre porque el presupuesto no alcanza para
      // los dos: medido sobre las 16 fichas en vivo, con el cierre adelante el
      // partner se caia en 15. Y es al reves de lo que conviene: el cierre se
      // repite en las 96 fichas del sitio, mientras que el partner es justo lo
      // unico que distingue a cada Teclab de las otras 16.
      partner && `Cocreada con ${partner}.`,
      // La articulacion con la licenciatura no entra aca y no es por descuido:
      // medido sobre las 17 fichas, la frase mas corta que la dice son 50
      // caracteres y el presupuesto ya se agota antes. Elegir seria cambiar el
      // CTA por el diferencial. Vive en la franja de marca de la pagina, que es
      // donde igual se lee mejor.
      cierre,
    ]);
  }

  return armarDescripcion([
    // El enfoque es la unica frase que ninguna otra carrera repite, y viene
    // limpio en las 68: sin saltos de linea y de 21 a 68 caracteres.
    `${carrera.enfoque.trim().replace(/\.$/, '')}.`,
    'A distancia con Universidad Siglo 21.',
    cierre,
    `Duración: ${carrera.duracion}.`,
  ]);
}

function findBySlug(carreras: Carrera[], slug: string): Carrera | undefined {
  // Try exact match first
  const exact = carreras.find(c => carreraToSlug(c) === slug);
  if (exact) return exact;
  // Try old format (underscores, mixed case) → normalize and match
  const normalized = slug.toLowerCase().replace(/_/g, '-');
  return carreras.find(c => carreraToSlug(c) === normalized);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const carreras = await getCarreras();
  const carrera = findBySlug(carreras, slug);
  if (!carrera) return { title: 'Carrera no encontrada' };

  // Nombre completo con prefijo ("Licenciatura en Administracion", no solo
  // "Administracion"): es el termino que la gente busca y da mejor CTR.
  const nombreCompleto = carreraFullName(carrera);

  // Las diplomaturas son de convenio con la Academia Identidad Argentina, no de la
  // universidad: ni el titulo, ni la descripcion, ni las keywords la nombran.
  const esIA = carrera.nivel === 'Identidad Argentina';

  const title = tituloSEO(carrera);
  const description = descripcionSEO(carrera);

  const canonicalSlug = carreraToSlug(carrera);

  return {
    // absolute: sin esto el layout le agrega " | Siglo 21" al final y la marca
    // aparece duplicada.
    title: { absolute: title },
    description,
    keywords: esIA
      ? [nombreCompleto, carrera.nombre, 'academia identidad argentina', 'diplomatura online', 'villa lugano', carrera.nivel, 'CABA']
      : esTeclab(carrera) || esCursoTeclab(carrera)
        ? [nombreCompleto, carrera.nombre, 'teclab', 'instituto tecnico superior teclab', 'universidad siglo 21', 'villa lugano', carrera.nivel, 'CABA']
        : [nombreCompleto, carrera.nombre, 'universidad siglo 21', 'villa lugano', carrera.nivel, 'estudiar a distancia', 'CABA'],
    alternates: {
      canonical: `https://www.siglo21sur.com/carreras/${canonicalSlug}`,
    },
    // Declarar openGraph aca reemplaza el del layout, no lo completa: sin images
    // explicitas la ficha se comparte sin miniatura. Las diplomaturas de convenio
    // llevan la portada de la Academia, que no menciona a Siglo 21.
    openGraph: {
      title,
      description,
      url: `https://www.siglo21sur.com/carreras/${canonicalSlug}`,
      images: [ogCarrera(carrera)],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogCarrera(carrera)] },
  };
}

export async function generateStaticParams() {
  const carreras = await getCarreras();
  return carreras.map(c => ({ slug: carreraToSlug(c) }));
}

export default async function CarreraPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const carreras = await getCarreras();

  const carrera = findBySlug(carreras, slug);
  if (!carrera) notFound();

  // Redirect old format URLs to new canonical slug
  const canonicalSlug = carreraToSlug(carrera);
  if (slug !== canonicalSlug) {
    permanentRedirect(`/carreras/${canonicalSlug}`);
  }

  const url = `https://www.siglo21sur.com/carreras/${canonicalSlug}`;

  // Enlaces internos entre paginas de carrera: seis del mismo nivel y dos de
  // otro. Enlazar solo dentro del nivel dejaba cinco silos incomunicados, y se
  // nota en la medicion: las 15 carreras que Google indexo solo despues del
  // deploy del 24/07 son todas de Grado, mientras Pregrado, CCC e Identidad
  // Argentina siguen enteros afuera. Las dos de afuera del nivel le dan a esos
  // grupos una puerta desde las fichas que Google ya rastrea.
  //
  // El corte rota con el id para que no todas las fichas apunten a las mismas
  // dos carreras, y es deterministico para no romper el cache de ISR.
  //
  // El curso de Teclab es el unico de su nivel: sin excepcion se quedaba sin
  // enlaces propios y la seccion mostraba dos carreras de Siglo 21 bajo un
  // titulo que prometia Teclab. Sus hermanas son las tecnicaturas del instituto.
  const hermanas = esCursoTeclab(carrera)
    ? carreras.filter(c => esTeclab(c))
    : carreras.filter(c => c.nivel === carrera.nivel && c.id !== carrera.id);
  const mismoNivel = hermanas.slice(0, 6);
  const otrosNiveles = carreras.filter(c => c.nivel !== carrera.nivel);
  const desde = otrosNiveles.length ? (carrera.id * 2) % otrosNiveles.length : 0;
  const cruzadas = otrosNiveles.length
    ? [otrosNiveles[desde], otrosNiveles[(desde + 1) % otrosNiveles.length]].filter(
        (c, i, arr) => c && arr.indexOf(c) === i
      )
    : [];

  // Solo se manda lo que se pinta; la fila entera arrastra todos los slides.
  // Sin el filtro por id, en el curso -cuyas hermanas salen de otro nivel- una
  // misma carrera podia entrar dos veces.
  const relacionadas = [...mismoNivel, ...cruzadas]
    .filter((c, i, arr) => arr.findIndex(o => o.id === c.id) === i)
    .map(c => ({ id: c.id, nombre: c.nombre, prefix: c.prefix }));

  // El formulario solo necesita id/nombre/nivel: mandarle la fila entera metia
  // todas las carreras completas en el HTML de cada pagina.
  const opcionesFormulario = carreras.map(c => ({ id: c.id, nombre: c.nombre, nivel: c.nivel }));

  // Quien dicta cada programa. Ojo: esto no es texto de marketing sino un dato
  // estructurado, o sea la afirmacion mas fuerte que la pagina le hace a Google.
  // Las diplomaturas son de la Academia Identidad Argentina, no de la universidad:
  // declararlas con provider "Universidad Siglo 21" seria decir que las dicta ella.
  const esDiplomaturaIA = carrera.nivel === 'Identidad Argentina';
  const esCursoTeclabActual = esCursoTeclab(carrera);
  // El titulo de una tecnicatura de Teclab lo emite el instituto, igual que el
  // del curso. Hasta el 01/08/2026 la excepcion cubria solo los cursos y las 17
  // tecnicaturas salian declaradas con provider "Universidad Siglo 21": no era
  // un matiz de redaccion sino un dato estructurado equivocado.
  const conTeclab = esCursoTeclabActual || esTeclab(carrera);
  const provider = esDiplomaturaIA
    ? {
        "@type": "Organization",
        "name": "Academia Identidad Argentina",
        "url": "https://identidadargentina.com.ar",
      }
    : conTeclab
      ? {
          "@type": "EducationalOrganization",
          "name": "Teclab Instituto Técnico Superior",
          "url": "https://teclab.edu.ar",
        }
      : {
        "@type": "CollegeOrUniversity",
        "name": "Universidad Siglo 21",
        "url": "https://21.edu.ar",
      };

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": carreraFullName(carrera),
    "url": url,
    "description": carrera.descripcion || (
      esDiplomaturaIA
        ? `Estudia ${carrera.nombre} con la Academia Identidad Argentina. ${carrera.enfoque}.`
        : esCursoTeclabActual
          ? `Curso de ${carrera.nombre} dictado por Teclab. Consultas en el CAU Villa Lugano.`
          : conTeclab
            ? `${carrera.nombre}, carrera de Teclab Instituto Técnico Superior. Inscripción y acompañamiento en el CAU Villa Lugano.`
            : `Estudia ${carrera.nombre} en Universidad Siglo 21 CAU Villa Lugano. ${carrera.enfoque}.`
    ),
    provider,
    "educationalLevel": esCursoTeclabActual ? 'Curso' : carrera.nivel,
    // "Consultar" es el relleno de una ficha sin datos confirmados: declararlo
    // como dato estructurado seria afirmarle a Google algo que no sabemos.
    ...(carrera.duracion && carrera.duracion !== 'Consultar' ? { "timeToComplete": carrera.duracion } : {}),
    ...(carrera.titulo && carrera.titulo !== 'Consultar' ? { "educationalCredentialAwarded": carrera.titulo } : {}),
    "inLanguage": "es",
    // El curso se dicta entero por videollamada; las carreras combinan la
    // plataforma con la tutoria presencial del CAU.
    ...(esCursoTeclabActual ? {
      "courseMode": "online",
    } : {
      "courseMode": "blended",
      "location": {
        "@type": "Place",
        "name": "CAU Villa Lugano",
        "address": POSTAL_ADDRESS,
      },
    }),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.siglo21sur.com" },
      { "@type": "ListItem", "position": 2, "name": carreraFullName(carrera), "item": url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(courseSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbSchema) }}
      />
      <main className="flex-1">
        <CareerDetail carrera={carrera} relacionadas={relacionadas} />
        <DeferredEnrollmentForm carreras={opcionesFormulario} />
      </main>
      <SiteFooter />
    </>
  );
}
