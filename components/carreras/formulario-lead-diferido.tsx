// Puente usado sólo por la ficha de carrera. El CSS del formulario viaja con
// este chunk diferido: si se importara como hoja normal, Astro lo pondría en el
// `<head>` de la ficha aunque el componente se monte tarde (así lo decide el
// manifest de la ruta).
//
// Se carga como `<link>` y no como `<style>` con el texto: la CSP de las páginas
// no lleva 'unsafe-inline' para elementos de estilo (sólo hashes del build), y un
// `<style>` creado en el navegador quedaba bloqueado y el formulario sin estilos.
import hojaFormulario from '@/components/formularios/formulario-lead.css?url';
import FormularioLead from '@/components/formularios/formulario-lead';

const ID_ESTILO = 'estilos-formulario-lead-diferido';

if (typeof document !== 'undefined' && !document.getElementById(ID_ESTILO)) {
  const enlace = document.createElement('link');
  enlace.id = ID_ESTILO;
  enlace.rel = 'stylesheet';
  enlace.href = hojaFormulario;
  document.head.appendChild(enlace);
}

export default FormularioLead;
