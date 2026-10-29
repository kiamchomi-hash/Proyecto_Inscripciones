import { useEffect, useReducer, type ComponentType } from 'react';

// Reemplazo mínimo de `next/dynamic`. El componente se carga con `import()`
// recién cuando se monta en el cliente —que es cuando se abre un modal— y
// mientras tanto no pinta nada. En el servidor siempre rinde vacío: los modales
// de carrera no forman parte del HTML sin JavaScript, igual que en el sitio
// vigente con `ssr: true` y `loading: null` implícito.
export default function dynamic<P extends object>(
  cargador: () => Promise<{ default: ComponentType<P> }>,
): ComponentType<P> {
  let Cargado: ComponentType<P> | null = null;
  let pedido: Promise<{ default: ComponentType<P> }> | null = null;

  return function Dinamico(props: P) {
    const [, forzar] = useReducer((n: number) => n + 1, 0);
    useEffect(() => {
      if (Cargado) return;
      let vivo = true;
      pedido ??= cargador();
      pedido.then(modulo => {
        Cargado = modulo.default ?? (modulo as unknown as ComponentType<P>);
        if (vivo) forzar();
      }).catch(() => {});
      return () => { vivo = false; };
    }, []);
    return Cargado ? <Cargado {...props} /> : null;
  };
}
