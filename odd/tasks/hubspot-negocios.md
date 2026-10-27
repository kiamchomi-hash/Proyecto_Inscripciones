# Automatización local de negocios asignados

## Objetivo
Convertir el recorrido enseñado el 17/10/2026 en un script reutilizable: notificaciones «Te asignaron un negocio», lectura de contacto/carrera/teléfono, nota «asesoro», tarea «seguimiento» a tres días calendario y lista compacta con enlaces WhatsApp de texto, sin enviar mensajes.

## Autorización y restricciones
Usuario pidió implementación y continuidad el 18/10. Perfil exclusivo de Brave externo; reutilizar sesión y ventana única. Ante login/código detenerse y avisar, sin usar el autenticador anterior que reenvía OTP. No leer correo ni credenciales para este flujo. No modificar propiedades, pipeline ni completar tareas. No publicar ni forzar archivos privados a git. No repetir escrituras ante resultado incierto.

## Estado previo comprobado
Existe hubspot-acceso.mjs parcial, no existe script de negocios. Lista estática ventas/hubspot-negocios.html contiene seis filas. En negocio 66163077430 ya se creó nota «asesoro» y tarea «seguimiento» con vencimiento 20/10/2026 08:00: no duplicar ni mover esa fecha. Otros negocios pueden tener actividades manuales previas.

## Criterios de datos
Conservar mensaje exacto aprobado de los cinco enlaces existentes, cambiando sólo nombre/carrera/duración. Mantener nombre Andlía, doble ** y emojis. La Licenciatura en Diseño y Animación Digital dura cuatro años y admite EDH; la Tecnicatura es distinta y dura dos. Modalidad Presencial del negocio no elimina la oferta EDH: señalar divergencia, no omitir automáticamente enlace virtual ni editar CRM. No enviar mensajes; la frase «100% virtual» conserva advertencia factual separada. No inferir duración si faltan fuentes inequívocas.

## Tareas y ruta
- [x] T1 Dominio probado: matching por título completo, vencimiento calendario Buenos Aires, enlaces/mensaje/HTML seguros. Delegado: preparación y varios archivos.
- [x] T2 Adaptador CLI de sesión existente, lectura de notificaciones y actividades; estado e idempotencia para escrituras. Delegado: nueva lógica y navegador.
- [x] T3 Verificación independiente y prueba acotada sin nuevas escrituras; lista visible y comando de uso. Delegado: tests y verificación.

## Superficies
herramientas/ventas/rutas.mjs; herramientas/ventas/hubspot-negocios.mjs; herramientas/ventas/hubspot-negocios-dominio.mjs; herramientas/ventas/tests/hubspot-negocios.test.mjs; herramientas/ventas/LEER-hubspot.md; ventas/hubspot-negocios.html; estado y lock privados del robot.

## Pruebas
RED antes de implementar funciones deterministas, GREEN y regresión del login. Sintaxis de módulos y pruebas node:test privadas. Comprobación real de sesión/lectura sin modificar CRM. Fallos de check previos no se atribuyen al baseline sin evidencia actual. RDD global estaba desactivado; volver a consultar sin cambiarlo.

## Entrega
ask-on-risk; estimación inicial 400–600 líneas privadas, mantener un cambio coherente sin PR ni publicación. No commits de archivos ignorados. Fuente y pruebas quedan privadas. No afirmar éxito de escrituras que no se hayan verificado. Próximo paso: T1/T2 con un escritor y después T3 independiente.

## Cambio de entrega confirmado, 18/10/2026
El usuario confirmó que «panel» refiere a la lista de leads de este flujo, NO al Buscador en vivo. Quiere app local siempre activa al iniciar PC. Se integra con servidor local propio (sin nuevo stack ni precios), panel compacto y servicio de usuario/autoinicio, una ventana como máximo. Escritor autorizado a crear módulos privados hubspot-panel.mjs, hubspot-panel-ui.mjs, hubspot-panel-inicio.mjs y tests; instalación fuera del repo mediante revisión de permisos separada. No aplicar nuevos cambios CRM durante construcción. Script de negocios parcial ya creado; once pruebas pasaron, adaptador todavía no validado de punta a punta.

- [x] T4 App local de leads, estado persistente y endpoints locales protegidos.
- [ ] T5 Instalar autoinicio de usuario y comprobar una sola instancia, sin dejar Brave robot activo.

## Estado observado al cierre de este tramo
- Dominio/CLI/app creados; 21 pruebas enfocadas y 11 de regresión de acceso aprobadas. Sin npm run check final (alcance acotado).
- App Linux instalada: servicio cau-hubspot-panel.service habilitado y activo, XDG autoinicio; HTTP127.0.0.1:4322 respondió200 con seis filas. Instalador corregido: WorkingDirectory de systemd no debe tener comillas shell.
- Pedido posterior: quitar «Trabajar siguiente» y procesar automáticamente. Implementados ciclo inicio+5min, exclusión/serialización, aviso local y pausa de sesión. Cola corregida para no quedarse en primeros20procesados.
- No está probado el guardado autónomo extremo a extremo. Prueba real limitada volvió a fallar en interfaz antes de aplicar; no se declararon nuevas notas/tareas guardadas. Nunca se envió WhatsApp.
- Por ese bloqueo, estado automático PAUSADO con diagnóstico visible. Servicio/app sí activos; NO confundirlos con robot funcional completo. Próximo paso pendiente: resolver carga/lectura de controles reales y verificar un negocio antes de reanudar automático. Loli excluida permanentemente.
- Se mantuvo una ventana del panel; los contextos de robot se cierran. La lista ya no depende del HTML estático para su estado.

## Reanudación verificada, 18/10/2026
- Rocio 66145141017 completada por script real: nota asesoro y tarea seguimiento21/10/2026 08:00 verificadas, registro persistido excluido. Loli intacta; no se enviaron WhatsApp.
- Causa de fallos: pestañas de actividades desbordadas aunque visibles; viewport1920x1080 y data-tab-hidden=false. Campana espera readiness45s. Perfil restauraba14pestañas: recorte a1 y cierre0 comprobados.
- Veinticinco pruebas enfocadas aprobadas y sintaxis correcta. npm run check final omitido, pendiente. Sin commits ni push de herramientas privadas.
- Servicio reiniciado y automático ACTIVO. HTTP200 observó ocupado=true con1pestaña y0ventanasrobot. Estado del navegador disponible, Trabajar siguiente eliminado.
- Enlaces WhatsApp abren perfil Brave de nombre exacto siglo21, directorio Profile 1, sólo tras clic humano; no se envían mensajes. Perfil resuelto, apertura real del enlace no ejecutada durante esta prueba.
- Arranque configurado y servicio activo comprobados; encendido nuevo de PC todavía no observado. Aplicación puede requerir recargar su ventana para ver controles nuevos.

## Ritmo corregido
Por pedido del usuario se eliminó la pausa entre negocios: la tanda continúa inmediatamente tras verificar un ID nuevo; cinco minutos sólo es sondeo con cola vacía/bloqueada/sin progreso. Pruebas panel12/12 y revisión independiente sin hallazgos graves. Servicio reiniciado tras comprobar que no había operación en curso. No cambiar fechas de seguimientos ni volver a procesar trabajados.

