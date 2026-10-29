# Referencias del lote de carreras e inscripción

- <https://raw.githubusercontent.com/google/fonts/main/ofl/silkscreen/OFL.txt> — aviso original completo, con copyright de Silkscreen.
- <https://github.com/googlefonts/silkscreen> — proyecto identificado por el aviso de Silkscreen.
- <https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/OFL.txt> — aviso original de DM Sans, la fuente de las fichas Siglo 21; no se descargó el binario.
- <https://github.com/googlefonts/dm-fonts> — proyecto identificado por el aviso de DM Sans.
- [Ficha Next](../app/carreras/[slug]/page.tsx) — títulos, descripciones, metas, JSON-LD, relacionados, slug canónico y UI vigente.
- [Inscripción de carrera Next](../app/carreras/[slug]/inscripcion/page.tsx) — formulario por casa y restricciones de acceso.
- [Inscripción por código Next](../app/inscripcion/[codigo]/page.tsx) — capacidad privada, resumen enmascarado, estados indistinguibles y demo explícito.
- [Contrato por casa](../docs/formularios-por-casa.md) y [contratos puros](../components/formularios/casas.ts) — campos, consentimiento, validaciones, consumo y proyección.
- [Redirects vigentes](../next.config.ts) — sólo los de la familia `/carreras/[slug]`, no los de otras familias.
- Plan aprobado — bloque 4 local; no autoriza corte ni integraciones externas.

No se consultaron servicios operativos, producción ni contenidos privados. Las
únicas peticiones públicas de este lote fueron los dos archivos de licencia.
