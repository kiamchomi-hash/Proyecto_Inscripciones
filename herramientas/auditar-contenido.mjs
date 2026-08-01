#!/usr/bin/env node
// Auditoria de contenido contra Supabase: busca filas publicadas a las que les
// falta algo, para que el desfasaje entre la base y las fuentes reales se note
// solo. Fue lo que no paso con los planes de estudio de Identidad Argentina
// (162 puntos del temario faltantes, descubierto de casualidad).
//
//   npm run auditar
//
// Lee con la anon key, asi que corre en local sin credenciales extra. Sale con
// codigo 1 si encontro algun problema, 0 si esta limpio.
//
// Importa esCarreraVisible() del modulo real (Node 24 strippea los tipos): si
// manana se agrega una categoria, la auditoria la toma sola.

import { existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { carreraToSlug, esCarreraVisible, getCategoryForCarrera } from '../components/index/types.ts';
import { esCursoTeclab } from '../components/index/teclab.ts';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  console.error('Corrrer con "npm run auditar" (carga .env.local) o exportarlas a mano.');
  process.exit(2);
}

const supabase = createClient(url, anonKey);

// Niveles que sabemos que estan fuera de la oferta a proposito. Cualquier otro
// nivel sin categoria es sospechoso: suele ser un typo al cargar la fila.
const NIVELES_FUERA_DE_OFERTA = new Set([
  'Posgrado',
  'APLV - Extragrado',
  'Certificación',
  'Curso',
]);

// Un plan de estudios mas corto que esto es casi seguro un resumen de relleno,
// no el temario real. Umbral a ojo, ajustable.
const PLAN_MINIMO_CARACTERES = 200;

const problemas = [];
const avisos = [];

function problema(grupo, detalle) {
  problemas.push({ grupo, detalle });
}
function aviso(grupo, detalle) {
  avisos.push({ grupo, detalle });
}

// ── Carreras ────────────────────────────────────────────────────────────────

const { data: carreras, error: errCarreras } = await supabase
  .from('carreras')
  .select('id, nombre, prefix, nivel, activa, proximamente, duracion, titulo, descripcion, plan_estudios, slides')
  .eq('activa', true);

if (errCarreras) {
  console.error('No se pudo leer carreras:', errCarreras.message);
  process.exit(2);
}

const visibles = carreras.filter(esCarreraVisible);
const ocultas = carreras.filter(c => !esCarreraVisible(c));

// El plan puede venir de dos lados y la ficha se conforma con cualquiera de los
// dos: la columna plan_estudios (texto plano, Teclab e Identidad Argentina) o un
// slide de tipo plan_estudios con materias cargadas. Mismo criterio que el
// hasPlan de components/carreras/career-detail.tsx.
function slideDePlanConMaterias(slides) {
  if (!Array.isArray(slides)) return false;
  return slides.some(s =>
    s?.type === 'plan_estudios' &&
    (s.paginas || []).some(p =>
      [p?.izquierda, p?.derecha].some(lado =>
        (lado?.cuatrimestres || []).some(cu => (cu?.materias || []).length > 0))));
}

for (const c of visibles) {
  const nombre = `#${c.id} ${c.nombre}`;
  const columna = (c.plan_estudios || '').trim();
  const enSlides = slideDePlanConMaterias(c.slides);
  // Una carrera anunciada pero sin inscripcion abierta todavia no tiene por que
  // tener el temario: la universidad no lo publico. Se avisa, no se marca falla.
  // Un curso corto tampoco: no tiene plan de estudios por cuatrimestre, y en su
  // columna plan_estudios va como se cursa, que es mas corto que el umbral.
  const curso = esCursoTeclab(c);
  const registrar = c.proximamente || curso ? aviso : problema;
  const sufijo = c.proximamente ? ' (proximamente)' : curso ? ' (curso)' : '';

  if (!columna && !enSlides) {
    registrar('Carreras sin plan de estudios (ni columna ni slide)', nombre + sufijo);
  } else if (columna && !enSlides && columna.length < PLAN_MINIMO_CARACTERES) {
    registrar('Plan de estudios sospechosamente corto', `${nombre}${sufijo} — ${columna.length} caracteres`);
  }

  const slides = Array.isArray(c.slides) ? c.slides : null;
  if (!slides || slides.length === 0) {
    // Convenio y la oferta Teclab arman la ficha desde sus campos, sin slides.
    const cat = getCategoryForCarrera(c);
    const tieneModalPropio = cat === 'identidad_argentina' || cat === 'teclab_tecnologia' || cat === 'teclab_gestion';
    if (!tieneModalPropio) {
      // Estas disparan el mail de /api/notificar-carrera cada vez que alguien abre la ficha.
      registrar('Carreras sin slides (avisan por mail al abrirse)', nombre + sufijo);
    }
  }

  for (const campo of ['duracion', 'titulo', 'descripcion']) {
    if (!c[campo] || !String(c[campo]).trim()) {
      problema(`Carreras con "${campo}" vacio`, nombre);
    }
  }
}

