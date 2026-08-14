'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { VentasSnapshotMeta } from '@/lib/ventas-snapshot';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface Props {
  html: string | null;
  meta: VentasSnapshotMeta | null;
  source: 'supabase' | 'local' | null;
}

function fechaVisible(fecha: string | null | undefined) {
  if (!fecha) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(fecha));
}

export default function BuscadorWorkspace({ html, meta, source }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(window.matchMedia('(display-mode: standalone)').matches);
    const onInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onInstall);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/buscador-sw.js', { scope: '/admin/buscador' }).catch(() => undefined);
    }
    return () => window.removeEventListener('beforeinstallprompt', onInstall);
  }, []);

  const instalar = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      setMessage(outcome === 'accepted' ? 'Aplicación instalada.' : null);
      setInstallPrompt(null);
      return;
    }
    setMessage('En iPhone: Compartir → Agregar a inicio. En PC: usá Instalar aplicación en el menú del navegador.');
  };

  const publicar = async (file: File) => {
    setUploading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/buscador', {
        method: 'PUT',
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        body: await file.text(),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? 'No se pudo publicar');
      setMessage('Buscador publicado. Cargando la nueva versión…');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo publicar el archivo');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <main className="buscador-app">
      <header className="buscador-app__bar">
        <div className="buscador-app__identity">
          <span className="buscador-app__mark" aria-hidden="true">21</span>
          <div>
            <p className="buscador-app__eyebrow">CAU Villa Lugano</p>
            <h1>Carreras y precios</h1>
          </div>
        </div>

        <div className="buscador-app__status" aria-live="polite">
          <span className={`buscador-app__dot ${html ? 'is-ready' : 'is-empty'}`} />
          <div>
            <strong>{html ? `${meta?.carreras ?? '—'} carreras disponibles` : 'Falta publicar el buscador'}</strong>
            <span>
              {html
                ? `Actualizado ${fechaVisible(meta?.actualizado)}${meta?.periodo ? ` · Período ${meta.periodo}` : ''}`
                : 'Elegí el HTML generado en esta computadora'}
            </span>
          </div>
        </div>

        <div className="buscador-app__actions">
          {!standalone && (
            <button type="button" className="buscador-app__button is-secondary" onClick={instalar}>
              Instalar app
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="text/html,.html"
            hidden
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) void publicar(file);
            }}
          />
          <button
            type="button"
            className="buscador-app__button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Publicando…' : 'Publicar actualización'}
          </button>
        </div>
      </header>

      {message && (
        <div className="buscador-app__notice" role="status">
          <span>{message}</span>
          <button type="button" onClick={() => setMessage(null)} aria-label="Cerrar aviso">×</button>
        </div>
      )}

      <section className="buscador-app__workspace" aria-label="Buscador de carreras">
        {html ? (
          <iframe
            title="Buscador de carreras y precios"
            srcDoc={html}
            sandbox="allow-scripts allow-forms allow-downloads allow-modals"
            allow="clipboard-read; clipboard-write"
          />
        ) : (
          <div className="buscador-app__empty">
            <span className="buscador-app__empty-index">01</span>
            <h2>Publicá el primer snapshot</h2>
            <p>Seleccioná <code>ventas/buscador-carreras.html</code>. Se guardará en un bucket privado y solamente podrá abrirlo una cuenta administradora.</p>
            <button type="button" onClick={() => inputRef.current?.click()}>Elegir archivo</button>
          </div>
        )}
      </section>

      <footer className="buscador-app__footer">
        <span>{source === 'local' ? 'Vista local' : source === 'supabase' ? 'Snapshot privado en Supabase' : 'Sin snapshot'}</span>
        {meta?.promoHasta && <span>Promoción informada hasta {meta.promoHasta}</span>}
      </footer>
    </main>
  );
}
