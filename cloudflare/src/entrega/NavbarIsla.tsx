import Navbar from '@/components/navbar';
import { RutaContext } from './next-navigation';

// El navbar vigente es un componente de cliente que consulta `usePathname`.
// Astro no tiene router, así que la ruta se pasa como prop desde la página y se
// publica por contexto: el servidor y la hidratación ven exactamente la misma y
// el enlace activo no parpadea.
//
// En topykly el navbar sigue siendo el del CAU, pero sus enlaces apuntan al
// dominio del CAU (sin un 301 intermedio) y la marca móvil es la Academia.
export default function NavbarIsla({ ruta, baseHref = '', marca = 'cau' }: {
  ruta: string;
  baseHref?: string;
  marca?: 'cau' | 'identidad';
}) {
  return (
    <RutaContext.Provider value={ruta}>
      <Navbar baseHref={baseHref} marca={marca} />
    </RutaContext.Provider>
  );
}
