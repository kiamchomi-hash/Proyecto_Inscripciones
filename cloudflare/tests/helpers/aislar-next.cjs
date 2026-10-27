// Preload exclusivo del Next de pruebas: no abre archivos dotenv ni red externa.
const fs = require('node:fs');
const net = require('node:net');
const dns = require('node:dns');
const { syncBuiltinESMExports } = require('node:module');
const { basename } = require('node:path');

function sinEntorno(ruta) {
  if (/^\.env(?:\.|$)/.test(basename(String(ruta)))) {
    const error = new Error('Archivo de entorno excluido del harness');
    error.code = 'ENOENT';
    throw error;
  }
}
for (const metodo of ['statSync', 'readFileSync', 'openSync']) {
  const original = fs[metodo];
  fs[metodo] = function (ruta, ...args) {
    sinEntorno(ruta);
    return original.call(this, ruta, ...args);
  };
}
function permitir(host) {
  if (host && !['127.0.0.1', 'localhost', '::1', '[::1]'].includes(host)) {
    throw new Error(`Red externa bloqueada en Next de pruebas: ${host}`);
  }
}
const conectar = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const opciones = Array.isArray(args[0]) ? args[0][0] : args[0];
  if (typeof opciones === 'object') permitir(opciones.host);
  else if (typeof opciones === 'number') permitir(typeof args[1] === 'string' ? args[1] : undefined);
  return conectar.apply(this, args);
};
const lookup = dns.lookup;
dns.lookup = function (host, ...args) { permitir(host); return lookup.call(this, host, ...args); };
const buscar = globalThis.fetch;
globalThis.fetch = function (input, ...args) {
  permitir(new URL(typeof input === 'string' || input instanceof URL ? input : input.url).hostname);
  return buscar.call(this, input, ...args);
};
syncBuiltinESMExports();
