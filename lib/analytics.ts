// Eventos de conversion para Web Analytics.
//
// El pageview ya lo cuenta el componente <Analytics> del layout: con eso se
// sabe que fichas de carrera se miran. Lo que faltaba es lo otro, que es lo
// unico que el sitio persigue de verdad: cuales terminan en un formulario
// enviado. Con la campana de indexacion andando, esa es la diferencia entre
// saber que una pagina trae visitas y saber que trae inscripciones.
//
// Se dispara solo cuando el POST a /api/formularios respondio ok: un envio que
// fallo no es una conversion. track() no manda nada en desarrollo (loguea en
// consola) y no lanza si algo sale mal, asi que ninguna de estas llamadas puede
// romper el envio, que a esa altura ya ocurrio.

import { track } from '@vercel/analytics';

/** Desde donde se envio la consulta: el form de la home o el de /contacto. */
export type OrigenConsulta = 'home' | 'contacto';

/**
 * La carrera va como propiedad y no como evento aparte para poder agrupar por
 * ella en el panel. El de /contacto no pregunta carrera, de ahi el 'sin
 * especificar' en vez de omitir la propiedad: si falta, la fila no aparece al
 * desglosar y el total deja de cerrar.
 */
export function trackConsulta(
  origen: OrigenConsulta,
  carrera: string | null,
  tipo: string | null,
) {
  track('consulta', {
    origen,
    carrera: carrera || 'sin especificar',
    tipo: tipo || 'sin especificar',
  });
}

export function trackPreguntaFaq(modo: string) {
  track('pregunta-faq', { modo: modo === 'privada' ? 'privada' : 'publica' });
}

export function trackSolicitudClase(materias: number) {
  track('solicitud-clase', { materias });
}
