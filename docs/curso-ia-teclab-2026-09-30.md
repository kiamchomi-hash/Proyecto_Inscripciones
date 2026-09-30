# Curso de IA de Teclab: revisión del 30/09/2026

**El arancel individual ya está actualizado en la base comercial local: $55.000, con promoción válida hasta el 30/09/2026 y beneficio sujeto a aprobación de Teclab.** Las fechas y el PDF con módulos también están publicados. Queda confirmar los medios de pago. Las imágenes fueron reemplazadas localmente con una ilustración aportada por el usuario, pendiente de deploy. Esta revisión sólo actualizó documentación: no modificó el bot, los precios ni la base de datos.

## Verificación

| Dato | Evidencia y alcance |
|---|---|
| Curso | Actualización Profesional en Inteligencia Artificial. |
| Próxima edición | 12.ª: inicio 13/10/2026, fin del período 16/11/2026; venta 08/09–12/10. El Dashboard de Agentes respondió HTTP 200 el 30/09/2026; se extrajo el calendario final con el lector existente. |
| Siguiente edición | 13.ª: inicio 17/11/2026, fin del período 21/12/2026; venta 13/10–16/11. No son fechas individuales de encuentros. |
| Duración y modalidad | La landing y el PDF anuncian cuatro semanas online; la landing, un encuentro sincrónico semanal. El intervalo del calendario no demuestra cinco clases ni permite deducir horarios. |
| Temario | La landing enlaza un PDF de seis páginas. La página 5 enumera cuatro módulos con contenidos, ejercicios y actividad final: IA laboral y perfil profesional; productividad y organización; decisiones y análisis; ética, seguridad y responsabilidad. No establece un cronograma fechado por encuentro. |
| Precio individual | Extracción del simulador del 30/09/2026 a las 17:55:23 UTC: matrícula de $220.000 menos 75% ($165.000), total $55.000. Promoción hasta el 30/09/2026, beneficio sujeto a aprobación de Teclab. El bimestre en $0 no significa curso gratuito: se cobra la matrícula. No usar este precio después de su vencimiento ni como arancel permanente. |
| Medios de pago | La extracción del curso no informa financiación ni CFT/TEA. Confirmar las condiciones específicas antes de ofrecer cuotas; no deducirlas del precio ni de la bonificación con una tecnicatura. |
| Fotos | Se sustituyeron localmente curso-ia.webp y curso-ia-cierre.webp por una ilustración generada y aportada por el usuario el 30/09. Original conservado en contenidos/siglo21/imagenes_personas/Imagen de ChatGPT 30 sept 2026, 18_44_48.png. No representa personas o instalaciones reales ni es material oficial de Teclab. WebP optimizado, sin cambiar referencias ni datos de Supabase; falta deploy. |

## Fuentes y límites

- [Dashboard Comercial Teclab de Agentes](https://informacion.teclab.edu.ar/hubfs/ADMISION/CALIDAD%20Y%20%20TRAINING/Dashboard_Comercial_Teclab%20(Agentes).html): consulta directa actual, sin login ni escrituras; copia técnica en herramientas/ventas/temp/curso-ia-verificacion-2026-09-30.html (ignorada por Git).
- [Landing oficial](https://teclab.edu.ar/landing/curso-profesional-ia/).
- [Plan oficial PDF](https://teclab.edu.ar/wp-content/uploads/2025/06/PLAN-DE-ESTUDIO-FINAL-IA-TECLAB-.pdf.pdf): enlace directo obtenido de la landing; texto leído mediante web. La descarga local respondió 403 y no se pudo validar visualmente. El texto extraído incluye una referencia a un certificado intermedio de Customer Experience: no copiarla como certificación de IA sin aclaración de Teclab.
- El bot ya dispone del marcador inicioCurso y del calendario de ediciones; esta revisión no los volvió a implementar.
- La evidencia del precio se conserva en `ventas/fuentes/teclab/marketing-agent/output/precio_actualizacion-profesional-en-inteligencia-artificial.json`, con texto crudo del simulador, y en `ventas/fuentes/teclab/price-automation/snapshots/precios_2026-09-30_150145.json`. Son fuentes comerciales locales ignoradas por Git. La automatización las actualizó después de la primera revisión de este documento.
- `carreras/teclab/carreras-externas.json` ya contiene el total de $55.000 y `promoHasta: 30/09/2026`; el corpus consume marcadores y exige `preciosVigentes`. No corresponde duplicar el importe en una respuesta fija ni en la ficha pública, que deriva la consulta de precios a WhatsApp.

## Sólo resta pedir

Confirmación de los medios de pago del curso individual. Si se necesita publicar fechas/horarios de cada clase, confirmar el cronograma detallado. El pedido preparado está en herramientas/pedidos-a-enviar.md; no fue enviado y debe ajustarse antes de enviarlo, porque ya existen arancel fechado, calendario de ediciones y plan oficial.

La ilustración aportada por el usuario ya reemplaza ambos assets en local. Se conserva el original sin modificaciones. Las rutas actuales también actualizan su aparición en la landing /teclab después del deploy.
