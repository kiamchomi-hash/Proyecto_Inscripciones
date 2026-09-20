'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { carreraToSlug, getAreaForCarrera, type AreaId } from '@/components/index/types';
import { mensajeWhatsAppInfo } from '@/components/carreras/career-content';

type CarreraTest = { id: number; nombre: string; nivel: string; prefix: string | null; orden: number };

type Opcion = {
  texto: string;
  areas: Partial<Record<AreaId, number>>;
  niveles?: string[];
  terminos?: string[];
};
type Pregunta = { eje: string; pregunta: string; ayuda: string; opciones: Opcion[] };

const PREGUNTAS: Pregunta[] = [
  {
    eje: 'Área principal',
    pregunta: '¿Qué área te interesa explorar primero?',
    ayuda: '',
    opciones: [
      { texto: 'Tecnología e informática', areas: { tecnologia: 5 } },
      { texto: 'Datos y ciencias exactas', areas: { exactas: 5, tecnologia: 1 } },
      { texto: 'Negocios y administración', areas: { negocios: 5 } },
      { texto: 'Finanzas y contabilidad', areas: { negocios: 4, exactas: 2 } },
      { texto: 'Derecho y escribanía', areas: { derecho: 5 } },
      { texto: 'Educación y personas', areas: { educacion: 4, rrhh: 3 } },
      { texto: 'Salud y bienestar', areas: { salud: 5 } },
      { texto: 'Comunicación, turismo y ambiente', areas: { comunicacion: 2, turismo: 2, ambiente: 2 } },
    ],
  },
  {
    eje: 'Rama concreta',
    pregunta: 'Dentro de esas opciones, ¿qué te atrae más?',
    ayuda: '',
    opciones: [
      { texto: 'Programación y sistemas', areas: { tecnologia: 4 }, terminos: ['informática', 'software', 'sistemas', 'programación', 'redes', 'cloud', 'quality assurance', 'videojuegos'] },
      { texto: 'Datos, matemática y análisis', areas: { exactas: 4, tecnologia: 1 }, terminos: ['datos', 'data science', 'matemática', 'estadística', 'actuario', 'bioinformática', 'inteligencia artificial'] },
      { texto: 'Gestión, ventas y emprendimientos', areas: { negocios: 4 }, terminos: ['administración', 'comercialización', 'marketing', 'negocios', 'empresas familiares', 'equipos de venta', 'experiencia del cliente', 'logística', 'seguros', 'inmobiliarios'] },
      { texto: 'Contabilidad y finanzas', areas: { negocios: 3, exactas: 2 }, terminos: ['contador', 'finanzas', 'contable', 'impositiva', 'tributaria'] },
      { texto: 'Leyes, contratos y justicia', areas: { derecho: 4 }, terminos: ['abogacía', 'escribanía', 'jurídica', 'procurador', 'martillero', 'criminología', 'escena del crimen'] },
      { texto: 'Educación y desarrollo de personas', areas: { educacion: 3, rrhh: 2 }, terminos: ['educación', 'profesorado', 'psicopedagogía', 'recursos humanos', 'relaciones laborales', 'clima laboral', 'niñez', 'talento'] },
      { texto: 'Salud y acompañamiento', areas: { salud: 4 }, terminos: ['terapia', 'psicología', 'salud', 'gerontología', 'nutrición'] },
      { texto: 'Comunicación, turismo o ambiente', areas: { comunicacion: 2, turismo: 2, ambiente: 2 }, terminos: ['comunicación', 'periodismo', 'publicidad', 'relaciones públicas', 'rrpp', 'diseño', 'moda', 'protocolo', 'eventos', 'turismo', 'turística', 'turísticos', 'hotelera', 'ambiente', 'ambiental', 'agraria', 'agro', 'hidrocarburos', 'deportiva'] },
    ],
  },
  {
    eje: 'Tarea cotidiana',
    pregunta: '¿Qué tipo de tarea preferís hacer todos los días?',
    ayuda: '',
    opciones: [
      { texto: 'Resolver problemas técnicos', areas: { tecnologia: 4, exactas: 1 } },
      { texto: 'Analizar números e información', areas: { exactas: 4, negocios: 1 } },
      { texto: 'Organizar proyectos y tomar decisiones', areas: { negocios: 4 } },
      { texto: 'Leer, investigar y argumentar', areas: { derecho: 3, gobierno: 2 } },
      { texto: 'Enseñar o acompañar aprendizajes', areas: { educacion: 4 } },
      { texto: 'Escuchar y ayudar a otras personas', areas: { salud: 3, rrhh: 2 } },
      { texto: 'Crear mensajes y contenidos', areas: { comunicacion: 4 } },
      { texto: 'Trabajar con territorio y recursos', areas: { ambiente: 3, turismo: 2 } },
    ],
  },
  {
    eje: 'Resultado',
    pregunta: '¿Qué resultado te daría más satisfacción?',
    ayuda: '',
    opciones: [
      { texto: 'Una solución digital funcionando', areas: { tecnologia: 4 } },
      { texto: 'Una decisión respaldada por datos', areas: { exactas: 4 } },
      { texto: 'Un negocio o proyecto que crece', areas: { negocios: 4 } },
      { texto: 'Un problema legal resuelto', areas: { derecho: 4 } },
      { texto: 'Una persona que aprende o progresa', areas: { educacion: 3, salud: 2 } },
      { texto: 'Un equipo que trabaja mejor', areas: { rrhh: 4 } },
      { texto: 'Una idea que llega a mucha gente', areas: { comunicacion: 4 } },
      { texto: 'Un impacto positivo en una comunidad', areas: { gobierno: 2, ambiente: 2, turismo: 1 } },
    ],
  },
  {
    eje: 'Duración',
    pregunta: '¿Cuánto tiempo querés dedicarle a tu formación?',
    ayuda: '',
    opciones: [
      { texto: 'Menos de un año', areas: {}, niveles: ['Curso', 'Diplomatura'] },
      { texto: 'Entre dos y tres años', areas: {}, niveles: ['Pregrado', 'Tecnicatura'] },
      { texto: 'Cuatro años o más', areas: {}, niveles: ['Grado', 'Licenciatura'] },
      { texto: 'La duración no define mi elección', areas: {} },
    ],
  },
  {
    eje: 'Especialidad',
    pregunta: '¿Qué tema concreto te gustaría estudiar?',
    ayuda: '',
    opciones: [
      { texto: 'Software, redes o ciberseguridad', areas: { tecnologia: 3 }, terminos: ['software', 'informática', 'ciberseguridad', 'redes'] },
      { texto: 'Datos, inteligencia artificial o matemática', areas: { exactas: 3, tecnologia: 1 }, terminos: ['datos', 'inteligencia artificial', 'matemática'] },
      { texto: 'Administración, marketing o comercio', areas: { negocios: 3 }, terminos: ['administración', 'marketing', 'comercialización', 'comercio'] },
      { texto: 'Finanzas, impuestos o contabilidad', areas: { negocios: 2, exactas: 1 }, terminos: ['finanzas', 'contador', 'tributaria'] },
      { texto: 'Derecho, seguridad o investigación', areas: { derecho: 3 }, terminos: ['abogacía', 'seguridad', 'investigación'] },
      { texto: 'Educación, talento o relaciones laborales', areas: { educacion: 2, rrhh: 2 }, terminos: ['educación', 'recursos humanos', 'relaciones laborales'] },
      { texto: 'Salud, nutrición o terapia', areas: { salud: 3 }, terminos: ['salud', 'nutrición', 'terapia'] },
      { texto: 'Diseño, comunicación, turismo o ambiente', areas: { comunicacion: 2, turismo: 1, ambiente: 1 }, terminos: ['diseño', 'comunicación', 'turismo', 'ambiente'] },
    ],
  },
  {
    eje: 'Sector',
    pregunta: '¿En qué sector te gustaría aplicar lo que aprendés?',
    ayuda: '',
    opciones: [
      { texto: 'Empresas y emprendimientos', areas: { negocios: 3 }, terminos: ['administración', 'comercialización', 'emprendimiento'] },
      { texto: 'Tecnología y servicios digitales', areas: { tecnologia: 3 }, terminos: ['informática', 'software', 'digital'] },
      { texto: 'Justicia y seguridad', areas: { derecho: 3, gobierno: 1 }, terminos: ['abogacía', 'seguridad', 'criminología'] },
      { texto: 'Estado y políticas públicas', areas: { gobierno: 3 }, terminos: ['administración pública', 'ciencia política', 'relaciones internacionales'] },
      { texto: 'Escuelas y espacios educativos', areas: { educacion: 3 }, terminos: ['educación', 'enseñanza', 'pedagogía'] },
      { texto: 'Salud y cuidado de personas', areas: { salud: 3 }, terminos: ['salud', 'terapia', 'nutrición'] },
      { texto: 'Medios, marcas y contenidos', areas: { comunicacion: 3 }, terminos: ['comunicación', 'publicidad', 'diseño'] },
      { texto: 'Turismo, ambiente y territorio', areas: { turismo: 2, ambiente: 2 }, terminos: ['turismo', 'hotelería', 'ambiente', 'agro'] },
    ],
  },
  {
    eje: 'Enfoque',
    pregunta: '¿Con qué preferís trabajar principalmente?',
    ayuda: '',
    opciones: [
      { texto: 'Código y herramientas digitales', areas: { tecnologia: 3 }, terminos: ['informática', 'software', 'programación'] },
      { texto: 'Números y modelos', areas: { exactas: 3 }, terminos: ['datos', 'matemática', 'finanzas'] },
      { texto: 'Estrategias y recursos', areas: { negocios: 3 }, terminos: ['administración', 'marketing', 'finanzas'] },
      { texto: 'Normas y casos', areas: { derecho: 3 }, terminos: ['abogacía', 'escribanía', 'jurídica'] },
      { texto: 'Personas de manera individual', areas: { salud: 2, educacion: 1 }, terminos: ['terapia', 'psicología', 'nutrición'] },
      { texto: 'Equipos y organizaciones', areas: { rrhh: 3 }, terminos: ['recursos humanos', 'relaciones laborales', 'talento'] },
      { texto: 'Ideas, imágenes y mensajes', areas: { comunicacion: 3 }, terminos: ['comunicación', 'diseño', 'publicidad'] },
      { texto: 'Comunidades y territorio', areas: { gobierno: 1, ambiente: 2, turismo: 1 }, terminos: ['ambiente', 'turismo', 'administración pública'] },
    ],
  },
  {
    eje: 'Decisión final',
    pregunta: '¿Qué querés que pese más en la recomendación?',
    ayuda: '',
    opciones: [
      { texto: 'Salida tecnológica', areas: { tecnologia: 3 }, terminos: ['informática', 'software', 'datos'] },
      { texto: 'Análisis y precisión', areas: { exactas: 3 }, terminos: ['datos', 'matemática', 'contador'] },
      { texto: 'Gestión y crecimiento', areas: { negocios: 3 }, terminos: ['administración', 'finanzas', 'marketing'] },
      { texto: 'Justicia e instituciones', areas: { derecho: 2, gobierno: 2 }, terminos: ['abogacía', 'escribanía', 'ciencia política'] },
      { texto: 'Educación y desarrollo', areas: { educacion: 2, rrhh: 2 }, terminos: ['educación', 'recursos humanos'] },
      { texto: 'Salud y bienestar', areas: { salud: 3 }, terminos: ['salud', 'terapia', 'nutrición'] },
      { texto: 'Creatividad y comunicación', areas: { comunicacion: 3 }, terminos: ['comunicación', 'diseño', 'publicidad'] },
      { texto: 'Ambiente, turismo y territorio', areas: { ambiente: 2, turismo: 2 }, terminos: ['ambiente', 'turismo', 'hotelería', 'agro'] },
    ],
  },
  {
    eje: 'Rol',
    pregunta: '¿Qué lugar preferís ocupar en un proyecto?',
    ayuda: '',
    opciones: [
      { texto: 'Especialista técnico', areas: { tecnologia: 2, exactas: 2 } },
      { texto: 'Organización y liderazgo', areas: { negocios: 2, rrhh: 2 } },
      { texto: 'Asesoramiento y análisis', areas: { derecho: 2, gobierno: 2 } },
      { texto: 'Atención y acompañamiento', areas: { salud: 2, educacion: 2 } },
      { texto: 'Creación y comunicación', areas: { comunicacion: 3 } },
      { texto: 'Trabajo de campo', areas: { ambiente: 2, turismo: 2 } },
    ],
  },
];

