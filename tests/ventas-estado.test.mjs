import test from 'node:test';
import assert from 'node:assert/strict';
import { estadoActualizacion2027, normalizarActualizacion2027, promocionVencida } from '../lib/ventas-estado.ts';
const ahora = new Date('2026-10-15T15:00:00Z');
const estado = (resultado, fecha = '2026-10-15T12:00:00Z') => ({ version: 1, periodo: '1A', ultimoIntento: { estado: resultado, fecha }, ultimoExito: resultado === 'completa' ? fecha : null });
test('HTML legado nunca equivale a precios verificados', () => {
  assert.equal(estadoActualizacion2027(null, ahora).nivel, 'advertencia');
});
test('fallo diario se distingue de promoción vencida y publicación reciente', () => {
  assert.match(estadoActualizacion2027(estado('incompleta'), ahora).titulo, /incompleta/);
  assert.match(estadoActualizacion2027(estado('en_curso'), ahora).titulo, /sin completar/);
});
test('sólo éxito completo del día argentino queda verde', () => {
  assert.equal(estadoActualizacion2027(estado('completa'), ahora).nivel, 'ok');
  assert.match(estadoActualizacion2027(estado('completa', '2026-10-15T02:00:00Z'), ahora).titulo, /pendiente/);
  assert.equal(estadoActualizacion2027(estado('completa', '2026-10-16T12:00:00Z'), ahora).nivel, 'advertencia');
  assert.equal(estadoActualizacion2027({ ...estado('completa'), ultimoExito: null }, ahora).nivel, 'advertencia');
});

test('vencimiento comercial se evalúa aparte y al abrir en hora argentina', () => {
  assert.equal(promocionVencida('14/10/2026', ahora), true);
  assert.equal(promocionVencida('15/10/2026', ahora), false);
  assert.equal(promocionVencida('14/10/2026', new Date('2026-10-15T02:59:00Z')), false);
  assert.equal(normalizarActualizacion2027({version:1, ultimoIntento:{estado:'completa', fecha:'inválida'}, ultimoExito:null}), null);
});

test('snapshot remoto toma estado del HTML aunque el JSON lateral sea legado, contradictorio o inválido', async () => {
  const { cargarTypescript } = await import('./helpers/cargar-typescript.mjs');
  const funcionesEstado = await import('../lib/ventas-estado.ts');
  const incompleta = estado('incompleta');
  const html = '<!doctype html><html><script id="datos" type="application/json">' + JSON.stringify({ carreras:[{nombre:'Prueba'}], actualizacion2027: incompleta }) + '</script></html>';
  for (const lateral of ['{}', JSON.stringify({actualizacion2027:estado('completa')}), 'inválido']) {
    const snapshot = cargarTypescript('lib/ventas-snapshot.ts', {
      'server-only': {}, 'node:path': {default: (await import('node:path')).default}, '@/lib/ventas-estado': funcionesEstado,
      '@/lib/supabase-admin': { createSupabaseAdmin: () => ({storage:{from:() => ({download: async nombre => ({data: new Blob([nombre.endsWith('.html') ? html : lateral]),error:null})})}}) },
    });
    const resultado = await snapshot.leerVentasSnapshot();
    assert.equal(resultado.source, 'supabase');
    assert.equal(resultado.meta.actualizacion2027.ultimoIntento.estado, 'incompleta');
    assert.equal(snapshot.validarSnapshot(html.replace(/,"actualizacion2027":[\s\S]*<\/script>/, '}</script>')).actualizacion2027, null);
  }
});

test('las advertencias informan referencias sin imponer verificación comercial', () => {
  assert.equal(estadoActualizacion2027(null, ahora).titulo, 'Precios de referencia');
  assert.equal(estadoActualizacion2027(estado('incompleta'), ahora).titulo, 'Actualización incompleta');
  for (const valor of [null, estado('incompleta'), estado('en_curso'), estado('completa', '2026-10-14T12:00:00Z')]) {
    assert.equal(estadoActualizacion2027(valor, ahora).detalle, 'Valores de referencia.');
  }
});
