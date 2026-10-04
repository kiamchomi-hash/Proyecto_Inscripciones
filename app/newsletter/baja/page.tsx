import type { Metadata } from 'next';
import { esIdSuscripcion } from '@/components/formularios/mail-precio';
import './baja.css';

// La baja del newsletter, a la que lleva «Dejar de recibir novedades» del pie
// del mail. Abrirla no da de baja: los escáneres de enlaces de los correos
// abren todo, así que la baja es el POST del botón (`/api/newsletter/baja`).
// No lee la base: el id viaja tal cual al formulario y el endpoint lo valida.

export const metadata: Metadata = {
  title: { absolute: 'Dejar de recibir novedades | CAU Villa Lugano' },
  robots: { index: false, follow: false },
};

type Parametros = Promise<{ [clave: string]: string | string[] | undefined }>;

export default async function BajaNewsletter({ searchParams }: { searchParams: Parametros }) {
  const { id, listo } = await searchParams;

  if (listo === '1') {
    return (
      <main className="baja-newsletter">
        <div className="bn-tarjeta">
          <h1 className="bn-titulo">Listo, no vas a recibir más novedades.</h1>
          <p className="bn-texto">Si cambiás de idea, podés volver a suscribirte desde cualquier formulario del sitio.</p>
        </div>
      </main>
    );
  }

  if (!esIdSuscripcion(id)) {
    return (
      <main className="baja-newsletter">
        <div className="bn-tarjeta">
          <h1 className="bn-titulo">El enlace no es válido</h1>
          <p className="bn-texto">Usá el enlace «Dejar de recibir novedades» que llega al pie de cada mail.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="baja-newsletter">
      <div className="bn-tarjeta">
        <h1 className="bn-titulo">¿Dejás de recibir novedades?</h1>
        <p className="bn-texto">No te vamos a mandar más los mails de novedades de esta carrera.</p>
        <form method="post" action="/api/newsletter/baja">
          <input type="hidden" name="id" value={id} />
          <button type="submit" className="bn-boton">Dejar de recibir novedades</button>
        </form>
      </div>
    </main>
  );
}