## Nombre y acuse de notificaciones
Remitente corregido exactamente a Analia y seis mensajes regenerados. Se separó el acuse de notificación de las actividades: sólo asignación del negocio verificado, botón UI Marcar como leída, nunca completar seguimiento futuro ni borrar aviso. Cuatro notificaciones pendientes realmente marcadas; dos ya estaban leídas. Seis acuses persistidos, sin alterar actividades. Treinta y cinco pruebas aprobadas; servicio reanudado activo, automático no pausado, nombre correcto comprobado en los seis enlaces.

## Pendientes indicados por el usuario
Registrados el 18/10/2026 para más adelante, sin implementar ni ampliar el comportamiento actual:
- [x] T6 Columna manual «Motivo de calificación» con todas las opciones reales de HubSpot, confirmada por el usuario. Respetar permisos por registro, leer valor vigente y verificar guardado. No modificar pipeline/canal de gestión ni automatizar elección de motivos. Implementación en curso.
- [x] T7 Mostrar un check manual junto al enlace de WhatsApp. El usuario confirmó que lo marcará después de enviar; no se marca al abrir el enlace. Debe persistir por negocio y poder desmarcarse. Implementación en curso, sin envío ni lectura de WhatsApp.
- [ ] T8 Automatizar seguimientos y actividades futuras. Reglas, momentos y alcance pendientes de detallar; no implica autorización para enviar mensajes automáticamente.

## T7 verificada
Casilla manual «Enviado manualmente» junto al enlace, reversible y persistida por ID en whatsappEnviados, independiente de apertura y robot. Diecinueve pruebas panel aprobadas, incluida persistencia/recarga y concurrencia. Servicio actualizado tras comprobar inactividad. No se marcó ningún envío real ni se enviaron mensajes durante la prueba.

## Reanudación del 19/10/2026
T6 quedó implementada parcialmente antes de una interrupción; completar y verificar sin repetir cambios CRM. El usuario pidió además que los negocios recién incorporados aparezcan arriba: anteponer nuevos y conservar posición de los ya presentes al actualizar datos, sin duplicados ni pérdida de checks/motivos. Fuente local existente se retoma, no se rehace.

## T6 y orden entregados, 19/10/2026
Columna Motivo de calificación con 49 valores reales, Consultar y Guardar con confirmación. Permisos y valor anterior se revalidan; intención persistida y readback evitan reintentos inciertos. No se eligió ni cambió ningún motivo real en las pruebas. Nuevas filas se anteponen y las existentes mantienen posición al refrescar, preservando checks y borradores. Treinta y una pruebas panel+motivo aprobadas, sintaxis y revisión independiente; carrera de requests corregida con recheck tras body. Servicio actualizado en reposo y panel recargado. Fullcheck general no ejecutado; guardado real de motivo pendiente del uso manual autorizado.

## Seguimientos de tickets de negocio, alcance confirmado 19/10/2026
- Separar arriba cuatro pestañas, en orden: Tickets negocio; Seguimientos de tickets de negocio; Activity; Casos a soporte. Conservar tickets; implementar ahora sólo seguimientos, sin inventar datos ni automatizar Activity/soporte.
- El motivo lo elige manualmente el usuario según la respuesta del lead. Acción deliberada Guardar y completar: verificar motivo en el negocio asociado y luego completar únicamente la tarea elegida si sigue pendiente. Nunca desmarcar una completada.
- Fuente real global: /prospecting/44080364/tasks, once páginas de 25 observadas. No restringir silenciosamente a siete negocios locales. IDs estables en crm-table-row/data-test-object-id, estado explícito data-is-completed; tipo Por hacer no equivale a pendiente.
- Tarea ejemplo pendiente118818142606, seguimiento,02/11/2026 08:00, CAU VLG01, una asociación a negocio Martillero. ID de negocio aún sin resolver: no inferir por título. Detalle real /prospecting/44080364/tasks/view/all/task/118818142606; se abre con Enter en tasks-table-edit-button y se cierra Cancelar sin guardar.
- Rosa negocio65863789357 tiene tarea118345466249 Seguimiento ya completada, no tocar.
- [x] T9 Pestañas y listado global de seguimientos pendientes con paginación y fechas reales.
- [x] T10 Resolución inequívoca tarea→negocio y acción manual motivo+completar con intención/readback, sin reintento ciego.
- [x] T11 Pruebas y lectura real; no completar tareas reales durante verificación sin que el usuario elija motivo y tarea.

## Seguimientos implementados y lectura verificada, 19/10/2026
Ruta delegada: backend y UI no triviales. Cuatro pestañas en el orden solicitado; Activity y soporte deshabilitados. Listado global paginado: lectura real de 25 IDs exactos, 25 pendientes y más páginas disponibles. Asociación inequívoca obtenida de respuestas generadas por la UI; tarea118818142606 corresponde a negocio66163077430, sin inferir títulos. Tabla virtualizada sólo hidrataba21iconos de25filas: se cruzan IDs DOM con propiedades canónicas de la respuesta UI, sin llamadas API construidas. Guardar y completar exige selección manual, validación actual, intención persistida y readback; completadas nunca se alternan. 41 pruebas enfocadas aprobadas y repetidas por el padre. Cero cambios CRM durante las pruebas: guardado y completado real siguen pendientes del uso manual elegido por el usuario. Fullcheck general no ejecutado. Servicio reanudado y ventana de app abierta; sin commits ni publicación de herramientas privadas.

## Traslado de tickets trabajados y check manual de seguimiento, 19/10/2026
- [x] T12 Mover visualmente tickets iniciales ya comprobados a Seguimientos, sin borrar filas, enlaces iniciales ni checks previos. Clasificación desde estado verificado del robot, nunca desde WhatsApp enviado.
- [x] T13 En esos negocios, enlace WhatsApp sólo con teléfono en el mismo perfil siglo21 y casilla reversible «Seguimiento realizado» persistida por negocio. No inventar mensaje ni completar tareas CRM al marcar.
- Ruta delegada: backend y UI coordinados; pruebas RED→GREEN para clasificación, partición, conservación de datos, endpoint local y reversión/concurrencia de check. Mantener listado global de tareas y motivos separado. No reiniciar servicio ni modificar JSON activo durante implementación.

Verificación T12/T13: 66 pruebas privadas HubSpot aprobadas (panel, negocios, motivo y seguimientos), RED→GREEN observado para partición y teléfono sin mensaje, sintaxis correcta de tres módulos modificados. Checks iniciales, enlaces originales y tareas globales preservados; nuevo check probado reversible y contra GET antiguo, independiente del robot ocupado. No se escribió JSON activo, no se abrió WhatsApp ni se modificó CRM. Despliegue pendiente del padre tras esperar inactividad y reiniciar la app.

- [x] T14 Retirar de la app la lista global de tareas y su API/lecturas. Seguimientos conserva sólo los negocios locales comprobados, sin filtro de fecha, con WhatsApp sólo teléfono y check manual persistente. Ruta delegada; sin mutaciones CRM ni JSON activo.

Verificación T14: RED observado (ruta global devolvía 200 y abrir la pestaña hacía POST global); GREEN de panel y sintaxis. Se conserva el estado local completo, sin filtrar fechas ni tocar JSON activo o CRM. Adaptador global desconectado del servidor y su ruta retirada; módulo histórico queda inactivo. Reinicio por el padre pendiente.

## Pendientes propios de HubSpot, 19/10/2026
Solicitud registrada, sin implementar ahora. Estos pendientes se mantienen separados del resto del proyecto.

