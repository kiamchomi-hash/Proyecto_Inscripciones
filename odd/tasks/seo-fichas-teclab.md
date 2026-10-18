# SEO de fichas de Teclab (18/10/2026)

## Objetivo

Subir las fichas de Teclab con búsquedas genéricas al borde de la primera página,
según Search Console a 90 días (20/07 al 17/10/2026).

## Problema

- Cloud Administration: 432 impresiones genéricas en posición 7-11 y 3 clics
  («técnico en cloud administration»: 151 impresiones, posición 10).
- Gestión Contable: «tecnicatura en gestión contable» y «gestión contable» en
  posición 13-15.
- Seguros: «tecnicatura en seguros» en posición 18; con marca está en la 2.
- Las páginas `/inscripcion` de Teclab, `/teclab/inscripcion` y
  `/teclab/test-vocacional` están «descubiertas, sin indexar».

## Alcance

Contenido en Supabase (preguntas frecuentes de cada ficha, con datos que ya están
en la fila) y reenvío del sitemap. Los títulos no se tocan: Seguros convierte con
«siglo 21» en el título, y Cloud y Gestión Contable ya tienen un ajuste puntual.

## Tareas

- [x] T1 Relevar contenido y enlaces. Ruta: inline. El artículo «qué hace un
  administrador cloud» ya enlaza a la ficha; no hace falta otro enlace.
- [x] T2 Cloud: preguntas sobre título, certificaciones de AWS y salida laboral (3).
- [x] T3 Gestión Contable: qué hace un técnico y cuánto dura (2).
- [x] T4 Seguros: cuánto dura y qué hace un técnico superior (2).
- [x] T5 Sitemap reenviado el 18/10/2026. Pedir a mano en Search Console (no hay API):
  `/teclab/test-vocacional`, `/teclab/inscripcion` y las `/inscripcion` de
  marketing digital, cloud, seguros y programación.

## Verificación

Observado el 18/10/2026: las tres fichas de producción muestran las preguntas
nuevas (revalidación on-demand), con 6, 5 y 5 preguntas. Próximo paso: medir
en Search Console alrededor del 15/11/2026.

## Cómo se verifica

Leer las filas después del `UPDATE` y ver las tres fichas en local. A medir en
Search Console a las 4 semanas.
