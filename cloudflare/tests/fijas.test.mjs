import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { opcionesVocacional, opcionesVocacionalTeclab } from '../src/datos/vocacional.ts';
import { bibliotecaImagenes } from '../src/datos/imagenes.ts';
import { crearD1, insertarCarrera } from './helpers/d1.mjs';

test('tests vocacionales proyectan sólo oferta activa y conservan próximas y orden', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { orden: 1 });
  await insertarCarrera(db, 2, { nivel: 'Identidad Argentina', orden: 2 });
  await insertarCarrera(db, 3, { nivel: 'Posgrado', orden: 3 });
  await insertarCarrera(db, 4, { activa: 0 });
  await insertarCarrera(db, 5, { nivel: 'Teclab - Tecnología', orden: 5, proximamente: 1 });
  await insertarCarrera(db, 6, { nivel: 'Teclab - Gestión', orden: null });
  await insertarCarrera(db, 7, { nivel: 'Teclab - Curso', orden: 7 });
  const general = await opcionesVocacional(db);
  assert.deepEqual(general.map(c => c.id), [1, 5, 7, 6]);
  assert.deepEqual(Object.keys(general[0]).sort(), ['id', 'nombre', 'nivel', 'prefix', 'orden'].sort());
  const teclab = await opcionesVocacionalTeclab(db);
  assert.deepEqual(teclab.map(c => c.id), [5, 6]);
  assert.equal(teclab[0].proximamente, true);
  assert.equal(teclab[1].orden, Number.MAX_SAFE_INTEGER);
  assert.deepEqual(Object.keys(teclab[0]).sort(), ['id', 'nombre', 'nombre_corto', 'prefix', 'nivel', 'orden', 'proximamente'].sort());
});

test('biblioteca cruza sólo carreras visibles y calcula faltantes de Siglo 21', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nombre: 'Administración', prefix: 'Licenciatura en', nivel: 'Grado' });
  await insertarCarrera(db, 2, { nombre: 'Derecho', prefix: null, nivel: 'Grado' });
  await insertarCarrera(db, 3, { nombre: 'Privada', nivel: 'Posgrado' });
  await insertarCarrera(db, 4, { nombre: 'Teclab', nivel: 'Teclab - Tecnología' });
  const datos = await bibliotecaImagenes(db, [{ ruta: '/imagenes/imagenes_carreras/licenciatura-en-administracion.webp',
    carpeta: 'imagenes_carreras', subcarpeta: null, bytes: 1250 }]);
  assert.equal(datos.imagenes[0].carrera, 'Licenciatura en Administración');
  assert.deepEqual(datos.sinFoto, ['Derecho']);
});

test('Next de pruebas rechaza dotenv y red externa sin leer ni enviar nada', () => {
  const preload = fileURLToPath(new URL('./helpers/aislar-next.cjs', import.meta.url));
  const resultado = spawnSync(process.execPath, ['--require', preload, '-e', `
    const assert = require('node:assert/strict');
    assert.throws(() => require('node:fs').readFileSync('.env.local'), {code:'ENOENT'});
    assert.throws(() => require('node:net').connect({host:'example.invalid',port:443}), /Red externa/);
    assert.throws(() => fetch('https://example.invalid'), /Red externa/);
  `], { encoding: 'utf8', env: { PATH: process.env.PATH } });
  assert.equal(resultado.status, 0, resultado.stderr);
});
