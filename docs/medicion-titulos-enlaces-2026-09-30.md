# Títulos y enlaces: evaluación completada, causalidad no demostrada

Medido el 30/09/2026. En las **25 fichas cuyo título cambia al reconstruir el algoritmo del 16/08**, los clics pasan de **32 a 87**, el CTR de **1,20% a 1,37%** y la posición de **8,98 a 8,14**. Es una mejora descriptiva, no evidencia de que el título la causó. Se mantienen los títulos y enlaces vigentes; no se revierte ni se extiende una intervención con esta muestra.

## Método y límites

Propiedad Search Console `sc-domain:siglo21sur.com`, búsqueda web, `dataState: final`, fechas PT. Tres consultas por página y dos por página/consulta; dos inspecciones URL. Sin barrido del sitemap, navegación, formularios ni cambios en producción. [Evidencia JSON](medicion-titulos-enlaces-2026-09-30.json) conserva pedidos, respuestas de analítica, cohorte y resumen de inspecciones sin credenciales.

Se ejecutaron las funciones de título extraídas de `b90ab59^` y `b90ab59` mediante TypeScript instalado, con constantes originales y helpers del proyecto. Se usaron filas activas y visibles actuales de Supabase, sólo con anon key. **No hay snapshot de los campos del 16/08**: 25 coincide con el registro original pero no demuestra identidad histórica si hubo renombres. El JSON conserva los campos y ambos títulos para auditarlo. Terapia Ocupacional y Desarrollo Humano no cambia entre esas dos fórmulas y queda fuera de esta cohorte.

Las URLs se consolidan con redirects exactos y los helpers reales de SEO. CTR = suma clics / suma impresiones; posición ponderada por impresiones. Ausencia de fila significa ausencia de métricas devueltas, no prueba de ausencia de indexación.

| Ventana (28 días) | Clics | Impresiones | CTR | Posición |
|---|---:|---:|---:|---:|
| base: 2026-07-17 → 2026-08-13 | 32 | 2669 | 1.20% | 8.98 |
| posterior: 2026-08-17 → 2026-09-13 | 76 | 5411 | 1.40% | 8.21 |
| actual: 2026-08-31 → 2026-09-27 | 87 | 6336 | 1.37% | 8.14 |

Base replica el 17/07–13/08 del informe original. Posterior empieza tras el cambio, pero incluye cambios posteriores. Actual termina tres días antes de medir. Posterior y actual se solapan: no son réplicas independientes y no se suman. Los 264 clics del informe original eran del sitio, no de estas 25 fichas; no se comparan con 87.

## Posición comparable y mezcla de consultas

Seleccionando descriptivamente las **12 fichas** con variación absoluta de posición media ≤1: clics **15 → 32**, impresiones **1501 → 2996**, CTR **1,00% → 1,07%**, posición **8,50 → 7,92**. La diferencia de CTR es apenas 0,07 puntos y todavía mejora la posición; la selección es posterior a observar datos, no un grupo control ni prueba de significancia.

Las consultas nombradas cubren **638/2669 (23,9%) → 2048/6336 (32,3%)** de impresiones. Las que contienen `siglo 21`, `siglo xxi` o `teclab` aportan **487/638 (76,3%) → 1449/2048 (70,8%)**. Cambia la mezcla, y Google omite consultas anonimizadas: no se extrapola esa proporción al total ni se compara como si la intención fuera idéntica.

Confusores: descripciones reescritas en agosto, enlaces por área (`a35ba13`, 25/08), presupuesto de título 61 (`eca9aa7`, 02/09), refuerzo de Videojuegos (`c42f1ca`, 20/09), nuevos ajustes SEO (`c9cce72`, 21/09), crecimiento del sitio, estacionalidad y mezcla de búsquedas. Search Console mide desempeño, no qué título mostró Google en cada impresión. No hay experimento aislado.

## Enlaces internos: resultado actual

El 29/08 ambas fichas tenían diez enlaces entrantes reales y seguían sin rastrear, frente a Quality Assurance indexada con nueve. Ese registro ya mostraba que falta de cantidad de enlaces no era explicación suficiente; no demuestra causalidad universal ni se volvió a contar el grafo hoy.

| URL canónica actual | Inspección 30/09 | Analítica 31/08–27/09 |
|---|---|---|
| /carreras/tecnicatura-en-videojuegos | NEUTRAL: Google no reconoce esta URL; sin rastreo informado | Sin fila devuelta |
| /carreras/tecnicatura-superior-en-experiencia-del-cliente | PASS: enviada e indexada, canónica propia; rastreo 24/09/2026 08:49:52 UTC | 59 impresiones, 0 clics, posición 9,24 |

