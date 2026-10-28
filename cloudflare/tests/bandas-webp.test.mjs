import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { codificarBandas, leerReferenciaVisual, validarBandas } from './helpers/bandas-webp.mjs';

test('las bandas WebP preservan cada píxel RGBA sin pérdida', async () => {
  const ancho = 8, alto = 25;
  const original = Buffer.alloc(ancho * alto * 4);
  for (let i = 0; i < original.length; i++) original[i] = (i * 37 + Math.floor(i / 4)) % 256;
  for (let i = 3; i < original.length; i += 4) original[i] = 255;
  const png = await sharp(original, { raw: { width: ancho, height: alto, channels: 4 } }).png().toBuffer();
  const resultado = await codificarBandas(png, 7);
  await validarBandas(resultado);
  assert.deepEqual(resultado.bandas.map(banda => banda.y), [0, 7, 14, 21]);
  const reconstruida = Buffer.concat(await Promise.all(resultado.bandas.map(banda =>
    sharp(banda.imagen).ensureAlpha().raw().toBuffer())));
  assert.deepEqual(reconstruida, original);
});

test('referencia faltante o corrupta falla y una referencia válida conserva los píxeles', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'cau-bandas-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await assert.rejects(leerReferenciaVisual(dir, 'home-movil'), { code: 'ENOENT' });
  const png = await sharp({ create: { width: 10, height: 15, channels: 4, background: '#047755' } }).png().toBuffer();
  const ref = await codificarBandas(png, 7);
  const bandas = [];
  for (const [indice, banda] of ref.bandas.entries()) {
    const archivo = `home-movil-${indice}.webp`;
    await writeFile(join(dir, archivo), banda.imagen);
    bandas.push({ archivo, y: banda.y, alto: banda.alto });
  }
  await writeFile(join(dir, 'home-movil.json'), JSON.stringify({ ancho: ref.ancho, alto: ref.alto, bandas }));
  const restaurado = await leerReferenciaVisual(dir, 'home-movil');
  assert.deepEqual(await sharp(restaurado).ensureAlpha().raw().toBuffer(), await sharp(png).ensureAlpha().raw().toBuffer());
  await writeFile(join(dir, bandas[0].archivo), Buffer.from('webp truncado'));
  await assert.rejects(leerReferenciaVisual(dir, 'home-movil'));
  await assert.rejects(leerReferenciaVisual(dir, '../home-movil'), /inválido/);
});

test('el manifiesto rechaza huecos, solapamientos y dimensiones incorrectas', async () => {
  const png = await sharp({ create: { width: 4, height: 10, channels: 4, background: '#aa33ff' } }).png().toBuffer();
  const resultado = await codificarBandas(png, 5);
  const copiar = () => ({ ...resultado, bandas: resultado.bandas.map(b => ({ ...b })) });
  const hueco = copiar(); hueco.bandas[1].y++;
  await assert.rejects(validarBandas(hueco), /huecos o solapamientos/);
  const solapamiento = copiar(); solapamiento.bandas[1].y--;
  await assert.rejects(validarBandas(solapamiento), /huecos o solapamientos/);
  const anchoIncorrecto = { ...copiar(), ancho: 5 };
  await assert.rejects(validarBandas(anchoIncorrecto), /dimensiones/);
  await assert.rejects(codificarBandas(png, 16384), /inválido/);
});
