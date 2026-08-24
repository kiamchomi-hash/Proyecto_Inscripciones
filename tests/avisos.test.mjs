import test from 'node:test';
import assert from 'node:assert/strict';

import { buildConsultaMessage } from '../supabase/functions/notificar/mensajes.ts';

const base = { created_at: '2026-08-23T22:00:00Z', nombre: 'Ana', apellido: 'Diaz', email: 'ana@x.com' };

test('el aviso dice de una si es preinscripcion y de que casa', () => {
  const pre = buildConsultaMessage({ ...base, casa: 'teclab', tipo_formulario: 'preinscripcion' });
  assert.ok(pre.startsWith('📝 *PREINSCRIPCIÓN — Teclab*'), pre.split('\n')[0]);

  const consulta = buildConsultaMessage({ ...base, casa: 'siglo21', tipo_formulario: 'contacto' });
  assert.ok(consulta.startsWith('💬 *Consulta — Siglo 21*'), consulta.split('\n')[0]);
});

test('las filas viejas, sin casa, conservan el titulo de siempre', () => {
  // Anteriores al 23/08/2026: no sabemos de que casa vinieron y no se inventa.
  const viejo = buildConsultaMessage(base);
  assert.ok(viejo.startsWith('📚 *Nueva consulta de carrera*'));
});

test('el legajo se arma con lo que trajo la fila, no con una lista fija', () => {
  const mensaje = buildConsultaMessage({
    ...base, casa: 'siglo21', tipo_formulario: 'preinscripcion',
    dni: '30111222', barrio: 'Lugano', torre: 'B',
    // Una columna que hoy no existe: el aviso tiene que mostrarla igual, en vez
    // de tragarsela por no estar en una lista.
    columna_futura: 'un dato nuevo',
  });
  assert.match(mensaje, /🪪 \*Documento:\* 30111222/);
  assert.match(mensaje, /📍 \*Barrio:\* Lugano/);
  assert.match(mensaje, /🏢 \*Torre:\* B/);
  assert.match(mensaje, /\*columna_futura:\* un dato nuevo/);
});

test('lo vacio no ensucia el aviso', () => {
  const mensaje = buildConsultaMessage({ ...base, casa: 'siglo21', tipo_formulario: 'contacto', dni: null, torre: '' });
  assert.ok(!mensaje.includes('Documento'));
  assert.ok(!mensaje.includes('Torre'));
  // Un contacto pelado no trae seccion de legajo.
  assert.ok(!mensaje.includes('Datos del legajo'));
});