Las dos URLs fueron renombradas el 30/08, después de rotar enlaces. Experiencia del Cliente se confirmó indexada el 05/09; Videojuegos aún no. **No se atribuye la indexación al cambio del 16/08**: hubo renombre y otros cambios entre medio. Inspección es estado de la copia de Google, no un test en vivo. Las impresiones son evidencia histórica de aparición, no sustituto de cobertura actual. No se recalcula 108/111 ni un porcentaje global sin inspeccionar la oferta actual completa.

El defecto del reparto anterior (0–34 enlaces, fichas relegadas) justificaba conservar la rotación independientemente de indexación. Se mantiene el criterio vigente por área y rotación, sin nuevos parches. Videojuegos continúa en la rutina de indexación; cerrar esta evaluación no equivale a indexarlo.

## Por ficha: base frente a actual

| ID y ficha | Clics | Impresiones | CTR | Posición |
|---|---:|---:|---:|---:|
| 15: Informática | 0 → 3 | 54 → 582 | 0.00% → 0.52% | 10.07 → 7.87 |
| 13: Ciencias de Datos | 1 → 4 | 180 → 205 | 0.56% → 1.95% | 9.93 → 8.20 |
| 16: Matemática | 3 → 7 | 123 → 207 | 2.44% → 3.38% | 6.31 → 6.24 |
| 5: Administración | 0 → 2 | 17 → 127 | 0.00% → 1.57% | 10.59 → 13.01 |
| 12: Inteligencia Artificial y Robótica | 2 → 0 | 289 → 403 | 0.69% → 0.00% | 9.09 → 8.40 |
| 14: Seguridad Informática | 1 → 2 | 194 → 182 | 0.52% → 1.10% | 10.17 → 9.68 |
| 81: Emprendimiento (CCC) | 0 → 4 | 8 → 100 | 0.00% → 4.00% | 9.00 → 9.67 |
| 72: Publicidad | 0 → 1 | 11 → 65 | 0.00% → 1.54% | 8.55 → 7.57 |
| 75: Gerontología (CCC) | 2 → 5 | 45 → 141 | 4.44% → 3.55% | 11.60 → 6.99 |
| 89: Administración y Gestión Tributaria | 2 → 3 | 75 → 193 | 2.67% → 1.55% | 7.49 → 8.34 |
| 9: Comercialización | 1 → 0 | 98 → 304 | 1.02% → 0.00% | 12.53 → 7.33 |
| 62: Gestión Turística | 5 → 5 | 148 → 261 | 3.38% → 1.92% | 7.39 → 6.37 |
| 88: Investigación de la escena del crimen | 0 → 1 | 155 → 247 | 0.00% → 0.40% | 9.04 → 8.09 |
| 19: Logística Global | 2 → 4 | 240 → 513 | 0.83% → 0.78% | 6.97 → 6.81 |
| 73: Relaciones Públicas e Institucionales | 2 → 2 | 116 → 210 | 1.72% → 0.95% | 13.11 → 13.73 |
| 10: Negocios Digitales | 0 → 0 | 32 → 95 | 0.00% → 0.00% | 5.91 → 14.82 |
| 20: Gestión Ambiental | 3 → 8 | 171 → 294 | 1.75% → 2.72% | 9.88 → 11.22 |
| 71: Periodismo | 0 → 2 | 53 → 189 | 0.00% → 1.06% | 7.40 → 6.74 |
| 83: Educación (CCC) | 0 → 1 | 22 → 111 | 0.00% → 0.90% | 14.41 → 10.90 |
| 103: Gestión de Moda | 2 → 6 | 193 → 607 | 1.04% → 0.99% | 6.90 → 6.61 |
| 17: Bioinformática | 1 → 10 | 126 → 220 | 0.79% → 4.55% | 8.34 → 7.04 |
| 96: Recursos Turísticos | 1 → 0 | 44 → 80 | 2.27% → 0.00% | 7.57 → 6.96 |
| 65: Gestión Deportiva | 2 → 4 | 161 → 229 | 1.24% → 1.75% | 8.86 → 7.07 |
| 101: Relaciones Laborales | 0 → 5 | 19 → 220 | 0.00% → 2.27% | 17.89 → 8.41 |
| 84: Psicopedagogía (CCC) | 2 → 8 | 95 → 551 | 2.11% → 1.45% | 8.83 → 7.44 |

## Cierre

Se completa pendiente-05 como evaluación, no como demostración causal ni como arreglo de Videojuegos. Mantener [rutinas SEO](rutinas.md) y [seguimiento de indexación](indexacion.md). [Descripciones y Terapia](medicion-ctr-fichas-2026-09-30.md) es otra cohorte y otra base temporal: sus 3 → 16 no se mezclan con esta medición.
