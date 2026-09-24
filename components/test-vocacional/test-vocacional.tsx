'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { carreraToSlug, getAreaForCarrera, type AreaId } from '@/components/index/types';
import { mensajeWhatsAppInfo } from '@/components/carreras/career-content';
import { alternarSeleccion, ordenarAreas, puntuarRespuestas, recomendarPorArea } from './resultado';

type CarreraTest = { id: number; nombre: string; nivel: string; prefix: string | null; orden: number };

type Opcion = {
  texto: string;
  areas: Partial<Record<AreaId, number>>;
  niveles?: string[];
  terminos?: string[];
};
type Pregunta = { eje: string; pregunta: string; ayuda: string; opciones: Opcion[]; maximo?: number };

const PREGUNTAS: Pregunta[] = [
  {
    eje: 'Área principal',
    maximo: 3,
    pregunta: '¿Qué áreas te interesan explorar?',
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
    maximo: 3,
    pregunta: '¿Qué temas te gustaría conocer mejor?',
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
    pregunta: '¿Qué intereses querés destacar en la recomendación?',
    maximo: 3,
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

export default function TestVocacional({ carreras }: { carreras: CarreraTest[] }) {
  const [paso, setPaso] = useState(-1);
  const [respuestas, setRespuestas] = useState<number[][]>([]);
  const [seleccion, setSeleccion] = useState<number[]>([]);
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

  const { areas, niveles: nivelesPreferidos, terminos: terminosPreferidos } = useMemo(
    () => puntuarRespuestas(PREGUNTAS, respuestas), [respuestas],
  );
  const rankingAreas = useMemo(() => ordenarAreas(areas, carreras, getAreaForCarrera), [areas, carreras]);
  const grupos = useMemo(() => recomendarPorArea(
    rankingAreas, carreras, getAreaForCarrera, terminosPreferidos, nivelesPreferidos, 3,
  ), [rankingAreas, carreras, terminosPreferidos, nivelesPreferidos]);
  const recomendaciones = grupos.flatMap(grupo => grupo.carreras.map(carrera => ({ carrera, area: grupo.area }))).slice(0, 5);

  function avanzar(indices: number[]) {
    setRespuestas(actual => [...actual, indices]);
    setSeleccion([]);
    setPaso(actual => actual + 1);
  }

  function volver() {
    if (paso <= 0) return;
    const anterior = respuestas[paso - 1] ?? [];
    setRespuestas(actual => actual.slice(0, -1));
    setSeleccion(anterior);
    setPaso(actual => actual - 1);
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
            <div className="vocacional-progress-row"><span>Pregunta {paso + 1} de {PREGUNTAS.length}</span><span>{Math.round((paso / PREGUNTAS.length) * 100)}%</span></div>
            <div className="vocacional-progress"><span style={{ width: `${(paso / PREGUNTAS.length) * 100}%` }} /></div>
          </div>
          <h2 id="pregunta-titulo">{pregunta.pregunta}</h2>
          {pregunta.maximo && <p className="vocacional-help" id="vocacional-ayuda">Elegí hasta {pregunta.maximo} opciones y después continuá.</p>}
          <div className="vocacional-options" aria-describedby={pregunta.maximo ? 'vocacional-ayuda' : undefined}>{pregunta.opciones.map((opcion, indice) => <button type="button" key={opcion.texto} aria-pressed={pregunta.maximo ? seleccion.includes(indice) : undefined} onClick={() => pregunta.maximo ? setSeleccion(actual => alternarSeleccion(actual, indice, pregunta.maximo!)) : avanzar([indice])} className={`vocacional-option${seleccion.includes(indice) ? ' is-selected' : ''}`}><span className="vocacional-option-number">{String.fromCharCode(65 + indice)}</span><span>{opcion.texto}</span><span aria-hidden="true">{pregunta.maximo ? seleccion.includes(indice) ? '✓' : '+' : '↗'}</span></button>)}</div>
          {pregunta.maximo && <button className="vocacional-button vocacional-continue" onClick={() => avanzar(seleccion)} disabled={seleccion.length === 0}>Continuar</button>}
          <button className="vocacional-back" onClick={volver} disabled={paso === 0}>← Volver</button>
        </div>
        <aside className="vocacional-live" aria-live="polite">
          <div className="vocacional-live-heading"><span>CARRERAS</span><span className="vocacional-live-dot" aria-label="Actualizado" /></div>
          {respuestas.length > 0 && <div className="vocacional-live-list">{recomendaciones.map(({ carrera, area }, indice) => <Link className="vocacional-live-career" href={`/carreras/${carreraToSlug(carrera)}`} key={carrera.id}><span className="vocacional-live-index">0{indice + 1}</span><span className="vocacional-live-name"><strong>{nombreVisible(carrera)}</strong><small>{area ? AREA_LABELS[area] : 'Para descubrir'}</small></span><span className="vocacional-live-arrow" aria-hidden="true">↗</span></Link>)}</div>}
        </aside>
      </section>
    );
  }

  return (
    <section className="vocacional-result">
      <h2>Áreas y carreras para vos</h2>
      <p className="vocacional-result-intro">Estas opciones combinan con tus intereses. Explorá las que más te llamen la atención.</p>
      <div className="vocacional-result-groups">
        {grupos.map(({ area, carreras: sugeridas }, indice) => (
          <section className="vocacional-result-group" key={area} aria-labelledby={`area-${area}`}>
            <div className="vocacional-result-area"><span>Área {indice + 1}</span><h3 id={`area-${area}`}>{AREA_LABELS[area]}</h3></div>
            <ul className="vocacional-result-careers">{sugeridas.map(carrera => (
              <li key={carrera.id}>
                <strong>{nombreVisible(carrera)}</strong>
                <div><Link href={`/carreras/${carreraToSlug(carrera)}`}>Conocer la carrera</Link><a href={`https://wa.me/5491132973801?text=${encodeURIComponent(mensajeWhatsAppInfo(carrera))}`} target="_blank" rel="noopener nofollow">Consultar</a></div>
              </li>
            ))}</ul>
          </section>
        ))}
      </div>
      <div className="vocacional-result-footer"><button className="vocacional-restart" onClick={() => { setPaso(-1); setRespuestas([]); setSeleccion([]); }}>Hacerlo de nuevo</button><Link href="/">Volver al inicio</Link></div>
    </section>
  );
}
