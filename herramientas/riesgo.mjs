const NIVELES = ['bajo', 'medio', 'alto'];

const REGLAS = [
  { nivel: 'alto', coincide: p => /(^|\/)(migrations?|sql)(\/|$)|\.sql$/i.test(p)
    || /(^|\/)(formularios|api|seguridad|auth|pagos?)(\/|$)/i.test(p)
    || /^cloudflare\/produccion\//i.test(p)
    || /(^|\/)(wrangler|publicar|verificar)\.(jsonc?|ya?ml|mjs|ts)$/i.test(p)
    || /^\.github\/workflows\//i.test(p) },
  { nivel: 'medio', coincide: p => /^(cloudflare\/|components\/|lib\/|estilos\/|app\/|pages\/|public\/)/i.test(p)
    || /\.(tsx?|jsx?|css|astro)$/i.test(p)
    || /(^|\/)(package(-lock)?\.json|tsconfig[^/]*\.json|eslint[^/]*)$/i.test(p) },
  { nivel: 'bajo', coincide: () => true },
];

export function clasificarRiesgo(rutas) {
  if (!Array.isArray(rutas) || rutas.some(ruta => typeof ruta !== 'string' || !ruta
    || ruta.startsWith('/') || ruta.includes('\\') || ruta.split('/').some(segmento => !segmento || segmento === '.' || segmento === '..'))) {
    throw new TypeError('Las rutas del cambio deben ser relativas al repositorio.');
  }
  if (rutas.length === 0) return { nivel: 'bajo', verificaciones: ['npm run check'] };

  const nivel = REGLAS.find(regla => rutas.some(regla.coincide)).nivel;
  const verificaciones = ['npm run check'];
  if (rutas.some(p => p.startsWith('cloudflare/'))) {
    verificaciones.push('npm --prefix cloudflare run build');
  }
  if (nivel === 'alto') {
    verificaciones.push('pruebas del área afectada', 'npm --prefix cloudflare run check');
  }
  return { nivel, verificaciones: [...new Set(verificaciones)] };
}

export { NIVELES };
