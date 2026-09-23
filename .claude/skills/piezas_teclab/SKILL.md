---
name: piezas_teclab
description: "Disparador: folleto, afiche, placa, flyer, banner, historia o posteo de Teclab. Copia el sistema visual de las piezas oficiales de Teclab: paleta, Poppins, composiciones y recursos."
license: Apache-2.0
metadata:
  author: "kiamchomi-hash"
  version: "1.0"
---

## Cuándo se usa

Toda pieza gráfica de Teclab: folleto, afiche, placa de WhatsApp, posteo, historia o banner. Va junto con `lienzo-de-diseno`, que fija el proceso de seis pasos, y con `piezas-para-el-publico`, que fija el texto. Esta skill decide la **marca**; las otras dos, el **proceso** y el **texto**.

## Reglas fijas

- **Se copia el sistema oficial, no se inventa otro.** Viene de las piezas que Teclab reparte a sus asesores: la Zona de Descargas del Dashboard Comercial (`informacion.teclab.edu.ar`, con login) se copió en `contenidos/teclab/oficial/` del proyecto del sitio. Ahí también van los afiches de Teclab hechos por otras personas; los que el usuario elige como referencia están en `contenidos/teclab/aprobados/`.
- **Paleta, medida con cuentagotas sobre las piezas oficiales:**
  | Rol | Hex |
  |---|---|
  | Azul Teclab: logo, fondos plenos, bordes de píldora | `#0055F0` |
  | Navy: fondo oscuro, texto sobre claro | `#0C1824` |
  | Cian: píldora del nombre de carrera, CTA | `#4AE2E7` |
  | Menta: resaltador (sólo en el cross-sell con Siglo 21) | `#78FCBA` |
  | Blanco y gris claro `#F0F0F6` | texto sobre foto, papel |
- **El violeta `#8E2CF2` y el cian `#2EE7D7` del sitio no son de Teclab.** Salieron del render de Remotion y los usa el modal del sitio. En una pieza de Teclab no van.
- **Tipografía: Poppins**, que es la fuente de marca de sus presentaciones. Titulares en Bold/SemiBold con interlineado cerrado (~1.0), bajadas en Regular y el remate en *Italic* («sos *imprescindible*»). Esto reemplaza en Teclab a la Inter 900 que `lienzo-de-diseno` fija para las demás piezas. Unbounded sigue vetada.
- **Logo:** siempre el original (`contenidos/teclab/oficial/LOGOS TECLAB/`), con «INSTITUTO TÉCNICO SUPERIOR» debajo. Blanco sobre foto o navy, color sobre claro. No se redibuja.
- **Foto real, nunca ilustración:** una persona joven con notebook o celular, luz cálida de interior y oscurecida para que el texto blanco se lea. Se toman de `PAUTA 1A 2026/` o `PAUTA - IMAGENES TECLAB/`.
- **Aval:** los escudos del Ministerio de Educación (Ciudad y Nación) al pie, en blanco. Si nombra una empresa cocreadora (AWS, Google, Microsoft, HubSpot, Avenga, Zendesk), va su logo real.
- **Descuentos:** la cifra es el elemento más grande de la pieza («15% off») y la condición va debajo en Bold chico.

## Qué composición usar

| Pieza | Composición (detalle en `references/composiciones.md`) |
|---|---|
| Presentación de una carrera | A: Placa de carrera |
| Promo o descuento | B: Foto a sangre con marco fino |
| Campaña de marca o awareness | C: Titular sobre foto |
| Folleto impreso con toda la oferta | D: Folleto de listado |
| Cross-sell Teclab → Siglo 21 | E: Papeles clavados |
| Diferencial sin foto | F: Pleno azul |

## Pasos

1. Leé `references/composiciones.md` y abrí la carpeta de origen de la composición elegida. Mirá por lo menos tres piezas reales antes del paso 1 de `lienzo-de-diseno`.
2. En cada paso de ese proceso, decí de qué pieza oficial sale la decisión (carpeta y archivo).
3. Antes de mostrar, compará lado a lado con la pieza oficial más parecida: paleta, peso del titular, lugar del logo y del pie.

## Qué entregás

La pieza, más una línea por decisión que diga de qué pieza oficial salió.

## Referencias

- `references/composiciones.md`: las seis composiciones, con medidas y carpetas de origen.
