/**
 * El puente entre un "Inscribite ya" y el formulario que está más abajo en la
 * misma página.
 *
 * Los modales del catálogo no pueden pasarle props al formulario —son ramas
 * distintas del árbol y el catálogo no lo monta—, así que el clic viaja como
 * evento del `window` y el formulario lo escucha. Sin esto, quien pulsa el botón
 * desde la ficha de una carrera aterriza en el buscador vacío y tiene que
 * volver a elegir lo que ya había elegido.
 *
 * En `/carreras/[slug]` no hace falta: ahí la página conoce la carrera y el
 * formulario la recibe por prop (`carreraInicial`).
 */
export const EVENTO_ELEGIR_CARRERA = 'cau:elegir-carrera';

export interface DetalleElegirCarrera {
  /** `id` de la fila de `carreras`, que es lo que el formulario busca en su lista. */
  id: number;
}

export function pedirCarreraEnFormulario(id: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<DetalleElegirCarrera>(EVENTO_ELEGIR_CARRERA, { detail: { id } }),
  );
}

/**
 * La entrada directa a la autoinscripción de Teclab: la ficha de la carrera con
 * `?inscripcion=auto`, que el formulario lee en el navegador (no en el server,
 * así la página sigue siendo estática). La usan «Inscribite ya» de «Ver precio»
 * y el botón «Quiero inscribirme» del mail.
 */
export const PARAMETRO_INSCRIPCION = 'inscripcion';
export const VALOR_AUTOINSCRIPCION = 'auto';

export const urlAutoinscripcion = (slug: string) =>
  `/carreras/${slug}?${PARAMETRO_INSCRIPCION}=${VALOR_AUTOINSCRIPCION}#preinscripcion`;

/** Si la página se abrió en modo autoinscripción. Sólo en el navegador. */
export function pideAutoinscripcion(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get(PARAMETRO_INSCRIPCION) === VALOR_AUTOINSCRIPCION;
}