const AREA_LABELS: Record<AreaId, string> = {
  derecho: 'Derecho y sociedad', tecnologia: 'Tecnología', exactas: 'Ciencias exactas',
  negocios: 'Negocios', salud: 'Salud y bienestar', educacion: 'Educación',
  comunicacion: 'Comunicación y diseño', ambiente: 'Ambiente y agro', turismo: 'Turismo y hotelería',
  gobierno: 'Ciencias políticas', rrhh: 'Personas y equipos', deporte: 'Deporte',
};

const TERMINOS_TEST = [...new Set(PREGUNTAS.flatMap(pregunta =>
  pregunta.opciones.flatMap(opcion => opcion.terminos ?? [])
))];

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
}

function carreraTieneRuta(carrera: CarreraTest) {
  const descripcion = normalizar(`${carrera.nivel} ${carrera.prefix ?? ''} ${carrera.nombre}`);
  return TERMINOS_TEST.some(termino => descripcion.includes(normalizar(termino)));
}

function nombreVisible(carrera: CarreraTest) {
  const nombre = carrera.nombre.replace(/^(?:Grado|Pregrado)\s*\/?\s*/i, '');
  const prefix = carrera.prefix?.replace(/^(?:Grado|Pregrado)\s*\/?\s*/i, '').trim();
  return prefix ? `${prefix} ${nombre}` : nombre;
}

