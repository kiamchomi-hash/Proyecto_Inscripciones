import test from 'node:test';
import assert from 'node:assert/strict';
import * as taxonomia from '../components/index/types.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

test('un fallo del detalle no queda memorizado y las llamadas concurrentes comparten descarga', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  for (const fallo of [() => Promise.reject(new Error('Sin red')), () => Promise.resolve(new Response('', { status: 502 })), () => Promise.resolve(new Response('{'))]) {
    let llamadas = 0;
    globalThis.fetch = () => ++llamadas === 1 ? fallo() : Promise.resolve(Response.json({ 7: { descripcion: 'Plan recuperado' } }));
    const { bajarDetalle } = cargarTypescript('components/index/detalle-carreras.ts', { react: {} });
    assert.deepEqual(await bajarDetalle(), {});
    const a = bajarDetalle(), b = bajarDetalle();
    assert.equal(a, b);
    assert.equal((await a)[7].descripcion, 'Plan recuperado');
    assert.equal((await bajarDetalle())[7].descripcion, 'Plan recuperado');
    assert.equal(llamadas, 2);
  }
});

function cargarPagina(archivo, fallaEn = 1) {
  let consultas = 0;
  const error = new Error('Base temporalmente inaccesible');
  const supabase = { from: () => {
    const numero = ++consultas;
    const consulta = new Proxy({}, { get: (_, metodo) => {
      if (metodo === 'then') return resolver => resolver({ data: [], count: 0, error: numero === fallaEn ? error : null });
      if (metodo === 'throwOnError') return () => numero === fallaEn ? Promise.reject(error) : Promise.resolve({ data: [], count: 0 });
      return () => consulta;
    } });
    return consulta;
  } };
  return cargarTypescript(archivo, {
    '@/lib/supabase': { supabase },
    '@/components/index/types': taxonomia,
    'next/navigation': { notFound: () => { throw new Error('404 incorrecto'); } },
    'next/dynamic': { default: () => () => null },
    'react/jsx-runtime': { jsx: () => null, jsxs: () => null },
  }, () => ({}));
}

test('home y carrera rechazan fallas de la base antes de renderizar vacío o devolver 404', async () => {
  await assert.rejects(cargarPagina('app/page.tsx').default(), /Base temporalmente inaccesible/);
  await assert.rejects(cargarPagina('app/carreras/[slug]/page.tsx').default({ params: Promise.resolve({ slug: 'abogacia' }) }), /Base temporalmente inaccesible/);
});

test('el sitemap falla completo si falla cualquiera de sus cuatro lecturas', async () => {
  for (let i = 1; i <= 4; i++) {
    await assert.rejects(cargarPagina('app/sitemap.ts', i).default(), /Base temporalmente inaccesible/);
  }
  assert.ok((await cargarPagina('app/sitemap.ts', -1).default()).length > 0);
});