- [x] T15 Pasar el lead de Tickets negocio a Seguimientos inmediatamente al marcar «Enviado manualmente» en WhatsApp, en lugar de trasladarlo sólo por el trabajo inicial verificado del robot. Conservar los datos y checks existentes; no implica enviar mensajes ni completar tareas CRM.
- [ ] T16 Mejorar la estética de las pestañas superiores, conservando su orden y las secciones todavía deshabilitadas.
- [x] T17 Mostrar un contador rojo por pestaña cuando haya WhatsApp iniciales por enviar o seguimientos por realizar. Basarse en las casillas manuales persistidas, sin interpretar abrir WhatsApp como envío ni inventar vencimientos.
  - Implementado con `cuentasPendientes()` en `hubspot-panel-ui.mjs`: Tickets cuenta filas sin `enviado`, Seguimientos las confirmadas con `seguimientosRealizados[id].realizado !== true` y Activity las filas pendientes de WhatsApp. El contador es el pendiente, no el total de filas, y se pinta con `data-pendiente` en rojo (`var(--rojo)`) cuando no es cero; el mismo texto va como `aria-label` («13 seguimientos por realizar»). `pintarCuentas` recalcula número, color y etiqueta en cada sondeo.
  - Verificado en vivo: marcar «Seguimiento realizado» bajó el contador a 12 y desmarcarlo lo devolvió a 13, sin escribir en HubSpot ni cambiar la fecha de vencimiento. 173/173 pruebas HubSpot PASS y sintaxis correcta.
- [ ] T18 Definir con el usuario el mensaje de WhatsApp de seguimiento. Hasta entonces, enlace sólo al teléfono.

La entrada general «Automatizar HubSpot» de PENDIENTES.md enlaza este documento; aquí se separan los pendientes y su historial de lo ya terminado. El listado global de HubSpot sigue retirado.

- [x] T19 Diagnosticar pausas con etapa y error seguro persistidos; comprobar sesión/limpieza mediante actualización de sólo lectura antes de reanudar. No reactivar a ciegas ni cambiar CRM para diagnosticar. Ruta delegada; conservar T15–T18 pendientes.

T19 implementación: diagnóstico seguro persistido y visible, etapa en robot/posprocesado/limpieza; resultado vacío exitoso reanuda sólo tras retorno completo. RED observado en pruebas de diagnóstico/limpieza propagada al panel; GREEN 58/58 panel+negocios y sintaxis. Comprobación real de sesión pendiente del padre; no se reactivó automático ni se ejecutó CRM. T15–T18 siguen pendientes.

T19 corrección diagnóstica: preview límite1 exitoso no cubría POST actualizar límite20. El error histórico no es recuperable (sólo clase Error y etapa leer_negocios). Añadida razón enumerada de17mensajes estáticos y etapas asignaciones/ficha/actividades, sin guardar texto dinámico. RED→GREEN59/59 panel+negocios, sintaxis3módulos. Pendiente comprobación real del mismo alcance20 por el padre, sin aplicar ni reactivar a ciegas. Siete trabajados conservados y otro registro bloqueado por lectura sin intenciones; no se escribió JSON activo.

T19 causa real confirmada por preview20: oferta_edh_no_confirmada en leer_ficha. Corrección acotada: bloquear sólo ese negocio con razón visible y sin mensaje/actividades; continuar candidatos válidos hasta límite, con20lecturas máximas. No absorber sesión/navegación. El bloqueado queda fuera de elegibilidad y no se considera verificado; no hay reintento en drenaje. RED→GREEN61pruebas panel+negocios, sin CRM ni reinicio. Comprobación real posterior pendiente del padre.

T15 autorizado19/10: traslado visible exclusivamente por confirmación manual whatsappEnviados, reversible al desmarcar, nunca por trabajo robot. Preservar todos los datos. T20 autorizado: aceptar variante explícita Distribuida Home sin prefijo Educación; no genericvirtual, sin desbloqueos masivos/CRM.

- [x] T20 Reconocer Distribuida Home explícita sin Educación; rechazar sólo Virtual como prueba EDH. Fixture local Seguridad Informática4años aprobado. Sin alterar promesas de exámenes.

T15/T20 verificación: Gonzalo encontrado localmente con enviado=false y robottrabajado=true (causa del traslado incorrecto). Partición y elegibilidad de endpoints ahora sólo enviado===true; desmarcar desde Seguimientos devuelve Tickets sin perder enlace/motivo/check seguimiento. RED→GREEN64/64 panel+negocios, sintaxis3módulos. Sin CRM/JSONactivo/reinicio. Para recuperar bloqueo EDH concreto, preview de ese ID sin aplicar debe comprobar ficha y actividades sin intenciones antes de retirar únicamente su bloqueo lectura/EDH; no desbloqueo masivo.

- [x] T21 Corregir apertura tras reinicio: SingletonLock privado de arranque previo apunta PID reutilizado de proceso ajeno. No señalizar ese PID. Aceptar sólo evidencia temporal anterior al arranque actual como candado obsoleto; preservar rechazo de host ajeno/proceso no verificable contemporáneo. Ruta delegada, sin CRM/backend/reinicio.

T21 evidencia: candado privado20/10 00:52:38Z, arranque20/10 12:34:17Z; PID2032 reutilizado por csd-keyboard, no Brave. Clasificador reconoce sólo candado anterior al boot como obsoleto tras validar host; no señaliza PIDni borra candado. RED→GREEN3pruebas nuevas+sintaxis; abrir ventana real pendiente padre. Backend/CRM/siglo21 intactos.

- [x] T22 Corregir arranque frío de WhatsApp siglo21: servicio actual sin DISPLAY/XAUTHORITY aunque usermanager sí las tiene. Recuperar sólo variables gráficas vigentes al lanzar, mantener perfil exacto y detectar salida temprana fallida; sin cerrar Brave ni tocar CRM.

T22 evidencia: servicioPID1738 sin DISPLAY/XAUTHORITY; usermanager y sesión actual sí las tienen, DBUS/runtime iguales. Fuente recupera únicamente entorno gráfico al click; argv/perfil ya eran correctos. Detecta exit temprano no cero en ventana400ms sin esperar browserexit. RED→GREEN41/41 panel+sintaxis, sin launch real/kill/CRM/reinicio. Prueba visual frío pendiente del padre, sin cerrar navegadores ajenos automáticamente.

- [x] T23 Cambiar destino WhatsApp inicial/seguimiento al perfil exacto teclab solicitado por el usuario, resuelto por metadata Local State sin asumir directorio. No cambiar perfiles panel/robot ni abrir navegador durante implementación.

T23 evidencia: LocalState profile.info_cache contiene nombreTeclab/directorioProfile2 único. Resolver exacto teclab, missing/ambiguo/antiguosiglo21 rechazados, ambos endpoints usanmismoabridor. RED→GREEN41/41panel ysyntaxPASS. Sin navegadorreal/CRM/JSONactivo/reinicio. Preferenciaactual reemplaza destinoWhatsAppsiglo21, no perfilesrobot/panel.

## Perfiles de WhatsApp por actividad, 20/10/2026
- Tickets de negocio y sus seguimientos: perfil Brave Teclab.
- Activity: perfil Brave siglo21 cuando se implemente esa sección. Activity continúa deshabilitada; esta preferencia no habilita su automatización.
- Casos a soporte: perfil Brave siglo21 cuando se implemente esa sección; continúa deshabilitada.

