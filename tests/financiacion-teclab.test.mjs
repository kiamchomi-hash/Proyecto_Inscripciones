import test from 'node:test';
import assert from 'node:assert/strict';
import { financiacionGeneral } from '../components/formularios/financiacion-teclab.ts';

// Lo que muestra el Simulador de Precios del Portal Administrativo, relevado
// en vivo el 16/10/2026: no hay cuotas sin interés con ninguna tarjeta.
test('la financiación general es la del simulador del portal y muestra el CFT junto al interés', () => {
  const lineas = financiacionGeneral();
  assert.ok(lineas.length >= 4 && lineas.length <= 5);
  const texto = lineas.map(l => `${l.medio}: ${l.detalle}`).join('\n');
  assert.match(texto, /1 pago sin recargo/);
  assert.match(texto, /3 cuotas: 6,15% de interés, CFT 43,34%/);
  assert.match(texto, /6 cuotas: 12,48% de interés, CFT 50,54%/);
  assert.match(texto, /3 cuotas: 7,41% de interés, CFT 53,95%/);
  assert.match(texto, /6 cuotas: 12,99% de interés, CFT 52,96%/);
  assert.match(texto, /Patagonia/);
  assert.match(texto, /BBVA/);
  assert.match(texto, /Naranja X/);
  assert.match(texto, /American Express/);
  assert.doesNotMatch(texto, /sin interés|Plan Z|GoCuotas|WiBond/);
  // Cada interés informado va con su CFT al lado.
  for (const linea of lineas) {
    for (const tramo of linea.detalle.split(';')) {
      if (/% de interés/.test(tramo)) assert.match(tramo, /CFT/);
    }
  }
});
