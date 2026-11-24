// `?url` devuelve la URL pública del CSS compilado: el chunk diferido la carga
// como `<link rel="stylesheet">` cuando se monta (ver formulario-lead-diferido.tsx).
// No se usa `?inline` + `<style>`: la CSP de las páginas lo bloquea.
declare module '*.css?url' {
  const url: string;
  export default url;
}
