/**
 * IP de confianza para los endpoints de telemetría y alertas.
 *
 * `cf-connecting-ip` la escribe el borde de Cloudflare antes de que el pedido
 * llegue al Worker; el cliente no puede fijarla. `x-forwarded-for` y
 * `x-real-ip` sí son cabeceras del pedido y por eso **no se usan acá**: aceptar
 * la primera convierte el rate limit en un adorno. Si el borde no la entregó
 * —por ejemplo, en una invocación directa del harness— se agrupa todo en
 * `unknown` y se falla cerrado, sin inventar una IP ni confiar en el cliente.
 */
export function ipConfiable(request: Request): string {
  return request.headers.get('cf-connecting-ip')?.trim() || 'unknown';
}
