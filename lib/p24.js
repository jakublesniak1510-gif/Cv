import crypto from 'node:crypto';

// Przelewy24 (REST API v1): BLIK, karty, szybkie przelewy, Google Pay i Apple Pay. Pieniądze trafiają na rachunek
// bankowy sprzedawcy, a każda transakcja ma w opisie numer zamówienia (sessionId).
// Zmienne: P24_MERCHANT_ID, P24_POS_ID (domyślnie = merchant), P24_API_KEY (klucz do raportów / API), P24_CRC, P24_SANDBOX=1.
const cfg = () => ({
  merchantId: Number(process.env.P24_MERCHANT_ID), posId: Number(process.env.P24_POS_ID || process.env.P24_MERCHANT_ID),
  apiKey: process.env.P24_API_KEY, crc: process.env.P24_CRC,
  base: process.env.P24_BASE_URL || (process.env.P24_SANDBOX === '1' ? 'https://sandbox.przelewy24.pl' : 'https://secure.przelewy24.pl'),
});
export const p24Enabled = () => { const c = cfg(); return !!(c.merchantId && c.apiKey && c.crc); };

// Podpis: SHA-384 z JSON-a w dokładnie tej kolejności pól (bez spacji, bez escapowania „/” i znaków Unicode).
const sign = (obj) => crypto.createHash('sha384').update(JSON.stringify(obj)).digest('hex');

async function call(method, path, body) {
  const c = cfg();
  const r = await fetch(c.base + '/api/v1' + path, {
    method, headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(`${c.posId}:${c.apiKey}`).toString('base64') },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15_000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Przelewy24 ${r.status}: ${j.error || j.message || 'błąd'}`);
  return j.data;
}

// Rejestracja transakcji; zwraca adres strony płatności.
export async function p24Register({ sessionId, amount, description, email, urlReturn, urlStatus, language = 'pl' }) {
  const c = cfg();
  const data = await call('POST', '/transaction/register', {
    merchantId: c.merchantId, posId: c.posId, sessionId, amount, currency: 'PLN', description: description.slice(0, 1024), email,
    country: 'PL', language: language === 'en' || language === 'uk' ? 'en' : 'pl', urlReturn, urlStatus, timeLimit: 30, waitForResult: true,
    sign: sign({ sessionId, merchantId: c.merchantId, amount, currency: 'PLN', crc: c.crc }),
  });
  return { token: data.token, url: `${c.base}/trnRequest/${data.token}` };
}

// Powiadomienie od Przelewy24 (urlStatus): sprawdzamy podpis, potem potwierdzamy transakcję (verify).
export function p24NotificationOk(n) {
  const c = cfg();
  const expected = sign({ merchantId: n.merchantId, posId: n.posId, sessionId: n.sessionId, amount: n.amount, originAmount: n.originAmount, currency: n.currency, orderId: n.orderId, methodId: n.methodId, statement: n.statement, crc: c.crc });
  return typeof n.sign === 'string' && n.sign.length === expected.length && crypto.timingSafeEqual(Buffer.from(n.sign), Buffer.from(expected)) && n.merchantId === c.merchantId;
}
export async function p24Verify({ sessionId, orderId, amount }) {
  const c = cfg();
  const data = await call('PUT', '/transaction/verify', { merchantId: c.merchantId, posId: c.posId, sessionId, amount, currency: 'PLN', orderId, sign: sign({ sessionId, orderId, amount, currency: 'PLN', crc: c.crc }) });
  return data?.status === 'success';
}
// Stan transakcji po powrocie klienta (gdyby powiadomienie jeszcze nie dotarło). status: 0 brak wpłaty, 1 wpłata do potwierdzenia, 2 potwierdzona, 3 zwrot.
export const p24BySession = (sessionId) => call('GET', `/transaction/by/sessionId/${encodeURIComponent(sessionId)}`).catch(() => null);
