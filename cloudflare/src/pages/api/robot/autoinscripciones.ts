import type { APIRoute } from 'astro';
import { manejarRobotGet, manejarRobotPost } from '../../../api/robot.ts';
import { bindingDb, bindingCola, secretoRobot } from '../../../api/runtime.ts';

// El robot pide acá el legajo y avisa cómo le fue. Sólo adapta: la lógica está
// en `src/api/robot.ts` y se prueba en Node.
export const prerender = false;

export const GET: APIRoute = ({ request }) => manejarRobotGet(request, bindingDb(), secretoRobot());

export const POST: APIRoute = ({ request }) => manejarRobotPost(request, bindingDb(), secretoRobot(), bindingCola());
