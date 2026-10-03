// Pagina de inscripcion de las carreras de Teclab: /carreras/<slug>/inscripcion.
//
// La ficha contesta "que es la carrera"; esta pagina contesta "como me
// inscribo". Para no ser una copia flaca de la ficha -ni competir con ella en
// Google- trae contenido propio: los pasos reales del tramite, que tener a mano
// y dos preguntas de inscripcion, todo armado con datos que el sitio ya tiene.
//
// Sin 'use client' y sin imports de cliente: lo usan la pagina, la ficha y el
// sitemap, que es un Route Handler.

import type { Carrera } from '@/components/index/types';
import { carreraFullName, carreraToSlug, esCarreraVisible } from '@/components/index/types';
import { esCursoTeclab, esTeclab, getFamiliaTeclab, parseEnfoqueTeclab } from '@/components/index/teclab';

export const SITIO = 'https://www.siglo21sur.com';

/**
 * Las carreras de Teclab con inscripcion abierta. Una `proximamente` no tiene
 * tramite que explicar: su ficha ya pide un aviso y nada mas.
 */
export function tieneInscripcionPropia(c: Pick<Carrera, 'nivel'> & Partial<Pick<Carrera, 'proximamente'>>): boolean {
  return esCarreraVisible(c) && (esTeclab(c) || esCursoTeclab(c)) && !c.proximamente;
}

/** Sale del slug canonico de la ficha, asi las dos URLs no se separan nunca. */
export function rutaInscripcion(c: Pick<Carrera, 'nombre' | 'prefix'>): string {
  return `/carreras/${carreraToSlug(c)}/inscripcion`;
}

/** "a la Tecnicatura..." o "al Curso de...": las dos formas de nombrarla en una frase. */
export function conArticulo(c: Pick<Carrera, 'nombre' | 'prefix' | 'nivel'>, nombre = carreraFullName(c)): string {
  return esCursoTeclab(c) && /^curso/i.test(nombre) ? `al ${nombre}` : `a la ${nombre}`;
}

// Mismo presupuesto que el <title> y la description de la ficha
// (app/carreras/[slug]/page.tsx explica de donde salen los numeros).
const MAX_TITULO = 61;
const TOLERANCIA_TITULO = 66;
const MAX_DESCRIPCION = 165;

// El curso tiene el nombre mas largo de la oferta: ni con el nombre corto entra
// con la marca. Se lo nombra por el tema, que es lo que se busca.
const TITULO_ESPECIFICO: Record<string, string> = {
  'Curso de Actualización Profesional en Inteligencia Artificial': 'Inscripción al Curso de Inteligencia Artificial | Teclab',
};

/**
 * "Inscripción a la Tecnicatura en Programación | Teclab". Del nombre mas
 * informativo al mas corto: el completo casi nunca entra, y "Tecnicatura en"
 * (sin "Superior") conserva el prefijo academico, que es lo que la gente
 * escribe en el buscador.
 */
export function tituloInscripcion(c: Pick<Carrera, 'nombre' | 'prefix' | 'nivel' | 'nombre_corto'>): string {
  const completo = carreraFullName(c);
  const especifico = TITULO_ESPECIFICO[completo];
  if (especifico) return especifico;

  const sufijo = ' | Teclab';
  const candidatos = [
    `Inscripción ${conArticulo(c, completo)}`,
    `Inscripción ${conArticulo(c, completo.replace(/^Tecnicatura Superior en /, 'Tecnicatura en '))}`,
    c.nombre_corto ? `Inscripción a ${c.nombre_corto}` : null,
  ].filter((t, i, arr): t is string => Boolean(t) && arr.indexOf(t) === i);

  for (const t of candidatos) if (t.length + sufijo.length <= MAX_TITULO) return `${t}${sufijo}`;
  const corto = candidatos[candidatos.length - 1];
  if (corto.length + sufijo.length <= TOLERANCIA_TITULO) return `${corto}${sufijo}`;
  return corto;
}

/**
 * Description propia: arranca por la accion ("Cómo inscribirte...") y no por
 * la carrera, que es lo que hace la ficha. Si el nombre completo no deja lugar
 * para el tramite, se prueba con el nombre sin "Superior".
 */
export function descripcionInscripcion(c: Pick<Carrera, 'nombre' | 'prefix' | 'nivel' | 'duracion' | 'enfoque'>): string {
  const completo = carreraFullName(c);
  const tramites = [
    'Completás la preinscripción online y te llega por mail el acceso al portal del alumno.',
    'Preinscripción online y acceso al portal del alumno por mail.',
  ];
  const { modalidad } = parseEnfoqueTeclab(c.enfoque);
  const datos = c.duracion ? `${c.duracion}, ${modalidad.toLowerCase()}.` : null;

  const nombres = [completo, completo.replace(/^Tecnicatura Superior en /, 'Tecnicatura en ')];
  for (const tramite of tramites) {
    for (const nombre of nombres) {
      const partes = [`Cómo inscribirte ${conArticulo(c, nombre)} de Teclab.`, tramite, datos]
        .filter((p): p is string => Boolean(p));
      while (partes.length > 2 && partes.join(' ').length > MAX_DESCRIPCION) partes.pop();
      if (partes.join(' ').length <= MAX_DESCRIPCION) return partes.join(' ');
    }
  }
  return `Cómo inscribirte ${conArticulo(c)} de Teclab.`;
}

