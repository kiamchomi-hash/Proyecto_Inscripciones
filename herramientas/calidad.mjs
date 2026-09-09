#!/usr/bin/env node
// Ejecuta todos los controles sin convertir una fuente inaccesible en un aprobado.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const base = args.find(a => a.startsWith('--base='));
const soloWeb = args.includes('--solo-web');
const visual = args.includes('--visual');
const tareas = [
  ...(!soloWeb ? [['código', ['npm', 'run', 'check']], ['dependencias', ['npm', 'audit']], ['contenido', ['npm', 'run', 'auditar']], ['SEO Search Console', ['npm', 'run', 'seo']], ['medición', ['npm', 'run', 'leads', '--', '--estricto']]] : []),
  ...(!soloWeb ? [['producción', ['node', 'herramientas/smoke.mjs', ...(base ? [base] : [])]]] : []),
  ['SEO de páginas', ['node', 'herramientas/seo-paginas.mjs', ...(base ? [base] : [])]],
  ['integraciones', ['node', '--env-file-if-exists=.env.local', 'herramientas/integraciones.mjs', ...(base ? [base] : [])]],
  ['Chromium', ['node', 'herramientas/calidad-web.mjs', ...(base ? [base] : []), ...(visual ? ['--visual'] : [])]],
  ...['firefox', 'webkit'].map(motor => [motor, ['node', 'herramientas/calidad-web.mjs', `--navegador=${motor}`, '--rutas=/,/contacto,/faq', '--anchos=390,1440', ...(base ? [base] : [])]]),
];
const salida = path.resolve('herramientas/vigilancia-logs/calidad', new Date().toISOString().replace(/[:.]/g, '-'));
await mkdir(salida, { recursive: true });
const resultados = [];
for (const [nombre, [comando, ...parametros]] of tareas) {
  console.log(`Verificando ${nombre}...`);
  const resultado = await new Promise(resolve => {
    // npm.cmd necesita cmd en Windows; el comando es fijo y los argumentos de usuario
    // sólo se pasan a node sin shell. No se interpolan rutas ni parámetros en cmd.
    const esNpm = comando === 'npm' && process.platform === 'win32';
    const proceso = spawn(esNpm ? 'cmd.exe' : comando, esNpm ? ['/d', '/s', '/c', ['npm.cmd', ...parametros].join(' ')] : parametros, { windowsHide: true, cwd: path.resolve(import.meta.dirname, '..') });
    let log = '';
    proceso.stdout.on('data', d => { log += d; }); proceso.stderr.on('data', d => { log += d; });
    proceso.on('error', e => resolve({ codigo: 2, log: e.message }));
    proceso.on('close', codigo => resolve({ codigo: codigo ?? 2, log }));
  });
  const archivo = `${resultados.length + 1}.log`;
  await writeFile(path.join(salida, archivo), resultado.log);
  resultados.push({ nombre, codigo: resultado.codigo, estado: resultado.codigo === 0 ? 'ok' : resultado.codigo === 2 ? 'no-verificado' : 'fallo', archivo });
  console.log(`${nombre}: ${resultados.at(-1).estado}. Log: ${path.join(salida, archivo)}`);
}
await writeFile(path.join(salida, 'informe.json'), JSON.stringify({ fecha: new Date().toISOString(), resultados }, null, 2));
process.exitCode = resultados.some(r => r.codigo !== 0) ? 1 : 0;
