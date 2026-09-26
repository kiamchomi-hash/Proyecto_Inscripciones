'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

/* "¿Qué querés aprender?": una escena de juego pixel. Abajo, una barra de
   inventario con las herramientas; al elegir una, la mascota que la presenta
   (Codex o Clawd, las del dorso del folleto) aparece y la cuenta en un cuadro
   de diálogo que se escribe letra por letra. Marcas y mascotas son los SVG del
   dorso copiados de dorso.html, no redibujados
   (public/imagenes/clases-apoyo/computacion/herramientas/). */

const DIR = '/imagenes/clases-apoyo/computacion/herramientas';

type Mascota = 'codex' | 'clawd';

type Herramienta = { id: string; nombre: string; logo: string; mascota: Mascota; texto: string };

const HERRAMIENTAS: Herramienta[] = [
  { id: 'excel', nombre: 'Excel', logo: 'excel', mascota: 'codex', texto: 'Planillas para ordenar números, listas y gastos, y que las cuentas se hagan solas.' },
  { id: 'word', nombre: 'Word', logo: 'word', mascota: 'codex', texto: 'Documentos prolijos: tu currículum, una carta o el trabajo práctico con buen formato.' },
  { id: 'powerpoint', nombre: 'PowerPoint', logo: 'powerpoint', mascota: 'codex', texto: 'Presentaciones para la escuela o el trabajo, con imágenes y todo en su lugar.' },
  { id: 'gmail', nombre: 'Gmail', logo: 'gmail', mascota: 'codex', texto: 'Tu correo: mandar, responder, adjuntar archivos y encontrar lo que buscás.' },
  { id: 'drive', nombre: 'Drive', logo: 'drive', mascota: 'codex', texto: 'Guardar tus archivos en la nube, abrirlos desde cualquier lado y compartirlos con un link.' },
  { id: 'forms', nombre: 'Forms', logo: 'forms', mascota: 'codex', texto: 'Formularios y encuestas que la gente completa desde el celular.' },
  { id: 'chatgpt', nombre: 'ChatGPT', logo: 'ia-chatgpt', mascota: 'clawd', texto: 'Pedirle bien las cosas a la IA: resúmenes, ideas, correos y ayuda para estudiar.' },
  { id: 'claude', nombre: 'Claude', logo: 'ia-claude', mascota: 'clawd', texto: 'Una IA para escribir, revisar textos largos y ordenar información. Yo soy su mascota.' },
  { id: 'gemini', nombre: 'Gemini', logo: 'ia-gemini', mascota: 'clawd', texto: 'La IA de Google, a mano en Gmail, Drive y el buscador.' },
  { id: 'canva', nombre: 'Canva', logo: 'canva', mascota: 'clawd', texto: 'Placas y folletos con plantillas, aunque nunca hayas diseñado nada.' },
  { id: 'affinity', nombre: 'Affinity', logo: 'affinity', mascota: 'clawd', texto: 'Retocar fotos e imágenes: recortes, color y luz.' },
  { id: 'capcut', nombre: 'CapCut', logo: 'capcut', mascota: 'clawd', texto: 'Editar videos para redes: cortes, textos y música.' },
];

const SALUDO: Pick<Herramienta, 'mascota' | 'texto'> = {
  mascota: 'codex',
  texto: '¡Hola! Tocá una herramienta de abajo y te cuento qué vas a poder hacer con ella.',
};

const NOMBRE_MASCOTA: Record<Mascota, string> = { codex: 'Codex', clawd: 'Clawd' };

// Letra por letra, salvo que el sistema pida menos movimiento.
function useEscritura(texto: string) {
  const [largo, setLargo] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLargo(texto.length);
      return;
    }
    setLargo(0);
    const id = window.setInterval(() => {
      setLargo(n => {
        if (n >= texto.length) {
          window.clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 22);
    return () => window.clearInterval(id);
  }, [texto]);

  return { visible: texto.slice(0, largo), terminado: largo >= texto.length };
}

export default function Herramientas() {
  const [elegida, setElegida] = useState<Herramienta | null>(null);
  const actual = elegida ?? SALUDO;
  const { visible, terminado } = useEscritura(actual.texto);

  return (
    <section className="hr" aria-labelledby="hr-titulo">
      <h2 id="hr-titulo" className="hr-titulo">
        <span className="hr-ceja">Elegí una herramienta</span>
        ¿Qué querés aprender?
      </h2>

      <div className="hr-escena">
        {/* La key cambia con la mascota: al cambiar de personaje, entra de nuevo. */}
        <div className={`hr-personaje hr-personaje-${actual.mascota}`} key={actual.mascota}>
          {actual.mascota === 'codex' ? (
            <Image src={`${DIR}/pet-codex.svg`} alt="" width={414} height={426} unoptimized className="hr-mascota" />
          ) : (
            <Image src={`${DIR}/clawd.svg`} alt="" width={276} height={138} unoptimized className="hr-mascota" />
          )}
          <span className="hr-piso" aria-hidden="true" />
        </div>

        <div className="hr-dialogo">
          <span className="hr-dialogo-nombre">
            {NOMBRE_MASCOTA[actual.mascota]}
            {elegida && <span className="hr-dialogo-tema"> / {elegida.nombre}</span>}
          </span>
          {/* El lector de pantalla recibe la frase entera de una vez; lo que se
              escribe letra por letra es sólo visual. */}
          <p className="sr-only" aria-live="polite">{actual.texto}</p>
          <p className="hr-dialogo-texto" aria-hidden="true">
            {visible}
            {terminado && <span className="hr-dialogo-sigue" />}
          </p>
        </div>
      </div>

      <ul className="hr-inventario" aria-label="Herramientas">
        {HERRAMIENTAS.map(h => {
          const activa = elegida?.id === h.id;
          return (
            <li key={h.id}>
              <button
                type="button"
                className="hr-casilla"
                aria-pressed={activa}
                onClick={() => setElegida(h)}
              >
                <Image src={`${DIR}/${h.logo}.svg`} alt="" width={40} height={40} unoptimized className="hr-casilla-logo" />
                <span className="hr-casilla-nombre">{h.nombre}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
