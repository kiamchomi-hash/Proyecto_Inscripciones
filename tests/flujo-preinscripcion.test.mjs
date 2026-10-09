import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
const fuente = readFileSync('components/formularios/formulario-lead.tsx', 'utf8');
const js = texto => ts.transpileModule(texto, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

test('la entrada dedicada activa el envío directo sólo para preinscripción Teclab', () => {
  const calculo = fuente.slice(fuente.indexOf('  const solicitudDirecta ='), fuente.indexOf('  // Una preinscripción sin carrera'));
  assert.ok(calculo.includes('solicitudDirecta'));
  for (const [alinearAlLlegar, esPreinscripcion, casaActiva, conAutoinscripcion, esperado] of [
    [true,true,'teclab',true,true], [false,true,'teclab',true,false],
    [true,false,'teclab',false,false], [true,true,'siglo21',false,false],
    [true,true,'identidad',false,false],
  ]) assert.equal(new Function('alinearAlLlegar','esPreinscripcion','casaActiva','conAutoinscripcion','entradaAuto',js(`${calculo}\nreturn flujoAuto;`))(alinearAlLlegar,esPreinscripcion,casaActiva,conAutoinscripcion,false), esperado);
});

test('el envío directo real hace un POST y conserva datos ante errores para reintentar', async () => {
  const auto = fuente.slice(fuente.indexOf('  const enviarAutoinscripcion ='), fuente.indexOf('  /**\n   * «Ahora no»'));
  const enviar = fuente.slice(fuente.indexOf('  const enviar = async'), fuente.indexOf("    setEnviando(true);", fuente.indexOf('  const enviar = async')));
  for (const fallo of [null, 'CAPTCHA inválido', 'Demasiadas solicitudes', 'red']) {
    const solicitudes = []; const pasos = []; const errores = []; let captcha = 0; let analytics = 0;
    const valores = { dni:'30123456', nacionalidad:'Peruana' };
    const contexto = {
      enviando:false, carrera:{id:7}, casaDeLaCarrera:'teclab', pase:'', token:'seguro',
      preinscripcionEnviada:false, newsletter:true, origen:'dedicada', carreraElegida:'Eventos', filtro:null,
      CATEGORIES:[], flujoAuto:true, valido:true, datosValidos:true, modo:'preinscripcion', valores,
      setGestionIntentada:()=>{},setEnviando:()=>{},setError:e=>errores.push(e),setPase:()=>{},
      nuevoCaptcha:()=>captcha++, irAPaso:p=>pasos.push(p),
      trackConsulta:()=>analytics++, trackIntentoFormulario:()=>{},
      armarPayload:(_c,_m,v)=>({...v}), AVISO_VERIFICAR:'Verificá nuevamente',
      fetch:async (_url,opciones)=> { solicitudes.push(JSON.parse(opciones.body)); if(fallo==='red') throw new Error('red'); return {ok:!fallo,json:async()=>({error:fallo})}; },
    };
    const funciones = new Function(...Object.keys(contexto), js(`${auto}\n${enviar}\n}; return {enviar,enviarAutoinscripcion};`))(...Object.values(contexto));
    assert.equal(solicitudes.length,0,'sin envío al montar');
    await funciones.enviar({preventDefault(){}});
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(solicitudes.length,1);
    assert.equal(solicitudes[0].kind,'autoinscripcion');
    assert.equal(solicitudes[0].payload.newsletter,true);
    assert.equal(solicitudes[0].payload.nacionalidad,'Peruana');
    assert.equal(solicitudes[0].pase,undefined);
    assert.deepEqual(valores,{dni:'30123456',nacionalidad:'Peruana'});
    assert.equal(analytics,fallo?0:1);
    assert.deepEqual(pasos,fallo?[]:['confirmacion']);
    if(fallo) { assert.ok(errores.at(-1)); assert.equal(captcha,1); await funciones.enviarAutoinscripcion(); assert.equal(solicitudes.length,2); }
  }
});

test('el DNI estricto integra la validación y el error de campo', () => {
  assert.match(fuente,/const errorDni = flujoAuto/);
  assert.match(fuente,/!errorDni/);
  assert.match(fuente,/if \(errorDni\) problemas.push\('dni'\)/);
  assert.ok(fuente.includes("error={id === 'dni' && flujoAuto ? (intentado ? errorDni : '') : undefined}"));
});

test('DNI vacío, corto, largo o con letras y opciones ajenas frenan el submit', async () => {
  const validacion = fuente.slice(fuente.indexOf('  const errorDni ='), fuente.indexOf('  // En la entrada directa el paso 1'));
  const enviar = fuente.slice(fuente.indexOf('  const enviar = async'), fuente.indexOf("    setEnviando(true);", fuente.indexOf('  const enviar = async')));
  for (const [dni,malEscritos] of [['',[]],['123456',[]],['1234567890',[]],['3012345A',[]],['30123456',['nacionalidad']]]) {
    let pedidos=0;let problemas=[];
    const contexto={flujoAuto:true,texto:()=>dni,email:'ana@example.test',telefono:'1112345678',errorEmail:'',errorTelefono:'',faltanObligatorios:dni?[]:['dni'],malEscritos,enviando:false,token:'seguro',origen:'dedicada',modo:'preinscripcion',setIntentado:()=>{},trackIntentoFormulario:()=>{},setEnFrio:()=>{},frioRef:{current:null},irAlPrimerProblema:p=>problemas=p,enviarAutoinscripcion:()=>pedidos++,setTimeout:()=>1,clearTimeout:()=>{}};
    await new Function(...Object.keys(contexto), js(`${validacion}\nconst valido=datosValidos;\n${enviar}\n}; return enviar({preventDefault(){}});`))(...Object.values(contexto));
    assert.equal(pedidos,0);
    assert.ok(problemas.includes(malEscritos.length?'nacionalidad':'dni'));
  }
});

test('el resultado dedicado confirma gestión pendiente sin ofrecer credenciales listas', async () => {
  const { cargarTypescript } = await import('./helpers/cargar-typescript.mjs');
  const elemento=(type,props)=>({type,props});
  const {PasoListo,AvisoSinPago}=cargarTypescript('components/formularios/autoinscripcion-teclab.tsx',{'react/jsx-runtime':{jsx:elemento,jsxs:elemento}},()=>({}));
  const texto=n=>typeof n==='string'?n:Array.isArray(n)?n.map(texto).join(' '):n?.props?texto(n.props.children):'';
  const confirmacion=texto(PasoListo({solicitud:true,dni:'30123456',waHref:'#'}));
  assert.match(confirmacion,/Solicitud recibida/);
  assert.match(confirmacion,/Una vez gestionada/);
  assert.equal((confirmacion.match(/gestionad|gestionar/g)||[]).length,1);
  assert.doesNotMatch(confirmacion,/brevedad|cuenta creada|acceso listo/);
  assert.match(confirmacion,/Entrar al portal/);
  const nodos=n=>Array.isArray(n)?n.flatMap(nodos):n?.props?[n,...nodos(n.props.children)]:[];
  assert.ok(nodos(PasoListo({solicitud:true,dni:'30123456',waHref:'#'})).some(n=>n.type==='a'&&n.props.href==='https://portalalumno.teclab.edu.ar/payments/select'));
  assert.equal((confirmacion.match(/Solicitud recibida/g)||[]).length,1);
  assert.match(texto(AvisoSinPago()),/Al tocar Inscribirme/);
});

test('el error CAPTCHA indica reenvío sin nombrar un botón ajeno', () => {
  const auto = readFileSync('components/formularios/autoinscripcion-teclab.tsx', 'utf8');
  assert.match(auto, /export const AVISO_VERIFICAR = 'Volvé a verificar la seguridad y enviá la solicitud\.'/);
});
