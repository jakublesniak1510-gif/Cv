import crypto from 'node:crypto';
import express from 'express';
import { makeStore } from './store.js';

// Bot AI na Messengerze i Instagramie (Meta Messenger Platform). Odpowiada tym samym asystentem co czat na stronie.
// Konfiguracja (Render → Environment): META_PAGE_TOKEN (token strony), META_APP_SECRET (klucz aplikacji, do podpisu),
// META_VERIFY_TOKEN (dowolne hasło wpisane też w aplikacji Meta przy webhooku). Bez nich bot jest wyłączony.
// Zasady: odpowiedź tylko na wiadomość klienta (okno 24 h), pierwsza odpowiedź mówi, że to automat,
// słowo „człowiek” wyłącza bota w tej rozmowie i wysyła e-mail do właściciela, ręczna odpowiedź ze skrzynki też go wycisza.
export const chats = makeStore('social-chats.json');
const KEEP_MS = 30 * 864e5, HUMAN_MS = 7 * 864e5, MANUAL_MS = 12 * 3600e3, HISTORY = 10, MAX_LEN = 950;
const BOT_TAG = 'cvpo-bot';
export const socialEnabled = () => !!(process.env.META_PAGE_TOKEN && process.env.META_APP_SECRET && process.env.META_VERIFY_TOKEN);
const HUMAN_RE = /^\s*(człowiek|czlowiek|konsultant|operator|człowieka|czlowieka|human|agent|person|людина|оператор|mensch)\s*[.!?]*\s*$/i;
const HUMAN_REPLY = {
  pl: 'Dobrze, przekazuję rozmowę właścicielowi serwisu. Odpowie tutaj, zwykle w ciągu jednego dnia roboczego.',
  en: 'Sure, I am passing the conversation to the owner. They will reply here, usually within one business day.',
  uk: 'Добре, передаю розмову власнику сервісу. Він відповість тут, зазвичай протягом одного робочого дня.',
  de: 'Gern, ich gebe das Gespräch an den Inhaber weiter. Er antwortet hier, meist innerhalb eines Werktags.',
};
const NO_TEXT = 'Na razie odpowiadam tylko na wiadomości tekstowe. Napisz, w czym pomóc, albo wejdź na https://cvpodogloszenie.pl. / I can only read text messages for now.';
const langOf = (t) => (/[а-яіїєґ]/i.test(t) ? 'uk' : /\b(the|and|my|is|how|what|can|you)\b/i.test(t) ? 'en' : /\b(und|ich|mein|wie|was|ist|bitte)\b/i.test(t) ? 'de' : 'pl');

