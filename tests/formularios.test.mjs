import test from 'node:test';
import assert from 'node:assert/strict';

import { CAMPOS, CASAS, camposDe, casaDeCarrera, columnaDe } from '../components/formularios/casas.ts';
import { esCarreraVisible } from '../components/index/types.ts';

// La oferta que el sitio publica hoy, segun getCategoryForCarrera().
const NIVELES_DE_LA_OFERTA = [
  'Grado', 'Grado (CCC)', 'Pregrado', 'Identidad Argentina',
  'Teclab - Tecnología', 'Teclab - Curso', 'Teclab - Gestión',
];

test('cada campo declara la columna real de la tabla', () => {
  // Las dos que rompieron produccion el 23/08: la tabla las llama asi.
  assert.equal(columnaDe('lugarNacimiento'), 'localidad_nacimiento');
  assert.equal(columnaDe('domicilio'), 'direccion');
});

test('ningun campo comparte columna con otro', () => {
  const columnas = Object.values(CAMPOS).map(campo => campo.columna);
  assert.equal(new Set(columnas).size, columnas.length);
});

test('la casa sale del nivel de la carrera', () => {
  assert.equal(casaDeCarrera({ nivel: 'Grado' }), 'siglo21');
  assert.equal(casaDeCarrera({ nivel: 'Grado (CCC)' }), 'siglo21');
  assert.equal(casaDeCarrera({ nivel: 'Pregrado' }), 'siglo21');
  assert.equal(casaDeCarrera({ nivel: 'Teclab - Tecnología' }), 'teclab');
  assert.equal(casaDeCarrera({ nivel: 'Teclab - Gestión' }), 'teclab');
  assert.equal(casaDeCarrera({ nivel: 'Teclab - Curso' }), 'teclab');
  assert.equal(casaDeCarrera({ nivel: 'Identidad Argentina' }), 'identidad');
});

test('una carrera fuera de la oferta no tiene casa', () => {
  // Posgrado y Certificacion no se dictan: `esCarreraVisible` ya las filtra.
  assert.equal(casaDeCarrera({ nivel: 'Posgrado' }), null);
  assert.equal(casaDeCarrera(null), null);
});

test('Identidad no pide legajo: no hay requisitos de ingreso', () => {
  const campos = camposDe('identidad', 'preinscripcion');
  for (const ausente of ['colegio', 'nivelEstudios', 'estadoCivil', 'domicilio', 'medioPago']) {
    assert.ok(!campos.includes(ausente), `identidad no deberia pedir ${ausente}`);
  }
  assert.ok(campos.includes('dni'));
  assert.ok(campos.includes('localidad'));
});

test('las equivalencias son solo de Siglo 21', () => {
  assert.ok(camposDe('siglo21', 'contacto').includes('equivalencias'));
  assert.ok(!camposDe('teclab', 'contacto').includes('equivalencias'));
  assert.ok(!camposDe('identidad', 'contacto').includes('equivalencias'));
});

test('el contacto es corto en las tres casas', () => {
  for (const casa of ['siglo21', 'teclab', 'identidad']) {
    assert.ok(camposDe(casa, 'contacto').length <= 8, `el contacto de ${casa} se hizo largo`);
  }
});

test('todo campo declarado por una casa existe en el registro', () => {
  for (const casa of ['siglo21', 'teclab', 'identidad']) {
    for (const modo of ['contacto', 'preinscripcion']) {
      for (const campo of camposDe(casa, modo)) {
        assert.ok(CAMPOS[campo], `${casa}.${modo} declara un campo inexistente: ${campo}`);
      }
    }
  }
});

test('las casas cubren toda la oferta visible, y nada mas', () => {
  // Si manana entra un nivel nuevo a la taxonomia, este test avisa: sin casa,
  // esa carrera no podria preinscribirse desde ningun formulario.
  const declarados = Object.values(CASAS).flatMap(casa => casa.niveles);
  for (const nivel of declarados) {
    assert.ok(esCarreraVisible({ nivel }), `${nivel} no es parte de la oferta visible`);
  }
  for (const nivel of NIVELES_DE_LA_OFERTA) {
    assert.ok(declarados.includes(nivel), `ninguna casa reclama el nivel ${nivel}`);
  }
});
