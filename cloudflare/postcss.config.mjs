// Tailwind v4 procesa el CSS compartido (`estilos/globals.css`). El paquete no
// declara Tailwind como dependencia propia a propósito: el sitio vigente ya lo
// tiene instalado en la raíz y acá sólo se lo usa como procesador de build.
// Si la raíz se queda sin `@tailwindcss/postcss`, el build falla acá en vez de
// emitir CSS sin utilidades. El tiempo de ejecución no depende de este archivo.
import { createRequire } from 'node:module';

const requerir = createRequire(import.meta.url);

export default {
  plugins: {
    [requerir.resolve('@tailwindcss/postcss')]: {},
  },
};
