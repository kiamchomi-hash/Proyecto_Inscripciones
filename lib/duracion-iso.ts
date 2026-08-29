/**
 * Convierte la duracion que se carga a mano en `carreras.duracion` a la
 * duracion ISO 8601 que espera schema.org.
 *
 * `timeToComplete` no es texto libre: schema.org lo tipa como Duration, o sea
 * ISO 8601. Hasta el 29/08/2026 se emitia el valor crudo de la base ("2 años"),
 * que cualquier parser descarta; para Google y para los motores generativos era
 * lo mismo que no declararlo. Y no alcanza con traducirlo: la columna es un
 * campo de UI y trae formas que no son una duracion sola.
 *
 * Las tres formas que hay que resolver, todas presentes en la base:
 *
 * - `"2.5 años"` y `"4 años y medio"` son el mismo dato escrito distinto.
 * - `"Título previo + 2 años"` (los CCC) declara un requisito de ingreso y
 *   despues la duracion. Lo que dura *este* programa son los 2 años; el titulo
 *   previo ya lo tiene quien se anota.
 * - `"Título de Abogacía + 1 año (5 años)"` (Escribania) agrega entre
 *   parentesis el total de la carrera completa. Tomar el numero mas grande
 *   seria declarar que el programa dura 5 años, que es falso.
 *
 * De ahi el orden: primero el tramo posterior al ultimo `+`, despues sin
 * parentesis, y recien ahi el numero.
 *
 * Ante cualquier forma que no encaje devuelve `null` y el llamador omite la
 * propiedad. Es la misma politica que ya tenia `"Consultar"`: un dato
 * estructurado es una afirmacion, y no declarar nada es mejor que declarar
 * cualquier cosa.
 */
export function duracionISO(duracion: string | null | undefined): string | null {
  if (!duracion) return null;

  let texto = duracion.toLowerCase();

  // "Título previo + 2 años" -> "2 años". Lo de antes del + es un requisito.
  const masUltimo = texto.lastIndexOf('+');
  if (masUltimo !== -1) texto = texto.slice(masUltimo + 1);

  // "(5 años)" es el total de la carrera completa, no lo que dura el programa.
  texto = texto.replace(/\([^)]*\)/g, ' ');

  const medio = /\by\s+medio\b/.test(texto);

  const m = texto.match(/(\d+(?:[.,]\d+)?)\s*(años?|anios?|meses?|mes|semanas?)/);
  if (!m) return null;

  const cantidad = parseFloat(m[1].replace(',', '.')) + (medio ? 0.5 : 0);
  if (!Number.isFinite(cantidad) || cantidad <= 0) return null;

  const unidad = m[2];

  // Ojo con la enie: "año" no empieza con "an".
  if (/^a/.test(unidad)) {
    const años = Math.floor(cantidad);
    // 2.5 años son 2 años y 6 meses; un P2.5Y no existe en ISO 8601.
    const meses = Math.round((cantidad - años) * 12);
    if (meses === 0) return `P${años}Y`;
    return años === 0 ? `P${meses}M` : `P${años}Y${meses}M`;
  }

  // En meses y semanas no hay fracciones cargadas y no vale inventar como
  // redondearlas: si aparece una, no se declara nada.
  if (!Number.isInteger(cantidad)) return null;
  if (/^m/.test(unidad)) return `P${cantidad}M`;
  return `P${cantidad}W`;
}
