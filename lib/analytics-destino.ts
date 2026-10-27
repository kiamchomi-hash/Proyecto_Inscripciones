// Destino de los eventos de conversión que arma `lib/analytics.ts`.
//
// La app Next de `app/` ya no publica: acá no hay destino. El Worker de
// Cloudflare reemplaza este módulo por su registrador local
// (`cloudflare/src/entrega/analitica.ts`) con un alias del build, así que la
// firma es el contrato que los dos tienen que respetar.
export const track: (evento: string, propiedades?: Record<string, unknown>) => void = () => {};
