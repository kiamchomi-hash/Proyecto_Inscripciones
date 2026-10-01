'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useReducer, useState } from 'react';
import { reducirCarrusel } from './folletos-carrusel';

type VideoInstitucional = {
  id: string;
  tema: 'siglo21' | 'teclab';
  titulo: string;
  descripcion: string;
  destino: {
    href: string;
    texto: string;
  };
  folletos: {
    preview: string;
    archivo: string;
    alt: string;
    ancho: number;
    alto: number;
    titulo: string;
  }[];
};

const VIDEOS: VideoInstitucional[] = [
  {
    id: 'K3Gqax1X-dE',
    tema: 'siglo21',
    titulo: 'Universidad Siglo 21',
    descripcion: 'Carreras y propuestas para estudiar online con el acompañamiento del CAU Villa Lugano.',
    destino: {
      href: '/',
      texto: 'Ver propuesta de Siglo 21',
    },
    folletos: ['licenciaturas', 'tecnicaturas', 'complementacion'].map((categoria) => ({
      preview: `/folletos/siglo21-${categoria}-2026-09.webp`,
      archivo: `/folletos/siglo21-${categoria}-2026-09.webp`,
      titulo: categoria === 'complementacion' ? 'Complementación curricular' : categoria === 'licenciaturas' ? 'Licenciaturas' : 'Tecnicaturas',
      alt: `Oferta de ${categoria === 'complementacion' ? 'complementación curricular' : categoria} de Universidad Siglo 21`,
      ancho: 1080,
      alto: 1350,
    })),
  },
  {
    id: 'yZNU0NZrGaI',
    tema: 'teclab',
    titulo: 'Teclab',
    descripcion: 'Carreras online de Tecnología y Gestión, más el curso de Inteligencia Artificial.',
    destino: {
    href: '/teclab',
      texto: 'Ver propuesta de Teclab',
    },
    folletos: [{
      preview: '/folletos/teclab-tecnicaturas-2026-09.webp',
      archivo: '/folletos/teclab-tecnicaturas-2026-09.webp',
      titulo: 'Teclab',
      alt: 'Oferta de tecnicaturas de Teclab',
      ancho: 1080,
      alto: 1240,
    }],
  },
];

function Folletos({ video }: { video: VideoInstitucional }) {
  const [estado, enviar] = useReducer(
    (estado: { indice: number; detenido: boolean }, accion: Parameters<typeof reducirCarrusel>[1]) => reducirCarrusel(estado, accion, video.folletos.length),
    { indice: 0, detenido: false },
  );
  const detener = () => enviar({ tipo: 'detener' });
  useEffect(() => {
    if (estado.detenido || video.folletos.length < 2) return;
    const preferencia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reducirMovimiento = () => { if (preferencia.matches) enviar({ tipo: 'detener' }); };
    reducirMovimiento();
    preferencia.addEventListener('change', reducirMovimiento);
    const temporizador = preferencia.matches ? undefined : window.setInterval(() => enviar({ tipo: 'avanzar' }), 6000);
    return () => {
      window.clearInterval(temporizador);
      preferencia.removeEventListener('change', reducirMovimiento);
    };
  }, [estado.detenido, video.folletos.length]);
  const folleto = video.folletos[estado.indice];
  const carrusel = video.folletos.length > 1;
  return (
    <div className="vi-folletos" role={carrusel ? 'region' : undefined} aria-roledescription={carrusel ? 'carrusel' : undefined}
      aria-label={carrusel ? 'Oferta de carreras de Universidad Siglo 21' : undefined}
      onPointerEnter={detener} onPointerDown={detener} onFocusCapture={detener} onKeyDown={detener}>
      <a className="vi-folleto" href={folleto.archivo} target="_blank" rel="noopener noreferrer"
        aria-label={`Abrir el folleto de ${folleto.titulo} en tamaño completo`}>
        <span className="vi-folleto-cabecera">
          <strong>{folleto.titulo}</strong>
          <span className="vi-folleto-ampliar" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" /></svg></span>
        </span>
        <span className="vi-folleto-imagen">
          <Image src={folleto.preview} alt={folleto.alt} width={folleto.ancho} height={folleto.alto} sizes="(max-width: 767px) 100vw, 50vw" />
        </span>
      </a>
      {carrusel && <div className="vi-carrusel-controles">
        <button type="button" aria-label="Folleto anterior" onClick={() => enviar({ tipo: 'seleccionar', indice: estado.indice - 1 })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
          <span>Anterior</span>
        </button>
        <button className="vi-carrusel-estado" type="button" aria-label={estado.detenido ? 'Carrusel en pausa' : 'Pausar carrusel'} aria-disabled={estado.detenido} onClick={detener}>
          <span className="vi-carrusel-contador" aria-live={estado.detenido ? 'polite' : 'off'} aria-atomic="true">{estado.indice + 1}<span> / {video.folletos.length}</span></span>
          <span className="vi-carrusel-pausa"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12" /></svg>{estado.detenido ? 'En pausa' : 'Pausar'}</span>
        </button>
        <button type="button" aria-label="Folleto siguiente" onClick={() => enviar({ tipo: 'seleccionar', indice: estado.indice + 1 })}>
          <span>Siguiente</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
        </button>
      </div>}
    </div>
  );
}

function Reproductor({ video }: { video: VideoInstitucional }) {
  const [activo, setActivo] = useState(false);

  return (
    <figure className={`vi-item vi-item--${video.tema}`}>
      <div className="vi-marco">
        {activo ? (
          <iframe
            className="vi-iframe"
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&controls=0&iv_load_policy=3&playsinline=1&rel=0`}
            title={`Video: ${video.titulo}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="vi-fachada"
            onClick={() => setActivo(true)}
            aria-label={`Reproducir el video de ${video.titulo}`}
          >
            <Image
              src={`https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`}
              alt=""
              fill
              sizes="(max-width: 767px) 100vw, 50vw"
              className="vi-poster"
            />
            <span className="vi-velo" aria-hidden="true" />
            <span className="vi-play" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <figcaption className="vi-caption">
        <h3>{video.titulo}</h3>
        <p>{video.descripcion}</p>
      </figcaption>
      <Folletos video={video} />
      <Link className="vi-destino" href={video.destino.href}>
        <span>{video.destino.texto}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </figure>
  );
}

export default function VideosInstitucionales() {
  return (
    <div className="vi-grid">
      {VIDEOS.map((video) => (
        <Reproductor key={video.id} video={video} />
      ))}
    </div>
  );
}
