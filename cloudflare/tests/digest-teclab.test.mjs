import test from 'node:test';
import assert from 'node:assert/strict';
import { crearD1 } from './helpers/d1.mjs';
import { construirDigestTeclab } from '../src/operativa/digest-teclab.ts';
import { enviarDigest } from '../src/operativa/digest.ts';

// El recorrido de Teclab llega una vez por día en el resumen de Telegram.
// Estas pruebas fijan el texto, que no salga vacío y que su falla no tumbe el
// resto del resumen.

const fila = (superficie, carrera, evento, paso, veces, movil = 1) => ({ superficie, carrera, evento, paso, movil, veces });

test('sin actividad no hay mensaje', () => {
  assert.equal(construirDigestTeclab('2026-11-23', []), null);
});

test('el mensaje resume cada superficie en el orden de la pantalla', () => {
  const texto = construirDigestTeclab('2026-11-23', [
    fila('modal', 'tecnicatura-en-redes', 'alcanzado', 'portada', 10),
    fila('modal', 'tecnicatura-en-redes', 'alcanzado', 'portada', 2, 0),
    fila('modal', 'tecnicatura-en-redes', 'alcanzado', 'precio', 3),
    fila('modal', 'tecnicatura-en-redes', 'alcanzado', 'plan', 7),
    fila('modal', 'tecnicatura-en-redes', 'cerrado', 'plan', 4),
    fila('modal', 'tecnicatura-en-redes', 'whatsapp', 'precio', 2),
    fila('ficha', 'tecnicatura-en-seguros', 'alcanzado', 'portada', 5),
    fila('ficha', 'tecnicatura-en-seguros', 'consulta', 'formulario', 1),
  ]);
  assert.equal(texto, [
    '🎯 *Recorrido de Teclab del 23/11/2026*',
    '',
    '*Modal de la home*: *12* aperturas (10 desde el celular)',
    'Llegaron: portada 12 › plan 7 › precio 3',
    'Se fueron sin escribir: plan 4',
    'WhatsApp: precio 2',
    '1. tecnicatura-en-redes — *12* (WhatsApp 2)',
    '',
    '*Ficha de la carrera*: *5* visitas (5 desde el celular)',
    'Llegaron: portada 5',
    'Consulta enviada: formulario 1',
    '1. tecnicatura-en-seguros — *5* (WhatsApp 0)',
  ].join('\n'));
});

test('lista sólo las tres carreras con más entradas', () => {
  const texto = construirDigestTeclab('2026-11-23', ['a', 'b', 'c', 'd'].map((c, i) =>
    fila('ficha', `carrera-${c}`, 'alcanzado', 'portada', 10 - i)));
  assert.match(texto, /3\. carrera-c/);
  assert.ok(!texto.includes('carrera-d'));
});

test('el resumen diario suma el mensaje de Teclab y sale igual si la tabla falla', async t => {
  const { db } = await crearD1(t);
  await db.prepare(`INSERT INTO teclab_embudo(fecha, superficie, carrera, evento, paso, movil, veces)
    VALUES ('2026-11-22', 'ficha', 'tecnicatura-en-redes', 'alcanzado', 'portada', 1, 3)`).run();

  const mensajes = [];
  const telegram = async texto => { mensajes.push(texto); return 'enviado'; };
  const conTeclab = await enviarDigest({ db, telegram, fecha: '2026-11-22' });
  assert.equal(conTeclab.teclab, true);
  assert.equal(mensajes.length, 2);
  assert.match(mensajes[1], /Recorrido de Teclab del 22\/11\/2026/);

  // Un día sin visitas medidas: sólo el resumen de siempre.
  mensajes.length = 0;
  const sinTeclab = await enviarDigest({ db, telegram, fecha: '2026-11-21' });
  assert.equal(sinTeclab.teclab, false);
  assert.equal(mensajes.length, 1);

  // Sin la tabla, el resumen de siempre sale igual.
  await db.prepare('DROP TABLE teclab_embudo').run();
  mensajes.length = 0;
  const caida = await enviarDigest({ db, telegram, fecha: '2026-11-22' });
  assert.equal(caida.teclab, false);
  assert.equal(caida.enviados, 1);
});
