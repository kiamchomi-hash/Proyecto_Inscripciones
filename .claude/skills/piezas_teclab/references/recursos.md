# Recursos de relleno de Teclab

Para los huecos que quedan entre dos bloques: gráfica en la paleta, nunca texto
ni un dibujo del rubro. Aprobados por el usuario; al usar uno, anotar la pieza.

## Trama de puntos

Grilla de puntos cian que se apaga hacia el lado del texto y lleva el ojo hacia
el bloque siguiente. Se mide el hueco real en la página y se centra ahí, con
un ancho múltiplo de 16 px.

Usada en: placa Planificación y Organización de Eventos (02/10/2026), entre
la bajada y la píldora de la familia.

```css
.trama {
  position: absolute; width: 128px; height: 52px;
  background-image: radial-gradient(circle, #4AE2E7 0 2px, transparent 2.5px);
  background-size: 16px 16px; background-position: 0 2px; opacity: .7;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000);
  mask-image: linear-gradient(90deg, transparent, #000);
}
```

## Flechas de la marca (guardada, sin usar)

El triángulo de play del logo de Teclab repetido tres veces, cada vez más
opaco, apuntando hacia lo que sigue. Guardada el 02/10/2026.

```html
<svg width="120" height="32" viewBox="0 0 120 32" aria-hidden="true">
  <path d="M4 4 L22 16 L4 28Z" fill="#4AE2E7" opacity=".25"/>
  <path d="M44 4 L62 16 L44 28Z" fill="#4AE2E7" opacity=".5"/>
  <path d="M84 4 L102 16 L84 28Z" fill="#4AE2E7" opacity=".9"/>
</svg>
```

## Resaltador (guardado, sin usar)

Una franja de color detrás de **una sola línea** del titular, para marcar la
frase que importa. Sale de las piezas oficiales de pauta de Seguros
(`oficial/PAUTA - IMAGENES TECLAB/asesor-de-seguros_4.png`, «NOS DA
TRANQUILIDAD», y `asesor-de-seguros_Teclab_16-9_1.png`, «PRODUCTOR ASESOR DE
SEGUROS»). Guardado el 18/10/2026: el usuario lo marcó como buen recurso.

- Color: cian `#49E4E8` (el `#4AE2E7` de la paleta) con texto navy `#111A29`;
  o blanco con texto navy. Sobre fondo navy.
- Titular en **Poppins Black, caja alta**. Alto de la franja ≈ 1,2 veces la
  altura de las mayúsculas, casi al ras del texto (medido: 68 px de franja para
  57 px de texto), y ~0,25 em de aire a cada lado.
- Una franja por renglón, cada una del largo de su línea: no un bloque parejo.
- Una o dos líneas resaltadas por pieza, nunca el titular entero.

```css
.resaltado { display: inline; background: #4AE2E7; color: #111A29;
  padding: .02em .25em; box-decoration-break: clone; -webkit-box-decoration-break: clone;
  font: 900 1em/1.2 Poppins, sans-serif; text-transform: uppercase; }
```

## Descartado

- Riel: línea fina con un punto al inicio, de la bajada a la píldora (02/10/2026).
