# Campañas de Instagram para inscripciones — diseño (23/11/2026)

## Objetivo y alcance

Convertir la pauta orgánica en un canal medible de inscripciones para el CAU Villa Lugano, partiendo de las condiciones reales del usuario:

- Objetivo: **inscripciones** (no sólo tráfico ni consultas genéricas).
- Cuenta: **Instagram personal**, sin Business Manager, sin pixel y sin API de conversiones.
- Formato: **promoción de una publicación ya hecha** desde la app de Instagram.
- Presupuesto: **hasta $5.000 por día**, ventana inicial de **3 a 5 días**.
- Regla operativa: **una publicación activa a la vez**. Se pausa antes de activar la siguiente.

Esto no es una campaña de Meta Ads: no se puede optimizar a conversión ni hacer retargeting. La medición es por código, no por cookie.

## Destino de cada publicación

Cada publicación promocionada tiene **un solo destino**, definido antes de activarla:

| Tipo de publicación | Destino |
| --- | --- |
| Oferta general de Teclab | `/teclab` |
| Una carrera concreta | el `/carreras/<slug>` de esa carrera, o el WhatsApp de la sede con el código en el texto |

La persona que atiende el WhatsApp ve el código en el mensaje precargado y puede cotejar las inscripciones a mano. No se inventa texto publicitario: el código es un rótulo de seguimiento, no copy.

## Medición

Se agrega una dirección corta del sitio: `/ir/<codigo>`.

- El código es interno, con formato cerrado (por ejemplo `IG-01`).
- El botón o enlace de la publicación apunta a esa dirección, no directo al destino final.
- La dirección registra el clic y redirige al destino declarado para ese código.
- El registro va en una tabla nueva de D1, agregada por día, código, destino y dispositivo: `campanas_clics(fecha, codigo, destino, movil, veces)`. No guarda mail, teléfono ni identificadores de visita.
- `npm run leads` muestra una sección nueva con clics por código, para comparar una publicación contra la siguiente.

No se tocan la tabla `consultas`, los precios ni los formularios. La atribución de la inscripción se coteja con el código del WhatsApp o con la ventana de la prueba, no con un campo nuevo en el lead.

## Seguridad y errores

- Los códigos y sus destinos se declaran en un archivo del Worker. Un código no declarado da 404 con `noindex, follow`, nunca una redirección abierta.
- Sólo se permiten destinos del propio sitio (`/teclab`, `/carreras/<slug>`) y el número de WhatsApp conocido de la sede.
- Si la escritura en D1 falla, la redirección igual ocurre: la medición no puede romper la campaña.
- La dirección `/ir/*` queda fuera del sitemap y con `noindex`.

## Operación

1. Elegir una publicación real del Instagram del usuario. No se escribe copy nuevo desde el agente.
2. Asignar el siguiente código y declarar su destino.
3. Configurar el botón de promoción de Instagram para que apunte a `/ir/<codigo>`.
4. Pautar una sola publicación por ventana de 3 a 5 días, con tope diario de $5.000.
5. Leer `npm run leads`, decidir si esa publicación continúa o se reemplaza, y recién entonces activar la siguiente.
6. La zona (radio desde Villa Lugano, CABA o AMBA), la edad y los intereses los define el usuario. El sistema no los infiere.

## Verificación

- Pruebas unitarias: validación de códigos, lista blanca de destinos, agregado del contador y comportamiento ante fallo de base.
- Prueba del endpoint en local con un código de prueba, confirmando el `Location` y el `X-Robots-Tag`.
- Corrida de `npm run leads` con datos sintéticos para ver la sección nueva.
- Sin capturas nuevas del sitio: el cambio es de backend y de informe, no visual.

## Fuera de alcance

- Business Manager, pixel, API de conversiones, públicos personalizados y retargeting.
- Escribir o aprobar textos de las publicaciones.
- Modificar aranceles, formularios, mensajes comerciales ni la tabla `consultas`.

## Enlaces consultados

Ver [`referencias/2026-11-23-campanas-instagram.md`](../../referencias/2026-11-23-campanas-instagram.md).
