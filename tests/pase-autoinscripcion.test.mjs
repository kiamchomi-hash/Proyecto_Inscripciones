import test from 'node:test';
import assert from 'node:assert/strict';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

const { emitirPase, verificarPase, VIGENCIA_PASE_MS } = cargarTypescript('lib/pase-autoinscripcion.ts', { 'server-only': {} });

function conSecreto(t, secreto) {
  const anterior = process.env.TURNSTILE_SECRET_KEY;
  t.after(() => {
    if (anterior === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = anterior;
  });
  if (secreto === undefined) delete process.env.TURNSTILE_SECRET_KEY;
  else process.env.TURNSTILE_SECRET_KEY = secreto;
}

const AHORA = Date.UTC(2026, 9, 4, 12);

test('el pase vale para el mismo mail (sin importar mayúsculas) y la misma carrera', t => {
  conSecreto(t, 'secreto-de-prueba');
  const pase = emitirPase('Ana@Example.test', 7, AHORA);
  assert.equal(typeof pase, 'string');
  assert.equal(pase.includes('ana@example.test'), false, 'el mail no viaja a la vista');
  assert.deepEqual(verificarPase(pase, 'ana@example.test', 7, AHORA + 1000), { iat: AHORA });
  assert.deepEqual(verificarPase(pase, ' ANA@example.test ', 7, AHORA), { iat: AHORA });
});

test('el pase no vale para otra persona, otra carrera ni vencido', t => {
  conSecreto(t, 'secreto-de-prueba');
  const pase = emitirPase('ana@example.test', 7, AHORA);
  assert.equal(verificarPase(pase, 'otra@example.test', 7, AHORA), null, 'otro mail');
  assert.equal(verificarPase(pase, 'ana@example.test', 8, AHORA), null, 'otra carrera');
  assert.equal(verificarPase(pase, 'ana@example.test', 7, AHORA + VIGENCIA_PASE_MS), null, 'vencido');
  assert.ok(verificarPase(pase, 'ana@example.test', 7, AHORA + VIGENCIA_PASE_MS - 1), 'al borde todavía vale');
  assert.equal(verificarPase(pase, 'ana@example.test', 7, AHORA - 5 * 60 * 1000), null, 'emitido en el futuro');
});

test('un pase adulterado o mal formado se rechaza', t => {
  conSecreto(t, 'secreto-de-prueba');
  const pase = emitirPase('ana@example.test', 7, AHORA);
  const [datos, firma] = pase.split('.');
  const otraFirma = `${firma.slice(0, -2)}${firma.endsWith('AA') ? 'BB' : 'AA'}`;
  assert.equal(verificarPase(`${datos}.${otraFirma}`, 'ana@example.test', 7, AHORA), null, 'firma cambiada');

  // Estirar el vencimiento sin la clave rompe la firma.
  const contenido = JSON.parse(Buffer.from(datos, 'base64url').toString('utf8'));
  const estirado = Buffer.from(JSON.stringify({ ...contenido, exp: contenido.exp + 3_600_000 })).toString('base64url');
  assert.equal(verificarPase(`${estirado}.${firma}`, 'ana@example.test', 7, AHORA), null, 'vencimiento estirado');

  for (const malo of ['', 'x', 'a.b.c', `${datos}.`, `.${firma}`, `${datos}.${firma}.x`, null, 42]) {
    assert.equal(verificarPase(malo, 'ana@example.test', 7, AHORA), null, String(malo));
  }
});

test('sin TURNSTILE_SECRET_KEY no se emite ni se acepta ningún pase', t => {
  conSecreto(t, 'secreto-de-prueba');
  const pase = emitirPase('ana@example.test', 7, AHORA);
  process.env.TURNSTILE_SECRET_KEY = 'otro-secreto';
  assert.equal(verificarPase(pase, 'ana@example.test', 7, AHORA), null, 'rotar la clave invalida los pases');
  delete process.env.TURNSTILE_SECRET_KEY;
  assert.equal(emitirPase('ana@example.test', 7, AHORA), null);
  assert.equal(verificarPase(pase, 'ana@example.test', 7, AHORA), null);
});
