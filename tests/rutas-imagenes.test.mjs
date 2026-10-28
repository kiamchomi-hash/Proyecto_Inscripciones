import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeImagePath } from '../lib/imagenes/rutas.ts';

test('conserva las URL externas y codifica las rutas locales', () => {
  const externa = 'https://images.unsplash.com/foto?w=1000&q=80';
  assert.equal(encodeImagePath(externa), externa);
  assert.equal(encodeImagePath('/imagenes/Foto de matemática.webp'), '/imagenes/Foto%20de%20matem%C3%A1tica.webp');
});
