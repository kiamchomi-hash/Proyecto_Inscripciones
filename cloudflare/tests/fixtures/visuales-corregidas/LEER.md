# Referencias visuales corregidas

Estas cuatro capturas sustituyen **para el control de regresión** las de
`visuales-next` de `/sobre-nosotros` y `/calendario-academico`, en escritorio y
celular. Las referencias Next originales no se modifican y siguen disponibles
como registro de la paridad histórica.

La captura anterior de Sobre Nosotros tenía el texto de la dirección comprimido
en una columna y faltaban utilidades de Tailwind. El commit `c8544f0` volvió a
incluir `paginas/` en las fuentes CSS: con eso se recuperaron la distribución y
los tamaños previstos en ambas páginas. Se compararon las capturas antiguas y
las corregidas en los dos perfiles antes de seleccionar estas referencias.

Las capturas se tomaron con el mismo fixture sintético y el mismo procedimiento
de `e2e.test.mjs`. Se codifican en bandas WebP sin pérdida, sin aumentar las
tolerancias ni cambiar las otras páginas. Son referencias de la versión
corregida del Worker, no capturas del Next histórico ni del sitio de producción.
