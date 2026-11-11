import type { DatosLlmsTxt } from '../entrega/llms-txt.ts';
import { consultarConReintentos } from './reintento.ts';

// Lecturas de `/llms.txt` contra D1. Mismo filtro que el sitemap: sólo la
// oferta activa, y la taxonomía compartida decide después qué niveles se
// publican. El orden es el físico de la tabla (`rowid`), como en el sitemap.

type FilaCarrera = {
  nombre: string;
  prefix: string | null;
  nivel: string;
  descripcion: string | null;
  duracion: string | null;
  titulo: string | null;
  modalidad: string | null;
  proximamente: number;
};

type FilaMateria = {
  slug: string;
  label: string;
  descripcion: string | null;
};

type FilaArticulo = {
  slug: string;
  titulo: string;
  extracto: string | null;
  fecha: string | null;
};

export async function datosLlmsTxt(db: D1Database): Promise<DatosLlmsTxt> {
  const [carreras, materias, articulos] = await Promise.all([
    consultarConReintentos(() => db.prepare(`SELECT nombre, prefix, nivel, descripcion, duracion,
      titulo, modalidad, proximamente FROM carreras WHERE activa = 1 ORDER BY rowid`).all<FilaCarrera>()),
    consultarConReintentos(() => db.prepare(`SELECT slug, label, descripcion FROM materias
      WHERE activa = 1 AND en_construccion = 0 ORDER BY rowid`).all<FilaMateria>()),
    consultarConReintentos(() => db.prepare(`SELECT slug, titulo, extracto, fecha FROM novedades
      WHERE publicada = 1 AND slug IS NOT NULL ORDER BY rowid`).all<FilaArticulo>()),
  ]);

  return {
    carreras: carreras.results.map(fila => ({
      nombre: fila.nombre,
      prefix: fila.prefix,
      nivel: fila.nivel,
      descripcion: fila.descripcion,
      duracion: fila.duracion,
      titulo: fila.titulo,
      modalidad: fila.modalidad,
      proximamente: fila.proximamente === 1,
    })),
    materias: materias.results,
    articulos: articulos.results,
  };
}
