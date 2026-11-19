export async function ejecutarCarga(adaptador, lead, { secar = false, noCrear = false, emitir = () => {} } = {}) {
  emitir('paso', { texto: 'Comprobando la sesión' });
  await adaptador.sesion();

  emitir('paso', { texto: 'Buscando el contacto' });
  let contacto = await adaptador.contactoPorCorreo(lead.correo);
  if (!contacto && noCrear) {
    throw Object.assign(new Error('No se encontró el contacto y no se creó uno (modo sin crear).'), { etapa: 'contacto' });
  }
  if (!contacto) {
    emitir('paso', { texto: 'Creando el contacto' });
    contacto = await adaptador.crearContacto(lead);
  }

  emitir('paso', { texto: 'Creando el negocio' });
  const preparado = await adaptador.crearNegocio({ ...lead, contacto });
  let negocio = null;
  if (!secar) {
    emitir('paso', { texto: 'Enviando el negocio' });
    negocio = await adaptador.enviar(preparado);
    if (!/^\d+$/.test(negocio ?? '')) {
      throw Object.assign(
        new Error('No se pudo confirmar el negocio. Revisá la ficha del contacto antes de reintentar.'),
        { etapa: 'Verificando el negocio' },
      );
    }
  }
  emitir('paso', { texto: 'Listo' });
  return { contacto, negocio };
}
