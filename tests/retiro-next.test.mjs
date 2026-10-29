import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ESLint } from 'eslint';

test('el framework Next y el paquete de integración ya no están instalados', () => {
  const paquete = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  for (const nombre of ['next', '@next/third-parties', 'eslint-config-next']) {
    assert.equal(paquete.dependencies?.[nombre], undefined, nombre);
    assert.equal(paquete.devDependencies?.[nombre], undefined, nombre);
    assert.equal(lock.packages[`node_modules/${nombre}`], undefined, nombre);
  }
});

test('el lint conserva las reglas de React, hooks, accesibilidad y TypeScript', async () => {
  const eslint = new ESLint();
  const config = await eslint.calculateConfigForFile('components/navbar.tsx');
  for (const regla of ['react/jsx-key', 'react-hooks/rules-of-hooks', 'react-hooks/exhaustive-deps', 'jsx-a11y/alt-text', '@typescript-eslint/no-unused-vars', '@next/next/no-img-element']) {
    assert.ok(config.rules[regla]?.[0] > 0, regla);
  }
});
