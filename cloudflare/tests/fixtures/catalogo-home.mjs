// Catálogo sintético compartido por las dos puntas de la paridad: la respuesta
// que el stub hace pasar por PostgREST y las filas que se cargan en D1. No sale
// de la base real ni contiene precios, correos ni datos personales.
//
// Cubre una carrera de cada categoría visible, una de Identidad Argentina y un
// posgrado: estas dos últimas no se publican en la home y sirven para comprobar
// que el filtro de la taxonomía compartida actúa igual en los dos lados.

const FILAS_BASE = [
  {
    id: 11, nombre: 'Licenciatura en Administración', nivel: 'Grado', duracion: '4 años',
    titulo: 'Licenciatura en Administración', modalidad: 'A distancia', prefix: 'Licenciatura',
    nombre_corto: 'Administración', orden: 1, activa: true, destacada: true, nueva: false,
    proximamente: false, slides: null,
    descripcion: 'Formación en gestión de organizaciones.', enfoque: 'Gestión y estrategia.',
    plan_estudios: 'Primer año | 1er cuatrimestre\n• Administración I',
    seccion_modalidad: 'Cursada virtual con tutorías.', seccion_duracion: 'Cuatro años.',
  },
  {
    id: 12, nombre: 'Contador Público', nivel: 'Grado', duracion: '4 años',
    titulo: 'Contador Público', modalidad: 'A distancia', prefix: null,
    nombre_corto: null, orden: 2, activa: true, destacada: false, nueva: true,
    proximamente: false, slides: [{ type: 'portada', bullets: ['Ficha sintética'] }],
    descripcion: 'Formación contable y tributaria.', enfoque: 'Auditoría y tributos.',
    plan_estudios: 'Primer año | 1er cuatrimestre\n• Contabilidad I',
    seccion_modalidad: 'Cursada virtual.', seccion_duracion: 'Cuatro años.',
  },
  {
    id: 13, nombre: 'Tecnicatura Superior en Programación', nivel: 'Pregrado', duracion: '3 años',
    titulo: 'Tecnicatura Superior en Programación', modalidad: 'A distancia', prefix: 'Tecnicatura',
    nombre_corto: 'Programación', orden: 1, activa: true, destacada: true, nueva: false,
    proximamente: false, slides: null,
  },
  {
    id: 14, nombre: 'Tecnicatura en Desarrollo de Software', nivel: 'Teclab - Tecnología',
    duracion: '2 años', titulo: 'Tecnicatura en Desarrollo de Software', modalidad: 'Online',
    prefix: 'Tecnicatura', nombre_corto: 'Desarrollo de Software', orden: 1, activa: true,
    destacada: false, nueva: false, proximamente: true, slides: null,
  },
  {
    id: 15, nombre: 'Curso de Inteligencia Artificial', nivel: 'Teclab - Curso', duracion: '6 meses',
    titulo: 'Curso de Inteligencia Artificial', modalidad: 'Online', prefix: 'Curso',
    nombre_corto: 'Inteligencia Artificial', orden: 1, activa: true, destacada: false,
    nueva: false, proximamente: false, slides: null,
  },
  {
    id: 16, nombre: 'Diplomatura en Oratoria', nivel: 'Identidad Argentina', duracion: '6 meses',
    titulo: 'Diplomatura en Oratoria', modalidad: 'Presencial', prefix: 'Diplomatura',
    nombre_corto: 'Oratoria', orden: 1, activa: true, destacada: false, nueva: false,
    proximamente: false, slides: null,
  },
  {
    id: 17, nombre: 'Maestría en Gestión Educativa', nivel: 'Posgrado', duracion: '2 años',
    titulo: 'Maestría en Gestión Educativa', modalidad: 'A distancia', prefix: 'Maestría',
    nombre_corto: 'Gestión Educativa', orden: 1, activa: true, destacada: false, nueva: false,
    proximamente: false, slides: null,
  },
  {
    // Apagada a propósito: ni la home, ni /teclab ni `/api/carreras-detalle`
    // pueden publicarla.
    id: 18, nombre: 'Licenciatura en Agroinformática', nivel: 'Grado', duracion: '4 años',
    titulo: 'Licenciatura en Agroinformática', modalidad: 'A distancia', prefix: 'Licenciatura',
    nombre_corto: 'Agroinformática', orden: 3, activa: false, destacada: false, nueva: false,
    proximamente: false, slides: null,
  },
  {
    // Perfil reconocible por el test de Teclab; «Desarrollo de Software» no lo
    // es. Permite probar resultados reales, no aprobar sólo el estado vacío.
    id: 19, nombre: 'Tecnicatura en Programación', nivel: 'Teclab - Tecnología',
    duracion: '2 años', titulo: 'Tecnicatura en Programación', modalidad: 'Online',
    prefix: 'Tecnicatura', nombre_corto: 'Programación', orden: 2, activa: true,
    destacada: false, nueva: false, proximamente: false, slides: null,
  },
];

