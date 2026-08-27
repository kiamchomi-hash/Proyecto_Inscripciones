'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type VideoInstitucional = {
  id: string;
  tema: 'siglo21' | 'teclab';
  titulo: string;
  descripcion: string;
  destino: {
    href: string;
    texto: string;
  };
  folleto: {
    preview: string;
    archivo: string;
    alt: string;
    ancho: number;
    alto: number;
  };
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
    folleto: {
      preview: '/folletos/folleto-siglo21-preview.webp',
      archivo: '/folletos/folleto-siglo21.jpg',
      alt: 'Folleto de Universidad Siglo 21 con su oferta de carreras universitarias',
      ancho: 1240,
      alto: 1550,
    },
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
    folleto: {
      preview: '/folletos/folleto-teclab-preview.webp',
      archivo: '/folletos/folleto-teclab.jpg',
      alt: 'Folleto de Teclab con tecnicaturas de Tecnología y Gestión',
      ancho: 1240,
      alto: 1550,
    },
  },
];

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
      <a
        className="vi-folleto"
        href={video.folleto.archivo}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir el folleto de ${video.titulo} en tamaño completo`}
      >
        <span className="vi-folleto-cabecera">
          <strong>Folleto de {video.titulo}</strong>
          <span>Abrir en tamaño completo</span>
        </span>
        <span className="vi-folleto-imagen">
          <Image
            src={video.folleto.preview}
            alt={video.folleto.alt}
            width={video.folleto.ancho}
            height={video.folleto.alto}
            sizes="(max-width: 767px) 100vw, 50vw"
          />
        </span>
      </a>
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
