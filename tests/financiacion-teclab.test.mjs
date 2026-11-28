import test from 'node:test';
import assert from 'node:assert/strict';
import { financiacionGeneral, rangoSeisCuotas } from '../components/formularios/financiacion-teclab.ts';

// El rango de las 6 cuotas: Naranja X sin interés abajo, otros bancos con
// 12,99% arriba. Con el total del simulador da su misma cuota (116.113,57).
test('el rango de 6 cuotas va de sin interés al interés más alto, con el CFT', () => {
  assert.deepEqual(rangoSeisCuotas('$ 616.586,78'), { desde: '$ 102.764', hasta: '$ 116.114', cftMaximo: '52,96%' });
  assert.deepEqual(rangoSeisCuotas('$ 1.007.500,00'), { desde: '$ 167.917', hasta: '$ 189.729', cftMaximo: '52,96%' });
  assert.equal(rangoSeisCuotas(''), null);
  assert.equal(rangoSeisCuotas('a confirmar'), null);
  assert.equal(rangoSeisCuotas('a confirmar 2026'), null);
  assert.equal(rangoSeisCuotas('-$ 1.000,00'), null);
  assert.equal(rangoSeisCuotas('$ 0,00'), null);
  assert.deepEqual(rangoSeisCuotas('$ 600.000'), { desde: '$ 100.000', hasta: '$ 112.990', cftMaximo: '52,96%' });
});

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
