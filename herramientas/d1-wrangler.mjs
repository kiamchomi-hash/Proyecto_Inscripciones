#!/usr/bin/env node
// Una sola puerta a `wrangler d1 execute`, compartida por `herramientas/d1.mjs`
// y por el publicador de precios.
//
// Reintenta porque el fallo se midió: cuando wrangler renueva el token OAuth,
// la primera llamada a la API puede volver `401 Unauthorized`
// («Authentication error [code: 10000]») y la siguiente, **con el mismo token
// ya guardado**, responde 200. Pasó 15 veces entre el 27/10 y el 02/11/2026 y
// siempre con `grant_type=refresh_token` en la misma corrida; en los registros
// de wrangler, todos los 401 están precedidos por una renovación y ninguno de
// los reintentos posteriores volvió a fallar. No es un token vencido: es el
// token recién emitido, que la API todavía no acepta.
//
// Un fallo que no es de ese tipo (SQL inválido, base inexistente, sin permiso)
// no se reintenta: se informa y se corta.

import { execFileSync } from 'node:child_process';
import path from 'node:path';

const PROYECTO = path.resolve(new URL('..', import.meta.url).pathname);
export const RUTA_WRANGLER = path.join(PROYECTO, 'cloudflare', 'node_modules', 'wrangler', 'bin', 'wrangler.js');

// Suma ~7 minutos de espera: la corrida diaria tiene una hora de techo y no
// depende de que alguien mire la pantalla.
export const ESPERAS_POR_DEFECTO = [5_000, 15_000, 45_000, 120_000, 240_000];

/** Espera sincrónica, para no convertir en asíncrono a quien ya usa execFileSync. */
export const dormir = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

const ERROR_JSON = /"error"\s*:\s*\{/;

/**
 * El error de wrangler sale como JSON por stdout (`--json`); el texto suelto,
 * por stderr. Devuelve la causa real, sin el `Command failed: node …wrangler.js
 * d1 execute …` que se comía el aviso en el journal.
 */
export function motivoDeFallo({ stdout = '', stderr = '', message = '' } = {}) {
  for (const texto of [stdout, stderr]) {
    const error = errorDeWrangler(texto);
    if (error) {
      const notas = (error.notes ?? []).map(nota => nota?.text).filter(Boolean);
      return [error.text, ...notas].filter(Boolean).join(' — ').slice(0, 400);
    }
  }
  const lineas = String(stderr || message).split('\n')
    .map(linea => linea.trim())
    .filter(linea => linea && !/^Command failed:/.test(linea) && !/^\s*at\s/.test(linea));
  return (lineas.at(-1) || 'wrangler falló sin mensaje').slice(0, 400);
}

function errorDeWrangler(texto) {
  if (!texto || !ERROR_JSON.test(texto)) return null;
  const desde = texto.indexOf('{');
  try {
    const json = JSON.parse(texto.slice(desde));
    return json?.error?.text ? json.error : null;
  } catch {
    return null;
  }
}

// Con `--file`, wrangler dibuja el progreso de la subida antes del JSON
// («├ Checking if file needs uploading»), así que no se puede parsear entero.
export function jsonDeSalida(texto) {
  const lineas = String(texto ?? '').split('\n');
  const desde = lineas.findIndex(linea => /^[[{]/.test(linea));
  return desde < 0 ? null : JSON.parse(lineas.slice(desde).join('\n'));
}

// Sólo estos se reintentan. `10000` es el código de «Authentication error» de
// Cloudflare; los 5xx y los cortes de red son del mismo saco: pasan solos.
const TRANSITORIOS = [
  /\b401\b/, /unauthorized/i, /authentication error/i, /\b10000\b/,
  /\b429\b/, /rate limit/i,
  /\b50[0234]\b/, /internal server error/i, /bad gateway/i, /service unavailable/i,
  /fetch failed/i, /ECONNRESET/i, /ETIMEDOUT/i, /EAI_AGAIN/i, /socket hang up/i,
];

export const esTransitorio = motivo => TRANSITORIOS.some(patron => patron.test(String(motivo)));

/** Corre `accion(intento)` y reintenta los fallos marcados con `error.transitorio`. */
export function conReintentos(accion, { esperas = ESPERAS_POR_DEFECTO, dormir: esperar = dormir, avisar = () => {} } = {}) {
  let ultimo;
  for (let intento = 0; intento <= esperas.length; intento += 1) {
    try {
      return accion(intento);
    } catch (error) {
      ultimo = error;
      if (!error?.transitorio || intento === esperas.length) break;
      const espera = esperas[intento];
      avisar(error, intento + 1, espera);
      esperar(espera);
    }
  }
  throw ultimo;
}

/**
 * `wrangler d1 execute` contra la base remota, con reintento. Devuelve los
 * bloques JSON tal como los da wrangler.
 */
export function ejecutarD1({ base = process.env.D1_PRODUCCION || 'cau-produccion', sql, archivo, cwd, esperas, dormir: esperar } = {}) {
  if (!sql && !archivo) throw new Error('Falta la consulta o el archivo.');
  const esperasUsadas = esperas ?? ESPERAS_POR_DEFECTO;
  return conReintentos((intento) => {
    try {
      const salida = execFileSync(process.execPath, [
        RUTA_WRANGLER, 'd1', 'execute', base, '--remote', '--json', '--yes',
        ...(archivo ? ['--file', path.resolve(archivo)] : ['--command', sql]),
      ], {
        cwd: cwd ?? path.join(PROYECTO, 'cloudflare'),
        encoding: 'utf8',
        maxBuffer: 512 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      return jsonDeSalida(salida) ?? [];
    } catch (error) {
      const fallo = new Error(motivoDeFallo(error));
      fallo.transitorio = esTransitorio(fallo.message);
      fallo.intento = intento + 1;
      throw fallo;
    }
  }, {
    esperas: esperasUsadas,
    dormir: esperar,
    avisar: (error, intento, espera) => process.stderr.write(
      `  Cloudflare: ${error.message.slice(0, 160)} — reintento ${intento + 1}/${esperasUsadas.length + 1} en ${Math.round(espera / 1000)} s\n`,
    ),
  });
}
