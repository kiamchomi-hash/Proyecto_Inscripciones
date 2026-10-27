import { carreraToSlug, carreraFullName, esCarreraVisible } from '../../../components/index/types.ts';
import type { Imagen } from '../../../components/imagenes/biblioteca.tsx';

type Archivo = { ruta: string; carpeta: string; subcarpeta: string | null; bytes: number };
type Carrera = { nombre: string; prefix: string | null; nivel: string };
const nombreArchivo = (ruta: string) => ruta.split('/').at(-1)!;
const slugArchivo = (ruta: string) => nombreArchivo(ruta).replace(/\.[^.]+$/, '');

export async function bibliotecaImagenes(db: D1Database, archivos: Archivo[]) {
  const filas = await db.prepare('SELECT nombre, prefix, nivel FROM carreras WHERE activa = 1').all<Carrera>();
  const porSlug = new Map(filas.results.filter(esCarreraVisible).map(c => [carreraToSlug(c), c]));
  const imagenes: Imagen[] = archivos.map(a => {
    const carrera = a.carpeta === 'imagenes_carreras' ? porSlug.get(slugArchivo(a.ruta)) : undefined;
    return { ...a, nombre: nombreArchivo(a.ruta), carrera: carrera ? carreraFullName(carrera) : null,
      nivel: carrera?.nivel ?? null };
  });
  imagenes.sort((a, b) => a.carpeta.localeCompare(b.carpeta, 'es') ||
    (a.subcarpeta ?? '').localeCompare(b.subcarpeta ?? '', 'es') || a.nombre.localeCompare(b.nombre, 'es'));
  const niveles = new Set(['Grado', 'Grado (CCC)', 'Pregrado']);
  const conFoto = new Set(archivos.filter(a => a.carpeta === 'imagenes_carreras').map(a => slugArchivo(a.ruta)));
  const sinFoto = [...porSlug.entries()].filter(([slug, c]) => niveles.has(c.nivel) && !conFoto.has(slug))
    .map(([, c]) => carreraFullName(c)).sort((a, b) => a.localeCompare(b, 'es'));
  return { imagenes, sinFoto };
}
