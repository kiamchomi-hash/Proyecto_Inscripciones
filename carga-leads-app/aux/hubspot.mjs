export async function ejecutarCarga(adaptador, lead, {
  secar = false, noCrear = false, soloContacto = false, soloNegocio = false, emitir = () => {},
} = {}) {
  emitir('paso', { texto: 'Comprobando la sesión' });
  await adaptador.sesion();

  emitir('paso', { texto: 'Buscando el contacto' });
  let contacto = await adaptador.contactoPorCorreo(lead.correo);
  if (soloNegocio && !contacto) {
    throw Object.assign(
      new Error('No existe el contacto con ese correo. Cargá el lead primero.'),
      { etapa: 'contacto' },
    );
  }
  if (!contacto && noCrear) {
    throw Object.assign(new Error('No se encontró el contacto y no se creó uno (modo sin crear).'), { etapa: 'contacto' });
  }
  if (!contacto) {
    emitir('paso', { texto: 'Creando el contacto' });
    contacto = await adaptador.crearContacto(lead);
  }
  if (soloContacto) {
    emitir('paso', { texto: `Contacto: ${contacto}` });
    emitir('paso', { texto: 'Listo' });
    return { contacto, negocio: null };
  }
  emitir('paso', { texto: 'Creando el negocio' });
  await adaptador.crearNegocio({ ...lead, contacto });
  if (!secar) {
    emitir('paso', { texto: 'Enviando el negocio' });
    await adaptador.enviar();
  }
  emitir('paso', { texto: 'Listo' });
  return { contacto, negocio: null };
}
