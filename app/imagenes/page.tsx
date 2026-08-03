import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import { supabase } from '@/lib/supabase';
import { carreraToSlug, carreraFullName, esCarreraVisible } from '@/components/index/types';
import BibliotecaImagenes, { type Imagen } from '@/components/imagenes/biblioteca';

// Sólo los campos que pide el cruce: los helpers de types.ts reciben Pick<>,
// no la Carrera entera, y traer la fila completa acá no aporta nada.
type CarreraMinima = { nombre: string; prefix: string | null; nivel: string };
import './imagenes.css';

// Herramienta interna: catálogo de todo lo que hay en public/imagenes, para
// encontrar una foto y copiar su ruta sin abrir el explorador de archivos.
// No se enlaza desde ningún lado del sitio y no entra al sitemap; queda fuera
// del índice por el X-Robots-Tag de next.config.ts y por el `robots` de acá.
//
// Se arma en el build leyendo el disco, así que refleja lo que está deployado.
// Una imagen agregada en local aparece recién después de pushear.
export const metadata: Metadata = {
  title: 'Biblioteca de imágenes',
  robots: { index: false, follow: false },
};

const RAIZ = path.join(process.cwd(), 'public', 'imagenes');
const EXTENSIONES = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif']);

interface Archivo {
  ruta: string;
  /** Carpeta de primer nivel: es el filtro. Modales/ tiene 66 subcarpetas y
      agrupar por ruta completa daba 78 chips, que no sirven para filtrar. */
  carpeta: string;
  /** Ruta intermedia dentro de esa carpeta, para ubicar el archivo. */
  subcarpeta: string | null;
  bytes: number;
}

/** Recorre public/imagenes y devuelve cada archivo con su ruta pública y su peso. */
function listarArchivos(dir: string): Archivo[] {
  const salida: Archivo[] = [];

  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const completa = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      salida.push(...listarArchivos(completa));
      continue;
    }
    if (!EXTENSIONES.has(path.extname(entrada.name).toLowerCase())) continue;

    const relativa = path.relative(RAIZ, completa).split(path.sep);
    const carpetas = relativa.slice(0, -1);
    salida.push({
      // La ruta pública siempre va con barras normales: en Windows path.sep es \.
      ruta: `/imagenes/${relativa.join('/')}`,
      carpeta: carpetas[0] ?? '(sueltas)',
      subcarpeta: carpetas.length > 1 ? carpetas.slice(1).join('/') : null,
      bytes: fs.statSync(completa).size,
    });
  }

  return salida;
}

export default async function ImagenesPage() {
  const { data } = await supabase
    .from('carreras')
    .select('nombre, prefix, nivel')
    .eq('activa', true);

  // Slug → carrera, para poder decir a qué carrera pertenece cada foto de
  // imagenes_carreras/ sin depender del nombre del archivo.
  const porSlug = new Map<string, CarreraMinima>();
  for (const c of (data ?? []) as CarreraMinima[]) {
    if (!esCarreraVisible(c)) continue;
    porSlug.set(carreraToSlug(c), c);
  }

  const archivos = fs.existsSync(RAIZ) ? listarArchivos(RAIZ) : [];

  const imagenes: Imagen[] = archivos.map(a => {
    const esDeCarrera = a.carpeta === 'imagenes_carreras';
    const carrera = esDeCarrera
      ? porSlug.get(path.basename(a.ruta, path.extname(a.ruta)))
      : undefined;

    return {
      ruta: a.ruta,
      nombre: path.basename(a.ruta),
      carpeta: a.carpeta,
      subcarpeta: a.subcarpeta,
      bytes: a.bytes,
      carrera: carrera ? carreraFullName(carrera) : null,
      nivel: carrera?.nivel ?? null,
    };
  });

  imagenes.sort(
    (a, b) =>
      a.carpeta.localeCompare(b.carpeta, 'es') ||
      (a.subcarpeta ?? '').localeCompare(b.subcarpeta ?? '', 'es') ||
      a.nombre.localeCompare(b.nombre, 'es'),
  );

  // Carreras publicadas que todavía no tienen foto en imagenes_carreras/.
  // Sólo se miran los niveles de Siglo 21: las fotos salen del catálogo de
  // 21.edu.ar, que no cubre Teclab ni Identidad Argentina, así que contarlas
  // ahí daría 35 faltantes que en realidad nunca van a estar.
  const NIVELES_CON_FOTO = new Set(['Grado', 'Grado (CCC)', 'Pregrado']);
  const conFoto = new Set(
    archivos
      .filter(a => a.carpeta === 'imagenes_carreras')
      .map(a => path.basename(a.ruta, path.extname(a.ruta))),
  );
  const sinFoto = [...porSlug.entries()]
    .filter(([slug, c]) => NIVELES_CON_FOTO.has(c.nivel) && !conFoto.has(slug))
    .map(([, c]) => carreraFullName(c))
    .sort((a, b) => a.localeCompare(b, 'es'));

  return <BibliotecaImagenes imagenes={imagenes} sinFoto={sinFoto} />;
}
