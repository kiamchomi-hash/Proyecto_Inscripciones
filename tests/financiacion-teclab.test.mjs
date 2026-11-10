import test from 'node:test';
import assert from 'node:assert/strict';
import { financiacionGeneral } from '../components/formularios/financiacion-teclab.ts';

// Lo que muestra la placa «Opciones de financiación» del período 1A (vigente
// desde el 02/11/2026): Naranja X tiene 6 cuotas sin interés y Plan Z; Visa y
// Mastercard de Santander, Galicia, BBVA, Nación y Macro tienen la tasa
// preferencial; Sucrédito sólo 3 cuotas; AMEX de Galicia, Patagonia, Macro y
// Reba, sólo 1 pago.
test('la financiación general es la de la placa vigente y muestra el CFT junto al interés', () => {
  const lineas = financiacionGeneral();
  assert.ok(lineas.length >= 4 && lineas.length <= 6, `${lineas.length} líneas`);
  const texto = lineas.map(l => `${l.medio}: ${l.detalle}`).join('\n');
  assert.match(texto, /1 pago sin recargo/);
  assert.match(texto, /3 cuotas: 5,07% de interés, CFT 34,73%/);
  assert.match(texto, /6 cuotas: 10,23% de interés, CFT 40,20%/);
  assert.match(texto, /3 cuotas: 7,41% de interés, CFT 53,95%/);
  assert.match(texto, /6 cuotas: 12,99% de interés, CFT 52,96%/);
  assert.doesNotMatch(texto, /GoCuotas|WiBond|No hay cuotas sin interés|[·—]/);

  const linea = patron => lineas.find(l => patron.test(`${l.medio}: ${l.detalle}`));
  const preferencial = linea(/34,73%/);
  for (const banco of ['Galicia', 'Nación', 'Santander', 'Macro', 'BBVA']) assert.match(preferencial.detalle, new RegExp(banco));
  assert.doesNotMatch(preferencial.detalle, /Patagonia|Supervielle/);

  const naranja = linea(/Naranja X/);
  assert.match(naranja.detalle, /6 cuotas sin interés/);
  assert.match(naranja.detalle, /Plan Z/);
  // «sin interés» sólo en la línea de Naranja X.
  for (const otra of lineas.filter(l => l !== naranja)) assert.doesNotMatch(otra.detalle, /sin interés/);

  const sucredito = linea(/Sucrédito: 3 cuotas/);
  assert.ok(sucredito, 'Sucrédito tiene su propia línea con 3 cuotas');
  assert.match(sucredito.detalle, /7,41% de interés, CFT 53,95%/);
  assert.doesNotMatch(sucredito.detalle, /6 cuotas/);

  const unPago = linea(/Sólo 1 pago/);
  for (const banco of ['Galicia', 'Patagonia', 'Macro', 'Reba']) assert.match(unPago.detalle, new RegExp(banco));
  assert.match(unPago.detalle, /American Express/);

  // Cada interés informado va con su CFT al lado.
  for (const l of lineas) {
    for (const tramo of l.detalle.split(';')) {
      if (/% de interés/.test(tramo)) assert.match(tramo, /CFT/);
    }
  }
});
