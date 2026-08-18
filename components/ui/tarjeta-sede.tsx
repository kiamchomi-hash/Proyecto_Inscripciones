import Image from 'next/image';
import Link from 'next/link';
import './tarjeta-sede.css';

const ACCESOS = [
  { valor: 'Arte', etiqueta: 'Taller', href: '/clases-apoyo/arte' },
  { valor: 'Lectura', etiqueta: 'Taller', href: '/clases-apoyo/lengua' },
  { valor: 'Apoyo', etiqueta: 'Clases', href: '/clases-apoyo' },
];

export function TarjetaSede() {
  return (
    <article className="ui-tarjeta-sede" aria-labelledby="ui-tarjeta-sede-titulo">
      <div className="ui-tarjeta-sede-portada">
        <Image
          src="/imagenes/imagenes_cau/Foto-entrada.webp"
          alt=""
          fill
          sizes="(max-width: 767px) 100vw, 360px"
          className="ui-tarjeta-sede-foto"
        />
        <span className="ui-tarjeta-sede-numero" aria-hidden="true">21</span>
        <span className="ui-tarjeta-sede-estado">Sede oficial</span>
        <span className="ui-tarjeta-sede-avatar" aria-hidden="true">
          <Image
            src="/imagenes/imagenes_cau/logo_cau.png"
            alt=""
            width={58}
            height={58}
          />
        </span>
      </div>

      <div className="ui-tarjeta-sede-cuerpo">
        <p className="ui-tarjeta-sede-handle">Universidad Siglo 21</p>
        <h3 id="ui-tarjeta-sede-titulo" className="ui-tarjeta-sede-nombre">
          CAU Villa Lugano
        </h3>
        <p className="ui-tarjeta-sede-bio">
          Formación, talleres y acompañamiento cerca de tu casa, con un equipo que te orienta de verdad.
        </p>
      </div>

      <nav className="ui-tarjeta-sede-accesos" aria-label="Servicios destacados">
        {ACCESOS.map(acceso => (
          <Link key={acceso.href} href={acceso.href} className="ui-tarjeta-sede-acceso">
            <span className="ui-tarjeta-sede-valor">{acceso.valor}</span>
            <span className="ui-tarjeta-sede-etiqueta">{acceso.etiqueta}</span>
          </Link>
        ))}
      </nav>

      <a
        href="https://wa.me/5491166522722?text=Hola%2C%20me%20gustar%C3%ADa%20realizar%20una%20consulta"
        target="_blank"
        rel="noopener nofollow"
        className="ui-tarjeta-sede-boton"
      >
        Hablar con un asesor
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </article>
  );
}
