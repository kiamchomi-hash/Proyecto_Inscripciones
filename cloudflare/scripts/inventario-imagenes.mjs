import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep, extname } from 'node:path';

// Sólo build: workerd no dispone del disco public/. Se serializa el mismo
// inventario que recorre Next, sin duplicar imágenes ni leer contenidos privados.
export function inventarioImagenes(raiz, rutasFijas) {
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
  const inventario = recorrer(raiz);
  if (rutasFijas === undefined) return inventario;
  if (!Array.isArray(rutasFijas) || rutasFijas.some(ruta => typeof ruta !== 'string')
    || new Set(rutasFijas).size !== rutasFijas.length) {
    throw new TypeError('El inventario E2E debe ser una lista de rutas únicas.');
  }
  const porRuta = new Map(inventario.map(imagen => [imagen.ruta, imagen]));
  return rutasFijas.map(ruta => {
    const imagen = porRuta.get(ruta);
    if (!imagen) throw new Error(`La ruta del inventario E2E no existe: ${ruta}`);
    return imagen;
  });
}

export function pluginInventario(raiz, rutasFijas) {
  const id = 'virtual:inventario-imagenes';
  return { name: 'inventario-imagenes', resolveId: nombre => nombre === id ? `\0${id}` : undefined,
    load: nombre => nombre === `\0${id}`
      ? `export default ${JSON.stringify(inventarioImagenes(raiz, rutasFijas))}`
      : undefined };
}
