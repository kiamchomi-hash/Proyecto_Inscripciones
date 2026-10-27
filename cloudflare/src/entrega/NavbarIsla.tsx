import Navbar from '@/components/navbar';
import { RutaContext } from './next-navigation';

// El navbar vigente es un componente de cliente que consulta `usePathname`.
// Astro no tiene router, así que la ruta se pasa como prop desde la página y se
// publica por contexto: el servidor y la hidratación ven exactamente la misma y
// el enlace activo no parpadea.
export default function NavbarIsla({ ruta }: { ruta: string }) {
  return (
    <RutaContext.Provider value={ruta}>
      <Navbar />
    </RutaContext.Provider>
  );
}
