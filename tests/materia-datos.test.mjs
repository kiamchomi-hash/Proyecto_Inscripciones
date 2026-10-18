import test from 'node:test';
import assert from 'node:assert/strict';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

const fila = {
  id: 'm1', slug: 'matematica', label: 'Matemática', nombre_profesor: 'Docente',
  whatsapp: '123', telefono_display: '123', descripcion: ['Descripción'], imagenes: ['/foto.webp'],
  en_construccion: false, orden: 1, modo_manana: false, dias_bloqueados: [],
  horarios_bloqueados: [], texto_seo: ['<h3>Temas</h3>'],
};

function pagina(listado, detalle = fila, navegacion = [], errores = []) {
  const llamadas = [];
  let indice = 0;
  const supabase = { from(tabla) {
    llamadas.push(['from', tabla]);
    const consulta = {
      select(campos) { llamadas.push(['select', campos]); return consulta; },
      eq(...args) { llamadas.push(['eq', ...args]); return consulta; },
      order(...args) { llamadas.push(['order', ...args]); return consulta; },
      throwOnError() { return Promise.resolve({ data: listado }); },
      maybeSingle() { return Promise.resolve({ data: detalle, error: errores[indice++] ?? null }); },
      then(resolver) { return resolver({ data: navegacion }); },
    };
    return consulta;
  } };
  const modulos = { '@/lib/json-ld': { jsonLdScript: JSON.stringify }, '@/lib/sede': { GEO: {}, POSTAL_ADDRESS: {} }, '@/lib/supabase': { supabase }, 'next/navigation': { notFound() { throw new Error('404'); } } };
  // La frontera se carga sólo cuando la página real la importa.
  const resto = nombre => nombre === '@/lib/datos/materia'
    ? cargarTypescript('lib/datos/materia.ts', {})
    : nombre === 'react/jsx-runtime'
      ? { jsx: (tipo, props) => ({ tipo, props }), jsxs: (tipo, props) => ({ tipo, props }) }
      : {};
  return {
    listado: cargarTypescript('app/clases-apoyo/page.tsx', modulos, resto),
    detalle: cargarTypescript('app/clases-apoyo/[materia]/page.tsx', modulos, resto), llamadas,
  };
}
const params = { params: Promise.resolve({ materia: 'matematica' }) };

test('el listado real rechaza descripcion corrupta antes del render', async () => {
  await assert.rejects(pagina([{ ...fila, descripcion: 42 }]).listado.default(), /Materia inválida m1: descripcion/);
});

test('la ficha real rechaza imágenes corruptas antes del render o metadata', async () => {
  for (const ejecutar of ['default', 'generateMetadata']) {
    await assert.rejects(pagina([], { ...fila, imagenes: ['/foto', 42] }).detalle[ejecutar](params),
      /Materia inválida m1: imagenes\[1\]/);
  }
});

const adaptadores = cargarTypescript('lib/datos/materia.ts', {});
const { materiaACard, materiaAFicha, materiaAFichaBasica, materiaANavegacion } = adaptadores;
const camposJson = ['descripcion', 'imagenes', 'dias_bloqueados', 'horarios_bloqueados', 'texto_seo'];

test('la ficha conserva todos los campos válidos sin mutar ni compartir colecciones', () => {
  const entrada = { ...structuredClone(fila), activa: true, created_at: 'privado' };
  const copia = structuredClone(entrada);
  const salida = materiaAFicha(entrada);
  assert.deepEqual(salida, fila);
  assert.deepEqual(entrada, copia);
  for (const campo of camposJson) assert.notEqual(salida[campo], entrada[campo]);
  assert.deepEqual(materiaAFichaBasica(entrada), { ...fila, texto_seo: null });
  assert.deepEqual(materiaACard(entrada), {
    id: fila.id, slug: fila.slug, label: fila.label, en_construccion: false, descripcion: fila.descripcion,
  });
  assert.deepEqual(materiaANavegacion(entrada), {
    id: fila.id, slug: fila.slug, label: fila.label, en_construccion: false, foto: '/foto.webp',
  });
});

test('null y listas vacías conservan el comportamiento de presentación sin inventar contenido', () => {
  for (const valor of [null, []]) {
    const entrada = { ...fila, ...Object.fromEntries(camposJson.map(campo => [campo, valor])) };
    assert.deepEqual(materiaAFicha(entrada), { ...fila, descripcion: [], imagenes: [],
      dias_bloqueados: [], horarios_bloqueados: [], texto_seo: valor });
    assert.deepEqual(materiaACard(entrada).descripcion, valor);
    assert.equal(materiaANavegacion(entrada).foto, null);
  }
});

