import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { RESOLUCIONES_TECLAB, getResolucionesTeclab } from '../components/index/resoluciones-teclab.ts';

const BASE_COMERCIAL = new URL('../carreras/teclab/resoluciones-teclab.json', import.meta.url);

// La base comercial (carreras/) no está en el repo. Cuando el JSON está en el
// disco, el test lo compara; en CI se saltea.
const normalizar = (valor) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

test('cada tecnicatura trae al menos el dictamen y el número arranca el texto', () => {
  assert.ok(RESOLUCIONES_TECLAB.length >= 20);
  for (const { match, resoluciones } of RESOLUCIONES_TECLAB) {
    assert.ok(
      resoluciones.plan || resoluciones.dictamen,
      `${match} no tiene ni plan ni dictamen`,
    );
    for (const valor of [resoluciones.plan, resoluciones.dictamen, resoluciones.validez]) {
      if (valor === undefined) continue;
      assert.match(valor, /^\d+\/\d{2} /, `${match}: «${valor}» no empieza con el número`);
    }
  }
});

test('encuentra la carrera con el nombre de D1 y no inventa en las que no corresponde', () => {
  const programacion = getResolucionesTeclab({ nombre: 'Tecnicatura Superior en Programación' });
  assert.equal(programacion?.plan, '2127/22 del Ministerio de Educación de la Ciudad de Buenos Aires');
  assert.equal(programacion?.validez, '2029/22 del Ministerio de Educación de la Nación');

  // El nombre comercial está en `nombre_corto`.
  const qa = getResolucionesTeclab({ nombre: 'Tecnicatura en Calidad de Software', nombre_corto: 'Quality Assurance' });
  assert.equal(qa?.plan, '1184/23 del Ministerio de Educación de la Ciudad de Buenos Aires');

  // Anunciadas y cursos no llevan resoluciones.
  assert.equal(getResolucionesTeclab({ nombre: 'Tecnicatura Superior en Gestión de Inteligencia Artificial y Transformación Digital' }), null);
  assert.equal(getResolucionesTeclab({ nombre: 'Curso de Introducción a la Inteligencia Artificial' }), null);
});

test('la copia del sitio coincide con la base comercial', { skip: !existsSync(BASE_COMERCIAL) && 'sin carreras/ en el disco' }, () => {
  const base = JSON.parse(readFileSync(BASE_COMERCIAL, 'utf8')).carreras;
  // El JSON nombra «QA» a Quality Assurance; el resto coincide palabra por palabra.
  const alias = { QA: 'Quality Assurance' };

  for (const [clave, datos] of Object.entries(base)) {
    const nombre = alias[clave] ?? clave;
    const propia = RESOLUCIONES_TECLAB.find(r => normalizar(nombre).includes(normalizar(r.match)))?.resoluciones;
    assert.ok(propia, `la ficha ${clave} no está en components/index/resoluciones-teclab.ts`);

    for (const campo of ['plan', 'dictamen', 'validez']) {
      if (!datos[campo]) {
        assert.equal(propia[campo], undefined, `${clave}: el sitio agrega ${campo} que Teclab no publica`);
        continue;
      }
      assert.ok(propia[campo], `${clave}: falta ${campo}`);
      // Se compara el número y el organismo, sin depender de la mayúscula inicial.
      assert.equal(normalizar(propia[campo]), normalizar(datos[campo]), `${clave}: ${campo} distinto`);
    }
  }
});
