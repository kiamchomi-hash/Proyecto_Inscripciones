// Reemplazo de `@vercel/analytics`: conserva la firma y la semántica de los
// eventos, pero no carga el script de Vercel ni manda nada a la red. El registro
// local vive en `analitica.ts`; un proveedor real es una decisión del bloque 6.
export {
  EVENTO_ANALITICA, MAX_EVENTOS, leerEventos, limpiarEventos, registrarEvento, track,
  type EventoAnalitica,
} from './analitica.ts';
