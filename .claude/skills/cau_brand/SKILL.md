---
name: cau-brand
description: Marca del CAU Villa Lugano: paleta de colores, tipografías, estética y los datos de la sede (dirección, Maps, coordenadas). Usar al diseñar o ajustar cualquier pieza visual del sitio, un folleto, una placa o un video, y cuando haga falta la dirección o el enlace de Maps de la sede.
---

CAU Educational Platform - Recursos Visuales
Colores (Sugeridos para inspiración)
Principales: #00c7b1, #013729, #008c7d, #009681, #006c5b

Acentos y Badges: #00ffe1, #e69b05, #dab03a, #7c207b

Fondos sugeridos: #162f2e, #1c2f31

Variante de color para texto: #2b2b2f

Paleta extendida (opcional): #1a2c2e, #13282a, #093838, #37b5aa, #6c2381, #e4b645, #093838, #e69b02, #5d4594, #003938, #6d2282, #b8922a, #4a1259, #013729, #051b1b, #1a3d36, #203646, #332b4a, #3c302b, #2b3e30 ,#1f3a44, #3f2f46,#3a342f,#253b42,#2f3146, #e7d6b4, #d9c39a, #d9bf4f, #25D366, #1877F2, #D6249F, #766a3b, #122522, #4c7f78, #87a89e, #323955, #d0fe70, #014d42, #002425, #798d5f #798 #284445 #0e1918

Tipografía Sugerida
Inter (100-900)

DM Sans (Como alternativa sugerida)

Notas de Diseño
Estética moderna con preferencia por temas oscuros.

Enfoque Mobile-first y accesibilidad.

Ubicación
Los valores viven en `lib/sede.ts` (`MAPS_URL`, `MAPS_EMBED_SRC`, `GEO`, `POSTAL_ADDRESS`) — importarlos desde ahí, no copiar la URL.

Dirección: Guaminí 4876, Villa Lugano, CABA (C1439)
Maps link: https://maps.app.goo.gl/mXu8TUH6FCLQvuYYA
Coordenadas: -34.6870295, -58.4775718

Ojo: Google tiene dos fichas del mismo lugar. La correcta es "Siglo 21"; "Centro de Capacitacion Lugano" (CID `0x95bcceb304e92bc7`, coordenadas `-34.68692, -58.47802`) cae a ~2 km y no hay que usarla.
Zona: Villa Lugano, CABA. Cerca de Mataderos, Liniers, Villa Celina y Zona Sur del GBA.

Botón primario (btn-cau-primary)
Gradiente azul→verde, hover brightness(1.15). Añadir al CSS de la página donde se use:
background: linear-gradient(135deg, var(--cau-brand-blue) 0%, var(--cau-brand-green) 100%)
