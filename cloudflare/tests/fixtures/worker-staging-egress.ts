// Sonda sólo local: importa el entry real para instalar su bloqueo de red.
import '../../staging/publicar-worker.ts';
import { crearStagingProtegido } from '../../staging/acceso.ts';

export default crearStagingProtegido(async () => {
  await fetch('https://egress-prohibido.invalid/');
  return new Response('La salida no debe ocurrir');
});
