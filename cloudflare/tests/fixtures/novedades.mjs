// Datos inventados, sin lectores ni servicios externos. Incluye todas las
// fronteras del paginado 3 + 6 + 5 y dos destacadas (sólo se lista la más nueva).
export const HTML_ARTICULO = '<p class="art-bajada ajena">Artículo sintético para probar el contenido.</p><h2>Información académica</h2><p>Texto con <strong>énfasis</strong> y <a href="/contacto" target="_blank">contacto</a>.</p><div class="art-nota">Una nota</div><table class="art-tabla"><tbody><tr><th scope="col">Tema</th><td>Dato</td></tr></tbody></table>';
export const XSS = '<script>globalThis.XSS_NOVEDAD=1</script><img src="javascript:alert(1)" onerror="alert(1)"><a href="JaVaScRiPt:alert(1)" onclick="alert(1)">peligroso</a><img src="data:image/svg+xml,malicioso"><iframe src="https://www.youtube.com/embed/ejemplo"></iframe><svg onload="alert(1)"></svg><p style="position:fixed" class="art-nota intrusa">Seguro</p><a href="https://example.invalid" target="_blank">Permitido</a><a href="mailto:fixture@example.invalid">Correo</a><a href="tel:123">Teléfono</a><img src="/icon.png" alt="Local">';
function fila(id, cambios = {}) {
  return { id, titulo: `Novedad sintética ${id}`, contenido: HTML_ARTICULO,
    extracto: `Extracto de la novedad sintética ${id}.`, fecha: `2026-10-${String(25-id).padStart(2,'0')}`,
    tag: id % 2 ? 'Barrio' : 'Carreras', imagen_url: null, href: 'https://example.invalid/no-se-usa',
    slug: `novedad-sintetica-${id}`, pinned: false, publicada: true,
    created_at: '2026-10-01T12:00:00Z', updated_at: '2026-10-25T12:00:00Z', ...cambios };
}
export const NOVEDADES = [
  fila(1, { pinned: true, imagen_url: '/imagenes/novedades/que-es-el-cau-villa-lugano.jpg', titulo: 'Novedad destacada sintética' }),
  fila(2, { pinned: true }),
  ...Array.from({length:10}, (_, i) => fila(i+3)),
  fila(13, { publicada: false, contenido: 'BORRADOR_NO_PUBLICO' }),
  fila(14, { contenido: null, extracto: null }),
  fila(15, { contenido: null }),
  fila(16, { contenido: XSS, titulo: 'Prueba </script><script>NO_EJECUTAR</script>' }),
  fila(17, { contenido: '<script>SOLO_SCRIPT</script>' }),
];
// Las variantes de contenido también son publicadas y cuentan para el listado.
export async function insertarNovedades(db, filas = NOVEDADES) {
  for (const fila of filas) {
    const columnas = Object.keys(fila);
    await db.prepare(`INSERT INTO novedades (${columnas.join(',')}) VALUES (${columnas.map(() => '?').join(',')})`)
      .bind(...Object.values(fila).map(v => typeof v === 'boolean' ? Number(v) : v)).run();
  }
}
export function sqlNovedades() {
  const valor = v => v === null ? 'NULL' : typeof v === 'boolean' ? String(Number(v))
    : typeof v === 'number' ? String(v) : `'${v.replaceAll("'", "''")}'`;
  return 'DELETE FROM novedades;\n' + NOVEDADES.map(f => `INSERT INTO novedades (${Object.keys(f).join(',')}) VALUES (${Object.values(f).map(valor).join(',')});`).join('\n');
}
