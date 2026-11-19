# Precarga de tipografía de fichas

- [Modern Web Guidance](https://github.com/GoogleChrome/modern-web-guidance): precargar sólo las fuentes críticas, con `as="font"`, su tipo WOFF2 y `crossorigin` aun en el mismo origen.
- [MDN: `font-display`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display): se conserva `swap`; se descartó `optional` porque puede dejar la fuente de reemplazo durante la visita.
