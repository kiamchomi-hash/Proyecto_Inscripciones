import type { Json, Tables } from '@/lib/database.types';
import type { Carrera, CarreraDetalle, CarreraSlide } from '@/components/index/types';

// Literales: PostgREST debe inferir cada columna, no devolver un resultado genérico.
export const COLUMNAS_FICHA_DETALLE = 'id, nivel, slides, plan_estudios, seccion_modalidad, seccion_duracion, descripcion, enfoque' as const;
export const COLUMNAS_CARRERA_PUBLICA = `${COLUMNAS_FICHA_DETALLE}, nombre, duracion, titulo, modalidad, prefix, nombre_corto, orden, activa, destacada, nueva, proximamente` as const;

type FilaDetalle = Pick<Tables<'carreras'>, 'id' | keyof CarreraDetalle>;
type FilaCarrera = Pick<Tables<'carreras'>, keyof Carrera>;
type Lector<T> = (valor: unknown, ruta: string) => T;

class ErrorFormatoSlide extends Error {}

/** Contexto suficiente para corregir la fila, sin registrar su contenido. */
export class ErrorDetalleCarrera extends Error {
  readonly id: number;
  readonly ruta: string;

  constructor(id: number, ruta: string) {
    super(`Detalle inválido de carrera ${id}: ${ruta}`);
    this.name = 'ErrorDetalleCarrera';
    this.id = id;
    this.ruta = ruta;
  }
}

function invalido(ruta: string): never {
  throw new ErrorFormatoSlide(ruta);
}

const texto: Lector<string> = (valor, ruta) => typeof valor === 'string' ? valor : invalido(ruta);
const numero: Lector<number> = (valor, ruta) => typeof valor === 'number' && Number.isFinite(valor) ? valor : invalido(ruta);
const booleano: Lector<boolean> = (valor, ruta) => typeof valor === 'boolean' ? valor : invalido(ruta);

function literal<T extends string>(esperado: T): Lector<T> {
  return (valor, ruta) => valor === esperado ? esperado : invalido(ruta);
}

function opcional<T>(leer: Lector<T>): Lector<T | undefined> {
  return (valor, ruta) => valor == null ? undefined : leer(valor, ruta);
}

function lista<T>(leer: Lector<T>): Lector<T[]> {
  return (valor, ruta) => {
    if (!Array.isArray(valor)) return invalido(ruta);
    return Array.from(valor, (elemento, indice) => leer(elemento, `${ruta}[${indice}]`));
  };
}

function objeto<E extends Record<string, Lector<unknown>>>(esquema: E): Lector<{ [K in keyof E]: ReturnType<E[K]> }> {
  return (valor, ruta) => {
    if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) return invalido(ruta);
    const salida: Record<string, unknown> = {};
    for (const [clave, leer] of Object.entries(esquema)) {
      const campo = leer(Reflect.get(valor, clave), `${ruta}.${clave}`);
      if (campo !== undefined) salida[clave] = campo;
    }
    // La aserción sólo relaciona las claves del esquema con sus lectores: cada
    // valor ya fue validado y reconstruido. Nunca se fuerza el JSON de entrada.
    return salida as { [K in keyof E]: ReturnType<E[K]> };
  };
}

const portada = objeto({
  type: literal('portada'),
  imagen_desktop: opcional(texto),
  imagen_desktop_position: opcional(texto),
  imagen_brightness: opcional(numero),
  imagen_mobile: opcional(texto),
  bullets: lista(texto),
  badges: opcional(lista(objeto({ label: texto, value: texto }))),
});

const modalidad = objeto({
  type: literal('modalidad'),
  imagen: opcional(texto),
  titulo: texto,
  items: lista(objeto({ texto, bold_inicio: opcional(texto), bold_fin: opcional(texto) })),
});

const evaluacion = objeto({
  type: literal('evaluacion'),
  cards: lista(objeto({ numero: texto, label: texto, sub: texto, accent: opcional(booleano) })),
  tags: lista(texto),
  nota: texto,
});

const anio = objeto({
  año: texto,
  cuatrimestres: lista(objeto({ label: texto, materias: lista(texto) })),
});

const plan = objeto({
  type: literal('plan_estudios'),
  paginas: lista(objeto({
    izquierda: anio,
    derecha: opcional(anio),
    extras: opcional(lista(objeto({ titulo: texto, items: lista(texto), nota: opcional(texto) }))),
  })),
});

const cierre = objeto({
  type: literal('cierre'),
  imagen: opcional(texto),
  titulo: texto,
  subtitulo: opcional(texto),
  beneficios: lista(objeto({ icono: texto, texto })),
});

const textoFaq: Lector<string> = (valor, ruta) =>
  typeof valor === 'string' && valor.trim().length > 0 ? valor : invalido(ruta);
const itemsFaq = lista(objeto({ pregunta: textoFaq, respuesta: textoFaq }));
const faq = objeto({
  type: literal('faq'),
  items: (valor: unknown, ruta: string) => {
    const items = itemsFaq(valor, ruta);
    return items.length > 0 ? items : invalido(ruta);
  },
});

const slide: Lector<CarreraSlide> = (valor, ruta) => {
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) return invalido(ruta);
  switch (Reflect.get(valor, 'type')) {
    case 'portada': return portada(valor, ruta);
    case 'modalidad': return modalidad(valor, ruta);
    case 'evaluacion': return evaluacion(valor, ruta);
    case 'plan_estudios': return plan(valor, ruta);
    case 'cierre': return cierre(valor, ruta);
    case 'faq': return faq(valor, ruta);
    default: return invalido(`${ruta}.type`);
  }
};

/** Conserva null/lista vacía; los opcionales null se omiten y las claves extra no salen. */
export function validarSlides(valor: Json | null, id: number): CarreraSlide[] | null {
  if (valor === null) return null;
  try {
    const slides = lista(slide)(valor, 'slides');
    if (slides.filter(s => s.type === 'faq').length > 1) return invalido('slides');
    return slides;
  } catch (error) {
    if (error instanceof ErrorFormatoSlide) throw new ErrorDetalleCarrera(id, error.message);
    throw error;
  }
}

export function carreraADetalle(fila: FilaDetalle): CarreraDetalle {
  return {
    slides: validarSlides(fila.slides, fila.id),
    plan_estudios: fila.plan_estudios,
    seccion_modalidad: fila.seccion_modalidad,
    seccion_duracion: fila.seccion_duracion,
    descripcion: fila.descripcion ?? '',
    enfoque: fila.enfoque ?? '',
  };
}

/** Lista explícita: una fila completa nunca publica columnas privadas por spread. */
export function carreraAPublica(fila: FilaCarrera): Carrera {
  return {
    id: fila.id,
    nombre: fila.nombre,
    nivel: fila.nivel,
    duracion: fila.duracion ?? '',
    titulo: fila.titulo ?? '',
    modalidad: fila.modalidad,
    prefix: fila.prefix,
    nombre_corto: fila.nombre_corto,
    orden: fila.orden ?? 0,
    activa: fila.activa,
    destacada: fila.destacada,
    nueva: fila.nueva,
    proximamente: fila.proximamente,
    ...carreraADetalle(fila),
  };
}
