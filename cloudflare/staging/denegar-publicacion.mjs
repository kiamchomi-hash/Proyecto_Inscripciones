// La preparación no se puede usar como un comando de deploy/dry-run. No lee
// credenciales ni invoca Wrangler. Quitar esta guarda requiere otro permiso.
console.error('Staging es una preparación bloqueada: publicación no autorizada.');
process.exitCode = 2;
