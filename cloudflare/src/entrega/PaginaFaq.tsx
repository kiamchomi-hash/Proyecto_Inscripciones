import FaqPageContent from '@/components/faq-page';
import type { FaqPregunta } from '@/lib/types';
import { ContextoTurnstile, type ConfigTurnstile } from './turnstile-contexto';

export default function PaginaFaq({ preguntas, turnstile }: { preguntas: FaqPregunta[]; turnstile: ConfigTurnstile }) {
  return <ContextoTurnstile.Provider value={turnstile}><FaqPageContent initialQuestions={preguntas} /></ContextoTurnstile.Provider>;
}
