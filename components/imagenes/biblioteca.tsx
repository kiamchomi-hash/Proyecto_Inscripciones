'use client';

import { useMemo, useState } from 'react';

export interface Imagen {
  ruta: string;
  nombre: string;
  carpeta: string;
  subcarpeta: string | null;
  bytes: number;
  /** Nombre de la carrera, cuando la foto es de imagenes_carreras/. */
  carrera: string | null;
  nivel: string | null;
}

function pesoLegible(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

const sinAcentos = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function BibliotecaImagenes({
  imagenes,
  sinFoto,
}: {
  imagenes: Imagen[];
  sinFoto: string[];
}) {
  const [busqueda, setBusqueda] = useState('');
  const [carpeta, setCarpeta] = useState('todas');
  const [copiada, setCopiada] = useState<string | null>(null);

  const carpetas = useMemo(() => {
    const cuenta = new Map<string, number>();
    imagenes.forEach(i => cuenta.set(i.carpeta, (cuenta.get(i.carpeta) ?? 0) + 1));
    return [...cuenta.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));
  }, [imagenes]);

  const visibles = useMemo(() => {
    const q = sinAcentos(busqueda.trim());
    return imagenes.filter(i => {
      if (carpeta !== 'todas' && i.carpeta !== carpeta) return false;
      if (!q) return true;
      // Buscar por archivo, carpeta y carrera: el nombre del archivo es un slug
      // y no siempre se parece a como uno nombra la carrera de memoria.
      return sinAcentos(`${i.nombre} ${i.carpeta} ${i.subcarpeta ?? ''} ${i.carrera ?? ''}`).includes(q);
    });
  }, [imagenes, busqueda, carpeta]);

  const pesoTotal = useMemo(() => visibles.reduce((s, i) => s + i.bytes, 0), [visibles]);

  async function copiar(ruta: string) {
    try {
      await navigator.clipboard.writeText(ruta);
      setCopiada(ruta);
      setTimeout(() => setCopiada(actual => (actual === ruta ? null : actual)), 1600);
    } catch {
      // Sin permiso de portapapeles (o sin HTTPS): que al menos se pueda copiar a mano.
      window.prompt('Copiá la ruta:', ruta);
    }
  }

  return (
    <main className="bib">
      <header className="bib__top">
        <h1 className="bib__titulo">Biblioteca de imágenes</h1>
        <p className="bib__bajada">
          Todo lo que hay en <code>public/imagenes</code>. Hacé clic en una tarjeta para copiar su ruta.
          Esta página no está enlazada desde el sitio ni se indexa.
        </p>

        <div className="bib__controles">
          <input
            type="search"
            className="bib__buscador"
            placeholder="Buscar por archivo, carpeta o carrera…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            aria-label="Buscar imágenes"
          />
          <div className="bib__filtros">
            <button
              type="button"
              className={`bib__chip${carpeta === 'todas' ? ' bib__chip--activo' : ''}`}
              onClick={() => setCarpeta('todas')}
            >
              Todas <span>{imagenes.length}</span>
            </button>
            {carpetas.map(([nombre, n]) => (
              <button
                key={nombre}
                type="button"
                className={`bib__chip${carpeta === nombre ? ' bib__chip--activo' : ''}`}
                onClick={() => setCarpeta(nombre)}
              >
                {nombre} <span>{n}</span>
              </button>
            ))}
          </div>
          <p className="bib__resumen">
            {visibles.length} {visibles.length === 1 ? 'imagen' : 'imágenes'} · {pesoLegible(pesoTotal)}
          </p>
        </div>
      </header>

      {sinFoto.length > 0 && (
        <section className="bib__aviso">
          <p className="bib__aviso-titulo">
            {sinFoto.length} {sinFoto.length === 1 ? 'carrera publicada sin foto' : 'carreras publicadas sin foto'}
          </p>
          <p>{sinFoto.join(' · ')}</p>
        </section>
      )}

      {visibles.length === 0 ? (
        <p className="bib__vacio">No hay imágenes que coincidan con «{busqueda}».</p>
      ) : (
        <ul className="bib__grilla">
          {visibles.map(i => (
            <li key={i.ruta}>
              <button
                type="button"
                className={`bib__tarjeta${copiada === i.ruta ? ' bib__tarjeta--copiada' : ''}`}
                onClick={() => copiar(i.ruta)}
                title={`Copiar ${i.ruta}`}
              >
                <span className="bib__marco">
                  {/* Sin next/image a propósito: son 225 archivos locales y ya
                      optimizados; pasarlos por el optimizador gasta cuota de
                      transformaciones para una herramienta que se usa de a ratos. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.ruta} alt={i.nombre} loading="lazy" decoding="async" />
                  <span className="bib__copiado">Ruta copiada</span>
                </span>
                <span className="bib__datos">
                  <span className="bib__nombre">{i.carrera ?? i.subcarpeta ?? i.nombre}</span>
                  <span className="bib__archivo">{i.nombre}</span>
                  <span className="bib__meta">
                    {i.nivel && <span className="bib__nivel">{i.nivel}</span>}
                    <span>{pesoLegible(i.bytes)}</span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