- [x] T24 Recuperación automática acotada sólo de TimeoutError en lectura de asignaciones: un reintento sólo lectura tras limpieza, luego sondeo5min. Sesión e incertidumbre de escrituras conservan pausa. Sin pruebas destructivas ni reinicio/JSONactivo.

T24 RED→GREEN69/69panel+negocios, sintaxisPASS. Un timeoutasignaciones permite1reintento inmediato sólolectura tras finally y luego5min si persiste; sin solapar, cancelable y aviso sólo transición. Éxitolectura permiteautoen siguientesondeo. Migración sólo pausa histórica Error/TimeoutError/leer_asignaciones; sesión, escriturasinciertas yotros errores nopasan. Sin fallorealinducido,CRM,JSONactivo/reinicio.

## Pendiente de recorrido de Activity, 20/10/2026
- [ ] T25 SUPERSEDED: Contemplar paginación en Mis tickets: las 25 filas observadas corresponden sólo a la primera página, no al total. Recorrer las activities de abajo hacia arriba y detener la búsqueda al encontrar una en estado «En gestión». No asumir orden global entre páginas hasta verificarlo al implementar. Registrar esta regla sin ejecutarla ni configurar nada ahora.


## Activity — revisión reciente con vencimiento propio
T25 queda reemplazada: NO detenerse en En gestión ni inferir orden por estado.
- [x] T26 Fuente verificada últimas168horas, orden/filtro creación, paginación acotada y vencimiento propio BA; preview real sólo lectura.
- [ ] T27 Cola persistente por ticket, intenciones/deduplicación y verificación logContacto+EnGestión; escrituras desactivadas hasta preview y habilitación del padre.
- [x] T28 Pestaña Activity, texto completo/enlace siglo21, revisión automática serializada y seguridad endpoints, sin envío automático.
Ruta delegada singlewriter. Previsión400–700líneas privadas con pruebas/documentación; no commits ni PR públicos. Sin CRMwrites durante implementación. Faltas de evidencia se informan como parcial, nunca se simula lista vacía o éxito.

T26/T28 cierre de candidato preview: fuente real10tickets recientes,2detalles completos con2enlaces ytexto, ambos Lista para revisión; restante8visibleincompleto. Creación orden1probado20Oct→7Oct, -1ascendente2025; duepropertyexactaverificada. Criteriodemo49688849409 leído807UTF16. Teléfono corregido desde tarjetaContactos exacta conúnicoID, no property-inputdelcontacto. Cola persiste todoslosIDsantesdetalles; default3detalles/ciclo prioriza desconocidos para progresar porlos10, luego refrescaantiguos. Pestaña/API/WhatsAppsiglo21, negociosTeclab ychecks/borradorespreservados. RED→GREEN78/78pruebasactivity+panel+negocios,sintaxis3módulos. Fullcheckomitidoporámbitoprivado. NoCRMwrites/WhatsAppabierto/JSONactivo/reinicio.

T27 SIGUE PENDIENTE: motor purointención/log/estado probado sólo con mocks, NOadaptadorUIrealhistorialcompleto, NOregistrocorreo/cambioestado/ackticket niactivaciónescrituras. No afirmarautomatizaciónCRMcompleta. El previewesusable ydesplegable; implementaciónremotaposterior requiere pruebadedup/readbackyhabilitacióndelpadre. Sincomitspúblicos porarchivosprivados.

- [x] T29 Simplificar sólo título mostrado en Activity: quitar código inicial alfanumérico reconocido y número identificador final cuando ambos delimitan el título. Preservar fecha, texto significativo, URL/ID y fuente íntegra. Sin CRM ni cambios de estado.

T29 RED→GREEN47/47pruebaspanel ysyntaxUI. Ejemploexactomuestra Campaña - Tutor Dinamizador - Seguimiento académico - 20/10/26 sinPSHS039495/41939241; linkmantiene49653212690. Títulosgenéricos,escape yfuente intactos. SinJSONactivo/CRM/reinicio/WhatsApp.

T27 autorizado20/10: implementar adaptadorUIreal de logCorreo Contacto concontactoúnico, dedup exhaustivo e intención durable, luego Nuevo→EnGestión conreload. Worker sóloinspecciónreadonly; padre comprobaráuneligibleantesactivarautoflujo. Notificacionesseparadaspendientes. Compactar columna título sinrediseño.

T27 candidato implementado20/10: adaptadorUIreal RegistrarcorreoLOG(Contactadoúnico,Contacto,tareaopcionalfalse), historialCorreosseleccionado/agotarobservador/contenidonotruncado/audienciaexacta, intenciónantesguardar yreloadreadback, luegoNuevo→EnGestión. Faseincierta bloqueada porIDsinreintento. DefaultActivityhabilitadafalse, aplicar1IDconfirmadoencola yverificarsólolectura; habilitar sólo trasfasepropia verificada. Sourceautorevisiónmax10detallescuandohabilitado,3preview; cron/lockúnicospreservados. ColumnaNombre16rem conwrap. NotificacionesNOincluidas.

Proofreadonly final: demo49688849409=1logContacto+EnGestión; candidato49653212690=0logs+Nuevo+vence22/10/2026, amboscontextocerrado. Bugdedupencontrado/corregido: editablebodyincluyeetiquetaaccesibleEditar..., contenido realdivhijo(excluyespanScreenReaderOnly). Guardpipelineexige coincidenciavisibleúnicadespuésdefreshread, sin asumir sólo conteoglobal.109/109regresionesHubSpot ysyntax3módulosPASS, RED→GREENcontratosUI/gates/cuerpoaccesible. SINwritesCRM/JSONactivo/reinicio/WhatsAppworker.

T27 sigue sin check final hasta prueba REAL de aplicación por el padre e independiente readback. Candidate source congelado. Padre debe reiniciar servicio detenido conActivitywritesOFF, esperaridle, aplicarunID, verificar yreciénhabilitar. Fullcheckomitido privado; no commits.

## Nuevos pendientes de HubSpot y CAU indicados por el usuario, 20/10/2026
Registrados para tratamiento posterior, sin implementar de inmediato:
- [ ] T30 **Agregar check de WhatsApp**: casilla manual de confirmación de envío en las secciones donde falta (ej. en pestaña Activity o mensajes pendientes).
- [x] T31 **Permitir editar el texto del textarea**: hacer editable el textarea (retirar `readonly` de `.activity-texto` o permitir ajustar el texto antes de generar el enlace/mensaje).
- [ ] T32 **Abrir las mesas al hacer clic en el día**: desplegar o abrir las mesas de examen / turnos al hacer clic sobre el día/fecha.
- [ ] T33 **Completar los procesos CAU**: registrar e incorporar los procesos y trámites administrativos de la sede en la herramienta de soporte.


### T27 — corrección de identidad, 20/10/2026
- Se elimina la equivalencia nombre→ID: selección y audiencia del correo exigen enlace canónico al contacto exacto; ausencia/ambigüedad bloquea antes de guardar.
- Una fase local verificada vuelve a comprobar asociación, pipeline, texto, vencimiento, estado En Gestión y exactamente un log Contacto antes de considerarse vigente.
- RED observado en nuevas regresiones de identidad/readback; GREEN 13/13 tests Activity y sintaxis correcta.
- Inspección DOM real pendiente: ejecución no iniciada por límite de uso de la revisión automática de permisos. No hubo navegador ni escrituras CRM en esta corrección. No habilitar T27 hasta demostrar identidad real; los enlaces exigidos son una guardia fail-closed, no selectores verificados en producción.

