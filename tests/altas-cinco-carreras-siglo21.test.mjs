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