// Colision de slugs: dos carreras visibles que resuelven a la misma URL. La
// pagina /carreras/[slug] sirve una sola, la otra queda inalcanzable.
const porSlug = new Map();
for (const c of visibles) {
  const slug = carreraToSlug(c);
  if (!porSlug.has(slug)) porSlug.set(slug, []);
  porSlug.get(slug).push(c);
}
for (const [slug, filas] of porSlug) {
  if (filas.length > 1) {
    problema('Slugs de carrera duplicados', `${slug} → ${filas.map(f => `#${f.id}`).join(', ')}`);
  }
}

// Niveles sin categoria que no estan en la lista conocida: typo al cargar.
const nivelesRaros = new Map();
for (const c of ocultas) {
  if (!NIVELES_FUERA_DE_OFERTA.has(c.nivel)) {
    if (!nivelesRaros.has(c.nivel)) nivelesRaros.set(c.nivel, []);
    nivelesRaros.get(c.nivel).push(c.id);
  }
}
for (const [nivel, ids] of nivelesRaros) {
  problema('Nivel desconocido (no se lista en ningun lado)', `"${nivel}" → #${ids.join(', #')}`);
}

// ── Materias ────────────────────────────────────────────────────────────────

const { data: materias, error: errMaterias } = await supabase
  .from('materias')
  .select('id, label, slug, activa')
  .eq('activa', true);

if (errMaterias) {
  aviso('Materias', `no se pudieron leer: ${errMaterias.message}`);
} else {
  const slugsMateria = new Map();
  for (const m of materias) {
    if (!m.slug || !m.slug.trim()) {
      problema('Materias activas sin slug (van al sitemap rotas)', `#${m.id} ${m.label}`);
      continue;
    }
    if (!slugsMateria.has(m.slug)) slugsMateria.set(m.slug, []);
    slugsMateria.get(m.slug).push(m.id);
  }
  for (const [slug, ids] of slugsMateria) {
    if (ids.length > 1) problema('Slugs de materia duplicados', `${slug} → #${ids.join(', #')}`);
  }
}

// ── Novedades ───────────────────────────────────────────────────────────────

const { data: novedades, error: errNovedades } = await supabase
  .from('novedades')
  .select('id, titulo, slug, imagen_url, extracto, publicada')
  .eq('publicada', true);

if (errNovedades) {
  aviso('Novedades', `no se pudieron leer: ${errNovedades.message}`);
} else {
  const slugsNovedad = new Map();
  for (const n of novedades) {
    const nombre = `#${n.id} ${n.titulo}`;
    if (!n.slug || !n.slug.trim()) {
      aviso('Novedades publicadas sin slug (no tienen articulo propio)', nombre);
    } else {
      if (!slugsNovedad.has(n.slug)) slugsNovedad.set(n.slug, []);
      slugsNovedad.get(n.slug).push(n.id);
    }
    if (!n.imagen_url || !n.imagen_url.trim()) {
      problema('Novedades publicadas sin imagen (tarjeta y cabecera vacias)', nombre);
    }
    // La imagen para compartir no vive en la base: se sirve por convencion de ruta
    // desde generateMetadata. Si falta el archivo, el og:image apunta a un 404 y no
    // hay forma de notarlo desde la base — por eso se chequea el disco.
    if (n.slug && n.slug.trim() && !existsSync(`public/imagenes/og/${n.slug}.jpg`)) {
      problema('Novedades sin imagen para compartir (correr `node herramientas/generar-og.mjs`)', nombre);
    }
    if (!n.extracto || !n.extracto.trim()) {
      aviso('Novedades publicadas sin extracto', nombre);
    }
  }
  for (const [slug, ids] of slugsNovedad) {
    if (ids.length > 1) problema('Slugs de novedad duplicados', `${slug} → #${ids.join(', #')}`);
  }
}

// ── Informe ─────────────────────────────────────────────────────────────────

function imprimir(titulo, lista) {
  if (lista.length === 0) return;
  const grupos = new Map();
  for (const { grupo, detalle } of lista) {
    if (!grupos.has(grupo)) grupos.set(grupo, []);
    grupos.get(grupo).push(detalle);
  }
  console.log(`\n${titulo}`);
  for (const [grupo, detalles] of grupos) {
    console.log(`\n  ${grupo} (${detalles.length})`);
    for (const d of detalles) console.log(`    - ${d}`);
  }
}

console.log(`Carreras activas: ${carreras.length} — visibles ${visibles.length}, fuera de oferta ${ocultas.length}`);
console.log(`Materias activas: ${materias?.length ?? '?'} — Novedades publicadas: ${novedades?.length ?? '?'}`);

imprimir('PROBLEMAS', problemas);
imprimir('AVISOS (no bloquean)', avisos);

if (problemas.length === 0) {
  console.log('\nSin problemas.');
  process.exit(0);
}
console.log(`\n${problemas.length} problema(s).`);
process.exit(1);
