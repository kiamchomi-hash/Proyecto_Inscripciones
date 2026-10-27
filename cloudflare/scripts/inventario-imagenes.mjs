import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep, extname } from 'node:path';

// Sólo build: workerd no dispone del disco public/. Se serializa el mismo
// inventario que recorre Next, sin duplicar imágenes ni leer contenidos privados.
export function inventarioImagenes(raiz) {
  const extensiones = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif']);
  const recorrer = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entrada => {
    const completa = join(dir, entrada.name);
    if (entrada.isDirectory()) return recorrer(completa);
    if (!extensiones.has(extname(entrada.name).toLowerCase())) return [];
    const partes = relative(raiz, completa).split(sep);
    const carpetas = partes.slice(0, -1);
    return [{ ruta: `/imagenes/${partes.join('/')}`, carpeta: carpetas[0] ?? '(sueltas)',
      subcarpeta: carpetas.length > 1 ? carpetas.slice(1).join('/') : null, bytes: statSync(completa).size }];
  });
  return recorrer(raiz);
}

export function pluginInventario(raiz) {
  const id = 'virtual:inventario-imagenes';
  return { name: 'inventario-imagenes', resolveId: nombre => nombre === id ? `\0${id}` : undefined,
    load: nombre => nombre === `\0${id}` ? `export default ${JSON.stringify(inventarioImagenes(raiz))}` : undefined };
}
