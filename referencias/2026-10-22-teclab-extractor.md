# Fuentes: compatibilidad del extractor Teclab

- https://portaladministrativo.teclab.edu.ar/login — acceso con la credencial exacta del actualizador; login correcto y menú lateral contraído.
- https://portaladministrativo.teclab.edu.ar/admission/preregistration — navegación verificada mediante Admisión y Preinscripciones.
- https://portaladministrativo.teclab.edu.ar/admission/preregistration/create — formulario y simulador; se inspeccionaron selectores, período y carreras sin crear registros ni buscar un lead.
- https://portaladministrativo.teclab.edu.ar/assets/PreregistrationCreateView-J6s7BSiW.js — recurso público vigente durante el diagnóstico: el cambio de Carrera dispara precios con localidad y lead resuelto; el botón Simular precio sólo navega entre pasos. El nombre del recurso puede cambiar en otro despliegue.
- https://portaladministrativo.teclab.edu.ar/assets/usePreregistrationLabels-k1VztI4l.js — recurso público vigente: `getPricesWithProducts` consulta precios y `findContact` busca leads; `createContact` es una operación separada POST que no se ejecutó.

La consulta del lead existente fue inicialmente denegada y posteriormente autorizada de forma explícita. Las verificaciones posteriores se realizaron sólo bajo ese nuevo alcance, sin crear registros. No se usaron fuentes ajenas al portal ni sesiones de otras aplicaciones.

- https://portaladministrativo.teclab.edu.ar/assets/index-LNAlO771.js — componente VSelect vigente: opciones nativas completas, onAfterEnter que recalcula el scroll, selección por teclado y reinicio del prefijo a los 1000 ms. Se contrastó para no adivinar la interacción con la virtualización.
