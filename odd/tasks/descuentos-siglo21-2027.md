# Promociones Siglo 21 2027

## Objetivo y alcance
Corregir la extracción y el cálculo local de precios 2027 para considerar las promociones correspondientes a cada período, sin alterar el comportamiento 2026 ni presentar condiciones vencidas como vigentes.

Las fuentes, fórmulas, condiciones comerciales y evidencias detalladas se conservan exclusivamente en la documentación local privada. No se incorporan datos comerciales ni credenciales al repositorio público.

## Restricciones
- Trabajar con fuentes locales, sin modificar libros remotos ni solicitar contraseñas de hojas.
- Separar las reglas de los períodos y verificar integridad y vigencia antes de cotizar.
- Mantener los datos existentes de 2026 y las modificaciones ajenas.
- No forzar a Git archivos comerciales ignorados ni publicar las salidas locales.

## Tareas
- [x] T1 — Separar la extracción de promociones 2027 por período y registrar controles de integridad y vigencia.
- [x] T2 — Aplicar el cálculo sucesivo sólo con condiciones completas, confiables y vigentes, sin duplicar beneficios.
- [x] T3 — Cubrir extracción, descuentos, adicionales, expiración e información no confiable con pruebas deterministas.
- [x] T4 — Revisar las fuentes locales sin red y mantener bloqueada la cotización cuando no se acredita vigencia.
- [ ] T5 — Resolver una superficie segura de revisión nativa para la implementación comercial ignorada, sin exponerla al repositorio público.
- [x] T6 — Regenerar las salidas locales desde la fuente previamente descargada, preservando el contenido ajeno y sin habilitar promociones no comprobadas.

## Criterios de aceptación
- La extracción distingue correctamente las reglas de cada período.
- Los descuentos se aplican de manera sucesiva, sin duplicación.
- Información vencida, incompleta o no confiable no habilita una cotización.
- Los datos de 2026 no cambian y las fuentes comerciales permanecen locales.

## Ruta y entrega
Ruta delegada, con un solo escritor y TDD RED → GREEN donde existen pruebas deterministas aplicables. El trabajo comercial permanece fuera de Git; esta documentación pública no lo sustituye ni acredita una revisión nativa de sus archivos.

## Evidencia observada
- RED observado antes de corregir la selección de promociones y el cálculo; GREEN posterior en las pruebas específicas.
- Pruebas de extracción y promociones: 13/13 aprobadas.
- Suite comercial: 374/374 aprobadas.
- Pruebas de regeneración local: 6/6 aprobadas.
- `npm run check`: exit 0, lint sin errores, typecheck aprobado y 347/347 pruebas en la verificación de esa tarea.
- Regeneración local completada sin descargar ni sobrescribir la fuente. Se comprobó la preservación de los datos ajenos y del origen local.
- Las promociones vencidas o no disponibles no habilitaron cotización. No se afirma vigencia comercial ni aprobación nativa de la implementación ignorada.
- No se hicieron stage, commit ni push durante la implementación original.

## Próximo paso
Resolver la superficie de revisión segura y obtener una fuente con vigencia comprobable antes de habilitar cotizaciones promocionales. El respaldo íntegro y los detalles comerciales quedan en documentación local privada.
