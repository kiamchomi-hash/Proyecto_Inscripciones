/** Mensaje de Telegram para una visita que cargó la ficha pública de una carrera. */
export function buildAperturaDirectaMessage({ carrera, url, fecha }: {
  carrera: string;
  url: string;
  fecha?: Date;
}): string {
  const momento = (fecha ?? new Date()).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return [
    '🔗 *Apertura directa de carrera*',
    '',
    `🎓 *Carrera:* ${carrera}`,
    `🌐 *URL:* ${url}`,
    `🕐 *Fecha:* ${momento}`,
  ].join('\n');
}
