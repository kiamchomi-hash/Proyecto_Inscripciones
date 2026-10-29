/**
 * Preguntas y puntaje del test vocacional de Teclab (/teclab/test-vocacional).
 *
 * A diferencia del test general, acá no se puntúan las áreas de Siglo 21 sino
 * cada carrera de Teclab: cada opción le suma puntos directo a los perfiles que
 * le corresponden. Las carreras salen de D1; este módulo sólo sabe cómo
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
  | 'cloud' | 'energias-renovables' | 'marketing-digital' | 'inbound-marketing'
  | 'experiencia-cliente' | 'contable' | 'seguros' | 'agraria' | 'alimentos' | 'mineria'
  | 'ambiental' | 'higiene-seguridad' | 'relaciones-laborales' | 'hotelera' | 'eventos' | 'periodismo'
  | 'administracion' | 'finanzas-digitales' | 'logistica' | 'comercio-exterior' | 'riesgos'
  | 'producto-digital' | 'experiencia-usuario' | 'equipos-agiles' | 'recursos-humanos' | 'videojuegos';

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
  { id: 'videojuegos', match: ['desarrollo de videojuegos'] },
  { id: 'programacion', match: ['programacion'] },
  { id: 'data-science', match: ['data science'] },
  { id: 'quality-assurance', match: ['quality assurance'] },
  { id: 'redes', match: ['redes informaticas'] },
  { id: 'seguridad-informatica', match: ['seguridad informatica'] },
  { id: 'cloud', match: ['cloud'] },
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
  { id: 'administracion', match: ['administracion de empresas'] },
  { id: 'finanzas-digitales', match: ['negocios digitales financieros'] },
  { id: 'logistica', match: ['logistica'] },
  { id: 'comercio-exterior', match: ['comercio exterior'] },
  { id: 'riesgos', match: ['riesgos empresariales'] },
  // No 'producto digital' a secas: es el nombre de la anunciada de baja (id 245).
  { id: 'producto-digital', match: ['diseno de producto digital'] },
  { id: 'experiencia-usuario', match: ['experiencia de usuario'] },
  { id: 'equipos-agiles', match: ['equipos agiles', 'agile coaching'] },
  { id: 'recursos-humanos', match: ['recursos humanos'] },
];

// Los pesos se ajustaron simulando todas las combinaciones de respuestas. Con
// las nueve altas del 16/10/2026 (30 tecnicaturas) se sumó la pregunta del
// desafío, que les da a las nuevas una opción propia, y se volvieron a ajustar
// los pesos sobre las 279.936 combinaciones: cada tecnicatura sale primera sola
// entre el 2,1% y el 4% de las veces y el 9,4% termina en empate. Cada opción
// suma sólo a carreras que su texto describe; lo que se ajustó es cuánto. Si se
// toca un peso o una opción, el test de balance de
// tests/test-vocacional-teclab.test.mjs dice si se desparejó.
export const PREGUNTAS: Pregunta[] = [
  {
    eje: 'Mundo',
    pregunta: '¿Qué mundo te atrae más?',
    opciones: [
      { texto: 'Programas, apps y datos', puntos: { programacion: 5, videojuegos: 5, 'quality-assurance': 4, 'data-science': 2, 'producto-digital': 3, 'experiencia-usuario': 3 } },
      { texto: 'Redes, servidores y ciberseguridad', puntos: { redes: 3, cloud: 3, 'seguridad-informatica': 6 } },
      { texto: 'Marcas, ventas y clientes', puntos: { 'marketing-digital': 6, 'inbound-marketing': 7, 'experiencia-cliente': 4 } },
      { texto: 'Empresas, números y equipos', puntos: { contable: 6, 'relaciones-laborales': 4, seguros: 3, administracion: 5, 'finanzas-digitales': 3, 'recursos-humanos': 1, 'equipos-agiles': 5, riesgos: 3 } },
      { texto: 'Campo, industria y energía', puntos: { agraria: 4, alimentos: 3, mineria: 4, 'energias-renovables': 6, 'higiene-seguridad': 5, logistica: 4 } },
      { texto: 'Turismo, medios y ambiente', puntos: { hotelera: 4, eventos: 2, periodismo: 2, ambiental: 4 } },
    ],
  },
  {
    eje: 'Tarea',
    pregunta: '¿Qué te gustaría hacer en un día de trabajo?',
    opciones: [
      { texto: 'Escribir código y crear aplicaciones', puntos: { programacion: 5, videojuegos: 5 } },
      { texto: 'Probar sistemas y encontrar errores', puntos: { 'quality-assurance': 6 } },
      { texto: 'Analizar datos para tomar decisiones', puntos: { 'data-science': 7, contable: 4, administracion: 6, 'finanzas-digitales': 4, 'producto-digital': 7 } },
      { texto: 'Configurar redes, servidores y la nube', puntos: { redes: 5, cloud: 2 } },
      { texto: 'Crear contenido y campañas', puntos: { 'marketing-digital': 6, 'inbound-marketing': 6 } },
      { texto: 'Atender y asesorar personas', puntos: { 'experiencia-cliente': 3, seguros: 3, hotelera: 2, 'relaciones-laborales': 3 } },
    ],
  },
  {
    eje: 'Lugar',
    pregunta: '¿Dónde te imaginás trabajando?',
    opciones: [
      { texto: 'Desde casa, frente a la compu', puntos: { programacion: 2, 'data-science': 3, 'quality-assurance': 4, cloud: 2, 'inbound-marketing': 4, 'marketing-digital': 2, 'producto-digital': 3, 'finanzas-digitales': 4 } },
      { texto: 'En una oficina, con un equipo', puntos: { contable: 4, 'relaciones-laborales': 5, seguros: 4, 'experiencia-cliente': 4, 'seguridad-informatica': 3, redes: 3, administracion: 2, 'recursos-humanos': 2, 'equipos-agiles': 3, riesgos: 5, 'comercio-exterior': 1 } },
      { texto: 'Al aire libre, en el campo', puntos: { agraria: 6, 'energias-renovables': 1, ambiental: 1, mineria: 1 } },
      { texto: 'En una planta, un depósito o una obra', puntos: { alimentos: 7, 'higiene-seguridad': 6, mineria: 2, logistica: 4 } },
      { texto: 'En hoteles, salones y eventos', puntos: { hotelera: 6, eventos: 7 } },
      { texto: 'En la calle o en un medio', puntos: { periodismo: 8, eventos: 1 } },
    ],
  },
  {
    eje: 'Logro',
    pregunta: '¿Qué te daría más orgullo lograr?',
    opciones: [
      { texto: 'Que un sistema no se caiga ni lo hackeen', puntos: { 'seguridad-informatica': 4, redes: 4, cloud: 6 } },
      { texto: 'Que una marca venda más', puntos: { 'marketing-digital': 7, 'experiencia-cliente': 4 } },
      { texto: 'Que la gente trabaje segura y cuidada', puntos: { 'higiene-seguridad': 7, seguros: 4 } },
      { texto: 'Producir más cuidando el planeta', puntos: { 'energias-renovables': 6, ambiental: 8, agraria: 6 } },
      { texto: 'Que una experiencia salga perfecta', puntos: { eventos: 6, hotelera: 1, 'experiencia-cliente': 4, 'experiencia-usuario': 6 } },
      { texto: 'Descubrir patrones en los datos', puntos: { 'data-science': 6 } },
    ],
  },
  {
    eje: 'Material',
    pregunta: '¿Con qué preferís trabajar?',
    opciones: [
      { texto: 'Código, apps y pantallas', puntos: { programacion: 6, videojuegos: 6, 'quality-assurance': 6, 'experiencia-usuario': 3, 'producto-digital': 4 } },
      { texto: 'Servidores, redes y la nube', puntos: { cloud: 6, redes: 4 } },
      { texto: 'Números y documentos', puntos: { contable: 7, 'comercio-exterior': 7, riesgos: 4, 'finanzas-digitales': 5, logistica: 5 } },
      { texto: 'Recursos naturales y alimentos', puntos: { mineria: 6, agraria: 3, alimentos: 4, 'energias-renovables': 2 } },
      { texto: 'Personas y equipos', puntos: { 'relaciones-laborales': 8, 'experiencia-cliente': 6, eventos: 2, 'recursos-humanos': 7, 'equipos-agiles': 5 } },
      { texto: 'Historias y noticias', puntos: { periodismo: 6, 'inbound-marketing': 3 } },
    ],
  },
  {
    eje: 'Tema',
    pregunta: '¿Qué tema te despierta más curiosidad?',
    opciones: [
      { texto: 'Turismo y viajes', puntos: { hotelera: 5 } },
      { texto: 'Ciberseguridad', puntos: { 'seguridad-informatica': 4, redes: 5 } },
      { texto: 'Producción de alimentos y agro', puntos: { alimentos: 4, agraria: 3 } },
      { texto: 'Minería y energía', puntos: { mineria: 8, 'energias-renovables': 7 } },
      { texto: 'Finanzas y seguros', puntos: { seguros: 7, contable: 1, 'finanzas-digitales': 5, riesgos: 4 } },
      { texto: 'Cuidado del ambiente', puntos: { ambiental: 5 } },
      { texto: 'Desarrollo de videojuegos', puntos: { videojuegos: 8 } },
    ],
  },
  {
    eje: 'Desafío',
    pregunta: '¿Qué desafío te gustaría resolver?',
    opciones: [
      { texto: 'Que un pedido llegue a tiempo', puntos: { logistica: 7, alimentos: 3 } },
      { texto: 'Llevar un negocio a otros países', puntos: { 'comercio-exterior': 8, administracion: 6 } },
      { texto: 'Que una app sea fácil de usar', puntos: { 'experiencia-usuario': 6, 'producto-digital': 4 } },
      { texto: 'Que un equipo trabaje mejor', puntos: { 'equipos-agiles': 7, administracion: 3 } },
      { texto: 'Elegir a la persona justa para un puesto', puntos: { 'recursos-humanos': 7, 'relaciones-laborales': 2 } },
      { texto: 'Prevenir fraudes y riesgos', puntos: { riesgos: 7, 'finanzas-digitales': 4, 'seguridad-informatica': 4 } },
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
