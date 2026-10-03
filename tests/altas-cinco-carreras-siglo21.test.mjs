import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { validarSlides } from '../lib/datos/carrera-detalle.ts';
import { carreraToSlug, carreraFullName, esCarreraVisible, getCategoryForCarrera } from '../components/index/types.ts';

test('las cinco altas públicas conservan identidad y planes oficiales completos', () => {
  const datos = JSON.parse(readFileSync(new URL('./fixtures/altas-cinco-carreras-siglo21.json', import.meta.url)));
  assert.equal(datos.carreras.length, 5);
  const cantidades = [50, 47, 48, 51, 50];
  for (const [i, entrada] of datos.carreras.entries()) {
    const fila = entrada.fila;
    assert.equal(esCarreraVisible(fila), true);
    assert.equal(getCategoryForCarrera(fila), 'licenciaturas');
    assert.equal(carreraToSlug(fila), entrada.slug);
    assert.equal(carreraFullName(fila), entrada.fuente.nombre);
    assert.deepEqual(validarSlides(fila.slides, entrada.id), fila.slides);
    assert.deepEqual(fila.slides.map(s => s.type), ['portada', 'plan_estudios', 'cierre']);
    assert.equal(fila.slides[0].bullets.length, 2);
    const materias = fila.slides[1].paginas.flatMap(p => [p.izquierda, p.derecha].filter(Boolean).flatMap(a => a.cuatrimestres.flatMap(c => c.materias)).concat((p.extras ?? []).flatMap(e => e.items)));
    assert.equal(materias.length, cantidades[i]);
    assert.deepEqual(materias, entrada.fuente.plan.filter(p => p.tag === 'LI').map(p => p.text));
    assert.ok(existsSync(`public${fila.slides[0].imagen_desktop}`));
    assert.doesNotMatch(JSON.stringify(fila), /100\s*%\s*(virtual|online)|UMOV|EDITOR_DATABASE_URL/i);
    if (entrada.operacion === 'insert') assert.equal(Object.hasOwn(entrada, 'id'), false);
  }
  assert.deepEqual(datos.carreras.filter(c => c.operacion === 'update').map(c => c.id), [77, 63, 18]);
});

test('el SQL limita la escritura y verifica concurrencia antes de modificar', () => {
  const sql = readFileSync(new URL('../sql/2026-10-03_alta_cinco_carreras_siglo21.sql', import.meta.url), 'utf8');
  assert.equal((sql.match(/UPDATE public\.carreras SET/g) ?? []).length, 3);
  assert.equal((sql.match(/INSERT INTO public\.carreras/g) ?? []).length, 2);
  assert.equal((sql.match(/FOR UPDATE/g) ?? []).length, 3);
  assert.equal((sql.match(/GET DIAGNOSTICS afectadas = ROW_COUNT/g) ?? []).length, 5);
  assert.match(sql, /LOCK TABLE public\.carreras IN SHARE ROW EXCLUSIVE MODE/);
  assert.match(sql, /afectadas <> 5/);
  assert.doesNotMatch(sql, /\b(DROP|DELETE|CREATE TRIGGER|setval|service_role)\b/i);
  assert.ok(sql.indexOf('Baseline modificado') < sql.indexOf('UPDATE public.carreras SET'));
  assert.match(sql, /BEGIN;[\s\S]*COMMIT;\s*$/);
});

test('el baseline SQL conserva la precisión original de PostgreSQL sin convertir a Date', () => {
  const datos = JSON.parse(readFileSync(new URL('./fixtures/altas-cinco-carreras-siglo21.json', import.meta.url)));
  const sql = readFileSync(new URL('../sql/2026-10-03_alta_cinco_carreras_siglo21.sql', import.meta.url), 'utf8');
  const exactos = {
    77: '2026-03-21 20:09:07.010409+00',
    63: '2026-07-30 22:17:18.993736+00',
    18: '2026-03-21 20:43:42.15959+00',
  };
  const literales = [...sql.matchAll(/esperado := '([^']+)'::jsonb;/g)].map(m => JSON.parse(m[1]));
  for (const entrada of datos.carreras.filter(c => c.id)) {
    assert.equal(entrada.esperado.updated_at, exactos[entrada.id]);
    const esperadoSQL = literales.find(c => c.nombre === entrada.esperado.nombre);
    assert.deepEqual(esperadoSQL, entrada.esperado);
    assert.match(esperadoSQL.updated_at, /\.\d{5,6}\+00$/);
  }
});
