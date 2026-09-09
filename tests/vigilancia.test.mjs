import test from 'node:test';
import assert from 'node:assert/strict';
import { interpretarCalidad } from '../herramientas/vigilancia.mjs';

// El aviso llega al telefono: tiene que decir que se rompio, no la cola del log
// de la ultima revision, que casi nunca es la que fallo.
test('el aviso de calidad nombra en castellano lo que fallo', () => {
  const veredicto = interpretarCalidad([
    'Verificando SEO de páginas...',
    'SEO de páginas: ok. Log: /logs/1.log',
    'integraciones: fallo. Log: /logs/2.log',
    'Chromium: fallo. Log: /logs/3.log',
    'firefox: no-verificado. Log: /logs/4.log',
    'webkit: ok. Log: /logs/5.log',
  ].join('\n'));

  assert.equal(veredicto.estado, 'problema');
  assert.match(veredicto.resumen, /Fallo las integraciones y la revision en Chromium/);
  assert.match(veredicto.resumen, /No se pudo verificar la revision en Firefox/);
  assert.match(veredicto.resumen, /El resto paso bien: el SEO de las paginas y la revision en WebKit/);
  // Ni rutas de archivos ni nombres de comandos en el mensaje.
  assert.doesNotMatch(veredicto.resumen, /\.log|npm run/);
});

test('sin fallas no hay aviso, y una fuente caida no es un aprobado', () => {
  const todoBien = interpretarCalidad('Chromium: ok. Log: /logs/1.log\nwebkit: ok. Log: /logs/2.log');
  assert.equal(todoBien.estado, 'ok');
  assert.match(todoBien.resumen, /Pasaron las 2 revisiones/);

  // Codigo 2 es "no se pudo mirar". No enciende la alarma, pero tampoco dice ok.
  const sinFuente = interpretarCalidad('integraciones: no-verificado. Log: /logs/1.log');
  assert.equal(sinFuente.estado, 'indeterminado');
  assert.match(sinFuente.resumen, /No se pudo verificar las integraciones/);
});

test('una corrida que no llego a informar nada queda indeterminada', () => {
  const veredicto = interpretarCalidad('node: command not found');
  assert.equal(veredicto.estado, 'indeterminado');
  assert.match(veredicto.resumen, /no llego a informar/);
});