/**
 * Miniatura para compartir: la misma que la ficha (ogCarrera en
 * app/carreras/[slug]/page.tsx). Las de Teclab llevan la portada de su familia.
 */
export function ogInscripcion(c: Pick<Carrera, 'nivel'>): string {
  const familia = getFamiliaTeclab(c);
  return familia ? `/imagenes/og/default-teclab-${familia}.jpg` : '/imagenes/og/default.jpg';
}

/**
 * El tramite real de Teclab, relevado el 02/10/2026: la preinscripcion se carga
 * en el Portal Administrativo, el portal manda el mail de acceso (usuario y
 * contraseña son el DNI sin puntos) y el pago es autogestionado en el portal
 * del alumno. Sin fechas, precios ni cuotas: cambian y aca no se mantienen.
 */
export const PASOS_INSCRIPCION = [
  {
    titulo: 'Completás la preinscripción',
    texto: 'Cargás tus datos en el formulario de esta página.',
  },
  {
    titulo: 'Te llega un mail de Teclab',
    texto: 'Con tu usuario y tu contraseña del portal del alumno: los dos son tu DNI, sin puntos.',
  },
  {
    titulo: 'Pagás desde el portal',
    texto: 'Entrás al portal del alumno y abonás con el medio de pago que elijas.',
  },
] as const;

/**
 * Lo que pide la preinscripcion de Teclab (CASAS.teclab.preinscripcion en
 * components/formularios/casas.ts). El test de esta pagina cuida que esos
 * campos sigan existiendo.
 */
export const A_TENER_A_MANO = [
  'Tu DNI',
  'Tu domicilio',
  'El nombre y la localidad de tu colegio secundario',
  'Un mail y un teléfono de contacto',
] as const;

export interface PreguntaInscripcion {
  pregunta: string;
  respuesta: string;
}

const sinPunto = (s: string) => s.trim().replace(/\.$/, '');

/**
 * Dos preguntas de inscripcion con respuesta sacada de la fila de la carrera.
 * La que no tiene dato no se publica: estas respuestas tambien van como
 * FAQPage, y un dato estructurado es una afirmacion.
 */
export function preguntasInscripcion(
  c: Pick<Carrera, 'nivel' | 'duracion' | 'titulo' | 'enfoque'>,
): PreguntaInscripcion[] {
  const preguntas: PreguntaInscripcion[] = [];
  const curso = esCursoTeclab(c);
  const { modalidad, certificado } = parseEnfoqueTeclab(c.enfoque);

  if (/online|virtual|distancia/i.test(modalidad)) {
    preguntas.push({
      pregunta: '¿Tengo que ir a algún lado para inscribirme?',
      respuesta: `No. La preinscripción y el pago se hacen online, y la cursada es ${modalidad.toLowerCase()}.`,
    });
  }

  const duracion = c.duracion && c.duracion !== 'Consultar' ? c.duracion : '';
  const titulo = c.titulo && c.titulo !== 'Consultar' ? sinPunto(c.titulo) : '';
  if (duracion && curso) {
    preguntas.push({
      pregunta: '¿Cuánto dura el curso?',
      respuesta: `Dura ${duracion}.${titulo ? ` Al terminar obtenés el ${titulo.charAt(0).toLowerCase()}${titulo.slice(1)}.` : ''}`,
    });
  } else if (duracion && titulo) {
    preguntas.push({
      pregunta: '¿Cuánto dura y qué título obtengo?',
      respuesta: `Dura ${duracion} y te recibís de ${titulo}.${certificado ? ` Al completar el primer año obtenés el certificado intermedio de ${sinPunto(certificado)}.` : ''}`,
    });
  }

  return preguntas;
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

/** Pasos del tramite y que tener a mano: va despues del formulario. */
export function GuiaInscripcion() {
  return (
    <div className="inscripcion-guia">
      <section className="career-section inscripcion-pasos" aria-labelledby="inscripcion-pasos-titulo">
        <div className="career-section-heading">
          <span>Paso a paso</span>
          <h2 id="inscripcion-pasos-titulo">Cómo es la inscripción</h2>
        </div>
        <ol>
          {PASOS_INSCRIPCION.map((paso, index) => (
            <li key={paso.titulo}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{paso.titulo}</h3>
                <p>{paso.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="career-section inscripcion-necesitas" aria-labelledby="inscripcion-necesitas-titulo">
        <div className="career-section-heading">
          <span>Antes de empezar</span>
          <h2 id="inscripcion-necesitas-titulo">Qué tener a mano</h2>
        </div>
        <ul className="career-learning-list">
          {A_TENER_A_MANO.map((item) => (
            <li key={item}>
              <span><CheckIcon /></span>
              <p>{item}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Preguntas visibles: las mismas que declara el FAQPage de la pagina. */
export function PreguntasInscripcion({ preguntas }: { preguntas: PreguntaInscripcion[] }) {
  if (!preguntas.length) return null;
  return (
    <section className="career-section inscripcion-preguntas" aria-labelledby="inscripcion-preguntas-titulo">
      <div className="career-section-heading">
        <span>Preguntas frecuentes</span>
        <h2 id="inscripcion-preguntas-titulo">Antes de inscribirte</h2>
      </div>
      <dl>
        {preguntas.map((p) => (
          <div key={p.pregunta}>
            <dt>{p.pregunta}</dt>
            <dd>{p.respuesta}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
