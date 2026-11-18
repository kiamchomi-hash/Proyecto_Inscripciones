/**
 * Alto del navbar fijo, medido en el DOM.
 *
 * `--navbar-height` (estilos/navbar.css) es un `calc()` en `rem` porque el alto
 * sale de las medidas del propio navbar y de la base tipográfica. Eso está bien
 * para el CSS, pero `getComputedStyle().getPropertyValue('--navbar-height')`
 * devuelve el texto del `calc()`, no un número: leerlo con `parseFloat` da
 * `NaN` y cualquier respaldo fijo (60px) vuelve a quedar desalineado en cuanto
 * cambia el navbar. Por eso, para calcular un scroll, se mide la caja real.
 *
 * Devuelve 0 en las páginas de preinscripción, que no montan navbar.
 */
export function altoNavbar(): number {
  if (typeof document === 'undefined') return 0;
  const navbar = document.querySelector('.main-navbar');
  return navbar ? navbar.getBoundingClientRect().height : 0;
}
