/**
 * Modo demo de formularios: recorrer en local todos los pasos de la
 * preinscripción sin captcha y sin escribir nada. Lo usan el widget de
 * Turnstile y `POST /api/formularios`.
 *
 * Sólo vale con `NODE_ENV === 'development'`: en producción (y en los tests,
 * que corren con `NODE_ENV=test`) la bandera no cambia nada aunque esté en `1`.
 *
 * Las dos variables se leen con su nombre literal, `process.env.X`: es lo que
 * Next reemplaza en el bundle del navegador. Leerlas de otra forma (por
 * ejemplo, desestructurando `process.env`) deja la bandera siempre apagada en
 * el cliente.
 */
export function formulariosDemoActivo(): boolean {
  return process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_FORMULARIOS_DEMO === '1';
}

// Va también por defecto: el widget lo importa así, como el resto de sus
// dependencias de componentes, y los tests que lo montan con dependencias
// simuladas sólo le dan un `default`.
export default formulariosDemoActivo;

/** El token que entrega el widget en modo demo. El endpoint no lo verifica. */
export const TOKEN_DEMO = 'demo';
