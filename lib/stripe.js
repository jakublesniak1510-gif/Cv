// Płatności przez Stripe Checkout (BLIK, karty, Przelewy24, Google Pay, Apple Pay – według metod włączonych w panelu Stripe).
// Bez biblioteki: zwykłe zapytania do API i ręczna weryfikacja podpisu powiadomień (webhook).
import crypto from 'node:crypto';

const key = () => process.env.STRIPE_SECRET_KEY;
export const stripeEnabled = () => !!key();

// Zagnieżdżone pola w formacie Stripe: line_items[0][price_data][currency]=pln.
function form(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    const name = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') form(v, name, out); else out.append(name, String(v));
  }
  return out;
}
async function call(method, path, body, headers = {}) {
  const r = await fetch(`${process.env.STRIPE_API_BASE || 'https://api.stripe.com/v1'}${path}`, { // STRIPE_API_BASE tylko do testów
    method, headers: { Authorization: `Bearer ${key()}`, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}), ...headers },
    body: body ? form(body) : undefined, signal: AbortSignal.timeout(20_000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error?.message || `Stripe ${r.status}`);
  return j;
}

const LOCALE = { pl: 'pl', en: 'en', de: 'de' }; // ukraińskiego Stripe nie ma: wtedy język przeglądarki
export function stripeCheckout({ orderId, amount, name, description, email, lang, returnUrl }) {
  return call('POST', '/checkout/sessions', {
    mode: 'payment', client_reference_id: orderId, customer_email: email, locale: LOCALE[lang] || 'auto',
    line_items: [{ quantity: 1, price_data: { currency: 'pln', unit_amount: amount, product_data: { name, description } } }],
    metadata: { orderId }, payment_intent_data: { metadata: { orderId }, description: `${name} (${orderId})` },
    success_url: returnUrl, cancel_url: returnUrl,
  });
}
export const stripeSession = (id) => call('GET', `/checkout/sessions/${encodeURIComponent(id)}`);
// Zamknięcie niezapłaconej sesji (np. gdy rabat z kodu przeszedł na nowsze zamówienie tej samej osoby).
export const stripeExpire = (id) => call('POST', `/checkout/sessions/${encodeURIComponent(id)}/expire`);

// Zwrot (całość albo część). Klucz idempotencji: ponowione kliknięcie z tą samą kwotą nie zwróci pieniędzy drugi raz.
export function stripeRefund({ paymentIntent, amount, orderId, already = 0 }) {
  return call('POST', '/refunds', { payment_intent: paymentIntent, amount, reason: 'requested_by_customer', metadata: { orderId } },
    { 'Idempotency-Key': `refund-${orderId}-${already}-${amount}` });
}

// Podpis z nagłówka Stripe-Signature: HMAC-SHA256 z "<czas>.<treść>" kluczem STRIPE_WEBHOOK_SECRET, najwyżej 5 minut różnicy.
export function stripeEvent(raw, header) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return null;
  const parts = Object.fromEntries(String(header).split(',').map((p) => p.split('=')).filter((p) => p.length === 2 && p[0] === 't'));
  const sigs = String(header).split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 300) return null;
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex');
  const ok = sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
  if (!ok) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
