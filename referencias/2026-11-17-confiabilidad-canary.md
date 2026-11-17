# Referencias: verificación y canary

- https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/ — flujo oficial de versiones y despliegues graduales; permite desplegar una versión a porcentajes.
- https://developers.cloudflare.com/workers/versions-and-deployments/version-skew/ — riesgos de mezclar HTML y assets de distintas versiones.
- https://developers.cloudflare.com/workers/versions-and-deployments/version-overrides/ — encabezado para dirigir una request a una versión Worker específica.
- https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/version-affinity/ — afinidad de requests con `Cloudflare-Workers-Version-Key` durante un canary.
- https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/ — rollback crea un deployment nuevo al 100% de la versión seleccionada.
- https://developers.cloudflare.com/workers/runtime-apis/bindings/version-metadata/ — binding que expone el ID de versión en runtime.
- https://developers.cloudflare.com/rules/transform/ — Transform Rules disponibles en todos los planes; límites de reglas y permisos.
- https://developers.cloudflare.com/workers/platform/pricing/ — precios y límites normales de Workers; no enumera canary como cargo separado.
- https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning — funcionamiento general de code scanning.
- https://docs.github.com/en/code-security/reference/code-scanning/workflow-configuration-options — configuración de CodeQL, lenguajes y protecciones por reglaset.
