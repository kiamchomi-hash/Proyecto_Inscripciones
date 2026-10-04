import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const componente = readFileSync(new URL('../components/index/careers-catalog.tsx', import.meta.url), 'utf8');
const estilos = readFileSync(new URL('../app/index.css', import.meta.url), 'utf8');

test('Más buscada Teclab ocupa una fila interna sin modificar la prioridad de Nueva', () => {
  assert.match(componente, /const badge = carrera\.proximamente \? 'Próximamente' : carrera\.nueva \? 'Nueva' : carrera\.destacada \? 'Más buscada' : null/);
  assert.match(componente, /const badgeInternoTeclab = \(familiaTeclab \|\| isTeclabCourse\) && badge === 'Más buscada'/);
  assert.match(componente, /badge && !badgeInternoTeclab/);
  assert.ok(componente.indexOf('className="teclab-card-popularidad"') > componente.indexOf('className="teclab-card-head"'));
  assert.ok(componente.indexOf('className="teclab-card-popularidad"') < componente.indexOf('className="flex-grow relative min-w-0"'));
  const bloque = estilos.match(/\.teclab-card-popularidad \.career-badge--destacada\s*\{([^}]+)\}/)?.[1];
  assert.ok(bloque);
  for (const regla of ['position: static', 'transform: none', 'var(--teclab-accent)', 'var(--teclab-on-accent)', 'border-radius: 5px']) assert.ok(bloque.includes(regla));
});
