// Puente usado sólo por la ficha de carrera. El CSS del formulario se importa
// como texto (`?inline`) para que viaje dentro de este chunk diferido: si se
// importara como hoja, Astro lo pondría en el `<head>` de la ficha aunque el
// componente se monte tarde (así lo decide el manifest de la ruta).
import estilos from '@/components/formularios/formulario-lead.css?inline';
import FormularioLead from '@/components/formularios/formulario-lead';

const ID_ESTILO = 'estilos-formulario-lead-diferido';

if (typeof document !== 'undefined' && !document.getElementById(ID_ESTILO)) {
  const estilo = document.createElement('style');
  estilo.id = ID_ESTILO;
  estilo.textContent = estilos;
  document.head.appendChild(estilo);
}

export default FormularioLead;
