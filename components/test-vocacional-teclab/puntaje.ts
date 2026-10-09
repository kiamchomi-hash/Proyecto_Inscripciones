/**
 * Preguntas y puntaje del test vocacional de Teclab (/teclab/test-vocacional).
 *
 * A diferencia del test general, acá no se puntúan las áreas de Siglo 21 sino
 * cada carrera de Teclab: cada opción le suma puntos directo a los perfiles que
 * le corresponden. Las carreras salen de Supabase; este módulo sólo sabe cómo
 * reconocerlas por el nombre (igual que `getFichaTeclab`), así que una carrera
 * nueva sin perfil no rompe nada: queda fuera del resultado hasta que se le
 * agregue uno. `tests/test-vocacional-teclab.test.mjs` exige que cada carrera
 * actual tenga perfil y que pueda salir primera.
 *
 * Módulo puro, sin React ni imports de runtime, para que el test lo cargue
 * directo con Node.
 */

export type PerfilId =
  | 'programacion' | 'data-science' | 'quality-assurance' | 'redes' | 'seguridad-informatica'
  | 'cloud' | 'ia' | 'energias-renovables' | 'marketing-digital' | 'inbound-marketing'
  | 'experiencia-cliente' | 'contable' | 'seguros' | 'agraria' | 'alimentos' | 'mineria'
  | 'ambiental' | 'higiene-seguridad' | 'relaciones-laborales' | 'hotelera' | 'eventos' | 'periodismo';

type Puntos = Partial<Record<PerfilId, number>>;
export type Opcion = { texto: string; puntos: Puntos };
export type Pregunta = { eje: string; pregunta: string; opciones: Opcion[] };
type CarreraConNombre = { id: number; nombre: string; nombre_corto?: string | null; orden: number };

/**
 * Cómo se reconoce cada carrera: una palabra distintiva de `nombre` o de
 * `nombre_corto`, sin tildes. Gana el primero que coincide, así que lo más
 * específico va antes (Seguridad Informática antes que Higiene y Seguridad).
 */
export const PERFILES: { id: PerfilId; match: string[] }[] = [
  { id: 'programacion', match: ['programacion'] },
  { id: 'data-science', match: ['data science'] },
  { id: 'quality-assurance', match: ['quality assurance'] },
  { id: 'redes', match: ['redes informaticas'] },
  { id: 'seguridad-informatica', match: ['seguridad informatica'] },
  { id: 'cloud', match: ['cloud'] },
  { id: 'ia', match: ['inteligencia artificial'] },
  { id: 'energias-renovables', match: ['energias renovables'] },
  { id: 'marketing-digital', match: ['marketing digital'] },
  { id: 'inbound-marketing', match: ['inbound'] },
  { id: 'experiencia-cliente', match: ['experiencia del cliente', 'customer experience'] },
  { id: 'contable', match: ['contable'] },
  { id: 'seguros', match: ['seguros'] },
  { id: 'agraria', match: ['agraria'] },
  { id: 'alimentos', match: ['alimentos'] },
  { id: 'mineria', match: ['mineros'] },
  { id: 'ambiental', match: ['gestion ambiental'] },
  { id: 'higiene-seguridad', match: ['higiene'] },
  { id: 'relaciones-laborales', match: ['relaciones laborales'] },
  { id: 'hotelera', match: ['hotelera'] },
  { id: 'eventos', match: ['eventos'] },
  { id: 'periodismo', match: ['periodismo'] },
];

// La pregunta de duración separa el curso de IA de las tecnicaturas, que duran
// lo mismo: elegir "dos años" le suma uno a todas menos al curso.
const TECNICATURAS: Puntos = Object.fromEntries(
  PERFILES.filter(perfil => perfil.id !== 'ia').map(perfil => [perfil.id, 1]),
);

