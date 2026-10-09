'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { carreraToSlug, type Carrera } from '@/components/index/types';
import { getFamiliaTeclab } from '@/components/index/teclab';
import { mensajeWhatsAppInfo } from '@/components/carreras/career-content';
import { numeroWhatsAppDe } from '@/lib/whatsapp';
import { PREGUNTAS, recomendar } from './puntaje';

export type CarreraTestTeclab = Pick<Carrera, 'id' | 'nombre' | 'nombre_corto' | 'prefix' | 'nivel' | 'orden' | 'proximamente'>;

const LETRAS = 'ABCDEF';

function familiaDe(carrera: CarreraTestTeclab): { clase: string; etiqueta: string } {
  return getFamiliaTeclab(carrera) === 'tecnologia'
    ? { clase: 'tecnologia', etiqueta: 'Tecnología' }
    : { clase: 'gestion', etiqueta: 'Gestión' };
}

// El mismo enlace que la ficha de cada carrera de Teclab: número de la casa y
// el mensaje con el nombre de la carrera, así el asesor sabe de qué se trata.
const enlaceWhatsApp = (carrera: CarreraTestTeclab) =>
  `https://wa.me/${numeroWhatsAppDe('teclab')}?text=${encodeURIComponent(mensajeWhatsAppInfo(carrera))}`;

export default function TestVocacionalTeclab({ carreras }: { carreras: CarreraTestTeclab[] }) {
  const [respuestas, setRespuestas] = useState<number[]>([]);
  const preguntaRef = useRef<HTMLHeadingElement>(null);
  const paso = respuestas.length;

  // Cada opción se vuelve a montar al cambiar de pregunta (para que no quede
  // marcada la del mismo lugar); el foco pasa a la pregunta nueva.
  useEffect(() => {
    if (paso > 0) preguntaRef.current?.focus({ preventScroll: true });
  }, [paso]);

  const reiniciar = () => setRespuestas([]);

  if (paso < PREGUNTAS.length) {
    const pregunta = PREGUNTAS[paso];
    const avance = (paso / PREGUNTAS.length) * 100;
    return (
      <section className="tvt-card" aria-label="Test vocacional">
        <div className="tvt-progreso">
          <div className="tvt-progreso-fila">
            <span>Pregunta {paso + 1} de {PREGUNTAS.length}</span>
            <span>{pregunta.eje}</span>
          </div>
          <div className="tvt-barra" aria-hidden="true"><span style={{ width: `${avance}%` }} /></div>
        </div>
        <h2 className="tvt-pregunta" id="tvt-pregunta" ref={preguntaRef} tabIndex={-1}>{pregunta.pregunta}</h2>
        <div className="tvt-opciones" role="group" aria-labelledby="tvt-pregunta">
          {pregunta.opciones.map((opcion, indice) => (
            <button
              type="button"
              className="tvt-opcion"
              key={`${paso}-${indice}`}
              onClick={() => setRespuestas(actuales => [...actuales.slice(0, paso), indice])}
            >
              <span className="tvt-letra" aria-hidden="true">{LETRAS[indice]}</span>
              <span>{opcion.texto}</span>
            </button>
          ))}
        </div>
        <div className="tvt-nav">
          <button type="button" className="tvt-volver" onClick={() => setRespuestas(actuales => actuales.slice(0, -1))} disabled={paso === 0}>
            <span aria-hidden="true">←</span> Volver
          </button>
        </div>
      </section>
    );
  }

  const resultado = recomendar(carreras, respuestas);

  return (
    <section className="tvt-card tvt-resultado" aria-labelledby="tvt-resultado-titulo">
      <p className="tvt-eyebrow">Tu resultado</p>
      <h2 id="tvt-resultado-titulo" ref={preguntaRef} tabIndex={-1}>Las carreras que más van con vos</h2>
      {resultado.length > 0 ? (
        <ol className="tvt-lista">
          {resultado.map(({ carrera }, indice) => {
            const familia = familiaDe(carrera);
            return (
              <li className={`tvt-carrera tvt-carrera--${familia.clase}${indice === 0 ? ' is-primera' : ''}`} key={carrera.id}>
                <span className="tvt-puesto" aria-hidden="true">{indice + 1}</span>
                <div className="tvt-carrera-info">
                  <div className="tvt-chips">
                    <span className="tvt-chip">{familia.etiqueta}</span>
                    {indice === 0 && <span className="tvt-chip tvt-chip--top">Mayor afinidad</span>}
                    {carrera.proximamente && <span className="tvt-chip tvt-chip--pronto">Próximamente</span>}
                  </div>
                  <strong>{carrera.nombre_corto ?? carrera.nombre}</strong>
                </div>
                <div className="tvt-acciones">
                  <Link className="tvt-boton tvt-boton--ficha" href={`/carreras/${carreraToSlug(carrera)}`}>
                    Ver la carrera <span aria-hidden="true">→</span>
                  </Link>
                  <a className="tvt-boton tvt-boton--wa" href={enlaceWhatsApp(carrera)} target="_blank" rel="noopener nofollow">
                    Consultar por WhatsApp
                  </a>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="tvt-vacio">En este momento no pudimos cargar las carreras. Miralas todas en la página de Teclab.</p>
      )}
      <div className="tvt-final">
        <button type="button" className="tvt-volver" onClick={reiniciar}>Hacer el test de nuevo</button>
        <Link className="tvt-enlace" href="/teclab#oferta-teclab">Ver todas las carreras <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}
