# Oficio: lo que hace que se vea bien

Criterios para video institucional o de redes hecho en codigo. No son gustos:
son los errores que aparecen siempre.

## Indice

- [Legibilidad](#legibilidad)
- [Tiempos](#tiempos)
- [Composicion](#composicion)
- [Movimiento y transiciones](#movimiento-y-transiciones)
- [Zonas vacias](#zonas-vacias)
- [Texto en pantalla](#texto-en-pantalla)

## Legibilidad

**Preguntar donde se va a ver la pieza antes de elegir un cuerpo.** Un video para
una pantalla que se mira desde varios metros y uno para un celular a 30 cm no
comparten ni un numero.

La prueba barata: **mirar el still reducido a un cuarto**. Lo que no se lee en la
miniatura no se lee de lejos. Sobre 1080 de alto, para pantalla de sala, un piso
razonable es 34 px para lo mas chico que puede existir, 48-54 para rotulos y
datos, y de 130 para arriba para un titular.

**El cuerpo del titular se calcula, no se fija.** Con un tope unico, una palabra
corta queda diminuta y una larga se sale del cuadro:

```js
fontSize = Math.min(topePorCantidadDeLineas, anchoUtil / (largoDeLaLineaMasLarga * 0.7))
```

El 0,7 es el ancho medio de caracter en una grotesca pesada en caja alta, con
margen para las acentuadas, que son mas anchas.

Otras dos que se pagan caro:

- Una tipografia de un solo peso (muchas display lo son) **no se pone en bold**:
  el navegador la engorda por sintesis y las astas salen sucias.
- En caja alta el tracking negativo pega las letras. Va apenas positivo.

## Tiempos

- **Cuanto tiene que durar una placa: el tiempo de leerla en voz alta, mas aire.**
  Un nombre largo con dos datos no baja de 4 s si se mira de lejos.
- Escalonar la entrada: primero el titular, el dato secundario **un segundo
  despues**. Todo junto no se lee nada.
- Una portada o un logo suelto de 3 o 4 s **no se juzga aislado**: existe para
  presentar lo que viene. Si se esta revisando, revisarlo pegado a lo siguiente.
- Al revisar una escena sola, incluir 1 o 2 s de la siguiente o la transicion de
  salida queda a medio camino.

## Composicion

- **Anclar las alturas, no centrar vertical.** Si la columna esta centrada, una
  fila de datos cae a distinta altura segun el titulo tenga una o dos lineas, y
  entre placa y placa se ve como que los elementos saltan.
- **Texto blanco sobre foto no se sostiene apagando la foto entera**: eso convierte
  todas las escenas en la misma textura indistinguible. Se sostiene con la forma
  del velo: un degradado radial justo debajo de la columna de texto, y una franja
  de piso si hay algo abajo.
- **Un dato se apoya en una regla, no se encierra en un marco.** Los recuadros con
  borde le dan a la pieza aire de formulario.
- Dos datos por placa. Lo que es igual en todas las placas se dice una vez, al
  final, no repetido en cada una robandole lugar a lo que cambia.
- Codigos internos, numeros de resolucion y nomenclaturas no van: nadie los lee
  en pantalla.

## Movimiento y transiciones

- **Transiciones opticas**: luz, desenfoque, empuje de camara, latigazo, iris.
  Las cuadriculas, lamas, cortinas y persianas se leen como efecto de plantilla y
  cortan el video en dos en vez de unirlo.
- **La transicion va encima del final de la escena que sale**, no entre las dos:
  arranca un poco antes del corte y sigue despues. Eso es lo que la hace sentir
  continua.
- **Nada quieto, nada al azar.** Los ciclos de fondo con periodos primos entre si
  no repiten nunca el mismo cuadro; con periodos parejos se nota el loop.
- **Variar el movimiento entre placas hermanas.** Si todas las fotos hacen el
  mismo zoom, seis placas se sienten una sola imagen larga. Elegir el recorrido
  por indice (deterministico), no al azar.
- Un travelling sobre foto se queda cerca de escala 1 y la imagen va con un
  sobrante (`inset: -5%`) para que no aparezca el borde.
- **Algunas fotos no toleran ningun movimiento**: sujeto pegado al borde de
  arriba, y cualquier acercamiento le come la cabeza. Eso se marca en el dato de
  la foto, no en el indice de la lista, para que siga a su imagen cuando el orden
  cambie.

## Zonas vacias

Una escena que **"se siente vacia"** no se arregla con mas texto ni con texto mas
grande. Se arregla con grafica de sistema anclada a los bordes: la composicion
esta centrada y arriba y a los costados queda cuadro crudo.

Que suele entrar ahi:

1. **Rieles o reglas en el margen**, alineados con lo que ya exista en el pie
   (una barra de avance, por ejemplo). Con patas cortas hacia adentro en las
   puntas, que es lo que convierte dos lineas sueltas en un encuadre.
2. **La marca de quien habla**, chica y bajada de opacidad, si la escena dura
   mucho y la marca solo aparece al principio y al final.
3. **Un numeral de indice como marca de agua**, grande y al 8-10%: de lejos se lee
   como ritmo (cuanto falta) sin robarle atencion al titular. Un contador chico no
   hace ni una cosa ni la otra.
4. **Una luz que recorre** alguno de esos elementos, con periodo primo con el de
   los cortes: sin movimiento, una linea recta y quieta se lee como marco de
   plantilla.

Las cinco reglas:

- **Montarlo una vez para todo el bloque**, no adentro de cada placa: si entra con
  cada una, parpadea en cada corte.
- **Anclado a los bordes**, nunca sobre la cara del sujeto de la foto.
- **Que aporte algo que la escena no dice.** El adorno suelto se nota y molesta.
- **Sobre fondo claro una linea fina desaparece**: se sostiene con una sombra
  oscura, no subiendole la opacidad, que sobre fondo oscuro la convierte en un
  cable.
- **Se va con el bloque.** Encima de una placa de cierre limpia, un marco la
  convierte en diapositiva.

## Texto en pantalla

En pantalla va solo lo que le sirve a quien mira. El pendiente, el criterio de
armado, la fuente del dato y cualquier nota de trabajo van en un comentario del
codigo o en el mensaje al usuario, **nunca en los datos que se renderizan**.

Ningun dato se completa a ojo: sale de la fuente que lo manda, y si no hay
fuente, se pregunta. Un numero inventado en un institucional es peor que una
escena de menos.