#### T27 — cadena de identidad previa al guardado
- Evidencia del explorador: audiencia del log sí expone enlace canónico al contacto; opción del selector no expone enlace ni ID estable.
- Se sustituye el requisito imposible del selector por tarjeta asociada al ID canónico, email único exacto, opción única nombre+email y checkbox seleccionado. La tarjeta se vuelve a comprobar antes de cerrar el selector. Homónimos/duplicados/ID distinto bloquean.
- Audiencia y deduplicación mantienen requisito de href canónico. No se asigna un ID por nombre.
- RED de nueva regresión observado; GREEN 14/14 Activity. Escritura real pendiente de prueba supervisada, sin CRM modificado por el worker.

#### T27 — causa real del bloqueo de aplicación
- Read-only real del ticket 49854251627: falla exactamente `Pipeline Activity no comprobado.` en adaptador.leer, antes de logs/intenciones. El texto global visible no es único; no se encontró propiedad `[data-selenium-test*="pipeline"]`. No se adivina selector ni se elimina la validación.
- Se persiste diagnóstico enumerado `pipeline_no_comprobado`, etapa `pipeline`, nombre seguro; errores desconocidos no guardan mensajes privados. No se desbloquea ni reintenta automáticamente ninguna escritura.
- RED/GREEN de diagnóstico seguro; 40/40 Activity+negocios y sintaxis correctas. Contexto de diagnóstico cerrado; sin CRM cambiado. Selector de pipeline preciso pendiente de inspección acotada; Activity OFF.
- Inspección semántica única posterior: `Pipeline:` visible es un elemento P dentro de DIV; padre y abuelo no contienen exclusivamente la línea esperada. Contexto cerrado. No se implementa un selector especulativo; guardia continúa fail-closed. Pendiente capturar estructura acotada de hermanos/HTML y señal real de autosave antes de reload del estado.

#### T27 — Pipeline resuelto con estructura real y prueba de lectura
- DOM real: `[data-test-id="highlight-property-item-hs_pipeline"]` contiene `[data-test-id="property-input-hs_pipeline"]`; el primer render tiene `[data-test-id="loading-text"]`. Guardia scoped espera desaparición del skeleton y exige valor exacto.
- Prueba real read-only adaptador.leer ticket 49854251627: Nuevo, logs0, contexto cerrado exit0, ningún cambio CRM. El bloqueo persistido no se limpió.
- Estado: antes de click se observa respuesta real de mutación con ticketID y propiedad exactos en payload JSON, exige HTTP correcto antes de reload. Si no hay respuesta identificable, queda incierto sin retry. Este fence queda pendiente de prueba de escritura supervisada.
- GREEN 42/42 Activity+negocios, sintaxis correcta; RED del pipeline observado. Panel/fullcheck no repetidos.

#### T27 — reconciliación de detalles incompletos
- Verificación read-only ahora exige ID ya presente en cola, pero permite detalleCompleto=false para volver a leerlo; aplicación sigue exigiendo detalle completo y confirmación. Ambas capas, endpoint y adaptador, conservan esta distinción.
- No se marca detalle completo manualmente ni se limpian intenciones/bloqueos. Se refresca sólo mediante lector real. RED observado en endpoint mock400→200 de verificación; tests de escritura conservan400 con detalle incompleto.

#### T27 — intención de correo pendiente y diagnóstico de guardias
- La sospecha de regex no se confirmó: evaluación de la expresión original de fuente aceptó nombre<email>. Se extrae helper y prueba real de RegExp con espacios y metacaracteres; no se atribuye a esa expresión el fallo previo.
- Se enumeran todas las guardias estáticas del módulo y se conserva sólo ubicación de stack `hubspot-activity.mjs:línea:columna`, sin rutas, mensajes privados ni stacks completos. Registro y lectura de correos anotan etapa específica.
- Única reconciliación real read-only 49854251627: estado Nuevo, logs Contacto0, contexto cerrado exit0. No se modifica intención_correo ni bloqueo; ausencia de log no prueba por sí sola en qué guardia se cortó el intento anterior.
- 44/44 Activity+negocios y sintaxis correctas. No hubo nuevas escrituras CRM ni reintento automático; para recuperar se requiere evidencia del fallo anterior al save, no limpiar intención a ciegas.

#### T27 — preparación real sin guardado
- `prepararCorreoActivity` configura el mismo formulario (identidad, selección, cuerpo Contacto, tarea opcional false) y devuelve el diálogo sin pulsar save; registrar lo reutiliza y guarda después. Test RED/GREEN confirma preparación no guarda ni recarga.
- Prueba real 49854251627: PREPARACION_OK_SIN_SAVE. Se cerró el único diálogo nuevo con Cerrar ventana, contexto cerrado exit0. No cambió fase/intención ni bloqueo ni se guardó CRM.
- Fallo anterior no reproducido: no se adjudica causa sin evidencia. Se añade espera visible de la opción observada antes de allTextContents, que por sí sola no espera carga; no se presenta esa carrera como causa demostrada.
- 44/44 Activity+negocios PASS y sintaxis. Parent mantiene control de recuperación explícita y servicio; ninguna nueva aplicación worker.

#### T27 — duplicado Registrar correo corregido desde Correos
- DOM real confirmó dos acciones: CTA `[data-test-id="create-engagement-logged-email-button"]` y menú Más `button[data-selenium-test="overflow-activity-button-logged-email"]`. Preparación ahora pulsa sólo el menú visible exacto, sin `.first`.
- RED mock strictmode CTA+menú→GREEN. Diagnóstico clasifica `strict mode violation` como selector_ambiguo sin guardar texto privado.
- Prueba real desde logs→Correos: logs0; abrió diálogo mediante menú corregido, pero timeout en botón 0 contactos (línea213), no en Registrar correo. Posible selección conservada en borrador requiere DOM adicional; no se afirma sin evidencia ni se reutiliza borrador no comprobado. Contexto cerrado, sin save.
- 44/44 Activity+negocios PASS/sintaxis. Intención/bloqueo intactos; Activity aún OFF. No afirmar E2E completo.

#### T27 — borrador propio idempotente y prueba completa sin save
- DOM real confirmó sección Contactado con botón universal-associations-select-button y aria-owns al popup; el borrador conserva contacto seleccionado. Se espera etiqueta/botón visible y se scopea al ancestro mínimo, sin depender del texto 0 contactos.
- Antes de modificar, cuerpo debe estar vacío o ser exactamente Contacto; cualquier otro seleccionado/cuerpo ajeno bloquea sin sobrescribir. Opción esperada se comprueba por tarjetaID/email y se marca con check() idempotente, nunca toggle. Tarea opcional false.
- Prueba real desde logs→Correos→preparación con borrador seleccionado: PREPARACION_CORREOS_DRAFT_OK_SIN_SAVE; cierre de único diálogo y contexto exit0. No guardado, cambio de estado ni modificación de intención/bloqueo.
- RED/GREEN de borrador y regresión cold/preseleccionado; fuente congelada para parent. La aplicación real y fence autosave siguen pendientes de prueba supervisada.

