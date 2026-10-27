import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { crearD1, insertarCarrera } from './helpers/d1.mjs';
import { carrerasPublicas, carreraPorSlug } from '../src/datos/carreras.ts';
import { redirectCarrera } from '../src/entrega/redirects-carreras.ts';
import nextConfig from '../../next.config.ts';

test('redirects de fichas conservan todos los destinos y códigos de Next, sin ampliar a otras familias', async () => {
  const reglas = (await nextConfig.redirects()).filter(r => r.source.startsWith('/carreras/'));
  assert.ok(reglas.length > 15);
  for (const r of reglas) {
    const esperado = {destino:r.destination, status:r.statusCode ?? (r.permanent ? 308 : 307)};
    const slug = r.source.replace('/carreras/', '');
    assert.deepEqual(redirectCarrera(slug), esperado);
    assert.deepEqual(redirectCarrera(slug.toUpperCase()), esperado);
  }
  assert.equal(redirectCarrera('inexistente'), null);
});

test('fichas: proyección explícita, taxonomía, slug viejo y validación de slides', async t => {
  const { db } = await crearD1(t);
  await insertarCarrera(db, 1, { nombre: 'Administración', prefix: 'Licenciatura en', descuento_especial: '"PRIVADO"' });
  await insertarCarrera(db, 2, { nivel: 'Posgrado' });
  await insertarCarrera(db, 3, { activa: 0 });
  await insertarCarrera(db, 4, { nivel: 'Identidad Argentina' });
  const filas = await carrerasPublicas(db);
  assert.deepEqual(filas.map(f => f.id), [1, 4]);
  assert.equal(carreraPorSlug(filas, 'LICENCIATURA_EN_ADMINISTRACION').id, 1);
  assert.equal(carreraPorSlug(filas, "' OR 1=1 --"), undefined);
  assert.doesNotMatch(JSON.stringify(filas), /PRIVADO|descuento_especial/);
  await db.prepare('UPDATE carreras SET slides=?1 WHERE id=1').bind('[{"type":"desconocido"}]').run();
  await assert.rejects(carrerasPublicas(db), /Detalle inválido/);
});

test('licencias conservan copyright original y el build no contiene legajos', () => {
  for (const [archivo, titular] of [['Silkscreen','2001 The Silkscreen'], ['DMSans','2014 The DM Sans']]) {
    const texto = readFileSync(new URL(`../src/assets/OFL-${archivo}.txt`, import.meta.url), 'utf8');
    assert.ok(texto.startsWith(`Copyright ${titular}`));
    assert.match(texto, /SIL OPEN FONT LICENSE Version 1\.1/);
    assert.match(texto, /OTHER DEALINGS IN THE FONT SOFTWARE\./);
  }
  for (const nombre of readdirSync(new URL('../dist/client/_astro/', import.meta.url))) {
    if (!/\.(js|map|css)$/.test(nombre)) continue;
    const texto = readFileSync(new URL(`../dist/client/_astro/${nombre}`, import.meta.url), 'utf8');
    assert.ok(!texto.includes('ana.sintetica@example.invalid'), `legajo en asset ${nombre}`);
  }
});
