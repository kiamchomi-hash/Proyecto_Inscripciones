/** Reloj de base para reservas, cuotas y día de los agregados; nunca del navegador. */
export async function leerRelojBase(db: D1Database): Promise<string> {
  const ahora = await db.prepare("SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now') AS ahora").first<string>('ahora');
  if (!ahora) throw new Error('Reloj de base no disponible.');
  return ahora;
}
