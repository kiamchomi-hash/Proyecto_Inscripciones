import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Carrera } from '@/components/index/types';
import { carreraToSlug, carreraFullName, esCarreraVisible } from '@/components/index/types';
import { getFamiliaTeclab } from '@/components/index/teclab';
import CareerDetail from '@/components/carreras/career-detail';
import DeferredEnrollmentForm from '@/components/carreras/deferred-enrollment-form';
import IndexFooter from '@/components/index/footer';
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

  // Google corta el <title> alrededor de los 60 caracteres. Se elige el sufijo
  // mas informativo que entre: antes quedaban titulos de 89 con "Siglo 21"
  // repetido dos veces, porque a este title el layout le sumaba su template.
  const sufijos = [
    ' a Distancia | Siglo 21 Villa Lugano',
    ' | Siglo 21 Villa Lugano',
    ' | Siglo 21',
  ];
  const sufijo = sufijos.find(s => nombreCompleto.length + s.length <= 62) ?? sufijos[sufijos.length - 1];
  const title = `${nombreCompleto}${sufijo}`;

  const description = carrera.proximamente
    ? `${nombreCompleto} en Universidad Siglo 21: ${carrera.duracion}, a distancia. Todavia no abrio la inscripcion, dejanos tus datos y te avisamos.`
    : `Estudia ${nombreCompleto} a distancia en Universidad Siglo 21. ${carrera.duracion}. Sede CAU Villa Lugano: atencion cerca de Zona Sur y Oeste.`;

  const canonicalSlug = carreraToSlug(carrera);

  return {
    // absolute: sin esto el layout le agrega " | Siglo 21" al final y la marca
    // aparece duplicada.
    title: { absolute: title },
    description,
    keywords: [nombreCompleto, carrera.nombre, 'universidad siglo 21', 'villa lugano', carrera.nivel, 'estudiar a distancia', 'CABA'],
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
  const mismoNivel = carreras.filter(c => c.nivel === carrera.nivel && c.id !== carrera.id).slice(0, 6);
  const otrosNiveles = carreras.filter(c => c.nivel !== carrera.nivel);
  const desde = otrosNiveles.length ? (carrera.id * 2) % otrosNiveles.length : 0;
  const cruzadas = otrosNiveles.length
    ? [otrosNiveles[desde], otrosNiveles[(desde + 1) % otrosNiveles.length]].filter(
        (c, i, arr) => c && arr.indexOf(c) === i
      )
    : [];

  // Solo se manda lo que se pinta; la fila entera arrastra todos los slides.
  const relacionadas = [...mismoNivel, ...cruzadas]
    .map(c => ({ id: c.id, nombre: c.nombre, prefix: c.prefix }));

  // El formulario solo necesita id/nombre/nivel: mandarle la fila entera metia
  // todas las carreras completas en el HTML de cada pagina.
  const opcionesFormulario = carreras.map(c => ({ id: c.id, nombre: c.nombre, nivel: c.nivel }));

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": carreraFullName(carrera),
    "url": url,
    "description": carrera.descripcion || `Estudia ${carrera.nombre} en Universidad Siglo 21 CAU Villa Lugano. ${carrera.enfoque}.`,
    "provider": {
      "@type": "CollegeOrUniversity",
      "name": "Universidad Siglo 21",
      "url": "https://21.edu.ar",
    },
    "educationalLevel": carrera.nivel,
    "timeToComplete": carrera.duracion,
    "educationalCredentialAwarded": carrera.titulo,
    "inLanguage": "es",
    "courseMode": "blended",
    "location": {
      "@type": "Place",
      "name": "CAU Villa Lugano",
      "address": POSTAL_ADDRESS,
    },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main className="flex-1">
        <CareerDetail carrera={carrera} relacionadas={relacionadas} />
        <DeferredEnrollmentForm carreras={opcionesFormulario} />
        <IndexFooter />
      </main>
    </>
  );
}
