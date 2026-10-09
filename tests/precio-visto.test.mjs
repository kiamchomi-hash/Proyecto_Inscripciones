import test from 'node:test';
import assert from 'node:assert/strict';

import * as tipos from '../components/index/types.ts';
import * as teclab from '../components/index/teclab.ts';
import { buscarPrecioVisto, correspondeBuscarPrecio } from '../supabase/functions/notificar/precio-visto.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

const careerContent = cargarTypescript('components/carreras/career-content.ts', {
  '@/components/index/types': tipos,
  '@/components/index/teclab': teclab,
});

// Una preinscripción de Teclab tal como la manda el trigger de `consultas`.
const fila = {
  id: 90,
  created_at: '2026-10-09T15:00:00Z',
  casa: 'teclab',
  tipo_formulario: 'preinscripcion',
  carrera: 'Tecnicatura Superior en Programación',
  email: '  Ana_Perez@Mail.com ',
};
const deps = { supabaseUrl: 'https://xyz.supabase.co/', serviceRoleKey: 'clave' };

function fetchQueResponde(cuerpo, status = 200) {
  const pedidos = [];
  const fetch = async (url, opciones) => {
    pedidos.push({ url: new URL(url), opciones });
    return new Response(JSON.stringify(cuerpo), { status });
  };
  return { fetch, pedidos };
}

test('el WhatsApp del precio ya mostrado dice que la persona lo vio', () => {
  const mensaje = careerContent.mensajeWhatsAppPrecioVisto({ nombre: 'Tecnicatura Superior en Programación', prefix: null, nivel: 'Teclab Tecnología' });
  assert.equal(mensaje, 'Hola, ya vi el precio de la carrera *TECNICATURA SUPERIOR EN PROGRAMACIÓN* y quiero avanzar con la inscripción');
  // Se distingue del botón de precios de la ficha, que pregunta sin haberlo visto.
  assert.notEqual(mensaje, careerContent.mensajeWhatsAppPrecios({ nombre: 'Tecnicatura Superior en Programación', prefix: null, nivel: 'Teclab Tecnología' }));
});

test('sólo se busca el precio para lo que no es «Ver precio» y trae mail', () => {
  assert.equal(correspondeBuscarPrecio(fila), true);
  assert.equal(correspondeBuscarPrecio({ ...fila, tipo_formulario: 'contacto' }), true);
  assert.equal(correspondeBuscarPrecio({ ...fila, tipo_formulario: 'autoinscripcion' }), true);
  assert.equal(correspondeBuscarPrecio({ ...fila, tipo_formulario: 'precio' }), false);
  assert.equal(correspondeBuscarPrecio({ ...fila, email: null }), false);
  assert.equal(correspondeBuscarPrecio({ ...fila, email: '   ' }), false);
});

test('busca el último «Ver precio» anterior del mismo mail, sin distinguir mayúsculas', async () => {
  const visto = { carrera: 'Tecnicatura Superior en Programación', created_at: '2026-10-08T18:30:00Z' };
  const { fetch, pedidos } = fetchQueResponde([visto]);
  assert.deepEqual(await buscarPrecioVisto(fila, { ...deps, fetch }), visto);

  assert.equal(pedidos.length, 1);
  const { url, opciones } = pedidos[0];
  assert.equal(url.origin + url.pathname, 'https://xyz.supabase.co/rest/v1/consultas');
  assert.equal(url.searchParams.get('select'), 'carrera,created_at');
  assert.equal(url.searchParams.get('tipo_formulario'), 'eq.precio');
  // Recortado y con el `_` escapado: en un ILIKE es comodín de un carácter.
  assert.equal(url.searchParams.get('email'), 'ilike.Ana\\_Perez@Mail.com');
  assert.equal(url.searchParams.get('id'), 'neq.90');
  assert.equal(url.searchParams.get('created_at'), 'lt.2026-10-09T15:00:00Z');
  assert.equal(url.searchParams.get('order'), 'created_at.desc');
  assert.equal(url.searchParams.get('limit'), '1');
  assert.equal(opciones.headers.apikey, 'clave');
  assert.equal(opciones.headers.Authorization, 'Bearer clave');
  assert.ok(opciones.signal, 'la consulta tiene que tener un tope de tiempo');
});

test('sin «Ver precio» previo no hay marca', async () => {
  const { fetch } = fetchQueResponde([]);
  assert.equal(await buscarPrecioVisto(fila, { ...deps, fetch }), null);
});

test('si la base falla, el aviso sale igual: devuelve null sin tirar', async () => {
  const log = () => {};
  const { fetch: con500 } = fetchQueResponde({ message: 'boom' }, 500);
  assert.equal(await buscarPrecioVisto(fila, { ...deps, fetch: con500, log }), null);

  const caido = async () => { throw new Error('timeout'); };
  assert.equal(await buscarPrecioVisto(fila, { ...deps, fetch: caido, log }), null);

  // Sin credenciales tampoco se intenta.
  let llamado = false;
  const espia = async () => { llamado = true; return new Response('[]'); };
  assert.equal(await buscarPrecioVisto(fila, { supabaseUrl: '', serviceRoleKey: '', fetch: espia, log }), null);
  assert.equal(llamado, false);
});

test('una fila de «Ver precio» o sin mail no consulta la base', async () => {
  let llamado = false;
  const espia = async () => { llamado = true; return new Response('[]'); };
  assert.equal(await buscarPrecioVisto({ ...fila, tipo_formulario: 'precio' }, { ...deps, fetch: espia }), null);
  assert.equal(await buscarPrecioVisto({ ...fila, email: '' }, { ...deps, fetch: espia }), null);
  assert.equal(llamado, false);
});
