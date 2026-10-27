declare module 'virtual:inventario-imagenes' {
  const archivos: { ruta: string; carpeta: string; subcarpeta: string | null; bytes: number }[];
  export default archivos;
}
