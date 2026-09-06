# Correcciones de la auditoría — 05/09/2026

Los defectos funcionales identificados quedaron corregidos y verificados en el árbol local. No se hizo commit ni deploy; los archivos con cambios previos conservan esos cambios.

## Cambios y verificación

1. **Lecturas de datos:** home, ficha de carrera, landing Teclab y las cuatro consultas del sitemap propagan errores de Supabase. Una falla ya no se transforma en catálogo vacío, 404 de una carrera existente o sitemap parcial. Las pruebas ejecutan los módulos reales con una base simulada y comprueban el rechazo en cada lectura. En ISR, Next conserva la última generación exitosa; el sitemap dinámico responde con error hasta que se recupere la base.
2. **Detalles del catálogo:** los errores HTTP, JSON y de red ya no quedan memorizados. La siguiente apertura puede reintentar y las descargas simultáneas se comparten. Se vuelve a intentar al recuperar conexión. La respuesta tardía sólo actualiza la carrera que sigue seleccionada. En navegador se reprodujo un 502, se recuperó la ficha al abrirla y se verificó que cerrar antes de recibir datos no reabra el modal.
3. **Dependencias:** `sanitize-html` quedó en 2.17.7, `fflate` en 0.8.3 y `browserslist` en 4.28.9, con sus dependencias compatibles. Sólo cambió el lock. `npm audit` y la auditoría sin desarrollo quedaron en cero. Se descargó desde el modal el PDF de Abogacía: 33.358 bytes, cabecera PDF y cierre correctos.
4. **Accesibilidad:** FAQ tiene nombre de diálogo, trampa de foco que excluye elementos invisibles, retorno al disparador y buscador con etiqueta persistente y foco visible. Los cinco campos de contacto tienen etiquetas asociadas y autocompletado; email y teléfono vinculan sus errores. Se verificaron teclado, campos completados y ausencia de desborde a 390 y 1440 píxeles, con capturas inspeccionadas. No equivale a una certificación WCAG o una revisión exhaustiva con lector de pantalla.
5. **Formularios:** JSON inválido, sobre nulo, arrays y filas inválidas devuelven 400. El discriminador de casa sólo acepta propiedades propias, sin confundir `toString` con una casa. Sin secreto Turnstile, producción devuelve 503: el bypass exige desarrollo y `NEXT_PUBLIC_FORMULARIOS_PRUEBA_LOCAL=1`. Se verificaron 400, 403, 429, 500, 503 y 201 con dependencias simuladas. El servidor de producción local también devolvió 400 a los tres sobres malformados probados, sin escribir datos.
6. **SEO:** el informe toma los redirects exactos de `next.config.ts` y consolida renombres antes de comparar ambas ventanas y las consultas. Suma clics e impresiones, recalcula CTR y pondera posición. Las bajas que terminan en la home quedan separadas. La corrida real pasó de excluir 38 clics en 14 URLs a excluir 29 en 12: recuperó nueve clics de URLs renombradas. Los tests cubren el redirect de Fraude, Experiencia del Cliente, bajas, cadenas, ciclos y agregación de métricas.
7. **Documentación y alcance del lint:** corregidas las descripciones del sitemap, los errores y el modo local de formularios y la decisión ya tomada sobre OWASP. ESLint excluye material comercial y artefactos locales; siguen vigentes sus herramientas propias. Se mantuvo `inlineCss` y se midió el build de producción, con el resultado detallado abajo.

## Resultado de las verificaciones

- `npm run check`: aprobado, **65/65 tests**, typecheck sin errores. El lint mantiene 28 advertencias previas de código, sin errores bloqueantes; no se desactivaron reglas para ocultarlas.
- `npm run build`: aprobado, **129 páginas generadas**.
- Smoke rápido contra `next start`: rutas principales, cabeceras y noindex aprobados. El barrido de las 111 URLs y los redirects de producción había pasado durante la auditoría; no certifica un deploy de estas correcciones porque no se publicó.
- `npm run seo -- --rapido`: aprobado, métricas consolidadas y sin problemas detectados.
- Pruebas de navegador y descarga PDF aprobadas. Capturas y PDF en `output/playwright/auditoria-20260905/`; evidencia en `.agents/reports/correcciones-web-20260905.json`.

## Rendimiento y límite pendiente

Tres corridas sobre `next start`, Chromium 149, viewport 390×844, CPU ralentizada 4 veces, latencia de 150 ms, descarga de 1,6 Mbps, caché deshabilitada y analytics bloqueado:

| Corrida | LCP | CLS acumulado observado | Tareas largas |
|---|---:|---:|---:|
| 1 | 1.584 ms | 0,000039 | 4 |
| 2 | 2.120 ms | 0 | 4 |
| 3 | 2.052 ms | 0 | 4 |

Se recogieron eventos de Chrome DevTools y tiempos de layout. La mediana de LCP fue 2.052 ms. Son mediciones de laboratorio local, con observación hasta cinco segundos después de `load`; no representan el percentil 75 de usuarios reales ni miden INP. No hay medición comparable del código anterior para atribuir una mejora a este trabajo.

**La tercera copia del CSS sigue presente con Next 16.3.3.** El HTML local pesa 641.451 bytes (626,4 KiB); el smoke midió 105,0 KiB con gzip, que no se compara directamente con Brotli de Vercel. La limitación se conserva en `PENDIENTES.md`: no se parcheó el framework ni se apagó `inlineCss`, decisión ya respaldada por el A/B del proyecto. El punto de rendimiento quedó medido y documentado; la duplicación no se presenta como resuelta.

La carrera #132 sigue pendiente de una fuente académica que ya faltaba antes. La evaluación de títulos prevista para el 07/09 se mantiene para esa fecha; estas correcciones no justifican adelantarla ni publicar contenido comercial sin verificar. Tampoco se cambiaron grants, secretos, triggers ni el monitoreo existente.
