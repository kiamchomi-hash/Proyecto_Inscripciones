/**
 * Motivo visible de un rechazo del ensayo de staging.
 *
 * El formulario de contacto comparte código con producción: el detalle sólo se
 * usa cuando la página trae `<meta name="formularios-detalle">`, que inyecta el
 * wrapper de staging únicamente con la bandera del ensayo encendida. En el sitio
 * vigente ese `<meta>` no existe y el comportamiento no cambia.
 *
 * Los códigos son los del ensayo (`staging/formulario-controlado.ts`) y no
 * llevan valores, correo esperado, tokens, stack ni mensajes del proveedor. El
 * texto sólo dice qué corregir para volver a intentar.
 */

export interface DetalleRechazo {
  error?: string;
  /** Campo del contrato del ensayo; nunca su valor. */
  campo?: string;
}

const GENERICO_DE_VALIDACION =
  'No se pudo validar el pedido del ensayo. Recargá la página y probá de nuevo.';

const POR_CAMPO: Record<string, string> = {
  nombre: 'Para este ensayo, el nombre tiene que ser «Prueba».',
  apellido: 'Para este ensayo, el apellido tiene que ser «Staging».',
  telefono: 'Para este ensayo, dejá el teléfono vacío.',
  localidad: 'Para este ensayo, dejá la localidad vacía.',
  newsletter: 'Destildá «Quiero recibir novedades por mail» para este ensayo.',
  datos: 'Este ensayo sólo acepta el formulario de contacto: sin carrera, tipo, modalidad ni equivalencias.',
};

const POR_CODIGO: Record<string, string> = {
  'contacto-no-autorizado': 'Usá el correo autorizado para este ensayo.',
  'token-faltante': 'Falta la verificación de seguridad: tildá el captcha y volvé a enviar.',
  'CAPTCHA inválido': 'La verificación de seguridad no se completó. Volvé a tildar el captcha.',
  'cupo-ensayo-agotado': 'Este ensayo ya usó su único envío.',
  'formulario-staging-deshabilitado': 'El ensayo está cerrado ahora.',
  'origen-no-autorizado': GENERICO_DE_VALIDACION,
  'campo-no-admitido': GENERICO_DE_VALIDACION,
  'solicitud-invalida': GENERICO_DE_VALIDACION,
  'datos-invalidos': GENERICO_DE_VALIDACION,
};

/** `null` cuando corresponde el texto genérico de siempre. */
export function mensajeRechazoEnsayo(detalle: DetalleRechazo | null | undefined): string | null {
  if (!detalle || typeof detalle !== 'object') return null;
  const codigo = typeof detalle.error === 'string' ? detalle.error : '';
  if (codigo === 'campo-fuera-de-ensayo') {
    const campo = typeof detalle.campo === 'string' ? detalle.campo : '';
    return POR_CAMPO[campo] ?? POR_CAMPO.datos;
  }
  return POR_CODIGO[codigo] ?? null;
}
