# Fondos de Teclab

Para que dos placas de la misma casa no salgan iguales, cambia **dónde cae la
luz**, nunca el decorado: el fondo no ilustra el tema de la carrera (ver
`docs/criterios.md`, «El fondo de una pieza no ilustra el tema»).

Base siempre: navy `#0C1824` en Negocios y Gestión, azul `#0055F0` en
Tecnología, con grano en overlay al 32%. Encima, una de estas luces.

## Usados

| Luz | Pieza | CSS |
|---|---|---|
| Esquinas: azul abajo a la derecha y contraluz arriba a la izquierda (UIverse `mias/pliegue-luz-azul-xai`) | Placa Teclab en Villa Lugano, 23/09/2026 | `aprobados/2026-09-23-placa-teclab-villa-lugano/placa.html` |
| Banda diagonal ancha y difusa, azul con un filo cian | Placa Planificación y Organización de Eventos, 02/10/2026 | abajo |
| Luz desde el pie, ancha, con núcleo cian (CSS abajo, en «Luz desde el pie») | Folleto de Seguros, 04/10/2026 | `en-curso/2026-10-04-folleto-seguros/` |
| Elipses giradas difusas, azul y cian | Lista de carreras para WhatsApp, 25/09/2026 | `aprobados/2026-09-25-lista-carreras-whatsapp/pieza.html` |
| Trama de puntos cian que se apaga desde la esquina superior derecha, con luz azul suave (UIverse `mias/tarjetas-tramadas-azules-replicate`) | Fichas de carrera, versión con el sistema de Siglo 21 en colores de Teclab, 09/10/2026 | abajo, en «CSS de referencia» |
| Cuadrícula cian de 80 px que se apaga hacia los bordes, con brillo azul al centro (UIverse `mias/fondo-cuadricula-luminosa-xai-oscuro`) | Ficha Experiencia del Cliente, versión con el sistema de Siglo 21, 09/10/2026 | `en-curso/2026-10-09-fichas-carreras/experiencia-paso-1-fondo.html` |
| Líneas de barrido cian (UIverse `mias/panel-hud-postura-seguridad-basedash`) con una constelación en dos capas, repartida con distancia mínima entre puntos y el centro atenuado (nodos de `mias/enjambre-nodos-hero-antimetal`) | Ficha Gestión Agraria, versión con el sistema de Siglo 21, 10/10/2026 | `en-curso/2026-10-09-fichas-carreras/agraria-paso-1-combinadas.html`, opción 3 |
| Escalera de píxeles: cuadros de 50 px azules y cian que se apagan desde la esquina inferior derecha (UIverse `mias/fondo-escalera-pixeles-teclab`) | Posteo de presentación de teclab.villalugano, 10/10/2026 | `en-curso/2026-10-10-posteo-presentacion-ig/fondos.mjs`, `pixeles()` |
| Luz a la derecha, detrás de la persona, con núcleo cian abajo; la izquierda queda limpia para el texto | Vista previa del enlace de inscripción (OG 1200×630), 03/10/2026 | `aprobados/2026-10-03-og-inscripcion-teclab/pieza.html` |

```css
.luz-diagonal {
  position: absolute; inset: -10%;
  background: linear-gradient(125deg, transparent 22%, rgb(0 85 240 / 55%) 48%,
    rgb(74 226 231 / 22%) 56%, transparent 78%);
  filter: blur(40px);
}
```

## Guardados para próximas piezas

Aprobados por el usuario y todavía sin usar. Al usar uno, pasarlo a «Usados».

**Recorridos de subte a la Vignelli** (guardado el 10/10/2026, UIverse `mias/fondo-recorridos-vignelli-teclab`): líneas de 16 px que doblan sólo a 45° y 90°, en pares azul y cian, con estaciones de borde blanco, ancladas a los bordes.

**Halo superior con malla** (guardado el 09/10/2026, sale de UIverse `mias/fondo-halo-superior-danielsun`): sol tapado arriba al centro, en azul Teclab, con una malla de 1 px que se apaga hacia abajo.

```css
.halo { position: absolute; inset: 0;
  background: linear-gradient(180deg, #1f5fd6 0%, #123f94 18%, #0e2a5c 38%, transparent 70%);
  mask-image: radial-gradient(60% 120% at 50% -8%, #000 20%, transparent 100%); }
.malla { position: absolute; inset: 0;
  background-image: linear-gradient(rgb(240 240 246 / 6%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(240 240 246 / 6%) 1px, transparent 1px);
  background-size: 54px 54px;
  mask-image: radial-gradient(70% 70% at 50% 10%, #000 10%, transparent 90%); }
```

## CSS de referencia

**Trama de puntos desde la esquina** (usada en las fichas de carrera):

```css
.trama-luz { position: absolute; inset: 0; background: radial-gradient(60% 60% at 100% 0%, rgb(0 85 240 / 35%), transparent 70%); }
.trama { position: absolute; inset: 0;
  background-image: radial-gradient(circle, rgb(74 226 231 / 55%) 1.6px, transparent 2.2px);
  background-size: 18px 18px;
  mask-image: radial-gradient(75% 75% at 100% 0%, #000 0%, rgb(0 0 0 / 35%) 45%, transparent 80%); }
```


**Luz desde el pie** (ya usada, ver arriba): sube ancha desde abajo, detrás
del nombre de la carrera y del aval, con un núcleo cian.

```css
.luz-pie {
  position: absolute; inset: 0;
  background:
    radial-gradient(90% 55% at 50% 112%, #0055F0 0%, rgb(0 85 240 / 45%) 45%, transparent 75%),
    radial-gradient(30% 18% at 50% 104%, rgb(74 226 231 / 45%), transparent 100%);
}
```

## Descartados

- Luz lateral desde la izquierda (02/10/2026): no eligió.
- Pliegue de luz azul a la derecha (`mias/pliegue-luz-azul-xai`, 09/10/2026): «no me gusta para nada».
- Descartados al elegir el fondo de Gestión Agraria (10/10/2026), de una hoja de nueve:
  - halo radial en la esquina (`mias/tarjetas-halo-radial-kraken`);
  - círculos que salen de cuadro, a la manera de Müller-Brockmann;
  - campos de color difusos, a la manera del degradado de Stripe;
  - el isotipo de Teclab como supergráfica recortada;
  - barras que salen del borde (inventado);
  - haces de luz de ventana en diagonal (inventado).
- Bokeh, reflectores de escenario y guirnaldas (02/10/2026): «demasiado raras». Ningún fondo temático.
