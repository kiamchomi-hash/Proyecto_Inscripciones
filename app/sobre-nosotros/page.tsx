// Shim del cascarón Next: la página vive en `paginas/` porque el Worker la
// importa. Next la sigue sirviendo desde acá para que la prueba de paridad
// tenga contra qué comparar. Se va con el resto de `app/` cuando se retire.
export { default, metadata } from '@/paginas/sobre-nosotros';
