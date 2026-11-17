# Verificación y recuperación: diseño aprobado

## Objetivo

Reducir el riesgo de publicar cambios en el sitio del CAU sin exigir una segunda
persona, cambiar el flujo de trabajo ni pagar por revisión de IA.

## Decisiones

- Se conserva el push directo a `main`; no se agregan PR obligatorios,
  aprobaciones humanas, CODEOWNERS ni merge queue.
- Los controles locales y de CI se clasifican por riesgo y bloquean ante fallos.
- Se conserva Gitleaks y `npm audit`; CodeQL se incorpora primero en observación
  y luego bloquea ante hallazgos nuevos altos o críticos.
- No se integra IA paga. Una eventual revisión gratuita/manual es informativa y
  no bloquea.
- El Worker se despliega gradualmente: validación de la candidata sin tráfico,
  5% de tráfico, smoke y promoción al 100% si pasa; si falla, rollback del
  Worker. D1 nunca se revierte automáticamente.
- Las URLs de assets se versionan con el ID de la versión del Worker y su ruta
  original. Un manifiesto por versión conserva la asociación; los bytes se
  guardan en R2 con clave SHA-256 para deduplicar contenido idéntico. El
  publicador sube objetos y manifiesto antes de exponer la candidata.
- El Worker puede servir recursos de páginas antiguas después de retirar una
  versión; CSS y JS mantienen la versión en sus referencias anidadas y dinámicas.
- El Worker cachea assets de R2 en el borde. Los visitantes sólo pueden leer
  rutas de assets permitidas; no pueden escribir ni listar el bucket.
- El canary no depende de una regla de Transform Rules ni de mantener versiones
  Worker antiguas activas para recuperar assets. Los IDs de versión pueden
  seguir en las URLs para resolver el manifiesto histórico; el contenido
  deduplicado por hash es el mecanismo de almacenamiento.
- El resumen de Actions registra SHA, clasificación, checks y resultado del
  canary/rollback. Incidentes y reversiones se anotan; no se simula una métrica
  automática de tiempo humano.

## Límites y condiciones

- Antes de habilitar tráfico gradual hay que comprobar con pruebas que páginas,
  módulos, CSS, imágenes y demás requests de assets no mezclen versiones.
- La documentación consultada indica que R2 Standard incluye mensualmente
  10 GB-mes, 1 millón de operaciones Class A y 10 millones Class B sin cargo;
  luego cobra US$0,015/GB-mes y US$0,36 por millón de lecturas Class B. La salida
  de datos no tiene cargo. El consumo real del sitio aún no está medido.
- La aprobación es para diseñar e implementar el flujo local. Crear el bucket,
  enlazarlo a producción, subir assets o desplegarlo son operaciones remotas y
  requieren autorización explícita aparte.
- La credencial documentada de deploy tiene `Zone:Read`; no sirve para escribir
  recursos de R2. No se amplía el token habitual ni se almacenan secretos.
- Cualquier operación sobre D1 queda fuera de este diseño.

## Referencias

- [Gradual deployments](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/)
- [Version skew y assets estáticos](https://developers.cloudflare.com/workers/versions-and-deployments/version-skew/)
- [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Use R2 from Workers](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/)
- [Rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)
- [Precios de Workers](https://developers.cloudflare.com/workers/platform/pricing/)
- [Code scanning de GitHub](https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning)
