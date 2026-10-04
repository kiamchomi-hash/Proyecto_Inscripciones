import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const componente = readFileSync(new URL('../components/index/careers-catalog.tsx', import.meta.url), 'utf8');
const estilos = readFileSync(new URL('../app/index.css', import.meta.url), 'utf8');

test('Más buscada Teclab acompaña la duración en la cabecera sin modificar la prioridad de Nueva', () => {
  assert.match(componente, /const badge = carrera\.proximamente \? 'Próximamente' : carrera\.nueva \? 'Nueva' : carrera\.destacada \? 'Más buscada' : null/);
  assert.match(componente, /const badgeInternoTeclab = \(familiaTeclab \|\| isTeclabCourse\) && badge === 'Más buscada'/);
  assert.match(componente, /badge && !badgeInternoTeclab/);
  const cabeceras = [...componente.matchAll(/<div className="teclab-card-head">([\s\S]*?)<\/div>\s*\)}/g)];
  assert.equal(cabeceras.length, 2);
  for (const [, cabecera] of cabeceras) {
    assert.match(cabecera, /className="teclab-card-meta"/);
    assert.ok(cabecera.indexOf('className="teclab-badge"') < cabecera.indexOf('badgeInternoTeclab'));
    assert.ok(cabecera.indexOf('badgeInternoTeclab') < cabecera.indexOf('teclab-badge-tipo'));
  }
  assert.doesNotMatch(componente, /teclab-card-popularidad/);
  const bloque = estilos.match(/\.teclab-card-meta \.career-badge--destacada\s*\{([^}]+)\}/)?.[1];
  assert.ok(bloque);
  for (const regla of ['position: static', 'transform: none', 'var(--teclab-accent)', 'var(--teclab-on-accent)', 'border-radius: 5px']) assert.ok(bloque.includes(regla));
});
