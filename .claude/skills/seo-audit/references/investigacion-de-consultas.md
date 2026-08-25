# Investigación de consultas

Qué buscar cuando hay que decidir sobre qué escribir o qué página reforzar. Sirve
para un sitio que ya tiene tráfico: el punto de partida son los datos propios de
Search Console, no una herramienta de pago.

## Intención antes que volumen

Una consulta no vale por cuántos la escriben sino por qué esperan encontrar. Hay
cuatro intenciones y cada una pide otro tipo de página:

| Intención | Qué escribe la persona | Qué página gana |
|---|---|---|
| Navegacional | el nombre de una marca | el sitio oficial de esa marca, casi siempre |
| Informativa | "qué es", "cómo", "cuánto dura" | artículo o explicación |
| Comparativa | "mejor", "vs", "opciones" | comparativa o listado |
| Transaccional | "precio", "inscripción", "comprar" | ficha o landing con acción |

**La navegacional es la trampa.** Trae muchas impresiones y casi ningún clic
cuando la marca buscada no es la propia: la persona ve el dominio oficial arriba
y saltea todo lo demás, esté quinto o esté noveno. Un informe que no separa esas
consultas del resto va a señalar como "problema de título" lo que es un techo de
intención, y va a mandar a reescribir metadatos que ya están bien.

Cómo separarlas: una expresión regular con los nombres de marca del rubro, y
medir los dos grupos por separado (clics, impresiones, CTR y posición). Si el
grupo de marca se lleva la mayoría de las impresiones y clickea a una fracción de
lo que la curva de CTR predice, el crecimiento no está ahí.

## La curva de CTR se calibra, no se copia

Las tablas públicas de CTR por posición son de búsquedas informativas en inglés y
en mercados grandes. Aplicadas de plano a un sitio chico exageran todo.

En vez de inventar una curva por intención, medir el desvío contra la que ya se
usa: para cada fila de `consulta × página`, calcular los clics que la curva
predeciría (`ctrEsperado(posición) × impresiones`) y compararlos con los clics
reales. El cociente es el factor de ese grupo. Recalcularlo en cada corrida, con
límites para que un período flaco no dé un número absurdo.

Después, el CTR esperado de una página es la mezcla de sus dos factores, pesada
por qué proporción de sus impresiones es de marca.

Ojo con el tamaño de muestra: Search Console anonimiza las consultas raras, así
que las filas nombradas cubren una fracción de las impresiones del período. Como
lo anonimizado es cola larga, y la cola larga es más genérica que de marca, el
share de marca calculado así es un techo, no un valor exacto.

## Dónde están las consultas que faltan

1. **Las propias, fuera del top 10.** Search Console las tiene: consultas donde
   ya aparecemos entre la 10 y la 30. Google ya decidió que la página es
   relevante; falta empujarla. Es la lista más corta y más rentable.
2. **Agrupadas por página, no sueltas.** Tres consultas distintas cayendo en la
   misma página y todas fuera del top 10 es una señal distinta de una consulta
   suelta: hay demanda con nombre propio y la página no llega. Eso se arregla con
   contenido y enlaces, no con el título.
3. **Las del competidor.** Mirar por qué consultas rankea quien está primero y
   anotar las que uno no tiene. No las obvias: las variantes que uno no había
   pensado, que son las que no tienen competencia.
4. **Las páginas del competidor, no sus consultas.** Qué otras páginas tiene y
   qué reciben. Ahí aparecen los temas que uno ni sabía que existían.

## Igualar y superar

Antes de escribir, mirar qué está rankeando hoy para esa consulta y qué tiene esa
página. La regla es sencilla: si lo que uno va a publicar no es mejor que lo que
ya está primero, no hay motivo para que Google lo suba. "Mejor" casi nunca
significa más largo; significa que responde antes, con datos que el otro no
tiene, o desde una posición que el otro no puede ocupar.

## Canibalización

Dos páginas propias apuntando a la misma consulta se estorban: Google no sabe
cuál mostrar, alterna, y las dos bajan. Una consulta principal por página. Si dos
páginas cubren el mismo tema, la de menos tráfico se redirige a la otra con 301 y
se saca del sitemap.

Detectarla es fácil con los datos propios: agrupar por consulta y ver si aparecen
dos URLs distintas recibiendo la misma.

## Nichos que no conviene tomar

- Consultas donde los primeros diez son todos dominios enormes del rubro y
  ninguno es una página débil.
- Consultas con volumen alto y cero intención de hacer algo.
- Consultas donde la respuesta cabe en el propio resultado de Google: nadie
  entra.