export const PREGUNTAS: Pregunta[] = [
  {
    eje: 'Mundo',
    pregunta: '¿Qué mundo te atrae más?',
    opciones: [
      { texto: 'Programas, apps y datos', puntos: { programacion: 2, 'quality-assurance': 2, 'data-science': 2, ia: 2 } },
      { texto: 'Redes, servidores y ciberseguridad', puntos: { redes: 2, cloud: 2, 'seguridad-informatica': 2 } },
      { texto: 'Marcas, ventas y clientes', puntos: { 'marketing-digital': 2, 'inbound-marketing': 2, 'experiencia-cliente': 2, seguros: 1 } },
      { texto: 'Empresas, números y equipos', puntos: { contable: 2, 'relaciones-laborales': 2, seguros: 2 } },
      { texto: 'Campo, industria y energía', puntos: { agraria: 2, alimentos: 2, mineria: 2, 'energias-renovables': 2, 'higiene-seguridad': 1 } },
      { texto: 'Turismo, medios y ambiente', puntos: { hotelera: 2, eventos: 2, periodismo: 2, ambiental: 2 } },
    ],
  },
  {
    eje: 'Tarea',
    pregunta: '¿Qué te gustaría hacer en un día de trabajo?',
    opciones: [
      { texto: 'Escribir código y crear aplicaciones', puntos: { programacion: 3, 'quality-assurance': 1 } },
      { texto: 'Probar sistemas y encontrar errores', puntos: { 'quality-assurance': 3, 'seguridad-informatica': 1 } },
      { texto: 'Analizar datos para tomar decisiones', puntos: { 'data-science': 3, ia: 2, contable: 1 } },
      { texto: 'Configurar redes, servidores y la nube', puntos: { redes: 3, cloud: 3 } },
      { texto: 'Crear contenido y campañas', puntos: { 'marketing-digital': 3, 'inbound-marketing': 3, periodismo: 2 } },
      { texto: 'Atender y asesorar personas', puntos: { 'experiencia-cliente': 3, seguros: 3, hotelera: 2, 'relaciones-laborales': 1 } },
    ],
  },
  {
    eje: 'Lugar',
    pregunta: '¿Dónde te imaginás trabajando?',
    opciones: [
      { texto: 'Desde casa, frente a la compu', puntos: { programacion: 2, 'data-science': 2, 'quality-assurance': 2, cloud: 2, ia: 2, 'inbound-marketing': 2, 'marketing-digital': 1 } },
      { texto: 'En una oficina, con un equipo', puntos: { contable: 2, 'relaciones-laborales': 2, seguros: 2, 'experiencia-cliente': 2, 'seguridad-informatica': 1, redes: 1 } },
      { texto: 'Al aire libre, en el campo', puntos: { agraria: 3, 'energias-renovables': 2, ambiental: 2, mineria: 1 } },
      { texto: 'En una planta, una fábrica o una obra', puntos: { alimentos: 3, 'higiene-seguridad': 3, mineria: 2 } },
      { texto: 'En hoteles, salones y eventos', puntos: { hotelera: 3, eventos: 3 } },
      { texto: 'En la calle o en un medio', puntos: { periodismo: 3, eventos: 1 } },
    ],
  },
  {
    eje: 'Logro',
    pregunta: '¿Qué te daría más orgullo lograr?',
    opciones: [
      { texto: 'Que un sistema no se caiga ni lo hackeen', puntos: { 'seguridad-informatica': 3, redes: 2, cloud: 2 } },
      { texto: 'Que una marca venda más', puntos: { 'marketing-digital': 3, 'inbound-marketing': 2, 'experiencia-cliente': 1 } },
      { texto: 'Que la gente trabaje segura y cuidada', puntos: { 'higiene-seguridad': 3, 'relaciones-laborales': 2, seguros: 1 } },
      { texto: 'Producir más cuidando el planeta', puntos: { 'energias-renovables': 3, ambiental: 3, agraria: 2 } },
      { texto: 'Que una experiencia salga perfecta', puntos: { eventos: 3, hotelera: 2, 'experiencia-cliente': 2 } },
      { texto: 'Automatizar tareas con inteligencia artificial', puntos: { ia: 3, 'data-science': 2, programacion: 1 } },
    ],
  },
  {
    eje: 'Material',
    pregunta: '¿Con qué preferís trabajar?',
    opciones: [
      { texto: 'Código y aplicaciones', puntos: { programacion: 3, 'quality-assurance': 2 } },
      { texto: 'Servidores, redes y la nube', puntos: { cloud: 3, redes: 2 } },
      { texto: 'Números y documentos', puntos: { contable: 3, seguros: 2, 'relaciones-laborales': 1 } },
      { texto: 'Recursos naturales y alimentos', puntos: { mineria: 3, agraria: 2, alimentos: 2, 'energias-renovables': 1 } },
      { texto: 'Personas y equipos', puntos: { 'relaciones-laborales': 3, 'experiencia-cliente': 2, hotelera: 1, eventos: 1 } },
      { texto: 'Historias y noticias', puntos: { periodismo: 3, 'inbound-marketing': 1 } },
    ],
  },
  {
    eje: 'Tema',
    pregunta: '¿Qué tema te despierta más curiosidad?',
    opciones: [
      { texto: 'Inteligencia artificial', puntos: { ia: 3, 'data-science': 1 } },
      { texto: 'Ciberseguridad', puntos: { 'seguridad-informatica': 3, redes: 1 } },
      { texto: 'Producción de alimentos y agro', puntos: { alimentos: 3, agraria: 2 } },
      { texto: 'Minería y energía', puntos: { mineria: 3, 'energias-renovables': 3 } },
      { texto: 'Finanzas y seguros', puntos: { seguros: 3, contable: 2 } },
      { texto: 'Cuidado del ambiente', puntos: { ambiental: 3, 'higiene-seguridad': 1 } },
    ],
  },
  {
    eje: 'Tiempo',
    pregunta: '¿Cuánto tiempo querés dedicarle?',
    opciones: [
      { texto: 'Algo corto para actualizarme ya', puntos: { ia: 4 } },
      { texto: 'Una tecnicatura de dos años con título', puntos: TECNICATURAS },
      { texto: 'Todavía no lo sé', puntos: {} },
    ],
  },
];

