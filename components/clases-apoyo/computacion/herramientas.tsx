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
      <BarraVentana titulo="Clases particulares en Villa Lugano" encabezado tituloId="hr-titulo" />

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

export function Programacion() {
  const directorio = '/imagenes/clases-apoyo/computacion/programacion';
  const tecnologias = [
    { nombre: 'Python', logo: 'python', texto: 'Python para dar tus primeros pasos en programación y automatizar tareas.' },
    { nombre: 'C++', logo: 'cpp', texto: 'Programación para desarrollar software.' },
    { nombre: 'HTML', logo: 'html', texto: 'Estructura del contenido de las páginas web.' },
    { nombre: 'CSS', logo: 'css', texto: 'Estilos, colores y diseño de páginas web.' },
    { nombre: 'JavaScript', logo: 'javascript', texto: 'Interactividad para las páginas web.' },
    { nombre: 'PostgreSQL', logo: 'postgresql', texto: 'Sistema de bases de datos relacionales.' },
    { nombre: 'SQL', logo: 'sql', texto: 'Consultas para leer y organizar datos.' },
  ];
  const [elegida, setElegida] = useState(tecnologias[0]);

  return (
    <section className="hr cp-ventana pg" aria-labelledby="pg-titulo">
      <BarraVentana titulo="Programación" />
      <h2 id="pg-titulo" className="sr-only">Programación</h2>
      <div className="hr-escena">
        {/* Como en Herramientas, las fichas comparten celda y conservan la altura. */}
        <div className="hr-fichas" aria-live="polite">
          {tecnologias.map(tecnologia => {
            const activa = elegida.logo === tecnologia.logo;
            return (
              <div key={tecnologia.logo} className={`hr-ficha${activa ? ' hr-ficha-activa' : ''}`} aria-hidden={!activa}>
                <span className="hr-ficha-logo">
                  <Image src={`${directorio}/${tecnologia.logo}.svg`} alt="" width={56} height={56} unoptimized className="pg-logo" />
                </span>
                <div className="hr-ficha-texto">
                  <h3 className="hr-ficha-nombre">{tecnologia.nombre}</h3>
                  <p className="hr-ficha-uso">{tecnologia.texto}</p>
                  <span className={tecnologia.logo === 'python' ? 'pg-disponible' : 'pg-estado'}>
                    {tecnologia.logo === 'python' ? 'Disponible' : 'Próximamente'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <ul className="hr-inventario" aria-label="Lenguajes y tecnologías">
        {tecnologias.map(tecnologia => (
          <li key={tecnologia.logo}>
            <button
              type="button"
              className="hr-casilla"
              aria-pressed={elegida.logo === tecnologia.logo}
              onClick={() => setElegida(tecnologia)}
            >
              <Image src={`${directorio}/${tecnologia.logo}.svg`} alt="" width={40} height={40} unoptimized className="hr-casilla-logo pg-logo" />
              <span className="hr-casilla-nombre">
                {tecnologia.logo === 'javascript' ? <>Java<br />Script</> : tecnologia.logo === 'postgresql' ? <>Postgre<br />SQL</> : tecnologia.nombre}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
