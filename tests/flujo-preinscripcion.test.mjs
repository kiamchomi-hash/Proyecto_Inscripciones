import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
const fuente = readFileSync('components/formularios/formulario-lead.tsx', 'utf8');
const js = texto => ts.transpileModule(texto, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

test('si el envío falla, no confirma y conserva los datos para reintentar', async () => {
  const inicio = fuente.indexOf('    setEnviando(true);', fuente.indexOf('  const enviar = async'));
  const fin = fuente.indexOf('\n  // Sólo los datos montan el captcha', inicio);
  const cuerpo = fuente.slice(inicio, fin);
  for (const [motivo, respuesta] of [
    ['error del servidor', { ok: false, status: 500, json: async () => ({ error: 'No se pudo guardar la solicitud' }) }],
    ['cuota', { ok: false, status: 429, json: async () => ({ error: 'Demasiadas solicitudes' }) }],
    ['red caída', null],
  ]) {
    const valores = { nombre: 'Ana', nacionalidad: 'Peruana', dni: '30123456' };
    const solicitudes = [];
    const confirmaciones = [];
    let error = '';
    const contexto = {
      casaActiva: 'teclab', modo: 'preinscripcion', esPreinscripcion: true, valores,
      filtro: null, CATEGORIES: [], carreraElegida: 'Carrera', carrera: { id: 7 }, token: 'seguro',
      newsletter: true, origen: 'normal', setEnviando: () => {}, setError: e => { error = e; },
      armarPayload: (_c, _m, v) => v,
      setPreinscripcionEnviada: v => confirmaciones.push(v), setPrecioCarrera: () => {},
      irAPaso: p => confirmaciones.push(p), setListo: () => confirmaciones.push('listo'),
      trackConsulta: () => assert.fail('un envío fallido no cuenta como consulta'),
      tipoFalloTecnicoFormulario: () => null,
      setToken: () => {}, setCaptchaKey: () => {}, setCaptchaVencido: () => {},
      fetch: async (_url, opciones) => {
        solicitudes.push(JSON.parse(opciones.body));
        if (!respuesta) throw new Error('red');
        return respuesta;
      },
    };
    await new Function(...Object.keys(contexto), js(`return (async()=>{${cuerpo.slice(0, cuerpo.lastIndexOf('  };'))}})();`))(...Object.values(contexto));
    assert.equal(solicitudes.length, 1, motivo);
    assert.equal(solicitudes[0].kind, 'consulta', motivo);
    assert.ok(error, `${motivo}: tiene que quedar un aviso`);
    assert.deepEqual(confirmaciones, [], `${motivo}: no confirma`);
    assert.deepEqual(valores, { nombre: 'Ana', nacionalidad: 'Peruana', dni: '30123456' }, `${motivo}: los datos quedan cargados`);
  }
});

test('una opción fuera de su lista, o un obligatorio vacío, frenan el envío y señalan el campo', async () => {
  // El desplegable acepta texto libre: lo escrito que no es una opción no viaja
  // y el envío se detiene hasta corregirlo. El DNI ya no se valida acá.
  const guardia = fuente.slice(fuente.indexOf('    if (!valido) {'), fuente.indexOf('    setEnviando(true);'));
  for (const [caso, esperado, intentadoEsperado] of [
    [{ malEscritos: ['nacionalidad'], faltanObligatorios: [] }, 'nacionalidad', true],
    [{ malEscritos: [], faltanObligatorios: ['dni'] }, 'dni', true],
    [{ malEscritos: [], faltanObligatorios: [] }, null, false],
  ]) {
    let problemas = [];
    let intentado = false;
    const contexto = {
      valido: caso.malEscritos.length === 0 && caso.faltanObligatorios.length === 0,
      ...caso, token: 'seguro', hayContacto: true, errorEmail: '', errorTelefono: '',
      origen: 'dedicada', modo: 'preinscripcion', trackIntentoFormulario: () => {},
      setIntentado: v => { intentado = v; }, setEnFrio: () => {},
      frioRef: { current: null }, setTimeout: () => 1, clearTimeout: () => {},
      irAlPrimerProblema: p => { problemas = p; },
    };
    await new Function(...Object.keys(contexto), js(`return (async()=>{${guardia}})();`))(...Object.values(contexto));
    if (esperado) assert.ok(problemas.includes(esperado), `${esperado} tiene que señalarse`);
    else assert.deepEqual(problemas, []);
    assert.equal(intentado, intentadoEsperado);
  }
});

test('el resultado dedicado confirma gestión pendiente sin ofrecer credenciales listas', async () => {
  const { cargarTypescript } = await import('./helpers/cargar-typescript.mjs');
  const elemento=(type,props)=>({type,props});
  const {PasoListo}=cargarTypescript('components/formularios/autoinscripcion-teclab.tsx',{'react/jsx-runtime':{jsx:elemento,jsxs:elemento}},()=>({}));
  const texto=n=>typeof n==='string'?n:Array.isArray(n)?n.map(texto).join(' '):n?.props?texto(n.props.children):'';
  const confirmacion=texto(PasoListo({waHref:'#'}));
  assert.match(confirmacion,/Preinscripción enviada/);
  assert.match(confirmacion,/Nos comunicamos a la brevedad\./);
  assert.doesNotMatch(confirmacion,/Usuario|Contraseña|30123456|Entrar al portal|cuenta creada|acceso listo/);
  assert.match(confirmacion,/Escribinos por WhatsApp/);
  assert.equal((confirmacion.match(/Preinscripción enviada/g)||[]).length,1);
  // «Ver precio» sólo aparece cuando la carrera trae un precio vigente.
  assert.doesNotMatch(confirmacion,/Ver precio/);
  assert.match(texto(PasoListo({waHref:'#',onVerPrecio:()=>{}})),/Ver precio/);
});

test('los avisos de captcha del formulario piden reintentar sin nombrar un botón ajeno', () => {
  const formulario = readFileSync('components/formularios/formulario-lead.tsx', 'utf8');
  assert.match(formulario, /El captcha venció\. Volvé a tildarlo\./);
  assert.match(formulario, /Falta tildar la verificación de seguridad\./);
  // Ya no hay un aviso que hable de «Inscribirme» ni de un captcha invisible.
  assert.doesNotMatch(formulario, /AVISO_VERIFICAR|captcha invisible/);
});

 test('toda preinscripción normal confirma directamente sin una segunda decisión', () => {
  const fin = fuente.slice(fuente.indexOf('    trackConsulta(origen, carreraElegida || null, etiquetaTipo);'), fuente.indexOf('  const precioParaVer ='));
  assert.match(fin, /if \(esPreinscripcion\) \{[\s\S]*irAPaso\('confirmacion'\)/);
  assert.doesNotMatch(fuente, /onSaltear|saltearAutoinscripcion|'gestionar'|Paso 1 de 2|Acceso y próximos pasos/);
  assert.match(fuente, /kind: 'consulta'/);
});

test('el submit normal conserva una consulta por casa y confirma sin depender del precio', async () => {
  const inicio = fuente.indexOf('    setEnviando(true);', fuente.indexOf('  const enviar = async'));
  const fin = fuente.indexOf('\n  // Sólo los datos montan el captcha', inicio);
  const cuerpo = fuente.slice(inicio, fin);
  for (const casaActiva of ['teclab', 'siglo21', 'identidad']) {
    for (const respuesta of [{ok:true}, {estado:'vigente',precio:{total:'$ 1'}}, null]) {
      const solicitudes = []; const pasos = []; const precios = []; let confirmada = false;
      const contexto = {
        casaActiva, modo:'preinscripcion', esPreinscripcion:true, valores:{nombre:'Ana'},
        filtro:null, CATEGORIES:[], carreraElegida:'Carrera', carrera:{id:7}, token:'seguro', newsletter:true, origen:'normal',
        setEnviando:()=>{}, setError:()=>{}, armarPayload:(_c,_m,v)=>v,
        setPreinscripcionEnviada:v=>{confirmada=v;}, setPrecioCarrera:p=>precios.push(p),
        irAPaso:p=>pasos.push(p), setListo:()=>assert.fail('no debe quedar sobre el formulario largo'),
        trackConsulta:()=>{}, tipoFalloTecnicoFormulario:()=>null,
        fetch:async(_url,opciones)=>{solicitudes.push(JSON.parse(opciones.body));return {ok:true,status:201,json:async()=>respuesta};},
      };
      await new Function(...Object.keys(contexto), js(`return (async()=>{${cuerpo.slice(0, cuerpo.lastIndexOf('  };'))}})();`))(...Object.values(contexto));
      assert.equal(solicitudes.length,1);
      assert.equal(solicitudes[0].kind,'consulta');
      assert.equal(solicitudes[0].payload.newsletter,true);
      assert.equal(confirmada,true);
      assert.deepEqual(pasos,['confirmacion']);
      assert.deepEqual(precios,[respuesta?.precio ?? null]);
    }
  }
});
