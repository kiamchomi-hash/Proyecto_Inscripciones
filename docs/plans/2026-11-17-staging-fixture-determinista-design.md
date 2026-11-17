# Fixture determinista para pruebas de staging

## Problema

Las pruebas de staging llaman a `ultimoSnapshot()`, que lee
`cloudflare/.local/datos-publicos/ultimo.json`. Ese directorio es local e
ignorado por Git, así que no existe en el árbol aislado que prepara el
publicador. La suite depende además de datos locales para renderizar rutas
concretas, por lo que el control no es reproducible desde un checkout limpio.

## Diseño aprobado

- Reemplazar la dependencia de `.local/datos-publicos` en las pruebas de staging
  por un fixture público mínimo, determinista y versionado.
- El fixture contendrá sólo los registros y campos necesarios para los casos
  cubiertos; no copiará el snapshot local ni datos privados.
- Mantener `ultimoSnapshot()` para los flujos operativos que sí requieren el
  snapshot exportado localmente.
- No modificar ni debilitar el aislamiento del candidato del publicador.
- Verificar las suites de staging afectadas y repetir el check integral de
  Cloudflare antes de reanudar la publicación.

## Límite

No se leen ni escriben datos remotos, no se altera D1 y no se cambian las
guardas de staging o del publicador.
