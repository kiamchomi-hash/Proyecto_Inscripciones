import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);

// Ejecuta el módulo real, reemplazando sólo sus dependencias externas. Permite
// probar rutas Next sin servidor ni escrituras en Supabase.
export function cargarTypescript(archivo, dependencias, resto = require) {
  const codigo = ts.transpileModule(readFileSync(archivo, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const modulo = { exports: {} };
  const importar = nombre => Object.hasOwn(dependencias, nombre) ? dependencias[nombre] : resto(nombre);
  new Function('require', 'module', 'exports', codigo)(importar, modulo, modulo.exports);
  return modulo.exports;
}
