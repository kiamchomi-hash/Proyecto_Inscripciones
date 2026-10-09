// Chequeo de la vigilancia sobre el robot de autoinscripciones de Teclab.
//
// El robot corre en un runner propio en la PC de la sede (Cloudflare bloquea al
// portal desde GitHub). Si la PC esta apagada o el runner pierde su registro,
// las autoinscripciones quedan `pendiente` sin que nadie se entere: el robot
// avisa por Telegram cuando falla, pero no puede avisar si nunca corre. Paso
// del 08 al 09/10/2026, un dia entero.
//
// Funcion pura, para poder probarla sin base: la ruta de vigilancia trae las
// filas y esto decide si hay que avisar.

/** Mas que esto ya no es el robot reintentando la localidad de HubSpot (5 min). */
export const MINUTOS_DEMORA_ROBOT = 30;

/**
 * Aviso para Telegram si hay autoinscripciones pendientes hace mas de
 * `MINUTOS_DEMORA_ROBOT`, o null si no hace falta avisar. Sin datos personales:
 * sólo la cantidad y la antigüedad.
 */
export function autoinscripcionesDemoradas(
  pendientes: { created_at: string }[],
  ahora: Date,
): string | null {
  const limite = ahora.getTime() - MINUTOS_DEMORA_ROBOT * 60_000;
  const demoradas = pendientes
    .map(p => Date.parse(p.created_at))
    .filter(t => Number.isFinite(t) && t < limite);
  if (demoradas.length === 0) return null;

  const horas = Math.floor((ahora.getTime() - Math.min(...demoradas)) / 3_600_000);
  const antiguedad = horas >= 1 ? `hace ${horas} h` : `hace más de ${MINUTOS_DEMORA_ROBOT} min`;
  const cuantas = demoradas.length === 1
    ? '1 autoinscripción de Teclab'
    : `${demoradas.length} autoinscripciones de Teclab`;
  return `Hay ${cuantas} esperando al robot (la más vieja, ${antiguedad}). Revisar que la PC de la sede esté prendida y que el runner del robot figure online en GitHub.`;
}
