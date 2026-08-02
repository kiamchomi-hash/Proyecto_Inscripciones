// Serializa datos estructurados para meterlos en un <script type="application/ld+json">.
//
// JSON.stringify no escapa el signo menor, y dentro de un <script> el navegador
// corta el bloque en cuanto ve la secuencia de cierre, sin importar que este
// adentro de una cadena JSON. Como los schemas se arman con contenido de la
// base -el titulo de una FAQ nace en el formulario publico, el nombre de una
// carrera se carga a mano- alcanzaria con un cierre de script ahi para terminar
// el tag antes de tiempo y dejar el resto del HTML a merced de quien escribio
// el texto.
//
// Escaparlo como < lo resuelve entero: al parsearse sigue siendo el mismo
// string, pero ya no hay forma de escribir un cierre de script ni un <!--
// literal. U+2028 y U+2029 van de yapa: son legales dentro de JSON pero rompen
// a cualquier consumidor que evalue el bloque como JavaScript.
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
