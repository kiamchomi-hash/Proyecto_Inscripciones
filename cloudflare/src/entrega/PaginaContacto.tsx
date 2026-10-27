import ContactoPageContent from '@/components/contacto/contacto-page';
import { ContextoTurnstile, type ConfigTurnstile } from './turnstile-contexto';

// Isla de `/contacto`: el cuerpo es literalmente `contacto-page.tsx`, que es un
// componente de cliente con el formulario, el mapa y los canales. Se hidrata
// entero porque el formulario está dentro del mismo componente; el pie queda
// fuera (no tiene estado y lo renderiza la página).
//
// La configuración de Turnstile va por contexto, como en la home: así el HTML
// del servidor ya trae el marcador y el hueco cuando hay site key, y en modo
// demo el token llega sin tocar Cloudflare.
export default function PaginaContacto({ turnstile }: { turnstile: ConfigTurnstile }) {
  return (
    <ContextoTurnstile.Provider value={turnstile}>
      <ContactoPageContent />
    </ContextoTurnstile.Provider>
  );
}
