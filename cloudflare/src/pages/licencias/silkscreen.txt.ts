import licencia from '../../assets/OFL-Silkscreen.txt?raw';

/** El aviso acompaña a los binarios también en la entrega compilada. */
export const GET = () => new Response(licencia, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
