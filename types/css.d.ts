// Vite permite importar hojas de estilo desde módulos TS. `deferred-enrollment-form.tsx`
// importa `formulario-lead.css` de forma dinámica para que viaje con el chunk
// del formulario en lugar de bloquear el primer pintado de la ficha.
declare module '*.css';
