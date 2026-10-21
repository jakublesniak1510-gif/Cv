import Anthropic from '@anthropic-ai/sdk';
import { usage } from './store.js';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';
let client;
const getClient = () => (client ||= new Anthropic());
export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY;

export class AiRefusal extends Error {}

// Jedno zapytanie zwracające JSON. Stały system prompt jest cache'owany; przy odmowie
// serwer API sam ponawia zapytanie na modelu zapasowym (fallbacks: "default"), o ile model to obsługuje.
// Strumieniowo: bez tego SDK odrzuca zapytania z dużym max_tokens (np. CV z przygotowaniem do rozmowy).
// Modele bez fallbacku po stronie serwera: wysłanie `fallbacks` (i bety) kończy się błędem 400 – tak było z podglądem na Claude Haiku 5.5.
export const noServerFallback = (model) => /^claude-haiku-5/.test(String(model));
// Parametry zapytania osobno (testowalne). thinking: np. { type: 'disabled' } dla krótkich odpowiedzi (Haiku 5.5: dozwolone przy effort ≤ high).
export function buildRequest(system, user, { effort = 'high', maxTokens = 16000, model = MODEL, thinking } = {}) {
  const fallback = !noServerFallback(model);
  return {
    model, max_tokens: maxTokens,
    ...(fallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } : {}),
    ...(thinking ? { thinking } : {}),
    output_config: { effort },
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: user }],
  };
}
export async function askJson(system, user, opts = {}) {
  const msg = await getClient().beta.messages.stream(buildRequest(system, user, opts)).finalMessage();
  trackUsage(msg.usage);
  if (msg.stop_reason === 'refusal') throw new AiRefusal('Model odmówił wykonania zadania.');
  if (msg.stop_reason === 'max_tokens') throw new Error('Odpowiedź modelu została ucięta.');
  const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
}

// Szacunkowy koszt (USD za 1 mln tokenów) dla claude-opus-5-5; przy zmianie modelu popraw ceny.
const PRICE_PER_MTOK = { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 };
function trackUsage(u = {}) {
  const month = new Date().toISOString().slice(0, 7);
  const add = { calls: 1, input: u.input_tokens || 0, output: u.output_tokens || 0, cacheRead: u.cache_read_input_tokens || 0, cacheWrite: u.cache_creation_input_tokens || 0 };
  usage.upsert(month, (p = {}) => Object.fromEntries(Object.keys(add).map((k) => [k, (p[k] || 0) + add[k]]))).catch(() => {});
}
export const usageCost = (u = {}) => Object.entries(PRICE_PER_MTOK).reduce((s, [k, p]) => s + ((u[k] || 0) / 1e6) * p, 0);

