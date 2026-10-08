/** Sólo las páginas dedicadas, no los formularios incrustados en el catálogo. */
export function esRutaPreinscripcion(pathname: string): boolean {
  return /^\/teclab\/inscripcion\/?$/.test(pathname)
    || /^\/carreras\/[^/]+\/inscripcion\/?$/.test(pathname);
}
