/**
 * Comportamiento de los desplazamientos que se piden por JS (`scrollTo`,
 * `scrollIntoView`, `scrollBy`). La regla global de `prefers-reduced-motion`
 * en globals.css apaga `scroll-behavior` de CSS, pero un `behavior: 'smooth'`
 * pasado por JS le gana: con movimiento reducido, el salto va directo.
 */
export function comportamientoScroll(): ScrollBehavior {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'smooth';
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}
