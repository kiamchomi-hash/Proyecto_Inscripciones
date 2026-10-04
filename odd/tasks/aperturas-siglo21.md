# Aperturas Siglo 21

## Objetivo y alcance
Corregir el inicio universal sin apertura específica, el descarte del mes actual y la ficha cruzada de Psicopedagogía CCC. Sólo Siglo 21; corpus de admisión se identifica sin editar. Sin publicación ni commits autorizados para este ejecutor.

## Tareas
- [x] T1 Validar apertura original y calendario ED/EDH antes del día exacto (delegada: preparación y lógica).
- [x] T2 Conservar el mes actual antes del inicio confirmado; no inferir próxima apertura anual (delegada: lógica y pruebas).
- [x] T3 Reasociar ficha oficial CCC, duración 2 años y RM283/2025 (delegada: datos oficiales).

## Comprobación
RED → GREEN: pruebas deterministas con fechas inyectadas; suite ventas, auditor institucional, ambos generadores con beneficio10 sin promoción forzada, npm run check y diff check. No modificar otras casas ni precios. Preexistentes dos problemas Teclab no se corrigen.

## Estado
Implementación local realizada. RED4fallos antes de corregir: octubre descartado, marzo extrapolado, identidad CCC y helper todavía inexistente; reproducción original del inicio universal documentada en la auditoría; GREEN7/7incluyendo integración y guardia de enero2027. Suiteventas356/356; npmcheck305/305 (27warningspreexistentes), auditor2problemasTeclabprevios sin tocar. AmbosHTML regenerados70carrerasSiglo21. Diffchecksinproblemas. Sincommit/publicación. PlanCCC23materias2añoscorrecto: sólo _fuente/_verificado se actualizaron a la fuenteCCC.

## Evidencia y límites
Calendario ED/EDH2026: 1A16marzo,1B18mayo,2A3agosto,2B5octubre. No confirma admisión ni cupo; corpus sigue intacto. No se extrapola marzo2027 ni se renueva la lista anual en enero2027 sin calendario confirmado. Corrección adversa: test enero2027 observado RED1fallo→GREEN. AmbosHTML regenerados después de la guardia. La comparación previa de metadataPlan se documentó por lectura anterior, pero sin snapshot/hashbaseline reproducible no constituye prueba independiente de invariancia de23contenidos. Hashes de corpus/externas de Teclab e Identidad idénticos antes/después. Estrategia ask-on-risk; menos400líneas autorales, HTML generado excluido. No commit autorizado al ejecutor: cierre versionado corresponde al coordinador cuando proceda.

## Siguiente paso
Revisión independiente del coordinador. Informar cinco respuestas que afirman admisión abierta y una genérica leve; no modificarlas sin decisión explícita. Publicación no incluida en esta solicitud.
