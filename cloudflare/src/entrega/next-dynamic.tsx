import { useEffect, useReducer, type ComponentType } from 'react';

// Reemplazo mínimo de `next/dynamic`. El componente se carga con `import()`
// recién cuando se monta en el cliente —que es cuando se abre un modal— y
// mientras tanto no pinta nada. En el servidor siempre rinde vacío: los modales
// de carrera no forman parte del HTML sin JavaScript, igual que en el sitio
// vigente con `ssr: true` y `loading: null` implícito.
export default function dynamic(
  cargador: () => Promise<{ default: ComponentType<Record<string, unknown>> }>,
): ComponentType<Record<string, unknown>> {
  let Cargado: ComponentType<Record<string, unknown>> | null = null;
  let pedido: Promise<{ default: ComponentType<Record<string, unknown>> }> | null = null;

  return function Dinamico(props: Record<string, unknown>) {
    const [, forzar] = useReducer((n: number) => n + 1, 0);
    useEffect(() => {
      if (Cargado) return;
      let vivo = true;
      pedido ??= cargador();
      pedido.then(modulo => {
        Cargado = modulo.default ?? (modulo as unknown as ComponentType<Record<string, unknown>>);
        if (vivo) forzar();
      }).catch(() => {});
      return () => { vivo = false; };
    }, []);
    return Cargado ? <Cargado {...props} /> : null;
  };
}
