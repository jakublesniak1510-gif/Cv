import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';
let client;
const getClient = () => (client ||= new Anthropic());
export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY;

export class AiRefusal extends Error {}

// Jedno zapytanie zwracające JSON. Stały system prompt jest cache'owany; przy odmowie
// serwer API sam ponawia zapytanie na modelu zapasowym (fallbacks: "default").
export async function askJson(system, user, { effort = 'high', maxTokens = 16000 } = {}) {
  const msg = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort },
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: user }],
  });
  if (msg.stop_reason === 'refusal') throw new AiRefusal('Model odmówił wykonania zadania.');
  if (msg.stop_reason === 'max_tokens') throw new Error('Odpowiedź modelu została ucięta.');
  const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
}