const DESCRIPCIONES_DESEMPATE: Array<[RegExp, string]> = [
  [/abogac|procurador/, 'Analizar casos, interpretar normas y defender derechos'],
  [/escriban/, 'Dar validez legal a contratos, actos y documentos'],
  [/martillero|inmobiliari/, 'Intermediar, tasar y gestionar operaciones inmobiliarias'],
  [/criminolog|escena del crimen|investigaci[oó]n/, 'Investigar hechos, evidencias y conductas vinculadas al delito'],
  [/contador|contable|impositiva|tributaria/, 'Ordenar cuentas, impuestos y decisiones económicas'],
  [/finanzas|actuario|seguros/, 'Evaluar riesgos y proyectar decisiones financieras'],
  [/comercio internacional|log[ií]stica/, 'Coordinar operaciones, mercados y movimientos entre países'],
  [/marketing|comercializaci[oó]n|equipos de venta|inbound/, 'Diseñar estrategias para atraer clientes y aumentar ventas'],
  [/negocios digitales|experiencia del cliente/, 'Mejorar productos, servicios y experiencias en canales digitales'],
  [/administraci[oó]n p[uú]blica|pol[ií]ticas p[uú]blicas/, 'Gestionar programas, recursos y servicios del Estado'],
  [/ciencia pol[ií]tica/, 'Analizar instituciones, poder y decisiones públicas'],
  [/relaciones internacionales/, 'Comprender vínculos políticos y económicos entre países'],
  [/administraci[oó]n agraria|gesti[oó]n agraria|agroecol[oó]gicos/, 'Gestionar producción, recursos y negocios del sector agropecuario'],
  [/administraci[oó]n|empresas familiares|emprendimiento/, 'Organizar recursos, equipos y proyectos para hacerlos crecer'],
  [/inteligencia artificial|rob[oó]tica/, 'Crear soluciones capaces de aprender, automatizar y tomar decisiones'],
  [/ciencias de datos|data science|estad[ií]stica/, 'Encontrar patrones y convertir datos en decisiones'],
  [/seguridad inform[aá]tica/, 'Proteger sistemas, redes e información frente a amenazas'],
  [/redes inform[aá]ticas|telecomunicaciones|cloud/, 'Diseñar y mantener la infraestructura que conecta servicios digitales'],
  [/quality assurance/, 'Detectar fallas y asegurar la calidad de productos digitales'],
  [/videojuegos/, 'Diseñar experiencias interactivas combinando creatividad y programación'],
  [/bioinform[aá]tica/, 'Aplicar tecnología y datos al estudio de sistemas biológicos'],
  [/inform[aá]tica|programaci[oó]n/, 'Desarrollar software y resolver problemas mediante código'],
  [/matem[aá]tica/, 'Construir modelos y resolver problemas mediante razonamiento abstracto'],
  [/gesti[oó]n ambiental|auditor[ií]as ambientales/, 'Evaluar impactos y mejorar el uso responsable de los recursos'],
  [/higiene.*seguridad|seguridad laboral/, 'Prevenir riesgos y cuidar condiciones seguras de trabajo'],
  [/hidrocarburos|geociencias/, 'Explorar recursos naturales y procesos del subsuelo'],
  [/tur[ií]stica|tur[ií]sticos|hotelera/, 'Diseñar y gestionar experiencias de viaje y hospitalidad'],
  [/gesti[oó]n deportiva/, 'Administrar organizaciones, eventos y proyectos deportivos'],
  [/recursos humanos|relaciones laborales|clima laboral|talento/, 'Acompañar equipos y mejorar la vida dentro de las organizaciones'],
  [/periodismo/, 'Investigar hechos y convertirlos en información clara y relevante'],
  [/publicidad/, 'Crear campañas que conecten marcas, ideas y públicos'],
  [/relaciones p[uú]blicas|rrpp|protocolo|eventos/, 'Construir vínculos institucionales y organizar experiencias públicas'],
  [/diseño.*animaci[oó]n|moda/, 'Crear identidades y experiencias visuales con herramientas digitales'],
  [/terapia ocupacional/, 'Acompañar a personas para ganar autonomía en su vida cotidiana'],
  [/gerontolog/, 'Mejorar el bienestar y la autonomía durante el envejecimiento'],
  [/servicios de salud/, 'Organizar equipos y recursos para mejorar servicios de salud'],
  [/psicopedagog/, 'Comprender y acompañar dificultades en los procesos de aprendizaje'],
  [/profesorado|educaci[oó]n/, 'Diseñar experiencias de enseñanza y acompañar aprendizajes'],
  [/niñez|adolescencia|promoci[oó]n comunitaria/, 'Trabajar con comunidades para acompañar infancias y juventudes'],
];

