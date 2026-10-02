# Publicar sin secretos ni archivos privados

El publicador revisa el árbol Git seleccionado **antes de mostrar el diff** y
antes del commit. También revisa los commits locales que viajarían en el push,
aunque un archivo sensible se haya borrado después. No carga `.env.local`, no
explora carpetas ignoradas y no cambia el index durante el escaneo.

## Preparación, una vez por máquina

```sh
npm run secretos:instalar
```

Descarga Gitleaks 8.30.1 de su release oficial y verifica el SHA256 fijado en
`herramientas/gitleaks-version.mjs`. Queda en la caché de 
ode_modules`, fuera
de Git. Si se borra esa caché, instalarlo otra vez. No requiere Docker.

Para revisar a mano el index actual y los commits pendientes:

```sh
npm run secretos
```

Si falta el scanner, su versión no coincide, Git falla o el informe está
incompleto, **se bloquea la publicación**. No se interpreta un error como
«sin secretos». El publicador guiado de Windows y Linux usa el mismo control.

## Qué bloquea

- Las carpetas comerciales de la raíz `carreras/`, `ventas/` y
  `herramientas/ventas/`, además de notas y materiales locales privados. No
  confunde esas carpetas con `app/carreras/` o `components/carreras/`.
- Archivos `.env` excepto `.env.example`, credenciales de servicio, claves
  privadas y archivos de configuración local sensibles. Un `git add -f` no
  alcanza para saltear esta comprobación.
- Las reglas oficiales de Gitleaks, sin baselines ni exclusiones generales de
  carpetas. Los comentarios `gitleaks:allow` y `.gitleaksignore` no desactivan
  el control.

La política de rutas privadas está en `esRutaPrivada()` de
`herramientas/secretos.mjs`, compartida por publicación local y CI. `.gitignore`
sigue siendo una comodidad para trabajar: no constituye una prueba de que un
archivo no haya sido agregado a Git.

La excepción automática acotada es un JWT de clave pública Supabase con
`iss: supabase`, `role: anon` y sin `sub`, en la regla `jwt`. La clave anon
está diseñada para el cliente público; no se permite `service_role` ni sesiones
`authenticated`. La configuración de Gitleaks sale del árbol seleccionado; si todavía no existe
allí, se usan sólo sus reglas oficiales. Un config no seleccionado no puede
relajar la revisión. El filtro usa los bytes del mismo árbol o commit inspeccionado,
no la copia editable. Las excepciones para otros ejemplos públicos deben ser
valores exactos en `.gitleaks.toml`, con motivo escrito; no excluir una carpeta
ni marcar una credencial real como ejemplo.

## Si bloquea

El mensaje muestra sólo ruta, línea y regla, nunca el valor detectado. Los
informes están redactados en un temporal y se eliminan al finalizar; no se
suben como artifacts. No copiar una credencial al chat ni al informe.

Si el valor es real, primero revocarlo o rotarlo en su servicio. Borrarlo del
último archivo no elimina su presencia en commits anteriores. Revisar los
commits pendientes sin publicarlos y decidir su corrección; la herramienta no
reescribe historia ni rota credenciales por cuenta propia.

## CI y límites

GitHub Actions instala el mismo pin y revisa HEAD y todos los commits del push,
usando el SHA anterior (`github.event.before`) y checkout completo. En el primer
push y en una ejecución manual, al no haber base, revisa toda la historia
alcanzable desde HEAD. El control local usa `origin/main..HEAD`; no audita
retroactivamente la historia ya publicada y depende de la referencia remota
local. Un barrido histórico puede encontrar credenciales ya revocadas: revisar
cada caso, no silenciar todo el historial.

**CI corre después del push y no impide un deploy automático de Vercel.** La
prevención anterior a la salida está en el publicador guiado y en el hook local descrito abajo; `git commit` o
`git push` manuales sin el hook instalado pueden saltearlo. No se instalaron hooks globales ni se
cambiaron permisos remotos. Gitleaks detecta patrones conocidos, no certifica
que cualquier dato comercial o personal esté ausente: sigue siendo necesaria
la revisión humana de lo seleccionado.

## Push manual: hook local por clon

En Windows (Git for Windows) y Linux, preparar el scanner e instalar el hook:

```sh
npm run secretos:instalar
node herramientas/pre-push.mjs instalar
```

Repetir en cada clon nuevo: Git no instala hooks del repositorio automáticamente.
El instalador conserva los demás hooks, no cambia `core.hooksPath` y no reemplaza
un `pre-push` distinto. Ante un conflicto hay que integrar ambos controles
explícitamente. Reinstalar el mismo hook es seguro. Para verificarlo, leer el
archivo indicado por `git rev-parse --git-path hooks/pre-push`, sin publicar.

El hook usa las referencias y OID de stdin de Git, no `origin/main`. Revisa cada
rama o tag ofrecido, aunque no sea la rama actual. Para una referencia nueva
revisa toda la historia alcanzable; para una actualización o force push, los
commits fuera del OID remoto y el árbol final. Detecta secretos y privados aun
borrados después. Una eliminación no agrega blobs y no requiere escaneo.
Si falta localmente el commit remoto anunciado, bloquea y pide hacer fetch del
remoto elegido: no descarga nada automáticamente ni imprime su URL.

No carga archivos ignorados ni cambia el index. Si falta Node, Gitleaks o el
módulo del control, el push falla cerrado. En ramas nuevas con mucha historia
puede tardar más o encontrar credenciales antiguas: revisar, no silenciar todo.

El hook cubre pushes manuales **sólo después de instalarlo en ese clon**. Puede
saltearse con `--no-verify`, editarse o desactivarse: protege errores accidentales,
no a alguien que controla su máquina. No hay hooks globales ni cambios remotos.
