import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { bloquesDe, ROTULO_GRUPO } from '../components/formularios/bloques.ts';
import { camposDe, CAMPOS } from '../components/formularios/casas.ts';

const grupoDe = id => CAMPOS[id].grupo;

test('la preinscripcion de Teclab se parte en Tus datos, Domicilio y Estudios', () => {
  const campos = camposDe('teclab', 'preinscripcion').filter(id => id !== 'email' && id !== 'telefono');
  const bloques = bloquesDe(campos, grupoDe);
  assert.deepEqual(bloques.map(b => ROTULO_GRUPO[b.grupo]), ['Tus datos', 'Domicilio', 'Estudios']);
  assert.deepEqual(bloques.flatMap(b => b.campos), campos);
});

test('un grupo que se repite separado arma dos bloques, sin reordenar campos', () => {
  const bloques = bloquesDe(['nombre', 'domicilio', 'apellido'], grupoDe);
  assert.deepEqual(bloques.map(b => b.grupo), ['personales', 'domicilio', 'personales']);
});

test('sin campos no hay bloques', () => {
  assert.deepEqual(bloquesDe([], grupoDe), []);
});

test('las columnas de la preinscripcion sólo se cortan entre bloques y cada bloque lleva su rótulo', async () => {
  const fuente = await readFile(new URL('../components/formularios/formulario-lead.tsx', import.meta.url), 'utf8');
  assert.match(fuente, /bloquesDe\(campos, grupoDe\)/);
  assert.match(fuente, /ROTULO_GRUPO\[bloque\.grupo\]/);
  assert.match(fuente, /ROTULO_GRUPO\.contacto/);
});
