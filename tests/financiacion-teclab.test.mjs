import test from 'node:test';
import assert from 'node:assert/strict';
import { financiacionGeneral } from '../components/formularios/financiacion-teclab.ts';

test('la financiación general es corta y muestra el CFT junto al interés', () => {
  const lineas = financiacionGeneral();
  assert.ok(lineas.length >= 4 && lineas.length <= 5);
  const texto = lineas.map(l => `${l.medio}: ${l.detalle}`).join('\n');
  assert.match(texto, /6,15% de interés, CFT 43,34%/);
  assert.match(texto, /7,41% de interés, CFT 53,95%/);
  assert.match(texto, /Naranja X/);
  assert.match(texto, /GoCuotas/);
  assert.match(texto, /WiBond/);
  assert.match(texto, /American Express/);
  // Cada interés informado va con su CFT al lado.
  for (const linea of lineas) {
    if (/% de interés/.test(linea.detalle)) assert.match(linea.detalle, /CFT/);
  }
});
