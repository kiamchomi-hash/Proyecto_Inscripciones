---
name: piezas_teclab2
description: "Disparador: pieza de Teclab con el estilo de la pauta 1A, «Recibite en», panel azul y papel gris, o foto en blanco y negro. Copia ese segundo sistema visual de Teclab."
license: Apache-2.0
metadata:
  author: "kiamchomi-hash"
  version: "1.0"
---

## Cuándo se usa

Una pieza de Teclab que tiene que verse como la **campaña de leads 1A** («Recibite en Seguros.», «Título Oficial de Data Science en 2 años.», «¿Ese trabajo no es lo tuyo?»). Es **otro estilo** que el de `piezas_teclab` (navy con foto cálida y Poppins Bold): acá manda el azul pleno, el papel gris claro, Poppins Medium y la foto en blanco y negro. Si el pedido no nombra un estilo, se usa `piezas_teclab`, y este se ofrece como alternativa.

Va junto con `lienzo-de-diseno` (proceso), `piezas-para-el-publico` (texto) y `remotion` si es video. De `piezas_teclab` se heredan el logo, el aval, la regla de las fotos de personas y la prohibición del violeta y el cian del sitio.

## Reglas fijas

- **Paleta, medida con cuentagotas sobre `Seguros_Teclab_Leads_1A_4-5_1.png`:**
  | Rol | Hex |
  |---|---|
  | Azul pleno: panel, bajada, contorno del botón, logo | `#0056F3` |
  | Papel: la mitad de abajo | `#EDEDED` |
  | Texto sobre azul | `#EDEDED`, no blanco puro |
  | Línea de los triángulos y de los íconos | cian `#4AE2E7` al ~70% |
  | Franja oscura (sólo en la composición con foto) | navy `#111A29` |
- **Tipografía: Poppins Medium** en titular y bajada, con interlineado ~1.1 y **punto final** en el titular («Recibite en Seguros.»). Regular para los beneficios. Nada de Bold ni de caja alta: lo que lo separa del otro estilo es justamente el peso medio.
- **Fotos en blanco y negro**, una persona sola, recortada contra el borde derecho. Nunca color.
- **Triángulos de línea**, nunca rellenos: uno grande que sale por arriba a la izquierda, detrás de la fila de beneficios, y dos apilados chicos sobre el borde derecho, a la altura del titular. Son el play del logo.
- **El CTA es una píldora de contorno** azul de 2 px con el texto azul («Recibite en teclab.edu.ar»), sobre el papel. No es un botón sólido; si la pieza lleva WhatsApp, el botón de WhatsApp sigue la regla de `piezas-para-el-publico` (sólido, verde de la plataforma).
- **Pie fijo** sobre el papel: logo de Teclab color a la izquierda y los dos escudos del Ministerio de Educación (Ciudad y Nación) en azul a la derecha.

## Qué composición usar

| Pieza | Composición (detalle en `references/composiciones.md`) |
|---|---|
| Carrera, sin foto | A: panel azul arriba y papel abajo |
| Carrera o pregunta con persona | B: panel azul a la izquierda, foto B/N a la derecha |
| Cierre de carrusel, empresas cocreadoras | C: papel con titular azul y píldora azul de logos |

## Pasos

1. Leé `references/composiciones.md` y abrí por lo menos tres piezas de origen en `contenidos/teclab/oficial/PAUTA - IMAGENES TECLAB/` (los nombres con `1A`).
2. En cada paso de `lienzo-de-diseno`, decí de qué pieza 1A sale la decisión.
3. Antes de mostrar, compará lado a lado con la pieza 1A más parecida: proporción del panel, peso del titular, triángulos y pie.

## Qué entregás

La pieza, más una línea por decisión que diga de qué pieza 1A salió.

## Referencias

- `references/composiciones.md`: las tres composiciones, con medidas y archivos de origen.
- `../piezas_teclab/references/recursos.md`: el resaltador y las flechas, que sirven en los dos estilos.
