import test from 'node:test';
import assert from 'node:assert/strict';
import * as taxonomia from '../components/index/types.ts';
import * as adaptadores from '../lib/datos/carrera-detalle.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

const fila = {
  id: 7, nombre: 'Abogacía', nivel: 'Grado', duracion: null, titulo: null,
  modalidad: 'Virtual', prefix: null, nombre_corto: null, orden: null,
  activa: true, destacada: false, nueva: false, proximamente: false,
  descripcion: null, enfoque: null, plan_estudios: null,
  seccion_modalidad: null, seccion_duracion: null, slides: null,
};

function dependencias(data, error = null) {
  const llamadas = [];
  const consulta = {
    select: columnas => { llamadas.push(['select', columnas]); return consulta; },
    eq: (...args) => { llamadas.push(['eq', ...args]); return consulta; },
    order: (...args) => { llamadas.push(['order', ...args]); return consulta; },
    then: resolver => resolver({ data, error }),
    throwOnError: () => error ? Promise.reject(error) : Promise.resolve({ data }),
  };
  return { llamadas, modulos: {
    '@/lib/supabase': { supabase: { from: tabla => { llamadas.push(['from', tabla]); return consulta; } } },
    '@/components/index/types': taxonomia,
    '@/lib/datos/carrera-detalle': adaptadores,
    'next/server': { NextResponse: Response },
  } };
}

function cargarApi(data, error = null) {
  const { llamadas, modulos } = dependencias(data, error);
  return { ...cargarTypescript('app/api/carreras-detalle/route.ts', modulos), llamadas };
}

function cargarPagina(data, error = null) {
  const { llamadas, modulos } = dependencias(data, error);
  return {
    ...cargarTypescript('app/carreras/[slug]/page.tsx', modulos, () => ({})),
    llamadas,
  };
}

test('GET rechaza un plan corrupto sin publicar ni cachear un éxito parcial', async t => {
  const log = t.mock.method(console, 'error', () => {});
  const corrupta = { ...fila, slides: [{ type: 'plan_estudios', paginas: [{
    izquierda: { año: '1', cuatrimestres: [{ label: '1', materias: 42 }] },
  }] }] };
  const respuesta = await cargarApi([{ ...fila, id: 6 }, corrupta]).GET();
  assert.equal(respuesta.status, 502);
  assert.equal(respuesta.headers.get('Cache-Control'), null);
  assert.deepEqual(await respuesta.json(), { error: 'no se pudo leer el detalle' });
  assert.deepEqual(log.mock.calls[0].arguments, ['Detalle de carrera inválido:', {
    id: 7, ruta: 'slides[0].paginas[0].izquierda.cuatrimestres[0].materias',
  }]);
});

const slides = [
  { type: 'portada', imagen_desktop: '/portada.jpg', imagen_desktop_position: '50% 20%',
    imagen_brightness: 0, imagen_mobile: '/movil.jpg', bullets: ['Uno'],
    badges: [{ label: 'Título', value: 'Oficial' }] },
  { type: 'modalidad', imagen: '/modalidad.jpg', titulo: 'A distancia',
    items: [{ texto: 'Tutorías', bold_inicio: 'Con ', bold_fin: ' docentes' }] },
  { type: 'evaluacion', cards: [{ numero: '2', label: 'Exámenes', sub: 'Por materia', accent: false }],
    tags: ['Virtual'], nota: 'Final integrador' },
  { type: 'plan_estudios', paginas: [{
    izquierda: { año: '1', cuatrimestres: [{ label: 'Primero', materias: ['Derecho'] }] },
    derecha: { año: '2', cuatrimestres: [{ label: 'Segundo', materias: [] }] },
    extras: [{ titulo: 'Práctica', items: ['Seminario'], nota: 'Anual' }],
  }] },
  { type: 'cierre', imagen: '/cierre.jpg', titulo: 'Inscripción', subtitulo: 'Consultá',
    beneficios: [{ icono: 'check', texto: 'Acompañamiento' }] },
];

