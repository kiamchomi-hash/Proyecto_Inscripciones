import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const React = require('react');

// Reemplazos que valen para cualquier módulo transpilado. Sin esto, cada test
// que carga un modal tenía que declarar los mismos stubs de imágenes y el
// primero que se olvidaba fallaba con MODULE_NOT_FOUND en vez de con un
// resultado útil.
const encodeImagePath = ruta => (ruta ? ruta.split('/').map(encodeURIComponent).join('/') : ruta);

const AUTOMATICOS = {
  '@/lib/imagenes/rutas': { encodeImagePath },
  // Un `<img>` pelado: el manifiesto de derivadas (18 KB) no aporta nada al
  // test, que compara texto y atributos del markup.
  '@/components/imagenes/imagen-responsiva': {
    default: ({ ruta, alt, sizes: _sizes, fill, width, height, priority: _priority, className, style, loading, fetchPriority }) =>
      React.createElement('img', {
        src: encodeImagePath(ruta),
        alt,
        className,
        style: fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style } : style,
        width: !fill ? width : undefined,
        height: !fill ? height : undefined,
        loading: loading ?? (_priority ? 'eager' : undefined),
        fetchPriority,
      }),
    __esModule: true,
  },
};

// Ejecuta el módulo real, reemplazando sólo sus dependencias externas. Permite
// probar rutas sin servidor ni escrituras en la base.
export function cargarTypescript(archivo, dependencias, resto = require) {
  const codigo = ts.transpileModule(readFileSync(archivo, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const modulo = { exports: {} };
  const importar = nombre =>
    Object.hasOwn(dependencias, nombre) ? dependencias[nombre]
      : Object.hasOwn(AUTOMATICOS, nombre) ? AUTOMATICOS[nombre]
        : resto(nombre);
  new Function('require', 'module', 'exports', codigo)(importar, modulo, modulo.exports);
  return modulo.exports;
}
