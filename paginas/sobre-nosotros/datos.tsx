/**
 * Los datos de la página del CAU.
 *
 * Viven en un módulo aparte y no en el componente porque su versión markdown
 * los usa también: dos copias del mismo texto se desincronizan.
 */

import { MAPS_URL } from '@/lib/sede';

export const metadata = {
  // Es la pagina con mas impresiones del sitio despues del home (124 en 30 dias)
  // y cero clics: "Sobre Nosotros | Siglo 21" no le decia a nadie que aca hay una
  // sede fisica con direccion. El titulo va absolute para no arrastrar el
  // template del layout.
  title: { absolute: 'CAU Siglo 21 en CABA | Villa Lugano, Guaminí 4876' },
  description: 'Centro de Aprendizaje Universitario de Universidad Siglo 21 en el sur de CABA: Guaminí 4876, Villa Lugano, Comuna 8. Inscripciones y tutorías presenciales.',
  keywords: ['CAU CABA', 'CAU villa lugano', 'centro de aprendizaje universitario', 'universidad siglo 21 caba', 'comuna 8', 'CABA zona sur'],
  alternates: {
    canonical: '/sobre-nosotros',
  },
};

/* ── Data ────────────────────────────────────────────────── */

export const FEATURES = [
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

export const STATS = [
  { value: '+1000', label: 'Egresados en nuestra sede' },
  { value: '+88', label: 'Carreras, cursos y capacitaciones' },
  { value: '100%', label: 'Modalidad a distancia' },
  { value: '30', label: 'Años en el barrio' },
];

export const CHECKLIST = [
  'Capacitaciones y cursos online',
  'Carreras y diplomaturas con Universidad Siglo 21',
  'Talleres culturales y comunitarios',
  'Coworking, consultorios y salas de reunión',
  'Capacitaciones para empresas y PYMES',
];

/**
 * Preguntas de la sede, con las mismas respuestas que ya decía la página.
 *
 * Se publican también como `FAQPage` en `cloudflare/src/pages/sobre-nosotros.astro`:
 * un buscador o un asistente que necesite "dónde queda" o "hasta qué hora
 * atiende" tiene que encontrar la respuesta en una frase completa y no
 * deducirla de un párrafo.
 */
export interface PreguntaSede {
  pregunta: string;
  respuesta: string;
  /** Sólo la pregunta que manda a la ficha de Google. */
  enlace?: string;
}

export const PREGUNTAS_SEDE: PreguntaSede[] = [
  {
    pregunta: '¿Dónde queda el CAU de Universidad Siglo 21 en CABA?',
    respuesta: 'En Guaminí 4876, Villa Lugano, Comuna 8 de la Ciudad Autónoma de Buenos Aires.',
  },
  {
    pregunta: '¿Cuál es el horario de atención de la sede?',
    respuesta: 'De lunes a viernes, de 8:00 a 20:00, en turnos mañana y tarde.',
  },
  {
    pregunta: '¿Qué se puede hacer en la sede?',
    respuesta: 'Inscribirse a las carreras y diplomaturas de Universidad Siglo 21, rendir y recibir acompañamiento presencial. En el mismo espacio funcionan las clases de apoyo, los talleres culturales y el coworking.',
  },
  {
    pregunta: '¿Las carreras se cursan en la sede?',
    respuesta: 'No: la cursada es a distancia. La sede es el lugar donde te inscribís, rendís y te acompañan.',
  },
  {
    pregunta: '¿Cómo llego?',
    respuesta: 'La sede está en Guaminí 4876, Villa Lugano. El mapa de esta página y el botón «Cómo llegar» abren la ficha del lugar en Google Maps.',
    enlace: MAPS_URL,
  },
];