// Podpis X-Hub-Signature-256: HMAC-SHA256 surowej treści kluczem aplikacji.
export function validSignature(raw, header, secret = process.env.META_APP_SECRET) {
  if (!secret || !header || !String(header).startsWith('sha256=')) return false;
  const want = crypto.createHmac('sha256', secret).update(raw).digest('hex'), got = String(header).slice(7);
  return got.length === want.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

// Wysyłka przez Send API (ten sam adres dla Messengera i Instagrama połączonego ze stroną).
export async function graphSend(recipientId, text) {
  const v = process.env.META_GRAPH_VERSION || 'v21.0';
  const r = await fetch(`https://graph.facebook.com/${v}/me/messages?access_token=${encodeURIComponent(process.env.META_PAGE_TOKEN)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({ recipient: { id: recipientId }, messaging_type: 'RESPONSE', message: { text, metadata: BOT_TAG } }),
  });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error?.message || `Graph ${r.status}`); }
}

// Rozbija webhook na proste zdarzenia: { channel, user, text, mid, echo, fromBot }.
export function parseEvents(body) {
  const channel = body?.object === 'instagram' ? 'instagram' : body?.object === 'page' ? 'messenger' : null;
  if (!channel) return [];
  const out = [];
  for (const e of body.entry || []) for (const m of e.messaging || []) {
    const msg = m.message, echo = !!msg?.is_echo;
    if (msg?.is_deleted || m.read || m.delivery || m.reaction) continue;
    const text = msg?.text || m.postback?.title || (m.postback ? 'Dzień dobry' : '');
    out.push({ channel, user: echo ? m.recipient?.id : m.sender?.id, text: String(text || '').slice(0, 2000), mid: msg?.mid || m.postback?.mid || `${m.sender?.id}-${m.timestamp}`, echo, fromBot: echo && msg?.metadata === BOT_TAG, attachments: !text && !!msg?.attachments });
  }
  return out.filter((x) => x.user);
}

export function socialRoutes(app, { answer, send = graphSend, notifyOwner = async () => {}, dailyCap = Number(process.env.META_BOT_DAILY) || 300, now = () => Date.now() } = {}) {
  const seen = new Map(), perUser = new Map(), queues = new Map(); let day = '', dayCount = 0;
  const fresh = (mid) => { const t = now(); for (const [k, v] of seen) if (t - v > 3600e3) seen.delete(k); if (seen.has(mid)) return false; seen.set(mid, t); return true; };
  const allow = (user) => {
    const t = now(), d = new Date(t).toISOString().slice(0, 10);
    if (d !== day) { day = d; dayCount = 0; }
    const h = (perUser.get(user) || []).filter((x) => t - x < 3600e3);
    if (h.length >= 20 || dayCount >= dailyCap) return false;
    perUser.set(user, [...h, t]); dayCount++; return true;
  };

  async function handle(ev) {
    const id = `${ev.channel}:${ev.user}`, t = now();
    if (ev.echo) {
      // Ręczna odpowiedź właściciela ze skrzynki Meta: bot milknie w tej rozmowie na 12 godzin.
      if (!ev.fromBot) await chats.upsert(id, (p) => ({ channel: ev.channel, history: [], ...p, pausedUntil: t + MANUAL_MS, at: t }));
      return;
    }
    const prev = await chats.get(id);
    if (prev?.pausedUntil > t) { await chats.update(id, (x) => ({ ...x, at: t })); return; }
    if (!allow(ev.user)) return;
    if (!ev.text) { if (ev.attachments) await send(ev.user, NO_TEXT); return; }
    if (HUMAN_RE.test(ev.text)) {
      const l = langOf(ev.text);
      await chats.upsert(id, (p) => ({ channel: ev.channel, history: [], ...p, pausedUntil: t + HUMAN_MS, at: t }));
      await send(ev.user, HUMAN_REPLY[l]);
      const last = (prev?.history || []).slice(-6).map((m) => `${m.role === 'user' ? 'Klient' : 'Bot'}: ${m.content}`).join('\n');
      await notifyOwner(`Klient prosi o rozmowę z człowiekiem (${ev.channel === 'instagram' ? 'Instagram' : 'Messenger'})`,
        `Ktoś napisał „${ev.text.trim()}” i czeka na Twoją odpowiedź. Bot w tej rozmowie milczy przez 7 dni.\n\nOstatnie wiadomości:\n${last || '(brak)'}\n\nOdpowiedz w skrzynce: https://business.facebook.com/latest/inbox`);
      return;
    }
    const history = [...(prev?.history || []), { role: 'user', content: ev.text }].slice(-HISTORY);
    const first = !(prev?.history || []).some((m) => m.role === 'assistant');
    const note = `Rozmowa na ${ev.channel === 'instagram' ? 'Instagramie' : 'Messengerze'}: zwykły tekst bez formatowania (bez gwiazdek i nagłówków), najwyżej 700 znaków. Gdy klient chce zamówić, podaj link https://cvpodogloszenie.pl.${first ? ' To pierwsza odpowiedź w tej rozmowie: zacznij jednym krótkim zdaniem, że jesteś automatycznym asystentem AI serwisu i że po rozmowę z człowiekiem wystarczy napisać „człowiek”.' : ''}`;
    let reply;
    try { reply = String(await answer(history, note)).trim(); } catch { reply = 'Mam chwilowy problem z odpowiedzią. Spróbuj za kilka minut albo napisz „człowiek”, a odpisze właściciel serwisu.'; }
    if (!reply) return;
    if (reply.length > MAX_LEN) reply = reply.slice(0, MAX_LEN - 1).replace(/\s+\S*$/, '') + '…';
    await send(ev.user, reply);
    await chats.upsert(id, (p) => ({ channel: ev.channel, ...p, history: [...history, { role: 'assistant', content: reply }].slice(-HISTORY), at: t, pausedUntil: 0 }));
  }

  // Weryfikacja adresu przy zapisie webhooka w aplikacji Meta.
  app.get('/api/meta/webhook', (req, res) => {
    if (socialEnabled() && req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === process.env.META_VERIFY_TOKEN) return res.type('text').send(String(req.query['hub.challenge'] || ''));
    res.sendStatus(403);
  });
  app.post('/api/meta/webhook', express.raw({ type: '*/*', limit: '1mb' }), (req, res) => {
    const raw = req.body?.toString('utf8') || '';
    if (!socialEnabled() || !validSignature(raw, req.get('x-hub-signature-256'))) return res.sendStatus(403);
    res.sendStatus(200); // Meta wymaga szybkiej odpowiedzi; odpowiedź do klienta idzie w tle
    let body; try { body = JSON.parse(raw); } catch { return; }
    // Zdarzenia jednej rozmowy po kolei (np. ręczna odpowiedź właściciela przed kolejną wiadomością klienta), różne rozmowy równolegle.
    for (const ev of parseEvents(body)) {
      if (!fresh(ev.mid)) continue;
      const k = `${ev.channel}:${ev.user}`, run = (queues.get(k) || Promise.resolve()).then(() => handle(ev)).catch((e) => console.error('Bot Meta', e.message));
      queues.set(k, run); run.then(() => { if (queues.get(k) === run) queues.delete(k); });
    }
  });
  return { handle };
}

