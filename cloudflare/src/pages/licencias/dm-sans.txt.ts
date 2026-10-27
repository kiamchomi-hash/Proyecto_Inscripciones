import licencia from '../../assets/OFL-DMSans.txt?raw';
export const GET = () => new Response(licencia, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
