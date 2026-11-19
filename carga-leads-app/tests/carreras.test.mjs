import test from 'node:test';
import assert from 'node:assert/strict';
import { parsearCarreras } from '../generar-carreras.mjs';
import { patronProgramaHubSpot } from '../aux/adaptador-playwright.mjs';

test('corrige Desarrollo de Negocios Inmobiliarios y coincide con HubSpot', () => {
  const [carrera] = parsearCarreras('## Licenciatura en Desarrollos de Negocios Inmobiliarios\n\n- **Nivel local:** Grado\n');
  const nombre = 'Licenciatura en Desarrollo de Negocios Inmobiliarios';
  assert.deepEqual(carrera, { nombre, nivel: 'Grado' });
  assert.match(nombre, patronProgramaHubSpot(carrera.nombre));
});

const fragmento = `## Abogacía

- **Grado académico:** Grado
- **Nivel local:** Grado

## Tecnicatura en Redes Informáticas y Telecomunicaciones

- **Grado académico:** Pregrado
- **Nivel local:** Pregrado
`;

test('extrae nombre y nivel de cada carrera', () => {
  assert.deepEqual(parsearCarreras(fragmento), [
    { nombre: 'Abogacía', nivel: 'Grado' },
    { nombre: 'Tecnicatura en Redes Informáticas y Telecomunicaciones', nivel: 'Pregrado' },
  ]);
});

test('un nivel local con aclaración sigue siendo Grado o Pregrado', () => {
  const texto = '## Licenciatura en Educación (CCC)\n\n- **Nivel local:** Grado (CCC)\n';
  assert.deepEqual(parsearCarreras(texto), [{ nombre: 'Licenciatura en Educación (CCC)', nivel: 'Grado' }]);
});

test('descarta carreras sin nivel reconocible', () => {
  const texto = '## Sin nivel\n\n- **Nivel local:** No informado\n';
  assert.deepEqual(parsearCarreras(texto), []);
});