#### T27 — correo guardado reconciliado por identidad real
- El intento parent sí guardó el log. La lectura inmediata fallaba porque audiencia aún era skeleton `<div data-loading="true">`, no por enlace extraño o contacto equivocado. Se espera su desaparición antes de exigir identidad canónica; no se debilita parser.
- Prueba real reader corregido 49854251627: estado Nuevo, contacto asociado120683935053, exactamente1 log Contacto; href audiencia `/contacts/44080364/record/0-1/120683935053`. Contexto cerrado exit0, sin nuevas escrituras.
- 46/46 Activity+negocios PASS, sintaxis; RED de espera audiencia observado. Parent debe verificar para reconciliar intención a correo_verificado, luego sólo estado; NUNCA volver a registrar correo. Fence autosave aún pendiente de prueba real.

#### T27 — readback del estado espera valor, no sólo campo visible
- Parent comprobó respuesta de autosave coincidente y HTTP correcto; no se repite click. Fallo posterior era comparación inmediata tras reload.
- `leerEstadoActivity` espera campo visible, ausencia de skeleton data-loading=true y texto no vacío. Lo usan lectura de ficha, precondición Nuevo y readback después de reload.
- RED/GREEN de campo visible vacío/skeleton→En Gestión; 47/47 Activity+negocios y sintaxis correctas. Sin navegador ni CRM worker; intención_estado intacta para verificación parent sólo lectura.

#### T27 — rectificación del fence: lectura GraphQL no confirma autosave
- La afirmación previa de autosave confirmado se retira: el predicado anterior aceptaba POST GraphQL de lectura si incluía ID/propiedad. Parent comprobó estado Nuevo, log1, fase correo_verificado; no repetir correo.
- Predicado ahora rechaza query/operación desconocida, exige documento mutation o PATCH/PUT, ID en objeto vinculado, propiedad y valor destino exacto En Gestión. Si backend usa enum distinto o estructura no reconocida, falla incierto sin reload ni retry; no se inventa valor.
- Se exporta observarEstadoActivity(p,id,callback) para observar la próxima acción UI: máximo8 metadatos con método/ruta sin query, tipo de operación y valor acotado de esa propiedad; devuelve cleanup. No solicita APIs ni expone cuerpos/credenciales.
- RED real GraphQLquery antes aceptada→GREEN; 48/48 Activity+negocios y sintaxis. Sin navegador/CRM worker. Siguiente paso parent: observar una acción de estado supervisada y contrastar payload real; luego readonly readback sin asumir éxito.

#### T27 — prueba de escritura supervisada parent confirmada
- Parent ejecutó sólo estado sobre el correo previamente guardado: observó POST de validación (no usado como confirmación) y mutación real PUT `/api/inbounddb-objects/v1/crm-objects/0-5`, valor En Gestión. procesarActivity devolvió fase verificada y bloqueado false. No duplicó el log Contacto previamente comprobado con contacto correcto.
- Se retiran razón/diagnóstico obsoletos sólo tras verificación final correcta, manteniendo protección para fallos inciertos. Columna compacta Activity desplegada. Acknowledgment de notificaciones permanece separado pendiente.
- Activación automática pendiente de readback independiente explorer y decisión parent; worker no activa/reinicia ni escribe CRM. API: POST /api/activity-habilitar JSON {"habilitada":true,"confirmar":true}, Host/Origin exactos.
- Verificación final worker: todos los tests privados `hubspot-*.test.mjs` 122/122 PASS; sintaxis Activity/panel/UI PASS. RED/GREEN limpieza de diagnóstico obsoleto. Fullcheck público omitido por alcance privado; sin navegador/CRM/restart en esta verificación.

### T30 — confirmación manual WhatsApp Activity (autorizada)
- [x] Añadir checkbox junto al enlace; al confirmar envío ocultar sólo esa fila de la única lista Activity, preservando ticket/operaciones y metadatos locales por ID.
- [x] Quitar control visible Revisar Activity (botón global cambia actualmente a ese texto al elegir pestaña); mantener pestaña y revisión automática.
- [x] Probar persistencia, no resurrección por refresco, guardias HTTP, escritura independiente del robot y protección de GET obsoletos. Sin CRM/browser/restart worker.

- Evidencia T30: RED checkbox/route404 y carrera/error→GREEN; todos los tests privados HubSpot126/126 PASS, sintaxis panel/UI PASS. Mapa raíz activityWhatsappEnviados independiente de filas y operaciones; POST /api/activity-enviado acepta sólo ID guardado/enlace válido y enviado booleano, serializa persistencia sin esperar robot; error restaura fila/check. Abrir enlace no marca. GET antiguo descartado por misma revisión/pending de confirmaciones.
- Control retirado exactamente: botón global Actualizar se oculta al entrar en Activity y ya no se renombra ni ejecuta Revisar Activity. Pestaña, fuente y automatización CRM continúan; no hay lista de enviados/revisión nueva.
- No se editó JSON activo, no hubo browser/CRM ni restart worker. Parent esperar idle/reiniciar servicio y recargar UI. Fullcheck público omitido por alcance privado.

### T31 — Textarea editable en Activity y replicar con un botón (autorizada)
- [x] Retirar atributo `readonly` del textarea `.activity-texto` y añadir `data-activity-texto` y `data-original`.
- [x] Añadir botones explícitos en cada fila: `Guardar` (`.btn-guardar-activity`, `data-activity-guardar="id"`) y `Modificar demás con el mismo texto` (`.btn-replicar-activity`, `data-activity-replicar="id"`).
- [x] Quitar autoguardado en evento `change`: la edición en el textarea no muta el backend de forma prematura ni borra la referencia previa antes de replicar.
- [x] Endpoint seguro `POST /api/activity-texto` con `{ id, texto, anterior?: string, replicar?: boolean }`. Valida origen, tipos, texto no vacío y ticket existente.
- [x] Si `replicar: true`, toma `anterior` (texto original de `data-original`) como referencia para localizar todas las filas que compartían ese mismo texto antes de modificarlo, actualizando sus textos y enlaces wa.me.
- [x] Persistencia atómica con rollback ante error de guardado en disco; actualización reactiva de DOM de todos los textareas y enlaces afectados.
- [x] Prevención de pérdida de texto durante sondeo automático cada 5s: mapa `borradoresActivityTexto` y guarda de foco en textarea.
- Evidencia T31: RED observado -> GREEN; 78/78 tests `hubspot-panel.test.mjs` y `hubspot-activity.test.mjs` PASS. Sintaxis verificada en los 3 módulos modificados.



### T34 — acuse preciso de notificaciones Activity
- [x] Identificar notificación por portal44080364/object0-5/ticketID canónico, nunca título ni negocio0-3.
- [x] Sólo tras fase verificada y persistencia durable; acuse separado, máximo3 por ciclo, backoff10/30min e incertidumbre sin repetir click.
- [ ] UI real Marcar como leída y readback No leídos; ausencia/ambigüedad no repite CRM ni pausa cola. Parent prueba un acuse; worker sólo mapea lectura.

