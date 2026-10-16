# Referencias de la medición vocacional

- [Analytics existente](../lib/analytics.ts): reutilización de `@vercel/analytics`, sin agregar avisos de Telegram.
- [Test general](../components/test-vocacional/test-vocacional.tsx): inicio explícito, avance confirmado, retrocesos y CTA provisional/final.
- [Test Teclab](../components/test-vocacional-teclab/test-vocacional-teclab.tsx): primera respuesta como inicio y avance inmediato.
- [Carga de TypeScript en pruebas](../tests/helpers/cargar-typescript.mjs): ejecución de módulos reales con dependencias falsas locales.
- [Criterios del proyecto](../docs/criterios.md): prohibición de emitir eventos de prueba en producción.

No se consultaron fuentes externas: se reutilizaron las APIs y dependencias instaladas del proyecto.
