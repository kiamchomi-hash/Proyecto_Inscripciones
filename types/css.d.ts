// `?inline` devuelve el CSS como texto para inyectarlo cuando se carga el chunk
// del formulario, en vez de registrar una hoja que Astro subiría al `<head>`.
declare module '*.css?inline' {
  const contenido: string;
  export default contenido;
}