#### T34 — implementación y mapeo observado
- Portal No leídos3: cards data-notification-id107481229759 (tickets49853323293/49859515729),107481199447 (49866638138/49868031826),107476583906 (49873865245). Agrupadas no se marcan salvo todos verificados. Hover expone botón exacto Marcar como leída, data-test-id actionsButton-markAsRead; Eliminar/Desactivar nunca usados.
- Lectura local acotada ID/fase: esos5tickets siguen intencion_correo, por lo que NO son candidatos de acuse.49854251627 no estaba en No leídos; ausencia se registra con backoff, no como error CRM ni como prueba de leído.
- Helpers Activity separados: canonicalportal/object/ID, gate durable,3/ciclo,backoff10/30min, intención previa al click, readback y bloqueo de re-click incierto. Integrado sólo en aplicación normal; preview/verificación sin acuses. Incluye verificados fuera de ventana/ocultos WhatsApp porque usa estado interno completo.
- Entrada supervisada acusarActivityTicket permite un ticket explícito sin log/estado. Worker no marcó ningún aviso ni modificó CRM/JSON activo; contextos cerrados. Primer mapeo falló por selector tab hidden duplicado; corregido :visible y mapeo completado.
- RED/GREEN tests exactID/grupos/durable/incertidumbre/backoff/cancel/UIcontrol; sintaxis correcta. Prueba real de click/readback pendiente parent para un aviso que tenga todos los tickets verificados; no marcar los5pendientes ni limpiar sus intenciones.

- Corrección verifier T34: se rechaza cualquier destino del card que no sea canónico0-5 completo, incluyendo vacío/malformado/contacto/negocio/alternativo/desconocido. No hay excepción inventada para controles; si aparece enlace adicional, queda ambiguo hasta evidencia. Flag leído debe ser literalmente true/false; desconocido no permite click.
- Corrección preparación: input checkbox estilizado no usa check(); sólo si unchecked se pulsa el texto visible de la opción comprobada y se verifica checked. Ya seleccionado no se pulsa. Fixture frío prueba input.check fallaría y labelclick una vez; fixture draft no toggle. No se afirma causa histórica sin prueba real fría; intenciones/bloqueos intactos.
- Verificación final: todos los tests privados HubSpot135/135 PASS, sintaxis Activity/negocios/panel PASS. Acuse real no ejecutado por worker; prueba parent pendiente. Fuente congelada; no browser/CRM/restart adicional, fullcheck público omitido.
- Corrección precondición T34: URL guardada puede conservar eschref legítimo de navegación al listado Activity. Validador separado acepta sólo pathname canónico del ticket y eschref único exactamente /contacts/44080364/objects/0-5/views/my/list; rechaza otros destinos/objetos/portal/queries/hash/credenciales. Matcher de notificación sigue sin query. RED/GREEN fixture real, sin navegador ni acuse/CRM worker.

Cierre parent21/10: T30 desplegado y comprobado por GET (mapa activityWhatsappEnviados y casillas presentes), automático activo. T34 integrado tras revisión independiente y correcciones fail-closed para grupos/destinos/flag leído desconocido. URL de fila admite eschref interno validado separado del matcher estricto de avisos. Prueba real dirigida49854251627 devolvió no_encontrada sin marcar nada; los avisos actuales de tickets no verificados se preservaron. No afirmar marcado real probado.136/136 regresiones HubSpot aprobadas por parent; servicio restaurado y app abierta. Permanecen bloqueos individuales anteriores que requieren reconciliación, sin reiniciar intenciones ni repetir correos.

### T35 — datos Activity y reconciliación individual segura (21/10)
- [x] Diagnosticar teléfono real con una sesión de lectura de49873865245/49854251627; corregir sólo causa probada y fixture sin PII.
- [x] Separar fallo de lectura posterior de incertidumbre de escritura; conservar fase verificada/datos válidos y diagnóstico específico. Normalizar sólo presentación conocida Nuevo (New Activity Manager), manteniendo detalle fresco autoritativo.
- [x] Reconciliación explícita por ticket: log único→correo_verificado o verificada según estado; log0 sólo libera fallo previo al save probado y con preparación segura/cancelada, nunca intención desconocida ni vencida. Sin resets JSON manuales ni saves worker.
- [ ] RED/GREEN, regresiones privadas/sintaxis, prueba parent supervisada y restauración de servicio.

#### T35 — resultado congelado
- Sesión única real de lectura:49873865245 Nuevo y49854251627 En Gestión, ambos1contacto/móvil13dígitos. Error previo de teléfono no reproducido: no se atribuye a una normalización inventada. DOM real ofreció campo formatted-property-mobilephone; extracción ahora lee sólo ese valor en tarjeta única y espera datos válidos/sin skeleton.
- Criterio/estado/vencimiento esperan valor real; diagnóstico específico teléfono/criterio/vencimiento. Fallo posterior de lectura se guarda separado en activity.lecturas; fase CRM no cambia y enlace verificado válido se conserva salvo contradicción de asociación/estado.
- /api/activity-recuperar explícito por ID+confirmar lee pipeline/ficha/logs; log0 sólo libera preparación Timeout pre-save o lectura sin fase, con auditoría; vencido/contacto distinto/etapa registrar o desconocida no se reinician. Log1+Nuevo NO rebaja intencion_estado ni commit desconocido; sólo En Gestión+log1 confirma intención de estado. Regresión HTTP conserva409 y fase íntegra.
- Todas las regresiones privadas143/143 PASS; sintaxis Activity/panel PASS. RED/GREEN observado en teléfono/lectura/recuperación y bloqueo state-intent. Sin saves CRM/WhatsApp/JSON activo/restart worker. Pruebas reales de recuperación quedan para parent con autorización; fuente congelada.
- Restricción nueva explícita: ningún agente ni test/script de validación abrirá WhatsApp, ni por API; sólo el usuario abre manualmente enlaces. Se conservan mocks y no hay aperturas reales ni envíos.

### T36 — enlace de ticket Activity en perfil Siglo21 (autorizado)
- [x] Interceptar sólo click humano normal del título HubSpot y abrir ticket guardado en perfil exacto siglo21; no cambiar enlaces WhatsApp ni negocios/seguimientos Teclab.
- [x] Endpoint local seguro por ID, URL guardada canónica/eschref aprobado, destino reconstruido sin query, lanzador independiente del robot con entorno mínimo y sin shell.
- [x] RED/GREEN y todos los tests privados con lanzador mock; ninguna apertura real de navegador/WhatsApp, CRM, JSON activo ni restart worker. Recuperación T35 fail-closed permanece congelada.

- Evidencia T36: enlace título conserva texto compacto/href copiable y data-activity-hubspot; click normal preventDefault envía sólo ID al endpoint propio. Backend valida URL guardada (portal/object/ID y eschref interno aprobado), reconstruye destino canónico sin query y solicita apertura en metadata exactsiglo21 con raíz Brave normal y entorno mínimo. Lanzador separado de WhatsApp; independiente de busy CRM, sin cambiar enviados.
- RED/GREEN helper/anchor, pruebas HTTP Origin/Host real/JSON/ID/perfil/destino no permitido y VM click humano sin acción en poll.146/146 regresiones privadas PASS; sintaxis panel/UI/Activity PASS. Ningún navegador/WhatsApp real abierto, CRM, recuperación de registros, JSON activo o restart worker. Safety T35 preserva intencion_estado/unknown commit; deploy combinado sólo tras idle/revisión parent. Fullcheck público omitido.

### T37 — desbloqueo de fallos de lectura en Activity (21/10)

Dos tickets quedaban en Nuevo sin avanzar nunca: 49873865245 (SOFIA DALMA SERRANO) y 49873710755 (Joaquín Mondelli). Los dos tenían `intencion_correo` persistida de un intento anterior y un diagnóstico `error_no_clasificado` de una etapa de **lectura** (teléfono y criterio_y_objetivo respectivamente), pero cada ciclo los leía bien.

