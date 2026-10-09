import test from 'node:test';
import assert from 'node:assert/strict';

import { buildConsultaMessage, formatDate } from '../supabase/functions/notificar/mensajes.ts';
import { buildAperturasDirectasDigest } from '../lib/apertura-directa.ts';

const base = { created_at: '2026-08-23T22:00:00Z', nombre: 'Ana', apellido: 'Diaz', email: 'ana@x.com' };

test('el aviso dice de una si es preinscripcion y de que casa', () => {
  const pre = buildConsultaMessage({ ...base, casa: 'teclab', tipo_formulario: 'preinscripcion' });
  assert.ok(pre.startsWith('📝 *PREINSCRIPCIÓN — Teclab*'), pre.split('\n')[0]);

  const consulta = buildConsultaMessage({ ...base, casa: 'siglo21', tipo_formulario: 'contacto' });
  assert.ok(consulta.startsWith('💬 *Consulta — Siglo 21*'), consulta.split('\n')[0]);
});

test('«Ver precio» y la autoinscripción no llegan como consulta', () => {
  const precio = buildConsultaMessage({ ...base, casa: 'teclab', tipo_formulario: 'precio' });
  assert.ok(precio.startsWith('👀 *Vio el precio — Teclab*'), precio.split('\n')[0]);

  const auto = buildConsultaMessage({ ...base, casa: 'teclab', tipo_formulario: 'autoinscripcion' });
  assert.ok(auto.startsWith('✅ *AUTOINSCRIPCIÓN — Teclab*'), auto.split('\n')[0]);
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

test('el lead que ya vio el precio llega marcado, con la carrera y cuándo', () => {
  const fila = { ...base, casa: 'teclab', tipo_formulario: 'preinscripcion', carrera: 'Tecnicatura en Programación' };
  const precioVisto = { carrera: 'Tecnicatura en Programación', created_at: '2026-08-22T18:30:00Z' };
  const mensaje = buildConsultaMessage(fila, { precioVisto });
  const lineas = mensaje.split('\n');
  assert.equal(lineas[0], '🔥 *YA VIO EL PRECIO*');
  // La cabecera de siempre sigue ahí, abajo de la marca.
  assert.equal(lineas[1], '📝 *PREINSCRIPCIÓN — Teclab*');
  assert.ok(lineas.includes(`👀 *Vio el precio:* Tecnicatura en Programación el ${formatDate(precioVisto.created_at)}`), mensaje);
});

test('sin precio visto el aviso sale idéntico al de siempre', () => {
  const fila = { ...base, casa: 'siglo21', tipo_formulario: 'contacto', carrera: 'Abogacía' };
  const deSiempre = buildConsultaMessage(fila);
  assert.equal(buildConsultaMessage(fila, { precioVisto: null }), deSiempre);
  assert.equal(buildConsultaMessage(fila, {}), deSiempre);
  assert.ok(!deSiempre.includes('YA VIO EL PRECIO'));
  assert.ok(!deSiempre.includes('*Vio el precio:*'));
});

test('el aviso de aperturas directas agrupa y cuenta por carrera', () => {
  const mensaje = buildAperturasDirectasDigest('2026-09-01', [
    { carrera: 'Licenciatura en Administración', clicks: 3 },
    { carrera: 'Abogacía', clicks: 1 },
  ]);
  assert.match(mensaje, /Aperturas directas del 01\/09\/2026/);
  assert.match(mensaje, /Licenciatura en Administración/);
  assert.match(mensaje, /\*3\*/);
  assert.match(mensaje, /\*4\* aperturas directas en \*2\* carreras/);
  assert.doesNotMatch(mensaje, /URL/);
});

test('los avisos usan singular cuando corresponde', () => {
  const mensaje = buildAperturasDirectasDigest('2026-09-01', [
    { carrera: 'Abogacía', clicks: 1 },
  ]);
  assert.match(mensaje, /\*1\* apertura directa en \*1\* carrera/);
  assert.doesNotMatch(mensaje, /aperturas directas/);
  assert.doesNotMatch(mensaje, /carreras/);
});
