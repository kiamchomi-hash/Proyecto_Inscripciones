'use client';

import Image from 'next/image';
import { useState } from 'react';

type VideoInstitucional = {
  id: string;
  titulo: string;
  descripcion: string;
};

const VIDEOS: VideoInstitucional[] = [
  {
    id: 'K3Gqax1X-dE',
    titulo: 'Universidad Siglo 21',
    descripcion: 'Carreras y propuestas para estudiar online con el acompañamiento del CAU Villa Lugano.',
  },
  {
    id: 'yZNU0NZrGaI',
    titulo: 'Teclab',
    descripcion: 'Carreras online de Tecnología y Gestión, más el curso de Inteligencia Artificial.',
  },
];

function Reproductor({ video }: { video: VideoInstitucional }) {
  const [activo, setActivo] = useState(false);

  return (
    <figure className="vi-item">
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
