import { PASOS_FICHA_TECLAB, PASOS_MODAL_TECLAB } from '../../../lib/teclab-embudo.ts';

/**
 * Recorrido de Teclab del día, para el resumen diario de Telegram.
 *
 * Es lo mismo que la sección «Recorrido de Teclab» de `npm run leads`, en
 * corto para leer en el celular: por superficie (modal de la home y ficha), a
 * qué paso llegaron, dónde se fueron sin escribir y desde dónde tocaron cada
 * CTA, más las carreras con más entradas. Sin actividad no hay mensaje.
 */

export interface FilaEmbudoTeclab {
  superficie: string;
  carrera: string;
  evento: string;
  paso: string;
  movil: number;
  veces: number;
}

export async function leerEmbudoTeclabDia(db: D1Database, fecha: string): Promise<FilaEmbudoTeclab[]> {
  return (await db.prepare(
    'SELECT superficie, carrera, evento, paso, movil, veces FROM teclab_embudo WHERE fecha = ?1',
  ).bind(fecha).all<FilaEmbudoTeclab>()).results;
}

const escapar = (texto: string): string => texto.replace(/([_*\[\]`])/g, '\\$1');

const largo = (fecha: string): string => {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
};

const SUPERFICIES = [
  {
    clave: 'modal', titulo: 'Modal de la home', unidad: ['apertura', 'aperturas'],
    pasos: PASOS_MODAL_TECLAB as readonly string[],
    ctas: [['whatsapp', 'WhatsApp'], ['inscripcion', 'Inscribirse']],
  },
  {
    clave: 'ficha', titulo: 'Ficha de la carrera', unidad: ['visita', 'visitas'],
    pasos: PASOS_FICHA_TECLAB as readonly string[],
    ctas: [['whatsapp', 'WhatsApp'], ['inscripcion', 'Inscribirse'], ['consulta', 'Consulta enviada'], ['relacionada', 'Otra carrera']],
  },
] as const;

export const TOP_CARRERAS_TECLAB = 3;

/** `null` si ese día no hubo ninguna visita medida. */
export function construirDigestTeclab(fecha: string, filas: FilaEmbudoTeclab[]): string | null {
  const bloques: string[] = [];
  for (const sup of SUPERFICIES) {
    const propias = filas.filter(f => f.superficie === sup.clave);
    const suma = (filtro: (f: FilaEmbudoTeclab) => boolean) =>
      propias.filter(filtro).reduce((total, f) => total + f.veces, 0);
    const entradas = suma(f => f.evento === 'alcanzado' && f.paso === 'portada');
    if (!propias.length) continue;
    const movil = suma(f => f.evento === 'alcanzado' && f.paso === 'portada' && f.movil === 1);

    // «paso 12 › paso 8»: sólo los pasos que tuvieron algo, en el orden de la pantalla.
    const porPaso = (evento: string) => sup.pasos
      .map(paso => [paso, suma(f => f.evento === evento && f.paso === paso)] as const)
      .filter(([, n]) => n > 0);
    const lista = (pares: (readonly [string, number])[], separador: string) =>
      pares.map(([paso, n]) => `${paso} ${n}`).join(separador);

    const lineas = [`*${sup.titulo}*: *${entradas}* ${entradas === 1 ? sup.unidad[0] : sup.unidad[1]} (${movil} desde el celular)`];
    const llegaron = porPaso('alcanzado');
    if (llegaron.length) lineas.push(`Llegaron: ${lista(llegaron, ' › ')}`);
    const cerrados = porPaso('cerrado');
    if (cerrados.length) lineas.push(`Se fueron sin escribir: ${lista(cerrados, ', ')}`);
    for (const [evento, rotulo] of sup.ctas) {
      const desde = porPaso(evento);
      if (desde.length) lineas.push(`${rotulo}: ${lista(desde, ', ')}`);
    }

    const porCarrera = new Map<string, { entradas: number; whatsapp: number }>();
    for (const f of propias) {
      const c = porCarrera.get(f.carrera) ?? { entradas: 0, whatsapp: 0 };
      if (f.evento === 'alcanzado' && f.paso === 'portada') c.entradas += f.veces;
      if (f.evento === 'whatsapp') c.whatsapp += f.veces;
      porCarrera.set(f.carrera, c);
    }
    const top = [...porCarrera]
      .filter(([, c]) => c.entradas > 0)
      .sort((a, b) => b[1].entradas - a[1].entradas || a[0].localeCompare(b[0]))
      .slice(0, TOP_CARRERAS_TECLAB)
      .map(([carrera, c], i) => `${i + 1}. ${escapar(carrera)} — *${c.entradas}* (WhatsApp ${c.whatsapp})`);
    if (top.length) lineas.push(top.join('\n'));

    bloques.push(lineas.join('\n'));
  }
  if (!bloques.length) return null;
  return `🎯 *Recorrido de Teclab del ${largo(fecha)}*\n\n${bloques.join('\n\n')}`;
}
