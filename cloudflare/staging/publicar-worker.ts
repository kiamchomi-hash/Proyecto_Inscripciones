// Entry remoto exclusivo. No cambia la barrera de preparación ni el build local.
import aplicacion from '../dist/server/entry.mjs';
import { crearStagingProtegido } from './acceso.ts';
import { buscarStaging } from './worker.ts';
import { crearBusquedaCorreo } from './correo-controlado.ts';
import { crearBusquedaCaptcha } from './formulario-controlado.ts';
import { crearBusquedaTelegram } from './telegram-controlado.ts';

// Único egreso autorizado del ensayo: el envío de correo controlado. Se captura
// el fetch real ANTES de cerrar el global; todo lo demás falla sin hacer red.
const redReal = globalThis.fetch;

// La aplicación no recibe transporte operativo. Toda salida fetch global falla
// antes de hacer red; ASSETS y D1 son bindings explícitos, no este transporte.
globalThis.fetch = () => buscarStaging('deshabilitado');

const buscarCorreo = crearBusquedaCorreo(redReal);
const buscarTelegram = crearBusquedaTelegram(redReal);

export default crearStagingProtegido(async (request, env, ctx) => {
  const asset = await env.ASSETS?.fetch(request);
  if (asset && asset.status !== 404) return asset;
  return aplicacion.fetch(request, env, ctx);
}, { buscarCorreo, buscarCaptcha: crearBusquedaCaptcha(redReal), buscarTelegram });
