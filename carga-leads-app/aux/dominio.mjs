export function normalizarTelefono(texto) {
  const limpio = String(texto ?? '').trim();
  if (!/^\+?[\d\s()\-]{8,20}$/.test(limpio)) throw new Error('Formato de teléfono inválido.');
  const digitos = limpio.replace(/\D/g, '');
  if (!/^\d{8,15}$/.test(digitos)) throw new Error('Formato de teléfono inválido.');
  return digitos;
}

export function validarLead(lead) {
  for (const campo of ['nombre', 'apellido', 'correo', 'carrera']) {
    if (typeof lead?.[campo] !== 'string' || !lead[campo].trim()) return `Falta ${campo}.`;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.correo.trim())) return 'El correo no es válido.';
  try { normalizarTelefono(lead.telefono); } catch { return 'El teléfono no es válido.'; }
  return null;
}

export function nivelDe(carreras, nombre) {
  return carreras.find(c => c.nombre === nombre)?.nivel ?? null;
}

export function evento(tipo, datos = {}) {
  return JSON.stringify({ evento: tipo, ...datos });
}

export function esVer(argumentos = process.argv.slice(2)) {
  return argumentos.includes('--ver');
}

export function pidDeSingleton(destino) {
  return String(destino ?? '').match(/-(\d+)$/)?.[1] ?? null;
}
