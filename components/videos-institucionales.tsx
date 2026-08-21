'use client';

import { useState } from 'react';
import Image from 'next/image';
import { VIDEOS_INSTITUCIONALES, urlDeVideo, type VideoInstitucional } from '@/lib/videos';

/* El video no se descarga hasta que el visitante toca reproducir: hasta ese
   momento lo que se ve es el poster, un JPG de ~40 KB. Sin esta fachada, tres
   <video> en la pagina se llevan varios MB de la carga inicial aunque nadie
   los mire. */
function Reproductor({ video }: { video: VideoInstitucional }) {
  const [activo, setActivo] = useState(false);

  return (
    <figure className="vi-card rounded-2xl overflow-hidden m-0">
      <div className="vi-marco">
        {activo ? (
          <video
            className="vi-video"
            src={urlDeVideo(video)}
            poster={video.poster}
            controls
            autoPlay
            playsInline
            preload="auto"
          >
            Tu navegador no puede reproducir este video.
          </video>
        ) : (
          <button
            type="button"
            className="vi-fachada"
            onClick={() => setActivo(true)}
            aria-label={`Reproducir el video: ${video.titulo}`}
          >
            <Image
              src={video.poster}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="vi-poster"
            />
            <span className="vi-play" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="vi-duracion" aria-hidden="true">
              {Math.floor(video.duracion / 60)}:{String(video.duracion % 60).padStart(2, '0')}
            </span>
          </button>
        )}
      </div>
      <figcaption className="p-5 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">{video.titulo}</h3>
        <p className="text-sm leading-relaxed" style={{ color: '#c8dedd' }}>
          {video.descripcion}
        </p>
      </figcaption>
    </figure>
  );
}

export default function VideosInstitucionales() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {VIDEOS_INSTITUCIONALES.map((v) => (
        <Reproductor key={v.id} video={v} />
      ))}
    </div>
  );
}