// Historia rozmów (do kontekstu bota) kasowana 30 dni po ostatniej wiadomości.
export const cleanupChats = () => chats.deleteWhere((c) => Date.now() - (c.at || 0) > KEEP_MS);

// Diagnostyka do /health (bez sekretów): czy bot jest skonfigurowany, czy token strony działa,
// czy strona ma subskrypcję wiadomości i czy jest połączony Instagram. Wynik w pamięci na 10 minut.
let statusCache = null;
export async function botStatus({ fetchFn = fetch, now = Date.now() } = {}) {
  if (!socialEnabled()) return { bot: 'wyłączony' };
  if (statusCache && now - statusCache.at < 600e3) return statusCache.value;
  const v = process.env.META_GRAPH_VERSION || 'v21.0', t = encodeURIComponent(process.env.META_PAGE_TOKEN);
  const get = async (path) => { const r = await fetchFn(`https://graph.facebook.com/${v}/${path}${path.includes('?') ? '&' : '?'}access_token=${t}`, { signal: AbortSignal.timeout(8000) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error?.message || `Graph ${r.status}`); return j; };
  let value;
  try {
    const me = await get('me?fields=id,name,instagram_business_account');
    const subs = await get('me/subscribed_apps').catch(() => ({ data: [] }));
    const fields = (subs.data || []).flatMap((a) => a.subscribed_fields || []);
    value = { bot: fields.includes('messages') ? 'ok' : 'brak subskrypcji wiadomości (webhook)', strona: me.name || null, instagram: me.instagram_business_account ? 'połączony' : 'niepołączony' };
  } catch (e) { value = { bot: /token|OAuth|session|expired|validat/i.test(e.message) ? 'zły lub wygasły token strony' : 'błąd Graph API', szczegol: e.message.slice(0, 120) }; }
  statusCache = { at: now, value };
  return value;
}