function descripcionParaDesempate(carrera: CarreraTest) {
  const nombre = normalizar(`${carrera.prefix ?? ''} ${carrera.nombre}`);
  return DESCRIPCIONES_DESEMPATE.find(([patron]) => patron.test(nombre))?.[1]
    ?? 'Aplicar conocimientos específicos para resolver problemas de un sector profesional';
}

function afinidadDeNivel(carrera: CarreraTest, nivelesPreferidos: string[]) {
  if (nivelesPreferidos.length === 0) return 0;
  const descripcion = `${carrera.nivel} ${carrera.prefix ?? ''} ${carrera.nombre}`.toLocaleLowerCase('es');
  return nivelesPreferidos.some(nivel => descripcion.includes(nivel.toLocaleLowerCase('es'))) ? 1 : 0;
}

function afinidadDeCarrera(carrera: CarreraTest, terminosPreferidos: string[]) {
  const descripcion = normalizar(`${carrera.nivel} ${carrera.prefix ?? ''} ${carrera.nombre}`);
  return terminosPreferidos.reduce((puntaje, termino) => {
    const terminoNormalizado = normalizar(termino);
    return puntaje + (descripcion.includes(terminoNormalizado) ? 1 : 0);
  }, 0);
}

export default function TestVocacional({ carreras }: { carreras: CarreraTest[] }) {
  const [paso, setPaso] = useState(-1);
  const [respuestas, setRespuestas] = useState<number[]>([]);
  const [areas, setAreas] = useState<Partial<Record<AreaId, number>>>({});
  const [areaSeleccionada, setAreaSeleccionada] = useState<AreaId | null>(null);
  const [carreraPrincipalId, setCarreraPrincipalId] = useState<number | null>(null);
  const [resultadoIntervenido, setResultadoIntervenido] = useState(false);
  const [marca, setMarca] = useState<'siglo21' | 'teclab'>('siglo21');

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const sinRuta = carreras.filter(carrera => !carreraTieneRuta(carrera));
    if (sinRuta.length > 0) console.warn('Carreras sin una ruta específica en el test vocacional:', sinRuta.map(carrera => carrera.nombre));
  }, [carreras]);

  useEffect(() => {
    const intervalo = window.setInterval(() => setMarca(actual => actual === 'siglo21' ? 'teclab' : 'siglo21'), 5000);
    return () => window.clearInterval(intervalo);
  }, []);

  const rankingAreas = useMemo(() => Object.entries(areas)
    .filter(([area, puntos]) => (puntos ?? 0) > 0 && carreras.some(carrera => getAreaForCarrera(carrera) === area))
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
    .slice(0, 3) as [AreaId, number][], [areas, carreras]);

  const areaActiva = areaSeleccionada ?? rankingAreas[0]?.[0] ?? null;
  const nivelesPreferidos = useMemo(() => respuestas.flatMap((respuesta, indice) =>
    PREGUNTAS[indice]?.opciones[respuesta]?.niveles ?? []
  ), [respuestas]);
  const terminosPreferidos = useMemo(() => respuestas.flatMap((respuesta, indice) =>
    PREGUNTAS[indice]?.opciones[respuesta]?.terminos ?? []
  ), [respuestas]);

  const candidatasFinales = useMemo(() => {
    const areaPrincipal = rankingAreas[0]?.[0];
    if (!areaPrincipal) return [];
    return carreras
      .filter(carrera => getAreaForCarrera(carrera) === areaPrincipal)
      .sort((a, b) => afinidadDeCarrera(b, terminosPreferidos) - afinidadDeCarrera(a, terminosPreferidos)
        || afinidadDeNivel(b, nivelesPreferidos) - afinidadDeNivel(a, nivelesPreferidos)
        || a.orden - b.orden)
      .slice(0, 8);
  }, [carreras, nivelesPreferidos, rankingAreas, terminosPreferidos]);

  useEffect(() => {
    if (paso < PREGUNTAS.length || resultadoIntervenido || rankingAreas.length < 2) return;
    const intervalo = window.setInterval(() => {
      setAreaSeleccionada(actual => {
        const indiceActual = rankingAreas.findIndex(([area]) => area === (actual ?? rankingAreas[0][0]));
        return rankingAreas[(indiceActual + 1) % rankingAreas.length][0];
      });
    }, 3200);
    return () => window.clearInterval(intervalo);
  }, [paso, rankingAreas, resultadoIntervenido]);

  const resultados = useMemo(() => areaActiva ? carreras
    .filter(carrera => getAreaForCarrera(carrera) === areaActiva)
    .sort((a, b) => Number(b.id === carreraPrincipalId) - Number(a.id === carreraPrincipalId)
      || afinidadDeCarrera(b, terminosPreferidos) - afinidadDeCarrera(a, terminosPreferidos)
      || afinidadDeNivel(b, nivelesPreferidos) - afinidadDeNivel(a, nivelesPreferidos)
      || a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'))
    .slice(0, 3)
    .map(carrera => ({ carrera, area: areaActiva, puntos: areas[areaActiva] ?? 0 })) : [], [areaActiva, areas, carreraPrincipalId, carreras, nivelesPreferidos, terminosPreferidos]);
  const carreraParaAccion = resultados.find(({ carrera }) => carrera.id === carreraPrincipalId)?.carrera ?? resultados[0]?.carrera ?? null;

  const recomendaciones = useMemo(() => {
    const ordenadas = carreras
      .map(carrera => ({ carrera, area: getAreaForCarrera(carrera), puntos: (getAreaForCarrera(carrera) ? areas[getAreaForCarrera(carrera)!] ?? 0 : 0) }))
      .sort((a, b) => b.puntos - a.puntos
        || afinidadDeCarrera(b.carrera, terminosPreferidos) - afinidadDeCarrera(a.carrera, terminosPreferidos)
        || afinidadDeNivel(b.carrera, nivelesPreferidos) - afinidadDeNivel(a.carrera, nivelesPreferidos)
        || a.carrera.orden - b.carrera.orden);
    return ordenadas.slice(0, 5);
  }, [areas, carreras, nivelesPreferidos, terminosPreferidos]);

  function elegir(indice: number) {
    const nuevos = { ...areas };
    Object.entries(PREGUNTAS[paso].opciones[indice].areas).forEach(([area, valor]) => {
      nuevos[area as AreaId] = (nuevos[area as AreaId] ?? 0) + (valor ?? 0);
    });
    setAreas(nuevos);
    setRespuestas([...respuestas, indice]);
    setPaso(paso + 1);
  }

  function volver() {
    if (paso <= 0) { setPaso(-1); return; }
    const anterior = respuestas[respuestas.length - 1];
    const nuevos = { ...areas };
    Object.entries(PREGUNTAS[paso - 1].opciones[anterior].areas).forEach(([area, valor]) => {
      nuevos[area as AreaId] = (nuevos[area as AreaId] ?? 0) - (valor ?? 0);
    });
    setAreas(nuevos); setRespuestas(respuestas.slice(0, -1)); setPaso(paso - 1);
  }

  if (paso === -1) return (
    <section className="vocacional-intro">
      <div className="vocacional-intro-layout">
        <div className="vocacional-intro-copy">
          <h1>¿Qué <span className="vocacional-title-highlight">carrera</span> va con vos?</h1>
          <p className="vocacional-lead">Descubrí las <span className="vocacional-lead-underline">áreas</span> que mejor combinan con tus intereses y conocé <span className="vocacional-lead-underline">carreras</span> para empezar a explorarlas.</p>
          <div className="vocacional-meta"><span>3 minutos</span><span>Sin registrarte</span></div>
          <button className="vocacional-button" onClick={() => setPaso(0)}>Empezar el test <span aria-hidden="true">→</span></button>
        </div>
        <div className={`vocacional-intro-signal vocacional-intro-signal--${marca}`} aria-hidden="true">
          <div className="vocacional-signal-top"><span>CARRERAS</span><span>ONLINE</span></div>
          <div className="vocacional-signal-brand"><span className={`vocacional-signal-logo vocacional-signal-logo--siglo${marca === 'siglo21' ? ' is-visible' : ''}`} /><span className={`vocacional-signal-logo vocacional-signal-logo--teclab${marca === 'teclab' ? ' is-visible' : ''}`} /></div>
        </div>
      </div>
    </section>
  );

  if (paso < PREGUNTAS.length) {
    const pregunta = PREGUNTAS[paso];
    return (
      <section className="vocacional-workspace" aria-labelledby="pregunta-titulo">
        <div className="vocacional-test">
          <div className="vocacional-progress-panel">
            <div className="vocacional-progress-row"><span>Pregunta {paso + 1} de {PREGUNTAS.length + 1}</span><span>{Math.round((paso / (PREGUNTAS.length + 1)) * 100)}%</span></div>
            <div className="vocacional-progress"><span style={{ width: `${(paso / (PREGUNTAS.length + 1)) * 100}%` }} /></div>
          </div>
          <h2 id="pregunta-titulo">{pregunta.pregunta}</h2>
          <div className="vocacional-options">{pregunta.opciones.map((opcion, indice) => <button key={opcion.texto} onClick={() => elegir(indice)} className="vocacional-option"><span className="vocacional-option-number">{String.fromCharCode(65 + indice)}</span><span>{opcion.texto}</span><span aria-hidden="true">↗</span></button>)}</div>
          <button className="vocacional-back" onClick={volver} disabled={paso === 0}>← Volver</button>
        </div>
        <aside className="vocacional-live" aria-live="polite">
          <div className="vocacional-live-heading"><span>CARRERAS</span><span className="vocacional-live-dot" aria-label="Actualizado" /></div>
          {respuestas.length > 0 && <div className="vocacional-live-list">{recomendaciones.map(({ carrera, area }, indice) => <Link className="vocacional-live-career" href={`/carreras/${carreraToSlug(carrera)}`} key={carrera.id}><span className="vocacional-live-index">0{indice + 1}</span><span className="vocacional-live-name"><strong>{nombreVisible(carrera)}</strong><small>{area ? AREA_LABELS[area] : 'Para descubrir'}</small></span><span className="vocacional-live-arrow" aria-hidden="true">↗</span></Link>)}</div>}
        </aside>
      </section>
    );
  }

  if (paso === PREGUNTAS.length && candidatasFinales.length > 0) {
    return (
      <section className="vocacional-workspace" aria-labelledby="pregunta-titulo">
        <div className="vocacional-test">
          <div className="vocacional-progress-panel">
            <div className="vocacional-progress-row"><span>Pregunta {PREGUNTAS.length + 1} de {PREGUNTAS.length + 1}</span><span>91%</span></div>
            <div className="vocacional-progress"><span style={{ width: '91%' }} /></div>
          </div>
          <h2 id="pregunta-titulo">¿Cuál de estas opciones te gustaría explorar primero?</h2>
          <div className="vocacional-options">{candidatasFinales.map((carrera, indice) => <button key={carrera.id} onClick={() => { setCarreraPrincipalId(carrera.id); setResultadoIntervenido(true); setPaso(PREGUNTAS.length + 1); }} className="vocacional-option"><span className="vocacional-option-number">{String.fromCharCode(65 + indice)}</span><span>{descripcionParaDesempate(carrera)}</span><span aria-hidden="true">↗</span></button>)}</div>
          <button className="vocacional-back" onClick={volver}>← Volver</button>
        </div>
        <aside className="vocacional-live" aria-live="polite">
          <div className="vocacional-live-heading"><span>MEJOR AFINIDAD</span><span className="vocacional-live-dot" aria-label="Actualizado" /></div>
          <div className="vocacional-live-list">{candidatasFinales.slice(0, 5).map((carrera, indice) => <div className="vocacional-live-career" key={carrera.id}><span className="vocacional-live-index">0{indice + 1}</span><span className="vocacional-live-name"><strong>{nombreVisible(carrera)}</strong><small>{AREA_LABELS[getAreaForCarrera(carrera)!]}</small></span></div>)}</div>
        </aside>
      </section>
    );
  }

  return (
    <section className="vocacional-result">
      <h2>Áreas y carreras para vos</h2>
      <div className="vocacional-areas">{rankingAreas.map(([area, puntos], indice) => <button type="button" aria-pressed={areaActiva === area} onClick={() => { setAreaSeleccionada(area); setResultadoIntervenido(true); }} className={`vocacional-area area-${indice + 1} afinidad-${Math.min(100, puntos * 4) >= 70 ? 'alta' : Math.min(100, puntos * 4) >= 40 ? 'media' : 'baja'}${areaActiva === area ? ' is-active' : ''}`} key={area}><div className="vocacional-area-head"><strong>{AREA_LABELS[area]}</strong><b>{Math.min(100, puntos * 4)}%</b></div><span className="vocacional-area-meter"><i style={{ width: `${Math.min(100, puntos * 4)}%`, background: 'linear-gradient(90deg, #d0fe70 0%, #00c7b1 100%)' }} /></span></button>)}</div>
      <div className="vocacional-area-nav" aria-label="Elegir área">{rankingAreas.map(([area]) => <button type="button" aria-current={areaActiva === area ? 'true' : undefined} className={areaActiva === area ? 'is-active' : ''} onClick={() => { setAreaSeleccionada(area); setResultadoIntervenido(true); }} key={area}>{AREA_LABELS[area]}</button>)}</div>
      <div className="vocacional-careers-heading"><span>Carreras</span></div>
      <div className="vocacional-careers" key={areaActiva}>{resultados.map(({ carrera }) => <button type="button" aria-pressed={carrera.id === carreraParaAccion?.id} className={`vocacional-career${carrera.id === carreraParaAccion?.id ? ' is-primary' : ''}`} onClick={() => { setCarreraPrincipalId(carrera.id); setResultadoIntervenido(true); }} key={carrera.id}><span>{nombreVisible(carrera)}</span><span aria-hidden="true">→</span></button>)}</div>
      {carreraParaAccion && <div className="vocacional-career-actions" key={carreraParaAccion.id}><strong>{nombreVisible(carreraParaAccion)}</strong><div><a href={`https://wa.me/5491132973801?text=${encodeURIComponent(mensajeWhatsAppInfo(carreraParaAccion))}`} target="_blank" rel="noopener nofollow">Consultar por WhatsApp</a><Link href={`/carreras/${carreraToSlug(carreraParaAccion)}#preinscripcion`}>Quiero inscribirme</Link></div></div>}
      <div className="vocacional-actions"><Link className="vocacional-button" href="/"><span aria-hidden="true">←</span> Volver</Link><button className="vocacional-restart" onClick={() => { setPaso(-1); setAreas({}); setRespuestas([]); setAreaSeleccionada(null); setCarreraPrincipalId(null); setResultadoIntervenido(false); }}>Hacerlo de nuevo</button></div>
    </section>
  );
}