test('las cinco variantes conservan todos los campos conocidos sin mutar la entrada', () => {
  const entrada = structuredClone(slides);
  const salida = adaptadores.validarSlides(entrada, fila.id);
  assert.deepEqual(salida, slides);
  assert.deepEqual(entrada, slides);
  assert.notEqual(salida, entrada);
  assert.notEqual(salida[3].paginas[0].izquierda, entrada[3].paginas[0].izquierda);
});

const opcionales = [
  [0, 'imagen_desktop'], [0, 'imagen_desktop_position'], [0, 'imagen_brightness'],
  [0, 'imagen_mobile'], [0, 'badges'], [1, 'imagen'],
  [1, 'items', 0, 'bold_inicio'], [1, 'items', 0, 'bold_fin'],
  [2, 'cards', 0, 'accent'], [3, 'paginas', 0, 'derecha'],
  [3, 'paginas', 0, 'extras'], [3, 'paginas', 0, 'extras', 0, 'nota'],
  [4, 'imagen'], [4, 'subtitulo'],
];

function padreDe(objeto, ruta) {
  return ruta.slice(0, -1).reduce((valor, clave) => valor[clave], objeto);
}

test('cada opcional acepta ausencia o null y se omite de la proyección', () => {
  for (const ruta of opcionales) {
    const esperada = structuredClone(slides);
    delete padreDe(esperada, ruta)[ruta.at(-1)];
    assert.deepEqual(adaptadores.validarSlides(esperada, 7), esperada);
    const entrada = structuredClone(slides);
    padreDe(entrada, ruta)[ruta.at(-1)] = null;
    assert.deepEqual(adaptadores.validarSlides(entrada, 7), esperada);
  }
});

test('ningún objeto del JSON publica claves ajenas al contrato', () => {
  function agregarPrivado(valor) {
    if (Array.isArray(valor)) return valor.map(agregarPrivado);
    if (valor && typeof valor === 'object') {
      return { ...Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, agregarPrivado(v)])), privado: 'no publicar' };
    }
    return valor;
  }
  const entrada = agregarPrivado(slides);
  entrada[3].extras = null; // El caso real de extras en la raíz, fuera de paginas.
  assert.deepEqual(adaptadores.validarSlides(entrada, 7), slides);
});

test('los adaptadores conservan null/listas vacías y normalizan sólo las columnas acordadas', () => {
  for (const valor of [null, []]) {
    const publica = adaptadores.carreraAPublica({ ...fila, slides: valor, descuento_especial: { privado: true }, area: 'privada' });
    assert.deepEqual(publica, { ...fila, slides: valor, duracion: '', titulo: '', descripcion: '', enfoque: '', orden: 0 });
    assert.deepEqual(adaptadores.carreraADetalle({ ...fila, slides: valor }), {
      slides: valor, plan_estudios: null, seccion_modalidad: null, seccion_duracion: null,
      descripcion: '', enfoque: '',
    });
  }
  const completa = { ...fila, duracion: '5 años', titulo: 'Abogado', descripcion: 'Descripción',
    enfoque: 'Enfoque', orden: 8, plan_estudios: 'Plan', seccion_modalidad: 'Modalidad',
    seccion_duracion: 'Duración', prefix: 'Lic.', nombre_corto: 'Derecho', slides };
  assert.deepEqual(adaptadores.carreraAPublica(completa), completa);
});

test('rechaza discriminantes, listas y elementos inválidos con contexto sin contenido', () => {
  for (const valor of [42, false, 'secreto', {}, [null], [42], [[]], [{}], [{ type: 'secreto' }], [{ type: null }]]) {
    assert.throws(() => adaptadores.validarSlides(valor, 7), error => {
      assert.ok(error instanceof adaptadores.ErrorDetalleCarrera);
      assert.equal(error.id, 7);
      assert.match(error.ruta, /^slides/);
      assert.equal(error.message.includes('secreto'), false);
      return true;
    });
  }
});

