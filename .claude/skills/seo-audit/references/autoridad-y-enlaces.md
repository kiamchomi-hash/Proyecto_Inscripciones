# Autoridad y enlaces

La parte que casi ningún checklist de auditoría cubre y que suele ser la que
explica por qué un sitio con todo bien hecho sigue en la posición 20.

## Cómo se reparte el valor de un enlace

Un enlace entrante es un voto, pero los votos no pesan igual:

- **La autoridad del dominio que enlaza es logarítmica.** Un dominio fuerte vale
  muchísimo más que varios débiles, no un poco más.
- **El valor se reparte entre todos los enlaces salientes de esa página.** Un
  enlace desde una página con doscientos enlaces salientes vale poco aunque el
  dominio sea enorme. Por eso los directorios y los agregadores rinden mucho
  menos de lo que su autoridad sugiere.
- **Un enlace dentro del texto vale más que uno en el pie o en una barra
  lateral**, que se repiten en todo el sitio y Google los descuenta.

## Enlazado interno: lo único que se controla del todo

Es la única palanca de autoridad que no depende de que un tercero acepte algo, y
por eso es la primera que hay que revisar.

- **Los enlaces internos reparten autoridad y le explican a Google de qué trata
  cada página.** Un bloque de "contenido relacionado" que elige al azar reparte
  autoridad pero no explica nada. Enlazar a lo que tiene que ver con la página es
  lo que convierte el bloque en una señal.
- **Ninguna página puede quedar en cero enlaces entrantes.** Una URL huérfana, o
  con dos o tres entradas, puede quedarse años en "descubierta, sin rastrear"
  aunque esté en el sitemap.
- **Cuidado al cambiar el criterio de selección.** Si un bloque pasa de elegir
  por rotación a elegir por tema, hay que simular el grafo resultante y contar
  los enlaces entrantes de cada página antes de publicar: es fácil dejar
  huérfana a una página que sólo recibía enlaces por el turno que se acaba de
  eliminar. Contar mínimo, máximo y cuántas quedan en cero, con el algoritmo
  viejo y con el nuevo.
- **El texto del enlace importa**, pero sin exagerar: si las cien entradas a una
  página usan la misma frase exacta, se lee como manipulación.

## Conseguir enlaces externos

Las tácticas que funcionan para un producto de software casi nunca se trasladan a
una institución local. Lo que sí se traslada:

**Tener algo que merezca el enlace.** Nadie enlaza a una página mediocre. Antes
de salir a pedir enlaces conviene que la página valga el enlace, porque casi
todas las tácticas siguientes consisten en pedirle a alguien que reemplace o
agregue un recurso, y eso sólo funciona si el propio es mejor.

**Robo de enlaces.** Buscar quién enlaza al competidor que está primero, abrir
esas páginas, encontrar las que lo mencionan y a uno no, y escribirle a quien la
escribió. Funciona porque esa persona ya demostró que escribe sobre el tema.

**Casos y testimonios.** Cualquier proveedor, socio o plataforma que uno use con
gusto suele querer casos de clientes en su sitio, con enlace. Es un intercambio
directo y con alta tasa de aceptación. Conviene apuntar a los que todavía tienen
pocos casos publicados, no a los más grandes.

**Prensa y medios locales.** Para un sitio con anclaje geográfico esto reemplaza
a las redes de periodistas internacionales: medios de barrio, boletines
institucionales, sitios de la comuna, escuelas de la zona. La autoridad es más
baja que la de un medio grande, pero la relevancia local es alta y la competencia
por ese enlace es casi nula.

**Contacto manual, uno por uno.** Aburrido y efectivo. La condición es que tenga
sentido para quien recibe el mensaje: escribirle a alguien que ya escribió sobre
el tema, ofreciéndole algo concreto. Mandar el mismo mensaje a cien direcciones
quema el nombre y no trae nada.

## Lo que no hay que hacer

- Comprar paquetes de enlaces. Se detectan y el daño es difícil de revertir.
- Intercambios masivos de enlaces entre sitios propios.
- Enlaces desde páginas que existen sólo para enlazar.

## Los enlaces también deciden qué dice la IA

Cuando alguien le pregunta a un asistente por el mejor X, el asistente busca y
lee las páginas que rankean. Si el sitio propio está mencionado y enlazado en
esas páginas, aparece en la respuesta. Es la misma inversión con dos retornos, y
es un argumento más para priorizar menciones en páginas que ya rankean antes que
enlaces sueltos en sitios que no los tiene nadie.

## Seguimiento

Una vez por mes: contar enlaces nuevos únicos, propios y de dos o tres
competidores, filtrando dominios de baja calidad. Lo que importa no es el total
sino el ritmo: quien acumula más rápido termina arriba aunque hoy esté abajo.
