# CTR de las ocho fichas: medición completada, mejora no atribuible

Medido el 30/09/2026. El CTR conjunto pasó de **0,70% a 0,88%** (+0,19 puntos porcentuales), con una posición media mejor. El resultado es mixto por ficha y no demuestra que reescribir las descripciones haya causado la diferencia. **No se extiende el cambio a las seis restantes** con esta evidencia.

## Ventanas y método

Search Console, propiedad `sc-domain:siglo21sur.com`, búsqueda web y `dataState: final`. Tres consultas agrupadas por página, sin inspeccionar ni recorrer el sitio. Las fechas de Search Console son días del huso del Pacífico (PT), no días argentinos. Los ocho IDs se resolvieron mediante lectura pública de Supabase: están activos y visibles. URLs generadas con `carreraToSlug()`; redirects exactos consolidados con los helpers existentes de SEO. Ninguna de estas ocho URLs cambió por un redirect.

- Base: **11/07–07/08**, 28 días, misma ventana del informe original del 10/08. Se recuperaron de la API los ocho registros; los siete publicados originalmente coinciden en clics e impresiones. Gestión Deportiva aporta el octavo registro, que no aparecía en el listado de CTR bajo.
- Posterior inicial: **24/08–20/09**, 28 días, tras el plazo previsto de rastreo.
- Actual: **31/08–27/09**, 28 días, con tres días de margen de consolidación.

Las dos ventanas posteriores se solapan: no constituyen réplicas independientes ni deben sumarse. CTR = suma de clics / suma de impresiones. Posición ponderada por impresiones, no promedio de porcentajes.

| Ventana | Clics | Impresiones | CTR | Posición |
|---|---:|---:|---:|---:|
| 2026-07-11 → 2026-08-07 | 17 | 2443 | 0,70% | 7,57 |
| 2026-08-24 → 2026-09-20 | 60 | 7273 | 0,82% | 6,86 |
| 2026-08-31 → 2026-09-27 | 64 | 7233 | 0,88% | 6,76 |

## Por ficha: base frente a actual

| ID y ficha | Clics | Impresiones | CTR | Posición |
|---|---:|---:|---:|---:|
| 86, [Martillero, Corredor Público y Corredor Inmobiliario](https://www.siglo21sur.com/carreras/martillero-corredor-publico-y-corredor-inmobiliario) | 6 → 14 | 879 → 2440 | 0,68% → 0,57% | 7,30 → 6,98 |
| 21, [Higiene, Seguridad y Medio ambiente del Trabajo](https://www.siglo21sur.com/carreras/licenciatura-en-higiene-seguridad-y-medio-ambiente-del-trabajo) | 0 → 0 | 279 → 363 | 0,00% → 0,00% | 8,02 → 7,11 |
| 6, [Finanzas](https://www.siglo21sur.com/carreras/licenciatura-en-finanzas) | 3 → 2 | 343 → 885 | 0,87% → 0,23% | 7,60 → 7,66 |
| 76, [Terapia Ocupacional y Desarrollo Humano](https://www.siglo21sur.com/carreras/licenciatura-en-terapia-ocupacional-y-desarrollo-humano) | 3 → 16 | 228 → 655 | 1,32% → 2,44% | 6,17 → 5,06 |
| 87, [Procurador](https://www.siglo21sur.com/carreras/procurador) | 1 → 14 | 213 → 1089 | 0,47% → 1,29% | 8,72 → 7,33 |
| 8, [Comercio Internacional](https://www.siglo21sur.com/carreras/licenciatura-en-comercio-internacional) | 1 → 10 | 201 → 1059 | 0,50% → 0,94% | 8,45 → 5,75 |
| 19, [Logística Global](https://www.siglo21sur.com/carreras/licenciatura-en-logistica-global) | 2 → 4 | 177 → 513 | 1,13% → 0,78% | 7,01 → 6,81 |
| 65, [Gestión Deportiva](https://www.siglo21sur.com/carreras/licenciatura-en-gestion-deportiva) | 1 → 4 | 123 → 229 | 0,81% → 1,75% | 8,40 → 7,07 |

## Interpretación y límites

- Suben cuatro CTR: Terapia Ocupacional, Procurador, Comercio Internacional y Gestión Deportiva. Bajan Martillero, Finanzas y Logística; Higiene permanece en cero en la ventana actual.
- El volumen de clics creció, pero también las impresiones (2443 → 7233) y mejoró la posición media (7,57 → 6,76). Más clics no equivale a una descripción más efectiva.
- Finanzas conserva posición casi igual (7,60 → 7,66) y baja de 0,87% a 0,23%, pero son 3 frente a 2 clics: insuficiente para atribuir el descenso al texto. El mismo cuidado corresponde a Logística.
- Los títulos cambiaron el 16/08 y el presupuesto del título volvió a ajustarse en septiembre; también cambió el enlazado. No existe control sin esos cambios ni fecha probada de adopción del snippet por Google.
- La API devuelve filas principales y no garantiza todas las filas; las tres respuestas tuvieron 123, 128 y 127 filas frente al límite de 25000, y las ocho fichas estuvieron presentes en las tres.
- No se controló la mezcla de consultas, marca, dispositivo o país. Estos totales por página no prueban comportamiento a posición e intención constantes. Las consultas nombradas omiten parte de la cola anonimizada; no deben reemplazar los totales de página.
- La base reúne sólo 17 clics, no los ~55 estimados en la nota original. La comparación es descriptiva; no se calcula significancia ni se afirma causalidad con independencia de impresiones no demostrada.

## Cierre

La remedición solicitada queda completada. Se mantienen las ocho descripciones actuales y no se reescriben las seis restantes: no hay una mejora consistente y aislable. Una nueva revisión sólo se justifica con más volumen y un diseño de comparación que controle posición e intención, dentro de la rutina de SEO existente. El pendiente 05 de títulos y enlaces se conserva abierto; esta medición no lo resuelve.

## Evidencia

- [Datos exactos de la API](medicion-ctr-fichas-2026-09-30.json).
- Informe original local: `herramientas/vigilancia-logs/seo-20260810.md` (registro operativo, ignorado por Git).
- [Método existente](herramientas.md), [contexto de títulos y enlaces](pendientes-detalle.md#pendiente-05).
- [Referencias de API](../referencias/2026-09-30-ctr-fichas.md).

Sin cambios en Supabase, textos SEO, código, dependencias, commit ni deploy.
