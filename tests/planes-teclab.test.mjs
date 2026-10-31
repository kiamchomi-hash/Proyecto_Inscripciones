import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { getPlanOficialTeclab } from '../components/index/planes-teclab.ts';

const CARPETA = new URL('../public/planes/teclab/', import.meta.url);
const BASE_COMERCIAL = new URL('../carreras/teclab/resoluciones-teclab.json', import.meta.url);

const archivos = readdirSync(CARPETA).filter(f => f.endsWith('.pdf')).sort();

test('los programas oficiales están en public/planes/teclab y no pesan de más', () => {
  assert.ok(archivos.length >= 20, `sólo hay ${archivos.length} programas`);
  for (const archivo of archivos) {
    const bytes = readFileSync(new URL(archivo, CARPETA)).length;
    assert.ok(bytes > 100_000, `${archivo} parece vacío (${bytes} bytes)`);
    assert.ok(bytes < 5_000_000, `${archivo} pesa ${(bytes / 1e6).toFixed(1)} MB, demasiado para el sitio`);
  }
});

test('cada programa del disco se ofrece desde alguna carrera', () => {
  // Al revés del resto: si se copia un PDF nuevo y nadie lo referencia, queda
  // publicado sin que ninguna ficha lo ofrezca.
  const sinCarrera = archivos.filter(archivo => {
    const nombre = archivo.replace(/\.pdf$/, '').replace(/-/g, ' ');
    return getPlanOficialTeclab({ nombre }) !== `/planes/teclab/${archivo}`;
  });
  // `qa` es el único archivo que no se llama como la carrera: en D1 figura
  // como «Quality Assurance».
  assert.deepEqual(sinCarrera, ['qa.pdf']);
});

test('encuentra el programa con el nombre de D1', () => {
  assert.equal(
    getPlanOficialTeclab({ nombre: 'Tecnicatura Superior en Programación' }),
    '/planes/teclab/programacion.pdf',
  );
  assert.equal(
    getPlanOficialTeclab({ nombre: 'Tecnicatura en Calidad de Software', nombre_corto: 'Quality Assurance' }),
    '/planes/teclab/qa.pdf',
  );
  // Las anunciadas todavía no lo tienen: la ficha arma el PDF con su plan.
  assert.equal(
    getPlanOficialTeclab({ nombre: 'Tecnicatura Superior en Gestión de Inteligencia Artificial y Transformación Digital' }),
    null,
  );
});

test('las carreras con resolución publicada tienen programa oficial', { skip: !existsSync(BASE_COMERCIAL) && 'sin carreras/ en el disco' }, () => {
  const base = JSON.parse(readFileSync(BASE_COMERCIAL, 'utf8')).carreras;
  for (const clave of Object.keys(base)) {
    const nombre = clave === 'QA' ? 'Quality Assurance' : clave;
    assert.ok(
      getPlanOficialTeclab({ nombre }),
      `${clave} no tiene programa oficial en public/planes/teclab`,
    );
  }
});