test('cada colección exige strings, incluidos texto SEO y elementos anidados', () => {
  for (const campo of camposJson) {
    for (const valor of [42, false, 'secreto', {}, [null], [42], [[]], [{}], ['válido', ['anidado']]]) {
      assert.throws(() => materiaAFicha({ ...fila, [campo]: valor }), error => {
        assert.ok(error instanceof adaptadores.ErrorDatosMateria);
        assert.equal(error.id, fila.id);
        assert.match(error.ruta, new RegExp(`^${campo}(\\[\\d+\\])?$`));
        assert.equal(error.message.includes('secreto'), false);
        return true;
      });
    }
  }
  // La navegación valida también las fotos que no necesita mostrar.
  assert.throws(() => materiaANavegacion({ ...fila, imagenes: ['primera', 42] }), /imagenes\[1\]/);
});

test('las páginas usan proyecciones exactas y el listado vacío sigue siendo válido', async () => {
  const listado = pagina([fila]);
  await listado.listado.default();
  assert.deepEqual(listado.llamadas, [['from', 'materias'], ['select', adaptadores.COLUMNAS_MATERIA_CARD],
    ['eq', 'activa', true], ['order', 'orden', { ascending: true }]]);
  for (const data of [null, []]) await pagina(data).listado.default();
  const detalle = pagina([], fila, [fila]);
  await detalle.detalle.default(params);
  assert.deepEqual(detalle.llamadas.filter(llamada => llamada[0] === 'select'), [
    ['select', adaptadores.COLUMNAS_MATERIA_FICHA], ['select', adaptadores.COLUMNAS_MATERIA_NAV],
  ]);
  assert.deepEqual(adaptadores.COLUMNAS_MATERIA_CARD.split(', '),
    ['id', 'slug', 'label', 'en_construccion', 'descripcion']);
  assert.deepEqual(adaptadores.COLUMNAS_MATERIA_NAV.split(', '),
    ['id', 'slug', 'label', 'en_construccion', 'imagenes']);
  assert.deepEqual(adaptadores.COLUMNAS_MATERIA_BASICA.split(', '),
    Object.keys(fila).filter(campo => campo !== 'texto_seo'));
  assert.equal(adaptadores.COLUMNAS_MATERIA_FICHA, `${adaptadores.COLUMNAS_MATERIA_BASICA}, texto_seo`);
});

test('el fallback sin columna SEO valida la ficha y no reintenta JSON corrupto', async () => {
  const fallback = pagina([], fila, [], [{ code: '42703' }]);
  await fallback.detalle.default(params);
  assert.deepEqual(fallback.llamadas.filter(llamada => llamada[0] === 'select'), [
    ['select', adaptadores.COLUMNAS_MATERIA_FICHA], ['select', adaptadores.COLUMNAS_MATERIA_NAV],
    ['select', adaptadores.COLUMNAS_MATERIA_BASICA],
  ]);
  const corrupta = pagina([], { ...fila, texto_seo: ['Texto', { contenido: 'anidado' }] });
  await assert.rejects(corrupta.detalle.default(params), /texto_seo\[1\]/);
  assert.equal(corrupta.llamadas.filter(llamada => llamada[1] === adaptadores.COLUMNAS_MATERIA_BASICA).length, 0);
  await assert.rejects(pagina([], { ...fila, descripcion: 42 }, [], [{}]).detalle.default(params), /descripcion/);
});

test('no oculta filas corruptas del listado ni la navegación como éxito parcial', async () => {
  await assert.rejects(pagina([fila, { ...fila, id: 'm2', descripcion: ['Texto', 42] }]).listado.default(),
    /Materia inválida m2: descripcion\[1\]/);
  await assert.rejects(pagina([], fila, [{ ...fila, id: 'm2', imagenes: 42 }]).detalle.default(params),
    /Materia inválida m2: imagenes/);
});

function nodos(valor) {
  if (!valor || typeof valor !== 'object') return [];
  if (Array.isArray(valor)) return valor.flatMap(nodos);
  return [valor, ...nodos(valor.props?.children)];
}

test('SEO y reserva sólo reciben su contenido propio; navegación no lleva fichas completas', async () => {
  const otra = { ...fila, id: 'm2', slug: 'fisica', label: 'Física', texto_seo: ['SEO ajeno'] };
  const arbol = await pagina([], fila, [otra]).detalle.default(params);
  const props = nodos(arbol).map(nodo => nodo.props).filter(Boolean);
  assert.deepEqual(props.find(prop => prop.parrafos)?.parrafos, fila.texto_seo);
  assert.equal(JSON.stringify(arbol).includes('SEO ajeno'), false);
  assert.deepEqual(props.find(prop => prop.materias)?.materias, [materiaANavegacion(otra)]);
  assert.ok(props.some(prop => prop.materia && Object.keys(prop.materia).length === 5
    && prop.materia.id === fila.id));
  const metadata = await pagina([], otra).detalle.generateMetadata(params);
  assert.match(metadata.description, /Física/);
  assert.equal(metadata.alternates.canonical, 'https://www.siglo21sur.com/clases-apoyo/fisica');
});

test('la ficha ausente conserva 404 y metadata de materia no encontrada', async () => {
  await assert.rejects(pagina([], null).detalle.default(params), /404/);
  assert.deepEqual(await pagina([], null).detalle.generateMetadata(params), { title: 'Materia no encontrada' });
});
