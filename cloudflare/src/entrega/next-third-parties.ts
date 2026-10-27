import { registrarEvento } from './analitica.ts';

// Reemplazo mínimo de `@next/third-parties/google`: no se carga gtag ni se
// llama a Google. Si el código compartido invoca `sendGAEvent`, el evento queda
// en el registro local con la misma forma (`evento`, `datos`), sin red y sin
// tokens. La activación real de Google requiere configuración explícita futura.
export function sendGAEvent(...argumentos: unknown[]): void {
  const [tipo, nombre, datos] = argumentos;
  if (tipo !== 'event' || typeof nombre !== 'string') return;
  registrarEvento(`ga-${nombre}`, datos);
}