// `updated_at` viaja en el fixture para que el sitemap de las dos plataformas
// produzca el mismo `<lastmod>`. Next lo lee de Supabase y D1 lo devuelve de su
// columna, con la misma forma ISO.
export const FILAS = FILAS_BASE.map((fila, indice) => ({
  ...fila,
  updated_at: `2026-10-${String(10 + indice).padStart(2, '0')}T12:00:00.000Z`,
}));

/** Respuesta que el stub devuelve en lugar de PostgREST. */
export function filasPostgrest() {
  return FILAS;
}

/** Carga las mismas filas en el D1 local, con su codificación de columnas. */
export async function insertarCatalogo(db) {
  for (const fila of FILAS) {
    await db.prepare(`INSERT INTO carreras
      (id, nombre, nivel, modalidad, duracion, titulo, prefix, nombre_corto, orden,
       activa, destacada, nueva, proximamente, slides, updated_at,
       descripcion, enfoque, plan_estudios, seccion_modalidad, seccion_duracion)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20)`).bind(
      fila.id, fila.nombre, fila.nivel, fila.modalidad, fila.duracion, fila.titulo,
      fila.prefix, fila.nombre_corto, fila.orden,
      fila.activa ? 1 : 0, fila.destacada ? 1 : 0, fila.nueva ? 1 : 0,
      fila.proximamente ? 1 : 0,
      fila.slides ? JSON.stringify(fila.slides) : null,
      fila.updated_at,
      fila.descripcion ?? null, fila.enfoque ?? null, fila.plan_estudios ?? null,
      fila.seccion_modalidad ?? null, fila.seccion_duracion ?? null,
    ).run();
  }
  await insertarApoyoFaq(db);
  await insertarInscripciones(db);
  await insertarNovedades(db);
}

/**
 * Las mismas filas como SQL para `wrangler d1 execute --file`: el navegador
 * necesita un servidor real (no el harness en memoria) y su D1 se siembra por
 * CLI. `DELETE` primero para poder repetir sobre la misma base efímera.
 */
export function sqlCatalogo() {
  const valor = v => {
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'boolean') return v ? '1' : '0';
    if (typeof v === 'object') return `'${JSON.stringify(v).replaceAll("'", "''")}'`;
    return `'${String(v).replaceAll("'", "''")}'`;
  };
  const columnas = [
    'id', 'nombre', 'nivel', 'modalidad', 'duracion', 'titulo', 'prefix', 'nombre_corto',
    'orden', 'activa', 'destacada', 'nueva', 'proximamente', 'slides', 'updated_at',
    'descripcion', 'enfoque', 'plan_estudios', 'seccion_modalidad', 'seccion_duracion',
  ];
  const lineas = ['DELETE FROM carreras;'];
  for (const fila of FILAS) {
    lineas.push(`INSERT INTO carreras (${columnas.join(',')}) VALUES (${columnas.map(c => valor(fila[c])).join(',')});`);
  }
  return `${lineas.join('\n')}\n${sqlApoyoFaq()}\n${sqlInscripciones()}\n${sqlNovedades()}\n`;
}
import { insertarApoyoFaq, sqlApoyoFaq } from './apoyo-faq.mjs';
import { insertarInscripciones, sqlInscripciones } from './inscripciones.mjs';
import { insertarNovedades, sqlNovedades } from './novedades.mjs';