Causa: `reconciliarActivity` sólo liberaba un fallo de lectura cuando el ticket no tenía fase (`!previo.fase`). Con una intención de correo vieja, el bloqueo quedaba permanente aunque una lectura completa y vigente de Correos mostrara cero logs «Contacto». La intención sobrevivía a cualquier reintento automático porque el bloqueo excluye al ticket de la cola.

Corrección acotada: un fallo en etapa de lectura (`abrir_ticket`, `criterio_y_objetivo`, `vencimiento`, `contacto_asociado`, `telefono`, `pipeline`, `leer_correos`) es recuperable también con fase `intencion_correo`, porque la lectura completa ya probó que no hay nada guardado. Siguen bloqueados `registrar_correo`, `intencion_estado`, `verificada` sin log y preparación no confirmada. RED→GREEN: `hubspot-activity.test.mjs` 38/38 y todos los tests privados HubSpot 147/147 PASS; sintaxis correcta.

Aplicación real autorizada: lectura previa de los dos tickets (Nuevo, cero correos Contacto), recuperación explícita por ID, reinicio del servicio en reposo y ciclo automático. Resultado: ambos registraron su único `Contacto` y pasaron a **En Gestión** con fase `verificada` y `bloqueado:false`; verificación independiente posterior por `/api/activity-verificar` devolvió `verificada` en los dos, sin nuevas escrituras.

Quedan cuatro bloqueos anteriores sobre tickets ya en En Gestión (49854251627, 49688849409, 49425233679, 49424459611) que impiden sus acuses de notificación; se liberan con la misma recuperación explícita, pero los que no tienen fase registrarían su correo Contacto, así que esperan decisión del usuario. Los 10 avisos pendientes de acuse siguen igual.

Recuperación real parent21/10:49863230847 pasó de Nuevo/logs0 a En Gestión/logContacto1, contacto canónico comprobado, tareas0 y WhatsApp0. Otros8IDs con error pre-save conocido o lectura sin fase se reconciliaron por lectura completa:49858122065,49853323293,49859515729,49854868805,49866638138,49868031826,49848668542,49873557592; todos quedaron pendiente sin bloqueo y con auditoría, sin escrituras CRM durante recuperación. Servicio normal reanudado, automático activo; ya observada al menos1 finalización automática adicional sin bloqueos nuevos. Dos casos inciertos49873865245 y49873710755 se preservaron, no hubo borrado global de intenciones. Ninguna apertura de WhatsApp por agente.

### T38 — retención de un mes por seguimiento (21/10)

- [x] Cada negocio en Seguimientos permanece un mes calendario desde `whatsappEnviados[id].fecha`, no un mes global. Al vencer se elimina la fila y sus mapas locales (`whatsappEnviados`, `seguimientosRealizados`, `seguimientosConservados`, `motivos`) y se limpian huérfanos; `trabajados` no se toca porque viene del robot.
- [x] Checkbox «Conservar» por fila (`seguimientosConservados[id] = { conservado: true, fecha }`) la exime sin vencimiento. Endpoint propio `POST /api/seguimiento-conservar`; desmarcar «Enviado manualmente» vuelve a Tickets y elimina la conservación. «Seguimiento realizado» no extiende la permanencia.
- [x] La poda corre al cargar, en cada ciclo (aun con el automático pausado) y después de combinar filas; si falla el guardado, reintenta en el ciclo siguiente. `LEER-hubspot.md` actualizado. 165/165 pruebas HubSpot PASS; servicio reiniciado y toggle real probado y revertido sin dejar conservaciones.

### T39 — el texto editado de Activity sobrevive al rastreo (21/10)

- [x] `POST /api/activity-texto` marca la fila con `textoManual: true` al guardar o replicar; el rollback restaura texto, enlace y bandera.
- [x] `revisarActivity` sigue leyendo el criterio original de HubSpot para validar y procesar, pero antes de reemplazar la fila aplica `conservarTextoManualActivity`: conserva el texto local y regenera el enlace con el teléfono vigente.
- [x] La bandera no escribe `criterio_y_objetivo` en HubSpot; sólo evita que el rastreo pise la edición local. Se va con la fila al podar la ventana de 168 h.
- [x] Pruebas: sobrevivencia del texto manual al detalle, bandera en guardado/replicación y reversión ante fallo de disco. 117/117 tests Activity+panel PASS y sintaxis correcta.

### T40 — el interruptor de automatización manda durante la revisión (21/10)

- [x] `POST /api/activity-habilitar` ya no responde 409 por `ocupado`/`drenando`, no usa el flag `ocupado` y persiste por la cola de guardado; apagar el interruptor mientras el robot revisa no lo libera antes de tiempo.
- [x] La revisión automática pasa `respetarHabilitada:true`. Antes de cada correo, cambio de estado y acuse se consulta `activity.habilitada`; si se apagó, se omiten las escrituras restantes, se conserva la lista y no se marca el ticket como bloqueado. Una escritura ya confirmada no se revierte.
- [x] `procesarActivity` restaura la intención local si la automatización se detiene antes de `registrar`/`gestionar`; `confirmarAvisosActivity` no busca ni marca avisos con el interruptor apagado.
- [x] Pruebas: toggle con robot ocupado, revisión automática detenida con `aplicar:false`, gate sin correo/estado y acuse sin búsqueda ni marca. 172/172 pruebas HubSpot PASS; servicio reiniciado y toggle real con `ocupado:true` persistido (`activity.habilitada:false`, `soloListar:true`) y verificado.
- [x] El interruptor es global: al apagarlo deja `activity.habilitada:false` y `soloListar:true`. El ciclo de negocios usa `listar` (`--limite 1`, sin `--aplicar`), actualiza la lista pero no crea notas ni tareas; al reactivarlo vuelve a `automatico`. Una escritura de negocios ya iniciada puede terminar, el modo sólo lectura rige desde el ciclo siguiente.

### T41 — los dos checks de Seguimientos, mitad y mitad (21/10)

- [x] En Seguimientos, «Enviado manualmente» y «Seguimiento realizado» van en un mismo grupo de dos columnas iguales (`.seguimiento-checks`, `grid-template-columns:1fr 1fr`), con el texto permitido en dos líneas para que los dos midan lo mismo. La columna de WhatsApp pasa a `min-width:268px`.
- [x] «Conservar» y el vencimiento salen del grupo y comparten su propia línea (`.seguimiento-conservar`), sin cambiar endpoints, atributos `data-*` ni el comportamiento reversible de cada casilla.
- [x] En Tickets queda una sola casilla junto al enlace, como estaba. 172/172 pruebas HubSpot PASS, sintaxis correcta, servicio reiniciado y verificado en la app con las 13 filas.

### Reanudación del automático, 21/10

- [x] La pausa de las 17:08 (`leer_asignaciones · no_clasificado · Error`) no volvió a aparecer: la lectura siguiente terminó bien y el estado quedó `automatico: { pausado: false, categoria: 'ok' }`, `diagnostico: null`, `sesionHubspot: activa` y `actualizado 19:20:07`.
- [x] Se disparó con `POST /api/actualizar` desde la pestaña Tickets («Actualizar lista»). En Seguimientos el botón sólo refresca el estado local, no lee HubSpot; eso explica por qué antes no se reanudaba.
- [x] El ciclo quedó programado cada 5 minutos y sigue en sólo lectura (`soloListar: true`, `activity.habilitada: false`): lee, combina filas y poda seguimientos, sin escribir en HubSpot. 13 negocios, 0 tickets, 22 filas de Activity y 11 trabajados sin cambios.
