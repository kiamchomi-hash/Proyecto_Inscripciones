'use client';

import { useState } from 'react';
import Image from 'next/image';
import BarraVentana from './barra-ventana';

/* Herramientas: una ventana pixel con la ficha de la herramienta
   elegida en la barra de inventario de abajo. Al elegir Claude aparece su
   mascota, Clawd, la del dorso del folleto; es sólo decoración.
   Marcas y mascotas salen del dorso (dorso.html), no se redibujaron: ver
   public/imagenes/clases-apoyo/computacion/herramientas/. */

const DIR = '/imagenes/clases-apoyo/computacion/herramientas';

type Herramienta = { id: string; nombre: string; logo: string; texto: string };

const HERRAMIENTAS: Herramienta[] = [
  { id: 'excel', nombre: 'Excel', logo: 'excel', texto: 'Planillas para ordenar números, listas y gastos, y que las cuentas se hagan solas.' },
  { id: 'word', nombre: 'Word', logo: 'word', texto: 'Documentos prolijos: tu currículum, una carta o el trabajo práctico con buen formato.' },
  { id: 'powerpoint', nombre: 'PowerPoint', logo: 'powerpoint', texto: 'Presentaciones para la escuela o el trabajo, con imágenes y todo en su lugar.' },
  { id: 'gmail', nombre: 'Gmail', logo: 'gmail', texto: 'Tu correo: mandar, responder, adjuntar archivos y encontrar lo que buscás.' },
  { id: 'drive', nombre: 'Drive', logo: 'drive', texto: 'Guardar tus archivos en la nube, abrirlos desde cualquier lado y compartirlos con un link.' },
  { id: 'forms', nombre: 'Forms', logo: 'forms', texto: 'Formularios y encuestas que la gente completa desde el celular.' },
  { id: 'chatgpt', nombre: 'ChatGPT', logo: 'ia-chatgpt', texto: 'Pedirle bien las cosas a la IA: resúmenes, ideas, correos y ayuda para estudiar.' },
  { id: 'claude', nombre: 'Claude', logo: 'ia-claude', texto: 'Una IA para escribir, revisar textos largos y ordenar información.' },
  { id: 'gemini', nombre: 'Gemini', logo: 'ia-gemini', texto: 'La IA de Google, a mano en Gmail, Drive y el buscador.' },
  { id: 'canva', nombre: 'Canva', logo: 'canva', texto: 'Placas y folletos con plantillas, aunque nunca hayas diseñado nada.' },
  { id: 'affinity', nombre: 'Affinity', logo: 'affinity', texto: 'Retocar fotos e imágenes: recortes, color y luz.' },
  { id: 'capcut', nombre: 'CapCut', logo: 'capcut', texto: 'Editar videos para redes: cortes, textos y música.' },
];

export default function Herramientas() {
  const [elegida, setElegida] = useState<Herramienta>(HERRAMIENTAS[0]);
  const conMascota = elegida.id === 'claude';

  return (
    <section className="hr cp-ventana" aria-labelledby="hr-titulo">
      {/* El título no se ve: la ventana con los logos se entiende sola. Queda
          para lectores de pantalla y buscadores. */}
      <h2 id="hr-titulo" className="sr-only">Herramientas que vas a usar</h2>
      <BarraVentana />

      {/* Las doce fichas están siempre montadas, apiladas en la misma celda, y
          sólo se ve la elegida. Así la ventana mide lo que la ficha más larga
          y no salta de alto al cambiar, y cambiar es mostrar y ocultar: no se
          crea nada ni se vuelven a cargar logos. Clawd también está siempre en
          su lugar, visible sólo con Claude, para que el ancho no cambie. */}
      <div className="hr-escena">
        <div className="hr-fichas" aria-live="polite">
          {HERRAMIENTAS.map(h => {
            const activa = h.id === elegida.id;
            return (
              <div key={h.id} className={`hr-ficha${activa ? ' hr-ficha-activa' : ''}`} aria-hidden={!activa}>
                <span className="hr-ficha-logo">
                  <Image src={`${DIR}/${h.logo}.svg`} alt="" width={56} height={56} unoptimized />
                </span>
                <div className="hr-ficha-texto">
                  <h3 className="hr-ficha-nombre">{h.nombre}</h3>
                  <p className="hr-ficha-uso">{h.texto}</p>
                </div>
              </div>
            );
          })}
        </div>

        <Image
          src={`${DIR}/clawd.svg`}
          alt=""
          width={276}
          height={138}
          unoptimized
          className={`hr-mascota hr-clawd${conMascota ? ' hr-clawd-visible' : ''}`}
        />
      </div>

      <ul className="hr-inventario" aria-label="Herramientas">
        {HERRAMIENTAS.map(h => (
          <li key={h.id}>
            <button
              type="button"
              className="hr-casilla"
              aria-pressed={elegida.id === h.id}
              onClick={() => setElegida(h)}
            >
              <Image src={`${DIR}/${h.logo}.svg`} alt="" width={40} height={40} unoptimized className="hr-casilla-logo" />
              {/* PowerPoint no entra en una línea con la letra pixel: va en dos. */}
              <span className="hr-casilla-nombre">
                {h.id === 'powerpoint' ? <>Power<br />Point</> : h.nombre}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