test('valida todas las primitivas y colecciones anidadas, incluidas las opcionales', () => {
  function rutas(valor, prefijo = []) {
    const resultado = prefijo.length ? [prefijo] : [];
    if (valor && typeof valor === 'object') {
      for (const [clave, hijo] of Object.entries(valor)) resultado.push(...rutas(hijo, [...prefijo, clave]));
    }
    return resultado;
  }
  for (const ruta of rutas(slides)) {
    const entrada = structuredClone(slides);
    padreDe(entrada, ruta)[ruta.at(-1)] = { invalido: true };
    assert.throws(() => adaptadores.validarSlides(entrada, 7), adaptadores.ErrorDetalleCarrera, ruta.join('.'));
  }
  for (const valor of [NaN, Infinity, -Infinity, '1']) {
    assert.throws(() => adaptadores.validarSlides([{ ...slides[0], imagen_brightness: valor }], 7));
  }
  for (const valor of [null, undefined, 42]) {
    assert.throws(() => adaptadores.validarSlides([{ ...slides[0], bullets: [valor] }], 7));
  }
});

test('GET proyecta el mapa exacto, filtra antes de validar y conserva la caché de éxito', async () => {
  const api = cargarApi([{ ...fila, slides, descuento_especial: 'privado' },
    { ...fila, id: 8, nivel: 'Posgrado', slides: [null] }]);
  const respuesta = await api.GET();
  assert.equal(respuesta.status, 200);
  assert.deepEqual(await respuesta.json(), { 7: adaptadores.carreraADetalle({ ...fila, slides }) });
  assert.equal(respuesta.headers.get('Cache-Control'), 'public, s-maxage=86400, stale-while-revalidate=604800');
  assert.deepEqual(api.llamadas, [['from', 'carreras'], ['select', adaptadores.COLUMNAS_FICHA_DETALLE], ['eq', 'activa', true]]);
});

test('GET acepta resultados vacíos y distingue errores de consulta', async t => {
  const log = t.mock.method(console, 'error', () => {});
  for (const data of [null, []]) {
    const vacia = await cargarApi(data).GET();
    assert.equal(vacia.status, 200);
    assert.deepEqual(await vacia.json(), {});
    const fallida = await cargarApi(data, new Error('Consulta fallida')).GET();
    assert.equal(fallida.status, 502);
    assert.equal(fallida.headers.get('Cache-Control'), null);
    assert.deepEqual(await fallida.json(), { error: 'no se pudo leer el detalle' });
  }
  assert.ok(log.mock.calls.every(llamada => llamada.arguments.length === 1));
  assert.equal(JSON.stringify(log.mock.calls).includes('Consulta fallida'), false);
});

test('la página usa proyección pública, filtro previo y orden; vacío válido no es fallo', async () => {
  const pagina = cargarPagina([fila, { ...fila, id: 8, nivel: 'Posgrado', slides: [null] }]);
  assert.deepEqual(await pagina.generateStaticParams(), [{ slug: 'abogacia' }]);
  assert.deepEqual(pagina.llamadas, [['from', 'carreras'], ['select', adaptadores.COLUMNAS_CARRERA_PUBLICA],
    ['eq', 'activa', true], ['order', 'orden', { ascending: true }]]);
  for (const data of [null, []]) assert.deepEqual(await cargarPagina(data).generateStaticParams(), []);
});

test('página, metadata y parámetros propagan errores contextuales en vez de éxito parcial o 404', async () => {
  for (const fallo of [null, new Error('Consulta fallida')]) {
    const pagina = cargarPagina([fila, { ...fila, id: 8, slides: [null] }], fallo);
    for (const ejecutar of [pagina.default, pagina.generateMetadata, pagina.generateStaticParams]) {
      await assert.rejects(ejecutar({ params: Promise.resolve({ slug: 'abogacia' }) }),
        fallo ? /Consulta fallida/ : /Detalle inválido de carrera 8: slides\[0\]/);
    }
  }
});
