import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, createHmac } from 'node:crypto';
import { emitirPase, verificarPase, VIGENCIA_PASE_MS } from '../src/api/pase.ts';

// Secretos sintéticos: no hay claves reales en el repo ni en las pruebas.
const SECRETO = 'secreto-sintetico-de-prueba';
const DOMINIO = 'pase-autoinscripcion-v1';

/** El mismo pase calculado con node:crypto, como lo emite el sitio vigente. */
function paseVigente(email, carreraId, ahora) {
  const llave = createHmac('sha256', SECRETO).update(DOMINIO).digest();
  const sujeto = createHash('sha256').update(`${email.trim().toLowerCase()}:${carreraId}`).digest('base64url');
  const datos = Buffer.from(JSON.stringify({
    s: sujeto, iat: ahora, exp: ahora + VIGENCIA_PASE_MS,
  })).toString('base64url');
  return `${datos}.${createHmac('sha256', llave).update(datos).digest('base64url')}`;
}

test('emite y verifica el pase del mismo mail y la misma carrera', async () => {
  const ahora = Date.parse('2026-10-24T12:00:00.000Z');
  const pase = await emitirPase(SECRETO, 'Ana@Example.invalid', 7, ahora);
  assert.match(pase, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  assert.deepEqual(await verificarPase(SECRETO, pase, 'ana@example.invalid', 7, ahora), { iat: ahora });
  // El mail se normaliza igual que el sujeto: mayúsculas y espacios no importan.
  assert.deepEqual(await verificarPase(SECRETO, pase, '  ANA@example.invalid ', 7, ahora), { iat: ahora });
});

test('un pase emitido con node:crypto (sitio vigente) valida acá', async () => {
  const ahora = Date.parse('2026-10-24T12:00:00.000Z');
  const pase = paseVigente('ana@example.invalid', 7, ahora);
  assert.deepEqual(await verificarPase(SECRETO, pase, 'ana@example.invalid', 7, ahora), { iat: ahora });
  // Y el emitido acá tiene la misma forma: se puede verificar con la misma clave.
  const propio = await emitirPase(SECRETO, 'ana@example.invalid', 7, ahora);
  assert.deepEqual(await verificarPase(SECRETO, propio, 'ana@example.invalid', 7, ahora), { iat: ahora });
});

test('rechaza vencido, adulterado, de otro mail, de otra carrera y sin secreto', async () => {
  const ahora = Date.parse('2026-10-24T12:00:00.000Z');
  const pase = await emitirPase(SECRETO, 'ana@example.invalid', 7, ahora);
  const [datos, firma] = pase.split('.');

  // Vigencia: sobra hasta el último milisegundo e igualdad ya vence.
  assert.ok(await verificarPase(SECRETO, pase, 'ana@example.invalid', 7, ahora + VIGENCIA_PASE_MS - 1));
  assert.equal(await verificarPase(SECRETO, pase, 'ana@example.invalid', 7, ahora + VIGENCIA_PASE_MS), null);

  // Firma adulterada: un carácter distinto alcanza.
  const otraFirma = (firma[0] === 'A' ? 'B' : 'A') + firma.slice(1);
  assert.equal(await verificarPase(SECRETO, `${datos}.${otraFirma}`, 'ana@example.invalid', 7, ahora), null);
  assert.equal(await verificarPase(SECRETO, `${datos}.`, 'ana@example.invalid', 7, ahora), null);
  assert.equal(await verificarPase(SECRETO, `${datos}`, 'ana@example.invalid', 7, ahora), null);
  assert.equal(await verificarPase(SECRETO, `${datos}.a.b`, 'ana@example.invalid', 7, ahora), null);
  assert.equal(await verificarPase(SECRETO, `${datos}.***`, 'ana@example.invalid', 7, ahora), null);

  // Payload adulterado con la firma original.
  const contenido = JSON.parse(Buffer.from(datos, 'base64url').toString('utf8'));
  const cambiado = Buffer.from(JSON.stringify({ ...contenido, s: 'otro' })).toString('base64url');
  assert.equal(await verificarPase(SECRETO, `${cambiado}.${firma}`, 'ana@example.invalid', 7, ahora), null);

  // Otro mail u otra carrera.
  assert.equal(await verificarPase(SECRETO, pase, 'otra@example.invalid', 7, ahora), null);
  assert.equal(await verificarPase(SECRETO, pase, 'ana@example.invalid', 8, ahora), null);

  // Sin secreto no se emite ni se acepta nada; rotarlo invalida los pases viejos.
  assert.equal(await emitirPase(undefined, 'ana@example.invalid', 7, ahora), null);
  assert.equal(await verificarPase(undefined, pase, 'ana@example.invalid', 7, ahora), null);
  assert.equal(await verificarPase('otro-secreto', pase, 'ana@example.invalid', 7, ahora), null);
});

test('margen de reloj: 30 s adelante se acepta, 31 s no', async () => {
  const ahora = Date.parse('2026-10-24T12:00:00.000Z');
  // Un pase emitido por una instancia 30 s adelantada todavía sirve.
  const adelantado = await emitirPase(SECRETO, 'ana@example.invalid', 7, ahora + 30_000);
  assert.ok(await verificarPase(SECRETO, adelantado, 'ana@example.invalid', 7, ahora));
  const muyAdelantado = await emitirPase(SECRETO, 'ana@example.invalid', 7, ahora + 30_001);
  assert.equal(await verificarPase(SECRETO, muyAdelantado, 'ana@example.invalid', 7, ahora), null);
});
