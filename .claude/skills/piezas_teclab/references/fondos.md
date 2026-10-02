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

**Luz desde el pie** (guardada el 02/10/2026): sube ancha desde abajo, detrás
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
- Bokeh, reflectores de escenario y guirnaldas (02/10/2026): «demasiado raras». Ningún fondo temático.
