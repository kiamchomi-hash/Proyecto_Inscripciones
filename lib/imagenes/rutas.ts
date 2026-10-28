// Codifica una ruta de imagen para usarla en `src`: respeta las barras y escapa
// tildes y espacios de cada segmento. Vive acá y no en el modal porque los
// derivados y el respaldo tienen que armar la misma URL.
export function encodeImagePath(ruta: string): string {
  if (!ruta) return ruta;
  return ruta.split('/').map((segmento) => encodeURIComponent(segmento)).join('/');
}