const sinTildes = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** El perfil de una carrera, o `null` si todavía no tiene uno. */
export function perfilDe(carrera: Pick<CarreraConNombre, 'nombre' | 'nombre_corto'>): PerfilId | null {
  const nombre = sinTildes(`${carrera.nombre} ${carrera.nombre_corto ?? ''}`);
  return PERFILES.find(perfil => perfil.match.some(match => nombre.includes(match)))?.id ?? null;
}

/** Puntos por perfil. Una respuesta fuera de rango no suma nada. */
export function puntuar(respuestas: number[]): Puntos {
  const total: Puntos = {};
  respuestas.forEach((indice, paso) => {
    const opcion = PREGUNTAS[paso]?.opciones[indice];
    if (!opcion) return;
    for (const [id, puntos] of Object.entries(opcion.puntos) as [PerfilId, number][]) {
      total[id] = (total[id] ?? 0) + puntos;
    }
  });
  return total;
}

/**
 * Las carreras con más afinidad. El empate se resuelve por `orden` del catálogo
 * y después por `id`, así el mismo juego de respuestas da siempre lo mismo.
 */
export function recomendar<T extends CarreraConNombre>(carreras: T[], respuestas: number[], cantidad = 3) {
  const puntos = puntuar(respuestas);
  return carreras
    .flatMap(carrera => {
      const perfil = perfilDe(carrera);
      return perfil ? [{ carrera, puntos: puntos[perfil] ?? 0 }] : [];
    })
    .sort((a, b) => b.puntos - a.puntos || a.carrera.orden - b.carrera.orden || a.carrera.id - b.carrera.id)
    .slice(0, cantidad);
}
