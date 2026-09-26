import Image from 'next/image';

/* La barra de ventana del folleto pixel: ícono, título y los tres botones.
   Es decorativa (los botones no hacen nada), así que ícono y botones van
   ocultos para el lector de pantalla. Los SVG son los del folleto, copiados
   por su marcador. */

const ICONOS = '/imagenes/clases-apoyo/computacion';

// Sin título, la barra queda sólo con ícono y botones (la usan las herramientas,
// donde el contenido se explica solo).
export default function BarraVentana({ titulo = '' }: { titulo?: string }) {
  return (
    <div className="cp-barra">
      <Image src={`${ICONOS}/barra-icono.svg`} alt="" width={9} height={8} unoptimized className="cp-barra-icono" />
      <span className="cp-barra-titulo">{titulo}</span>
      <span className="cp-barra-botones" aria-hidden="true">
        <Image src={`${ICONOS}/barra-minimizar.svg`} alt="" width={6} height={5} unoptimized />
        <Image src={`${ICONOS}/barra-maximizar.svg`} alt="" width={6} height={6} unoptimized />
        <Image src={`${ICONOS}/barra-cerrar.svg`} alt="" width={6} height={6} unoptimized />
      </span>
    </div>
  );
}
