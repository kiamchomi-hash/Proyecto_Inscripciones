import fs from 'node:fs';
import path from 'node:path';

const FORMATOS = {
  A5: [148, 210],
  A4: [210, 297],
  A3: [297, 420],
};

const argumentos = Object.fromEntries(
  process.argv.slice(2).map((argumento) => {
    const coincidencia = argumento.match(/^--([^=]+)=(.*)$/);
    if (!coincidencia) {
      console.error(`Argumento inválido: ${argumento}. Usar --clave=valor.`);
      process.exit(2);
    }
    return [coincidencia[1], coincidencia[2]];
  }),
);

const formato = (argumentos.formato || 'A5').toUpperCase();
const orientacion = (argumentos.orientacion || 'vertical').toLowerCase();
const ppp = Number(argumentos.ppp || 300);
const sangrado = Number(argumentos.sangrado || 3);
const seguridad = Number(argumentos.seguridad || 6);
const lienzo = (argumentos.lienzo || 'con-sangrado').toLowerCase();

if (!FORMATOS[formato]) {
  console.error(`Formato desconocido: ${formato}. Disponibles: ${Object.keys(FORMATOS).join(', ')}.`);
  process.exit(2);
}
if (!['vertical', 'horizontal'].includes(orientacion)) {
  console.error('La orientación debe ser vertical u horizontal.');
  process.exit(2);
}
if (![ppp, sangrado, seguridad].every(Number.isFinite) || ppp <= 0 || sangrado < 0 || seguridad < 0) {
  console.error('PPP debe ser positivo; sangrado y seguridad no pueden ser negativos.');
  process.exit(2);
}
if (!['corte', 'con-sangrado'].includes(lienzo)) {
  console.error('El lienzo debe ser corte o con-sangrado.');
  process.exit(2);
}

const convertir = (mm) => Math.round((mm / 25.4) * ppp);
let [anchoCorte, altoCorte] = FORMATOS[formato];
if (orientacion === 'horizontal') [anchoCorte, altoCorte] = [altoCorte, anchoCorte];

const anchoSangrado = anchoCorte + 2 * sangrado;
const altoSangrado = altoCorte + 2 * sangrado;
const esperado = lienzo === 'corte'
  ? [convertir(anchoCorte), convertir(altoCorte)]
  : [convertir(anchoSangrado), convertir(altoSangrado)];

console.log(`${formato} ${orientacion}`);
console.log(`Corte: ${anchoCorte} × ${altoCorte} mm = ${convertir(anchoCorte)} × ${convertir(altoCorte)} px a ${ppp} ppp`);
console.log(`Con ${sangrado} mm de sangrado: ${anchoSangrado} × ${altoSangrado} mm = ${convertir(anchoSangrado)} × ${convertir(altoSangrado)} px`);
console.log(`Zona segura: ${seguridad} mm dentro del corte = ${convertir(seguridad)} px; ${sangrado + seguridad} mm desde el borde exterior = ${convertir(sangrado + seguridad)} px`);

if (argumentos.png) {
  const archivo = path.resolve(argumentos.png);
  const datos = fs.readFileSync(archivo);
  const firma = '89504e470d0a1a0a';
  if (datos.length < 24 || datos.subarray(0, 8).toString('hex') !== firma) {
    console.error(`No es un PNG válido: ${archivo}`);
    process.exit(1);
  }
  const real = [datos.readUInt32BE(16), datos.readUInt32BE(20)];
  const coincide = real[0] === esperado[0] && real[1] === esperado[1];
  console.log(`PNG: ${real[0]} × ${real[1]} px; esperado para lienzo ${lienzo}: ${esperado[0]} × ${esperado[1]} px`);
  if (!coincide) {
    console.error('ERROR: las dimensiones del PNG no coinciden.');
    process.exit(1);
  }
  console.log('OK: dimensiones exactas.');
}
