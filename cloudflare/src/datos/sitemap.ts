import type { CarreraSlide } from '../../../components/index/types.ts';
import type { DatosSitemap } from '../entrega/sitemap.ts';

// Lecturas del sitemap contra D1. Repiten las mismas columnas y filtros que
// `app/sitemap.ts`. Next no declara orden, así que hereda el físico de la tabla
// (orden de inserción). En SQLite hay índices por `activa`/`publicada` y sin un
// orden explícito el planificador devuelve otro; `rowid` es el equivalente
// estable de ese orden físico y mantiene la paridad byte a byte con Next.
type FilaCarrera = {
  nombre: string;
  prefix: string | null;
  nivel: string;
  slides: string | null;
  updated_at: string | null;
  proximamente: number;
};

const REINTENTOS = 2;

/** Mismo margen que `consultarConReintentos` de `app/sitemap.ts`. */
async function consultarConReintentos<T>(consulta: () => Promise<T>): Promise<T> {
  let ultimoError: unknown;
  for (let intento = 0; intento <= REINTENTOS; intento++) {
    try {
      return await consulta();
    } catch (error) {
      ultimoError = error;
      if (intento < REINTENTOS) {
        await new Promise(resolver => setTimeout(resolver, 250 * (intento + 1)));
      }
    }
  }
  throw ultimoError;
}

export async function datosSitemap(db: D1Database): Promise<DatosSitemap> {
  const [carreras, materias, total, articulos] = await Promise.all([
    consultarConReintentos(() => db.prepare(`SELECT nombre, prefix, nivel, slides, updated_at, proximamente
      FROM carreras WHERE activa = 1 ORDER BY rowid`).all<FilaCarrera>()),
    consultarConReintentos(() => db.prepare(`SELECT slug FROM materias
      WHERE activa = 1 AND en_construccion = 0 ORDER BY rowid`).all<{ slug: string }>()),
    consultarConReintentos(() => db.prepare(`SELECT count(*) AS total FROM novedades
      WHERE publicada = 1 AND pinned = 0`).first<number>('total')),
    consultarConReintentos(() => db.prepare(`SELECT slug, fecha, imagen_url FROM novedades
      WHERE publicada = 1 AND slug IS NOT NULL ORDER BY rowid`).all<{
        slug: string; fecha: string | null; imagen_url: string | null;
      }>()),
  ]);

  return {
    carreras: carreras.results.map(fila => ({
      nombre: fila.nombre,
      prefix: fila.prefix,
      nivel: fila.nivel,
      slides: fila.slides === null ? null : JSON.parse(fila.slides) as CarreraSlide[],
      updated_at: fila.updated_at,
      proximamente: fila.proximamente === 1,
    })),
    materias: materias.results,
    totalNovedades: total ?? 0,
    articulos: articulos.results,
  };
}
