// Consolida renombres antes de comparar ventanas de Search Console. Las bajas
// que terminan en la home conservan su ruta para poder excluirlas del informe.
export function resolverRutaSeo(redirects) {
  const mapa = new Map(redirects
    .filter(r => !r.has && !r.missing && !r.source.includes(':') &&
      r.destination.startsWith('/') && !r.destination.startsWith('//'))
    .map(r => [r.source, r.destination]));
  return ruta => {
    const visitadas = new Set();
    let destino = ruta;
    while (mapa.has(destino)) {
      if (visitadas.has(destino)) return ruta;
      visitadas.add(destino);
      destino = mapa.get(destino);
    }
    return destino === '/' ? ruta : destino;
  };
}

export function consolidarFilasSeo(filas, indicePagina, resolver, base) {
  const grupos = new Map();
  for (const fila of filas) {
    const keys = [...fila.keys];
    const ruta = resolver(new URL(keys[indicePagina]).pathname);
    keys[indicePagina] = new URL(ruta, base).href;
    const clave = JSON.stringify(keys);
    const grupo = grupos.get(clave) ?? { keys, clicks: 0, impressions: 0, posicionPonderada: 0 };
    grupo.clicks += fila.clicks;
    grupo.impressions += fila.impressions;
    grupo.posicionPonderada += fila.position * fila.impressions;
    grupos.set(clave, grupo);
  }
  return [...grupos.values()].map(({ posicionPonderada, ...grupo }) => ({
    ...grupo,
    ctr: grupo.impressions ? grupo.clicks / grupo.impressions : 0,
    position: grupo.impressions ? posicionPonderada / grupo.impressions : 0,
  }));
}
